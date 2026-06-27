// DataSync.jsx — Multi-user Sync via Google Sheets + Excel Upload
const { useState, useRef, useCallback } = React;

/* ─── helpers ─── */
function sheetUrlToCsv(url) {
  // Returns a LIST of candidate CSV endpoints to try — different share settings
  // expose the sheet at different paths.
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const id = idMatch[1];
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  return [
    // gviz works for "Anyone with the link" sharing
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`,
    // export needs "Publish to the web"
    `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`,
  ];
}

async function fetchSheetCsv(url) {
  const candidates = sheetUrlToCsv(url);
  if (!candidates) throw new Error('Invalid Google Sheets URL');
  let lastErr;
  for (const u of candidates) {
    try {
      const res = await fetch(u, { redirect: 'follow' });
      if (!res.ok) { lastErr = new Error('HTTP ' + res.status); continue; }
      const text = await res.text();
      // gviz sometimes returns a JS wrapper if the sheet isn't readable
      if (text.trim().startsWith('<')) { lastErr = new Error('Sheet not accessible'); continue; }
      return text;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Sheet not accessible');
}

function csvToRows(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim());
  return { headers, rows: lines.slice(1).map(l => {
    const vals = []; let cur='', inQ=false;
    for(let c of l){ if(c==='"'){inQ=!inQ}else if(c===','&&!inQ){vals.push(cur.trim());cur=''}else cur+=c; }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h,i)=>[h, (vals[i]||'').replace(/^"|"$/g,'')]));
  })};
}

// Auto-detect column mapping based on header names
const DRUG_ALIASES = {
  code:['code','รหัส','item_code','drug_code','รหัสสินค้า','sku'],
  nameTH:['nameth','ชื่อไทย','ชื่อยาไทย','name_th','thai_name','ชื่อ'],
  nameEN:['nameen','english_name','name_en','generic_name','ชื่ออังกฤษ','iNN'],
  unit:['unit','หน่วย','uom','unit_of_measure'],
  catId:['catid','category','หมวดหมู่','main_category','หมวดหลัก'],
  subId:['subid','subcategory','sub_category','sub_cat','หมวดย่อย','หมวดหมู่ย่อย'],
  hasVat:['hasvat','vat','มีvat','has_vat'],
  costEx:['costex','cost','ต้นทุน','cost_price','purchase_price','ราคาซื้อ'],
  sellEx:['sellex','sell','ราคาขาย','sell_price','selling_price'],
  stockPTN:['stockptn','ptn','ptn_stock','stock_ptn','สต็อกptn'],
  stockRAM:['stockram','ram','ram_stock','stock_ram','สต็อกram'],
  stockCNX:['stockcnx','cnx','cnx_stock','stock_cnx','สต็อกcnx'],
  minStock:['minstock','min_stock','ขั้นต่ำ','minimum','สต็อกขั้นต่ำ'],
  supplierId:['supplierid','supplier','ผู้จำหน่าย','vendor','supplier_id'],
  costPTN:['costptn','cost_ptn','ต้นทุนptn','ต้นทุน ptn','ราคาต้นทุนptn','ptn_cost'],
  costRAM:['costram','cost_ram','ต้นทุนram','ต้นทุน ram','ราคาต้นทุนram','ram_cost'],
  costCNX:['costcnx','cost_cnx','ต้นทุนcnx','ต้นทุน cnx','ราคาต้นทุนcnx','cnx_cost'],
};
const SUP_ALIASES = {
  id:['id','รหัส','supplier_id','sup_id'],
  name:['name','ชื่อ','company_name','ชื่อบริษัท'],
  nameEN:['nameen','english_name','name_en','ชื่ออังกฤษ'],
  contact:['contact','ผู้ติดต่อ','contact_person'],
  phone:['phone','โทร','telephone','tel'],
  email:['email','อีเมล'],
  taxId:['taxid','tax_id','เลขภาษี'],
  creditTerm:['creditterm','credit','เครดิต','credit_term'],
  deliveryDays:['deliverydays','delivery','ระยะส่ง','lead_time'],
  rating:['rating','คะแนน','score'],
  address:['address','ที่อยู่'],
  category:['category','ประเภท','ประเภทสินค้า','หมวด','หมวดหมู่'],
  minOrder:['minorder','min_order','ขั้นต่ำ','minimum_order','ยอดสั่งขั้นต่ำ'],
};

function detectMap(headers, aliases) {
  const map = {};
  for(const [field, alts] of Object.entries(aliases)){
    const found = headers.find(h => alts.some(a => h.toLowerCase().replace(/\s/g,'')===a.toLowerCase().replace(/\s/g,'')));
    map[field] = found || '';
  }
  return map;
}

// "Cat14" → "CAT14", "cat2" → "CAT02" (case-insensitive, zero-padded)
function normCatId(raw) {
  const m = (raw||'').match(/^cat(\d+)$/i);
  return m ? 'CAT' + m[1].padStart(2,'0') : raw;
}
// "Cat14.1" → "S1401", "cat2.3" → "S0203"
function normSubId(raw) {
  const m = (raw||'').match(/^cat(\d+)\.(\d+)$/i);
  return m ? 'S' + m[1].padStart(2,'0') + m[2].padStart(2,'0') : raw;
}

function parseDrugs(rows, map, cats) {
  return rows.filter(r => map.code && r[map.code] && !String(r[map.code]).startsWith('#')).map(r => {
    const code = r[map.code]?.trim().toUpperCase();
    const costEx = parseFloat(r[map.costEx]) || 0;
    const sellEx = parseFloat(r[map.sellEx]) || 0;
    const hasVat = ['1','true','yes','y','มี','vat'].includes((r[map.hasVat]||'').toLowerCase());
    const profitEx = +(sellEx-costEx).toFixed(2);
    const profitMargin = sellEx>0?+((profitEx/sellEx)*100).toFixed(1):0;
    const sPTN = parseInt(r[map.stockPTN])||0, sRAM = parseInt(r[map.stockRAM])||0, sCNX = parseInt(r[map.stockCNX])||0;
    // Map category + sub-category names (or ids) to their ids
    const catRaw = (r[map.catId]||'').trim();
    const subRaw = (r[map.subId]||'').trim();
    const catLookup = normCatId(catRaw);   // "Cat14" → "CAT14"
    const subLookup = normSubId(subRaw);   // "Cat14.1" → "S1401"
    const matchedCat = cats.find(c=>c.name===catRaw||c.nameEN===catRaw||c.id===catLookup||c.id===catRaw);
    let catId = matchedCat?.id, subId;
    if (matchedCat) {
      const ms = (matchedCat.subs||[]).find(s=>s.name===subRaw||s.nameEN===subRaw||s.id===subLookup||s.id===subRaw);
      subId = ms?.id || matchedCat.subs?.[0]?.id;
    } else if (subRaw) {
      // sub given but main not matched → find the category that owns this sub
      for (const c of cats) { const ms=(c.subs||[]).find(s=>s.name===subRaw||s.nameEN===subRaw||s.id===subLookup||s.id===subRaw); if(ms){catId=c.id;subId=ms.id;break;} }
    }
    catId = catId || 'CAT01'; subId = subId || 'S0101';
    return {
      code, nameTH: r[map.nameTH]||code, nameEN: r[map.nameEN]||r[map.nameTH]||code,
      unit: r[map.unit]||'เม็ด', catId, subId,
      hasVat, vatRate: hasVat?7:0, costEx, costInc: hasVat?+(costEx*1.07).toFixed(2):costEx,
      sellEx, sellInc: hasVat?+(sellEx*1.07).toFixed(2):sellEx,
      profitEx, profitMargin, stock:{PTN:sPTN,RAM:sRAM,CNX:sCNX},
      totalStock:sPTN+sRAM+sCNX, minStock:parseInt(r[map.minStock])||100,
      supplierId: r[map.supplierId]||'SUP001', orderCount:0,
      lastOrdered: new Date().toISOString().split('T')[0],
      costByBranch: {
        PTN: (map.costPTN && r[map.costPTN] !== '' && r[map.costPTN] != null) ? parseFloat(r[map.costPTN]) || null : null,
        RAM: (map.costRAM && r[map.costRAM] !== '' && r[map.costRAM] != null) ? parseFloat(r[map.costRAM]) || null : null,
        CNX: (map.costCNX && r[map.costCNX] !== '' && r[map.costCNX] != null) ? parseFloat(r[map.costCNX]) || null : null,
      },
    };
  });
}

function parseSuppliers(rows, map) {
  return rows.filter(r => {
    // Skip description rows (any mapped column starting with #)
    if (map.id   && r[map.id]   && String(r[map.id]).startsWith('#'))   return false;
    if (map.name && r[map.name] && String(r[map.name]).startsWith('#')) return false;
    // Keep row if it has at least a name (id may be absent → auto-generated)
    return !!(r[map.name]);
  }).map((r, i) => ({
    id:r[map.id]?.trim()||('SUP'+String(Date.now()+i).slice(-6)),
    code:'', name:r[map.name]||'', nameEN:r[map.nameEN]||r[map.name]||'',
    contact:r[map.contact]||'', phone:r[map.phone]||'', email:r[map.email]||'',
    taxId:r[map.taxId]||'', creditTerm:parseInt(r[map.creditTerm])||30,
    deliveryDays:parseInt(r[map.deliveryDays])||3, rating:parseFloat(r[map.rating])||4.0,
    minOrder:parseInt(r[map.minOrder])||5000, address:r[map.address]||'',
    category:r[map.category]||'ยาทั่วไป', promotions:[], drugs:[]
  }));
}

/* ─── Template XLSX generator (with dropdowns via SheetJS) ─── */
function downloadTemplate(type) {
  const wb = XLSX.utils.book_new();

  if (type === 'drugs') {
    const CATS = [
      'โรคหัวใจและหลอดเลือด','โรคติดเชื้อ','โรคระบบทางเดินหายใจ',
      'โรคเบาหวานและต่อมไร้ท่อ','โรคระบบทางเดินอาหาร','โรคระบบประสาทและจิตเวช',
      'โรคมะเร็ง','โรคภูมิคุ้มกันและภูมิแพ้','โรคกระดูกและข้อ',
      'ยาจำหน่ายหน้าเคาเตอร์','โรคตา','โรคไต',
      'เวชภัณฑ์ทางการแพทย์','อาหารเสริมและวิตามิน','อุปกรณ์ที่ไม่จัดหมวดหมู่',
    ];
    const SUBS = [
      'ยาลดความดันโลหิต','ยาต้านการแข็งตัวของเลือด','ยาลดไขมัน',
      'ยาปฏิชีวนะ','ยาต้านไวรัส','ยาฆ่าเชื้อรา',
      'ยาขยายหลอดลม','ยาแก้แพ้/ยาแก้ไอ',
      'ยาลดน้ำตาลในเลือด','ยาอินซูลิน','ยาไทรอยด์',
      'ยาลดกรด/ยาแผลกระเพาะ','ยาระบาย','ยาแก้ท้องเสีย',
      'ยาแก้ปวด/ลดไข้','ยาต้านซึมเศร้า','ยากันชัก',
      'ยาเคมีบำบัด','ยากดภูมิคุ้มกัน','ยาแก้อักเสบ/ปวดข้อ',
      'ยาแก้ปวด/พาราเซตามอล','ยาแก้ไข้','ยาแก้แพ้/แอนตี้ฮิสตามีน',
      'ยาหยอดตา','ยาป้ายตา','ยาบำรุงไต',
      'อุปกรณ์การแพทย์','ผ้าพันแผล/ถุงมือ','วิตามินรวม','วิตามิน','ของแถม',
    ];
    const UNITS = ['เม็ด','แคปซูล','ขวด','แผง','หลอด','ซอง','กล่อง','ml','mg','หน่วย'];

    const ws = XLSX.utils.aoa_to_sheet([
      ['code','nameTH','nameEN','unit','catId','subId','hasVat','costEx','sellEx','stockPTN','stockRAM','stockCNX','minStock','supplierId','costPTN','costRAM','costCNX'],
      ['#คำอธิบาย','ชื่อยาภาษาไทย','ชื่อยาภาษาอังกฤษ','หน่วย (เลือก ▼)','หมวดหมู่ (เลือก ▼)','หมวดย่อย (เลือก ▼)','0=ไม่มีVAT / 1=มีVAT','ราคาต้นทุนหลัก (ไม่รวมVAT)','ราคาขาย (ไม่รวมVAT)','สต็อก PTN','สต็อก RAM','สต็อก CNX','สต็อกขั้นต่ำ','รหัส Supplier','ต้นทุน PTN (เว้นว่าง=ใช้หลัก)','ต้นทุน RAM (เว้นว่าง=ใช้หลัก)','ต้นทุน CNX (เว้นว่าง=ใช้หลัก)'],
      ['AMX001','อะม็อกซิซิลลิน 500มก.','Amoxicillin 500mg','เม็ด','โรคติดเชื้อ','ยาปฏิชีวนะ',0,18,38,500,400,300,100,'SUP001','','',''],
      ['PAR500','พาราเซตามอล 500มก.','Paracetamol 500mg','เม็ด','ยาจำหน่ายหน้าเคาเตอร์','ยาแก้ปวด/พาราเซตามอล',0,5,15,1000,800,600,200,'SUP001',5.5,5,4.8],
      ['IBU400','ไอบูโพรเฟน 400มก.','Ibuprofen 400mg','เม็ด','ยาจำหน่ายหน้าเคาเตอร์','ยาแก้ปวด/ลดไข้',0,12,28,300,200,100,50,'SUP002','','',''],
      ['VIT001','วิตามินซี 1000มก.','Vitamin C 1000mg','เม็ด','อาหารเสริมและวิตามิน','วิตามินรวม',1,25,55,200,150,100,50,'SUP002','','',''],
    ]);
    ws['!cols'] = [10,30,28,12,26,26,10,10,10,10,10,10,12,16,12,12,12].map(wch=>({wch}));
    ws['!views'] = [{ state:'frozen', xSplit:0, ySplit:1 }];

    // Hidden Lists sheet — dropdown values stored here, referenced by data validation
    const maxL = Math.max(CATS.length, SUBS.length, UNITS.length);
    const listsRows = [['หน่วย','หมวดหมู่','หมวดย่อย']];
    for (let i = 0; i < maxL; i++) listsRows.push([UNITS[i]||'', CATS[i]||'', SUBS[i]||'']);
    const listsWs = XLSX.utils.aoa_to_sheet(listsRows);
    listsWs['!cols'] = [{wch:20},{wch:30},{wch:32}];

    ws['!dataValidations'] = [
      { sqref:'D3:D10000', type:'list', formula1:`Lists!$A$2:$A${1+UNITS.length}`, showDropDown:false },
      { sqref:'E3:E10000', type:'list', formula1:`Lists!$B$2:$B${1+CATS.length}`, showDropDown:false },
      { sqref:'F3:F10000', type:'list', formula1:`Lists!$C$2:$C${1+SUBS.length}`, showDropDown:false },
      { sqref:'G3:G10000', type:'list', formula1:'"0,1"', showDropDown:false },
      // O:Q (costPTN/RAM/CNX) are free-form numeric — no dropdown
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'ยา');
    XLSX.utils.book_append_sheet(wb, listsWs, 'Lists');
    wb.Workbook = { Sheets:[{name:'ยา',Hidden:0},{name:'Lists',Hidden:1}] };
    XLSX.writeFile(wb, 'template_drugs.xlsx');

  } else {
    const SUP_CATS = ['ยาทั่วไป','วิตามินและอาหารเสริม','เวชภัณฑ์และอุปกรณ์','ยาเฉพาะทาง','ยาสามัญประจำบ้าน'];

    const ws = XLSX.utils.aoa_to_sheet([
      ['id','name','nameEN','contact','phone','email','taxId','creditTerm','deliveryDays','rating','address','category','minOrder'],
      ['#คำอธิบาย','ชื่อบริษัท (ไทย)','ชื่อบริษัท (อังกฤษ)','ชื่อผู้ติดต่อ','เบอร์โทร','อีเมล','เลขผู้เสียภาษี (13 หลัก)','เครดิต (วัน)','ระยะส่ง (วัน)','คะแนน 1-5','ที่อยู่','ประเภท (เลือก ▼)','ยอดขั้นต่ำ (บาท)'],
      ['SUP001','บริษัท ยูนิไทย ฟาร์มา จำกัด','Unithai Pharma Co. Ltd.','คุณ สมชาย ใจดี','02-123-4567','contact@unithai.com','0105560012345',30,3,4.5,'123 ถนนพระราม9 กรุงเทพ','ยาทั่วไป',5000],
      ['SUP002','บริษัท เมดิซัพพลาย จำกัด','Medisupply Co. Ltd.','คุณ สมหญิง รักดี','02-987-6543','info@medisupply.co.th','0105561098765',45,5,4.0,'456 ถนนวิทยุ กรุงเทพ','วิตามินและอาหารเสริม',10000],
    ]);
    ws['!cols'] = [10,28,26,18,14,24,16,10,10,8,28,20,14].map(wch=>({wch}));
    ws['!views'] = [{ state:'frozen', xSplit:0, ySplit:1 }];

    const listsWs = XLSX.utils.aoa_to_sheet([['ประเภทสินค้า'], ...SUP_CATS.map(c=>[c])]);
    listsWs['!cols'] = [{wch:25}];

    ws['!dataValidations'] = [
      { sqref:'L3:L10000', type:'list', formula1:`Lists!$A$2:$A${1+SUP_CATS.length}`, showDropDown:false },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Supplier');
    XLSX.utils.book_append_sheet(wb, listsWs, 'Lists');
    wb.Workbook = { Sheets:[{name:'Supplier',Hidden:0},{name:'Lists',Hidden:1}] };
    XLSX.writeFile(wb, 'template_suppliers.xlsx');
  }
}

/* ─── MAIN PAGE ─── */
function DataSyncPage({ lang, L, drugs, setDrugs, suppliers, setSuppliers, notify, perm = { canWrite: true } }) {
  const [tab, setTab] = useState('sheets');
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('uni_sheet_url')||'');
  const [sheetType, setSheetType] = useState('drugs');
  const [syncing, setSyncing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [colMap, setColMap] = useState(null);
  const [rawRows, setRawRows] = useState(null);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [step, setStep] = useState(1); // 1=upload 2=map 3=preview 4=done
  const [history, setHistory] = useState(() => { try{return JSON.parse(localStorage.getItem('uni_sync_hist')||'[]')}catch{return []} });
  const fileRef = useRef();
  const [sqlSub, setSqlSub] = useState('export');
  const [sqlOutput, setSqlOutput] = useState('');
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlExportType, setSqlExportType] = useState('drugs');
  const [sqlQuery, setSqlQuery] = useState('SELECT code, name_th, name_en, cost_ex, sell_ex, total_stock\nFROM drugs\nLIMIT 20;');
  const [sqlResults, setSqlResults] = useState(null);
  const [sqlError, setSqlError] = useState('');
  const [sqlSetupOpen, setSqlSetupOpen] = useState(false);
  const [startupSql, setStartupSql] = useState(() => { try { return localStorage.getItem('uni_startup_sql') || ''; } catch(e) { return ''; } });
  const [startupSqlDraft, setStartupSqlDraft] = useState(() => { try { return localStorage.getItem('uni_startup_sql') || ''; } catch(e) { return ''; } });
  const [startupLastRun, setStartupLastRun] = useState(() => { try { return localStorage.getItem('uni_startup_sql_last_run') || ''; } catch(e) { return ''; } });
  const [startupLastStatus, setStartupLastStatus] = useState(() => { try { return localStorage.getItem('uni_startup_sql_last_status') || ''; } catch(e) { return ''; } });
  const [startupSqlOpen, setStartupSqlOpen] = useState(false);

  const addHistory = useCallback((source, type, count) => {
    const entry = { date: new Date().toISOString(), source, type, count };
    const h = [entry, ...(JSON.parse(localStorage.getItem('uni_sync_hist')||'[]')).slice(0,9)];
    localStorage.setItem('uni_sync_hist', JSON.stringify(h));
    setHistory(h);
  }, []);

  /* ── Google Sheets sync ── */
  const handleSheetSync = async () => {
    if (!sheetUrl) { notify(L('กรุณากรอก URL','Please enter URL'),'err'); return; }
    localStorage.setItem('uni_sheet_url', sheetUrl);
    setSyncing(true);
    try {
      const text = await fetchSheetCsv(sheetUrl);
      const { headers, rows } = csvToRows(text);
      if (rows.length === 0) throw new Error('No data rows');
      setRawHeaders(headers); setRawRows(rows);
      const autoMap = sheetType === 'drugs' ? detectMap(headers, DRUG_ALIASES) : detectMap(headers, SUP_ALIASES);
      setColMap(autoMap); setStep(2);
    } catch(e) {
      // Give a clear, actionable error — most common cause is sharing settings
      notify(L(
        'ดึงข้อมูลไม่สำเร็จ — ตรวจสอบว่าตั้งค่า Share เป็น "Anyone with the link" และลองใหม่',
        'Fetch failed — make sure the sheet is shared as "Anyone with the link" and try again'
      ),'err');
      console.warn('[Sheet sync] error:', e);
    } finally { setSyncing(false); }
  };

  /* ── Excel/CSV file upload ── */
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    let headers, rows;
    if (ext === 'csv') {
      const text = await file.text();
      const parsed = csvToRows(text);
      headers = parsed.headers; rows = parsed.rows;
    } else if (ext === 'xlsx' || ext === 'xls') {
      if (!window.XLSX) { notify(L('กำลังโหลด SheetJS...','Loading SheetJS...'),'warn'); return; }
      const buf = await file.arrayBuffer();
      const wb = window.XLSX.read(buf, {type:'array'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const arr = window.XLSX.utils.sheet_to_json(ws, {header:1});
      headers = arr[0].map(String);
      rows = arr.slice(1).map(r => Object.fromEntries(headers.map((h,i)=>[h,String(r[i]||'')])));
    } else { notify(L('รองรับ .xlsx, .xls, .csv เท่านั้น','Only .xlsx, .xls, .csv supported'),'err'); return; }
    setRawHeaders(headers); setRawRows(rows);
    const autoMap = sheetType === 'drugs' ? detectMap(headers, DRUG_ALIASES) : detectMap(headers, SUP_ALIASES);
    setColMap(autoMap); setStep(2);
  }, [sheetType, notify]);

  /* ── Generate preview from current map ── */
  const generatePreview = () => {
    if (!rawRows || !colMap) return;
    const cats = DB.CATEGORIES;
    const parsed = sheetType==='drugs' ? parseDrugs(rawRows, colMap, cats) : parseSuppliers(rawRows, colMap);
    setPreview(parsed); setStep(3);
  };

  /* ── Commit import ── */
  const commitImport = () => {
    if (!preview) return;
    const source = tab==='sheets' ? 'Google Sheets' : 'File Upload';
    if (sheetType==='drugs') {
      setDrugs(prev => {
        const map = Object.fromEntries(prev.map(d=>[d.code,d]));
        preview.forEach(d => { map[d.code] = d; });
        return Object.values(map);
      });
      // Auto-link each drug to its primary supplier's drugs[] array
      setSuppliers(prev => {
        const supMap = Object.fromEntries(prev.map(s=>[s.id,{...s,drugs:[...(s.drugs||[])]}]));
        preview.forEach(d => {
          if (d.supplierId && supMap[d.supplierId] && !supMap[d.supplierId].drugs.includes(d.code))
            supMap[d.supplierId].drugs.push(d.code);
        });
        const updated = Object.values(supMap);
        if (window.UNI_DB?.enabled) window.UNI_DB.saveSuppliersBulk(updated).catch(()=>{});
        return updated;
      });
      addHistory(source, L('ฐานข้อมูลยา','Drug DB'), preview.length);
      if (window.UNI_DB && window.UNI_DB.enabled) {
        window.UNI_DB.saveDrugsBulk(preview)
          .then(() => { window.UNI_DB.logSync(source, 'drugs', preview.length); notify(L('อัปโหลดขึ้นคลาวด์แล้ว','Pushed to cloud')); })
          .catch(() => notify(L('อัปโหลดคลาวด์ไม่สำเร็จ','Cloud upload failed'), 'err'));
      }
      notify(L(`นำเข้ายา ${preview.length} รายการสำเร็จ`, `Imported ${preview.length} drugs successfully`));
    } else {
      setSuppliers(prev => {
        const map = Object.fromEntries(prev.map(s=>[s.id,s]));
        preview.forEach(s => { map[s.id] = s; });
        return Object.values(map);
      });
      addHistory(source, L('ผู้จัดจำหน่าย','Suppliers'), preview.length);
      if (window.UNI_DB && window.UNI_DB.enabled) {
        window.UNI_DB.saveSuppliersBulk(preview)
          .then(() => { window.UNI_DB.logSync(source, 'suppliers', preview.length); notify(L('อัปโหลดขึ้นคลาวด์แล้ว','Pushed to cloud')); })
          .catch(() => notify(L('อัปโหลดคลาวด์ไม่สำเร็จ','Cloud upload failed'), 'err'));
      }
      notify(L(`นำเข้า Supplier ${preview.length} รายสำเร็จ`, `Imported ${preview.length} suppliers successfully`));
    }
    setStep(4); setPreview(null); setRawRows(null); setColMap(null);
  };

  const reset = () => { setStep(1); setPreview(null); setRawRows(null); setColMap(null); };

  /* ── SQL Sync helpers ── */
  const sqlEsc = s => String(s||'').replace(/'/g, "''");

  const generateSqlExport = () => {
    const lines = ['BEGIN;', ''];
    if (sqlExportType === 'drugs') {
      lines.push(`-- ยา ${drugs.length} รายการ — Generated: ${new Date().toISOString()}`, '');
      drugs.forEach(d => {
        lines.push(
          `INSERT INTO drugs (code,name_th,name_en,cat_id,sub_id,supplier_id,has_vat,cost_ex,sell_ex,total_stock,data) VALUES ` +
          `('${sqlEsc(d.code)}','${sqlEsc(d.nameTH)}','${sqlEsc(d.nameEN)}','${sqlEsc(d.catId||'')}','${sqlEsc(d.subId||'')}','${sqlEsc(d.supplierId||'')}',${!!d.hasVat},${d.costEx||0},${d.sellEx||0},${d.totalStock||0},'${sqlEsc(JSON.stringify(d))}'::jsonb) ` +
          `ON CONFLICT (code) DO UPDATE SET name_th=EXCLUDED.name_th,name_en=EXCLUDED.name_en,cat_id=EXCLUDED.cat_id,cost_ex=EXCLUDED.cost_ex,sell_ex=EXCLUDED.sell_ex,total_stock=EXCLUDED.total_stock,data=EXCLUDED.data;`
        );
      });
    } else {
      lines.push(`-- Supplier ${suppliers.length} ราย — Generated: ${new Date().toISOString()}`, '');
      suppliers.forEach(s => {
        lines.push(
          `INSERT INTO suppliers (id,code,name,name_en,category,data) VALUES ` +
          `('${sqlEsc(s.id)}','${sqlEsc(s.code||'')}','${sqlEsc(s.name)}','${sqlEsc(s.nameEN||s.name)}','${sqlEsc(s.category||'')}','${sqlEsc(JSON.stringify(s))}'::jsonb) ` +
          `ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,name_en=EXCLUDED.name_en,category=EXCLUDED.category,data=EXCLUDED.data;`
        );
      });
    }
    lines.push('', 'COMMIT;');
    setSqlOutput(lines.join('\n'));
  };

  const downloadSql = () => {
    if (!sqlOutput) return;
    const blob = new Blob([sqlOutput], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `unipharma_${sqlExportType}_${new Date().toISOString().slice(0,10)}.sql`;
    a.click();
  };

  const SQL_FIXES = [
    {
      id: 'nameEN', icon: '🔤',
      labelTH: 'แก้ไข nameEN ยา (ที่ยังเป็น code หรือว่างเปล่า)',
      labelEN: 'Fix drug nameEN (blank or equals drug code)',
      check: () => drugs.filter(d => !d.nameEN || d.nameEN.trim() === d.code || d.nameEN.trim() === '').length,
      run: async () => {
        const toFix = drugs.filter(d => !d.nameEN || d.nameEN.trim() === d.code || d.nameEN.trim() === '');
        if (!toFix.length) { notify(L('ไม่พบข้อมูลที่ต้องแก้ไข','No records need fixing'),'ok'); return; }
        const fixed = toFix.map(d => ({ ...d, nameEN: (d.nameTH||d.code).trim() }));
        if (window.UNI_DB?.enabled) await window.UNI_DB.saveDrugsBulk(fixed);
        setDrugs(prev => { const m=Object.fromEntries(prev.map(d=>[d.code,d])); fixed.forEach(d=>{m[d.code]=d;}); return Object.values(m); });
        notify(L(`แก้ไข ${fixed.length} รายการ ✓`,`Fixed ${fixed.length} records ✓`),'ok');
      },
    },
    {
      id: 'supNameEN', icon: '🏭',
      labelTH: 'แก้ไข nameEN Supplier (ที่ว่างเปล่า)',
      labelEN: 'Fix supplier nameEN (blank)',
      check: () => suppliers.filter(s => !s.nameEN || !s.nameEN.trim()).length,
      run: async () => {
        const toFix = suppliers.filter(s => !s.nameEN || !s.nameEN.trim());
        if (!toFix.length) { notify(L('ไม่พบข้อมูลที่ต้องแก้ไข','No records need fixing'),'ok'); return; }
        const fixed = toFix.map(s => ({ ...s, nameEN: s.name || s.id }));
        if (window.UNI_DB?.enabled) await window.UNI_DB.saveSuppliersBulk(fixed);
        setSuppliers(prev => { const m=Object.fromEntries(prev.map(s=>[s.id,s])); fixed.forEach(s=>{m[s.id]=s;}); return Object.values(m); });
        notify(L(`แก้ไข ${fixed.length} ราย ✓`,`Fixed ${fixed.length} suppliers ✓`),'ok');
      },
    },
    {
      id: 'totalStock', icon: '📦',
      labelTH: 'คำนวณ totalStock ใหม่ (จาก stock.PTN+RAM+CNX)',
      labelEN: 'Recalculate totalStock (from stock.PTN+RAM+CNX)',
      check: () => drugs.filter(d => { const c=(d.stock?.PTN||0)+(d.stock?.RAM||0)+(d.stock?.CNX||0); return c!==d.totalStock; }).length,
      run: async () => {
        const toFix = drugs.filter(d => { const c=(d.stock?.PTN||0)+(d.stock?.RAM||0)+(d.stock?.CNX||0); return c!==d.totalStock; });
        if (!toFix.length) { notify(L('สต็อกถูกต้องทั้งหมด','All totals correct'),'ok'); return; }
        const fixed = toFix.map(d => ({ ...d, totalStock:(d.stock?.PTN||0)+(d.stock?.RAM||0)+(d.stock?.CNX||0) }));
        if (window.UNI_DB?.enabled) await window.UNI_DB.saveDrugsBulk(fixed);
        setDrugs(prev => { const m=Object.fromEntries(prev.map(d=>[d.code,d])); fixed.forEach(d=>{m[d.code]=d;}); return Object.values(m); });
        notify(L(`อัปเดต ${fixed.length} รายการ ✓`,`Updated ${fixed.length} records ✓`),'ok');
      },
    },
  ];

  const SQL_SNIPPETS = [
    {
      labelTH: '📦 นำเข้าหมวดหมู่ยา 14 หมวด (CAT01–CAT14)',
      labelEN: '📦 Import 14 drug categories (CAT01–CAT14)',
      sql: `-- นำเข้าหมวดหมู่ยา 14 หมวด (รันครั้งเดียวใน Supabase SQL Editor)\nINSERT INTO categories (id, name_th, name_en, color, subs)\nVALUES\n  ('CAT01', 'อาหารเสริมและวิตามิน', 'Supplements & Vitamins', '#22c55e', '[{"id":"S0101","name":"อาหารเสริมทั่วไป","nameEN":"General Supplements"},{"id":"S0102","name":"แร่ธาตุ","nameEN":"Minerals"},{"id":"S0103","name":"วิตามินรวม","nameEN":"Multivitamins"}]'::jsonb),\n  ('CAT02', 'โรคระบบทางเดินอาหาร', 'Gastrointestinal Diseases', '#f97316', '[{"id":"S0201","name":"ยาระบาย","nameEN":"Laxatives"},{"id":"S0202","name":"ยาบำรุงตับ","nameEN":"Liver medication"},{"id":"S0203","name":"ยาลดกรด/ยาแผลกระเพาะ","nameEN":"Antacids / Antiulcer Agents"},{"id":"S0204","name":"โรคลำไส้แปรปรวน","nameEN":"Irritable Bowel Syndrome"},{"id":"S0205","name":"ยาแก้คลื่นไส้/อาเจียน","nameEN":"Antiemetics"},{"id":"S0206","name":"ยาแก้ท้องเสีย","nameEN":"Antidiarrheals"},{"id":"S0207","name":"โรคริดสีดวงทวาร","nameEN":"Hemorrhoids"}]'::jsonb),\n  ('CAT03', 'โรคติดเชื้อ', 'Infectious Disease / Infection', '#ef4444', '[{"id":"S0301","name":"ยาต้านเชื้อรา","nameEN":"Antifungals"},{"id":"S0302","name":"ยาปฏิชีวนะ","nameEN":"Antibiotics"},{"id":"S0303","name":"ยาต้านปรสิต","nameEN":"Antiparasitic Agents"},{"id":"S0304","name":"ยาต้านไวรัส","nameEN":"Antivirals"}]'::jsonb),\n  ('CAT04', 'เวชภัณฑ์ทางการแพทย์', 'Medical Supplies', '#64748b', '[{"id":"S0401","name":"วัสดุสิ้นเปลือง","nameEN":"Consumable Supplies"},{"id":"S0402","name":"อุปกรณ์การแพทย์","nameEN":"Medical Devices"},{"id":"S0403","name":"เครื่องมือตรวจวัด","nameEN":"Diagnostic Equipment"}]'::jsonb),\n  ('CAT05', 'ยาจำหน่ายหน้าเคาเตอร์', 'OTC Drugs Over-the-Counter', '#8b5cf6', '[{"id":"S0501","name":"เวชสำอาง","nameEN":"Cosmeceutical"},{"id":"S0502","name":"ยาแก้ปวด/พาราเซตามอล","nameEN":"Analgesics / Paracetamol (OTC)"},{"id":"S0503","name":"ยาขับลม/ลดแก๊ส","nameEN":"Carminatives / Antiflatulents"},{"id":"S0504","name":"ยาแก้ไอ OTC","nameEN":"Cough Remedies (OTC)"},{"id":"S0505","name":"ยาแก้เมารถ/เรือ","nameEN":"Motion Sickness Medication"}]'::jsonb),\n  ('CAT06', 'โรคระบบทางเดินหายใจ', 'Respiratory Disease', '#06b6d4', '[{"id":"S0601","name":"ยาขยายหลอดลม","nameEN":"Bronchodilators"},{"id":"S0602","name":"ยาแก้แพ้","nameEN":"Antihistamines"},{"id":"S0603","name":"ยาสูดพ่นสเตียรอยด์","nameEN":"Inhaled Corticosteroids"},{"id":"S0604","name":"ยาแก้ไอ/ละลายเสมหะ","nameEN":"Antitussives / Mucolytics"}]'::jsonb),\n  ('CAT07', 'โรคตา', 'Ophthalmic', '#3b82f6', '[{"id":"S0701","name":"ยาหยอดตา","nameEN":"Eye Drops"},{"id":"S0702","name":"ยาป้ายตา","nameEN":"Eye Ointments"},{"id":"S0703","name":"อุปกรณ์ตา","nameEN":"Ophthalmic Devices"}]'::jsonb),\n  ('CAT08', 'โรคหัวใจและหลอดเลือด', 'Cardiovascular Disease (CVD)', '#dc2626', '[{"id":"S0801","name":"ยาลดความดันโลหิต","nameEN":"Antihypertensives"},{"id":"S0802","name":"ยาต้านเกล็ดเลือด","nameEN":"Antiplatelet Agents"},{"id":"S0803","name":"ยาขับปัสสาวะ","nameEN":"Diuretics"},{"id":"S0804","name":"ยาลดไขมันในเลือด","nameEN":"Lipid-Lowering Agents"},{"id":"S0805","name":"ยาต้านการแข็งตัวของเลือด","nameEN":"Anticoagulants"}]'::jsonb),\n  ('CAT09', 'อุปกรณ์ที่ไม่จัดหมวดหมู่', 'Uncategorized Equipment', '#94a3b8', '[{"id":"S0901","name":"ของแถม","nameEN":"Freebie / Complimentary Gift"},{"id":"S0902","name":"สินค้าเบ็ดเตล็ด","nameEN":"Miscellaneous Items"}]'::jsonb),\n  ('CAT10', 'โรคกระดูกและข้อ', 'Orthopedic Diseases', '#d97706', '[{"id":"S1001","name":"ยาป้องกันกระดูกพรุน","nameEN":"Osteoporosis Agents"},{"id":"S1002","name":"ยารักษาโรคเกาต์","nameEN":"Antigout Agents"},{"id":"S1003","name":"ยาแก้อักเสบ/ปวดข้อ","nameEN":"Anti-inflammatory / Analgesics"}]'::jsonb),\n  ('CAT11', 'โรคเบาหวานและต่อมไร้ท่อ', 'Diabetes & Endocrinology', '#10b981', '[{"id":"S1101","name":"ยาลดน้ำตาลในเลือด","nameEN":"Antidiabetics / Hypoglycemics"},{"id":"S1102","name":"ยาคุมกำเนิด","nameEN":"Contraception"},{"id":"S1103","name":"ยาฮอร์โมน","nameEN":"Hormonal Therapy"},{"id":"S1104","name":"ยาไทรอยด์","nameEN":"Thyroid Agents"},{"id":"S1105","name":"อินซูลิน","nameEN":"Insulin"}]'::jsonb),\n  ('CAT12', 'โรคภูมิคุ้มกันและภูมิแพ้', 'Allergy & Immunology', '#f59e0b', '[{"id":"S1201","name":"ยาแก้แพ้/อีพิเนฟริน","nameEN":"Antiallergics / Epinephrine"},{"id":"S1202","name":"ยากดภูมิคุ้มกัน","nameEN":"Immunosuppressants"}]'::jsonb),\n  ('CAT13', 'โรคระบบประสาทและจิตเวช', 'Neurological & Psychiatric Disorders', '#7c3aed', '[{"id":"S1301","name":"ยาแก้ปวด/ลดไข้","nameEN":"Analgesics / Antipyretics"},{"id":"S1302","name":"ยากันชัก","nameEN":"Antiepileptics"},{"id":"S1303","name":"ยาต้านซึมเศร้า","nameEN":"Antidepressants"},{"id":"S1304","name":"ยารักษาพาร์กินสัน","nameEN":"Anti-Parkinson Agents"},{"id":"S1305","name":"ยารักษาอัลไซเมอร์","nameEN":"Alzheimer's Disease"},{"id":"S1306","name":"ยารักษาโรคจิต","nameEN":"Antipsychotics"}]'::jsonb),\n  ('CAT14', 'โรคไต', 'Kidney Medications', '#0ea5e9', '[{"id":"S1401","name":"ยาลดของเสียในเลือด","nameEN":"Uremic Toxin Reducers"}]'::jsonb)\nON CONFLICT (id) DO UPDATE SET\n  name_th = EXCLUDED.name_th,\n  name_en = EXCLUDED.name_en,\n  color   = EXCLUDED.color,\n  subs    = EXCLUDED.subs;`,
    },
    {
      labelTH: '⚙️ อัปเกรดตาราง out_of_stock (เพิ่ม status + data column)',
      labelEN: '⚙️ Upgrade out_of_stock table (add status + data columns)',
      sql: `-- รัน 1 ครั้งใน Supabase Dashboard SQL Editor\n-- เพิ่ม column ใหม่สำหรับระบบสถานะ Back Order / ETA\nALTER TABLE out_of_stock\n  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',\n  ADD COLUMN IF NOT EXISTS data JSONB;\n\n-- อัปเดต status ของรายการเก่า (resolved → arrived)\nUPDATE out_of_stock\nSET status = CASE WHEN resolved_at IS NOT NULL THEN 'arrived' ELSE 'pending' END\nWHERE status IS NULL OR status = '';`,
    },
    {
      labelTH: 'แก้ nameEN ที่เป็น code ยา',
      labelEN: 'Fix nameEN equal to drug code',
      sql: `-- แก้ไข nameEN ที่เป็น code ยา ให้ใช้ nameTH แทน\nUPDATE drugs\nSET data = jsonb_set(data, '{nameEN}', data->'nameTH'),\n    name_en = data->>'nameTH'\nWHERE data->>'nameEN' = data->>'code'\n   OR data->>'nameEN' IS NULL\n   OR trim(data->>'nameEN') = '';`,
    },
    {
      labelTH: 'คำนวณ totalStock ใหม่ทั้งหมด',
      labelEN: 'Recalculate all totalStock',
      sql: `-- คำนวณ totalStock จาก stock.PTN + RAM + CNX\nUPDATE drugs SET\n  total_stock =\n    COALESCE((data->'stock'->>'PTN')::int,0) +\n    COALESCE((data->'stock'->>'RAM')::int,0) +\n    COALESCE((data->'stock'->>'CNX')::int,0),\n  data = jsonb_set(data, '{totalStock}', to_jsonb(\n    COALESCE((data->'stock'->>'PTN')::int,0) +\n    COALESCE((data->'stock'->>'RAM')::int,0) +\n    COALESCE((data->'stock'->>'CNX')::int,0)\n  ));`,
    },
    {
      labelTH: 'ดูยาที่ไม่มีราคาทุน',
      labelEN: 'Show drugs with no cost price',
      sql: `-- รายการยาที่ยังไม่ได้กรอกราคาทุน\nSELECT data->>'code' AS code,\n       data->>'nameTH' AS name_th,\n       (data->>'costEx')::numeric AS cost_ex\nFROM drugs\nWHERE (data->>'costEx')::numeric = 0 OR data->>'costEx' IS NULL\nORDER BY data->>'code';`,
    },
    {
      labelTH: 'นับยาต่อหมวดหมู่',
      labelEN: 'Drug count per category',
      sql: `-- นับจำนวนยา + สต็อกรวม ต่อหมวดหมู่\nSELECT data->>'catId' AS cat_id,\n       COUNT(*) AS drug_count,\n       SUM((data->>'totalStock')::int) AS total_units\nFROM drugs\nGROUP BY data->>'catId'\nORDER BY drug_count DESC;`,
    },
    {
      labelTH: 'ดู Supplier ที่ nameEN ว่าง',
      labelEN: 'Suppliers missing English name',
      sql: `SELECT id, name, name_en\nFROM suppliers\nWHERE name_en IS NULL OR trim(name_en) = ''\nORDER BY name;`,
    },
    {
      labelTH: 'ดูประวัติการสั่งซื้อล่าสุด 30 รายการ',
      labelEN: 'Last 30 purchase orders',
      sql: `SELECT po_number, branch, supplier_id, status, po_date, grand_total\nFROM purchase_orders\nORDER BY po_date DESC\nLIMIT 30;`,
    },
  ];

  const SETUP_SQL = `-- รัน 1 ครั้งใน Supabase SQL Editor เพื่อเปิดใช้งาน SQL Runner
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result   jsonb;
  n_rows   int;
  trimmed  text;
  user_role text;
BEGIN
  -- ตรวจสิทธิ์: admin เท่านั้น
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  IF user_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  trimmed := lower(trim(regexp_replace(sql, E'^\\s*(--[^\\n]*\\n)*\\s*', '', 'g')));

  IF trimmed LIKE 'select%' OR trimmed LIKE 'with%' THEN
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)),''[]''::jsonb) FROM (%s) t', sql
    ) INTO result;
    RETURN result;
  ELSE
    EXECUTE sql;
    GET DIAGNOSTICS n_rows = ROW_COUNT;
    RETURN jsonb_build_object('rowsAffected', n_rows, 'type', 'write');
  END IF;
END;
$$;

-- อนุญาตให้ authenticated user เรียกได้ (role check อยู่ใน function แล้ว)
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;`;

  const runSql = async () => {
    if (!sqlQuery.trim()) return;
    if (!window.UNI_DB?.enabled) { setSqlError(L('ต้องเชื่อมต่อ Supabase','Supabase not connected')); return; }
    setSqlRunning(true); setSqlResults(null); setSqlError('');
    try {
      const res = await window.UNI_DB.execSql(sqlQuery);
      setSqlResults(res);
    } catch(e) {
      setSqlError(e.message || String(e));
    } finally { setSqlRunning(false); }
  };

  const saveStartupSql = () => {
    try { localStorage.setItem('uni_startup_sql', startupSqlDraft); } catch(e) {}
    setStartupSql(startupSqlDraft);
    notify(L('บันทึก Startup SQL แล้ว — จะรันอัตโนมัติทุกครั้งที่เปิดแอป', 'Startup SQL saved — runs automatically on every app open'), 'ok');
  };
  const clearStartupSql = () => {
    try { localStorage.removeItem('uni_startup_sql'); localStorage.removeItem('uni_startup_sql_last_run'); localStorage.removeItem('uni_startup_sql_last_status'); } catch(e) {}
    setStartupSql(''); setStartupSqlDraft(''); setStartupLastRun(''); setStartupLastStatus('');
    notify(L('ลบ Startup SQL แล้ว', 'Startup SQL cleared'), 'ok');
  };
  const testStartupSql = async () => {
    if (!startupSqlDraft.trim()) return;
    if (!window.UNI_DB?.enabled) { notify(L('ต้องเชื่อมต่อ Supabase','Supabase not connected'),'err'); return; }
    setSqlRunning(true);
    try {
      const res = await window.UNI_DB.execSql(startupSqlDraft);
      const now = new Date().toISOString();
      try { localStorage.setItem('uni_startup_sql_last_run', now); localStorage.setItem('uni_startup_sql_last_status', 'ok'); } catch(e) {}
      setStartupLastRun(now); setStartupLastStatus('ok');
      notify(L(`ทดสอบสำเร็จ — ${res.rowsAffected} แถว`, `Test OK — ${res.rowsAffected} rows`), 'ok');
    } catch(e) {
      const msg = 'error: ' + (e.message || String(e));
      try { localStorage.setItem('uni_startup_sql_last_status', msg); } catch(_) {}
      setStartupLastStatus(msg);
      notify(L('เกิดข้อผิดพลาด: ' + e.message, 'Error: ' + e.message), 'err');
    } finally { setSqlRunning(false); }
  };

  const STARTUP_TEMPLATES = [
    {
      labelTH: 'อัปเดตสต็อกจากตารางคลัง warehouse_stock',
      labelEN: 'Update stock from warehouse_stock table',
      desc: L('ใช้เมื่อคลังเก็บข้อมูลไว้ใน Supabase ตาราง warehouse_stock', 'Use when warehouse data is in Supabase table warehouse_stock'),
      sql: `-- อัปเดตสต็อกยาจากตาราง warehouse_stock ที่คลังอัปเดตไว้
-- ตาราง warehouse_stock ต้องมีคอลัมน์: drug_code, ptn_qty, ram_qty, cnx_qty
UPDATE drugs d
SET
  total_stock = w.ptn_qty + w.ram_qty + w.cnx_qty,
  data = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    d.data,
    '{stock,PTN}', to_jsonb(w.ptn_qty)),
    '{stock,RAM}', to_jsonb(w.ram_qty)),
    '{stock,CNX}', to_jsonb(w.cnx_qty)),
    '{totalStock}', to_jsonb(w.ptn_qty + w.ram_qty + w.cnx_qty))
FROM warehouse_stock w
WHERE d.code = w.drug_code;`,
    },
    {
      labelTH: 'อัปเดตสต็อกสาขาเดียว (PTN)',
      labelEN: 'Update stock for one branch (PTN)',
      desc: L('ตัวอย่างสำหรับอัปเดตสต็อกสาขาประตูน้ำ', 'Example for updating Pratu Nam branch stock'),
      sql: `-- ตัวอย่าง: อัปเดตสต็อก PTN จากตารางคลัง
-- แก้ชื่อตารางและคอลัมน์ให้ตรงกับระบบคลังของคุณ
UPDATE drugs d
SET
  data = jsonb_set(data, '{stock,PTN}', to_jsonb(w.qty)),
  total_stock = COALESCE((d.data->'stock'->>'RAM')::int,0)
              + COALESCE((d.data->'stock'->>'CNX')::int,0)
              + w.qty
FROM your_warehouse_table w
WHERE d.code = w.product_code
  AND w.location = 'PTN';`,
    },
    {
      labelTH: 'อัปเดตราคาทุนจากคลัง',
      labelEN: 'Update cost prices from warehouse',
      desc: L('ดึงราคาทุนล่าสุดจากระบบคลัง', 'Pull latest cost prices from warehouse system'),
      sql: `-- อัปเดตราคาทุนจากตาราง price_list ของคลัง
-- ตาราง price_list ต้องมีคอลัมน์: drug_code, unit_cost
UPDATE drugs d
SET
  cost_ex   = p.unit_cost,
  data = jsonb_set(data, '{costEx}', to_jsonb(p.unit_cost))
FROM price_list p
WHERE d.code = p.drug_code;`,
    },
    {
      labelTH: 'ดูข้อมูลล่าสุดจากคลัง (SELECT)',
      labelEN: 'Check latest warehouse data (SELECT)',
      desc: L('ดูว่าตารางคลังมีข้อมูลอะไรบ้าง ก่อนตั้งค่า startup', 'Check what data is in the warehouse table before configuring startup'),
      sql: `-- เปลี่ยน warehouse_stock เป็นชื่อตารางของคลังคุณ
SELECT * FROM warehouse_stock
ORDER BY updated_at DESC
LIMIT 20;`,
    },
  ];

  const TABS = [
    { id:'sheets',  icon:'📊', th:'Google Sheets',   en:'Google Sheets'  },
    { id:'upload',  icon:'📁', th:'อัปโหลดไฟล์',    en:'Upload File'    },
    { id:'sql',     icon:'🗄', th:'SQL Sync',         en:'SQL Sync'       },
    { id:'history', icon:'🕐', th:'ประวัติการ Sync', en:'Sync History'   },
    { id:'guide',   icon:'📋', th:'วิธีตั้งค่า',    en:'Setup Guide'    },
  ];

  const aliases = sheetType==='drugs' ? DRUG_ALIASES : SUP_ALIASES;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">🔄 {L('ซิงค์ข้อมูล', 'Data Sync')}</div>
          <div className="page-subtitle">{L('นำเข้าข้อมูลจาก Google Sheets หรืออัปโหลด Excel ทุก 2 เดือน', 'Import data from Google Sheets or upload Excel every 2 months')}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select className="input input-sm" value={sheetType} onChange={e=>{setSheetType(e.target.value);reset();}}>
            <option value="drugs">{L('ฐานข้อมูลยา','Drug Database')}</option>
            <option value="suppliers">{L('ผู้จัดจำหน่าย','Suppliers')}</option>
          </select>
        </div>
      </div>

      <div className="tabs" style={{marginBottom:20}}>
        {TABS.map(t=><button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>{setTab(t.id);reset();}}>{t.icon} {lang==='th'?t.th:t.en}</button>)}
      </div>

      {/* ── STEP INDICATOR ── */}
      {(tab==='sheets'||tab==='upload') && step>1 && step<4 && (
        <div style={{display:'flex',gap:0,marginBottom:20,borderRadius:'var(--r)',overflow:'hidden',border:'1px solid var(--border)'}}>
          {[L('1. แหล่งข้อมูล','1. Source'),L('2. จับคู่คอลัมน์','2. Map Columns'),L('3. ตรวจสอบ','3. Preview')].map((s,i)=>(
            <div key={i} style={{flex:1,padding:'10px 0',textAlign:'center',fontSize:12,fontWeight:700,
              background:step===i+1?'var(--acc)':step>i+1?'var(--ok)':'var(--bg3)',
              color:step>=i+1?'#fff':'var(--txt3)'}}>
              {step>i+1?'✓ ':''}{s}
            </div>
          ))}
        </div>
      )}

      {/* ── GOOGLE SHEETS TAB ── */}
      {tab==='sheets' && step===1 && (
        <div>
          <div className="card" style={{marginBottom:16,borderColor:'rgba(66,133,244,.3)',background:'rgba(66,133,244,.05)'}}>
            <div style={{fontWeight:700,fontSize:14,color:'#4285f4',marginBottom:8}}>📊 {L('เชื่อมต่อ Google Sheets','Connect Google Sheets')}</div>
            <div style={{fontSize:13,color:'var(--txt3)',marginBottom:16,lineHeight:1.8}}>
              {L('แชร์ Google Sheet เป็น Public แล้ววาง URL ด้านล่าง ระบบจะดึงข้อมูลล่าสุดทุกครั้งที่กด Sync','Share your Google Sheet as Public, then paste the URL below. System will fetch the latest data every time you sync.')}
            </div>
            <div className="form-group">
              <label className="label">{L('URL ของ Google Sheets','Google Sheets URL')}</label>
              <input className="input" value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..." />
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center',marginTop:8}}>
              <button className="btn btn-primary" onClick={handleSheetSync} disabled={syncing}>
                {syncing ? L('⏳ กำลังดึงข้อมูล...','⏳ Fetching...') : L('🔄 ดึงข้อมูล','🔄 Fetch Data')}
              </button>
              <span style={{fontSize:12,color:'var(--txt3)'}}>
                {L('กำลังดึง:','Fetching:')} {sheetType==='drugs'?L('ฐานข้อมูลยา','Drug Database'):L('ผู้จัดจำหน่าย','Suppliers')}
              </span>
            </div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>💡 {L('คอลัมน์ที่รองรับในชีต','Supported columns in sheet')}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {Object.keys(aliases).map(k=><span key={k} style={{background:'var(--bg3)',borderRadius:4,padding:'2px 8px',fontSize:11,fontFamily:'monospace',color:'var(--acc2)'}}>{k}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* ── FILE UPLOAD TAB ── */}
      {tab==='upload' && step===1 && (
        <div>
          <div className="card" style={{marginBottom:16}}
            onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--acc)'}}
            onDragLeave={e=>{e.currentTarget.style.borderColor=''}}
            onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='';const f=e.dataTransfer.files[0];if(f)handleFile(f);}}>
            <div style={{textAlign:'center',padding:'32px 0'}}>
              <div style={{fontSize:48,marginBottom:12}}>📁</div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{L('ลากไฟล์มาวางที่นี่','Drag & Drop file here')}</div>
              <div style={{fontSize:13,color:'var(--txt3)',marginBottom:16}}>{L('หรือกดเลือกไฟล์ · รองรับ .xlsx .xls .csv','or click to browse · supports .xlsx .xls .csv')}</div>
              <button className="btn btn-primary" onClick={()=>fileRef.current.click()}>📂 {L('เลือกไฟล์','Choose File')}</button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>downloadTemplate('drugs')}>⬇ {L('ดาวน์โหลด Template ยา','Download Drug Template')}</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>downloadTemplate('suppliers')}>⬇ {L('ดาวน์โหลด Template Supplier','Download Supplier Template')}</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: COLUMN MAPPING ── */}
      {(tab==='sheets'||tab==='upload') && step===2 && colMap && (
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>🗺 {L('จับคู่คอลัมน์','Column Mapping')}</div>
            <div style={{fontSize:13,color:'var(--txt3)',marginBottom:16}}>
              {L(`พบ ${rawRows?.length} แถวข้อมูล · ระบุว่าคอลัมน์ใดในไฟล์ตรงกับฟิลด์ใดในระบบ`,
                 `Found ${rawRows?.length} data rows · Map columns from your file to system fields`)}
            </div>
            <div className="grid-2">
              {Object.keys(aliases).map(field => (
                <div key={field} className="form-group" style={{margin:0,marginBottom:10}}>
                  <label className="label" style={{color:['code','nameTH','nameEN','costEx','sellEx'].includes(field)?'var(--err)':'var(--txt3)'}}>
                    {field}{['code','nameTH','nameEN','costEx','sellEx'].includes(field)?' *':''}
                  </label>
                  <select className="input input-sm" value={colMap[field]||''} onChange={e=>setColMap(m=>({...m,[field]:e.target.value}))}>
                    <option value="">— {L('ไม่ใช้','skip')} —</option>
                    {rawHeaders.map(h=><option key={h} value={h}>{h} {rawRows[0]?.[h]?`(${String(rawRows[0][h]).slice(0,20)})`:''}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-ghost" onClick={reset}>{L('← ย้อนกลับ','← Back')}</button>
            <button className="btn btn-primary" onClick={generatePreview}>👁 {L('ตรวจสอบข้อมูล','Preview Data')}</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PREVIEW ── */}
      {(tab==='sheets'||tab==='upload') && step===3 && preview && (
        <div>
          <div className="card" style={{marginBottom:16,borderColor:'rgba(22,163,74,.3)',background:'var(--ok-bg)'}}>
            <div style={{fontWeight:700,fontSize:14,color:'var(--ok)'}}>
              ✓ {L(`พบข้อมูลทั้งหมด ${preview.length} รายการ พร้อมนำเข้า`,`Found ${preview.length} items ready to import`)}
            </div>
            <div style={{fontSize:13,color:'var(--txt3)',marginTop:4}}>
              {L('กด "นำเข้าข้อมูล" เพื่อบันทึก (จะ Merge กับข้อมูลเดิม ไม่ลบข้อมูลที่มีอยู่)',
                 'Click "Import" to save — will merge with existing data, existing records not deleted')}
            </div>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
            <div className="tbl-wrap" style={{border:'none',maxHeight:300}}>
              <table>
                <thead>
                  <tr>
                    {sheetType==='drugs'
                      ? ['#','Code','ชื่อไทย','Unit','Cat','Cost','Sell','Stock PTN/RAM/CNX'].map(h=><th key={h}>{h}</th>)
                      : ['#','ID','ชื่อ','ผู้ติดต่อ','โทร','เครดิต'].map(h=><th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0,30).map((item,i)=>(
                    <tr key={i}>
                      <td style={{color:'var(--txt3)',fontSize:11}}>{i+1}</td>
                      {sheetType==='drugs'?<>
                        <td style={{fontFamily:'monospace',fontSize:11,color:'var(--acc2)'}}>{item.code}</td>
                        <td style={{fontSize:12}}>{item.nameTH}</td>
                        <td style={{fontSize:11,color:'var(--txt3)'}}>{item.unit}</td>
                        <td style={{fontSize:11}}>{item.catId}</td>
                        <td style={{textAlign:'right',fontSize:12}}>{UTILS.fmt(item.costEx)}</td>
                        <td style={{textAlign:'right',fontSize:12}}>{UTILS.fmt(item.sellEx)}</td>
                        <td style={{fontSize:11,color:'var(--txt3)'}}>{item.stock.PTN}/{item.stock.RAM}/{item.stock.CNX}</td>
                      </>:<>
                        <td style={{fontFamily:'monospace',fontSize:11,color:'var(--acc2)'}}>{item.id}</td>
                        <td style={{fontSize:12}}>{item.name}</td>
                        <td style={{fontSize:12}}>{item.contact}</td>
                        <td style={{fontSize:12}}>{item.phone}</td>
                        <td style={{fontSize:12}}>{item.creditTerm}d</td>
                      </>}
                    </tr>
                  ))}
                  {preview.length>30&&<tr><td colSpan={8} style={{textAlign:'center',color:'var(--txt3)',fontSize:12}}>... +{preview.length-30} {L('รายการอื่น','more items')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-ghost" onClick={()=>setStep(2)}>{L('← แก้ Mapping','← Fix Mapping')}</button>
            {perm.role === 'admin'
              ? <button className="btn btn-primary" onClick={commitImport}>✅ {L('นำเข้าข้อมูล','Import Data')}</button>
              : <span className="text-muted" style={{fontSize:12,alignSelf:'center'}}>{L('เฉพาะผู้ดูแลระบบเท่านั้นที่นำเข้าข้อมูลได้','Only admins can import data')}</span>}
          </div>
        </div>
      )}

      {/* ── STEP 4: DONE ── */}
      {(tab==='sheets'||tab==='upload') && step===4 && (
        <div className="card" style={{textAlign:'center',padding:40}}>
          <div style={{fontSize:52,marginBottom:12}}>🎉</div>
          <div style={{fontSize:20,fontWeight:800,marginBottom:8,color:'var(--ok)'}}>
            {L('นำเข้าข้อมูลสำเร็จ!','Import Successful!')}
          </div>
          <div style={{fontSize:14,color:'var(--txt3)',marginBottom:20}}>
            {L('ข้อมูลถูกบันทึกในระบบแล้ว ทุกหน้าจะแสดงข้อมูลล่าสุด',
               'Data saved to system. All pages will now show the latest data.')}
          </div>
          <button className="btn btn-primary" onClick={reset}>{L('🔄 Sync อีกครั้ง','🔄 Sync Again')}</button>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab==='history' && (
        <div className="card" style={{padding:0}}>
          {history.length===0
            ? <div className="no-data">{L('ยังไม่มีประวัติการ Sync','No sync history yet')}</div>
            : <div className="tbl-wrap" style={{border:'none'}}>
                <table>
                  <thead><tr><th>{L('วันที่','Date')}</th><th>{L('แหล่งข้อมูล','Source')}</th><th>{L('ประเภท','Type')}</th><th style={{textAlign:'right'}}>{L('จำนวน','Count')}</th></tr></thead>
                  <tbody>
                    {history.map((h,i)=>(
                      <tr key={i}>
                        <td style={{fontSize:12}}>{new Date(h.date).toLocaleString('th-TH')}</td>
                        <td><span className="badge" style={{background:'var(--info-bg)',color:'var(--info)'}}>{h.source}</span></td>
                        <td style={{fontSize:12}}>{h.type}</td>
                        <td style={{textAlign:'right',fontWeight:700,color:'var(--ok)'}}>{h.count?.toLocaleString()} {L('รายการ','items')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {/* ── SQL SYNC TAB ── */}
      {tab==='sql' && (
        <div>
          {/* Sub-tab bar */}
          <div style={{display:'flex',gap:0,marginBottom:16,borderRadius:'var(--r)',overflow:'hidden',border:'1px solid var(--border)'}}>
            {[{id:'export',icon:'📤',th:'Export SQL',en:'Export SQL'},{id:'fixes',icon:'🔧',th:'Quick Fix',en:'Quick Fix'},{id:'snips',icon:'📋',th:'SQL Snippets',en:'Snippets'},{id:'runner',icon:'▶',th:'SQL Runner',en:'SQL Runner'}].map(s=>(
              <button key={s.id} onClick={()=>setSqlSub(s.id)} style={{flex:1,padding:'10px 0',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,
                background:sqlSub===s.id?'var(--acc)':'var(--bg3)',color:sqlSub===s.id?'#fff':'var(--txt3)'}}>
                {s.icon} {lang==='th'?s.th:s.en}
              </button>
            ))}
          </div>

          {/* EXPORT SQL */}
          {sqlSub==='export' && (
            <div>
              <div className="card" style={{marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>📤 {L('Export ข้อมูลเป็น SQL','Export Data as SQL')}</div>
                <div style={{fontSize:13,color:'var(--txt3)',marginBottom:14}}>
                  {L('สร้าง SQL UPSERT จากข้อมูลปัจจุบัน สำหรับนำไปรันใน Supabase SQL Editor','Generate SQL UPSERT from current data — run it in your Supabase SQL Editor')}
                </div>
                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:14,flexWrap:'wrap'}}>
                  <select className="input input-sm" value={sqlExportType} onChange={e=>{setSqlExportType(e.target.value);setSqlOutput('');}}>
                    <option value="drugs">{L(`ยา (${drugs.length} รายการ)`,`Drugs (${drugs.length} items)`)}</option>
                    <option value="suppliers">{L(`Supplier (${suppliers.length} ราย)`,`Suppliers (${suppliers.length} records)`)}</option>
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={generateSqlExport}>⚙ {L('สร้าง SQL','Generate SQL')}</button>
                  {sqlOutput && <>
                    <button className="btn btn-ghost btn-sm" onClick={()=>{navigator.clipboard?.writeText(sqlOutput);notify(L('คัดลอกแล้ว','Copied'),'ok');}}>📋 {L('คัดลอก','Copy')}</button>
                    <button className="btn btn-ghost btn-sm" onClick={downloadSql}>⬇ .sql</button>
                  </>}
                </div>
                {sqlOutput
                  ? <textarea readOnly value={sqlOutput} style={{width:'100%',height:280,fontFamily:'monospace',fontSize:11,padding:12,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r)',color:'var(--txt1)',resize:'vertical',boxSizing:'border-box'}} />
                  : <div style={{textAlign:'center',padding:'28px 0',color:'var(--txt3)',fontSize:13}}>
                      {L('กด "สร้าง SQL" เพื่อสร้าง script','Click "Generate SQL" to create the script')}
                    </div>
                }
              </div>
              <div className="card" style={{background:'var(--info-bg)',borderColor:'rgba(59,130,246,.3)'}}>
                <div style={{fontWeight:700,fontSize:13,color:'var(--info)',marginBottom:8}}>💡 {L('วิธีใช้','How to use')}</div>
                {[
                  L('กด "สร้าง SQL" → คัดลอก SQL ที่สร้างได้','Click "Generate SQL" → copy the generated SQL'),
                  L('ไปที่ Supabase Dashboard → SQL Editor','Go to Supabase Dashboard → SQL Editor'),
                  L('วาง SQL แล้วกด Run (Ctrl+Enter)','Paste the SQL and press Run (Ctrl+Enter)'),
                  L('ข้อมูลจะถูก UPSERT — ไม่ลบข้อมูลเดิม','Data will be UPSERTed — existing data not deleted'),
                ].map((t,i)=><div key={i} style={{fontSize:12,marginBottom:4}}>{i+1}. {t}</div>)}
              </div>
            </div>
          )}

          {/* QUICK FIX */}
          {sqlSub==='fixes' && (
            <div>
              <div style={{fontSize:13,color:'var(--txt3)',marginBottom:16}}>
                {L('ตรวจสอบและแก้ไขข้อมูลอัตโนมัติ — กด Fix เพื่ออัปเดตทั้งในแอปและ Supabase','Detect and auto-fix data issues — click Fix to update both the app and Supabase')}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {SQL_FIXES.map(fix=>{
                  const count = fix.check();
                  return (
                    <div key={fix.id} className="card" style={{display:'flex',alignItems:'center',gap:16,padding:'14px 18px',
                      borderColor:count>0?'rgba(234,179,8,.4)':'rgba(22,163,74,.3)',
                      background:count>0?'rgba(234,179,8,.04)':'var(--ok-bg)'}}>
                      <div style={{fontSize:28,flexShrink:0}}>{fix.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13}}>{lang==='th'?fix.labelTH:fix.labelEN}</div>
                        <div style={{fontSize:12,marginTop:4}}>
                          {count>0
                            ? <span style={{color:'rgba(161,98,7,1)',fontWeight:600}}>{L(`พบ ${count} รายการที่ต้องแก้ไข`,`${count} records need fixing`)}</span>
                            : <span style={{color:'var(--ok)',fontWeight:600}}>✓ {L('ข้อมูลถูกต้องทั้งหมด','All records correct')}</span>}
                        </div>
                      </div>
                      <button className={`btn btn-sm ${count>0?'btn-primary':'btn-ghost'}`}
                        disabled={sqlRunning||count===0}
                        onClick={async()=>{setSqlRunning(true);try{await fix.run();}finally{setSqlRunning(false);}}}>
                        {sqlRunning?'⏳':count>0?`🔧 Fix (${count})`:'✓ OK'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SQL RUNNER */}
          {sqlSub==='runner' && (
            <div>
              {/* ── STARTUP QUERY ── */}
              <div className="card" style={{marginBottom:14, borderColor: startupSql ? 'rgba(22,163,74,.4)' : 'var(--border)', background: startupSql ? 'var(--ok-bg)' : 'var(--bg1)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}} onClick={()=>setStartupSqlOpen(o=>!o)}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:20}}>{startupSql ? '✅' : '⚙'}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:13}}>{L('Startup Query — รันอัตโนมัติทุกครั้งที่เปิดแอป','Startup Query — runs automatically on every app open')}</div>
                      <div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>
                        {startupSql
                          ? (startupLastRun
                              ? L(`รันล่าสุด: ${new Date(startupLastRun).toLocaleString('th-TH')} · ${startupLastStatus==='ok'?'✓ สำเร็จ':'⚠ '+startupLastStatus}`,
                                  `Last run: ${new Date(startupLastRun).toLocaleString('en-US')} · ${startupLastStatus==='ok'?'✓ OK':'⚠ '+startupLastStatus}`)
                              : L('บันทึกแล้ว — ยังไม่เคยรัน','Saved — not yet run'))
                          : L('ยังไม่มี Startup SQL — กดเพื่อตั้งค่า','No startup SQL yet — click to configure')}
                      </div>
                    </div>
                  </div>
                  <span style={{fontSize:12,color:'var(--txt3)'}}>{startupSqlOpen?'▲':'▼'}</span>
                </div>

                {startupSqlOpen && (
                  <div style={{marginTop:14}}>
                    {/* Templates */}
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--txt3)',marginBottom:8}}>📋 {L('เลือก Template (แก้ไขก่อนบันทึก)','Select a template (edit before saving)')}</div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {STARTUP_TEMPLATES.map((t,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--bg3)',borderRadius:'var(--r)',border:'1px solid var(--border)'}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:600}}>{lang==='th'?t.labelTH:t.labelEN}</div>
                              <div style={{fontSize:11,color:'var(--txt3)'}}>{t.desc}</div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={()=>setStartupSqlDraft(t.sql)}>
                              {L('โหลด','Load')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Editor */}
                    <textarea
                      value={startupSqlDraft}
                      onChange={e=>setStartupSqlDraft(e.target.value)}
                      spellCheck={false}
                      style={{width:'100%',height:180,fontFamily:'monospace',fontSize:12,padding:12,
                        background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r)',
                        color:'var(--txt1)',resize:'vertical',boxSizing:'border-box',lineHeight:1.6,marginBottom:10}}
                      placeholder={L('วาง SQL จากระบบคลังที่นี่...','Paste SQL from your warehouse system here...')}
                    />

                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button className="btn btn-primary btn-sm" onClick={saveStartupSql} disabled={!startupSqlDraft.trim()||perm.role!=='admin'}>
                        💾 {L('บันทึก Startup SQL','Save Startup SQL')}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={testStartupSql} disabled={sqlRunning||!startupSqlDraft.trim()||perm.role!=='admin'}>
                        {sqlRunning?'⏳':L('▶ ทดสอบรัน','▶ Test Run')}
                      </button>
                      {startupSql && <button className="btn btn-ghost btn-sm" style={{color:'var(--err)'}} onClick={clearStartupSql}>🗑 {L('ลบ Startup SQL','Clear Startup SQL')}</button>}
                    </div>
                    {perm.role!=='admin' && <div style={{fontSize:11,color:'var(--err)',marginTop:6}}>{L('เฉพาะ Admin เท่านั้นที่แก้ไขได้','Admin only can edit')}</div>}
                  </div>
                )}
              </div>

              {/* Setup card */}
              <div className="card" style={{marginBottom:14,borderColor:'rgba(234,179,8,.4)',background:'rgba(234,179,8,.04)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}} onClick={()=>setSqlSetupOpen(o=>!o)}>
                  <div style={{fontWeight:700,fontSize:13,color:'rgba(161,98,7,1)'}}>
                    ⚙ {L('ตั้งค่าครั้งแรก — สร้าง exec_sql function ใน Supabase','First-time setup — create exec_sql function in Supabase')}
                  </div>
                  <span style={{fontSize:12,color:'var(--txt3)'}}>{sqlSetupOpen?'▲':'▼'}</span>
                </div>
                {sqlSetupOpen && (
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:12,color:'var(--txt3)',marginBottom:10}}>
                      {L('รัน SQL ด้านล่างนี้ 1 ครั้งใน Supabase Dashboard → SQL Editor เพื่อเปิดใช้งาน SQL Runner',
                         'Run the SQL below once in Supabase Dashboard → SQL Editor to enable the SQL Runner')}
                    </div>
                    <pre style={{margin:0,padding:'10px 14px',fontSize:11,fontFamily:'monospace',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'auto',color:'var(--txt2)',whiteSpace:'pre-wrap',wordBreak:'break-all',maxHeight:220}}>
                      {SETUP_SQL}
                    </pre>
                    <button className="btn btn-ghost btn-sm" style={{marginTop:10}}
                      onClick={()=>{navigator.clipboard?.writeText(SETUP_SQL);notify(L('คัดลอก Setup SQL แล้ว','Setup SQL copied'),'ok');}}>
                      📋 {L('คัดลอก Setup SQL','Copy Setup SQL')}
                    </button>
                  </div>
                )}
              </div>

              {/* SQL Editor */}
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>▶ SQL Runner {perm.role!=='admin'&&<span style={{fontSize:11,color:'var(--err)',marginLeft:8}}>({L('เฉพาะ Admin','Admin only')})</span>}</div>
                <textarea
                  value={sqlQuery}
                  onChange={e=>setSqlQuery(e.target.value)}
                  onKeyDown={e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runSql();} }}
                  spellCheck={false}
                  style={{width:'100%',height:160,fontFamily:'monospace',fontSize:12,padding:12,
                    background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r)',
                    color:'var(--txt1)',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}}
                  placeholder="SELECT * FROM drugs LIMIT 10;"
                />
                <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center'}}>
                  <button className="btn btn-primary btn-sm" onClick={runSql} disabled={sqlRunning||perm.role!=='admin'}>
                    {sqlRunning?'⏳ Running…':'▶ Run (Ctrl+Enter)'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setSqlResults(null);setSqlError('');}}>🗑 {L('ล้าง','Clear')}</button>
                  <span style={{fontSize:11,color:'var(--txt3)',marginLeft:'auto'}}>{L('Ctrl+Enter เพื่อรัน','Ctrl+Enter to run')}</span>
                </div>
              </div>

              {/* Error */}
              {sqlError && (
                <div className="card" style={{marginBottom:14,borderColor:'rgba(220,38,38,.4)',background:'var(--err-bg)'}}>
                  <div style={{fontWeight:700,fontSize:13,color:'var(--err)',marginBottom:6}}>❌ Error</div>
                  <pre style={{margin:0,fontSize:12,fontFamily:'monospace',color:'var(--err)',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{sqlError}</pre>
                </div>
              )}

              {/* Results */}
              {sqlResults && !sqlError && (
                <div className="card" style={{padding:0,overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontWeight:700,fontSize:13,color:'var(--ok)'}}>✓ {L('ผลลัพธ์','Results')}</span>
                    {sqlResults.rows.length>0
                      ? <span style={{fontSize:12,color:'var(--txt3)'}}>{sqlResults.rowsAffected.toLocaleString()} {L('แถว','rows')}</span>
                      : <span style={{fontSize:12,color:'var(--ok)'}}>{sqlResults.rowsAffected} {L('แถวที่เปลี่ยนแปลง','rows affected')}</span>
                    }
                    {sqlResults.rows.length>0 && (
                      <button className="btn btn-ghost btn-sm" style={{marginLeft:'auto'}} onClick={()=>{
                        const cols = Object.keys(sqlResults.rows[0]);
                        const csv = [cols.join(','), ...sqlResults.rows.map(r=>cols.map(c=>JSON.stringify(r[c]??'')).join(','))].join('\n');
                        const blob = new Blob([csv],{type:'text/csv'});
                        const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sql_result.csv';a.click();
                      }}>⬇ CSV</button>
                    )}
                  </div>
                  {sqlResults.rows.length>0 ? (
                    <div className="tbl-wrap" style={{border:'none',maxHeight:400}}>
                      <table>
                        <thead>
                          <tr>{Object.keys(sqlResults.rows[0]).map(col=><th key={col} style={{fontSize:11}}>{col}</th>)}</tr>
                        </thead>
                        <tbody>
                          {sqlResults.rows.slice(0,200).map((row,i)=>(
                            <tr key={i}>
                              {Object.values(row).map((v,j)=>(
                                <td key={j} style={{fontSize:11,fontFamily:typeof v==='number'?'monospace':'inherit',textAlign:typeof v==='number'?'right':'left',maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={String(v??'')}>
                                  {v===null?<span style={{color:'var(--txt3)',fontStyle:'italic'}}>null</span>:String(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {sqlResults.rows.length>200&&<tr><td colSpan={99} style={{textAlign:'center',color:'var(--txt3)',fontSize:11}}>… แสดง 200 จาก {sqlResults.rows.length} แถว</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{padding:'20px',textAlign:'center',color:'var(--ok)',fontSize:13,fontWeight:700}}>
                      ✓ {sqlResults.rowsAffected} {L('แถวที่อัปเดต','rows updated')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SQL SNIPPETS */}
          {sqlSub==='snips' && (
            <div>
              <div style={{fontSize:13,color:'var(--txt3)',marginBottom:16}}>
                {L('SQL Query สำเร็จรูป — คัดลอกไปรันใน Supabase SQL Editor ได้เลย','Ready-made SQL queries — copy and run in Supabase SQL Editor')}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {SQL_SNIPPETS.map((snip,i)=>(
                  <div key={i} className="card" style={{padding:0,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg3)'}}>
                      <span style={{fontWeight:700,fontSize:13}}>{lang==='th'?snip.labelTH:snip.labelEN}</span>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-ghost btn-sm"
                          onClick={()=>{navigator.clipboard?.writeText(snip.sql);notify(L('คัดลอกแล้ว','Copied'),'ok');}}>
                          📋 {L('คัดลอก','Copy')}
                        </button>
                        <button className="btn btn-primary btn-sm"
                          onClick={()=>{setSqlQuery(snip.sql);setSqlSub('runner');setSqlResults(null);setSqlError('');}}>
                          ▶ Run
                        </button>
                      </div>
                    </div>
                    <pre style={{margin:0,padding:'12px 14px',fontSize:11,fontFamily:'monospace',overflow:'auto',color:'var(--txt2)',background:'var(--bg1)',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
                      {snip.sql}
                    </pre>
                  </div>
                ))}
              </div>
              <div className="card" style={{marginTop:12,background:'var(--info-bg)',borderColor:'rgba(59,130,246,.3)'}}>
                <div style={{fontWeight:700,fontSize:13,color:'var(--info)',marginBottom:6}}>📍 {L('วิธีรัน SQL','How to run SQL')}</div>
                <div style={{fontSize:12,color:'var(--txt3)'}}>{L('ไปที่ Supabase Dashboard → SQL Editor → วาง SQL แล้วกด Run (Ctrl+Enter)','Go to Supabase Dashboard → SQL Editor → paste SQL and press Run (Ctrl+Enter)')}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GUIDE TAB ── */}
      {tab==='guide' && (
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:16,color:'var(--acc)'}}>📊 {L('วิธีตั้งค่า Google Sheets','How to Set Up Google Sheets')}</div>
            {[
              [L('สร้าง Google Sheet ใหม่','Create a new Google Sheet'),L('ไปที่ sheets.google.com → สร้างชีตใหม่','Go to sheets.google.com → create new sheet')],
              [L('ใส่ Header ตามฟอร์แมต','Add headers in the correct format'),L('ดาวน์โหลด Template เพื่อดูฟอร์แมตที่ถูกต้อง','Download the Template to see the correct format')],
              [L('กรอกข้อมูลยา / Supplier','Fill in drug / supplier data'),L('คัดลอกจาก Excel เดิม หรือกรอกข้อมูลใหม่','Copy from existing Excel or enter new data')],
              [L('แชร์เป็น Public','Share as Public'),L('File → Share → Share with others → Anyone with the link → Viewer','File → Share → Share with others → Anyone with the link → Viewer')],
              [L('คัดลอก URL แล้ววางในระบบ','Copy URL and paste in the system'),L('คัดลอก URL จาก Address Bar แล้ววางในช่อง Google Sheets URL ในระบบ','Copy URL from address bar, paste in the Google Sheets URL field')],
              [L('กด "ดึงข้อมูล" แล้วจับคู่คอลัมน์','Click "Fetch Data" and map columns'),L('ระบบจะดึงข้อมูลอัตโนมัติและแนะนำการจับคู่คอลัมน์','System auto-fetches and suggests column mapping')],
              [L('ทำซ้ำทุก 2 เดือน','Repeat every 2 months'),L('อัปเดตข้อมูลใน Sheet แล้วกด Sync ใหม่ ระบบจะ Merge ข้อมูลเก่าและใหม่','Update data in Sheet and click Sync — system merges old and new data')],
            ].map(([title,desc],i)=>(
              <div key={i} style={{display:'flex',gap:14,padding:'10px 0',borderBottom:'1px solid var(--border)',alignItems:'flex-start'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'var(--acc)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,flexShrink:0}}>{i+1}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:13}}>{title}</div>
                  <div style={{fontSize:12,color:'var(--txt3)',marginTop:2}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid-2">
            <div className="card" style={{borderColor:'rgba(22,163,74,.3)',background:'var(--ok-bg)'}}>
              <div style={{fontWeight:700,color:'var(--ok)',marginBottom:8}}>✅ {L('ทำได้','What works')}</div>
              {[L('ดึงข้อมูลจาก Sheet ที่ Share เป็น Public','Fetch from publicly shared Sheet'),L('Merge ข้อมูลใหม่กับข้อมูลเดิม (ไม่ลบ)','Merge new data without deleting existing'),L('ตรวจสอบก่อน Import (Preview)','Preview before importing'),L('รองรับ Excel .xlsx และ CSV','Supports Excel .xlsx and CSV'),L('จับคู่คอลัมน์อัตโนมัติ','Auto column mapping')].map(t=><div key={t} style={{fontSize:12,marginBottom:4}}>✓ {t}</div>)}
            </div>
            <div className="card" style={{borderColor:'rgba(220,38,38,.3)',background:'var(--err-bg)'}}>
              <div style={{fontWeight:700,color:'var(--err)',marginBottom:8}}>⚠ {L('ข้อจำกัด','Limitations')}</div>
              {[L('Sheet ต้อง Share เป็น Public จึงจะดึงได้','Sheet must be publicly shared to fetch'),L('ไม่รองรับการเขียนกลับไปยัง Sheet (Read-only)','Cannot write back to Sheet (read-only)'),L('ต้อง Sync ด้วยตนเอง (ไม่ Auto)','Manual sync required (not automatic)'),L('ข้อมูลบันทึกใน Browser ไม่ Sync ข้ามเครื่อง','Data in browser only, not cross-device sync')].map(t=><div key={t} style={{fontSize:12,marginBottom:4}}>✗ {t}</div>)}
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:12}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>downloadTemplate('drugs')}>⬇ Drug Template (.csv)</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>downloadTemplate('suppliers')}>⬇ Supplier Template (.csv)</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DataSyncPage });
