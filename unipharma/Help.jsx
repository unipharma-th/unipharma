// Help.jsx — Dynamic User Guide (Update-friendly structure)
const { useState } = React;

function HelpPage({ lang, L, perm = { role: 'admin' } }) {
  const [section, setSection] = useState('overview');
  const isAdmin = perm.role === 'admin';

  // 🎯 EDIT HERE: Add/remove sections. adminOnly tabs show only to Admin (when Login is on).
  const ALL_SECTIONS = [
    { id:'overview',  icon:'📋', th:'ภาพรวมระบบ',         en:'System Overview' },
    { id:'pages',     icon:'🖥',  th:'วิธีใช้แต่ละหน้า',    en:'How to Use Each Page' },
    { id:'roles',     icon:'🔐', th:'สิทธิ์การเข้าถึง',     en:'Roles & Permissions' },
    { id:'data',      icon:'📦', th:'ข้อมูลที่ต้องเตรียม',   en:'Required Data',  adminOnly:true },
    { id:'sync',      icon:'🔄', th:'ซิงค์ข้อมูล',          en:'Data Sync',       adminOnly:true },
    { id:'nextsteps', icon:'🚀', th:'ขั้นตอนถัดไป',         en:'Next Steps',      adminOnly:true },
  ];
  const SECTIONS = ALL_SECTIONS.filter(s => !s.adminOnly || isAdmin);
  // If the saved section is admin-only and the user isn't admin, fall back to overview.
  const sec = SECTIONS.some(s => s.id === section) ? section : 'overview';

  // 🎯 EDIT HERE: Add new pages to the guide
  const PAGES = [
    { icon:'▦', th:'ภาพรวม', en:'Dashboard', color:'var(--acc)',
      steps_th:['ดูยอดสั่งซื้อประจำเดือน, จำนวน PO รอ, สินค้าใกล้หมด','ดูกราฟยอดสั่งซื้อแยกสาขา และสัดส่วนตามหมวดหมู่','คลิก Card เพื่อไปหน้าอื่น หรือสร้าง PO ใหม่'],
      steps_en:['View monthly spend, pending POs, low stock alerts','See branch spending & category breakdown','Click cards to navigate or create new PO'] },
    { icon:'💊', th:'ฐานข้อมูลยา', en:'Drug Database', color:'var(--ok)',
      steps_th:['ค้นหาด้วยรหัส/ชื่อยา กรองตามหมวดหมู่/VAT/สาขา (เลือกสาขา → เห็นเฉพาะยาที่มีสต็อกในสาขานั้น)','ดูรายละเอียด: ต้นทุน รวม VAT (ด้านบน) / ไม่รวม VAT (รองลงมา), กำไร%, หน่วยบรรจุ, สต็อก','เพิ่มยาใหม่ หรือแก้ไข (กำไรแก้ได้→ราคาขายอัปเดต)','📦 Packaging ON เพื่อดูหน่วยบรรจุแบบเต็ม; หน่วยบรรจุแก้ไขได้ใน Edit form','🏷️ ปุ่ม "จัดการหมวดหมู่": เพิ่ม/แก้ไข/ลบ หมวดหลัก + หมวดย่อย (2 ภาษา) บันทึกแล้วแชร์ขึ้นคลาวด์','📝 หมายเหตุสินค้า: เลือกสาเหตุจาก Dropdown (8 ตัวเลือก เช่น สั่งเมื่อมีคำสั่งซื้อ / ความต้องการต่ำ / ราคาสูง ฯลฯ) + หมายเหตุเพิ่มเติม — แสดงเป็น badge สีเหลืองใต้ชื่อยาในรายการ','🏪 คอลัมน์ Stock CW แสดงสต็อกจาก CW Pharma แยก 3 สาขา (PTN/RAM/CNX) — สีเขียว>10, เหลือง>0, แดง=หมด; คลิกขยายดูต้นทุน/ราคาขายต่อสาขา','📤 Admin/Manager: กดปุ่ม Export Excel เพื่อดาวน์โหลดข้อมูลยาทั้งหมด'],
      steps_en:['Search by code/name; filter by category/VAT/branch (pick a branch → only drugs stocked there)','View full details: cost incl. VAT (top) / excl. VAT (below), profit%, packaging, stock','Add new or edit drugs (profit editable → auto-update sell price)','Toggle Packaging ON to see packaging hierarchy; edit packaging units in Edit form','🏷️ "Categories" button: add/edit/delete main & sub-categories (bilingual), saved & shared to the cloud','📝 Product Remarks: select reason from dropdown (8 options e.g. On Demand / Low Demand / High Value / Short Shelf Life etc.) + free-text note — shows as amber badge under drug name in the list','🏪 Stock CW column shows live CW Pharma stock per branch (PTN/RAM/CNX) — green>10, yellow>0, red=out; expand row to see cost/sell per branch','📤 Admin/Manager: tap Export Excel to download the full drug database as an Excel file'] },
    { icon:'📋', th:'การสั่งซื้อ', en:'Purchase Orders', color:'var(--info)',
      steps_th:['ดูรายการ PO ทั้งหมด กรองตามสาขา/สถานะ/เดือน','เปลี่ยนสถานะ: ส่ง → อนุมัติ → ยืนยันรับ','ดูเอกสาร A4 (ชื่อ Supplier & จำนวนเงินแปลเป็นคำ)', 'สร้าง PO ใหม่: เลือกสาขา+Supplier → เลือกสินค้า → เลือกผู้แทน → ดึงราคา','👤 ผู้แทน: ถ้า Supplier มีผู้แทน จะมีหน้าจอให้เลือก; ถ้ามีคนเดียวเลือกอัตโนมัติ — ชื่อ/Brand แสดงในเอกสาร PO','🤖 แนะนำผู้แทนอัตโนมัติ: ระบบนับว่าผู้แทนแต่ละคนดูแลสินค้ากี่รายการที่อยู่ใน PO — แนะนำผู้แทนที่ตรงที่สุด พร้อมแสดง "✓ ดูแล N รายการในใบสั่งนี้" ใต้การ์ด','⚠️ แจ้งเตือนราคา: ระบบเปรียบเทียบราคาที่กรอกกับประวัติ 90 วัน — เหลือง=สูงกว่าราคาดีที่สุด, เขียว=ต่ำกว่าค่าเฉลี่ย (ช่วยประหยัดงบ)','สถานที่จัดส่ง: เลือกสาขาจาก Dropdown → ที่อยู่เติมอัตโนมัติ (แก้ไขได้) พร้อมเวลาเปิด+เบอร์โทร','🎁 เลือกดีล Supplier: ระบุ ซื้อ/แถม/ของแถม/ส่วนลด% — ใช้ข้อมูลล่าสุดเสมอ','🏪 แถบ CW ใต้รายการยา: สต็อก 3 สาขาจาก CW + เปรียบเทียบราคา PO vs ต้นทุน CW','📤 Admin/Manager: Export Excel เพื่อดาวน์โหลดรายการ PO ทั้งหมด'],
      steps_en:['View all POs, filter by branch/status/month','Change status: submit → approve → confirm','View A4 document (supplier name & amount in words translated)','Create PO: select branch + supplier → add items → choose rep → finalise','👤 Rep selector: if the supplier has reps, a grid appears to choose one; auto-selected if only one — name/Brand printed on PO document','🤖 Auto-suggest rep: system counts how many drugs each rep manages that are already in the PO — suggests the best match and shows "✓ Manages N items in this PO" under their card','⚠️ Price alert: price field shows yellow if above 90-day best price, green if below average — helps avoid overpaying','Delivery: pick a branch from the dropdown → address auto-fills (editable) with open hours + phone','🎁 Supplier deal: specify Buy qty / Free qty / Bonus / Discount% — always uses latest data','🏪 CW strip below each item: stock per branch from CW Pharma + PO price vs CW cost comparison','📤 Admin/Manager: Export Excel to download all purchase order records'] },
    { icon:'🏭', th:'ผู้จัดจำหน่าย', en:'Suppliers', color:'var(--warn)',
      steps_th:['ดูการ์ด Supplier พร้อมยอดซื้อ คะแนน และจำนวนดีล','คลิกการ์ดเพื่อดูรายการยา ประวัติ PO ดีล และผู้แทน','แก้ไขข้อมูล (ชื่อ/ติดต่อ/เครดิต/นโยบายคืนสินค้า) หรือเพิ่มผู้จัดจำหน่ายใหม่','👤 ผู้แทน/Brand: เพิ่มผู้แทนขายในแท็บ "ผู้แทน" (ชื่อ / Brand ไทย-อังกฤษ / เบอร์โทร) — ใช้เลือกตอนสร้าง PO; ถ้ามีผู้แทนคนเดียวจะเลือกให้อัตโนมัติ','📦 สินค้าที่ผู้แทนดูแล: ขยายการ์ดผู้แทนแล้วกด "📦 สินค้าที่ดูแล" — พิมพ์รหัสยาแล้ว Enter เพื่อเพิ่ม, กด ✕ เพื่อลบ; ใช้ข้อมูลนี้แนะนำผู้แทนอัตโนมัติตอนสร้าง PO','🎁 ดีล (Multi-tier): เพิ่มดีลหลายระดับในแท็บ "ดีล" — ระบุ ซื้อจำนวน / แถมจำนวน / ของแถม / ส่วนลด% / หมายเหตุดีล; ใช้ตอนสร้าง PO ได้ทันที','📤 Admin/Manager: Export Excel เพื่อดาวน์โหลดรายการผู้จัดจำหน่าย'],
      steps_en:['View supplier cards with spend, rating, and deal count','Click card to see drug list, PO history, deals, and reps','Edit info (name/contact/credit/return policy) or add a new supplier','👤 Sales Reps/Brand: add reps in the "Reps" tab (name / Brand TH-EN / phone) — selectable when creating PO; auto-selected if only one rep','📦 Rep drug assignment: expand a rep card and tap "📦 Products Managed" — type a drug code and press Enter to add, ✕ to remove; this data drives the auto-suggest when creating a PO','🎁 Deals (multi-tier): add multiple deal tiers in the "Deals" tab — set Buy qty / Free qty / Bonus Items / Discount % / Deal Note; available immediately when creating a PO','📤 Admin/Manager: Export Excel to download the full supplier list'] },
    { icon:'⚖', th:'เปรียบเทียบราคา', en:'Price Comparison', color:'var(--err)',
      steps_th:['ค้นหายาด้วยชื่อ/รหัส หรือคลิก Quick Search (ยาที่สั่งบ่อย) ด้านล่าง','ดูตารางราคาทุก Supplier เรียงจากถูกสุด — คอลัมน์ \"vs ถูกสุด\" แสดงส่วนต่าง','ระบบแนะนำ Supplier ที่คุ้มค่าที่สุด พร้อมราคาต้นทุนและกำไร%','ใช้เปรียบเทียบก่อนสร้าง PO เพื่อเลือกซื้อจากเจ้าที่ถูกที่สุด'],
      steps_en:['Search by name/code or click Quick Search (frequent drugs) below','See all supplier prices sorted by cheapest — \"vs Cheapest\" column shows difference','System recommends best-value supplier with cost & profit%','Use before creating PO to pick the cheapest source'] },
    { icon:'📦', th:'ติดตามสินค้า', en:'Stock Tracking', color:'#e5312a',
      steps_th:['ดูสต็อกแยกสาขา (PTN/RAM/CNX) พร้อมแถบสี — แดง=ต่ำกว่า min, เหลือง=ใกล้หมด, เขียว=ปกติ','กรองดู \"ใกล้หมด\" หรือคลิกการ์ดสรุปด้านบนเพื่อกรองตามสถานะ','สต็อกอัปเดตจากระบบขายหน้าร้าน (CW Pharma) ผ่าน auto-sync ทุกคืน 02:00 น. อัตโนมัติ','ดูสต็อก CW แบบเรียลไทม์ในหน้า Drug Database → คอลัมน์ Stock CW (สีเขียว/เหลือง/แดง)','ยอดรวมมูลค่าสต็อกแสดงด้านบน แยกตามสาขา'],
      steps_en:['View stock per branch (PTN/RAM/CNX) with colour bars — red=below min, yellow=low, green=ok','Filter by status or click summary cards at the top','Stock synced nightly at 02:00 from POS (CW Pharma) via GitHub Actions — no manual update needed','Live CW stock also visible in Drug Database → Stock CW column (green/yellow/red pills)','Total stock value shown per branch at the top'] },
    { icon:'📸', th:'สินค้าหมด', en:'Out of Stock', color:'#d97706',
      steps_th:['แท็บ \"แจ้งสินค้าหมด\" (ทุก Role): เลือกยาจาก dropdown (พิมพ์ค้นหาได้) ระบุจำนวนคงเหลือ แนบรูป + หมายเหตุ แล้วกดบันทึก','ข้อมูลแชร์ขึ้นคลาวด์ — ทุกคนเห็นแบบเรียลไทม์; หน้าอัปเดตอัตโนมัติทุก 60 วินาที หรือกดปุ่ม 🔄 รีเฟรชด้วยตนเอง','แท็บ \"รายการ/จัดการ\" (ทุก Role ดูได้, Admin/Manager แก้ไขได้): สรุปนับ 5 สถานะ — คลิกการ์ดเพื่อกรองรายการ','Admin/Manager (ฝ่ายจัดซื้อ) กด \"จัดการ\" เพื่อใส่: สถานะ / ETA / วันที่ผู้จัดจำหน่ายแจ้ง / หมายเหตุ / สินค้าทดแทน — Viewer ดูข้อมูลเหล่านี้ได้','แท็บ \"สถิติ/ประวัติ\" (ทุก Role): ดูรายการย้อนหลังแยกตามสัปดาห์ พร้อมสรุปสถานะ','📤 Admin/Manager: Export Excel เพื่อดาวน์โหลดรายการสินค้าหมดทั้งหมด','⚠️ ต้องรัน SQL migration ครั้งเดียว: DataSync → SQL Sync → Snippets → อัปเกรดตาราง out_of_stock'],
      steps_en:['\"Report\" tab (all roles): select drug from searchable dropdown, enter remaining qty, attach photo + notes, then save','Syncs to cloud — everyone sees updates live; page auto-refreshes every 60 seconds, or tap 🔄 to refresh manually','\"List/Manage\" tab (all roles view; Admin/Manager edit): 5-status summary cards, click to filter list','Admin/Manager tap \"Manage\" to fill: Status / ETA / Supplier notify date / Notes / Replacement — Viewer can see all this','\"Statistics\" tab (all roles): view history grouped by week with status summaries','📤 Admin/Manager: Export Excel to download all out-of-stock records','⚠️ Run SQL migration once: DataSync → SQL Sync → Snippets → Upgrade out_of_stock table'] },
    { icon:'📊', th:'รายงาน', en:'Reports', color:'var(--acc)',
      steps_th:['เลือกเดือน + สาขา ด้วย filter ด้านบน (ดูรวมทุกสาขาหรือแยกสาขาได้)','กราฟแนวโน้มยอดซื้อ: เปรียบเทียบเดือนต่อเดือน แยกสาขา + แยกหมวดหมู่','แท็บ Top 10: ยาที่สั่งซื้อสูงสุด 10 อันดับ','แท็บ ยาที่ไม่ได้สั่ง: ตรวจสอบยาที่ขาดการสั่ง (ช่วยวางแผนสต็อก)','แท็บ Supplier Analysis: ยอดซื้อแยกตาม Supplier + เปรียบเทียบราคา'],
      steps_en:['Select month + branch with top filters (view all branches or per branch)','Trend chart: month-over-month spend by branch + by category','Top 10 tab: most-ordered drugs this period','Rarely Ordered tab: drugs not recently purchased (helps stock planning)','Supplier Analysis tab: spend per supplier + price comparison'] },
    { icon:'🔄', th:'ซิงค์ข้อมูล', en:'Data Sync', color:'var(--info)',
      steps_th:['Admin เท่านั้น — นำเข้ายา/ผู้จัดจำหน่าย/ออเดอร์ ผ่าน Excel หรือ Google Sheets','จับคู่คอลัมน์อัตโนมัติ → Preview → Import (Merge กับข้อมูลเดิม ไม่ลบทับ)','ดาวน์โหลด Template ยา: มี 19 คอลัมน์รวม remark (Dropdown 8 ตัวเลือก) + remarkNote; Template Supplier: 15 คอลัมน์รวม returnPolicy (TH/EN)','SQL Sync: รัน SQL snippets เพื่ออัปเกรดตาราง (ทำครั้งแรกครั้งเดียว)','Startup Query: SQL ที่รันอัตโนมัติทุกครั้งที่เปิดแอป (warehouse sync)','ประวัติการ sync แสดงด้านล่าง — บันทึกวันเวลาและจำนวนรายการที่นำเข้า','CW Pharma Sync: อัปเดตสต็อกอัตโนมัติทุกวัน 10:00 + 18:00 ผ่าน GitHub Actions (กด Trigger CW Sync เพื่อ sync ทันที)'],
      steps_en:['Admin only — import drugs/suppliers/orders via Excel or Google Sheets','Auto-map columns → preview → import (merges, never overwrites existing data)','Drug Template: 19 columns incl. remark (dropdown 8 codes) + remarkNote; Supplier Template: 15 columns incl. returnPolicy (TH/EN)','SQL Sync: run SQL snippets to upgrade tables (one-time setup)','Startup Query: SQL that runs automatically every time the app opens','Import history shown below — logs date, time, and record counts','CW Pharma Sync: auto-updates stock daily at 10:00 + 18:00 via GitHub Actions (tap Trigger CW Sync to sync immediately)'] },
  ];

  // 🎯 EDIT HERE: Update data requirements
  const REQUIRED_DATA = [
    { th:'💊 ฐานข้อมูลยา', en:'💊 Drug Database',
      current_th:'10,263 รายการ ✓', current_en:'10,263 items ✓',
      needed_th:'10,263 รายการ (นำเข้าแล้ว)', needed_en:'10,263 items (imported)',
      fields:[['รหัสสินค้า','Code'],['ชื่อไทย','Name TH'],['ชื่ออังกฤษ','Name EN'],['หน่วย','Unit'],['หมวดหมู่','Category'],['หมวดย่อย','Sub-category (ใหม่)'],['VAT','Has VAT'],['ต้นทุน','Cost'],['ราคาขาย','Sell'],['สต็อก PTN/RAM/CNX','Stock'],['สต็อกขั้นต่ำ','Min Stock'],['ผู้จัดจำหน่าย','Supplier'],['หน่วยบรรจุ','Packaging']] },
    { th:'🏭 ผู้จัดจำหน่าย', en:'🏭 Suppliers',
      current_th:'10 ราย', current_en:'10',
      needed_th:'410 ราย', needed_en:'410',
      fields:[['รหัส','ID'],['ชื่อไทย','Name TH'],['ชื่ออังกฤษ','Name EN'],['ติดต่อ','Contact'],['โทร','Phone'],['เครดิต','Credit Days'],['ส่งภายใน','Delivery Days'],['ยาที่จำหน่าย','Drugs (ใหม่)'],['ราคาต้นทุน','Cost Price (ใหม่)'],['โปรโมชั่น','Promotions (ใหม่)']] },
    { th:'📦 สต็อกเริ่มต้น', en:'📦 Initial Stock',
      current_th:'ตัวอย่าง', current_en:'Sample',
      needed_th:'สต็อกจริงทั้ง 3 สาขา', needed_en:'Real stock all 3 branches',
      fields:[['วันที่','Date'],['สาขา','Branch'],['รหัสยา','Drug Code'],['จำนวน','Quantity']] },
  ];

  // 🎯 EDIT HERE: Update next steps
  const NEXT_STEPS = [
    { priority:'🟢', icon:'💊', th:'นำเข้าฐานข้อมูลยา 10,263 รายการ (เสร็จแล้ว ✓)', en:'Import drugs — done ✓ (10,263 items)' },
    { priority:'🔴', icon:'🏭', th:'นำเข้าผู้จัดจำหน่าย 410 ราย + ราคา + ยา', en:'Import 410 suppliers + pricing' },
    { priority:'🟡', icon:'📦', th:'บันทึกสต็อกจริงทั้ง 3 สาขา', en:'Record real stock all branches' },
    { priority:'🟡', icon:'🎁', th:'ตั้งค่าโปรโมชั่น Supplier', en:'Set up supplier promotions' },
    { priority:'🟢', icon:'☁', th:'ฐานข้อมูลคลาวด์ Supabase (เชื่อมแล้ว ✓)', en:'Supabase cloud database (connected ✓)' },
    { priority:'🟢', icon:'🔐', th:'เปิดใช้ระบบ Login + สิทธิ์ (พร้อมแล้ว เปิดเมื่อต้องการ)', en:'Enable Login + roles (ready to turn on)' },
  ];

  const Card = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid var(--acc)` }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--acc)', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );

  const Step = ({ n, th, en }) => (
    <div style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--acc)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>{n}</div>
      <div style={{ fontSize:13, color:'var(--txt)', paddingTop:4 }}>{lang==='th' ? th : en}</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">📖 {L('คู่มือการใช้งาน', 'User Guide')}</div>
          <div className="page-subtitle">UNIPHARMA Purchasing Management — {L('ปรับปรุงล่าสุด:', 'Last updated:')} Jul 2026</div>
        </div>
      </div>

      <div className="tabs" style={{marginBottom:20}}>
        {SECTIONS.map(s => (
          <button key={s.id} className={`tab-btn${sec===s.id?' active':''}`} onClick={()=>setSection(s.id)}>
            {s.icon} {lang==='th'?s.th:s.en}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {sec==='overview' && (
        <div>
          <Card title={L('ระบบนี้ใช้ได้เลยตอนนี้ — ข้อมูลตัวอย่างพร้อม', 'This system is ready to use now — sample data included')}>
            <div style={{fontSize:13,color:'var(--txt3)',lineHeight:1.8,marginBottom:12}}>
              {L('ใช้ได้เลย: สร้าง PO, ดูรายงาน, เปรียบเทียบราคา, ระบบ 2 ภาษา + Dark mode',
                'Ready now: Create POs, view reports, compare prices, bilingual + dark mode')}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
              {[
                {icon:'✅',th:'พร้อมใช้งานทันที',en:'Ready to use'},
                {icon:'💊',th:'ข้อมูลยาจริง 10,263 รายการ',en:'10,263 real drugs'},
                {icon:'🏭',th:'10 ผู้จัดจำหน่าย',en:'10 suppliers'},
                {icon:'🇹🇭/🇺🇸',th:'2 ภาษา (ไทย/อังกฤษ)',en:'2 languages'},
                {icon:'🌓',th:'โหมดมืด/สว่าง',en:'Dark/Light'},
                {icon:'☁',th:'ซิงค์บนคลาวด์ (Supabase)',en:'Cloud sync (Supabase)'},
                {icon:'⚡',th:'อัปเดตสด เรียลไทม์',en:'Live realtime updates'},
                {icon:'📸',th:'แจ้งสินค้าหมด (แชร์ทุกคน)',en:'Out-of-stock reports (shared)'},
                {icon:'🏪',th:'สต็อก/ราคา CW Pharma สด',en:'Live CW Pharma stock & price'},
                {icon:'👤',th:'ผู้แทน/Brand ต่อ Supplier',en:'Sales Rep/Brand per Supplier'},
                {icon:'📦',th:'กำหนดสินค้าต่อผู้แทน',en:'Drug assignment per Rep'},
                {icon:'🤖',th:'แนะนำผู้แทนอัตโนมัติ (ตาม PO)',en:'Auto-suggest Rep (by PO items)'},
                {icon:'🎁',th:'ดีลหลายระดับต่อ Supplier',en:'Multi-tier Deals per Supplier'},
                {icon:'📝',th:'หมายเหตุสินค้า (8 ตัวเลือก)',en:'Product Remarks (8 presets)'},
                {icon:'📤',th:'Export Excel (ทุกหน้า)',en:'Export Excel (all pages)'},
              ].map((item,i)=>(
                <div key={i} style={{background:'var(--bg3)',borderRadius:8,padding:12}}>
                  <div style={{fontSize:20,marginBottom:4}}>{item.icon}</div>
                  <div style={{fontSize:12,color:'var(--txt)'}}>{lang==='th'?item.th:item.en}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={L('🔐 สิทธิ์การเข้าถึง (Roles & Permissions)', '🔐 Roles & Permissions')}>
            <div style={{fontSize:13,color:'var(--txt3)',lineHeight:1.8,marginBottom:12}}>
              {L('ระบบมี 3 บทบาท สำหรับการควบคุมสิทธิ์: Admin, Manager, Viewer',
                'System has 3 roles to control access: Admin, Manager, Viewer')}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12}}>
              {[
                {icon:'1️⃣',role:L('Admin (ผู้ดูแลระบบ)','Admin'),desc:L('สิทธิ์เต็มทั้งหมด สร้าง/แก้ไข/ลบ/อนุมัติ/ซิงค์ข้อมูล','Full access: create, edit, delete, approve, sync data')},
                {icon:'2️⃣',role:L('Manager (ฝ่ายจัดซื้อ)','Manager'),desc:L('สร้าง/แก้ไข/อนุมัติ PO แต่ไม่ลบข้อมูลและไม่ซิงค์','Can create/edit/approve PO, no delete or data sync')},
                {icon:'3️⃣',role:L('Viewer (ดูอย่างเดียว)','Viewer'),desc:L('ดูข้อมูลเท่านั้น ไม่สามารถสร้าง/แก้ไข/ลบได้','View-only access, cannot create/edit/delete')},
              ].map((item,i)=>(
                <div key={i} style={{background:'var(--bg3)',borderRadius:8,padding:12,borderLeft:`4px solid var(--acc)`}}>
                  <div style={{fontSize:16,marginBottom:4}}>{item.icon} {item.role}</div>
                  <div style={{fontSize:12,color:'var(--txt3)'}}>{item.desc}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,padding:12,background:'var(--bg2)',borderRadius:8,fontSize:12,color:'var(--txt3)'}}>
              {L('📖 ดูรายละเอียดทั้งหมด: ','📖 Full details: ')}<a href="ROLES_AND_PERMISSIONS.md" target="_blank" style={{color:'var(--acc)',textDecoration:'none'}}>Roles & Permissions Documentation</a>
            </div>
          </Card>
        </div>
      )}

      {/* PAGES */}
      {sec==='pages' && (
        <div>
          {PAGES.map(page => (
            <Card key={page.en} title={`${page.icon} ${lang==='th'?page.th:page.en}`}>
              {(lang==='th'?page.steps_th:page.steps_en).map((s,i) => <Step key={i} n={i+1} th={s} en={s} />)}
            </Card>
          ))}
        </div>
      )}

      {/* ROLES & PERMISSIONS */}
      {sec==='roles' && (
        <div>
          <Card title={L('🔐 สิทธิ์การเข้าถึงระบบ', '🔐 System Access Control')}>
            <div style={{fontSize:13,color:'var(--txt3)',lineHeight:1.8,marginBottom:16}}>
              {L('ระบบมี 3 บทบาทการใช้งาน เพื่อจัดการสิทธิ์การเข้าถึง feature ต่างๆ',
                'The system has 3 user roles to manage access to different features')}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16}}>
              {[
                {
                  num:'1️⃣',
                  role:L('Admin (ผู้ดูแลระบบ)','Admin - Full Control'),
                  desc:L('สิทธิ์ทั้งหมด - สร้าง แก้ไข ลบ อนุมัติ ซิงค์ข้อมูล','Full access to all features'),
                  permissions:[
                    {icon:'✅',text:L('สร้าง/แก้ไข/ลบ PO','Create/Edit/Delete PO')},
                    {icon:'✅',text:L('อนุมัติ PO','Approve PO')},
                    {icon:'✅',text:L('จัดการสินค้า','Manage Products')},
                    {icon:'✅',text:L('จัดการผู้จัดจำหน่าย','Manage Suppliers')},
                    {icon:'✅',text:L('ซิงค์ข้อมูล (Import)','Data Sync/Import')},
                    {icon:'✅',text:L('ดูรายงาน','View Reports')},
                    {icon:'✅',text:L('แจ้งสินค้าหมด + จัดการสถานะ (Out-of-Stock)','Report + Manage Out-of-Stock status')},
                    {icon:'✅',text:L('ดูรายการ / สถิติ / ประวัติ Out-of-Stock','View OOS list, statistics & history')},
                  ]
                },
                {
                  num:'2️⃣',
                  role:L('Manager (ฝ่ายจัดซื้อ)','Manager - Limited Control'),
                  desc:L('สร้าง แก้ไข อนุมัติ PO แต่ไม่ลบข้อมูล','Can manage POs but cannot delete'),
                  permissions:[
                    {icon:'✅',text:L('สร้าง/แก้ไข PO','Create/Edit PO')},
                    {icon:'✅',text:L('อนุมัติ PO','Approve PO')},
                    {icon:'✅',text:L('จัดการสินค้า','Manage Products')},
                    {icon:'✅',text:L('จัดการผู้จัดจำหน่าย','Manage Suppliers')},
                    {icon:'✅',text:L('ดูรายงาน','View Reports')},
                    {icon:'✅',text:L('แจ้งสินค้าหมด + จัดการสถานะ (Out-of-Stock)','Report + Manage Out-of-Stock status')},
                    {icon:'✅',text:L('ดูรายการ / สถิติ / ประวัติ Out-of-Stock','View OOS list, statistics & history')},
                    {icon:'❌',text:L('ลบข้อมูล','Delete Data')},
                    {icon:'❌',text:L('ซิงค์ข้อมูล','Data Sync')},
                  ]
                },
                {
                  num:'3️⃣',
                  role:L('Viewer (ผู้ชมอย่างเดียว)','Viewer - Read-Only'),
                  desc:L('เข้าถึงได้เฉพาะหน้า สินค้าหมด — แจ้งได้ + ดูสถานะการสั่งได้','Access limited to Out of Stock page only — can report and view ordering status'),
                  permissions:[
                    {icon:'✅',text:L('แจ้งสินค้าหมด (ลงข้อมูล + ดูสถานะ)','Report out-of-stock (submit + view status)')},
                    {icon:'❌',text:L('ดู/สร้าง/แก้ไข PO','View/Create/Edit PO')},
                    {icon:'❌',text:L('หน้าอื่น ๆ (ยา/ผู้จัดจำหน่าย/รายงาน ฯลฯ)','Other pages (drugs/suppliers/reports, etc.)')},
                    {icon:'❌',text:L('ลบข้อมูล / ซิงค์ข้อมูล','Delete / Data Sync')},
                  ]
                },
              ].map((role,i)=>(
                <div key={i} style={{background:'var(--bg2)',borderRadius:12,padding:16,borderLeft:`5px solid var(--acc)`}}>
                  <div style={{fontSize:18,marginBottom:2}}>{role.num}</div>
                  <div style={{fontSize:16,fontWeight:700,color:'var(--acc)',marginBottom:4}}>{role.role}</div>
                  <div style={{fontSize:12,color:'var(--txt3)',marginBottom:12,lineHeight:1.6}}>{role.desc}</div>
                  <div style={{fontSize:12,color:'var(--txt)'}}>
                    {role.permissions.map((perm,j)=>(
                      <div key={j} style={{marginBottom:6,display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{fontSize:14}}>{perm.icon}</span>
                        <span>{perm.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={L('📋 ตารางเปรียบเทียบสิทธิ์','📋 Comparison Table')}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'var(--bg3)',borderBottom:`2px solid var(--border)`}}>
                    <th style={{padding:8,textAlign:'left',fontWeight:700}}>{L('Feature','Feature')}</th>
                    <th style={{padding:8,textAlign:'center',fontWeight:700}}>Admin</th>
                    <th style={{padding:8,textAlign:'center',fontWeight:700}}>Manager</th>
                    <th style={{padding:8,textAlign:'center',fontWeight:700}}>Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {feat:L('ดู PO','View PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('สร้าง PO','Create PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('แก้ไข PO','Edit PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('ลบ PO','Delete PO'),a:'✅',m:'❌',v:'❌'},
                    {feat:L('อนุมัติ PO','Approve PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('จัดการสินค้า','Manage Products'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('จัดการผู้จัดจำหน่าย','Manage Suppliers'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('ซิงค์ข้อมูล','Data Sync'),a:'✅',m:'❌',v:'❌'},
                    {feat:L('ดูรายงาน','View Reports'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('แจ้งสินค้าหมด','Report Out-of-Stock'),a:'✅',m:'✅',v:'✅'},
                    {feat:L('จัดการสถานะ Out-of-Stock','Manage OOS Status'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('ดูรายการ/สถิติ Out-of-Stock','View OOS List & Stats'),a:'✅',m:'✅',v:'✅'},
                  ].map((row,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid var(--bg3)`}}>
                      <td style={{padding:8}}>{row.feat}</td>
                      <td style={{padding:8,textAlign:'center'}}>{row.a}</td>
                      <td style={{padding:8,textAlign:'center'}}>{row.m}</td>
                      <td style={{padding:8,textAlign:'center'}}>{row.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {isAdmin && (
            <Card title={L('🔧 วิธีตั้งค่า Role (เฉพาะผู้ดูแลระบบ)','🔧 How to Set User Roles (Admin only)')}>
              <Step n={1} th="รัน database/auth.sql ใน Supabase SQL Editor (สร้างตาราง profiles + สิทธิ์)" en="Run database/auth.sql in the Supabase SQL Editor (creates the profiles table + policies)" />
              <Step n={2} th="เข้า Supabase → Authentication → Users → Add user (อีเมล + รหัสผ่าน)" en="Supabase → Authentication → Users → Add user (email + password)" />
              <Step n={3} th="ยกระดับสิทธิ์ด้วย SQL: update profiles set role='admin' where email='...'  (admin / manager / viewer)" en="Promote with SQL: update profiles set role='admin' where email='...'  (admin / manager / viewer)" />
              <Step n={4} th="เปิดบังคับ Login: ตั้ง REQUIRE_LOGIN = true ใน config.js แล้ว deploy" en="Enforce login: set REQUIRE_LOGIN = true in config.js, then deploy" />
              <Step n={5} th="ผู้ใช้ login จะได้สิทธิ์ตาม role ที่กำหนดในตาราง profiles" en="Signed-in users get access based on the role in the profiles table" />
            </Card>
          )}
        </div>
      )}

      {/* DATA */}
      {sec==='data' && (
        <div>
          {REQUIRED_DATA.map(data => (
            <Card key={data.en} title={lang==='th'?data.th:data.en}>
              <div style={{display:'flex',gap:20,marginBottom:12,fontSize:12}}>
                <div>
                  <div style={{color:'var(--txt3)',marginBottom:2}}>{L('ปัจจุบัน:','Current:')}</div>
                  <div style={{fontWeight:700,color:'var(--warn)'}}>{lang==='th'?data.current_th:data.current_en}</div>
                </div>
                <div>
                  <div style={{color:'var(--txt3)',marginBottom:2}}>{L('ต้องการ:','Target:')}</div>
                  <div style={{fontWeight:700,color:'var(--ok)'}}>{lang==='th'?data.needed_th:data.needed_en}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:'var(--txt3)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {data.fields.map(([th,en],i) => (
                  <div key={i}>✓ {lang==='th'?th:en}</div>
                ))}
              </div>
            </Card>
          ))}
          <Card title={L('วิธีการนำเข้า','How to import')}>
            <Step n={1} th="เตรียมข้อมูล Excel ตามฟอร์แมตข้างบน" en="Prepare Excel in format above" />
            <Step n={2} th="ไปเมนู '🔄 Data Sync'" en="Go to '🔄 Data Sync' menu" />
            <Step n={3} th="Upload File หรือ Google Sheets" en="Upload File or use Google Sheets" />
            <Step n={4} th="ระบบจับคู่คอลัมน์ → Preview → Import" en="System maps columns → preview → import" />
          </Card>
        </div>
      )}

      {/* SYNC */}
      {sec==='sync' && (
        <div>
          <Card title={L('ตัวเลือก 1: Google Sheets (แนะนำ)','Option 1: Google Sheets (Recommended)')}>
            <Step n={1} th="สร้าง Google Sheet" en="Create Google Sheet" />
            <Step n={2} th="ใส่ข้อมูล (copy จาก Excel ได้)" en="Add data (can copy from Excel)" />
            <Step n={3} th="File → Share → Anyone with link → Viewer" en="File → Share → Anyone with link → Viewer" />
            <Step n={4} th="คัดลอก URL → วางในระบบ → ดึงข้อมูล" en="Copy URL → paste in system → fetch data" />
            <Step n={5} th="ทำซ้ำทุก 2 เดือน — ระบบ Merge ข้อมูลเก่า+ใหม่" en="Repeat every 2 months — system merges data" />
          </Card>
          <Card title={L('ตัวเลือก 2: Upload Excel','Option 2: Upload Excel')}>
            <Step n={1} th="เตรียมไฟล์ .xlsx" en="Prepare .xlsx file" />
            <Step n={2} th="เมนู Data Sync → Upload File" en="Data Sync menu → Upload File" />
            <Step n={3} th="Drag & Drop หรือเลือกไฟล์" en="Drag & drop or select file" />
            <Step n={4} th="จับคู่คอลัมน์ → Preview → Import" en="Map columns → preview → import" />
          </Card>
        </div>
      )}

      {/* NEXT STEPS */}
      {sec==='nextsteps' && (
        <div className="card" style={{padding:0}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',fontWeight:700}}>
            {L('ทำตามลำดับเพื่อให้ระบบสมบูรณ์','Complete in this order')}
          </div>
          {NEXT_STEPS.map((step,i) => (
            <div key={i} style={{display:'flex',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
              <span style={{fontSize:20,minWidth:30}}>{step.icon}</span>
              <span style={{fontSize:13,flex:1}}>{lang==='th'?step.th:step.en}</span>
              <span style={{fontWeight:700,color:'var(--txt3)',fontSize:12}}>{step.priority}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HelpPage });
