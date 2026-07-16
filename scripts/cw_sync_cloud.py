"""
cw_sync_cloud.py  —  GitHub Actions version of cw_auto_sync.py
Config comes from environment variables (GitHub Secrets).
Run locally:  CW_URL=... CW_USERNAME=... CW_PASSWORD=... SUPABASE_KEY=... python scripts/cw_sync_cloud.py
Run in CI:    xvfb-run --auto-servernum python scripts/cw_sync_cloud.py
"""

import sys, os, time, re, glob, json
from datetime import date, datetime
from playwright.sync_api import sync_playwright
import pandas as pd
import requests

# ── CONFIG (from environment variables / GitHub Secrets) ──────────────────────

CW_URL       = os.environ['CW_URL']          # e.g. http://unipharma.thddns.net:8081/WebBack/
CW_USERNAME  = os.environ['CW_USERNAME']
CW_PASSWORD  = os.environ['CW_PASSWORD']
DOWNLOAD_DIR = os.environ.get('DOWNLOAD_DIR', '/tmp/cw_sync')

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://wddepvcmfqykidgbgnut.supabase.co')
SUPABASE_KEY = os.environ['SUPABASE_KEY']
TABLE        = 'cwpharma_stock_test'

SALE_FROM        = f"01/01/{date.today().year}"
SALE_TO          = date.today().strftime("%d/%m/%Y")
EXPORT_BTN       = '#ctl00_MainContent_ReportViewer1_ctl05_ctl04_ctl00_ButtonLink'
STOCK_PARTS      = 2
SALE_MAX_PARTS   = 15

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


# ── STEP 1: LOGIN ─────────────────────────────────────────────────────────────

def login(page):
    print("[1] Logging in...")
    page.goto(CW_URL.rstrip('/WebBack/').rstrip('/WebBack') + '/', timeout=30000)
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    page.fill("#cTxUserName", CW_USERNAME)
    page.fill("#cTxPassword", CW_PASSWORD)
    page.click("#cBtnLogin")
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    print(f"    URL: {page.url}")


# ── STEP 2: DOWNLOAD BRNSTOCK ─────────────────────────────────────────────────

def _find_ssrs_frame(page):
    for f in page.frames:
        if 'Rep_Brn' in f.url:
            return f
    for f in page.frames:
        try:
            href = f.evaluate('window.location.href')
            if 'Rep_Brn' in href:
                return f
        except Exception:
            pass
    return None


def _wait_for_ssrs_frame(page, timeout=90):
    for _ in range(timeout // 5):
        time.sleep(5)
        f = _find_ssrs_frame(page)
        if f:
            try:
                if f.evaluate(f"!!document.querySelector('{EXPORT_BTN}')"):
                    return f
            except Exception:
                pass
    return None


def _download_ssrs_excel(page, label):
    print(f"    Waiting for SSRS (max 90s)...")
    frame = _wait_for_ssrs_frame(page, timeout=90)
    if not frame:
        print("    ERROR: SSRS frame not found after 90s")
        return None

    frame.evaluate(f"document.querySelector('{EXPORT_BTN}').click()")
    time.sleep(1)

    out = os.path.join(DOWNLOAD_DIR, f"{label}.xlsx")
    try:
        with page.expect_download(timeout=60000) as dl_info:
            frame.evaluate('''() => {
                const a = Array.from(document.querySelectorAll("a"))
                              .find(l => l.innerText && l.innerText.trim() === "Excel");
                if (a) a.click();
            }''')
        dl = dl_info.value
        dl.save_as(out)
        print(f"    Saved: {label}.xlsx  ({os.path.getsize(out):,} bytes)")
        return out
    except Exception as e:
        print(f"    Download error: {e}")
        return None


def _download_brnstock_part(page, part_idx):
    print(f"\n  Part {part_idx + 1}:")
    page.goto(CW_URL + "Report/BrnStock/BrnStock_Man.aspx", timeout=60000)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    try:
        page.wait_for_selector('#MainContent_Button3', state='visible', timeout=60000)
    except Exception:
        page.screenshot(path=os.path.join(DOWNLOAD_DIR, f'brnstock_part{part_idx+1}_debug.png'))
        print(f"    ERROR: #MainContent_Button3 not visible after 60s – debug screenshot saved")
        return None

    page.click('#MainContent_Button3')
    time.sleep(5)

    rep_frame = next((f for f in page.frames if 'BrnStock_Rep' in f.url), None)
    if not rep_frame:
        print("    ERROR: BrnStock_Rep iframe not found")
        return None

    btn_id = f'#MainContent_cDlPager_cBtnRepData_{part_idx}'
    if not rep_frame.evaluate(f"!!document.querySelector('{btn_id}')"):
        print(f"    Button {btn_id} not found – no more parts")
        return None

    rep_frame.evaluate(f"document.querySelector('{btn_id}').click()")
    return _download_ssrs_excel(page, f"stock_part{part_idx + 1}")


def download_brnstock(page):
    print("\n[2] Downloading BrnStock...")
    files = []
    for i in range(STOCK_PARTS):
        f = _download_brnstock_part(page, i)
        if f:
            files.append(f)
        else:
            break
    print(f"    BrnStock done: {len(files)} file(s)")
    return files


# ── STEP 3: DOWNLOAD BRNSALE ──────────────────────────────────────────────────

THAI_MONTHS = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
]


def _pick_calendar_date(page, cal_icon_sel, target_date_str):
    d, m, y = int(target_date_str[:2]), int(target_date_str[3:5]), int(target_date_str[6:])
    page.click(cal_icon_sel)
    time.sleep(1)

    for _ in range(24):
        cal = next((f for f in page.frames if 'Popup_Calendar' in f.url), None)
        if not cal:
            break

        header = cal.evaluate(
            "Array.from(document.querySelectorAll('td,th'))"
            ".map(e=>e.innerText.trim()).find(t => /\\d{4}/.test(t)) || ''"
        )
        yr_match = re.search(r'\d{4}', header)
        if not yr_match:
            break
        shown_year  = int(yr_match.group())
        shown_month = next((i + 1 for i, mn in enumerate(THAI_MONTHS) if mn in header), 0)

        if shown_year == y and shown_month == m:
            cal.evaluate(
                f"""() => {{
                    const a = Array.from(document.querySelectorAll('a'))
                              .find(l => l.innerText.trim() === '{d}');
                    if (a) a.click();
                }}"""
            )
            time.sleep(1)
            return

        diff    = (y - shown_year) * 12 + (m - shown_month)
        nav_idx = 1 if diff > 0 else 0
        nav_clicked = cal.evaluate(
            f"""() => {{
                const links = Array.from(document.querySelectorAll('a'))
                              .filter(l => l.href && l.href.includes('doPostBack')
                                        && !l.innerText.match(/\\d/));
                if (links.length > {nav_idx}) {{ links[{nav_idx}].click(); return true; }}
                return false;
            }}"""
        )
        if not nav_clicked:
            break
        time.sleep(1)


def _setup_brnsale_page(page):
    page.goto(CW_URL + "Report/BrnSale/BrnSale_Man.aspx", timeout=30000)
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    page.fill('#MainContent_DateRange_Com_cTxDateFrom', SALE_FROM)
    _pick_calendar_date(page, '#MainContent_DateRange_Com_cImbDateTo', SALE_TO)
    page.evaluate("document.querySelector('#MainContent_cRdShowDetType_Ps_0').click()")
    page.evaluate(
        "if(!document.querySelector('#MainContent_cChkIsShowDet_Ps').checked)"
        " document.querySelector('#MainContent_cChkIsShowDet_Ps').click()"
    )
    page.click('#MainContent_Button3')
    time.sleep(5)
    return next((f for f in page.frames if 'BrnSale_Rep' in f.url), None)


def _download_brnsale_part(page, part_idx):
    print(f"\n  Sale part {part_idx + 1}:")
    sale_rep = _setup_brnsale_page(page)
    if not sale_rep:
        print("    ERROR: BrnSale_Rep iframe not found")
        return None

    btn_id = f'#MainContent_cDlPager_cBtnRepData_IsReadPage_{part_idx}'
    if not sale_rep.evaluate(f"!!document.querySelector('{btn_id}')"):
        print(f"    Button {btn_id} not found – no more parts")
        return None

    sale_rep.evaluate(f"document.querySelector('{btn_id}').click()")
    return _download_ssrs_excel(page, f"sale_part{part_idx + 1}")


def download_brnsale(page):
    print(f"\n[3] Downloading BrnSale ({SALE_FROM} – {SALE_TO})...")
    files = []
    for i in range(SALE_MAX_PARTS):
        f = _download_brnsale_part(page, i)
        if f:
            files.append(f)
        else:
            break
    print(f"    BrnSale done: {len(files)} file(s)")
    return files


# ── STEP 4: PARSE EXCEL ───────────────────────────────────────────────────────

def parse_stock(files):
    products = {}
    for path in files:
        df = pd.read_excel(path, header=None, dtype=str)
        current = None
        for _, row in df.iterrows():
            seq, prod, branch, unit, stock = row[0], row[1], row[2], row[6], row[7]
            if (pd.notna(seq) and str(seq).strip().isdigit()
                    and pd.notna(prod) and 'P-' in str(prod)):
                raw = str(prod).strip()
                code, name = raw.split(':', 1) if ':' in raw else (raw, raw)
                current = code.strip()
                if current not in products:
                    products[current] = {
                        'code': current, 'name': name.strip(),
                        'unit': str(unit).strip() if pd.notna(unit) else '',
                        'stock_total': int(float(stock)) if pd.notna(stock) and str(stock) != 'nan' else 0,
                        'stock_00': 0, 'stock_01': 0, 'stock_02': 0,
                        'cost_00': 0.0, 'cost_01': 0.0, 'cost_02': 0.0,
                        'sell_00': 0.0, 'sell_01': 0.0, 'sell_02': 0.0,
                        'qty_sold': 0,
                    }
            elif current and pd.notna(branch):
                b     = str(branch).strip()
                bcode = b[:2] if len(b) >= 2 else ''
                s     = int(float(stock)) if pd.notna(stock) and str(stock) != 'nan' else 0
                if   bcode == '00': products[current]['stock_00'] = s
                elif bcode == '01': products[current]['stock_01'] = s
                elif bcode == '02': products[current]['stock_02'] = s
    print(f'[Stock] {len(products)} products from {len(files)} file(s)')
    return products


def parse_sales(files, products):
    sale_data = {}
    for path in files:
        try:
            df = pd.read_excel(path, header=None, dtype=str)
        except Exception as e:
            print(f'  Skip {os.path.basename(path)}: {e}')
            continue
        current = None
        for _, row in df.iterrows():
            seq, col1 = row[0], row[1]
            qty, cost, sell = row[7], row[8], row[10]
            if (pd.notna(seq) and str(seq).strip().isdigit()
                    and pd.notna(col1) and 'P-' in str(col1)):
                code    = str(col1).strip().split(':', 1)[0].strip()
                current = code
                if code not in sale_data:
                    sale_data[code] = {
                        'qty_sold': 0,
                        'branch': {b: {'qty': 0, 'cost': 0.0, 'sell': 0.0}
                                   for b in ('00', '01', '02')},
                    }
                q = int(float(qty)) if pd.notna(qty) and str(qty) != 'nan' else 0
                sale_data[code]['qty_sold'] += q
            elif current and pd.notna(col1):
                b     = str(col1).strip()
                bcode = b[:2] if len(b) >= 2 and (len(b) < 3 or b[2] == ':') else ''
                if bcode in ('00', '01', '02'):
                    q = int(float(qty))  if pd.notna(qty)  and str(qty)  != 'nan' else 0
                    c = float(cost)      if pd.notna(cost) and str(cost) != 'nan' else 0.0
                    s = float(sell)      if pd.notna(sell) and str(sell) != 'nan' else 0.0
                    sale_data[current]['branch'][bcode]['qty']  += q
                    sale_data[current]['branch'][bcode]['cost'] += c
                    sale_data[current]['branch'][bcode]['sell'] += s

    matched = 0
    for code, sd in sale_data.items():
        if code in products:
            products[code]['qty_sold'] = sd['qty_sold']
            for bcode in ('00', '01', '02'):
                bd = sd['branch'][bcode]
                if bd['qty'] > 0:
                    products[code][f'cost_{bcode}'] = round(bd['cost'] / bd['qty'], 4)
                    products[code][f'sell_{bcode}'] = round(bd['sell'] / bd['qty'], 4)
            matched += 1
    print(f'[Sales] {matched} products matched from {len(files)} file(s)')
    return products


# ── STEP 5: SYNC TO SUPABASE ──────────────────────────────────────────────────

def upload_to_supabase(products, batch=500):
    rows = list(products.values())
    now  = datetime.utcnow().isoformat()
    for r in rows:
        r['synced_at'] = now
    headers = {
        'apikey':        SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates',
    }
    url   = f'{SUPABASE_URL}/rest/v1/{TABLE}'
    total, ok = len(rows), 0
    for i in range(0, total, batch):
        chunk = rows[i:i + batch]
        res   = requests.post(url, headers=headers, data=json.dumps(chunk))
        if res.status_code in (200, 201):
            ok += len(chunk)
            print(f'  Uploaded {ok}/{total}...')
        else:
            print(f'  ERROR batch {i}: {res.status_code} {res.text[:200]}')
    print(f'[Upload] {ok}/{total} rows synced to {TABLE}')


def sync_supabase():
    print("\n[4] Parsing Excel files...")
    stock_files = sorted(glob.glob(os.path.join(DOWNLOAD_DIR, 'stock_part*.xlsx')))
    sale_files  = sorted(glob.glob(os.path.join(DOWNLOAD_DIR, 'sale_part*.xlsx')))

    print(f'  Stock files : {[os.path.basename(f) for f in stock_files]}')
    print(f'  Sale files  : {[os.path.basename(f) for f in sale_files]}')

    if not stock_files:
        print('  No stock files found in', DOWNLOAD_DIR)
        return

    products = parse_stock(stock_files)
    if sale_files:
        products = parse_sales(sale_files, products)
    else:
        print('[Sales] No sale files – skipping')

    has_stock = sum(1 for p in products.values() if p['stock_total'] > 0)
    has_price = sum(1 for p in products.values() if p['sell_00'] > 0 or p['sell_01'] > 0)
    print(f'  Total: {len(products)} | has stock: {has_stock} | has price: {has_price}')

    print("\n[5] Uploading to Supabase...")
    upload_to_supabase(products)


# ── MAIN ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== CW Pharma Auto Sync (Cloud) ===")
    print(f"Download folder : {DOWNLOAD_DIR}")
    print(f"Date range      : {SALE_FROM} – {SALE_TO}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            slow_mo=200,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        )
        ctx  = browser.new_context(accept_downloads=True)
        page = ctx.new_page()

        try:
            login(page)
            stock_files = download_brnstock(page)
            sale_files  = download_brnsale(page)

            print(f"\nStock files : {[os.path.basename(f) for f in stock_files]}")
            print(f"Sale files  : {[os.path.basename(f) for f in sale_files]}")

            sync_supabase()

        except Exception as e:
            import traceback
            print(f"\nERROR: {e}")
            traceback.print_exc()
            try:
                page.screenshot(path=os.path.join(DOWNLOAD_DIR, "error_screenshot.png"))
                print(f"Screenshot saved to {DOWNLOAD_DIR}/error_screenshot.png")
            except Exception:
                pass
            sys.exit(1)  # fail the GitHub Actions run so the error is visible

        finally:
            time.sleep(3)
            browser.close()

    print("\n=== Done ===")
