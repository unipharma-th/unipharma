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

function parseDrugs(rows, map, cats) {
  return rows.filter(r => map.code && r[map.code]).map(r => {
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
    const matchedCat = cats.find(c=>c.name===catRaw||c.nameEN===catRaw||c.id===catRaw);
    let catId = matchedCat?.id, subId;
    if (matchedCat) {
      const ms = (matchedCat.subs||[]).find(s=>s.name===subRaw||s.nameEN===subRaw||s.id===subRaw);
      subId = ms?.id || matchedCat.subs?.[0]?.id;
    } else if (subRaw) {
      // sub given but main not matched → find the category that owns this sub
      for (const c of cats) { const ms=(c.subs||[]).find(s=>s.name===subRaw||s.nameEN===subRaw||s.id===subRaw); if(ms){catId=c.id;subId=ms.id;break;} }
    }
    catId = catId || 'CAT01'; subId = subId || 'S0101';
    return {
      code, nameTH: r[map.nameTH]||code, nameEN: r[map.nameEN]||code,
      unit: r[map.unit]||'เม็ด', catId, subId,
      hasVat, vatRate: hasVat?7:0, costEx, costInc: hasVat?+(costEx*1.07).toFixed(2):costEx,
      sellEx, sellInc: hasVat?+(sellEx*1.07).toFixed(2):sellEx,
      profitEx, profitMargin, stock:{PTN:sPTN,RAM:sRAM,CNX:sCNX},
      totalStock:sPTN+sRAM+sCNX, minStock:parseInt(r[map.minStock])||100,
      supplierId: r[map.supplierId]||'SUP001', orderCount:0,
      lastOrdered: new Date().toISOString().split('T')[0]
    };
  });
}

function parseSuppliers(rows, map) {
  return rows.filter(r=>map.id&&r[map.id]).map(r=>({
    id:r[map.id]?.trim()||('SUP'+Date.now()),
    code:'', name:r[map.name]||'', nameEN:r[map.nameEN]||r[map.name]||'',
    contact:r[map.contact]||'', phone:r[map.phone]||'', email:r[map.email]||'',
    taxId:r[map.taxId]||'', creditTerm:parseInt(r[map.creditTerm])||30,
    deliveryDays:parseInt(r[map.deliveryDays])||3, rating:parseFloat(r[map.rating])||4.0,
    minOrder:parseInt(r[map.minOrder])||5000, address:r[map.address]||'',
    category:r[map.category]||'ยาทั่วไป', promotions:[], drugs:[]
  }));
}

/* ─── Template CSV generator ─── */
function downloadTemplate(type) {
  const headers = type === 'drugs'
    ? 'code,nameTH,nameEN,unit,catId,subId,hasVat,costEx,sellEx,stockPTN,stockRAM,stockCNX,minStock,supplierId\n'
    : 'id,name,nameEN,contact,phone,email,taxId,creditTerm,deliveryDays,rating,address,category,minOrder\n';
  const sample = type === 'drugs'
    ? 'AMX001,อะม็อกซิซิลลิน 500มก.,Amoxicillin 500mg,เม็ด,โรคติดเชื้อ,ยาปฏิชีวนะ,0,18,38,500,400,300,100,SUP001\n'
    : 'SUP001,บริษัท ตัวอย่าง จำกัด,Sample Co. Ltd.,คุณ A,02-000-0000,sample@email.com,0000000000000,30,3,4.5,กรุงเทพ,ยาทั่วไป,5000\n';
  const blob = new Blob([headers+sample], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`template_${type}.csv`; a.click();
  URL.revokeObjectURL(url);
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

  const TABS = [
    { id:'sheets', icon:'📊', th:'Google Sheets', en:'Google Sheets' },
    { id:'upload', icon:'📁', th:'อัปโหลดไฟล์', en:'Upload File' },
    { id:'history', icon:'🕐', th:'ประวัติการ Sync', en:'Sync History' },
    { id:'guide', icon:'📋', th:'วิธีตั้งค่า', en:'Setup Guide' },
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
