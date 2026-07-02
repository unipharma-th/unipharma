const { useState, useEffect, useMemo, useRef, useCallback } = React;


/* ===== config.js ===== */
// ============================================================
// UNIPHARMA — Cloud configuration
// ============================================================
// Leave both values empty to run fully OFFLINE (data stays in this
// browser's localStorage — exactly how the app works today).
//
// To enable the shared Supabase database across all 3 branches:
//   1. Create a free project at https://supabase.com
//   2. Run database/schema.sql in the Supabase SQL Editor
//   3. Project Settings → API → copy "Project URL" and the "anon public" key
//   4. Paste them below and re-deploy.
//
// NOTE: the anon key is meant to be public (safe to ship in the browser).
// Keep your site URL private to limit who can reach the data.
// ============================================================
window.UNI_CONFIG = {
  SUPABASE_URL: "https://vgrhhjvcctdvbbhqhvtw.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncmhoanZjY3RkdmJiaHFodnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDMyMjAsImV4cCI6MjA5NzAxOTIyMH0.JNlXAE3Nbqx8QU7wr7RSUfa_DhILHt7mvaTAScPkedo",

  // Set to true ONLY after you have:
  //   1. run database/auth.sql in Supabase,
  //   2. created at least one user (Authentication → Users → Add user),
  //   3. promoted it to admin (see bottom of auth.sql).
  // While false, the app works without login (anyone with the link, current behavior).
  REQUIRE_LOGIN: false, // TEMP disabled — re-enable after Supabase connection restored
};


/* ===== data.js ===== */
// UNIPHARMA Purchasing Management — Mock Data
const DB = (() => {
  const BRANCHES = [
    { id:'PTN', code:'00', name:'สาขาประตูน้ำ',   nameEN:'Pratu Nam',      color:'#1177cc',
      address:'491/4 ถนนราชปรารภ แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ 10400',
      addressEN:'491/4 Ratchaprarop Rd, Makkasan, Ratchathewi, Bangkok 10400',
      openTime:'8:00–21:00', phone:'080 005 5690' },
    { id:'RAM', code:'01', name:'สาขารามคำแหง',  nameEN:'Ramkhamhaeng',   color:'#06b6d4',
      address:'2041/4 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240',
      addressEN:'2041/4 Ramkhamhaeng Rd, Hua Mak, Bang Kapi, Bangkok 10240',
      openTime:'10:00–19:00', phone:'092 938 1325' },
    { id:'CNX', code:'02', name:'สาขาเชียงใหม่',  nameEN:'Chiang Mai',     color:'#16a34a',
      address:'ถนนท่าแพ ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50100',
      addressEN:'Tha Phae Road, Chang Khlan, Mueang Chiang Mai, Chiang Mai 50100',
      openTime:'10:00–19:00', phone:'092 530 3160' }
  ];

  const CATEGORIES = [
    { id:'CAT01', name:'โรคหัวใจและหลอดเลือด', nameEN:'Cardiovascular Disease (CVD)', color:'#f87171',
      subs:[{id:'S0101',name:'ยาลดความดันโลหิต',nameEN:'Antihypertensives'},
            {id:'S0102',name:'ยาลดไขมันในเลือด',nameEN:'Lipid-Lowering Agents'},
            {id:'S0103',name:'ยาต้านการแข็งตัวของเลือด',nameEN:'Anticoagulants'},
            {id:'S0104',name:'ยาต้านเกล็ดเลือด',nameEN:'Antiplatelet Agents'},
            {id:'S0105',name:'ยาขับปัสสาวะ',nameEN:'Diuretics'}] },
    { id:'CAT02', name:'โรคติดเชื้อ', nameEN:'Infectious Disease', color:'#fb923c',
      subs:[{id:'S0201',name:'ยาปฏิชีวนะ',nameEN:'Antibiotics'},
            {id:'S0202',name:'ยาต้านไวรัส',nameEN:'Antivirals'},
            {id:'S0203',name:'ยาต้านเชื้อรา',nameEN:'Antifungals'},
            {id:'S0204',name:'ยาต้านปรสิต',nameEN:'Antiparasitic Agents'}] },
    { id:'CAT03', name:'โรคระบบทางเดินหายใจ', nameEN:'Respiratory Disease', color:'#22d3ee',
      subs:[{id:'S0301',name:'ยาขยายหลอดลม',nameEN:'Bronchodilators'},
            {id:'S0302',name:'ยาสูดพ่นสเตียรอยด์',nameEN:'Inhaled Corticosteroids'},
            {id:'S0303',name:'ยาแก้ไอ/ละลายเสมหะ',nameEN:'Antitussives / Mucolytics'},
            {id:'S0304',name:'ยาแก้แพ้',nameEN:'Antihistamines'}] },
    { id:'CAT04', name:'โรคเบาหวานและต่อมไร้ท่อ', nameEN:'Diabetes & Endocrinology', color:'#c084fc',
      subs:[{id:'S0401',name:'ยาลดน้ำตาลในเลือด',nameEN:'Antidiabetics / Hypoglycemics'},
            {id:'S0402',name:'อินซูลิน',nameEN:'Insulin'},
            {id:'S0403',name:'ยาไทรอยด์',nameEN:'Thyroid Agents'},
            {id:'S0404',name:'ยาคุมกำเนิด',nameEN:'Contraception'},
            {id:'S0405',name:'ยาฮอร์โมน',nameEN:'Hormonal Therapy'}] },
    { id:'CAT05', name:'โรคระบบทางเดินอาหาร', nameEN:'Gastrointestinal Diseases', color:'#4ade80',
      subs:[{id:'S0501',name:'ยาลดกรด/ยาแผลกระเพาะ',nameEN:'Antacids / Antiulcer Agents'},
            {id:'S0502',name:'ยาแก้ท้องเสีย',nameEN:'Antidiarrheals'},
            {id:'S0503',name:'ยาระบาย',nameEN:'Laxatives'},
            {id:'S0504',name:'ยาแก้คลื่นไส้/อาเจียน',nameEN:'Antiemetics'},
            {id:'S0505',name:'โรคลำไส้แปรปรวน',nameEN:'Irritable Bowel Syndrome'},
            {id:'S0506',name:'โรคริดสีดวงทวาร',nameEN:'Hemorrhoids'},
            {id:'S0507',name:'ยาบำรุงตับ',nameEN:'Liver Medication'}] },
    { id:'CAT06', name:'โรคระบบประสาทและจิตเวช', nameEN:'Neurological & Psychiatric Disorders', color:'#818cf8',
      subs:[{id:'S0601',name:'ยาแก้ปวด/ลดไข้',nameEN:'Analgesics / Antipyretics'},
            {id:'S0602',name:'ยากันชัก',nameEN:'Antiepileptics'},
            {id:'S0603',name:'ยาต้านซึมเศร้า',nameEN:'Antidepressants'},
            {id:'S0604',name:'ยาคลายกังวล/ยานอนหลับ',nameEN:'Anxiolytics / Sedatives'},
            {id:'S0605',name:'ยารักษาโรคจิต',nameEN:'Antipsychotics'},
            {id:'S0606',name:'ยารักษาพาร์กินสัน',nameEN:'Anti-Parkinson Agents'},
            {id:'S0607',name:'ยารักษาอัลไซเมอร์',nameEN:"Alzheimer's Disease"}] },
    { id:'CAT07', name:'โรคมะเร็ง', nameEN:'Malignant Tumors / Oncology', color:'#f472b6',
      subs:[{id:'S0701',name:'ยาเคมีบำบัด',nameEN:'Chemotherapy Agents'},
            {id:'S0702',name:'ยามุ่งเป้า',nameEN:'Targeted Therapy'},
            {id:'S0703',name:'ยาภูมิคุ้มกันบำบัด',nameEN:'Immunotherapy'},
            {id:'S0704',name:'ยาฮอร์โมน',nameEN:'Hormonal Therapy'}] },
    { id:'CAT08', name:'โรคภูมิคุ้มกันและภูมิแพ้', nameEN:'Allergy & Immunology', color:'#fbbf24',
      subs:[{id:'S0801',name:'ยากดภูมิคุ้มกัน',nameEN:'Immunosuppressants'},
            {id:'S0802',name:'ยาแก้แพ้/อีพิเนฟริน',nameEN:'Antiallergics / Epinephrine'}] },
    { id:'CAT09', name:'โรคกระดูกและข้อ', nameEN:'Orthopedic Diseases', color:'#a3e635',
      subs:[{id:'S0901',name:'ยาแก้อักเสบ/ปวดข้อ',nameEN:'Anti-inflammatory / Analgesics'},
            {id:'S0902',name:'ยารักษาโรคเกาต์',nameEN:'Antigout Agents'},
            {id:'S0903',name:'ยาป้องกันกระดูกพรุน',nameEN:'Osteoporosis Agents'}] },
    { id:'CAT10', name:'ยาจำหน่ายหน้าเคาเตอร์', nameEN:'OTC Drugs (Over-the-Counter)', color:'#2dd4bf',
      subs:[{id:'S1001',name:'ยาแก้ปวด/พาราเซตามอล',nameEN:'Analgesics / Paracetamol (OTC)'},
            {id:'S1002',name:'ยาแก้ท้องเสีย OTC',nameEN:'Antidiarrheals (OTC)'},
            {id:'S1003',name:'ยาแก้ไอ OTC',nameEN:'Cough Remedies (OTC)'},
            {id:'S1004',name:'ยาแก้เมารถ/เรือ',nameEN:'Motion Sickness Medication'},
            {id:'S1005',name:'ยาขับลม/ลดแก๊ส',nameEN:'Carminatives / Antiflatulents'},
            {id:'S1006',name:'ยาแก้ท้องเฟ้อ/อาหารไม่ย่อย',nameEN:'Digestive Aids (OTC)'},
            {id:'S1007',name:'เวชสำอาง',nameEN:'Cosmeceutical'}] },
    { id:'CAT11', name:'โรคตา', nameEN:'Ophthalmic', color:'#60a5fa',
      subs:[{id:'S1101',name:'ยาหยอดตา',nameEN:'Eye Drops'},
            {id:'S1102',name:'ยาป้ายตา',nameEN:'Eye Ointments'},
            {id:'S1103',name:'อุปกรณ์ตา',nameEN:'Ophthalmic Devices'}] },
    { id:'CAT12', name:'โรคไต', nameEN:'Kidney Medications', color:'#38bdf8',
      subs:[{id:'S1201',name:'ยาบำรุงไต',nameEN:'Renal Protective Agents'},
            {id:'S1202',name:'ยาลดของเสียในเลือด',nameEN:'Uremic Toxin Reducers'}] },
    { id:'CAT13', name:'เวชภัณฑ์ทางการแพทย์', nameEN:'Medical Supplies', color:'#94a3b8',
      subs:[{id:'S1301',name:'อุปกรณ์การแพทย์',nameEN:'Medical Devices'},
            {id:'S1302',name:'วัสดุสิ้นเปลือง',nameEN:'Consumable Supplies'},
            {id:'S1303',name:'เครื่องมือตรวจวัด',nameEN:'Diagnostic Equipment'}] },
    { id:'CAT14', name:'อาหารเสริมและวิตามิน', nameEN:'Supplements & Vitamins', color:'#34d399',
      subs:[{id:'S1401',name:'วิตามินรวม',nameEN:'Multivitamins'},
            {id:'S1402',name:'แร่ธาตุ',nameEN:'Minerals'},
            {id:'S1403',name:'อาหารเสริมทั่วไป',nameEN:'General Supplements'}] },
    { id:'CAT15', name:'อุปกรณ์ที่ไม่จัดหมวดหมู่', nameEN:'Uncategorized Equipment', color:'#cbd5e1',
      subs:[{id:'S1501',name:'ของแถม',nameEN:'Freebie / Complimentary Gift'},
            {id:'S1502',name:'สินค้าเบ็ดเตล็ด',nameEN:'Miscellaneous Items'}] }
  ];

  // Drug records loaded synchronously from drugs.json (faster than inline JS parse)
  const R = (() => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'drugs.json', false);
      xhr.send();
      return JSON.parse(xhr.responseText);
    } catch(e) { console.warn('[DB] drugs.json load failed:', e); return []; }
  })();

  const DRUGS = R.map(d=>{
    const [code,nameTH,nameEN,unit,catId,subId,hasVatN,costEx,sellEx,sPTN,sRAM,sCNX,minStock,supplierId,orderCount,cPTN,cRAM,cCNX]=d;
    const hasVat=!!hasVatN; const vatRate=hasVat?7:0;
    const costInc=hasVat?+(costEx*1.07).toFixed(2):costEx;
    const sellInc=hasVat?+(sellEx*1.07).toFixed(2):sellEx;
    const profitEx=+(sellEx-costEx).toFixed(2);
    const profitMargin=sellEx>0?+((profitEx/sellEx)*100).toFixed(1):0;
    return {code,nameTH,nameEN,unit,catId,subId,hasVat,vatRate,costEx,costInc,sellEx,sellInc,profitEx,profitMargin,
            costByBranch:{PTN:cPTN||null,RAM:cRAM||null,CNX:cCNX||null},
            stock:{PTN:sPTN,RAM:sRAM,CNX:sCNX},totalStock:sPTN+sRAM+sCNX,minStock,supplierId,orderCount};
  });

  const SUPPLIERS = [];
  const COMP_PRICES = {};
  const PURCHASE_ORDERS = [];
  const STOCK_MOVEMENTS = [];

  return {BRANCHES,CATEGORIES,DRUGS,SUPPLIERS,COMP_PRICES,PURCHASE_ORDERS,STOCK_MOVEMENTS};
})();


/* ===== utils.js ===== */
// UNIPHARMA Utility Functions
const UTILS = (() => {
  function fmt(n, d=2){ return Number(n||0).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d}); }
  function fmtDate(s,lang='th'){
    if(!s) return '-';
    const d=new Date(s);
    if(lang==='th'){
      const months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543}`;
    }
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function fmtDateISO(d){ return d.toISOString().split('T')[0]; }

  // Thai number to words
  function numToThaiWords(amount){
    if(isNaN(amount)||amount<0) return '';
    const units=['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
    const digits=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
    function conv(n){
      if(n===0) return '';
      let r='', s=String(Math.round(n)), len=s.length;
      for(let i=0;i<len;i++){
        let d=parseInt(s[i]), pos=len-1-i;
        if(d===0) continue;
        if(pos===1&&d===1) r+='สิบ';
        else if(pos===1&&d===2) r+='ยี่สิบ';
        else if(pos===0&&d===1&&len>1) r+='เอ็ด';
        else r+=digits[d]+(pos>0?units[pos]:'');
      }
      return r;
    }
    const rounded=Math.round(amount*100)/100;
    const intPart=Math.floor(rounded);
    const decPart=Math.round((rounded-intPart)*100);
    let res='';
    if(intPart>=1000000){
      const m=Math.floor(intPart/1000000);
      res+=conv(m)+'ล้าน';
      const rem=intPart%1000000;
      if(rem>0) res+=conv(rem);
    } else { res+=conv(intPart)||'ศูนย์'; }
    res+='บาท';
    if(decPart>0) res+=conv(decPart)+'สตางค์';
    else res+='ถ้วน';
    return res;
  }

  // Generate PO number
  function generatePONumber(branchId, date){
    const branch = DB.BRANCHES.find(b=>b.id===branchId);
    const code = branch ? branch.code : '00';
    const d = date ? new Date(date) : new Date();
    const yy=String(d.getFullYear()).slice(-2);
    const mm=String(d.getMonth()+1).padStart(2,'0');
    const dd=String(d.getDate()).padStart(2,'0');
    const dateStr=yy+mm+dd;
    const key=`po_cnt_${branchId}_${dateStr}`;
    let cnt=(parseInt(localStorage.getItem(key)||'0'))+1;
    localStorage.setItem(key,String(cnt));
    return `PO${code}-${dateStr}-${String(cnt).padStart(3,'0')}`;
  }

  // Status helpers
  const STATUS_MAP = {
    draft:    {th:'ร่าง',en:'Draft',color:'#94a3b8'},
    pending:  {th:'รออนุมัติ',en:'Pending',color:'#fbbf24'},
    approved: {th:'อนุมัติแล้ว',en:'Approved',color:'#38bdf8'},
    completed:{th:'เสร็จสมบูรณ์',en:'Completed',color:'#4ade80'},
    cancelled:{th:'ยกเลิก',en:'Cancelled',color:'#f87171'}
  };
  function statusLabel(s,lang='th'){ return STATUS_MAP[s]?.[lang]||s; }
  function statusColor(s){ return STATUS_MAP[s]?.color||'#94a3b8'; }

  // Rating stars
  function stars(n){ return '★'.repeat(Math.floor(n))+'☆'.repeat(5-Math.floor(n)); }

  // Debounce
  function debounce(fn,ms=300){
    let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); };
  }

  // Category helpers
  function getCat(id){ return DB.CATEGORIES.find(c=>c.id===id)||{name:id,nameEN:id,color:'#94a3b8',subs:[]}; }
  function getSub(catId,subId){ const c=getCat(catId); return c.subs.find(s=>s.id===subId)||{name:subId,nameEN:subId}; }
  function getBranch(id){ return DB.BRANCHES.find(b=>b.id===id)||{name:id,nameEN:id,code:'??'}; }
  let _runtimeSuppliers = [];
  function setRuntimeSuppliers(arr){ _runtimeSuppliers = arr || []; }
  function getSupplier(id){ return _runtimeSuppliers.find(s=>s.id===id)||DB.SUPPLIERS.find(s=>s.id===id)||{name:id,nameEN:id}; }
  function getDrug(code){ return DB.DRUGS.find(d=>d.code===code); }

  // Summary stats
  function calcPOSummary(items){
    let gross=0,vatAmt=0,nonVat=0,taxable=0;
    items.forEach(it=>{
      const lineAmt=it.unitPrice*it.qty*(1-(it.discount||0)/100);
      gross+=lineAmt;
      if(it.vatRate>0){ taxable+=lineAmt; vatAmt+=lineAmt*it.vatRate/100; }
      else { nonVat+=lineAmt; }
    });
    return {gross:+gross.toFixed(2),taxable:+taxable.toFixed(2),nonTaxable:+nonVat.toFixed(2),vat:+vatAmt.toFixed(2),grandTotal:+(gross+vatAmt).toFixed(2)};
  }

  // Low stock drugs across all branches
  function getLowStock(){
    return DB.DRUGS.filter(d=>Object.values(d.stock).some(v=>v<=d.minStock));
  }

  // Monthly totals from PO list (last 6 months)
  function monthlyTotals(orders){
    const months={};
    orders.filter(o=>o.status!=='cancelled'&&o.status!=='draft').forEach(o=>{
      const key=o.poDate.slice(0,7);
      months[key]=(months[key]||0)+o.grandTotal;
    });
    return months;
  }

  // Unit translations
  const UNIT_MAP = {'เม็ด':'Tablet','ขวด':'Bottle','แคปซูล':'Capsule','กระป๋อง':'MDI Inhaler',
    'หลอด':'Tube','ปากกา':'Pen','แพ็ค':'Pack','กล่อง':'Box','เครื่อง':'Unit','ชุด':'Set','อัน':'Piece'};
  function getUnit(u, lang){ return lang==='en' ? (UNIT_MAP[u]||u) : u; }

  // Supplier category translations
  const SUPCAT_MAP = {
    'ยาทั่วไป':'General Medicines','ยาระดับพรีเมียม':'Premium Pharmaceuticals',
    'ยานำเข้า':'Imported Drugs','ยาเฉพาะทาง':'Specialty Drugs',
    'วิตามิน/อาหารเสริม':'Vitamins & Supplements','ยาเฉพาะทางพรีเมียม':'Premium Specialty',
    'อินซูลินและฮอร์โมน':'Insulin & Hormones','อาหารเสริม':'Supplements',
    'อุปกรณ์การแพทย์':'Medical Devices','เครื่องมือวัด':'Measuring Instruments'
  };
  function getSupCat(cat, lang){ return lang==='en' ? (SUPCAT_MAP[cat]||cat) : cat; }

  // Branch name helper
  function getBranchName(id, lang){
    const b = DB.BRANCHES.find(x=>x.id===id);
    if(!b) return id;
    return lang==='en' ? b.nameEN : b.name;
  }

  // Packaging hierarchy by unit type
  // qty = total BASE units contained in 1 of that level (absolute).
  const PKG_MAP = {
    'เม็ด':    { base:'เม็ด',   baseEN:'Tablet',   levels:[{th:'แผง',en:'Strip',  qty:10},{th:'กล่อง',en:'Box',    qty:100},{th:'ลัง',en:'Carton', qty:2400}]},
    'แคปซูล':{ base:'แคปซูล',baseEN:'Capsule', levels:[{th:'แผง',en:'Strip',  qty:10},{th:'กล่อง',en:'Box',    qty:100},{th:'ลัง',en:'Carton', qty:2400}]},
    'ขวด':    { base:'ขวด',   baseEN:'Bottle',   levels:[{th:'แพ็ค',en:'Pack', qty:6},{th:'โหล',en:'Dozen', qty:12},{th:'ลัง',en:'Carton', qty:24}]},
    'กระป๋อง':{ base:'กระป๋อง',baseEN:'MDI',     levels:[{th:'กล่อง',en:'Box',    qty:1},{th:'ลัง',en:'Carton', qty:6}]},
    'หลอด':    { base:'หลอด',   baseEN:'Tube',     levels:[{th:'กล่อง',en:'Box',    qty:1},{th:'ลัง',en:'Carton', qty:12}]},
    'ปากกา':  { base:'ปากกา',  baseEN:'Pen',      levels:[{th:'กล่อง',en:'Box',    qty:5}]},
    'แพ็ค':    { base:'ชิ้น',   baseEN:'Piece',    levels:[{th:'แพ็ค',en:'Pack',   qty:100},{th:'ลัง',en:'Carton', qty:1000}]},
    'กล่อง':    { base:'ชิ้น',   baseEN:'Piece',    levels:[{th:'กล่อง',en:'Box',    qty:100},{th:'ลัง',en:'Carton', qty:1200}]},
    'เครื่อง':  { base:'เครื่อง',  baseEN:'Unit',     levels:[{th:'กล่อง',en:'Box',    qty:1}]},
  };
  function getPackaging(unit, lang, drug){
    // qty = how many BASE units are in 1 of this level (absolute, not nested).
    // e.g. base ขวด, แพ็ค=6 ขวด, โหล=12 ขวด, ลัง=24 ขวด.
    const build = (base, baseEN, levels) => {
      const chain = [{ th: base, en: baseEN || base, qty: 1, cumulative: 1 }];
      levels.forEach(l => chain.push({ ...l, cumulative: (l.qty || 1) }));
      const top = levels.length ? (levels[levels.length - 1].qty || 1) : 1;
      return { base, baseEN: baseEN || base, levels, chain, totalInTop: top };
    };
    // Prefer drug's own custom packaging over defaults
    if(drug && drug.pkgBase && drug.pkgLevels && drug.pkgLevels.length>0){
      return build(drug.pkgBase, drug.pkgBaseEN || drug.pkgBase, drug.pkgLevels);
    }
    // Fall back to default map
    const pkg=PKG_MAP[unit];
    if(!pkg) return null;
    return build(pkg.base, pkg.baseEN, pkg.levels);
  }

  return {fmt,fmtDate,fmtDateISO,numToThaiWords,generatePONumber,statusLabel,statusColor,stars,debounce,
          getCat,getSub,getBranch,getSupplier,setRuntimeSuppliers,getDrug,calcPOSummary,getLowStock,monthlyTotals,
          getUnit,getSupCat,getBranchName,getPackaging};
})();


/* ===== db.js ===== */
// ============================================================
// UNIPHARMA — Cloud data layer (Supabase)  [plain JS, no JSX]
// ------------------------------------------------------------
// Exposes a small async API on window.UNI_DB. If Supabase is not
// configured (config.js empty) or the library failed to load, every
// method is a safe no-op and `enabled` is false — the app then runs
// exactly as before, on localStorage only.
//
// Storage strategy: each entity row keeps its FULL app object in a
// `data` jsonb column, so what we read back is the exact shape the UI
// already uses. We only map a few flat columns for indexing on write.
// ============================================================
(function () {
  var cfg = window.UNI_CONFIG || {};
  var url = (cfg.SUPABASE_URL || "").trim();
  var key = (cfg.SUPABASE_ANON_KEY || "").trim();
  var lib = window.supabase; // supabase-js UMD global
  var client = null;

  if (url && key && lib && typeof lib.createClient === "function") {
    try {
      client = lib.createClient(url, key);
    } catch (e) {
      console.warn("[UNI_DB] Supabase init failed:", e);
      client = null;
    }
  }

  var enabled = !!client;

  // ---- write mappers: app object -> table row ----
  function drugRow(d) {
    return {
      code: d.code, name_th: d.nameTH, name_en: d.nameEN,
      cat_id: d.catId, sub_id: d.subId, supplier_id: d.supplierId,
      has_vat: !!d.hasVat, cost_ex: d.costEx, sell_ex: d.sellEx,
      total_stock: d.totalStock, data: d,
    };
  }
  function supplierRow(s) {
    return {
      id: s.id, code: s.code, name: s.name, name_en: s.nameEN,
      category: s.category, data: s,
    };
  }
  function poRow(p) {
    return {
      id: p.id, po_number: p.poNumber, branch: p.branch,
      supplier_id: p.supplierId, status: p.status, po_date: p.poDate,
      grand_total: p.grandTotal, is_non_po: !!p.isNonPO, data: p,
    };
  }
  function oosRow(r) {
    return {
      id: r.id, product_code: r.productCode || "", product_name: r.productName || "",
      notes: r.notes || "", image: r.image || null, reported_by: r.reportedBy || "",
      period_start: r.periodStart || null, created_at: r.createdAt,
      resolved_at: r.resolvedAt || null, resolved_by: r.resolvedBy || null,
    };
  }
  function oosFromRow(row) {
    return {
      id: row.id, productCode: row.product_code, productName: row.product_name,
      notes: row.notes, image: row.image, reportedBy: row.reported_by,
      periodStart: row.period_start, createdAt: row.created_at,
      resolvedAt: row.resolved_at || null, resolvedBy: row.resolved_by || null,
      timestamp: new Date(row.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
  }
  function categoryRow(c) {
    return { id: c.id, name_th: c.name || "", name_en: c.nameEN || "", color: c.color || null, subs: c.subs || [] };
  }
  function categoryFromRow(row) {
    return { id: row.id, name: row.name_th, nameEN: row.name_en, color: row.color, subs: row.subs || [] };
  }

  // ── IndexedDB helpers for large data (drugs cache ~15 MB, too big for localStorage) ──
  var _idb = null;
  function openIdb() {
    if (_idb) return Promise.resolve(_idb);
    return new Promise(function(resolve) {
      try {
        var req = indexedDB.open('unipharma_cache', 1);
        req.onupgradeneeded = function(e) { e.target.result.createObjectStore('kv'); };
        req.onsuccess = function(e) { _idb = e.target.result; resolve(_idb); };
        req.onerror = function() { resolve(null); };
      } catch(e) { resolve(null); }
    });
  }
  function idbGet(key) {
    return openIdb().then(function(db) {
      if (!db) return null;
      return new Promise(function(resolve) {
        try {
          var r = db.transaction('kv','readonly').objectStore('kv').get(key);
          r.onsuccess = function() { resolve(r.result != null ? r.result : null); };
          r.onerror = function() { resolve(null); };
        } catch(e) { resolve(null); }
      });
    });
  }
  function idbSet(key, value) {
    return openIdb().then(function(db) {
      if (!db) return;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction('kv','readwrite');
          tx.objectStore('kv').put(value, key);
          tx.oncomplete = resolve; tx.onerror = resolve;
        } catch(e) { resolve(); }
      });
    });
  }

  // chunk helper for large bulk upserts (10k+ drugs)
  function chunk(arr, n) {
    var out = [];
    for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  }

  async function selectAll(table) {
    // First, get the total count so we can fetch all pages in parallel
    // (10k+ rows over sequential requests is too slow on first load).
    var size = 1000;
    var head = await client.from(table).select("data", { count: "exact", head: true });
    if (head.error) throw head.error;
    var total = head.count || 0;
    if (total === 0) return [];
    var pages = Math.ceil(total / size);
    var jobs = [];
    for (var p = 0; p < pages; p++) {
      jobs.push(client.from(table).select("data").range(p * size, p * size + size - 1));
    }
    var results = await Promise.all(jobs);
    var all = [];
    for (var i = 0; i < results.length; i++) {
      if (results[i].error) throw results[i].error;
      var rows = results[i].data || [];
      for (var j = 0; j < rows.length; j++) all.push(rows[j].data);
    }
    return all;
  }

  window.UNI_DB = {
    enabled: enabled,
    requireLogin: enabled && !!cfg.REQUIRE_LOGIN,

    // Returns {drugs,suppliers,orders} from the cloud, or null if not
    // enabled / nothing stored yet.
    // Caching strategy:
    //   DRUGS:     IndexedDB 24 h — ~15 MB, too large for localStorage
    //   SUPPLIERS: localStorage 30 min — small, but always-fresh was a major egress driver
    //   ORDERS:    localStorage 10 min — moderate, acceptable staleness
    async loadAll() {
      if (!enabled) return null;

      var DRUG_CACHE_TTL     = 24 * 3600 * 1000;
      var SUPPLIER_CACHE_TTL = 30 * 60  * 1000;
      var ORDER_CACHE_TTL    = 10 * 60  * 1000;
      var now = Date.now();

      // ── Read caches ──────────────────────────────────────────
      var drugsFromCache = null;
      try {
        var drugTs = parseInt(localStorage.getItem('uni_drug_idb_ts') || '0', 10);
        if (drugTs && (now - drugTs) < DRUG_CACHE_TTL) {
          var cd = await idbGet('drugs');
          if (cd && cd.length) {
            console.info('[UNI_DB] drug cache hit (IDB) — ' + cd.length + ' drugs (' + Math.round((now-drugTs)/60000) + 'min old)');
            drugsFromCache = cd;
          }
        }
      } catch(e) { /* IDB miss */ }

      var suppliersFromCache = null;
      try {
        var supTs = parseInt(localStorage.getItem('uni_sup_ts') || '0', 10);
        if (supTs && (now - supTs) < SUPPLIER_CACHE_TTL) {
          var cs = JSON.parse(localStorage.getItem('uni_sup_cache') || 'null');
          if (cs && cs.length) { console.info('[UNI_DB] supplier cache hit'); suppliersFromCache = cs; }
        }
      } catch(e) {}

      var ordersFromCache = null;
      try {
        var ordTs = parseInt(localStorage.getItem('uni_ord_ts') || '0', 10);
        if (ordTs && (now - ordTs) < ORDER_CACHE_TTL) {
          var co = JSON.parse(localStorage.getItem('uni_ord_cache') || 'null');
          if (co && co.length >= 0) { console.info('[UNI_DB] order cache hit'); ordersFromCache = co; }
        }
      } catch(e) {}

      try {
        var drugs, suppliers, orders;
        var needsDrugs     = !drugsFromCache;
        var needsSuppliers = !suppliersFromCache;
        var needsOrders    = !ordersFromCache;

        if (drugsFromCache) {
          // Drug cache hit — check count; run startup SQL only on fresh drug fetch
          var countJobs = [];
          if (needsSuppliers) countJobs.push(selectAll("suppliers")); else countJobs.push(Promise.resolve(suppliersFromCache));
          if (needsOrders)    countJobs.push(selectAll("purchase_orders")); else countJobs.push(Promise.resolve(ordersFromCache));
          countJobs.push(client.from("drugs").select("*", { count: "estimated", head: true }));

          var parallel = await Promise.all(countJobs);
          suppliers = parallel[0]; orders = parallel[1];
          var countRes = parallel[2];
          var remoteCount = (countRes && !countRes.error) ? (countRes.count || 0) : -1;
          var cachedCount = parseInt(localStorage.getItem('uni_drug_count') || '0', 10);

          if (remoteCount >= 0 && remoteCount !== cachedCount) {
            console.info('[UNI_DB] drug count changed (' + cachedCount + ' → ' + remoteCount + '), refreshing');
            var fn = function(d) { var en=(d.nameEN||'').trim(); if(!en||en===d.code)en=(d.nameTH||d.code||''); return en===d.nameEN?d:Object.assign({},d,{nameEN:en}); };
            drugs = (await selectAll("drugs")).map(fn);
            idbSet('drugs', drugs).then(function() {
              try { localStorage.setItem('uni_drug_idb_ts', Date.now().toString()); localStorage.setItem('uni_drug_count', String(drugs.length)); } catch(e) {}
            });
          } else {
            drugs = drugsFromCache;
          }
        } else {
          // Drug cache miss — run startup SQL first
          var startupSql = '';
          try { startupSql = (localStorage.getItem('uni_startup_sql') || '').trim(); } catch(e) {}
          if (startupSql) {
            try {
              var sr = await client.rpc('exec_sql', { sql: startupSql });
              var status = sr.error ? ('error: ' + (sr.error.message || sr.error)) : 'ok';
              try { localStorage.setItem('uni_startup_sql_last_run', new Date().toISOString()); localStorage.setItem('uni_startup_sql_last_status', status); } catch(e) {}
              if (sr.error) console.warn('[UNI_DB] Startup SQL error:', sr.error);
              else console.info('[UNI_DB] Startup SQL executed OK');
            } catch(e) {
              try { localStorage.setItem('uni_startup_sql_last_status', 'error: ' + (e.message || String(e))); } catch(_) {}
              console.warn('[UNI_DB] Startup SQL failed (continuing):', e);
            }
          }

          var fetchJobs = [selectAll("drugs")];
          if (needsSuppliers) fetchJobs.push(selectAll("suppliers")); else fetchJobs.push(Promise.resolve(suppliersFromCache));
          if (needsOrders)    fetchJobs.push(selectAll("purchase_orders")); else fetchJobs.push(Promise.resolve(ordersFromCache));

          var allParts = await Promise.all(fetchJobs);
          var normFn = function(d) { var en=(d.nameEN||'').trim(); if(!en||en===d.code)en=(d.nameTH||d.code||''); return en===d.nameEN?d:Object.assign({},d,{nameEN:en}); };
          drugs = allParts[0].map(normFn); suppliers = allParts[1]; orders = allParts[2];
          if (!drugs.length && !suppliers.length && !orders.length) return null;
          idbSet('drugs', drugs).then(function() {
            try { localStorage.setItem('uni_drug_idb_ts', Date.now().toString()); localStorage.setItem('uni_drug_count', String(drugs.length)); } catch(e) {}
          });
        }

        suppliers = suppliers.map(function(s) {
          var en = (s.nameEN || '').trim();
          return en ? s : Object.assign({}, s, { nameEN: (s.name || s.id || '') });
        });

        if (needsSuppliers) {
          try { localStorage.setItem('uni_sup_cache', JSON.stringify(suppliers)); localStorage.setItem('uni_sup_ts', now.toString()); } catch(e) {}
        }
        if (needsOrders) {
          try { localStorage.setItem('uni_ord_cache', JSON.stringify(orders)); localStorage.setItem('uni_ord_ts', now.toString()); } catch(e) {}
        }

        orders.sort(function (a, b) { return (b.poDate || "").localeCompare(a.poDate || ""); });
        return { drugs: drugs, suppliers: suppliers, orders: orders };
      } catch (e) {
        console.warn("[UNI_DB] loadAll failed:", e);
        return null;
      }
    },

    async isEmpty() {
      if (!enabled) return true;
      try {
        var res = await client.from("drugs").select("code", { count: "exact", head: true });
        return !res.count;
      } catch (e) { return true; }
    },

    // Run arbitrary SQL via the exec_sql Postgres function.
    // Returns { rows, rowsAffected } — throws on error.
    async execSql(sql) {
      if (!enabled) throw new Error('Supabase not configured');
      const { data, error } = await client.rpc('exec_sql', { sql });
      if (error) throw error;
      // SELECT → array of row objects; DML → { rowsAffected, type:'write' }
      if (Array.isArray(data)) return { rows: data, rowsAffected: data.length };
      return { rows: [], rowsAffected: data?.rowsAffected ?? 0 };
    },

    async saveDrug(d) {
      if (!enabled) return;
      try { await client.from("drugs").upsert(drugRow(d)); }
      catch (e) { console.warn("[UNI_DB] saveDrug:", e); }
    },
    async saveSupplier(s) {
      if (!enabled) return;
      try { await client.from("suppliers").upsert(supplierRow(s)); try { localStorage.removeItem('uni_sup_ts'); } catch(_) {} }
      catch (e) { console.warn("[UNI_DB] saveSupplier:", e); }
    },
    async savePO(p) {
      if (!enabled) return;
      try { await client.from("purchase_orders").upsert(poRow(p)); try { localStorage.removeItem('uni_ord_ts'); } catch(_) {} }
      catch (e) { console.warn("[UNI_DB] savePO:", e); }
    },
    async savePOWithUnits(p, items, drugs) {
      if (!enabled) return;
      try {
        await client.from("purchase_orders").upsert(poRow(p)); try { localStorage.removeItem('uni_ord_ts'); } catch(_) {}
        for (const item of items) {
          const drug = drugs.find(d => d.code === item.code);
          if (drug && drug.unit !== item.unit) {
            await client.from("drugs").upsert(drugRow({ ...drug, unit: item.unit }));
          }
        }
      }
      catch (e) { console.warn("[UNI_DB] savePOWithUnits:", e); }
    },
    async deleteDrug(code) {
      if (!enabled) return;
      try { await client.from("drugs").delete().eq("code", code); }
      catch (e) { console.warn("[UNI_DB] deleteDrug:", e); }
    },
    async deletePO(id) {
      if (!enabled) return;
      try { await client.from("purchase_orders").delete().eq("id", id); }
      catch (e) { console.warn("[UNI_DB] deletePO:", e); }
    },

    // Bulk push — used by Data Sync import & first-time seed.
    async saveDrugsBulk(arr) {
      if (!enabled || !arr || !arr.length) return;
      for (var c of chunk(arr.map(drugRow), 500)) {
        var res = await client.from("drugs").upsert(c);
        if (res.error) throw res.error;
      }
      try { localStorage.removeItem('uni_drug_idb_ts'); localStorage.removeItem('uni_drug_count'); } catch(e) {}
      idbSet('drugs', null);
    },
    async saveSuppliersBulk(arr) {
      if (!enabled || !arr || !arr.length) return;
      for (var c of chunk(arr.map(supplierRow), 500)) {
        var res = await client.from("suppliers").upsert(c);
        if (res.error) throw res.error;
      }
      try { localStorage.removeItem('uni_sup_ts'); } catch(e) {}
    },
    async saveOrdersBulk(arr) {
      if (!enabled || !arr || !arr.length) return;
      for (var c of chunk(arr.map(poRow), 500)) {
        var res = await client.from("purchase_orders").upsert(c);
        if (res.error) throw res.error;
      }
    },

    async logSync(source, kind, count) {
      if (!enabled) return;
      try { await client.from("sync_history").insert({ source: source, kind: kind, count: count }); }
      catch (e) { /* non-critical */ }
    },

    // ---- Out of stock reports (shared across all users) ----
    async loadOutOfStock(sinceISO) {
      if (!enabled) return null;
      try {
        var q = client.from("out_of_stock").select("*").order("created_at", { ascending: true });
        if (sinceISO) q = q.gte("created_at", sinceISO);
        var res = await q;
        if (res.error) throw res.error;
        return (res.data || []).map(oosFromRow);
      } catch (e) { console.warn("[UNI_DB] loadOutOfStock:", e); return null; }
    },
    async saveOutOfStock(report) {
      if (!enabled) return false;
      try {
        var res = await client.from("out_of_stock").upsert(oosRow(report));
        if (res.error) throw res.error;
        return true;
      } catch (e) { console.warn("[UNI_DB] saveOutOfStock:", e); return false; }
    },
    async deleteOutOfStock(id) {
      if (!enabled) return;
      try { await client.from("out_of_stock").delete().eq("id", id); }
      catch (e) { console.warn("[UNI_DB] deleteOutOfStock:", e); }
    },
    // ---- Drug categories (shared master list) ----
    async loadCategories() {
      if (!enabled) return null;
      // Cache 24 h — categories change only when admin edits them
      try {
        var CAT_TTL = 24 * 3600 * 1000;
        var ts = parseInt(localStorage.getItem('uni_cat_ts') || '0', 10);
        if (ts && (Date.now() - ts) < CAT_TTL) {
          var cc = JSON.parse(localStorage.getItem('uni_cat_cache') || 'null');
          if (cc && cc.length) { console.info('[UNI_DB] category cache hit'); return cc; }
        }
      } catch(e) {}
      try {
        var res = await client.from("categories").select("*").order("id", { ascending: true });
        if (res.error) throw res.error;
        var cats = (res.data || []).map(categoryFromRow);
        try { localStorage.setItem('uni_cat_cache', JSON.stringify(cats)); localStorage.setItem('uni_cat_ts', Date.now().toString()); } catch(e) {}
        return cats;
      } catch (e) { console.warn("[UNI_DB] loadCategories:", e); return null; }
    },
    async saveCategoriesBulk(arr) {
      if (!enabled || !arr || !arr.length) return false;
      try {
        var res = await client.from("categories").upsert(arr.map(categoryRow));
        if (res.error) throw res.error;
        try { localStorage.removeItem('uni_cat_ts'); } catch(e) {}
        return true;
      } catch (e) { console.warn("[UNI_DB] saveCategoriesBulk:", e); return false; }
    },
    async deleteCategory(id) {
      if (!enabled) return;
      try { await client.from("categories").delete().eq("id", id); try { localStorage.removeItem('uni_cat_ts'); } catch(_) {} }
      catch (e) { console.warn("[UNI_DB] deleteCategory:", e); }
    },

    // Soft-remove: mark handled (kept in the table as history/statistics).
    async setOutOfStockResolved(id, by) {
      if (!enabled) return false;
      try {
        var res = await client.from("out_of_stock")
          .update({ resolved_at: new Date().toISOString(), resolved_by: by || "" })
          .eq("id", id);
        if (res.error) throw res.error;
        return true;
      } catch (e) { console.warn("[UNI_DB] setOutOfStockResolved:", e); return false; }
    },
    // Live subscription for the out_of_stock table. cb() is called on any change.
    onOutOfStockChange(cb) {
      if (!enabled || !client.channel) return function () {};
      var ch = client.channel("uni-oos-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "*", schema: "public", table: "out_of_stock" }, function () { cb(); })
        .subscribe();
      return function () { try { client.removeChannel(ch); } catch (e) {} };
    },
    // Live subscription for master/transactional data. cb(kind, payload) per change.
    onDataChange(cb) {
      if (!enabled || !client.channel) return function () {};
      var ch = client.channel("uni-data-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "*", schema: "public", table: "drugs" }, function (p) { cb("drugs", p); })
        .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, function (p) { cb("suppliers", p); })
        .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, function (p) { cb("orders", p); })
        .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, function (p) { cb("categories", p); })
        .subscribe();
      return function () { try { client.removeChannel(ch); } catch (e) {} };
    },

    // ---- Authentication ----
    async getSession() {
      if (!enabled) return null;
      try { const { data } = await client.auth.getSession(); return (data.session && data.session.user) ? data.session : null; }
      catch (e) { return null; }
    },
    async signIn(email, password) {
      if (!enabled) return { error: "Cloud not configured" };
      const { data, error } = await client.auth.signInWithPassword({ email: email, password: password });
      return { session: data && data.session, error: error && error.message };
    },
    async signOut() {
      if (!enabled) return;
      try { await client.auth.signOut(); } catch (e) {}
    },
    // role of the logged-in user: 'admin' | 'manager' | 'viewer'
    // Retries a few times: right after login the profile row can be briefly
    // unreadable (auth context / RLS settling), and we must NOT downgrade a
    // real admin/manager to viewer because of that transient miss.
    async getMyRole() {
      if (!enabled) return null;
      try {
        const { data: u } = await client.auth.getUser();
        if (!u || !u.user) return null;
        for (var attempt = 0; attempt < 4; attempt++) {
          var res = await client.from("profiles").select("role, full_name, email").eq("id", u.user.id).maybeSingle();
          if (!res.error && res.data) {
            return { role: res.data.role, full_name: res.data.full_name, email: res.data.email };
          }
          await new Promise(function (r) { setTimeout(r, 400); });
        }
        // Profile genuinely missing after retries → safe default.
        return { role: "viewer", email: u.user.email };
      } catch (e) { return { role: "viewer" }; }
    },
    onAuthChange(cb) {
      if (!enabled || !client.auth.onAuthStateChange) return function () {};
      const { data } = client.auth.onAuthStateChange(function (_evt, session) { cb(session); });
      return function () { data && data.subscription && data.subscription.unsubscribe(); };
    },

    _client: client,
  };

  if (enabled) console.info("[UNI_DB] Supabase cloud sync ENABLED.");
  else console.info("[UNI_DB] Running offline (localStorage only).");
})();


/* ===== auth.jsx ===== */
// auth.jsx — Login screen (shown only when cloud is enabled & login is required)
// Users log in with a USERNAME; we append a fixed internal domain so the
// Supabase email/password provider works without anyone typing an email.
// Clean light design, independent of the app's dark/light theme.
const LOGIN_DOMAIN = 'unipharma.local';
function LoginScreen({ L, lang, setLang, onSignedIn }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const u = username.trim();
    const loginId = u.includes('@') ? u : `${u}@${LOGIN_DOMAIN}`;
    const res = await window.UNI_DB.signIn(loginId, password);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    onSignedIn();
  };

  return (
    <div className="lg-wrap">
      <style>{`
        .lg-wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
          padding:20px;overflow:hidden;background:#eef4fb;font-family:'Noto Sans Thai','Inter',sans-serif}
        .lg-blob{position:absolute;border-radius:50%;filter:blur(72px);opacity:.45;animation:lg-float 16s ease-in-out infinite}
        .lg-b1{width:440px;height:440px;background:#1177cc;top:-140px;left:-120px}
        .lg-b2{width:400px;height:400px;background:#06b6d4;bottom:-140px;right:-110px;animation-delay:-8s}
        .lg-b3{width:300px;height:300px;background:#7cc7ff;top:40%;left:55%;animation-delay:-4s;opacity:.3}
        @keyframes lg-float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(46px,34px) scale(1.08)}}
        .lg-card{position:relative;z-index:1;width:100%;max-width:400px;background:#fff;border-radius:22px;
          padding:40px 36px;box-shadow:0 24px 64px rgba(17,119,204,.20),0 2px 8px rgba(17,119,204,.08);
          animation:lg-in .55s cubic-bezier(.2,.85,.25,1)}
        @keyframes lg-in{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
        .lg-logo{width:104px;height:104px;margin:0 auto 16px;border-radius:24px;background:#fff;
          box-shadow:0 8px 24px rgba(17,119,204,.18);display:flex;align-items:center;justify-content:center;
          animation:lg-pop .6s .1s both cubic-bezier(.2,1.4,.4,1)}
        @keyframes lg-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
        .lg-logo img{width:74px;height:74px;object-fit:contain}
        .lg-lang{position:absolute;top:14px;right:14px;padding:4px 12px;border:1.5px solid #e1ebf5;border-radius:20px;
          background:#f6fafe;color:#1177cc;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:.15s;z-index:2}
        .lg-lang:hover{background:#eaf3fc;border-color:#1177cc}
        .lg-brand{text-align:center;font-size:22px;font-weight:800;letter-spacing:.5px;
          background:linear-gradient(120deg,#1177cc,#06b6d4);-webkit-background-clip:text;background-clip:text;color:transparent}
        .lg-sub{text-align:center;font-size:12.5px;color:#7794ad;margin-top:2px;margin-bottom:26px}
        .lg-label{display:block;font-size:13px;font-weight:600;color:#3f6489;margin-bottom:6px}
        .lg-group{margin-bottom:16px}
        .lg-input{width:100%;padding:12px 14px;border:1.5px solid #e1ebf5;border-radius:12px;font-size:14px;
          color:#0b2a45;background:#f6fafe;transition:border-color .2s,box-shadow .2s,background .2s;outline:none;font-family:inherit}
        .lg-input::placeholder{color:#a7bdd1}
        .lg-input:focus{border-color:#1177cc;background:#fff;box-shadow:0 0 0 4px rgba(17,119,204,.13)}
        .lg-btn{width:100%;padding:13px;border:none;border-radius:12px;font-size:15px;font-weight:700;color:#fff;
          cursor:pointer;font-family:inherit;background:linear-gradient(135deg,#1177cc,#06b6d4);background-size:160% 160%;
          box-shadow:0 10px 24px rgba(17,119,204,.32);transition:transform .18s,box-shadow .18s,background-position .4s;margin-top:4px}
        .lg-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 30px rgba(17,119,204,.42);background-position:100% 100%}
        .lg-btn:active:not(:disabled){transform:translateY(0)}
        .lg-btn:disabled{opacity:.65;cursor:default}
        .lg-err{background:#fdebec;color:#d63031;padding:9px 13px;border-radius:10px;font-size:12.5px;
          margin-bottom:14px;border:1px solid #f8d2d4;animation:lg-shake .35s}
        @keyframes lg-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
        .lg-foot{text-align:center;font-size:11.5px;color:#9db4c9;margin-top:18px}
        @media(prefers-reduced-motion:reduce){.lg-blob,.lg-card,.lg-logo,.lg-btn,.lg-err{animation:none!important}}
      `}</style>

      <div className="lg-blob lg-b1"></div>
      <div className="lg-blob lg-b2"></div>
      <div className="lg-blob lg-b3"></div>

      <form onSubmit={submit} className="lg-card">
        {setLang && (
          <button type="button" className="lg-lang" onClick={() => setLang(l => l === 'th' ? 'en' : 'th')}>
            {lang === 'th' ? 'EN' : 'ไทย'}
          </button>
        )}
        <div className="lg-logo"><img src="assets/logo.png" alt="Unipharma" /></div>
        <div className="lg-brand">UNIPHARMA</div>
        <div className="lg-sub">{L('ระบบจัดการการสั่งซื้อ', 'Purchasing Management')}</div>

        <div className="lg-group">
          <label className="lg-label">{L('ชื่อผู้ใช้', 'Username')}</label>
          <input className="lg-input" type="text" autoComplete="username" value={username}
            onChange={e => setUsername(e.target.value)} placeholder={L('เช่น admin', 'e.g. admin')} required autoFocus />
        </div>
        <div className="lg-group">
          <label className="lg-label">{L('รหัสผ่าน', 'Password')}</label>
          <input className="lg-input" type="password" autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>

        {err && <div className="lg-err">{L('เข้าสู่ระบบไม่สำเร็จ: ', 'Sign-in failed: ')}{err}</div>}

        <button className="lg-btn" type="submit" disabled={busy}>
          {busy ? L('กำลังเข้าสู่ระบบ…', 'Signing in…') : L('เข้าสู่ระบบ', 'Sign in')}
        </button>

        <div className="lg-foot">{L('ติดต่อผู้ดูแลระบบเพื่อขอบัญชีผู้ใช้', 'Contact your admin for an account')}</div>
      </form>
    </div>
  );
}


/* ===== components.jsx ===== */
// components.jsx — Shared UI Components

/* ── Modal ── */
function Modal({ title, onClose, children, footer, size = 600 }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: size }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', fontSize: 18 }}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Status Badge ── */
function StatusBadge({ status, lang = 'th' }) {
  const color = UTILS.statusColor(status);
  const label = UTILS.statusLabel(status, lang);
  return (
    <span className="badge" style={{ background: color + '22', color }}>
      <span className="badge-dot" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ── Branch Badge ── */
function BranchBadge({ branchId }) {
  const b = UTILS.getBranch(branchId);
  return (
    <span className="badge" style={{ background: (b.color || '#8b5cf6') + '22', color: b.color || '#8b5cf6' }}>
      {b.id}
    </span>
  );
}

/* ── Pagination ── */
function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = [];
  let start = Math.max(1, page - 2), end = Math.min(totalPages, page + 2);
  if (page <= 3) end = Math.min(5, totalPages);
  if (page >= totalPages - 2) start = Math.max(1, totalPages - 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="pagination">
      <span className="page-info">แสดง {Math.min((page-1)*perPage+1,total)}–{Math.min(page*perPage,total)} จาก {total.toLocaleString()} รายการ</span>
      <button className="page-btn" disabled={page===1} onClick={()=>onChange(page-1)}>‹</button>
      {start > 1 && <><button className="page-btn" onClick={()=>onChange(1)}>1</button>{start>2&&<span className="page-info">…</span>}</>}
      {pages.map(p => <button key={p} className={`page-btn${p===page?' active':''}`} onClick={()=>onChange(p)}>{p}</button>)}
      {end < totalPages && <>{end<totalPages-1&&<span className="page-info">…</span>}<button className="page-btn" onClick={()=>onChange(totalPages)}>{totalPages}</button></>}
      <button className="page-btn" disabled={page===totalPages} onClick={()=>onChange(page+1)}>›</button>
    </div>
  );
}

/* ── Search Input (debounced 200 ms) ── */
function SearchInput({ value, onChange, placeholder = 'ค้นหา…' }) {
  const [local, setLocal] = useState(value);
  const timer = useRef(null);
  useEffect(() => { setLocal(value); }, [value]);
  const handle = e => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), 200);
  };
  return (
    <div className="search-bar">
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input className="input" value={local} onChange={handle} placeholder={placeholder} />
    </div>
  );
}

/* ── Chart (Chart.js wrapper) ── */
function ChartWidget({ type, data, options = {}, height = 220 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(139,92,246,.1)' : 'rgba(124,58,237,.08)';
    const textColor = isDark ? '#8b7ec8' : '#7c3aed';
    const defaultOpts = {
      responsive: true, maintainAspectRatio: false, animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: { legend: { labels: { color: textColor, font: { family: "'Noto Sans Thai','Inter',sans-serif", size: 11 } } }, tooltip: { backgroundColor: isDark ? '#201545' : '#fff', titleColor: isDark ? '#f0ebff' : '#1a0f3d', bodyColor: isDark ? '#c4b5fd' : '#4c1d95', borderColor: isDark ? 'rgba(139,92,246,.35)' : 'rgba(124,58,237,.2)', borderWidth: 1 } },
      scales: type !== 'doughnut' && type !== 'pie' ? {
        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "'Noto Sans Thai','Inter',sans-serif", size: 11 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "'Noto Sans Thai','Inter',sans-serif", size: 11 } } }
      } : {}
    };
    chartRef.current = new Chart(ref.current, { type, data, options: { ...defaultOpts, ...options } });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [type, JSON.stringify(data)]);
  return <div style={{ position: 'relative', height }}><canvas ref={ref} /></div>;
}

/* ── Rating Stars ── */
function RatingStars({ rating }) {
  const full = Math.floor(rating), half = rating % 1 >= 0.5;
  return (
    <span style={{ color: 'var(--warn)', letterSpacing: 1 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
      <span style={{ color: 'var(--txt3)', fontSize: 11, marginLeft: 4 }}>{rating}</span>
    </span>
  );
}

/* ── Confirm Dialog ── */
function Confirm({ msg, onConfirm, onCancel, lang = 'th' }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: 'var(--txt)', marginBottom: 20 }}>{msg}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={onCancel}>{lang === 'th' ? 'ยกเลิก' : 'Cancel'}</button>
            <button className="btn btn-danger" onClick={onConfirm}>{lang === 'th' ? 'ยืนยัน' : 'Confirm'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── VAT Price Display ── */
function PriceDisplay({ labelEx, labelInc, amtEx, amtInc, hasVat, small = false }) {
  const fs = small ? 11 : 12;
  return (
    <div>
      <div style={{ fontSize: small ? 13 : 14, fontWeight: 700, color: 'var(--txt)' }}>{UTILS.fmt(hasVat ? amtInc : amtEx)} ฿</div>
      {hasVat && (
        <div style={{ fontSize: fs, color: 'var(--txt3)' }}>
          ไม่รวม VAT: {UTILS.fmt(amtEx)} ฿
        </div>
      )}
      {hasVat && <div style={{ fontSize: fs, color: 'var(--txt4)' }}>VAT 7%</div>}
    </div>
  );
}

/* ── Stock Level Bar ── */
function StockBar({ current, min, max }) {
  const pct = Math.min(100, Math.round(current / (max || 1) * 100));
  const color = current <= min ? 'var(--err)' : current <= min * 2 ? 'var(--warn)' : 'var(--ok)';
  return (
    <div>
      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2, transition: '.3s' }} />
      </div>
      <div style={{ fontSize: 10, color, marginTop: 2 }}>{current.toLocaleString()}</div>
    </div>
  );
}

/* ── Drug Form (Add/Edit) ── */
function DrugForm({ drug, onSave, onClose, lang, L, suppliers }) {
  const cats = DB.CATEGORIES;
  const [form, setForm] = useState(() => {
    if (drug) {
      // Migrate old extraSupplierIds (array of strings) \u2192 extraSuppliers (array of objects)
      const exSups = drug.extraSuppliers?.length
        ? drug.extraSuppliers
        : (drug.extraSupplierIds || []).map(id => ({ id, costEx: 0, sellEx: 0 }));
      return { costByBranch: {}, ...drug, extraSuppliers: exSups, supplierDeals: drug.supplierDeals || {} };
    }
    // New drug: pre-fill packaging from unit default
    const defPkg = UTILS.getPackaging('\u0e40\u0e21\u0e47\u0e14', 'th');
    return {
      code: '', nameTH: '', nameEN: '', unit: '\u0e40\u0e21\u0e47\u0e14', catId: 'CAT01', subId: 'S0101',
      hasVat: false, vatRate: 0, costEx: 0, sellEx: 0, costByBranch: {}, extraSuppliers: [], supplierDeals: {},
      stock: { PTN: 0, RAM: 0, CNX: 0 }, minStock: 100, supplierId: 'SUP001', orderCount: 0,
      pkgBase: defPkg?.base || '', pkgBaseEN: defPkg?.baseEN || '',
      pkgLevels: defPkg?.levels ? defPkg.levels.map(l=>({...l})) : []
    };
  });
  const [errors, setErrors] = useState({});
  const isEdit = !!drug;

  const set = (k, v) => setForm(f => {
    const nf = { ...f, [k]: v };
    if (k === 'catId') nf.subId = (cats.find(c => c.id === v)?.subs[0]?.id || '');
    if (k === 'hasVat') nf.vatRate = v ? 7 : 0;
    if (k === 'costEx' || k === 'sellEx' || k === 'hasVat') {
      const cEx = parseFloat(nf.costEx) || 0, sEx = parseFloat(nf.sellEx) || 0;
      nf.costInc = nf.hasVat ? +(cEx * 1.07).toFixed(2) : cEx;
      nf.sellInc = nf.hasVat ? +(sEx * 1.07).toFixed(2) : sEx;
      nf.profitEx = +(sEx - cEx).toFixed(2);
      nf.profitMargin = sEx > 0 ? +((nf.profitEx / sEx) * 100).toFixed(1) : 0;
    }
    // Profit edits → recalculate sell price
    if (k === 'profitEx') {
      const cEx = parseFloat(nf.costEx) || 0;
      const pEx = parseFloat(v) || 0;
      const sEx = +(cEx + pEx).toFixed(2);
      nf.sellEx = sEx;
      nf.sellInc = nf.hasVat ? +(sEx * 1.07).toFixed(2) : sEx;
      nf.profitMargin = sEx > 0 ? +((pEx / sEx) * 100).toFixed(1) : 0;
    }
    if (k === 'profitMargin') {
      const cEx = parseFloat(nf.costEx) || 0;
      const pct = parseFloat(v) || 0;
      const sEx = pct < 100 ? +(cEx / (1 - pct / 100)).toFixed(2) : 0;
      nf.sellEx = sEx;
      nf.sellInc = nf.hasVat ? +(sEx * 1.07).toFixed(2) : sEx;
      nf.profitEx = +(sEx - cEx).toFixed(2);
    }
    // Auto-suggest packaging when unit changes
    if (k === 'unit') {
      const defPkg = UTILS.getPackaging(v, 'th');
      if (defPkg && !nf.pkgBase) {
        nf.pkgBase = defPkg.base; nf.pkgBaseEN = defPkg.baseEN;
        nf.pkgLevels = defPkg.levels.map(l=>({...l}));
      }
    }
    return nf;
  });
  const setStock = (br, v) => setForm(f => ({ ...f, stock: { ...f.stock, [br]: parseInt(v) || 0 } }));
  const setDeal = (supId, field, val) => setForm(f => ({
    ...f,
    supplierDeals: { ...(f.supplierDeals||{}), [supId]: { ...((f.supplierDeals||{})[supId]||{}), [field]: val } }
  }));

  const validate = () => {
    const e = {};
    if (!form.code) e.code = true;
    if (!form.nameTH) e.nameTH = true;
    if (!form.nameEN) e.nameEN = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const cEx = parseFloat(form.costEx) || 0, sEx = parseFloat(form.sellEx) || 0;
    const saved = {
      ...form, costEx: cEx, sellEx: sEx,
      costInc: form.hasVat ? +(cEx * 1.07).toFixed(2) : cEx,
      sellInc: form.hasVat ? +(sEx * 1.07).toFixed(2) : sEx,
      profitEx: +(sEx - cEx).toFixed(2),
      profitMargin: sEx > 0 ? +((sEx - cEx) / sEx * 100).toFixed(1) : 0,
      totalStock: (form.stock.PTN || 0) + (form.stock.RAM || 0) + (form.stock.CNX || 0),
      extraSuppliers: (form.extraSuppliers || []).filter(s => s.id),
      extraSupplierIds: (form.extraSuppliers || []).filter(s => s.id).map(s => s.id),
    };
    onSave(saved);
  };

  const subs = cats.find(c => c.id === form.catId)?.subs || [];
  const inp = (k, label, type = 'text', disabled = false) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <input className={`input${errors[k] ? ' border-red' : ''}`} type={type} value={form[k] || ''} disabled={disabled}
        style={disabled ? { opacity: .6 } : {}} onChange={e => set(k, type === 'number' ? e.target.value : e.target.value)} />
      {errors[k] && <div style={{ color: 'var(--err)', fontSize: 11, marginTop: 2 }}>จำเป็นต้องกรอก</div>}
    </div>
  );

  return (
    <Modal title={isEdit ? L('แก้ไขสินค้า', 'Edit Product') : L('เพิ่มสินค้าใหม่', 'Add Product')} onClose={onClose} size={700}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก', 'Cancel')}</button><button className="btn btn-primary" onClick={handleSave}>{L('บันทึก', 'Save')}</button></>}>
      <div className="form-row">
        {inp('code', L('รหัสสินค้า', 'Product Code'), 'text', isEdit)}
        {inp('unit', L('หน่วย', 'Unit'))}
      </div>
      {inp('nameTH', L('ชื่อภาษาไทย', 'Thai Name'))}
      {inp('nameEN', L('ชื่อภาษาอังกฤษ', 'English Name'))}
      <div className="form-row">
        <div className="form-group">
          <label className="label">{L('หมวดหมู่หลัก', 'Main Category')}</label>
          <select className="input" value={form.catId} onChange={e => set('catId', e.target.value)}>
            {cats.map(c => <option key={c.id} value={c.id}>{lang === 'th' ? c.name : c.nameEN}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">{L('หมวดหมู่รอง', 'Sub Category')}</label>
          <select className="input" value={form.subId} onChange={e => set('subId', e.target.value)}>
            {subs.map(s => <option key={s.id} value={s.id}>{lang === 'th' ? s.name : s.nameEN}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="label">{L('ผู้จัดจำหน่ายหลัก', 'Main Supplier')}</label>
          <select className="input" value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">VAT</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.hasVat} onChange={e => set('hasVat', e.target.checked)} />
              <span style={{ fontSize: 13 }}>{L('มี VAT 7%', 'Include VAT 7%')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main supplier price grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="label">{L('ต้นทุน (ไม่รวม VAT)', 'Cost (excl. VAT)')}</label>
          <input className="input" type="number" step="0.01" value={form.costEx || ''} onChange={e => set('costEx', e.target.value)} />
          {form.hasVat && <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>รวม VAT: {UTILS.fmt(form.costInc || (parseFloat(form.costEx) || 0) * 1.07)} ฿</div>}
        </div>
        <div className="form-group">
          <label className="label">{L('ราคาขาย (ไม่รวม VAT)', 'Sell Price (excl. VAT)')}</label>
          <input className="input" type="number" step="0.01" value={form.sellEx || ''} onChange={e => set('sellEx', e.target.value)} />
          {form.hasVat && <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>รวม VAT: {UTILS.fmt(form.sellInc || (parseFloat(form.sellEx) || 0) * 1.07)} ฿</div>}
        </div>
        <div className="form-group">
          <label className="label">{L('กำไร/หน่วย (บาท)', 'Profit/Unit (฿)')}</label>
          <input className="input" type="number" step="0.01" value={form.profitEx ?? ''}
            onChange={e => set('profitEx', e.target.value)}
            style={{ color: (form.profitEx||0) >= 0 ? 'var(--ok)' : 'var(--err)', fontWeight: 700 }} />
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
            {L('ราคาขายใหม่', 'New sell price')}: <b style={{color:'var(--acc2)'}}>{UTILS.fmt(form.sellEx||0)} ฿</b>
          </div>
        </div>
        <div className="form-group">
          <label className="label">{L('กำไร %', 'Margin %')}</label>
          <input className="input" type="number" step="0.1" min="0" max="99" value={form.profitMargin ?? ''}
            onChange={e => set('profitMargin', e.target.value)}
            style={{ color: (form.profitMargin||0) >= 0 ? 'var(--ok)' : 'var(--err)', fontWeight: 700 }} />
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
            {L('เปลี่ยน % → คำนวณราคาขายอัตโนมัติ', 'Change % → sell price auto-calculated')}
          </div>
        </div>
      </div>

      {/* Extra suppliers with pricing */}
      {(form.extraSuppliers || []).map((sup, i) => {
        const cEx = parseFloat(sup.costEx) || 0, sEx = parseFloat(sup.sellEx) || 0;
        const profit = +(sEx - cEx).toFixed(2);
        const margin = sEx > 0 ? +((profit / sEx) * 100).toFixed(1) : 0;
        const hasPrice = cEx > 0 || sEx > 0;
        const updSup = (field, val) => setForm(f => ({
          ...f, extraSuppliers: (f.extraSuppliers||[]).map((x,j) => j===i ? {...x,[field]:val} : x)
        }));
        return (
          <div key={i} style={{ marginTop: 8, marginBottom: 4, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="label">{L(`ผู้จัดจำหน่ายรายย่อย ${i + 1}`, `Secondary Supplier ${i + 1}`)}</label>
                <select className="input" value={sup.id || ''}
                  onChange={e => updSup('id', e.target.value)}>
                  <option value="">— {L('ไม่ระบุ', 'None')} —</option>
                  {suppliers.filter(s => s.id !== form.supplierId && !(form.extraSuppliers||[]).some((x,j) => x.id===s.id && j!==i))
                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color:'var(--err)', flexShrink:0 }}
                onClick={() => setForm(f => ({ ...f, extraSuppliers: (f.extraSuppliers||[]).filter((_,j) => j!==i) }))}>
                ✕
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
              <div className="form-group">
                <label className="label" style={{ fontSize: 11 }}>{L('ต้นทุน (ไม่รวม VAT)', 'Cost (excl. VAT)')}</label>
                <input className="input" type="number" step="0.01" value={sup.costEx || ''}
                  onChange={e => updSup('costEx', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label" style={{ fontSize: 11 }}>{L('ราคาขาย (ไม่รวม VAT)', 'Sell Price (excl. VAT)')}</label>
                <input className="input" type="number" step="0.01" value={sup.sellEx || ''}
                  onChange={e => updSup('sellEx', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label" style={{ fontSize: 11 }}>{L('กำไร/หน่วย (บาท)', 'Profit/Unit (฿)')}</label>
                <div className="input" style={{ color: profit >= 0 ? 'var(--ok)' : 'var(--err)', fontWeight: 700, opacity: .85 }}>
                  {hasPrice ? UTILS.fmt(profit) : '—'}
                </div>
              </div>
              <div className="form-group">
                <label className="label" style={{ fontSize: 11 }}>{L('กำไร %', 'Margin %')}</label>
                <div className="input" style={{ color: margin >= 0 ? 'var(--ok)' : 'var(--err)', fontWeight: 700, opacity: .85 }}>
                  {hasPrice ? margin + '%' : '—'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {(form.extraSuppliers||[]).length < 5 && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, marginBottom: 4 }}
          onClick={() => setForm(f => ({ ...f, extraSuppliers: [...(f.extraSuppliers||[]), {id:'', costEx:'', sellEx:''}] }))}>
          + {L('เพิ่มผู้จัดจำหน่าย', 'Add Supplier')}
        </button>
      )}

      {/* ── Deals per supplier ── */}
      {(() => {
        const dealSups = [
          { id: form.supplierId, isMain: true },
          ...(form.extraSuppliers||[]).filter(s=>s.id).map((s,i)=>({ id:s.id, isMain:false, idx:i }))
        ].filter(s=>s.id);
        if (dealSups.length === 0) return null;
        return (
          <>
            <div className="divider" />
            <div style={{ marginBottom:10, fontSize:12, fontWeight:700, color:'var(--txt2)' }}>
              🎁 {L('ดีลแต่ละผู้จัดจำหน่าย','Deals per Supplier')}
              <span style={{ fontWeight:400, color:'var(--txt4)', marginLeft:8, fontSize:11 }}>
                {L('(แสดงเป็น reminder ตอนสั่งซื้อ)','(shown as reminder when ordering)')}
              </span>
            </div>
            {dealSups.map(({ id, isMain }) => {
              const sup = UTILS.getSupplier(id);
              const deal = (form.supplierDeals||{})[id] || {};
              const hasDeal = deal.buyQty>0 || deal.freeQty>0 || deal.freeItems || deal.specialDiscount>0 || deal.note;
              return (
                <div key={id} style={{ marginBottom:8, padding:'10px 12px', background: hasDeal?'var(--ok-bg)':'var(--bg2)', borderRadius:8, border:`1px solid ${hasDeal?'rgba(22,163,74,.3)':'var(--border)'}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:hasDeal?'var(--ok)':'var(--txt3)', marginBottom:8 }}>
                    {isMain?'⭐':'◆'} {sup.name||sup.nameEN||id}
                    {isMain && <span style={{ fontWeight:400, marginLeft:6, color:'var(--txt4)' }}>{L('(ผู้จัดจำหน่ายหลัก)','(Main Supplier)')}</span>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'80px 80px 1fr 110px', gap:8, marginBottom:6 }}>
                    <div>
                      <div className="label" style={{ fontSize:10 }}>{L('ซื้อ (ชิ้น)','Buy (qty)')}</div>
                      <input className="input input-sm" type="number" min="0" step="1"
                        value={deal.buyQty||''} placeholder="0" style={{ textAlign:'center' }}
                        onChange={e=>setDeal(id,'buyQty',parseInt(e.target.value)||0)} />
                    </div>
                    <div>
                      <div className="label" style={{ fontSize:10 }}>{L('แถม (ชิ้น)','Free (qty)')}</div>
                      <input className="input input-sm" type="number" min="0" step="1"
                        value={deal.freeQty||''} placeholder="0" style={{ textAlign:'center' }}
                        onChange={e=>setDeal(id,'freeQty',parseInt(e.target.value)||0)} />
                    </div>
                    <div>
                      <div className="label" style={{ fontSize:10 }}>{L('รายการขอแถม','Bonus Items to Request')}</div>
                      <input className="input input-sm" type="text"
                        value={deal.freeItems||''}
                        placeholder={L('เช่น ถุงมือ, กล่อง, อุปกรณ์...','e.g. gloves, box, accessories...')}
                        onChange={e=>setDeal(id,'freeItems',e.target.value)} />
                    </div>
                    <div>
                      <div className="label" style={{ fontSize:10 }}>Special Discount %</div>
                      <input className="input input-sm" type="number" min="0" max="100" step="0.1"
                        value={deal.specialDiscount||''} placeholder="0" style={{ textAlign:'center' }}
                        onChange={e=>setDeal(id,'specialDiscount',parseFloat(e.target.value)||0)} />
                    </div>
                  </div>
                  <div>
                    <div className="label" style={{ fontSize:10 }}>{L('หมายเหตุดีล / Note','Deal Note')}</div>
                    <input className="input input-sm" type="text"
                      value={deal.note||''}
                      placeholder={L('เช่น โทรขอก่อนสั่ง, เฉพาะออนไลน์, ต้องสั่งขั้นต่ำ...','e.g. Call before ordering, online only, minimum order...')}
                      onChange={e=>setDeal(id,'note',e.target.value)} />
                  </div>
                </div>
              );
            })}
          </>
        );
      })()}

      <div className="divider" />
      <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--txt3)' }}>
        💰 {L('ต้นทุนแยกสาขา', 'Cost by Branch')}
        <span style={{ fontWeight: 400, color: 'var(--txt4)', marginLeft: 6 }}>
          {L('(เว้นว่าง = ใช้ต้นทุนหลัก)', '(blank = use default cost)')}
        </span>
      </div>
      <div className="form-row-3" style={{ marginBottom: 8 }}>
        {DB.BRANCHES.map(br => (
          <div key={br.id} className="form-group">
            <label className="label" style={{ color: br.color }}>{br.name}</label>
            <input className="input" type="number" step="0.01"
              value={form.costByBranch?.[br.id] ?? ''}
              placeholder={`${UTILS.fmt(parseFloat(form.costEx) || 0)}`}
              onChange={e => {
                const v = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
                setForm(f => ({ ...f, costByBranch: { ...(f.costByBranch || {}), [br.id]: v } }));
              }} />
          </div>
        ))}
      </div>
      <div className="divider" />
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--txt3)' }}>{L('สต็อกแต่ละสาขา', 'Stock per Branch')}</div>
      <div className="form-row-3">
        {DB.BRANCHES.map(br => (
          <div key={br.id} className="form-group">
            <label className="label" style={{ color: br.color }}>{br.name}</label>
            <input className="input" type="number" value={form.stock[br.id] || 0} onChange={e => setStock(br.id, e.target.value)} />
          </div>
        ))}
      </div>
      {inp('minStock', L('สต็อกขั้นต่ำ (แจ้งเตือน)', 'Min Stock (Alert)'), 'number')}

      <div className="divider" />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--txt2)' }}>📦 {L('หน่วยบรรจุ','Packaging Units')}</div>
        <button type="button" className="btn btn-ghost btn-xs"
          onClick={()=>{ const d=UTILS.getPackaging(form.unit,'th'); if(d){setForm(f=>({...f,pkgBase:d.base,pkgBaseEN:d.baseEN,pkgLevels:d.levels.map(l=>({...l}))}));} }}>
          ↺ {L('โหลดค่าเริ่มต้น','Reset to Default')}
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="label">{L('หน่วยฐาน (ไทย)','Base Unit (TH)')}</label>
          <input className="input" value={form.pkgBase||''} onChange={e=>setForm(f=>({...f,pkgBase:e.target.value}))}
            placeholder={L('เช่น เม็ด','e.g. Tablet')} />
        </div>
        <div className="form-group">
          <label className="label">Base Unit (EN)</label>
          <input className="input" value={form.pkgBaseEN||''} onChange={e=>setForm(f=>({...f,pkgBaseEN:e.target.value}))}
            placeholder="e.g. Tablet" />
        </div>
      </div>

      {(form.pkgLevels||[]).map((lv,i)=>(
        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 90px 32px', gap:8, marginBottom:8, alignItems:'flex-end' }}>
          <div className="form-group" style={{margin:0}}>
            <label className="label">{L(`ระดับ ${i+1} (ไทย)`,`Level ${i+1} (TH)`)}</label>
            <input className="input input-sm" value={lv.th||''}
              onChange={e=>setForm(f=>({...f,pkgLevels:f.pkgLevels.map((x,j)=>j===i?{...x,th:e.target.value}:x)}))} placeholder={L('แผง','Strip')} />
          </div>
          <div className="form-group" style={{margin:0}}>
            <label className="label">Level {i+1} (EN)</label>
            <input className="input input-sm" value={lv.en||''}
              onChange={e=>setForm(f=>({...f,pkgLevels:f.pkgLevels.map((x,j)=>j===i?{...x,en:e.target.value}:x)}))} placeholder="Strip" />
          </div>
          <div className="form-group" style={{margin:0}}>
            <label className="label">{L('จำนวน (กี่', 'Qty (in')} {form.pkgBase || L('หน่วยฐาน','base')})</label>
            <input className="input input-sm" type="number" min="1" value={lv.qty||1}
              onChange={e=>setForm(f=>({...f,pkgLevels:f.pkgLevels.map((x,j)=>j===i?{...x,qty:parseInt(e.target.value)||1}:x)}))} />
          </div>
          <button type="button" className="btn-icon btn" onClick={()=>setForm(f=>({...f,pkgLevels:f.pkgLevels.filter((_,j)=>j!==i)}))} style={{color:'var(--err)',border:'1px solid var(--border)',marginBottom:0}}>✕</button>
        </div>
      ))}

      <button type="button" className="btn btn-ghost btn-sm" style={{marginBottom:8}}
        onClick={()=>setForm(f=>({...f,pkgLevels:[...(f.pkgLevels||[]),{th:'',en:'',qty:1}]}))}>+ {L('เพิ่มระดับบรรจุ','Add Level')}</button>

      {form.pkgBase && (form.pkgLevels||[]).length>0 && (() => {
        const pkg=UTILS.getPackaging(form.unit,'th',form);
        return pkg ? (
          <div style={{ background:'var(--bg3)', borderRadius:'var(--r2)', padding:12, marginTop:4 }}>
            <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:8, fontWeight:600 }}>👁 {L('ตัวอย่าง','Preview')}: 1 {pkg.chain[pkg.chain.length-1].th} = {pkg.totalInTop} {pkg.base}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              {pkg.chain.map((c,i)=>(
                <React.Fragment key={i}>
                  {i>0&&<span style={{color:'var(--txt4)',fontSize:16}}>▸</span>}
                  <div style={{ background:'var(--bg2)', borderRadius:6, padding:'6px 12px', textAlign:'center', border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800, fontSize:16, color:'var(--acc2)' }}>{i===0?'1':pkg.chain[i].qty}</div>
                    <div style={{ fontSize:11, color:'var(--txt)' }}>{c.th}</div>
                    {i>0&&<div style={{ fontSize:10, color:'var(--ok)' }}>={c.cumulative} {pkg.base}</div>}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : null;
      })()}
    </Modal>
  );
}

// Quick form — minimal fields for bulk entry: code + name (TH/EN) + unit only
function QuickDrugForm({ onSave, onClose, lang, L }) {
  const [form, setForm] = useState({ code: '', nameTH: '', nameEN: '', unit: 'เม็ด', unitMode: 'select' });
  const [errors, setErrors] = useState({});
  const units = ['เม็ด', 'แคปซูล', 'ซอฟเจล', 'ขวด (ml)', 'ขวด (pcs)', 'แผง', 'ชุด', 'กระป๋อง'];

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = true;
    if (!form.nameTH.trim()) e.nameTH = true;
    if (!form.nameEN.trim()) e.nameEN = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      code: form.code.trim(),
      nameTH: form.nameTH.trim(),
      nameEN: form.nameEN.trim(),
      unit: form.unit.trim(),
      catId: 'CAT01',
      subId: 'S0101',
      hasVat: false,
      costEx: 0,
      sellEx: 0,
      stock: { PTN: 0, RAM: 0, CNX: 0 },
      minStock: 100,
      supplierId: 'SUP001'
    });
  };

  return (
    <Modal title={L('เพิ่มสินค้าใหม่ (รวดเร็ว)', 'Quick Add Product')} onClose={onClose} size={500}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก', 'Cancel')}</button><button className="btn btn-primary" onClick={handleSave}>{L('บันทึก', 'Save')}</button></>}>
      <div className="form-group">
        <label className="label">{L('รหัสสินค้า *', 'Code *')}</label>
        <input className={`input${errors.code ? ' border-red' : ''}`} type="text" value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder={L('เช่น D001', 'e.g. D001')} autoFocus />
        {errors.code && <div style={{ color: 'var(--err)', fontSize: 11, marginTop: 2 }}>จำเป็นต้องกรอก</div>}
      </div>
      <div className="form-group">
        <label className="label">{L('ชื่อภาษาไทย *', 'Thai Name *')}</label>
        <input className={`input${errors.nameTH ? ' border-red' : ''}`} type="text" value={form.nameTH}
          onChange={e => setForm(f => ({ ...f, nameTH: e.target.value }))} placeholder={L('เช่น ยาลดไข้', 'e.g. Paracetamol')} />
        {errors.nameTH && <div style={{ color: 'var(--err)', fontSize: 11, marginTop: 2 }}>จำเป็นต้องกรอก</div>}
      </div>
      <div className="form-group">
        <label className="label">{L('ชื่อภาษาอังกฤษ *', 'English Name *')}</label>
        <input className={`input${errors.nameEN ? ' border-red' : ''}`} type="text" value={form.nameEN}
          onChange={e => setForm(f => ({ ...f, nameEN: e.target.value }))} placeholder="e.g. Paracetamol" />
        {errors.nameEN && <div style={{ color: 'var(--err)', fontSize: 11, marginTop: 2 }}>จำเป็นต้องกรอก</div>}
      </div>

      <div className="form-group">
        <label className="label">{L('หน่วย', 'Unit')} — {L('เลือก หรือ พิมพ์เอง', 'Select or type')}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button className={`btn btn-sm ${form.unitMode === 'select' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setForm(f => ({ ...f, unitMode: 'select', unit: 'เม็ด' }))}>
            📋 {L('เลือกจากรายการ', 'Dropdown')}
          </button>
          <button className={`btn btn-sm ${form.unitMode === 'text' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setForm(f => ({ ...f, unitMode: 'text', unit: '' }))}>
            ⌨️ {L('พิมพ์เอง', 'Free text')}
          </button>
        </div>

        {form.unitMode === 'select' ? (
          <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        ) : (
          <input className="input" type="text" value={form.unit}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            placeholder={L('เช่น กล่อง ซม. หลอด...', 'e.g. Box, cm, Tube...')} />
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 16, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--r2)' }}>
        ℹ️ {L('ราคา หมวดหมู่ ผู้จัดจำหน่าย สต็อก สามารถแก้ไขได้ทีหลังในหน้าแก้ไขสินค้า', 'Price, category, supplier, stock can be edited later')}
      </div>
    </Modal>
  );
}

Object.assign(window, { Modal, StatusBadge, BranchBadge, Pagination, SearchInput, ChartWidget, RatingStars, Confirm, PriceDisplay, StockBar, DrugForm, QuickDrugForm });


/* ===== Dashboard.jsx ===== */
// Dashboard.jsx

function DashboardPage({ lang, L, drugs, orders, suppliers, setPage, setViewPO, setShowCreate }) {
  const lowStock = useMemo(() => drugs.filter(d => Object.values(d.stock || {}).some(v => v <= d.minStock)), [drugs]);

  // All order-derived stats memoized together — single pass over orders
  const orderStats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthKeys = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      monthKeys.push(d.toISOString().slice(0, 7));
    }
    const ptn = monthKeys.map(() => 0), ram = [...ptn.map(()=>0)], cnx = [...ptn.map(()=>0)];
    let pending = 0, approved = 0, monthSpend = 0, monthOrderCount = 0;
    orders.forEach(o => {
      if (o.status === 'pending') pending++;
      if (o.status === 'approved') approved++;
      if (o.status === 'cancelled') return;
      const ki = monthKeys.indexOf(o.poDate?.slice(0, 7));
      if (ki >= 0) {
        const t = o.grandTotal || 0;
        if (o.branch === 'PTN') ptn[ki] += t;
        else if (o.branch === 'RAM') ram[ki] += t;
        else if (o.branch === 'CNX') cnx[ki] += t;
      }
      if (o.poDate?.startsWith(thisMonth)) { monthSpend += o.grandTotal || 0; monthOrderCount++; }
    });
    return { pending, approved, monthSpend, monthOrderCount, monthKeys, ptnData: ptn, ramData: ram, cnxData: cnx };
  }, [orders]);

  const { pending, approved, monthSpend, monthOrderCount, monthKeys, ptnData, ramData, cnxData } = orderStats;

  // Drug totals — single reduce pass
  const drugTotals = useMemo(() => {
    let totalStock = 0, stockValue = 0;
    drugs.forEach(d => { totalStock += d.totalStock || 0; stockValue += (d.costEx || 0) * (d.totalStock || 0); });
    return { totalStock, stockValue };
  }, [drugs]);
  const { totalStock, stockValue } = drugTotals;

  // Monthly spend chart data (last 6 months, dynamic)
  const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const enMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = monthKeys.map(k => { const m = parseInt(k.slice(5)) - 1; return lang === 'th' ? thMonths[m] : enMonths[m]; });

  const spendChart = {
    labels: months,
    datasets: [
      { label: lang==='th'?'ประตูน้ำ (PTN)':'Pratu Nam (PTN)', data: ptnData, backgroundColor: 'rgba(17,119,204,.75)', borderColor: '#1177cc', borderWidth: 1.5, borderRadius: 4 },
      { label: lang==='th'?'รามคำแหง (RAM)':'Ramkhamhaeng (RAM)', data: ramData, backgroundColor: 'rgba(6,182,212,.75)', borderColor: '#06b6d4', borderWidth: 1.5, borderRadius: 4 },
      { label: lang==='th'?'เชียงใหม่ (CNX)':'Chiang Mai (CNX)', data: cnxData, backgroundColor: 'rgba(22,163,74,.75)', borderColor: '#16a34a', borderWidth: 1.5, borderRadius: 4 },
    ]
  };

  // Category breakdown — label + colour come from the live category list,
  // so it always reflects the current (and edited) categories.
  // Falls back to SKU count when no cost prices are filled in (value all zero).
  const catMap = {}; // catId -> { label, value, count, color }
  drugs.forEach(d => {
    const cat = UTILS.getCat(d.catId);
    if (!catMap[d.catId]) catMap[d.catId] = { label: lang === 'th' ? cat.name : (cat.nameEN || cat.name), value: 0, count: 0, color: cat.color || '#94a3b8' };
    catMap[d.catId].value += (d.costEx || 0) * (d.totalStock || 0);
    catMap[d.catId].count += 1;
  });
  const totalCatValue = Object.values(catMap).reduce((s, c) => s + c.value, 0);
  const pieByCount = totalCatValue === 0;
  const catArr = Object.values(catMap)
    .filter(c => pieByCount ? c.count > 0 : c.value > 0)
    .sort((a, b) => pieByCount ? b.count - a.count : b.value - a.value)
    .slice(0, 12);
  const pieChart = {
    labels: catArr.map(c => c.label),
    datasets: [{ data: catArr.map(c => pieByCount ? c.count : +c.value.toFixed(0)), backgroundColor: catArr.map(c => c.color), borderWidth: 0 }]
  };

  // Drug counts per category / subcategory for the overview panel
  const catStats = useMemo(() => {
    const byMain = {}, bySub = {};
    drugs.forEach(d => {
      byMain[d.catId] = (byMain[d.catId] || 0) + 1;
      if (d.subId) bySub[d.subId] = (bySub[d.subId] || 0) + 1;
    });
    return { byMain, bySub };
  }, [drugs]);

  // Top 5 drugs by order count
  const top5 = [...drugs].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);

  // Recent POs
  const recentPOs = [...orders].sort((a, b) => new Date(b.poDate) - new Date(a.poDate)).slice(0, 6);

  const StatCard = ({ label, val, sub, color, icon, onClick }) => (
    <div className="stat-card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-val" style={color ? { color } : {}}>{val}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('ภาพรวมระบบ', 'System Dashboard')}</div>
          <div className="page-subtitle">UNIPHARMA — {UTILS.fmtDate('2026-06-14', lang)}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + {L('สร้างใบสั่งซื้อ', 'New Purchase Order')}
        </button>
      </div>

      {/* KPI STATS */}
      <div className="stat-grid">
        <StatCard label={L('ยอดสั่งซื้อเดือนนี้', 'This Month Spend')} val={'฿' + (monthSpend/1000).toFixed(0) + 'K'}
          sub={`${monthOrderCount} ${L('ใบสั่งซื้อ', 'orders')}`} icon="💰" color="var(--acc2)"
          onClick={() => setPage('reports')} />
        <StatCard label={L('รออนุมัติ', 'Pending Approval')} val={pending}
          sub={L('ใบสั่งซื้อ', 'purchase orders')} icon="⏳" color={pending > 0 ? 'var(--warn)' : 'var(--txt)'}
          onClick={() => setPage('orders')} />
        <StatCard label={L('สินค้าใกล้หมด', 'Low Stock Items')} val={lowStock.length}
          sub={L('รายการ ใน 3 สาขา', 'items across branches')} icon="📦" color={lowStock.length > 0 ? 'var(--err)' : 'var(--ok)'}
          onClick={() => setPage('stock')} />
        <StatCard label={L('มูลค่าสต็อกรวม', 'Total Stock Value')} val={'฿' + (stockValue/1000000).toFixed(2) + 'M'}
          sub={`${totalStock.toLocaleString()} ${L('หน่วย', 'units')}`} icon="🏪"
          onClick={() => setPage('stock')} />
        <StatCard label={L('จำนวนรายการยา', 'Drug Items')} val={drugs.length.toLocaleString()}
          sub={L('รายการในระบบ', 'items in system')} icon="💊"
          onClick={() => setPage('drugs')} />
        <StatCard label={L('ผู้จัดจำหน่าย', 'Suppliers')} val={suppliers.length}
          sub={L('ราย', 'suppliers')} icon="🏭" onClick={() => setPage('suppliers')} />
        <StatCard label={L('PO ที่อนุมัติแล้ว', 'Approved POs')} val={approved}
          sub={L('รอจัดส่ง', 'awaiting delivery')} icon="✅" color="var(--ok)"
          onClick={() => setPage('orders')} />
        <StatCard label={L('ราคาถัวเฉลี่ย/รายการ', 'Avg Cost/Item')} val={'฿' + UTILS.fmt(stockValue / Math.max(drugs.length, 1), 0)}
          sub={L('ต้นทุนเฉลี่ย', 'average cost')} icon="📈"
          onClick={() => setPage('reports')} />
      </div>

      {/* CHARTS ROW */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{L('ยอดสั่งซื้อรายเดือน (บาท)', 'Monthly Purchase Spend (THB)')}</span>
          </div>
          <ChartWidget type="bar" data={spendChart} options={{ plugins: { legend: { position: 'bottom' } } }} />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{pieByCount ? L('จำนวนรายการยาตามหมวดหมู่', 'Drug Count by Category') : L('มูลค่าสต็อกตามหมวดหมู่', 'Stock Value by Category')}</span>
          </div>
          <ChartWidget type="doughnut" data={pieChart} options={{ plugins: { legend: { position: 'right' } }, cutout: '60%' }} />
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid-2">
        {/* Top ordered drugs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{L('ยา 5 อันดับสั่งซื้อบ่อย', 'Top 5 Most Ordered Drugs')}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('reports')}>{L('ดูทั้งหมด', 'View All')}</button>
          </div>
          {top5.map((d, i) => (
            <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--acc2)', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ellipsis" style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{d.code} · {lang === 'th' ? UTILS.getCat(d.catId).name : UTILS.getCat(d.catId).nameEN}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--acc2)' }}>{d.orderCount}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{L('ครั้ง/ปี', 'times/yr')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent POs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{L('ใบสั่งซื้อล่าสุด', 'Recent Purchase Orders')}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('orders')}>{L('ดูทั้งหมด', 'View All')}</button>
          </div>
          {recentPOs.map((po, i) => {
            const sup = UTILS.getSupplier(po.supplierId);
            return (
              <div key={po.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < recentPOs.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                onClick={() => setViewPO(po)}>
                <BranchBadge branchId={po.branch} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{po.poNumber}</div>
                  <div className="ellipsis" style={{ fontSize: 11, color: 'var(--txt3)' }}>{lang==='th'?sup.name:(sup.nameEN||sup.name)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>฿{UTILS.fmt(po.grandTotal, 0)}</div>
                  <StatusBadge status={po.status} lang={lang} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LOW STOCK ALERT */}
      {lowStock.length > 0 && (
        <div className="card" style={{ marginTop: 20, borderColor: 'rgba(248,113,113,.3)', background: 'var(--err-bg)' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--err)' }}>⚠ {L('สินค้าใกล้หมดสต็อก', 'Low Stock Alert')} ({lowStock.length} {L('รายการ', 'items')})</span>
            <button className="btn btn-sm" style={{ background: 'var(--err)', color: '#fff' }} onClick={() => setPage('stock')}>{L('ดูทั้งหมด', 'View All')}</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {lowStock.slice(0, 6).map(d => (
              <div key={d.code} className="card-sm" style={{ flex: '1 1 180px', borderColor: 'rgba(248,113,113,.3)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--err)', marginBottom: 4 }} className="ellipsis">{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>{d.code}</div>
                {DB.BRANCHES.map(br => (
                  <div key={br.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: br.color }}>{br.id}</span>
                    <span style={{ color: d.stock[br.id] <= d.minStock ? 'var(--err)' : 'var(--txt3)', fontWeight: d.stock[br.id] <= d.minStock ? 700 : 400 }}>{d.stock[br.id].toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--txt4)', marginTop: 4 }}>Min: {d.minStock.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY OVERVIEW */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">{L('หมวดหมู่ยาทั้งหมด', 'All Drug Categories')}</span>
          <span style={{ fontSize: 12, color: 'var(--txt3)' }}>
            {DB.CATEGORIES.length} {L('หมวดหลัก', 'main')} · {DB.CATEGORIES.reduce((n, c) => n + c.subs.length, 0)} {L('หมวดรอง', 'sub')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
          {DB.CATEGORIES.map(cat => {
            const mainCount = catStats.byMain[cat.id] || 0;
            return (
              <div key={cat.id} style={{ borderRadius: 8, border: '1px solid var(--border)', borderLeft: `4px solid ${cat.color}`, padding: '10px 12px', background: 'var(--bg2)', cursor: 'pointer' }}
                onClick={() => setPage('drugs')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: cat.color, marginBottom: 2, letterSpacing: .3 }}>{cat.id}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35, color: 'var(--txt)' }}>{lang === 'th' ? cat.name : cat.nameEN}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: cat.color, flexShrink: 0, lineHeight: 1 }}>
                    {mainCount.toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {cat.subs.map(sub => {
                    const subCount = catStats.bySub[sub.id] || 0;
                    return (
                      <span key={sub.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'var(--bg3)', color: 'var(--txt3)', lineHeight: 1.6 }}>
                        {lang === 'th' ? sub.name : sub.nameEN}
                        {subCount > 0 && (
                          <span style={{ fontWeight: 700, color: cat.color }}>{subCount}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage });


/* ===== Drugs.jsx ===== */
// Drugs.jsx — Drug Database Page

const PER_PAGE = 50;
// Created once at module level — Intl.Collator construction is expensive
const NATURAL_CMP = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function DrugsPage({ lang, L, drugs, setDrugs, suppliers, categories, setCategories, notify, perm = { canWrite: true } }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [vatFilter, setVatFilter] = useState('all'); // all | vat | novat
  const [branchFilter, setBranchFilter] = useState(''); // '' = all branches; else PTN|RAM|CNX
  const [page, setPage] = useState(1);
  const [editDrug, setEditDrug] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sortCol, setSortCol] = useState('code');
  const [sortDir, setSortDir] = useState('asc');
  const [showPkg, setShowPkg] = useState(false);
  const [expandedCode, setExpandedCode] = useState(null);
  const [showCatMgr, setShowCatMgr] = useState(false);

  const cats = categories || DB.CATEGORIES;
  const selectedCat = cats.find(c => c.id === catFilter);

  // Count items available per branch (stock > 0)
  const branchCounts = useMemo(() => {
    const counts = { '': drugs.length };
    DB.BRANCHES.forEach(br => { counts[br.id] = drugs.filter(d => (d.stock?.[br.id] || 0) > 0).length; });
    return counts;
  }, [drugs]);

  // Effective cost for a drug given the current branch filter
  const getCost = (d, br) => (br && d.costByBranch?.[br] != null) ? d.costByBranch[br] : d.costEx;

  const filtered = useMemo(() => {
    const q = search ? search.toLowerCase() : '';
    // Single-pass filter instead of chained .filter() calls (avoids N intermediate arrays)
    const needFilter = q || catFilter || subFilter || vatFilter !== 'all' || branchFilter;
    let list = needFilter
      ? drugs.filter(d => {
          if (q && !d.code.toLowerCase().includes(q) && !(d.nameTH||'').toLowerCase().includes(q) && !(d.nameEN||'').toLowerCase().includes(q)) return false;
          if (catFilter && d.catId !== catFilter) return false;
          if (subFilter && d.subId !== subFilter) return false;
          if (vatFilter === 'vat' && !d.hasVat) return false;
          if (vatFilter === 'novat' && d.hasVat) return false;
          if (branchFilter && !((d.stock && d.stock[branchFilter]) || 0)) return false;
          return true;
        })
      : drugs.slice(); // shallow copy needed for in-place sort
    list.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const cmp = (typeof av === 'string' || typeof bv === 'string')
        ? NATURAL_CMP.compare(av == null ? '' : String(av), bv == null ? '' : String(bv))
        : (av > bv ? 1 : av < bv ? -1 : 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [drugs, search, catFilter, subFilter, vatFilter, branchFilter, sortCol, sortDir]);

  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const sort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const SortIcon = ({ col }) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const exportDrugs = () => {
    if (!window.XLSX) { notify(L('กำลังโหลด SheetJS กรุณารอสักครู่', 'Loading SheetJS, please wait'), 'warn'); return; }
    const rows = filtered.map(d => ({
      [L('รหัส', 'Code')]: d.code,
      [L('ชื่อยา (ไทย)', 'Name (TH)')]: d.nameTH || '',
      [L('ชื่อยา (อังกฤษ)', 'Name (EN)')]: d.nameEN || '',
      [L('หน่วย', 'Unit')]: d.unit || '',
      [L('หมวดหมู่', 'Category')]: d.catId || '',
      [L('หมวดย่อย', 'Sub-category')]: d.subId || '',
      'VAT': d.hasVat ? 'VAT 7%' : '-',
      [L('ต้นทุน (฿)', 'Cost (฿)')]: d.costEx || 0,
      [L('ราคาขาย ไม่รวม VAT (฿)', 'Sell excl. VAT (฿)')]: d.sellEx || 0,
      [L('ราคาขาย รวม VAT (฿)', 'Sell incl. VAT (฿)')]: d.sellInc || 0,
      [L('กำไร (%)', 'Margin (%)')]: d.profitMargin || 0,
      [L('สต็อกรวม', 'Total Stock')]: d.totalStock || 0,
      'Stock PTN': (d.stock && d.stock.PTN) || 0,
      'Stock RAM': (d.stock && d.stock.RAM) || 0,
      'Stock CNX': (d.stock && d.stock.CNX) || 0,
      [L('สต็อกขั้นต่ำ', 'Min Stock')]: d.minStock || 0,
      [L('ผู้จัดหาย', 'Supplier')]: (() => { const s = suppliers.find(x=>x.id===d.supplierId)||suppliers.find(x=>(x.drugs||[]).includes(d.code)); return s?s.name:(d.supplierId||''); })(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch:10},{wch:40},{wch:40},{wch:12},{wch:20},{wch:20},{wch:10},{wch:14},{wch:22},{wch:22},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:12},{wch:30}];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, L('ยา', 'Drugs'));
    XLSX.writeFile(wb, `drugs_${new Date().toISOString().slice(0,10)}.xlsx`);
    notify(L(`Export ${filtered.length} รายการ ✓`, `Exported ${filtered.length} items ✓`), 'ok');
  };

  const saveDrug = useCallback(saved => {
    setDrugs(prev => {
      const idx = prev.findIndex(d => d.code === saved.code);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setEditDrug(null); setShowAdd(false);
    if (window.UNI_DB) window.UNI_DB.saveDrug(saved);
    notify(L('บันทึกข้อมูลสำเร็จ', 'Saved successfully'));
  }, [setDrugs, notify, L]);

  const saveQuickDrug = useCallback(saved => {
    setDrugs(prev => {
      const idx = prev.findIndex(d => d.code === saved.code);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setShowAdd(false);
    setEditDrug(saved);
    if (window.UNI_DB) window.UNI_DB.saveDrug(saved);
    notify(L('บันทึกข้อมูลสำเร็จ', 'Saved successfully'));
  }, [setDrugs, notify, L]);

  const stockStatus = d => {
    const total = d.totalStock;
    if (total <= d.minStock) return 'err';
    if (total <= d.minStock * 2) return 'warn';
    return 'ok';
  };

  const ColHead = ({ col, children }) => (
    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => sort(col)}>
      {children}{SortIcon({ col })}
    </th>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('ฐานข้อมูลยา', 'Drug Database')}</div>
          <div className="page-subtitle">
            {L('แสดง', 'Showing')} {filtered.length.toLocaleString()} {L('จาก', 'of')} {drugs.length.toLocaleString()} {L('รายการ', 'items')}
            {branchFilter && ` · ${lang === 'th' ? (DB.BRANCHES.find(b=>b.id===branchFilter)||{}).name : (DB.BRANCHES.find(b=>b.id===branchFilter)||{}).nameEN}`}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className={`btn ${showPkg?'btn-primary':'btn-ghost'} btn-sm`} onClick={()=>setShowPkg(v=>!v)}>
            📦 {L('หน่วยบรรจุ','Packaging')} {showPkg?'ON':'OFF'}
          </button>
          {perm.canWrite && (
          <button className="btn btn-ghost" onClick={exportDrugs} title={L(`Export ${filtered.length} รายการ เป็น Excel`, `Export ${filtered.length} items to Excel`)}>
            📥 {L('Export Excel', 'Export Excel')}
          </button>
          )}
          {perm.canWrite && (
          <button className="btn btn-ghost" onClick={() => setShowCatMgr(true)}>
            🏷️ {L('จัดการหมวดหมู่', 'Categories')}
          </button>
          )}
          {perm.canWrite && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + {L('เพิ่มสินค้าใหม่', 'Add Product')}
          </button>
          )}
        </div>
      </div>

      {showCatMgr && (
        <CategoryManagerModal lang={lang} L={L} categories={cats} setCategories={setCategories}
          drugs={drugs} notify={notify} onClose={() => setShowCatMgr(false)} />
      )}

      {/* Packaging info banner */}
      {showPkg && (
        <div style={{ background:'linear-gradient(135deg,var(--acc) 0%,var(--acc2) 100%)', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>📦</span>
          <div style={{ flex:1, color:'#fff' }}>
            <div style={{ fontWeight:700, fontSize:13 }}>{L('โหมดแสดงหน่วยบรรจุ (Preview)','Packaging Units Preview Mode')}</div>
            <div style={{ fontSize:12, opacity:.85 }}>{L('คลิกแถวยาใดก็ได้เพื่อดูหน่วยบรรจุเต็ม · เช่น 1 กล่อง = 3 แผง = 30 เม็ด · ตัวเลขสามารถปรับได้ในหน้าแก้ไขยา',
              'Click any row to see full packaging chain · e.g. 1 Box = 3 Strips = 30 Tablets · Values editable in the Edit screen')}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ color:'#fff', borderColor:'rgba(255,255,255,.4)' }} onClick={()=>setShowPkg(false)}>× {L('ปิด','Close')}</button>
        </div>
      )}

      {/* FILTERS */}
      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label className="label">{L('ค้นหา', 'Search')}</label>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={L('รหัส / ชื่อยา…', 'Code / Drug name…')} />
          </div>
          <div style={{ flex: '0 0 180px' }}>
            <label className="label">{L('หมวดหมู่หลัก', 'Main Category')}</label>
            <select className="input" value={catFilter} onChange={e => { setCatFilter(e.target.value); setSubFilter(''); setPage(1); }}>
              <option value="">{L('ทั้งหมด', 'All Categories')}</option>
              {cats.map(c => <option key={c.id} value={c.id}>{lang === 'th' ? c.name : c.nameEN}</option>)}
            </select>
          </div>
          {selectedCat && (
            <div style={{ flex: '0 0 180px' }}>
              <label className="label">{L('หมวดหมู่รอง', 'Sub Category')}</label>
              <select className="input" value={subFilter} onChange={e => { setSubFilter(e.target.value); setPage(1); }}>
                <option value="">{L('ทั้งหมด', 'All')}</option>
                {selectedCat.subs.map(s => <option key={s.id} value={s.id}>{lang === 'th' ? s.name : s.nameEN}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: '0 0 auto' }}>
            <label className="label">{L('สาขา', 'Branch')}</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[{ id: '', name: 'ทุกสาขา', nameEN: 'All', color: 'var(--acc)' }, ...DB.BRANCHES].map(b => (
                <button key={b.id}
                  className={`btn btn-sm ${branchFilter === b.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setBranchFilter(b.id); setPage(1); }}
                  style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ color: branchFilter === b.id ? '' : b.color, fontWeight: 700 }}>
                    {lang === 'th' ? b.name : b.nameEN}
                  </span>
                  <span style={{ marginLeft: 5, fontSize: 11, opacity: .75 }}>
                    {(branchCounts[b.id] ?? 0).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <label className="label">VAT</label>
            <select className="input" value={vatFilter} onChange={e => { setVatFilter(e.target.value); setPage(1); }}>
              <option value="all">{L('ทั้งหมด', 'All')}</option>
              <option value="vat">{L('มี VAT', 'With VAT')}</option>
              <option value="novat">{L('ไม่มี VAT', 'No VAT')}</option>
            </select>
          </div>
          {(search || catFilter || vatFilter !== 'all' || branchFilter) && (
            <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => { setSearch(''); setCatFilter(''); setSubFilter(''); setVatFilter('all'); setBranchFilter(''); setPage(1); }}>
              ✕ {L('ล้างตัวกรอง', 'Clear')}
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <ColHead col="code">{L('รหัส', 'Code')}</ColHead>
                <ColHead col="nameTH">{L('ชื่อยา', 'Drug Name')}</ColHead>
                <th>{L('หน่วย', 'Unit')}</th>
                <th>{L('หมวดหมู่', 'Category')}</th>
                <th style={{ textAlign: 'center' }}>VAT</th>
                <ColHead col="costEx">{L('ต้นทุน', 'Cost')}{branchFilter ? ` [${branchFilter}]` : ''}</ColHead>
                <ColHead col="sellEx">{L('ราคาขาย', 'Sell Price')}</ColHead>
                <ColHead col="profitMargin">{L('กำไร', 'Profit')}</ColHead>
                <ColHead col="totalStock">{L('สต็อกรวม', 'Total Stock')}</ColHead>
                <th style={{ textAlign: 'center' }}>{L('จัดการ', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr><td colSpan={10} className="no-data">{L('ไม่พบข้อมูล', 'No results found')}</td></tr>
              )}
              {pageData.map(d => {
                const cat = UTILS.getCat(d.catId);
                const sub = UTILS.getSub(d.catId, d.subId);
                const ss = stockStatus(d);
                const isExpanded = expandedCode === d.code;
                return (
                  <React.Fragment key={d.code}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedCode(isExpanded ? null : d.code)}>
                      <td>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--acc2)', fontWeight: 700 }}>{d.code}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{lang === 'th' ? (d.nameEN||'') : d.nameTH}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{UTILS.getUnit(d.unit, lang)}</span>
                        {showPkg && (() => { const pkg=UTILS.getPackaging(d.unit,lang,d); return pkg ? (
                          <div style={{ fontSize:10, color:'var(--acc2)', marginTop:2, lineHeight:1.4 }}>
                            {pkg.chain.map((c,i)=>(
                              <span key={i}>{i>0&&<span style={{color:'var(--txt4)'}}> ▸ </span>}
                                <b>{i===0?'1':pkg.chain[i].qty}</b> {lang==='th'?c.th:c.en}
                              </span>
                            ))}
                            {pkg.chain.length>1&&<span style={{color:'var(--ok)'}}>  ={pkg.totalInTop} {lang==='th'?pkg.base:pkg.baseEN}</span>}
                          </div>
                        ) : null; })()}
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: cat.color, fontWeight: 600 }}>{lang === 'th' ? cat.name : cat.nameEN}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt4)' }}>{lang === 'th' ? sub.name : sub.nameEN}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {d.hasVat
                          ? <span className="badge" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>VAT 7%</span>
                          : <span className="badge" style={{ background: 'var(--bg4)', color: 'var(--txt3)' }}>-</span>}
                      </td>
                      <td className="tbl-num">
                        {d.hasVat ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{UTILS.fmt(d.costInc)} ฿</div>
                            <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ไม่รวม VAT {UTILS.fmt(getCost(d, branchFilter))} ฿</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontWeight: 600 }}>{UTILS.fmt(getCost(d, branchFilter))} ฿</div>
                            {branchFilter && d.costByBranch?.[branchFilter] != null && (
                              <div style={{ fontSize: 10, color: 'var(--acc2)' }}>≠ {UTILS.fmt(d.costEx)} ฿</div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="tbl-num">
                        <div style={{ fontWeight: 600 }}>{UTILS.fmt(d.sellEx)} ฿</div>
                        {d.hasVat && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>+VAT {UTILS.fmt(d.sellInc)} ฿</div>}
                      </td>
                      <td className="tbl-num">
                        <div style={{ fontWeight: 700, color: 'var(--ok)' }}>{UTILS.fmt(d.profitEx)} ฿</div>
                        <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{d.profitMargin}%</div>
                      </td>
                      <td>
                        {branchFilter ? (
                          <span style={{ color: (d.stock?.[branchFilter]||0) <= d.minStock ? 'var(--err)' : 'var(--ok)', fontWeight: 700, fontSize: 13 }}>
                            {(d.stock?.[branchFilter]||0).toLocaleString()}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ color: ss === 'err' ? 'var(--err)' : ss === 'warn' ? 'var(--warn)' : 'var(--ok)', fontWeight: 700, fontSize: 13 }}>
                              {d.totalStock.toLocaleString()}
                            </span>
                            <div style={{ display: 'flex', gap: 3, fontSize: 10 }}>
                              {DB.BRANCHES.map(br => (
                                <span key={br.id} style={{ color: d.stock[br.id] <= d.minStock ? 'var(--err)' : 'var(--txt4)' }}>
                                  {br.id}:{d.stock[br.id]}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        {perm.canWrite ? (
                        <button className="btn btn-ghost btn-xs" onClick={() => setEditDrug(d)}>
                          ✏ {L('แก้ไข', 'Edit')}
                        </button>
                        ) : <span className="text-muted" style={{ fontSize: 11 }}>—</span>}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} style={{ background: 'var(--bg3)', padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4, fontWeight: 600 }}>{L('ราคาต้นทุน', 'Cost Price')}</div>
                              <div style={{ fontSize: 12 }}>{L('ราคาหลัก (ไม่รวม VAT)', 'Default (excl. VAT)')}: <b>{UTILS.fmt(d.costEx)} ฿</b></div>
                              {d.hasVat && <div style={{ fontSize: 12 }}>{L('รวม VAT', 'Incl. VAT')}: <b>{UTILS.fmt(d.costInc)} ฿</b></div>}
                              {DB.BRANCHES.some(br => d.costByBranch?.[br.id] != null) && (
                                <div style={{ marginTop: 6 }}>
                                  <div style={{ fontSize: 10, color: 'var(--txt4)', marginBottom: 3 }}>{L('ต้นทุนแยกสาขา', 'Cost by branch')}:</div>
                                  {DB.BRANCHES.map(br => d.costByBranch?.[br.id] != null ? (
                                    <div key={br.id} style={{ fontSize: 11, display: 'flex', gap: 6 }}>
                                      <span style={{ color: br.color, fontWeight: 700, width: 36 }}>{br.id}:</span>
                                      <b>{UTILS.fmt(d.costByBranch[br.id])} ฿</b>
                                    </div>
                                  ) : null)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4, fontWeight: 600 }}>{L('ราคาขายแยก VAT', 'Sell Price (VAT breakdown)')}</div>
                              <div style={{ fontSize: 12 }}>{L('ไม่รวม VAT', 'Excl. VAT')}: <b>{UTILS.fmt(d.sellEx)} ฿</b></div>
                              <div style={{ fontSize: 12 }}>{L('รวม VAT', 'Incl. VAT')}: <b>{UTILS.fmt(d.sellInc)} ฿</b></div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4, fontWeight: 600 }}>{L('กำไรต่อหน่วย', 'Profit/Unit')}</div>
                              <div style={{ fontSize: 12, color: 'var(--ok)' }}>{UTILS.fmt(d.profitEx)} ฿ ({d.profitMargin}%)</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4, fontWeight: 600 }}>{L('สต็อกแต่ละสาขา', 'Stock by Branch')}</div>
                              {DB.BRANCHES.map(br => (
                                <div key={br.id} style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                                  <span style={{ color: br.color, fontWeight: 700, width: 36 }}>{br.id}:</span>
                                  <span style={{ color: d.stock[br.id] <= d.minStock ? 'var(--err)' : 'var(--txt)' }}>
                                    {d.stock[br.id].toLocaleString()} {d.stock[br.id] <= d.minStock ? '⚠' : ''}
                                  </span>
                                </div>
                              ))}
                              <div style={{ fontSize: 11, color: 'var(--txt4)' }}>Min: {d.minStock.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4, fontWeight: 600 }}>{L('ผู้จัดจำหน่าย', 'Suppliers')}</div>
                              <div style={{ fontSize: 12 }}>
                                <span style={{ color: 'var(--acc2)', fontSize: 10, marginRight: 4 }}>หลัก</span>
                                {(() => { const s = suppliers.find(x=>x.id===d.supplierId) || suppliers.find(x=>(x.drugs||[]).includes(d.code)); return s ? (lang==='th'?s.name:(s.nameEN||s.name)) : d.supplierId; })()}
                              </div>
                              {(d.extraSuppliers || (d.extraSupplierIds||[]).map(id=>({id,costEx:0,sellEx:0}))).filter(s=>s.id).map((sup, i) => (
                                <div key={sup.id} style={{ fontSize: 12, marginTop: 2 }}>
                                  <span style={{ color: 'var(--txt4)', fontSize: 10, marginRight: 4 }}>รายย่อย {i+1}</span>
                                  {(() => { const s = suppliers.find(x=>x.id===sup.id); return s ? (lang==='th'?s.name:(s.nameEN||s.name)) : sup.id; })()}
                                  {(sup.costEx > 0 || sup.sellEx > 0) && (
                                    <span style={{ color: 'var(--txt3)', fontSize: 10, marginLeft: 6 }}>
                                      ต้นทุน {UTILS.fmt(sup.costEx)} · ขาย {UTILS.fmt(sup.sellEx)}
                                    </span>
                                  )}
                                </div>
                              ))}
                              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>{L('สั่งซื้อแล้ว', 'Ordered')} {d.orderCount} {L('ครั้ง/ปี', 'times/yr')}</div>
                            </div>
                            {(() => {
                              const deals = d.supplierDeals || {};
                              const supIds = [d.supplierId, ...(d.extraSuppliers||(d.extraSupplierIds||[]).map(id=>({id}))).filter(s=>s.id).map(s=>s.id)].filter(Boolean);
                              const activDeals = supIds.map(sid => ({ sid, deal: deals[sid] })).filter(({ deal }) => deal && (deal.buyQty>0||deal.freeQty>0||deal.freeItems||deal.specialDiscount>0||deal.note));
                              if (!activDeals.length) return null;
                              return (
                                <div>
                                  <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:4, fontWeight:600 }}>🎁 {L('ดีล','Deals')}</div>
                                  {activDeals.map(({ sid, deal }) => {
                                    const sup = UTILS.getSupplier(sid);
                                    const parts = [];
                                    if (deal.buyQty>0 && deal.freeQty>0) parts.push(`ซื้อ ${deal.buyQty} แถม ${deal.freeQty}`);
                                    if (deal.freeItems) parts.push(`ของแถม: ${deal.freeItems}`);
                                    if (deal.specialDiscount>0) parts.push(`ส่วนลด ${deal.specialDiscount}%`);
                                    if (deal.note) parts.push(deal.note);
                                    return (
                                      <div key={sid} style={{ fontSize:11, marginBottom:3, padding:'3px 8px', background:'var(--ok-bg)', borderRadius:6, border:'1px solid rgba(22,163,74,.2)' }}>
                                        <span style={{ fontWeight:700, color:'var(--ok)', marginRight:4 }}>{sup.name||sup.nameEN||sid}:</span>
                                        {parts.join(' · ')}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                            {(() => { const pkg=UTILS.getPackaging(d.unit,'th',d); return pkg ? (
                              <div>
                                <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:4, fontWeight:600 }}>📦 {L('หน่วยบรรจุ','Packaging')}</div>
                                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                  {pkg.chain.map((c,i)=>(
                                    <React.Fragment key={i}>
                                      {i>0&&<span style={{color:'var(--txt4)',fontSize:14}}>▸</span>}
                                      <div style={{ background:'var(--bg4)', borderRadius:6, padding:'4px 10px', textAlign:'center' }}>
                                        <div style={{ fontWeight:800, fontSize:15, color:'var(--acc2)' }}>{i===0?'1':pkg.chain[i].qty}</div>
                                        <div style={{ fontSize:10, color:'var(--txt3)' }}>{lang==='th'?c.th:c.en}</div>
                                        {i>0&&<div style={{ fontSize:9, color:'var(--txt4)' }}>= {c.cumulative} {lang==='th'?pkg.base:pkg.baseEN}</div>}
                                      </div>
                                    </React.Fragment>
                                  ))}
                                </div>
                                <div style={{ fontSize:11, color:'var(--ok)', marginTop:6, fontWeight:600 }}>
                                  ✓ 1 {lang==='th'?pkg.chain[pkg.chain.length-1].th:pkg.chain[pkg.chain.length-1].en} = {pkg.totalInTop} {lang==='th'?pkg.base:pkg.baseEN}
                                </div>
                              </div>
                            ) : null; })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showAdd && !editDrug && (
        <QuickDrugForm lang={lang} L={L}
          onSave={saveQuickDrug} onClose={() => { setShowAdd(false); setEditDrug(null); }} />
      )}
      {editDrug && (
        <DrugForm drug={editDrug} lang={lang} L={L} suppliers={suppliers}
          onSave={saveDrug} onClose={() => { setShowAdd(false); setEditDrug(null); }} />
      )}
    </div>
  );
}

Object.assign(window, { DrugsPage });


/* ===== Orders.jsx ===== */
// Orders.jsx — Purchase Orders Management

function OrdersPage({ lang, L, orders, setOrders, drugs, suppliers, notify, setViewPO, setShowCreate, perm = { canApprove: true, canDelete: true } }) {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState(null);
  const PER = 15;

  const months = useMemo(() => {
    const s = new Set(orders.map(o => o.poDate?.slice(0, 7)).filter(Boolean));
    return [...s].sort().reverse();
  }, [orders]);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.poNumber?.toLowerCase().includes(q) || UTILS.getSupplier(o.supplierId)?.name?.toLowerCase().includes(q));
    }
    if (branchFilter) list = list.filter(o => o.branch === branchFilter);
    if (statusFilter) list = list.filter(o => o.status === statusFilter);
    if (monthFilter) list = list.filter(o => o.poDate?.startsWith(monthFilter));
    return list.sort((a, b) => new Date(b.poDate) - new Date(a.poDate));
  }, [orders, search, branchFilter, statusFilter, monthFilter]);

  const pageData = filtered.slice((page - 1) * PER, page * PER);

  const totalSpend = filtered.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.grandTotal || 0), 0);

  const updateStatus = (id, newStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, status: newStatus, approvedBy: newStatus === 'approved' ? 'ผู้จัดการจัดซื้อ' : o.approvedBy };
      if (window.UNI_DB) window.UNI_DB.savePO(updated);
      return updated;
    }));
    notify(L('อัปเดตสถานะสำเร็จ', 'Status updated'));
    setConfirmId(null);
  };

  const deleteOrder = id => {
    setOrders(prev => prev.filter(o => o.id !== id));
    if (window.UNI_DB?.enabled) window.UNI_DB.deletePO(id).catch(() => {});
    notify(L('ลบใบสั่งซื้อแล้ว', 'PO deleted'), 'warn');
    setConfirmId(null);
  };

  const statusNextMap = { draft: 'pending', pending: 'approved', approved: 'completed' };
  const statusNextLabel = { draft: L('ส่งอนุมัติ', 'Submit'), pending: L('อนุมัติ', 'Approve'), approved: L('ยืนยันรับ', 'Confirm') };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('การสั่งซื้อ', 'Purchase Orders')}</div>
          <div className="page-subtitle">{filtered.length} {L('รายการ · ยอดรวม', 'orders · Total')} ฿{UTILS.fmt(totalSpend, 0)}</div>
        </div>
        {perm.canWrite && (
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + {L('สร้างใบสั่งซื้อ', 'New PO')}
        </button>
        )}
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['draft', 'pending', 'approved', 'completed', 'cancelled'].map(s => {
          const cnt = orders.filter(o => o.status === s).length;
          return (
            <div key={s} className={`chip${statusFilter === s ? ' active' : ''}`} onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge-dot" style={{ background: UTILS.statusColor(s) }} />
              {UTILS.statusLabel(s, lang)} ({cnt})
            </div>
          );
        })}
      </div>

      {/* FILTERS */}
      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="label">{L('ค้นหา', 'Search')}</label>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={L('เลข PO / ผู้จัดจำหน่าย…', 'PO No. / Supplier…')} />
          </div>
          <div style={{ flex: '0 0 150px' }}>
            <label className="label">{L('สาขา', 'Branch')}</label>
            <select className="input" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }}>
              <option value="">{L('ทุกสาขา', 'All Branches')}</option>
              {DB.BRANCHES.map(b => <option key={b.id} value={b.id}>{lang==='th'?b.name:b.nameEN}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 150px' }}>
            <label className="label">{L('เดือน', 'Month')}</label>
            <select className="input" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1); }}>
              <option value="">{L('ทั้งหมด', 'All')}</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>{L('เลขที่ PO', 'PO Number')}</th>
                <th>{L('สาขา', 'Branch')}</th>
                <th>{L('ผู้จัดจำหน่าย', 'Supplier')}</th>
                <th>{L('วันที่สั่ง', 'PO Date')}</th>
                <th>{L('วันที่ส่ง', 'Delivery')}</th>
                <th style={{ textAlign: 'right' }}>{L('ยอดรวม', 'Grand Total')}</th>
                <th>{L('สถานะ', 'Status')}</th>
                <th style={{ textAlign: 'center' }}>{L('จัดการ', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr><td colSpan={8} className="no-data">{L('ไม่พบข้อมูล', 'No orders found')}</td></tr>
              )}
              {pageData.map(po => {
                const sup = UTILS.getSupplier(po.supplierId);
                const next = statusNextMap[po.status];
                return (
                  <tr key={po.id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--acc2)' }}>{po.poNumber}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{po.items?.length || 0} {L('รายการ', 'items')}</div>
                    </td>
                    <td><BranchBadge branchId={po.branch} /></td>
                    <td>
                      <div className="ellipsis" style={{ maxWidth: 180, fontSize: 13 }}>{lang==='th'?sup.name:(sup.nameEN||sup.name)}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{L('เครดิต', 'Credit')} {po.creditTerm} {L('วัน', 'days')}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{UTILS.fmtDate(po.poDate, lang)}</td>
                    <td style={{ fontSize: 12 }}>{UTILS.fmtDate(po.deliveryDate, lang)}</td>
                    <td className="tbl-num">
                      <div style={{ fontWeight: 700 }}>฿{UTILS.fmt(po.grandTotal, 0)}</div>
                      {po.vat > 0 && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>VAT ฿{UTILS.fmt(po.vat, 0)}</div>}
                    </td>
                    <td><StatusBadge status={po.status} lang={lang} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => setViewPO(po)}>
                          📄 {L('ดูเอกสาร', 'View')}
                        </button>
                        {next && perm.canApprove && (
                          <button className="btn btn-outline btn-xs" onClick={() => updateStatus(po.id, next)}>
                            {statusNextLabel[po.status]}
                          </button>
                        )}
                        {perm.canDelete && (
                          <button className="btn btn-danger btn-xs" onClick={() => setConfirmId(po.id)}>
                            {L('ลบ', 'Delete')}
                          </button>
                        )}
                        {po.status === 'pending' && perm.canApprove && (
                          <button className="btn btn-danger btn-xs" onClick={() => updateStatus(po.id, 'cancelled')}>
                            {L('ยกเลิก', 'Cancel')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
        </div>
      </div>

      {/* NON-PO RECEIPT */}
      {perm.canWrite && (
      <div className="card" style={{ marginTop: 16, padding: 14, borderColor: 'rgba(251,191,36,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🧾</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{L('บันทึกซื้อตรง (Non-PO Receipt)', 'Non-PO Direct Receipt')}</div>
            <div style={{ fontSize: 12, color: 'var(--txt3)' }}>{L('สำหรับการซื้อผ่านยี่ปั๊ว ไม่มีเลข PO', 'For direct purchases without a PO number')}</div>
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
            {L('บันทึก Non-PO', 'Record Non-PO')}
          </button>
        </div>
      </div>
      )}

      {confirmId && (() => {
        const po = orders.find(o => o.id === confirmId);
        return (
          <Confirm lang={lang}
            msg={L(`ต้องการลบใบสั่งซื้อ ${po?.poNumber || ''} ใช่ไหม? ไม่สามารถกู้คืนได้`,
                   `Delete PO ${po?.poNumber || ''}? This cannot be undone.`)}
            onConfirm={() => deleteOrder(confirmId)} onCancel={() => setConfirmId(null)} />
        );
      })()}
    </div>
  );
}

Object.assign(window, { OrdersPage });


/* ===== CreatePO.jsx ===== */
// CreatePO.jsx — Create / Edit Purchase Order Modal

function CreatePOModal({ lang, L, drugs, suppliers, setSuppliers, orders, onClose, onCreated, notify, editPO }) {
  const today = new Date().toISOString().split('T')[0];
  const [branch, setBranch] = useState(() => editPO?.branch || 'PTN');
  const [supplierId, setSupplierId] = useState(() => editPO?.supplierId || '');
  const [supSearch, setSupSearch] = useState('');
  const [supOpen, setSupOpen] = useState(false);
  const [poDate, setPoDate] = useState(() => editPO?.poDate || today);
  const [deliveryDate, setDeliveryDate] = useState(() => editPO?.deliveryDate || '');
  const [creditTerm, setCreditTerm] = useState(() => editPO?.creditTerm ?? 30);
  const [deliveryBranch, setDeliveryBranch] = useState(() => editPO?.deliveryBranch || editPO?.branch || 'PTN');
  const [location, setLocation] = useState(() => editPO?.location || '');
  const [memo, setMemo] = useState(() => editPO?.memo || '');
  const [selectedDeal, setSelectedDeal] = useState('');
  const [dealDiscount, setDealDiscount] = useState(0);
  const [showDealEditor, setShowDealEditor] = useState(false);
  const [dealName, setDealName] = useState('');
  const [dealPct, setDealPct] = useState('');
  const [items, setItems] = useState(() => editPO?.items ? editPO.items.map(it => ({ ...it, unitMode: 'select' })) : []);
  const [searchDrug, setSearchDrug] = useState('');
  const [isNonPO, setIsNonPO] = useState(() => !!editPO?.isNonPO);
  const [createdBy, setCreatedBy] = useState(() => editPO?.createdBy || '');
  const [errors, setErrors] = useState({});
  const [priceHist, setPriceHist] = useState({});
  const [cwStock, setCwStock] = useState({});
  // Prevent auto-fill effects from overwriting loaded edit values on first mount
  const didInit = useRef(false);
  useEffect(() => { didInit.current = true; }, []);

  // Load CW Pharma stock data on mount
  useEffect(() => {
    const cfg = window.UNI_CONFIG || {};
    const url = (cfg.SUPABASE_URL || '').trim();
    const key = (cfg.SUPABASE_ANON_KEY || '').trim();
    if (!url || !key || !window.supabase) return;
    const sb = window.supabase.createClient(url, key);
    sb.from('cwpharma_stock_test')
      .select('code,stock_00,stock_01,stock_02,cost_00,cost_01,cost_02,sell_00,sell_01,sell_02')
      .limit(15000)
      .then(({ data, error }) => {
        if (error || !data || !data.length) return;
        const map = {};
        data.forEach(r => { map[r.code] = r; });
        setCwStock(map);
      });
  }, []);

  const supplier = useMemo(() => suppliers.find(s => s.id === supplierId), [suppliers, supplierId]);

  // Reset deal/credit only when the chosen supplier *changes* — keying on
  // supplierId (not the supplier object) so editing this supplier's
  // promotions doesn't wipe the current selection.
  // In edit mode, skip the first run so loaded values are preserved.
  useEffect(() => {
    if (editPO && !didInit.current) return;
    if (supplier) {
      setCreditTerm(supplier.creditTerm);
      setSelectedDeal('');
      setDealDiscount(0);
      setShowDealEditor(false);
      setDealName(''); setDealPct('');
    }
  }, [supplierId]);

  // Add a new deal, or edit the currently-selected one, and save it back to
  // the supplier (cloud + app state) so every PO sees the latest promotions.
  const saveDeal = async () => {
    const name = (dealName || '').trim();
    const pct = parseFloat(dealPct) || 0;
    if (!name) { notify(L('กรุณาใส่ชื่อดีล', 'Please enter a deal name'), 'err'); return; }
    if (!supplier) return;
    const existing = (supplier.promotions || []).find(p => p.id === selectedDeal);
    let promoId, promos;
    if (existing) {
      promoId = existing.id;
      promos = (supplier.promotions || []).map(p => p.id === promoId ? { ...p, name, type: 'percent', discount: pct } : p);
    } else {
      promoId = 'P' + Date.now();
      promos = [...(supplier.promotions || []), { id: promoId, name, type: 'percent', discount: pct }];
    }
    const updated = { ...supplier, promotions: promos };
    if (setSuppliers) setSuppliers(prev => prev.map(s => s.id === supplier.id ? updated : s));
    try { if (window.UNI_DB && window.UNI_DB.saveSupplier) await window.UNI_DB.saveSupplier(updated); } catch (e) { console.warn('saveDeal:', e); }
    setSelectedDeal(promoId);
    setDealDiscount(pct);
    setShowDealEditor(false);
    notify(existing ? L('แก้ไขดีลแล้ว ✓', 'Deal updated ✓') : L('เพิ่มดีลแล้ว ✓', 'Deal added ✓'), 'success');
  };

  // Branch address in the current language (editable once filled).
  const branchAddr = (id) => {
    const b = DB.BRANCHES.find(x => x.id === id) || {};
    return lang === 'th' ? (b.address || '') : (b.addressEN || b.address || '');
  };

  // Delivery address defaults to the ordering branch; refilled when it changes.
  useEffect(() => {
    if (editPO && !didInit.current) return;
    setDeliveryBranch(branch);
    setLocation(branchAddr(branch));
  }, [branch, lang]);

  // Auto-set delivery date
  useEffect(() => {
    if (editPO && !didInit.current) return;
    if (poDate && supplier) {
      const d = new Date(poDate);
      d.setDate(d.getDate() + supplier.deliveryDays);
      setDeliveryDate(d.toISOString().split('T')[0]);
    }
  }, [poDate, supplier]);

  // Pool of drugs the supplier carries (if listed). Empty supplier list (or no
  // supplier) → fall back to ALL drugs, so a buyer can always find what to add.
  const supplierDrugs = useMemo(() => {
    if (supplier && Array.isArray(supplier.drugs) && supplier.drugs.length > 0) {
      return drugs.filter(d => supplier.drugs.includes(d.code));
    }
    return drugs; // open catalog
  }, [supplier, drugs]);

  const filteredDrugs = useMemo(() => {
    if (!searchDrug) return supplierDrugs.slice(0, 20);
    const q = searchDrug.toLowerCase();
    return supplierDrugs
      .filter(d => d.code.toLowerCase().includes(q) || (d.nameTH || '').toLowerCase().includes(q) || (d.nameEN || '').toLowerCase().includes(q))
      .slice(0, 20);
  }, [supplierDrugs, searchDrug]);

  const drugMap = useMemo(() => {
    const m = new Map();
    drugs.forEach(d => m.set(d.code, d));
    return m;
  }, [drugs]);

  const units = ['เม็ด', 'แคปซูล', 'ซอฟเจล', 'ขวด (ml)', 'ขวด (pcs)', 'แผง', 'ชุด', 'กระป๋อง'];

  const loadPriceHist = async (code) => {
    if (!window.UNI_DB?.loadPriceHistory || priceHist[code] !== undefined) return;
    setPriceHist(prev => ({ ...prev, [code]: null }));
    const rows = await window.UNI_DB.loadPriceHistory(code, supplierId || null);
    if (!rows.length) { setPriceHist(prev => ({ ...prev, [code]: false })); return; }
    const prices = rows.map(r => r.cost_ex).filter(p => p > 0);
    const min = Math.min(...prices);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const last = rows[0];
    setPriceHist(prev => ({ ...prev, [code]: { min, avg, count: rows.length, lastDate: (last.po_date || (last.recorded_at || '').slice(0, 10)), lastPO: last.po_number } }));
  };

  const addItem = drug => {
    setItems(prev => {
      const exists = prev.find(i => i.code === drug.code);
      if (exists) return prev.map(i => i.code === drug.code ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { code: drug.code, nameTH: drug.nameTH, nameEN: drug.nameEN, unit: drug.unit, unitMode: 'select', qty: 1, unitPrice: drug.costEx, vatRate: drug.vatRate, discount: 0 }];
    });
    loadPriceHist(drug.code);
    setSearchDrug('');
  };

  const updateItem = (code, field, val) => {
    setItems(prev => prev.map(i => {
      if (i.code !== code) return i;
      if (field === 'unitMode' || field === 'unit') return { ...i, [field]: val };
      if (field === 'vatRate') return { ...i, [field]: parseInt(val) };
      return { ...i, [field]: val === '' ? 0 : parseFloat(val) };
    }));
  };

  const removeItem = code => setItems(prev => prev.filter(i => i.code !== code));

  const calcLine = item => {
    const base = item.unitPrice * item.qty;
    const afterDisc = base * (1 - (item.discount || 0) / 100);
    return +afterDisc.toFixed(2);
  };

  const summary = useMemo(() => {
    let gross = 0, taxable = 0, nonTaxable = 0;
    items.forEach(it => {
      const line = calcLine(it);
      gross += line;
      if (it.vatRate > 0) taxable += line;
      else nonTaxable += line;
    });
    const vat = +(taxable * 0.07).toFixed(2);
    const afterDeal = gross * (1 - dealDiscount / 100);
    const vatAfter = +(taxable * (1 - dealDiscount / 100) * 0.07).toFixed(2);
    return {
      gross: +gross.toFixed(2),
      discount: +(gross * dealDiscount / 100).toFixed(2),
      afterDiscount: +afterDeal.toFixed(2),
      taxable: +taxable.toFixed(2),
      nonTaxable: +nonTaxable.toFixed(2),
      vat: vatAfter,
      grandTotal: +(afterDeal + vatAfter).toFixed(2)
    };
  }, [items, dealDiscount]);

  const handleDealChange = val => {
    setSelectedDeal(val);
    if (!val) { setDealDiscount(0); return; }
    const promo = supplier?.promotions.find(p => p.id === val);
    setDealDiscount(promo?.discount || 0);
  };

  const validate = () => {
    const e = {};
    if (!branch) e.branch = true;
    if (!supplierId) e.supplierId = true;
    if (items.length === 0) e.items = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (status = 'draft') => {
    if (!validate()) { notify(L('กรุณากรอกข้อมูลให้ครบ', 'Please fill in all required fields'), 'err'); return; }
    const promo = supplier?.promotions?.find(p => p.id === selectedDeal);
    const mappedItems = items.map(it => ({ ...it, amount: calcLine(it) }));
    if (editPO) {
      // Update existing PO — keep original id, poNumber, status, approvedBy
      const updatedPO = {
        ...editPO,
        branch, supplierId, poDate, deliveryDate,
        creditTerm: parseInt(creditTerm),
        deliveryBranch, location, memo, isNonPO,
        dealNote: promo ? promo.name : (dealDiscount > 0 ? `ส่วนลด ${dealDiscount}%` : editPO.dealNote || '-'),
        items: mappedItems,
        grossTotal: summary.gross,
        discount: summary.discount,
        taxableAmt: summary.taxable,
        nonTaxableAmt: summary.nonTaxable,
        vat: summary.vat,
        grandTotal: summary.grandTotal,
        createdBy: createdBy || editPO.createdBy || L('ผู้ใช้งาน', 'User'),
      };
      onCreated(updatedPO, mappedItems);
      return;
    }
    const poNumber = UTILS.generatePONumber(branch, poDate);
    const newPO = {
      id: 'PO' + Date.now(),
      poNumber,
      branch,
      supplierId,
      status,
      poDate,
      deliveryDate,
      creditTerm: parseInt(creditTerm),
      deliveryBranch,
      location,
      memo,
      dealNote: promo ? promo.name : (dealDiscount > 0 ? `ส่วนลด ${dealDiscount}%` : '-'),
      isNonPO,
      items: mappedItems,
      grossTotal: summary.gross,
      discount: summary.discount,
      taxableAmt: summary.taxable,
      nonTaxableAmt: summary.nonTaxable,
      vat: summary.vat,
      grandTotal: summary.grandTotal,
      createdBy: createdBy || L('ผู้ใช้งาน', 'User'),
      approvedBy: status === 'approved' ? L('ผู้จัดการจัดซื้อ', 'Purchasing Manager') : '-'
    };
    onCreated(newPO, mappedItems);
  };

  const branchInfo = DB.BRANCHES.find(b => b.id === branch);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 900, width: '95vw' }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {editPO
                ? `✏ ${L('แก้ไขใบสั่งซื้อ', 'Edit PO')} — ${editPO.poNumber}`
                : `+ ${L('สร้างใบสั่งซื้อ', 'Create Purchase Order')}`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
              {editPO
                ? L('เพิ่ม/แก้ไขรายการสินค้าแล้วกด "บันทึกการแก้ไข"', 'Add or edit items, then click "Save Changes"')
                : `${L('รูปแบบ:', 'Format:')} PO${branchInfo?.code}-${poDate?.replace(/-/g,'').slice(2)}-XXX`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={isNonPO} onChange={e => setIsNonPO(e.target.checked)} />
              <span>{L('Non-PO Receipt', 'Non-PO Receipt')}</span>
            </label>
            <button className="btn-icon" onClick={onClose} style={{ border: 'none', fontSize: 18 }}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          {/* Header Info */}
          <div className="form-row-3" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="label">{L('สาขา *', 'Branch *')}</label>
              <select className={`input${errors.branch ? ' border-red' : ''}`} value={branch} onChange={e => setBranch(e.target.value)}>
                {DB.BRANCHES.map(b => <option key={b.id} value={b.id}>{lang==='th'?b.name:b.nameEN} ({b.id})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">{L('วันที่สั่งซื้อ', 'PO Date')}</label>
              <input className="input" type="date" value={poDate} onChange={e => setPoDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{L('กำหนดส่งมอบ', 'Delivery Date')}</label>
              <input className="input" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">{L('ผู้จัดจำหน่าย *', 'Supplier *')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  className={`input${errors.supplierId ? ' border-red' : ''}`}
                  value={supOpen ? supSearch : (supplier ? (lang === 'th' ? supplier.name : (supplier.nameEN || supplier.name)) : '')}
                  onChange={e => { setSupSearch(e.target.value); setSupOpen(true); }}
                  onFocus={() => { setSupSearch(''); setSupOpen(true); }}
                  onBlur={() => setTimeout(() => setSupOpen(false), 180)}
                  placeholder={L('ค้นหา / พิมพ์ชื่อผู้จัดจำหน่าย…', 'Search / type supplier name…')}
                  autoComplete="off" />
                {supOpen && (() => {
                  const q = (supSearch || '').toLowerCase();
                  const list = suppliers.filter(s => !q
                    || (s.name || '').toLowerCase().includes(q)
                    || (s.nameEN || '').toLowerCase().includes(q)
                    || (s.id || '').toLowerCase().includes(q));
                  return (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 240, overflowY: 'auto', zIndex: 20, boxShadow: '0 6px 18px rgba(0,0,0,.18)' }}>
                      {list.length === 0 ? (
                        <div style={{ padding: 12, fontSize: 12, color: 'var(--txt4)' }}>{L('ไม่พบผู้จัดจำหน่าย', 'No suppliers found')}</div>
                      ) : list.slice(0, 50).map(s => (
                        <div key={s.id}
                          onMouseDown={() => { setSupplierId(s.id); setSupSearch(''); setSupOpen(false); }}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--txt)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ fontWeight: 600 }}>{lang === 'th' ? s.name : (s.nameEN || s.name)}</div>
                          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{s.id}{s.phone ? ' · ' + s.phone : ''}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              {supplier && (
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>
                  📞 {supplier.phone} · เครดิต {supplier.creditTerm} วัน · ส่ง {supplier.deliveryDays} วัน
                </div>
              )}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">{L('เงื่อนไขชำระเงิน (วัน)', 'Credit Term (days)')}</label>
              <input className="input" type="number" value={creditTerm} onChange={e => setCreditTerm(e.target.value)} />
            </div>
          </div>

          {/* Deal / Promotion — select, add, or edit (saved back to the supplier) */}
          {supplier && (
            <div className="form-group">
              <label className="label">🎁 {L('ดีล/โปรโมชั่น', 'Deal/Promotion')}</label>
              <select className="input" value={selectedDeal} onChange={e => handleDealChange(e.target.value)}>
                <option value="">{L('ไม่มีโปรโมชั่น', 'No promotion')}</option>
                {(supplier.promotions || []).map(p => <option key={p.id} value={p.id}>{p.name} ({p.discount || 0}%)</option>)}
              </select>
              {dealDiscount > 0 && (
                <div style={{ fontSize: 12, color: 'var(--ok)', marginTop: 4 }}>
                  ✓ {L('ส่วนลด', 'Discount')} {dealDiscount}% {L('จะถูกคำนวณในยอดรวม', 'applied to total')}
                </div>
              )}

              <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, marginTop: 8 }}
                onClick={() => {
                  const sel = (supplier.promotions || []).find(p => p.id === selectedDeal);
                  setDealName(sel ? sel.name : '');
                  setDealPct(sel ? (sel.discount || 0) : '');
                  setShowDealEditor(s => !s);
                }}>
                {showDealEditor ? '▲' : '➕'} {selectedDeal ? L('แก้ไขดีลนี้', 'Edit this deal') : L('เพิ่มดีลใหม่', 'Add new deal')}
              </button>

              {showDealEditor && (
                <div style={{ marginTop: 8, padding: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 2, margin: 0 }}>
                      <label className="label" style={{ fontSize: 11 }}>{L('ชื่อดีล', 'Deal name')}</label>
                      <input className="input" value={dealName} onChange={e => setDealName(e.target.value)}
                        placeholder={L('เช่น ส่วนลด 5% สั่งเกิน 10,000', 'e.g., 5% off over 10,000')} />
                    </div>
                    <div className="form-group" style={{ width: 90, margin: 0 }}>
                      <label className="label" style={{ fontSize: 11 }}>{L('ส่วนลด %', 'Discount %')}</label>
                      <input className="input" type="number" value={dealPct} onChange={e => setDealPct(e.target.value)} />
                    </div>
                    <button type="button" className="btn btn-primary" style={{ padding: '8px 14px' }} onClick={saveDeal}>
                      💾 {L('บันทึก', 'Save')}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt4)', marginTop: 8 }}>
                    {L('บันทึกแล้วจะอยู่กับผู้จัดจำหน่ายนี้ และใช้ได้ทุกครั้งที่เปิด PO',
                      'Saved to this supplier and available every time you open a PO')}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="label">{L('สถานที่จัดส่ง (สาขา)', 'Delivery Location (Branch)')}</label>
              <select className="input" value={deliveryBranch}
                onChange={e => { setDeliveryBranch(e.target.value); setLocation(branchAddr(e.target.value)); }}>
                {DB.BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>{lang === 'th' ? b.name : b.nameEN}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">{L('ผู้จัดทำ', 'Created By')}</label>
              <input className="input" value={createdBy} onChange={e => setCreatedBy(e.target.value)} placeholder={L('ชื่อผู้จัดทำ…', 'Name…')} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">{L('ที่อยู่จัดส่ง (แก้ไขได้)', 'Delivery Address (editable)')}</label>
            <textarea className="input" rows={2} value={location} onChange={e => setLocation(e.target.value)}
              placeholder={L('ที่อยู่จัดส่ง…', 'Delivery address…')} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            {(() => {
              const b = DB.BRANCHES.find(x => x.id === deliveryBranch);
              return b ? (
                <div style={{ fontSize: 11, color: 'var(--txt4)', marginTop: 4 }}>
                  ⏰ {b.openTime} · 📞 {b.phone}
                </div>
              ) : null;
            })()}
          </div>

          <div className="divider" />

          {/* Drug Search & Add */}
          <div style={{ marginBottom: 12 }}>
            <label className="label">{L('ค้นหาและเพิ่มสินค้า', 'Search & Add Products')}</label>
            <div style={{ position: 'relative' }}>
              <SearchInput value={searchDrug} onChange={setSearchDrug} placeholder={L('พิมพ์รหัส / ชื่อยา…', 'Type code / drug name…')} />
              {searchDrug && filteredDrugs.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)', boxShadow: 'var(--shadow2)', zIndex: 50, maxHeight: 240, overflowY: 'auto', marginTop: 4 }}>
                  {filteredDrugs.map(d => (
                    <div key={d.code} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseDown={() => addItem(d)}>
                      <div>
                        <span style={{ color: 'var(--acc2)', fontFamily: 'monospace', fontSize: 12 }}>{d.code}</span>
                        <span style={{ marginLeft: 8, fontSize: 13 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--txt3)' }}>
                        <div style={{ fontWeight:600, color:'var(--txt)' }}>฿{UTILS.fmt(d.vatRate > 0 ? d.costEx * (1 + d.vatRate / 100) : d.costEx)}{d.vatRate > 0 ? ' (รวม VAT)' : ''}</div>
                        {d.vatRate > 0 && <div style={{ fontSize:10, color:'var(--txt4)' }}>ไม่รวม VAT ฿{UTILS.fmt(d.costEx)}</div>}
                        {(() => {
                          const cw = cwStock[d.code];
                          if (!cw) return <div>สต็อก {d.stock[branch] || 0}</div>;
                          return (
                            <div style={{ display:'flex', gap:3, marginTop:2, justifyContent:'flex-end' }}>
                              {[['PTN',cw.stock_00??0],['RAM',cw.stock_01??0],['CNX',cw.stock_02??0]].map(([id,val]) => (
                                <span key={id} style={{ fontSize:10, padding:'1px 4px', borderRadius:4,
                                  background: id===branch?(val>0?'var(--ok-bg)':'var(--err-bg)'):'var(--bg3)',
                                  color: val>0?'var(--ok)':'var(--err)', fontWeight: id===branch?700:400 }}>
                                  {id}:{val}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchDrug && filteredDrugs.length === 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 12, textAlign: 'center', color: 'var(--txt3)', fontSize: 12, zIndex: 50, marginTop: 4 }}>
                  {L('ไม่พบสินค้า หรือผู้จัดจำหน่ายนี้ไม่มีรายการสินค้านี้', 'Not found or supplier does not carry this item')}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          {errors.items && <div style={{ color: 'var(--err)', fontSize: 12, marginBottom: 8 }}>⚠ {L('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ', 'Please add at least 1 item')}</div>}
          {items.length > 0 && (
            <div className="tbl-wrap" style={{ marginBottom: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{L('รายการสินค้า', 'Product')}</th>
                    <th>{L('หน่วย', 'Unit')}</th>
                    <th style={{ textAlign: 'right' }}>{L('จำนวน', 'Qty')}</th>
                    <th style={{ textAlign: 'right' }}>{L('ราคา/หน่วย', 'Unit Price')}</th>
                    <th style={{ textAlign: 'right' }}>{L('ส่วนลด%', 'Disc%')}</th>
                    <th style={{ textAlign: 'right' }}>VAT%</th>
                    <th style={{ textAlign: 'right' }}>{L('จำนวนเงิน', 'Amount')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.code}>
                      <td style={{ color: 'var(--txt3)', fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === 'th' ? it.nameTH : (it.nameEN||it.nameTH)}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{it.code}</div>
                        {(() => {
                          const drug = drugMap.get(it.code);
                          const deal = drug?.supplierDeals?.[supplierId];
                          if (!deal || !(deal.buyQty>0||deal.freeQty>0||deal.freeItems||deal.specialDiscount>0||deal.note)) return null;
                          const parts = [];
                          if (deal.buyQty>0 && deal.freeQty>0) parts.push(`ซื้อ ${deal.buyQty} แถม ${deal.freeQty}`);
                          if (deal.freeItems) parts.push(`ขอแถม: ${deal.freeItems}`);
                          if (deal.specialDiscount>0) parts.push(`ส่วนลด ${deal.specialDiscount}%`);
                          if (deal.note) parts.push(deal.note);
                          return (
                            <div style={{ fontSize:10, color:'var(--ok)', background:'var(--ok-bg)', border:'1px solid rgba(22,163,74,.25)', borderRadius:4, padding:'2px 7px', marginTop:4, lineHeight:1.5 }}>
                              🎁 {parts.join(' · ')}
                            </div>
                          );
                        })()}
                        {(() => {
                          const cw = cwStock[it.code];
                          if (!cw) return null;
                          const costMap  = { PTN:'cost_00',  RAM:'cost_01',  CNX:'cost_02'  };
                          const poPrice  = parseFloat(it.unitPrice) || 0;
                          const cwCost   = cw[costMap[branch]] || 0;
                          const diffPct  = poPrice > 0 && cwCost > 0 ? ((poPrice - cwCost) / cwCost * 100) : null;
                          return (
                            <div style={{ marginTop:5, padding:'4px 8px', background:'var(--bg3)', borderRadius:6, fontSize:11, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ color:'var(--txt3)', fontWeight:600, fontSize:10 }}>CW</span>
                              {[['PTN','stock_00'],['RAM','stock_01'],['CNX','stock_02']].map(([id,key]) => {
                                const val = cw[key] ?? 0;
                                const isCur = id === branch;
                                return (
                                  <span key={id} style={{ display:'inline-flex', gap:2, alignItems:'center' }}>
                                    <span style={{ color: isCur?'var(--acc2)':'var(--txt4)', fontSize:10, fontWeight: isCur?700:400 }}>{id}</span>
                                    <span style={{ fontWeight:700, color: val>10?'var(--ok)':val>0?'var(--warn)':'var(--err)' }}>{val}</span>
                                  </span>
                                );
                              })}
                              {diffPct !== null && (
                                <span style={{ marginLeft:'auto', fontSize:10, fontWeight:600,
                                  color: diffPct>5?'var(--warn)':diffPct<-5?'var(--ok)':'var(--txt3)' }}>
                                  {diffPct>0?`+${diffPct.toFixed(1)}%`:`${diffPct.toFixed(1)}%`} vs CW ฿{UTILS.fmt(cwCost)}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                          <button className={`btn btn-sm ${it.unitMode === 'select' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => updateItem(it.code, 'unitMode', 'select')}>📋</button>
                          <button className={`btn btn-sm ${it.unitMode === 'text' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => updateItem(it.code, 'unitMode', 'text')}>⌨️</button>
                        </div>
                        {it.unitMode === 'select' ? (
                          <select className="input input-sm" value={it.unit} onChange={e => updateItem(it.code, 'unit', e.target.value)} style={{ width: '100%' }}>
                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        ) : (
                          <input className="input input-sm" type="text" value={it.unit} onChange={e => updateItem(it.code, 'unit', e.target.value)} placeholder={L('หน่วย', 'Unit')} style={{ width: '100%' }} />
                        )}
                      </td>
                      <td>
                        <input className="input input-sm" type="number" min="1" value={it.qty} style={{ width: 70, textAlign: 'right' }} onChange={e => updateItem(it.code, 'qty', e.target.value)} />
                      </td>
                      <td>
                        <input className="input input-sm" type="number" step="0.01" value={it.unitPrice} style={{ width: 90, textAlign: 'right' }} onChange={e => updateItem(it.code, 'unitPrice', e.target.value)} />
                        {(() => {
                          const h = priceHist[it.code];
                          if (!h) return null;
                          const price = parseFloat(it.unitPrice) || 0;
                          const aboveMin = price > 0 && h.min > 0 && price > h.min * 1.01;
                          const belowAvg = price > 0 && h.avg > 0 && price <= h.avg * 0.99;
                          const pctVsMin = h.min > 0 ? Math.round((price - h.min) / h.min * 100) : 0;
                          const pctVsAvg = h.avg > 0 ? Math.round((h.avg - price) / h.avg * 100) : 0;
                          if (aboveMin) return (
                            <div title={`ราคาต่ำสุด: ${UTILS.fmt(h.min)} ฿ (${h.count} ครั้ง)`} style={{ marginTop: 3, fontSize: 10, color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
                              ⚠ +{pctVsMin}% vs ต่ำสุด {UTILS.fmt(h.min)} ฿
                            </div>
                          );
                          if (belowAvg) return (
                            <div title={`เฉลี่ย: ${UTILS.fmt(h.avg)} ฿ (${h.count} ครั้ง)`} style={{ marginTop: 3, fontSize: 10, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
                              ✓ -{pctVsAvg}% vs เฉลี่ย
                            </div>
                          );
                          return (
                            <div style={{ marginTop: 3, fontSize: 10, color: 'var(--txt4)', whiteSpace: 'nowrap' }}>
                              ~ เท่ากับเฉลี่ย ({h.count} ครั้ง)
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <input className="input input-sm" type="number" min="0" max="100" value={it.discount} style={{ width: 70, textAlign: 'right' }} onChange={e => updateItem(it.code, 'discount', e.target.value)} />
                      </td>
                      <td>
                        <select className="input input-sm" value={String(it.vatRate)} onChange={e => updateItem(it.code, 'vatRate', e.target.value)} style={{ width: 100 }}>
                          <option value="0">ไม่มี VAT</option>
                          <option value="7">VAT 7%</option>
                        </select>
                      </td>
                      <td className="tbl-num" style={{ fontWeight: 700 }}>
                        ฿{UTILS.fmt(calcLine(it))}
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => removeItem(it.code)} style={{ color: 'var(--err)' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          {items.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ minWidth: 300 }}>
                <div className="card-sm" style={{ padding: 16 }}>
                  {[
                    [L('ยอดรวมก่อนส่วนลด (Gross)', 'Gross Total'), UTILS.fmt(summary.gross)],
                    dealDiscount > 0 ? [L(`ส่วนลดดีล ${dealDiscount}%`, `Deal Discount ${dealDiscount}%`), `- ${UTILS.fmt(summary.discount)}`, 'var(--ok)'] : null,
                    [L('รายการไม่มี VAT', 'Non-Taxable'), UTILS.fmt(summary.nonTaxable)],
                    [L('รายการมี VAT', 'Taxable Amount'), UTILS.fmt(summary.taxable)],
                    [L('ภาษีมูลค่าเพิ่ม 7%', 'VAT 7%'), UTILS.fmt(summary.vat)],
                  ].filter(Boolean).map(([lbl, val, color]) => (
                    <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: 'var(--txt3)' }}>{lbl}</span>
                      <span style={{ fontWeight: 600, color: color || 'var(--txt)' }}>฿{val}</span>
                    </div>
                  ))}
                  <div className="divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                    <span style={{ color: 'var(--acc2)' }}>{L('ยอดสุทธิ', 'Grand Total')}</span>
                    <span style={{ color: 'var(--acc2)' }}>฿{UTILS.fmt(summary.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Memo */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="label">{L('หมายเหตุ', 'Memo')}</label>
            <textarea className="input" rows={2} value={memo} onChange={e => setMemo(e.target.value)} placeholder={L('หมายเหตุเพิ่มเติม…', 'Additional notes…')} style={{ resize: 'vertical' }} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก', 'Cancel')}</button>
          {editPO ? (
            <button className="btn btn-primary" onClick={() => handleSubmit(editPO.status)}>
              💾 {L('บันทึกการแก้ไข', 'Save Changes')}
            </button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => handleSubmit('draft')}>💾 {L('บันทึกร่าง', 'Save Draft')}</button>
              <button className="btn btn-primary" onClick={() => handleSubmit('pending')}>📤 {L('ส่งอนุมัติ', 'Submit for Approval')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CreatePOModal });


/* ===== PODocument.jsx ===== */
// PODocument.jsx — A4 PO Document Viewer + Print
function numToEnWords(n){
  const a=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const b=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function conv(n){if(n<20)return a[n];if(n<100)return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'');if(n<1000)return a[Math.floor(n/100)]+' hundred'+(n%100?' '+conv(n%100):'');if(n<1000000)return conv(Math.floor(n/1000))+' thousand'+(n%1000?' '+conv(n%1000):'');return conv(Math.floor(n/1000000))+' million'+(n%1000000?' '+conv(n%1000000):'');}
  const rounded=Math.round(n*100)/100;
  const intPart=Math.floor(rounded);
  const dec=Math.round((rounded-intPart)*100);
  let res=intPart===0?'zero':conv(intPart);
  res+=' baht';
  if(dec>0) res+=' and '+conv(dec)+' satang';
  else res+=' only';
  return res.charAt(0).toUpperCase()+res.slice(1);
}
function PODocumentModal({ po, lang, L, suppliers, onClose, onEdit }) {
  const supplier = suppliers.find(s => s.id === po.supplierId) || {};
  const branch = DB.BRANCHES.find(b => b.id === po.branch) || {};
  const deliveryBranch = DB.BRANCHES.find(b => b.id === (po.deliveryBranch || po.branch)) || branch;

  const COMPANY = {
    nameTH: 'บริษัท แม็กนิฟิเซนท์ เมียนม่าร์ จำกัด (สำนักงานใหญ่)',
    nameEN: 'MAGNIFICENT MYANMAR CO., LTD. (Head Office)',
    taxId: '0105565115671',
    address: '491/4 ถนนราชปรารภ แขวงมักกะสัน เขตราชเทวี กรุงเทพมหานคร 10400',
    tel: '+66 80 005 5690, +66 92 938 1490, +66 80 182 7287'
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=900,height=700');
    const style = `
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Noto Sans Thai','Times New Roman',serif;font-size:10pt;color:#111;background:#fff}
        .doc{width:210mm;margin:0 auto;padding:14mm}
        .header{display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;border-bottom:2px solid #333;padding-bottom:12px}
        .logo{width:80px;flex-shrink:0}
        .logo img{width:100%;object-fit:contain}
        .company-info{flex:1}
        .company-name-th{font-size:13pt;font-weight:700;color:#1a1a1a}
        .company-name-en{font-size:11pt;font-weight:700;margin-bottom:4px}
        .company-detail{font-size:8.5pt;color:#444;line-height:1.6}
        .po-title{text-align:center;margin:16px 0;background:#e8e8e8;padding:10px;border-radius:4px}
        .po-title h1{font-size:16pt;font-weight:700;letter-spacing:1px}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:12px;border:1px solid #ccc}
        .info-col{padding:10px 12px;border-right:1px solid #ccc}
        .info-col:last-child{border-right:none}
        .info-row{margin-bottom:5px;font-size:9.5pt;line-height:1.4}
        .info-label{font-weight:700;color:#333;margin-right:4px}
        .currency-row{text-align:right;font-size:9pt;font-weight:700;margin-bottom:8px;color:#333}
        table{width:100%;border-collapse:collapse;margin-bottom:12px}
        th{background:#d0d0d0;font-weight:700;padding:6px 8px;text-align:left;border:1px solid #999;font-size:9pt}
        td{padding:6px 8px;border:1px solid #ccc;font-size:9pt;vertical-align:top}
        .num{text-align:right}
        .summary-row{display:flex;justify-content:space-between;padding:3px 0;font-size:9.5pt}
        .summary-section{width:280px;margin-left:auto;margin-bottom:12px;border-top:1px solid #999;padding-top:8px}
        .grand-total{font-weight:700;font-size:11pt;border-top:2px solid #333;padding-top:4px;margin-top:4px}
        .thai-words{font-style:italic;font-size:9pt;color:#444;margin-bottom:16px}
        .sig-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px}
        .sig-box{text-align:center;border-top:1px dashed #999;padding-top:8px;font-size:9pt}
        .sig-name{font-style:italic;font-size:10pt;font-weight:700;margin-bottom:4px}
        .memo-section{font-size:9pt;color:#444;margin-bottom:12px}
        @page{size:A4;margin:0}
      </style>
    `;
    const html = printWin.document;
    html.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PO - ${po.poNumber}</title>${style}<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700&display=swap" rel="stylesheet"></head><body><div class="doc">${document.getElementById('po-doc-inner').innerHTML}</div></body></html>`);
    html.close();
    setTimeout(() => { printWin.focus(); printWin.print(); }, 800);
  };

  const rows = po.items || [];
  const hasVatItems = rows.some(r => r.vatRate > 0);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 860, width: '95vw', maxHeight: '95vh' }}>
        <div className="modal-header no-print">
          <span className="modal-title">📄 {po.poNumber}</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={po.status} lang={lang} />
            {onEdit && (
              <button className="btn btn-outline btn-sm" onClick={onEdit}>
                ✏ {L('แก้ไข/เพิ่มรายการ', 'Edit / Add Items')}
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨 {L('พิมพ์', 'Print')}</button>
            <button className="btn-icon" onClick={onClose} style={{ border: 'none', fontSize: 18 }}>✕</button>
          </div>
        </div>
        <div className="modal-body" style={{ background: '#e0e0e0', padding: 24 }}>
          {/* A4 Document */}
          <div id="po-doc-inner" className="po-doc" style={{ margin: '0 auto' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14, borderBottom: '2px solid #222', paddingBottom: 12 }}>
              <img src="assets/logo.png" alt="Unipharma" style={{ width: 80, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13pt', fontWeight: 800, color: '#111', lineHeight: 1.3 }}>{COMPANY.nameTH}</div>
                <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 6, color: '#222' }}>{COMPANY.nameEN}</div>
                <div style={{ fontSize: '8.5pt', color: '#444', lineHeight: 1.7 }}>
                  <div><b>Tax ID:</b> {COMPANY.taxId}</div>
                  <div>{COMPANY.address}</div>
                  <div><b>Contact:</b> {COMPANY.tel}</div>
                </div>
              </div>
            </div>

            {/* PO TITLE */}
            <div style={{ textAlign: 'center', background: '#e0e0e0', padding: '8px 0', margin: '12px 0', borderRadius: 2 }}>
              <div style={{ fontSize: '15pt', fontWeight: 800, letterSpacing: 2 }}>Purchase Order</div>
              {po.isNonPO && <div style={{ fontSize: '9pt', color: '#666' }}>(Non-PO Receipt)</div>}
            </div>

            {/* SUPPLIER + PO INFO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #ccc', marginBottom: 12 }}>
              <div style={{ padding: '10px 12px', borderRight: '1px solid #ccc' }}>
                {[
                  ['Name', lang==='th'?(supplier.name||'-'):(supplier.nameEN||supplier.name||'-')],
                  ['Address', supplier.address || '-'],
                  ['Branch No.', branch.code ? `${branch.id} (${branch.code})` : '-'],
                  ['Tax ID', supplier.taxId || '-'],
                  ['Contact', supplier.contact || '-'],
                  ['Tel', supplier.phone || '-'],
                  ['Credit Term', `${po.creditTerm || 30} Days`],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ marginBottom: 4, fontSize: '9.5pt', lineHeight: 1.4 }}>
                    <b>{lbl}:</b> <span style={{ color: '#333' }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 12px' }}>
                {[
                  ['Purchase Order No.', po.poNumber],
                  ['Purchase Requisition No.', po.isNonPO ? 'Non-PO' : '-'],
                  ['Purchase Order Date', UTILS.fmtDate(po.poDate, 'en')],
                  ['Delivery Date', UTILS.fmtDate(po.deliveryDate, 'en')],
                  ['Deliver To', po.location || deliveryBranch.addressEN || deliveryBranch.nameEN || '-'],
                  ['Branch Tel', deliveryBranch.phone || '-'],
                  ['Deal / Note', po.dealNote || '-'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ marginBottom: 4, fontSize: '9.5pt', lineHeight: 1.4 }}>
                    <b>{lbl}:</b> <span style={{ color: '#333' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CURRENCY */}
            <div style={{ textAlign: 'right', fontSize: '9pt', fontWeight: 700, marginBottom: 8 }}>Currency: THB</div>

            {/* ITEMS TABLE */}
            <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
              <thead>
                <tr>
                  {['No.', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Amount', 'VAT'].map(h => (
                    <th key={h} style={{ background: '#d5d5d5', padding: '6px 8px', border: '1px solid #999', fontSize: '9pt', fontWeight: 700, textAlign: h === 'No.' || h === 'VAT' ? 'center' : h === 'Quantity' || h === 'Unit Price' || h === 'Amount' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((it, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontSize: '9pt' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '9pt' }}>
                      <div style={{ fontWeight: 600 }}>{it.code} — {lang === 'th' ? it.nameTH : (it.nameEN || it.nameTH)}</div>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt' }}>{it.qty?.toLocaleString()}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '9pt' }}>{UTILS.getUnit(it.unit, lang)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt' }}>
                      {UTILS.fmt(it.unitPrice)}
                      {it.discount > 0 && <div style={{ fontSize: '8pt', color: '#888' }}>{lang==='th'?'ส่วนลด':'Disc.'} {it.discount}%</div>}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt', fontWeight: 600 }}>{UTILS.fmt(it.amount || (it.unitPrice * it.qty * (1 - (it.discount || 0) / 100)))}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontSize: '9pt' }}>{it.vatRate > 0 ? it.vatRate : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* MEMO + SUMMARY */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '9.5pt', fontWeight: 700, marginBottom: 4 }}>Memo:</div>
                <div style={{ fontSize: '9pt', color: '#444', lineHeight: 1.6 }}>{po.memo || '-'}</div>
              </div>
              <div style={{ minWidth: 260 }}>
                {[
                  ['Gross Total', UTILS.fmt(po.grossTotal || 0)],
                  ['Non-Taxable Amount Total', UTILS.fmt(po.nonTaxableAmt ?? po.nonTaxable ?? 0)],
                  ['Taxable Amount Total', UTILS.fmt(po.taxableAmt ?? po.taxable ?? 0)],
                  ['VAT', UTILS.fmt(po.vat || 0)],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5pt', padding: '3px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ color: '#555' }}>{lbl}</span>
                    <span style={{ fontFamily: 'monospace' }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt', fontWeight: 800, borderTop: '2px solid #333', paddingTop: 6, marginTop: 4 }}>
                  <span>Grand Total</span>
                  <span>{UTILS.fmt(po.grandTotal || 0)}</span>
                </div>
                <div style={{ fontSize: '8.5pt', color: '#555', fontStyle: 'italic', marginTop: 4, textAlign: 'right' }}>
                  ({lang==='th' ? UTILS.numToThaiWords(po.grandTotal || 0) : numToEnWords(po.grandTotal || 0)})
                </div>
              </div>
            </div>

            {/* SIGNATURES */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <div style={{ textAlign: 'center', minWidth: 220 }}>
                <div style={{ fontStyle: 'italic', fontSize: '11pt', fontWeight: 700, marginBottom: 12, color: '#333' }}>{po.createdBy || '-'}</div>
                <div style={{ borderTop: '1px solid #999', paddingTop: 6, fontSize: '9pt' }}>Created By</div>
                <div style={{ fontSize: '9pt', color: '#555', marginTop: 4 }}>Date …{UTILS.fmtDate(po.poDate, 'en')}…</div>
              </div>
            </div>

            {/* PAGE */}
            <div style={{ textAlign: 'right', fontSize: '8pt', color: '#888', marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 6 }}>1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PODocumentModal });


/* ===== Suppliers.jsx ===== */
// Suppliers.jsx — Supplier Management

function SuppliersPage({ lang, L, suppliers, setSuppliers, drugs, setDrugs, orders, notify, setShowCreate, perm = { canWrite: true } }) {
  const [search, setSearch] = useState('');
  const [editSup, setEditSup] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [viewSup, setViewSup] = useState(null);

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(s => s.name.toLowerCase().includes(q) || s.nameEN.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q));
  }, [suppliers, search]);

  const getSupStats = sup => {
    const supOrders = orders.filter(o => o.supplierId === sup.id && o.status !== 'cancelled');
    const totalSpend = supOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
    return { orderCount: supOrders.length, totalSpend };
  };

  const saveSup = saved => {
    setSuppliers(prev => {
      const idx = prev.findIndex(s => s.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setEditSup(null); setShowAdd(false);
    if (window.UNI_DB) window.UNI_DB.saveSupplier(saved);
    notify(L('บันทึกข้อมูลผู้จัดจำหน่ายสำเร็จ', 'Supplier saved'));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('ผู้จัดจำหน่าย', 'Suppliers')}</div>
          <div className="page-subtitle">{filtered.length} {L('ราย', 'suppliers')}</div>
        </div>
        {perm.canWrite && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ {L('เพิ่มผู้จัดจำหน่าย', 'Add Supplier')}</button>}
      </div>

      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <SearchInput value={search} onChange={setSearch} placeholder={L('ค้นหาผู้จัดจำหน่าย…', 'Search supplier…')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
        {filtered.map(sup => {
          const stats = getSupStats(sup);
          return (
            <div key={sup.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setViewSup(sup)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--txt)', marginBottom: 2 }} className="ellipsis">{lang==='th'?sup.name:(sup.nameEN||sup.name)}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }} className="ellipsis">{lang==='th'?(sup.nameEN||''):sup.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }} onClick={e => e.stopPropagation()}>
                  {perm.canWrite && <button className="btn btn-ghost btn-xs" onClick={() => setEditSup(sup)}>✏</button>}
                  {perm.canWrite && <button className="btn btn-primary btn-xs" onClick={() => { setShowCreate && setShowCreate(true); }}>+ PO</button>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  [L('ผู้ติดต่อ', 'Contact'), sup.contact],
                  [L('โทร', 'Phone'), sup.phone],
                  [L('เครดิต', 'Credit'), `${sup.creditTerm} ${L('วัน', 'days')}`],
                  [L('ระยะส่ง', 'Delivery'), `${sup.deliveryDays} ${L('วัน', 'days')}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{k}</div>
                    <div style={{ fontSize: 12, color: 'var(--txt)', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div className="card-sm" style={{ flex: 1, textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--acc2)' }}>{stats.orderCount}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{L('ใบสั่งซื้อ', 'Orders')}</div>
                </div>
                <div className="card-sm" style={{ flex: 2, textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ok)' }}>฿{(stats.totalSpend / 1000).toFixed(0)}K</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{L('ยอดรวม', 'Total Spend')}</div>
                </div>
                <div className="card-sm" style={{ flex: 1, textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--warn)' }}>{sup.rating}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>★ {L('คะแนน', 'Rating')}</div>
                </div>
              </div>

              {sup.promotions?.length > 0 && (
                <div style={{ marginBottom: sup.returnPolicy ? 6 : 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--txt4)', marginBottom: 4, fontWeight: 600 }}>🎁 {L('โปรโมชั่น', 'Promotions')}</div>
                  {sup.promotions.map(p => (
                    <div key={p.id} style={{ fontSize: 11, color: 'var(--ok)', background: 'var(--ok-bg)', borderRadius: 4, padding: '3px 8px', marginBottom: 3 }}>
                      {p.name} · {L('ถึง', 'until')} {UTILS.fmtDate(p.validUntil, lang)}
                    </div>
                  ))}
                </div>
              )}
              {(sup.returnPolicy || sup.returnPolicyEN) && (
                <div style={{ fontSize: 11, color: 'var(--txt3)', background: 'var(--card2)', borderRadius: 6, padding: '5px 8px' }}>
                  <span style={{ color: 'var(--txt4)', marginRight: 4 }}>↩</span>{lang==='en' ? (sup.returnPolicyEN || sup.returnPolicy) : (sup.returnPolicy || sup.returnPolicyEN)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewSup && <SupplierDetail sup={viewSup} lang={lang} L={L} drugs={drugs} setDrugs={setDrugs} orders={orders} onClose={() => setViewSup(null)} onEdit={() => { setEditSup(viewSup); setViewSup(null); }} />}
      {(showAdd || editSup) && <SupplierForm sup={editSup} lang={lang} L={L} drugs={drugs} onSave={saveSup} onClose={() => { setShowAdd(false); setEditSup(null); }} />}
    </div>
  );
}

function SupplierDetail({ sup, lang, L, drugs, setDrugs, orders, onClose, onEdit }) {
  const [dealEdit, setDealEdit] = React.useState(null);
  const supDrugs = drugs.filter(d => sup.drugs?.includes(d.code));
  const supOrders = orders.filter(o => o.supplierId === sup.id).sort((a, b) => new Date(b.poDate) - new Date(a.poDate));

  const saveDeal = (drugCode, dealData) => {
    setDrugs(prev => prev.map(d => {
      if (d.code !== drugCode) return d;
      const saved = { ...d, supplierDeals: { ...(d.supplierDeals||{}), [sup.id]: dealData } };
      if (window.UNI_DB) window.UNI_DB.saveDrug(saved);
      return saved;
    }));
    setDealEdit(null);
  };
  const removeDeal = (drugCode) => {
    setDrugs(prev => prev.map(d => {
      if (d.code !== drugCode) return d;
      const { [sup.id]: _, ...rest } = (d.supplierDeals || {});
      const saved = { ...d, supplierDeals: rest };
      if (window.UNI_DB) window.UNI_DB.saveDrug(saved);
      return saved;
    }));
  };

  return (
    <Modal title={lang==='th'?sup.name:(sup.nameEN||sup.name)} onClose={onClose} size={800}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{L('ปิด', 'Close')}</button><button className="btn btn-outline" onClick={onEdit}>✏ {L('แก้ไข', 'Edit')}</button></>}>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>{L('ข้อมูลทั่วไป', 'General Info')}</div>
          {[['Tax ID', sup.taxId], [L('ที่อยู่', 'Address'), sup.address], ['Email', sup.email], [L('เครดิต', 'Credit Term'), `${sup.creditTerm} ${lang==='th'?'วัน':'days'}`], [L('ระยะส่ง', 'Delivery'), `${sup.deliveryDays} ${lang==='th'?'วัน':'days'}`], [L('สั่งขั้นต่ำ', 'Min Order'), `฿${UTILS.fmt(sup.minOrder, 0)}`]].filter(([,v])=>v).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12 }}>
              <span style={{ color: 'var(--txt3)', minWidth: 80, flexShrink: 0 }}>{k}:</span>
              <span style={{ color: 'var(--txt)' }}>{v}</span>
            </div>
          ))}
          {(sup.contacts?.filter(c=>c.name||c.phone) || (sup.contact?[{name:sup.contact,phone:sup.phone}]:[])).map((c,i,arr) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:5, fontSize:12 }}>
              <span style={{ color:'var(--txt3)', minWidth:80, flexShrink:0 }}>{L('ผู้ติดต่อ','Contact')}{arr.length>1?` ${i+1}`:''}:</span>
              <span style={{ color:'var(--txt)' }}>{c.name}{c.name&&c.phone?' · ':''}{c.phone}</span>
            </div>
          ))}
          {(sup.returnPolicy || sup.returnPolicyEN) && (
            <div style={{ display:'flex', gap:8, marginBottom:5, fontSize:12 }}>
              <span style={{ color:'var(--txt3)', minWidth:80, flexShrink:0 }}>↩ {L('นโยบายคืน','Return')}:</span>
              <span style={{ color:'var(--txt)' }}>{lang==='en' ? (sup.returnPolicyEN || sup.returnPolicy) : (sup.returnPolicy || sup.returnPolicyEN)}</span>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>🎁 {L('โปรโมชั่น', 'Promotions')}</div>
          {sup.promotions?.map(p => (
            <div key={p.id} className="card-sm" style={{ marginBottom: 8, borderColor: 'rgba(52,211,153,.3)' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ok)', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{L('ถึง', 'Valid until')} {UTILS.fmtDate(p.validUntil, lang)}</div>
            </div>
          ))}
          {(!sup.promotions || sup.promotions.length === 0) && <div style={{ fontSize: 12, color: 'var(--txt4)' }}>{L('ไม่มีโปรโมชั่น', 'No promotions')}</div>}
        </div>
      </div>
      {(() => {
        const drugDeals = drugs.filter(d => { const deal = d.supplierDeals?.[sup.id]; return deal && (deal.buyQty>0||deal.freeQty>0||deal.freeItems||deal.specialDiscount>0||deal.note); });
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontWeight:700, fontSize:12, color:'var(--txt3)' }}>🎁 {L('ดีลต่อสินค้า','Per-Drug Deals')} ({drugDeals.length})</div>
              <button className="btn btn-ghost btn-xs" onClick={() => setDealEdit({ drugCode:'', deal:{ buyQty:'', freeQty:'', freeItems:'', specialDiscount:'', note:'' } })}>+ {L('เพิ่มดีล','Add Deal')}</button>
            </div>
            {drugDeals.length > 0 ? (
              <div className="tbl-wrap" style={{ maxHeight:200 }}>
                <table>
                  <thead><tr><th>{L('รหัส','Code')}</th><th>{L('ชื่อ','Name')}</th><th>{L('ซื้อ/แถม','Buy/Free')}</th><th className="tbl-num">{L('ส่วนลด%','Disc%')}</th><th>{L('หมายเหตุ','Note')}</th><th style={{ width:56 }}></th></tr></thead>
                  <tbody>{drugDeals.map(d => {
                    const deal = d.supplierDeals[sup.id];
                    return (
                      <tr key={d.code}>
                        <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--acc2)' }}>{d.code}</td>
                        <td style={{ fontSize:12 }}>{lang==='th'?d.nameTH:(d.nameEN||d.nameTH)}</td>
                        <td style={{ fontSize:11 }}>{deal.buyQty>0&&deal.freeQty>0?`${deal.buyQty}+${deal.freeQty}`:deal.freeItems||'-'}</td>
                        <td className="tbl-num" style={{ fontSize:11 }}>{deal.specialDiscount>0?`${deal.specialDiscount}%`:'-'}</td>
                        <td style={{ fontSize:11, color:'var(--txt3)' }}>{deal.note||'-'}</td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button className="btn-icon" style={{ fontSize:12 }} title={L('แก้ไข','Edit')} onClick={() => setDealEdit({ drugCode:d.code, deal:{ buyQty:deal.buyQty||'', freeQty:deal.freeQty||'', freeItems:deal.freeItems||'', specialDiscount:deal.specialDiscount||'', note:deal.note||'' } })}>✏</button>
                            <button className="btn-icon" style={{ fontSize:12, color:'var(--err)' }} title={L('ลบ','Remove')} onClick={() => removeDeal(d.code)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize:12, color:'var(--txt4)', padding:'8px 0' }}>{L('ยังไม่มีดีล — กด + เพิ่มดีล เพื่อเริ่มต้น','No deals yet — click + Add Deal to start')}</div>
            )}
          </div>
        );
      })()}
      {dealEdit !== null && <DealEditorModal lang={lang} L={L} drugs={drugs} supId={sup.id} initialDrugCode={dealEdit.drugCode} initialDeal={dealEdit.deal} onSave={saveDeal} onClose={() => setDealEdit(null)} />}
      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>📦 {L('รายการสินค้า', 'Products')} ({supDrugs.length})</div>
      <div className="tbl-wrap" style={{ maxHeight: 200, marginBottom: 16 }}>
        <table>
          <thead><tr><th>{L('รหัส', 'Code')}</th><th>{L('ชื่อ', 'Name')}</th><th>{L('หน่วย', 'Unit')}</th><th className="tbl-num">{L('ราคา Supplier นี้', "Supplier's Price")}</th><th className="tbl-num">{L('ราคาขาย', 'Sell')}</th></tr></thead>
          <tbody>{supDrugs.slice(0, 30).map(d => (
            <tr key={d.code}>
              <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{d.code}</td>
              <td style={{ fontSize: 12 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</td>
              <td style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getUnit(d.unit, lang)}</td>
              <td className="tbl-num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--acc2)' }}>
                {UTILS.fmt(sup.drugPrices?.[d.code] ?? d.costEx)} ฿
              </td>
              <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(d.sellEx)} ฿</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>📋 {L('ประวัติสั่งซื้อ', 'Order History')} ({supOrders.length})</div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>{L('เลข PO', 'PO No.')}</th><th>{L('สาขา', 'Branch')}</th><th>{L('วันที่', 'Date')}</th><th className="tbl-num">{L('ยอด', 'Total')}</th><th>{L('สถานะ', 'Status')}</th></tr></thead>
          <tbody>{supOrders.slice(0, 10).map(po => (
            <tr key={po.id}>
              <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--acc2)' }}>{po.poNumber}</td>
              <td><BranchBadge branchId={po.branch} /></td>
              <td style={{ fontSize: 12 }}>{UTILS.fmtDate(po.poDate, lang)}</td>
              <td className="tbl-num" style={{ fontWeight: 700 }}>฿{UTILS.fmt(po.grandTotal, 0)}</td>
              <td><StatusBadge status={po.status} lang={lang} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Modal>
  );
}

function DealEditorModal({ lang, L, drugs, supId, initialDrugCode, initialDeal, onSave, onClose }) {
  const [drugCode, setDrugCode] = React.useState(initialDrugCode || '');
  const [query, setQuery] = React.useState('');
  const [showList, setShowList] = React.useState(!initialDrugCode);
  const [form, setForm] = React.useState(initialDeal || { buyQty:'', freeQty:'', freeItems:'', specialDiscount:'', note:'' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const filteredDrugs = React.useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return drugs.filter(d => d.code.toLowerCase().includes(q)||d.nameTH.toLowerCase().includes(q)||(d.nameEN||'').toLowerCase().includes(q)).slice(0,20);
  }, [drugs, query]);
  const selectedDrug = drugs.find(d => d.code === drugCode);
  const handleSave = () => {
    if (!drugCode) return;
    onSave(drugCode, {
      buyQty: parseInt(form.buyQty)||0,
      freeQty: parseInt(form.freeQty)||0,
      freeItems: form.freeItems||'',
      specialDiscount: parseFloat(form.specialDiscount)||0,
      note: form.note||''
    });
  };
  return (
    <Modal title={`🎁 ${L('ดีลสินค้า','Drug Deal')}`} onClose={onClose} size={480}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก','Cancel')}</button><button className="btn btn-primary" disabled={!drugCode} onClick={handleSave}>{L('บันทึก','Save')}</button></>}>
      <div className="form-group" style={{ marginBottom:12 }}>
        <label className="label">💊 {L('เลือกสินค้า','Select Drug')}</label>
        {selectedDrug && !showList ? (
          <div style={{ display:'flex', gap:8, alignItems:'center', background:'var(--card2)', borderRadius:8, padding:'8px 12px' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:12 }}>{selectedDrug.nameTH}</div>
              <div style={{ fontSize:11, color:'var(--txt3)' }}>{selectedDrug.nameEN} · {selectedDrug.code}</div>
            </div>
            {!initialDrugCode && <button className="btn btn-ghost btn-xs" onClick={()=>{setDrugCode('');setQuery('');setShowList(true);}}>{L('เปลี่ยน','Change')}</button>}
          </div>
        ) : (
          <div style={{ position:'relative' }}>
            <input className="input" placeholder={L('พิมพ์รหัสหรือชื่อยา…','Type drug code or name…')}
              value={query} onChange={e=>{setQuery(e.target.value);setShowList(true);}} autoFocus />
            {filteredDrugs.length > 0 && showList && (
              <div style={{ position:'absolute', zIndex:200, left:0, right:0, top:'100%', marginTop:2, background:'var(--card)', border:'1px solid var(--bdr)', borderRadius:8, boxShadow:'0 4px 20px rgba(0,0,0,.15)', maxHeight:180, overflowY:'auto' }}>
                {filteredDrugs.map(d => (
                  <div key={d.code} style={{ padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--bdr)', fontSize:12 }}
                    onMouseDown={()=>{setDrugCode(d.code);setShowList(false);}}>
                    <span style={{ fontFamily:'monospace', color:'var(--acc2)', fontSize:11, marginRight:6 }}>{d.code}</span>{d.nameTH}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div className="form-group" style={{ margin:0 }}>
          <label className="label">{L('ซื้อ (ชิ้น)','Buy Qty')}</label>
          <input className="input" type="number" min="0" placeholder="12" value={form.buyQty} onChange={e=>set('buyQty',e.target.value)} />
        </div>
        <div className="form-group" style={{ margin:0 }}>
          <label className="label">{L('แถม (ชิ้น)','Free Qty')}</label>
          <input className="input" type="number" min="0" placeholder="1" value={form.freeQty} onChange={e=>set('freeQty',e.target.value)} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div className="form-group" style={{ margin:0 }}>
          <label className="label">{L('ของแถม (ระบุชื่อ)','Free Item(s)')}</label>
          <input className="input" placeholder={L('เช่น หน้ากาก N95','e.g. N95 mask')} value={form.freeItems} onChange={e=>set('freeItems',e.target.value)} />
        </div>
        <div className="form-group" style={{ margin:0 }}>
          <label className="label">{L('ส่วนลดพิเศษ %','Special Disc%')}</label>
          <input className="input" type="number" min="0" max="100" step="0.5" placeholder="0" value={form.specialDiscount} onChange={e=>set('specialDiscount',e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="label">{L('หมายเหตุ','Note')}</label>
        <input className="input" placeholder={L('เงื่อนไข, วันสิ้นสุด, ฯลฯ','Conditions, expiry, etc.')} value={form.note} onChange={e=>set('note',e.target.value)} />
      </div>
    </Modal>
  );
}

function SupplierForm({ sup, lang, L, drugs: allDrugs = [], onSave, onClose }) {
  const isEdit = !!sup;
  const [form, setForm] = useState(() => {
    if (!sup) return { id:'SUP'+Date.now(), code:'', name:'', nameEN:'', contact:'', phone:'', email:'', taxId:'', creditTerm:30, deliveryDays:3, rating:4.0, minOrder:5000, address:'', category:'', promotions:[], drugs:[], drugPrices:{}, contacts:[{name:'',phone:''},{name:'',phone:''},{name:'',phone:''}], returnPolicy:'', returnPolicyEN:'' };
    return { ...sup, contacts: sup.contacts || [{name:sup.contact||'',phone:sup.phone||''},{name:'',phone:''},{name:'',phone:''}], returnPolicy: sup.returnPolicy||'', returnPolicyEN: sup.returnPolicyEN||'' };
  });
  const [drugSearch, setDrugSearch] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setContact = (i, k, v) => setForm(f => {
    const contacts = [...(f.contacts||[{name:'',phone:''},{name:'',phone:''},{name:'',phone:''}])];
    contacts[i] = { ...contacts[i], [k]: v };
    return { ...f, contacts, contact: contacts[0].name, phone: contacts[0].phone };
  });
  const promos = form.promotions || [];
  const drugList = form.drugs || [];
  const drugPrices = form.drugPrices || {};

  const addPromo = () => setForm(f => ({ ...f, promotions: [...(f.promotions || []), { id: 'P' + Date.now(), name: '', type: 'percent', discount: 0, validUntil: '' }] }));
  const updatePromo = (id, k, v) => setForm(f => ({ ...f, promotions: (f.promotions || []).map(p => p.id === id ? { ...p, [k]: v } : p) }));
  const removePromo = (id) => setForm(f => ({ ...f, promotions: (f.promotions || []).filter(p => p.id !== id) }));

  const addDrug = (drug) => {
    setForm(f => ({
      ...f,
      drugs: (f.drugs||[]).includes(drug.code) ? f.drugs : [...(f.drugs||[]), drug.code],
      drugPrices: { ...(f.drugPrices||{}), [drug.code]: (f.drugPrices||{})[drug.code] ?? drug.costEx },
    }));
    setDrugSearch('');
  };
  const removeDrug = (code) => setForm(f => {
    const prices = { ...(f.drugPrices||{}) }; delete prices[code];
    return { ...f, drugs: (f.drugs||[]).filter(c => c !== code), drugPrices: prices };
  });
  const setDrugPrice = (code, val) => setForm(f => ({ ...f, drugPrices: { ...(f.drugPrices||{}), [code]: parseFloat(val) || 0 } }));

  const drugSearchResults = drugSearch.length > 0
    ? allDrugs.filter(d => !drugList.includes(d.code) && (
        d.code.toLowerCase().includes(drugSearch.toLowerCase()) ||
        (d.nameTH||'').includes(drugSearch) ||
        (d.nameEN||'').toLowerCase().includes(drugSearch.toLowerCase())
      )).slice(0, 12)
    : [];

  const inp = (k, lbl, type = 'text') => (
    <div className="form-group">
      <label className="label">{lbl}</label>
      <input className="input" type={type} value={form[k] || ''} onChange={e => set(k, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} />
    </div>
  );
  return (
    <Modal title={isEdit ? L('แก้ไขผู้จัดจำหน่าย', 'Edit Supplier') : L('เพิ่มผู้จัดจำหน่าย', 'Add Supplier')} onClose={onClose} size={700}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก', 'Cancel')}</button><button className="btn btn-primary" onClick={() => onSave(form)}>{L('บันทึก', 'Save')}</button></>}>
      <div className="form-row">
        {inp('name', L('ชื่อบริษัท (ไทย)', 'Thai Name'))}
        {inp('nameEN', L('ชื่อบริษัท (อังกฤษ)', 'English Name'))}
      </div>
      <div style={{ marginBottom:12 }}>
        <label className="label">👤 {L('ผู้ติดต่อ / โทรศัพท์', 'Contact / Phone')}</label>
        {[0,1,2].map(i => (
          <div key={i} className="form-row" style={{ marginBottom: i<2?6:0 }}>
            <div className="form-group" style={{ margin:0 }}>
              <input className="input" placeholder={L(`ผู้ติดต่อ ${i+1}`,`Contact ${i+1}`)}
                value={form.contacts?.[i]?.name||''} onChange={e=>setContact(i,'name',e.target.value)} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <input className="input" placeholder={L(`เบอร์โทร ${i+1}`,`Phone ${i+1}`)}
                value={form.contacts?.[i]?.phone||''} onChange={e=>setContact(i,'phone',e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <div className="form-row">
        {inp('email', 'Email', 'email')}
        {inp('taxId', L('เลขภาษี', 'Tax ID'))}
      </div>
      {inp('address', L('ที่อยู่', 'Address'))}
      <div className="form-row-3">
        {inp('creditTerm', L('เครดิต (วัน)', 'Credit Term'), 'number')}
        {inp('deliveryDays', L('ระยะส่ง (วัน)', 'Delivery Days'), 'number')}
        {inp('rating', L('คะแนน', 'Rating'), 'number')}
      </div>
      <div className="form-row">
        {inp('minOrder', L('ขั้นต่ำ (บาท)', 'Min Order (THB)'), 'number')}
        {inp('category', L('ประเภทสินค้า', 'Category'))}
      </div>

      <div className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label className="label" style={{ margin: 0 }}>🎁 {L('โปรโมชั่น / ดีล', 'Promotions / Deals')}</label>
        <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={addPromo}>
          + {L('เพิ่มโปรโมชั่น', 'Add promotion')}
        </button>
      </div>
      {promos.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--txt4)', marginBottom: 8 }}>{L('ยังไม่มีโปรโมชั่น', 'No promotions yet')}</div>
      )}
      {promos.map(p => (
        <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
          <div className="form-group" style={{ flex: 2, margin: 0 }}>
            <label className="label" style={{ fontSize: 11 }}>{L('ชื่อโปรโมชั่น', 'Promotion name')}</label>
            <input className="input" value={p.name || ''} onChange={e => updatePromo(p.id, 'name', e.target.value)}
              placeholder={L('เช่น ส่วนลด 5% สั่งเกิน 10,000', 'e.g., 5% off over 10,000')} />
          </div>
          <div className="form-group" style={{ width: 90, margin: 0 }}>
            <label className="label" style={{ fontSize: 11 }}>{L('ส่วนลด %', 'Discount %')}</label>
            <input className="input" type="number" value={p.discount || 0} onChange={e => updatePromo(p.id, 'discount', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group" style={{ width: 150, margin: 0 }}>
            <label className="label" style={{ fontSize: 11 }}>{L('ใช้ได้ถึง', 'Valid until')}</label>
            <input className="input" type="date" value={p.validUntil || ''} onChange={e => updatePromo(p.id, 'validUntil', e.target.value)} />
          </div>
          <button type="button" className="btn btn-ghost" style={{ padding: '8px 10px', color: 'var(--err)' }}
            title={L('ลบ', 'Remove')} onClick={() => removePromo(p.id)}>🗑</button>
        </div>
      ))}

      <div className="divider" />
      <div className="form-row">
        <div className="form-group">
          <label className="label">↩ {L('นโยบายการรับคืนสินค้า (ไทย)','Return Policy (TH)')}</label>
          <textarea className="input" rows={2} style={{ resize:'vertical' }}
            placeholder="เช่น คืนได้ภายใน 30 วัน, สินค้าไม่เปิดซอง, แจ้ง Rep ก่อน..."
            value={form.returnPolicy||''} onChange={e=>set('returnPolicy',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">↩ Return Policy (EN)</label>
          <textarea className="input" rows={2} style={{ resize:'vertical' }}
            placeholder="e.g., Returns within 30 days, unopened only, notify rep first..."
            value={form.returnPolicyEN||''} onChange={e=>set('returnPolicyEN',e.target.value)} />
        </div>
      </div>

      {/* ── Drug catalog section ── */}
      <div className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label className="label" style={{ margin: 0 }}>
          📦 {L('รายการสินค้าที่จำหน่าย', 'Products Catalog')}
          <span style={{ fontWeight: 400, color: 'var(--txt4)', fontSize: 11, marginLeft: 6 }}>
            {L('(ใช้สำหรับเปรียบเทียบราคา)', '(used for price comparison)')}
          </span>
        </label>
        <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{drugList.length} {L('รายการ', 'items')}</span>
      </div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <SearchInput value={drugSearch} onChange={setDrugSearch}
          placeholder={L('ค้นหาสินค้าเพื่อเพิ่ม (รหัส / ชื่อ)…', 'Search products to add (code / name)…')} />
        {drugSearchResults.length > 0 && (
          <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 30, boxShadow: '0 6px 18px rgba(0,0,0,.2)' }}>
            {drugSearchResults.map(d => (
              <div key={d.code} onMouseDown={() => addDrug(d)}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseOut={e => e.currentTarget.style.background = ''}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{d.code}</span>
                  <span style={{ marginLeft: 8, fontSize: 12 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--txt3)' }}>฿{UTILS.fmt(d.costEx)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {drugList.length > 0 && (
        <div className="tbl-wrap" style={{ maxHeight: 240, marginBottom: 8 }}>
          <table>
            <thead>
              <tr>
                <th>{L('รหัส', 'Code')}</th>
                <th>{L('ชื่อ', 'Name')}</th>
                <th style={{ textAlign: 'right' }}>{L('ราคาของ Supplier นี้ (฿)', "This Supplier's Price (฿)")}</th>
                <th style={{ textAlign: 'right' }}>{L('ราคาขาย', 'Sell Price')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {drugList.map(code => {
                const drug = allDrugs.find(d => d.code === code);
                if (!drug) return null;
                return (
                  <tr key={code}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{code}</td>
                    <td style={{ fontSize: 12 }}>{lang === 'th' ? drug.nameTH : drug.nameEN}</td>
                    <td style={{ textAlign: 'right' }}>
                      <input className="input input-sm" type="number" step="0.01"
                        value={drugPrices[code] ?? drug.costEx}
                        onChange={e => setDrugPrice(code, e.target.value)}
                        style={{ width: 90, textAlign: 'right' }} />
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--txt3)' }}>฿{UTILS.fmt(drug.sellEx)}</td>
                    <td>
                      <button className="btn-icon" onClick={() => removeDrug(code)} style={{ color: 'var(--err)', fontSize: 14 }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {drugList.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--txt4)', marginBottom: 8 }}>
          {L('ยังไม่มีรายการ — ค้นหาสินค้าด้านบนเพื่อเพิ่ม', 'No items yet — search above to add products')}
        </div>
      )}
    </Modal>
  );
}

Object.assign(window, { SuppliersPage });


/* ===== Comparison.jsx ===== */
// Comparison.jsx — Price Comparison (Full Supplier Pricing)

// Get price for a supplier-drug pair.
// Priority: supplier's own drugPrices → drug's own costEx
function getPrice(drug, sup) {
  if (sup?.drugPrices?.[drug.code] !== undefined) return sup.drugPrices[drug.code];
  const comp = DB.COMP_PRICES[drug.code];
  if (comp && comp[sup?.id] !== undefined) return comp[sup.id];
  return drug.costEx;
}

function ComparisonPage({ lang, L, drugs, suppliers }) {
  const [search, setSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = useMemo(() => {
    if (!search || search.length < 1) return [];
    const q = search.toLowerCase();
    return drugs.filter(d =>
      d.code.toLowerCase().includes(q) ||
      d.nameTH.includes(q) ||
      d.nameEN.toLowerCase().includes(q)
    ).slice(0, 14);
  }, [drugs, search]);

  // Build full comparison rows for selected drug
  const rows = useMemo(() => {
    if (!selectedDrug) return [];
    // Primary: suppliers with drug explicitly in their drugs[] catalog.
    let supList = suppliers.filter(s => (s.drugs||[]).includes(selectedDrug.code));
    // Fallback: use supplier IDs stored directly on the drug (main + extra)
    if (!supList.length) {
      const extraIds = (selectedDrug.extraSuppliers||[]).map(s=>s.id).filter(Boolean).length
        ? (selectedDrug.extraSuppliers||[]).map(s=>s.id)
        : (selectedDrug.extraSupplierIds||[]);
      const linked = [selectedDrug.supplierId, ...extraIds].filter(Boolean);
      supList = suppliers.filter(s => linked.includes(s.id));
    }
    return supList.map(s => {
      const costEx = getPrice(selectedDrug, s);
      const costInc = selectedDrug.hasVat ? +(costEx * 1.07).toFixed(2) : costEx;
      const promos = (s.promotions || []).filter(p =>
        !p.catId || p.catId === selectedDrug.catId ||
        !p.drugCode || p.drugCode === selectedDrug.code
      );
      const bestPromoDisc = promos.reduce((m, p) => Math.max(m, p.discount || 0), 0);
      const afterPromo = bestPromoDisc > 0 ? +(costEx * (1 - bestPromoDisc / 100)).toFixed(2) : costEx;
      return { supplier: s, costEx, costInc, promos, bestPromoDisc, afterPromo };
    }).sort((a, b) => a.afterPromo - b.afterPromo);
  }, [selectedDrug, suppliers]);

  const cheapest = rows[0];
  const mostExp = rows[rows.length - 1];
  const maxSavings = rows.length > 1 ? +(mostExp.afterPromo - cheapest.afterPromo).toFixed(2) : 0;

  // Popular: drugs linked to any supplier (via drugs[] or supplierId)
  const popular = useMemo(() => {
    const linkedCodes = new Set([
      ...Object.keys(DB.COMP_PRICES),
      ...suppliers.flatMap(s => s.drugs||[]),
      ...drugs.filter(d => d.supplierId).map(d => d.code),
    ]);
    return drugs.filter(d => linkedCodes.has(d.code)).slice(0, 12);
  }, [drugs, suppliers]);

  const selectDrug = d => { setSelectedDrug(d); setSearch(''); setShowSearch(false); };
  const clearDrug = () => { setSelectedDrug(null); setSearch(''); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">⚖ {L('เปรียบเทียบราคา', 'Price Comparison')}</div>
          <div className="page-subtitle">{L('เทียบราคาจากทุกผู้จัดจำหน่ายและรับคำแนะนำซื้อที่ดีที่สุด', 'Compare prices across all suppliers — get the best buying recommendation')}</div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <label className="label" style={{ fontSize: 14, textAlign: 'center', display: 'block', marginBottom: 10 }}>
            🔍 {L('ค้นหายาที่ต้องการเปรียบเทียบ', 'Search a drug to compare prices')}
          </label>
          <div style={{ position: 'relative' }}>
            {selectedDrug ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)', padding: '10px 14px' }}>
                <span style={{ fontSize: 20 }}>💊</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{lang === 'th' ? selectedDrug.nameTH : (selectedDrug.nameEN||selectedDrug.nameTH)}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{selectedDrug.code} · {lang === 'th' ? UTILS.getCat(selectedDrug.catId).name : UTILS.getCat(selectedDrug.catId).nameEN}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={clearDrug}>✕ {L('เปลี่ยน', 'Change')}</button>
              </div>
            ) : (
              <>
                <SearchInput value={search} onChange={v => { setSearch(v); setShowSearch(true); }}
                  placeholder={L('พิมพ์รหัส / ชื่อยา…', 'Type code / drug name…')} />
                {showSearch && searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)', boxShadow: 'var(--shadow2)', zIndex: 50, marginTop: 4, maxHeight: 300, overflowY: 'auto' }}>
                    {searchResults.map(d => {
                      const supCount = suppliers.filter(s => s.drugs?.includes(d.code)).length;
                      const prices = suppliers.filter(s => s.drugs?.includes(d.code)).map(s => getPrice(d, s));
                      const minP = prices.length ? Math.min(...prices) : d.costEx;
                      const maxP = prices.length ? Math.max(...prices) : d.costEx;
                      return (
                        <div key={d.code} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseDown={() => selectDrug(d)}>
                          <div>
                            <span style={{ color: 'var(--acc)', fontFamily: 'monospace', fontSize: 12 }}>{d.code}</span>
                            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</span>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--txt3)', flexShrink: 0 }}>
                            <div style={{ color: 'var(--ok)', fontWeight: 700 }}>฿{UTILS.fmt(minP)} – ฿{UTILS.fmt(maxP)}</div>
                            <div>{supCount} {L('ผู้จัดจำหน่าย', 'suppliers')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      {selectedDrug && rows.length > 0 && (
        <>
          {/* Drug info + Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, marginBottom: 20, alignItems: 'stretch' }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{lang === 'th' ? selectedDrug.nameTH : (selectedDrug.nameEN||selectedDrug.nameTH)}</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>
                {selectedDrug.code} · {lang === 'th' ? UTILS.getCat(selectedDrug.catId).name : UTILS.getCat(selectedDrug.catId).nameEN} · {selectedDrug.unit}
                {selectedDrug.hasVat && <span className="badge" style={{ marginLeft: 8, background: 'var(--info-bg)', color: 'var(--info)' }}>VAT 7%</span>}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--txt3)' }}>
                <span>{L('ราคาขาย', 'Sell price')}: <b style={{ color: 'var(--txt)' }}>฿{UTILS.fmt(selectedDrug.sellEx)}</b></span>
                <span>{L('กำไร', 'Margin')}: <b style={{ color: 'var(--ok)' }}>{selectedDrug.profitMargin}%</b></span>
              </div>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700, marginBottom: 4 }}>💚 {L('ราคาถูกสุด', 'Cheapest')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ok)' }}>฿{UTILS.fmt(cheapest.afterPromo)}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{lang==='th'?cheapest.supplier.name.split(' ').slice(0,3).join(' '):(cheapest.supplier.nameEN||cheapest.supplier.name).split(' ').slice(0,3).join(' ')}</div>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--err)', fontWeight: 700, marginBottom: 4 }}>🔴 {L('ราคาแพงสุด', 'Most Exp.')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--err)' }}>฿{UTILS.fmt(mostExp.afterPromo)}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{lang==='th'?mostExp.supplier.name.split(' ').slice(0,3).join(' '):(mostExp.supplier.nameEN||mostExp.supplier.name).split(' ').slice(0,3).join(' ')}</div>
            </div>
            {maxSavings > 0 && (
              <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130, borderColor: 'rgba(22,163,74,.4)', background: 'var(--ok-bg)' }}>
                <div style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700, marginBottom: 4 }}>💰 {L('ส่วนต่าง', 'Max Savings')}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ok)' }}>฿{UTILS.fmt(maxSavings)}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{L('ต่อหน่วย', 'per unit')}</div>
              </div>
            )}
          </div>

          {/* RECOMMENDATION BANNER */}
          <div style={{ background: 'linear-gradient(135deg,var(--acc) 0%,var(--acc2) 100%)', borderRadius: 'var(--r)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px var(--glow)' }}>
            <div style={{ fontSize: 36 }}>🏆</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                {L('แนะนำ: ซื้อจาก', 'Recommended: Buy from')} {lang==='th'?cheapest.supplier.name:(cheapest.supplier.nameEN||cheapest.supplier.name)}
              </div>
              <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13 }}>
                {L('ราคาต้นทุน', 'Cost price')} <b>฿{UTILS.fmt(cheapest.costEx)}</b>
                {selectedDrug.hasVat && <span> ({L('รวม VAT', 'incl. VAT')} ฿{UTILS.fmt(cheapest.costInc)})</span>}
                {cheapest.bestPromoDisc > 0 && (
                  <span style={{ marginLeft: 8, background: 'rgba(255,255,255,.25)', padding: '1px 8px', borderRadius: 20 }}>
                    🎁 {L('ลด', 'Disc.')} {cheapest.bestPromoDisc}% → ฿{UTILS.fmt(cheapest.afterPromo)}
                  </span>
                )}
                {maxSavings > 0 && (
                  <span style={{ marginLeft: 8, color: 'rgba(255,255,255,.8)' }}>
                    · {L('ประหยัดกว่าแพงสุด', 'Saves vs. most expensive')} ฿{UTILS.fmt(maxSavings)}/หน่วย
                  </span>
                )}
              </div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 4 }}>
                {L('เครดิต', 'Credit')} {cheapest.supplier.creditTerm} {L('วัน', 'days')} ·
                {L('ส่งภายใน', 'Delivery')} {cheapest.supplier.deliveryDays} {L('วัน', 'days')} ·
                ⭐ {cheapest.supplier.rating}/5
              </div>
            </div>
          </div>

          {/* FULL COMPARISON TABLE */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
              📊 {L('ราคาจากทุกผู้จัดจำหน่าย', 'All Supplier Prices')} ({rows.length} {L('ราย', 'suppliers')}) — {L('เรียงจากถูกสุดไปแพงสุด', 'Cheapest → Most Expensive')}
            </div>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>{L('อันดับ', 'Rank')}</th>
                    <th>{L('ผู้จัดจำหน่าย', 'Supplier')}</th>
                    <th style={{ textAlign: 'right' }}>{L('ต้นทุน (ไม่รวม VAT)', 'Cost (excl.VAT)')}</th>
                    {selectedDrug.hasVat && <th style={{ textAlign: 'right' }}>{L('ต้นทุน (รวม VAT)', 'Cost (incl.VAT)')}</th>}
                    <th style={{ textAlign: 'right' }}>{L('หลังโปรโมชั่น', 'After Promo')}</th>
                    <th style={{ textAlign: 'right' }}>{L('vs ถูกสุด', 'vs Cheapest')}</th>
                    <th>{L('โปรโมชั่น', 'Promotions')}</th>
                    <th style={{ textAlign: 'center' }}>{L('เครดิต', 'Credit')}</th>
                    <th style={{ textAlign: 'center' }}>{L('ส่งภายใน', 'Lead')}</th>
                    <th style={{ textAlign: 'center' }}>{L('คะแนน', 'Rating')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const isCheap = i === 0;
                    const isExp = i === rows.length - 1 && rows.length > 1;
                    const diff = +(row.afterPromo - cheapest.afterPromo).toFixed(2);
                    const pctDiff = cheapest.afterPromo > 0 ? +((diff / cheapest.afterPromo) * 100).toFixed(1) : 0;
                    return (
                      <tr key={row.supplier.id} style={{ background: isCheap ? 'rgba(22,163,74,.07)' : isExp ? 'rgba(220,38,38,.05)' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, margin: '0 auto',
                            background: isCheap ? 'var(--ok)' : isExp ? 'var(--err)' : 'var(--bg4)',
                            color: isCheap || isExp ? '#fff' : 'var(--txt3)' }}>
                            {isCheap ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{row.supplier.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getSupCat(row.supplier.category, lang)}</div>
                          {isCheap && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ok)', background: 'var(--ok-bg)', padding: '1px 6px', borderRadius: 20 }}>✓ {L('แนะนำ', 'BEST BUY')}</span>}
                          {isExp && <span style={{ fontSize: 10, color: 'var(--err)' }}>↑ {L('แพงสุด', 'MOST EXP.')}</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: isCheap ? 'var(--ok)' : isExp ? 'var(--err)' : 'var(--txt)' }}>
                            ฿{UTILS.fmt(row.costEx)}
                          </div>
                        </td>
                        {selectedDrug.hasVat && (
                          <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--info)' }}>฿{UTILS.fmt(row.costInc)}</td>
                        )}
                        <td style={{ textAlign: 'right' }}>
                          {row.bestPromoDisc > 0 ? (
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ok)' }}>฿{UTILS.fmt(row.afterPromo)}</div>
                              <div style={{ fontSize: 10, color: 'var(--ok)' }}>-{row.bestPromoDisc}% {L('ส่วนลด', 'off')}</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: 'var(--txt3)' }}>= ฿{UTILS.fmt(row.costEx)}</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {diff === 0 ? (
                            <span style={{ color: 'var(--ok)', fontWeight: 700 }}>— {L('ถูกสุด', 'Cheapest')}</span>
                          ) : (
                            <div>
                              <div style={{ color: 'var(--err)', fontWeight: 700 }}>+฿{UTILS.fmt(diff)}</div>
                              <div style={{ fontSize: 10, color: 'var(--txt3)' }}>+{pctDiff}%</div>
                            </div>
                          )}
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          {row.promos.length > 0 ? row.promos.map(p => (
                            <div key={p.id} style={{ fontSize: 10, color: 'var(--ok)', background: 'var(--ok-bg)', borderRadius: 4, padding: '2px 7px', marginBottom: 3, lineHeight: 1.4 }}>
                              🎁 {p.name}
                            </div>
                          )) : <span style={{ color: 'var(--txt4)', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 12 }}>{row.supplier.creditTerm} {L('วัน', 'd')}</td>
                        <td style={{ textAlign: 'center', fontSize: 12 }}>{row.supplier.deliveryDays} {L('วัน', 'd')}</td>
                        <td style={{ textAlign: 'center' }}>
                          <RatingStars rating={row.supplier.rating} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedDrug && rows.length === 0 && (
        <div className="no-data card">{L('ไม่มีผู้จัดจำหน่ายสำหรับสินค้านี้ในระบบ', 'No suppliers found for this product')}</div>
      )}

      {/* Landing: Popular drugs */}
      {!selectedDrug && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt2)', marginBottom: 12 }}>
            ⭐ {L('ค้นหาด่วน — สินค้ายอดนิยม', 'Quick Search — Popular Products')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {popular.map(d => {
              const supList = suppliers.filter(s => s.drugs?.includes(d.code));
              const prices = supList.map(s => getPrice(d, s));
              const minP = prices.length ? Math.min(...prices) : d.costEx;
              const maxP = prices.length ? Math.max(...prices) : d.costEx;
              const savings = +(maxP - minP).toFixed(2);
              return (
                <div key={d.code} className="card-sm" style={{ cursor: 'pointer', transition: '.15s' }}
                  onClick={() => selectDrug(d)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }} className="ellipsis">{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 10 }}>
                    {d.code} · {supList.length} {L('ผู้จัดจำหน่าย', 'suppliers')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{L('ถูกสุด', 'Cheapest')}</div>
                      <div style={{ fontWeight: 800, color: 'var(--ok)', fontSize: 15 }}>฿{UTILS.fmt(minP)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{L('แพงสุด', 'Most Exp.')}</div>
                      <div style={{ fontWeight: 700, color: 'var(--err)' }}>฿{UTILS.fmt(maxP)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{L('ส่วนต่าง', 'Savings')}</div>
                      <div style={{ fontWeight: 700, color: savings > 0 ? 'var(--warn)' : 'var(--txt3)' }}>฿{UTILS.fmt(savings)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ComparisonPage });


/* ===== Stock.jsx ===== */
// Stock.jsx — Stock Tracking Page

function StockPage({ lang, L, drugs, orders, setPage, setShowCreate }) {
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('low');
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPageNum] = useState(1);
  const PER = 50;

  const filtered = useMemo(() => {
    let list = [...drugs];
    if (search) { const q = search.toLowerCase(); list = list.filter(d => d.code.toLowerCase().includes(q) || d.nameTH.includes(q) || d.nameEN.toLowerCase().includes(q)); }
    if (catFilter) list = list.filter(d => d.catId === catFilter);
    if (statusFilter === 'low') list = list.filter(d => Object.entries(d.stock).some(([br, v]) => (!branchFilter || br === branchFilter) && v <= d.minStock));
    else if (statusFilter === 'warning') list = list.filter(d => Object.entries(d.stock).some(([br, v]) => (!branchFilter || br === branchFilter) && v > d.minStock && v <= d.minStock * 2));
    else if (statusFilter === 'ok') list = list.filter(d => Object.entries(d.stock).every(([br, v]) => !branchFilter || br !== branchFilter || v > d.minStock * 2));
    if (branchFilter) list.sort((a, b) => a.stock[branchFilter] - b.stock[branchFilter]);
    else list.sort((a, b) => (a.totalStock / a.minStock) - (b.totalStock / b.minStock));
    return list;
  }, [drugs, search, catFilter, statusFilter, branchFilter]);

  const lowCount = drugs.filter(d => Object.values(d.stock).some(v => v <= d.minStock)).length;
  const warnCount = drugs.filter(d => Object.entries(d.stock).some(([, v]) => v > drugs.find(x=>x.code===d.code)?.minStock && v <= drugs.find(x=>x.code===d.code)?.minStock * 2)).length;
  const pageData = filtered.slice((page - 1) * PER, page * PER);

  const movements = DB.STOCK_MOVEMENTS.slice(0, 10);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('ติดตามสินค้า', 'Stock Tracking')}</div>
          <div className="page-subtitle">{L('ตรวจสอบระดับสต็อกแบบ Real-time ทั้ง 3 สาขา', 'Real-time stock monitoring across all 3 branches')}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ {L('สั่งซื้อเพิ่ม', 'Order More')}</button>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {DB.BRANCHES.map(br => {
          const brLow = drugs.filter(d => d.stock[br.id] <= d.minStock).length;
          const brTotal = drugs.reduce((s, d) => s + d.stock[br.id], 0);
          const brValue = drugs.reduce((s, d) => s + d.costEx * d.stock[br.id], 0);
          return (
            <div key={br.id} className="stat-card" style={{ borderTop: `3px solid ${br.color}` }}>
              <div className="stat-label" style={{ color: br.color }}>{br.name} ({br.id})</div>
              <div className="stat-val">{brTotal.toLocaleString()}</div>
              <div className="stat-sub">{L('หน่วยรวม', 'total units')} · ฿{(brValue / 1000).toFixed(0)}K</div>
              {brLow > 0 && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--err)', fontWeight: 700 }}>⚠ {brLow} {L('รายการใกล้หมด', 'low stock items')}</div>}
            </div>
          );
        })}
        <div className="stat-card">
          <div className="stat-label">{L('สินค้าใกล้หมด', 'Low Stock')}</div>
          <div className="stat-val" style={{ color: lowCount > 0 ? 'var(--err)' : 'var(--ok)' }}>{lowCount}</div>
          <div className="stat-sub">{L('รายการ', 'items')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{L('ระวัง (ใกล้ขีดต่ำ)', 'Warning Level')}</div>
          <div className="stat-val" style={{ color: 'var(--warn)' }}>{warnCount}</div>
          <div className="stat-sub">{L('รายการ', 'items')}</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
        {/* Main Stock Table */}
        <div style={{ gridColumn: '1 / -1' }}>
          {/* Filters */}
          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label className="label">{L('ค้นหา', 'Search')}</label>
                <SearchInput value={search} onChange={v => { setSearch(v); setPageNum(1); }} placeholder={L('รหัส / ชื่อยา…', 'Code / Name…')} />
              </div>
              <div style={{ flex: '0 0 140px' }}>
                <label className="label">{L('สาขา', 'Branch')}</label>
                <select className="input" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPageNum(1); }}>
                  <option value="">{L('ทุกสาขา', 'All')}</option>
                  {DB.BRANCHES.map(b => <option key={b.id} value={b.id}>{lang==='th'?b.name:b.nameEN}</option>)}
                </select>
              </div>
              <div style={{ flex: '0 0 160px' }}>
                <label className="label">{L('สถานะ', 'Status')}</label>
                <select className="input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPageNum(1); }}>
                  <option value="">{L('ทั้งหมด', 'All')}</option>
                  <option value="low">⚠ {L('ใกล้หมด', 'Low Stock')}</option>
                  <option value="warning">⚡ {L('ระวัง', 'Warning')}</option>
                  <option value="ok">✓ {L('ปกติ', 'Normal')}</option>
                </select>
              </div>
              <div style={{ flex: '0 0 180px' }}>
                <label className="label">{L('หมวดหมู่', 'Category')}</label>
                <select className="input" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPageNum(1); }}>
                  <option value="">{L('ทั้งหมด', 'All')}</option>
                  {DB.CATEGORIES.map(c => <option key={c.id} value={c.id}>{lang === 'th' ? c.name : c.nameEN}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{filtered.length} {L('รายการ', 'items')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['low', 'warning', ''].map((s, i) => {
                  const labels = [L('ใกล้หมด', 'Low'), L('ระวัง', 'Warn'), L('ทั้งหมด', 'All')];
                  const colors = ['var(--err)', 'var(--warn)', 'var(--txt3)'];
                  return (
                    <button key={i} className={`chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)} style={{ color: colors[i] }}>
                      {labels[i]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>{L('รหัส', 'Code')}</th>
                    <th>{L('ชื่อยา', 'Drug Name')}</th>
                    <th>{L('หมวด', 'Cat.')}</th>
                    {DB.BRANCHES.map(br => <th key={br.id} style={{ textAlign: 'center', color: br.color }}>{br.id}</th>)}
                    <th style={{ textAlign: 'center' }}>{L('รวม', 'Total')}</th>
                    <th style={{ textAlign: 'center' }}>{L('ขั้นต่ำ', 'Min')}</th>
                    <th style={{ textAlign: 'center' }}>{L('สถานะ', 'Status')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 && <tr><td colSpan={9} className="no-data">{L('ไม่พบข้อมูล', 'No data')}</td></tr>}
                  {pageData.map(d => {
                    const isLow = Object.entries(d.stock).some(([br, v]) => (!branchFilter || br === branchFilter) && v <= d.minStock);
                    const isWarn = !isLow && Object.entries(d.stock).some(([br, v]) => (!branchFilter || br === branchFilter) && v <= d.minStock * 2);
                    return (
                      <tr key={d.code} style={{ background: isLow ? 'rgba(248,113,113,.05)' : isWarn ? 'rgba(251,191,36,.05)' : undefined }}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)', fontWeight: 700 }}>{d.code}</td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                          <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{UTILS.getUnit(d.unit, lang)}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: 11, color: UTILS.getCat(d.catId).color }}>{lang === 'th' ? UTILS.getCat(d.catId).name : UTILS.getCat(d.catId).nameEN}</span>
                        </td>
                        {DB.BRANCHES.map(br => {
                          const v = d.stock[br.id];
                          const low = v <= d.minStock;
                          const warn = v > d.minStock && v <= d.minStock * 2;
                          return (
                            <td key={br.id} style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: low ? 'var(--err)' : warn ? 'var(--warn)' : 'var(--ok)' }}>{v.toLocaleString()}</div>
                              {low && <div style={{ fontSize: 9, color: 'var(--err)' }}>⚠ ต่ำ</div>}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{d.totalStock.toLocaleString()}</td>
                        <td style={{ textAlign: 'center', fontSize: 11, color: 'var(--txt3)' }}>{d.minStock.toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          {isLow ? <span className="badge" style={{ background: 'var(--err-bg)', color: 'var(--err)' }}>⚠ ต่ำ</span>
                            : isWarn ? <span className="badge" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>⚡ ระวัง</span>
                            : <span className="badge" style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}>✓ ปกติ</span>}
                        </td>
                        <td>
                          {isLow && (
                            <button className="btn btn-outline btn-xs" onClick={() => setShowCreate(true)}>
                              🛒 {L('สั่ง', 'Order')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
              <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPageNum} />
            </div>
          </div>
        </div>

        {/* Stock Movements */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">🔄 {L('การเคลื่อนไหวสต็อกล่าสุด', 'Recent Stock Movements')}</span>
            </div>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>{L('วันที่', 'Date')}</th>
                    <th>{L('ประเภท', 'Type')}</th>
                    <th>{L('รหัสสินค้า', 'Code')}</th>
                    <th>{L('ชื่อสินค้า', 'Product')}</th>
                    <th>{L('สาขา', 'Branch')}</th>
                    <th style={{ textAlign: 'right' }}>{L('จำนวน', 'Qty')}</th>
                    <th>{L('เหตุผล', 'Reason')}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => {
                    const drug = UTILS.getDrug(m.code);
                    return (
                      <tr key={i}>
                        <td style={{ fontSize: 12 }}>{UTILS.fmtDate(m.date, lang)}</td>
                        <td>
                          <span className="badge" style={{ background: m.type === 'in' ? 'var(--ok-bg)' : 'var(--err-bg)', color: m.type === 'in' ? 'var(--ok)' : 'var(--err)' }}>
                            {m.type === 'in' ? '↓ ' + L('รับเข้า', 'IN') : '↑ ' + L('จ่ายออก', 'OUT')}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{m.code}</td>
                        <td style={{ fontSize: 12 }}>{drug ? (lang === 'th' ? drug.nameTH : (drug.nameEN||drug.nameTH)) : m.code}</td>
                        <td><BranchBadge branchId={m.branch} /></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: m.type === 'in' ? 'var(--ok)' : 'var(--err)' }}>
                          {m.type === 'in' ? '+' : '-'}{m.qty.toLocaleString()}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--txt3)' }}>{lang==='en' ? m.reason.replace('ขาย','Sale').replace('รับ',`Received`).replace('รับ เข้า','IN') : m.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StockPage });


/* ===== OutOfStock.jsx ===== */
const OutOfStockPage = ({ lang, L, perm, notify, drugs }) => {
  const [reports, setReports] = React.useState([]);
  const [currentPeriod, setCurrentPeriod] = React.useState(null);
  const [tab, setTab] = React.useState(perm.role === 'admin' || perm.role === 'manager' ? 'dashboard' : 'report');
  const [form, setForm] = React.useState({ productCode: '', productName: '', notes: '' });
  const [imagePreview, setImagePreview] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);

  const cloudOn = !!(window.UNI_DB && window.UNI_DB.enabled);

  // Monday 00:00 of the current week — the start of the 7-day reporting window.
  const weekStart = () => {
    const t = new Date();
    const s = new Date(t);
    s.setDate(t.getDate() - t.getDay() + 1);
    s.setHours(0, 0, 0, 0);
    return s;
  };

  React.useEffect(() => {
    initializePeriod();
    loadReports();
    // Live updates: re-fetch whenever anyone adds/changes a report.
    let unsub = () => {};
    if (cloudOn && window.UNI_DB.onOutOfStockChange) {
      unsub = window.UNI_DB.onOutOfStockChange(() => loadReports());
    }
    return () => unsub();
  }, []);

  const initializePeriod = () => {
    const startOfWeek = weekStart();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    setCurrentPeriod({
      start: startOfWeek.toLocaleDateString('en-CA'),
      end: endOfWeek.toLocaleDateString('en-CA'),
      daysLeft: Math.max(0, Math.ceil((endOfWeek - new Date()) / (1000 * 60 * 60 * 24)))
    });
  };

  const loadReports = async () => {
    const since = weekStart();
    try {
      if (cloudOn && window.UNI_DB.loadOutOfStock) {
        const cloud = await window.UNI_DB.loadOutOfStock(since.toISOString());
        if (cloud) { setReports(cloud); return; }
      }
      // Offline fallback → this browser's localStorage only.
      const data = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
      setReports(data.filter(r => new Date(r.createdAt) >= since));
    } catch (e) {
      console.log('Load reports error:', e);
    }
  };

  const handleProductCodeChange = (code) => {
    setForm({...form, productCode: code});
    setSuggestions([]);

    if (code.trim()) {
      const filtered = drugs.filter(d =>
        d.code.toLowerCase().includes(code.toLowerCase()) ||
        d.nameTH?.toLowerCase().includes(code.toLowerCase()) ||
        d.nameEN?.toLowerCase().includes(code.toLowerCase())
      ).slice(0, 5);

      setSuggestions(filtered);
    }
  };

  const selectProduct = (drug) => {
    setForm({
      productCode: drug.code,
      productName: drug.nameTH || drug.nameEN || '',
      notes: ''
    });
    setSuggestions([]);
  };

  const handleAddReport = async () => {
    const code = (form.productCode || '').trim();
    const name = (form.productName || '').trim();

    if (!code && !name) {
      notify(L('กรุณาระบุรหัสหรือชื่อสินค้า', 'Please enter product code or name'), 'error');
      return;
    }

    const newReport = {
      id: 'oos_' + Date.now(),
      productCode: code,
      productName: name,
      notes: (form.notes || '').trim(),
      image: imagePreview || null,
      reportedBy: perm.role || 'Viewer',
      periodStart: currentPeriod?.start || null,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic update so the reporter sees it immediately; realtime keeps
    // everyone else in sync.
    setReports(prev => [...prev, newReport]);
    setForm({ productCode: '', productName: '', notes: '' });
    setImagePreview(null);
    setSuggestions([]);

    try {
      if (cloudOn && window.UNI_DB.saveOutOfStock) {
        const ok = await window.UNI_DB.saveOutOfStock(newReport);
        if (!ok) throw new Error('cloud save failed');
        notify(L('บันทึกและแชร์ให้ทุกคนแล้ว ✓', 'Saved & shared with everyone ✓'), 'success');
      } else {
        // Offline → persist to this browser only.
        const stored = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
        localStorage.setItem('uni_out_of_stock', JSON.stringify([...stored, newReport]));
        notify(L('บันทึกแล้ว (เครื่องนี้เท่านั้น)', 'Saved (this device only)'), 'success');
      }
    } catch (e) {
      console.error('Save error:', e);
      notify(L('บันทึกขึ้นคลาวด์ไม่สำเร็จ', 'Could not save to cloud'), 'error');
      loadReports(); // roll back optimistic add to the true server state
    }
  };

  // Admin/Manager mark an item handled after ordering. The record is kept in
  // the database as statistics — it is just removed from the active list.
  const handleResolve = async (id) => {
    const stamp = { resolvedAt: new Date().toISOString(), resolvedBy: perm.role || '' };
    // Optimistic: flag it locally so it leaves the active list immediately.
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...stamp } : r));
    try {
      if (cloudOn && window.UNI_DB.setOutOfStockResolved) {
        const ok = await window.UNI_DB.setOutOfStockResolved(id, perm.role || '');
        if (!ok) throw new Error('cloud update failed');
      } else {
        const stored = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
        localStorage.setItem('uni_out_of_stock', JSON.stringify(stored.map(r => r.id === id ? { ...r, ...stamp } : r)));
      }
      notify(L('ย้ายไปสถิติแล้ว ✓', 'Moved to statistics ✓'), 'success');
    } catch (e) {
      console.error('Resolve error:', e);
      notify(L('ดำเนินการไม่สำเร็จ', 'Could not update'), 'error');
      loadReports();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setImagePreview(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const styles = {
    container: { padding: '1.5rem', maxWidth: '900px', margin: '0 auto' },
    tabsContainer: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' },
    tab: (active) => ({
      background: 'none',
      border: 'none',
      padding: '0.5rem 1rem',
      fontSize: '14px',
      fontWeight: active ? '500' : '400',
      color: active ? 'var(--acc2)' : 'var(--txt3)',
      borderBottom: active ? '2px solid var(--acc)' : 'none',
      cursor: 'pointer'
    }),
    card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' },
    header: { fontSize: '18px', fontWeight: '500', marginBottom: '1rem', color: 'var(--txt2)' },
    label: { display: 'block', fontSize: '13px', color: 'var(--txt3)', marginBottom: '6px', fontWeight: '500' },
    input: { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', marginBottom: '1rem', fontFamily: 'inherit', background: 'var(--bg1)', color: 'var(--txt)' },
    button: { background: 'var(--acc)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '14px' },
    reportItem: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', marginBottom: '12px', display: 'flex', gap: '1rem' },
    thumbnail: { width: '60px', height: '60px', background: 'var(--bg4)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
    periodHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' },
    topicBox: { background: 'var(--glow)', border: '1px solid var(--border2)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }
  };

  // Active = still needs ordering; resolved = handled, kept as statistics.
  const activeReports = reports.filter(r => !r.resolvedAt);
  const resolvedReports = reports.filter(r => r.resolvedAt);

  return (
    <div style={{
      ...styles.container,
      background: 'var(--bg0)',
      transition: 'background 0.3s ease'
    }}>
      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button style={styles.tab(tab === 'report')} onClick={() => setTab('report')}>
          📸 {L('รายงาน', 'Report')}
        </button>
        {(perm.role === 'admin' || perm.role === 'manager') && (
          <button style={styles.tab(tab === 'dashboard')} onClick={() => setTab('dashboard')}>
            📊 {L('แผนการสั่ง', 'Dashboard')}
          </button>
        )}
      </div>

      {/* REPORT TAB */}
      {tab === 'report' && (
        <div>
          {/* Topic/Period Header */}
          <div style={styles.topicBox}>
            <div style={styles.periodHeader}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '500', color: 'var(--txt2)' }}>
                  📍 {L('สินค้าหมด', 'Out of stock')}
                </h3>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--txt3)' }}>
                  {L('ช่วง', 'Period')}: {currentPeriod?.start} - {currentPeriod?.end} (7 {L('วัน', 'days')})
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--txt3)' }}>
                <div>{reports.length} {L('รายการ', 'items')}</div>
                <div style={{ color: 'var(--txt4)', marginTop: '4px' }}>{L('รีเซ็ตในอีก', 'Reset in')} {currentPeriod?.daysLeft} {L('วัน', 'days')}</div>
              </div>
            </div>
            <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.6', color: 'var(--txt)' }}>
              <strong>{L('ถ้าพบรายการยาที่หมดระหว่างการขายในช่วงนี้ รบกวนช่วยแนบรูปหรือพิมพ์ชื่อยาลงในโพสนี้ ขอบคุณครับ/ค่ะ', 'If you found any item out of stock during this period, please help to attach the photo or name of items in this post. Thank you!')}</strong><br/>
              <span style={{ color: 'var(--txt3)', display: 'block', marginTop: '8px' }}>🙏</span>
            </p>
          </div>

          {/* Report Form */}
          <div style={styles.card}>
            <h4 style={{ ...styles.header, marginBottom: '1rem', fontSize: '14px' }}>📸 {L('แจ้งรายการสินค้าหมด', 'Report item')}</h4>

            <label style={styles.label}>{L('รหัสสินค้า', 'Product code')} / {L('ชื่อสินค้า', 'Product name')} *</label>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type="text"
                style={styles.input}
                placeholder={L('เช่น P-1234 หรือ ชื่อยา', 'e.g., P-1234 or drug name')}
                value={form.productCode || form.productName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (drugs.some(d => d.code === val)) {
                    const drug = drugs.find(d => d.code === val);
                    selectProduct(drug);
                  } else {
                    handleProductCodeChange(val);
                    if (!drugs.some(d => d.code.toLowerCase() === val.toLowerCase())) {
                      setForm({...form, productCode: '', productName: val});
                    }
                  }
                }}
              />
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg1)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {suggestions.map(drug => (
                    <div
                      key={drug.code}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--txt)'
                      }}
                      onClick={() => selectProduct(drug)}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg1)'}
                    >
                      <div style={{ fontWeight: 500 }}>{drug.code} - {drug.nameTH || drug.nameEN}</div>
                      <div style={{ fontSize: '12px', color: 'var(--txt3)' }}>{drug.nameEN||drug.nameTH}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label style={styles.label}>{L('รูปภาพสินค้า', 'Product image')} *</label>
            <div style={{
              border: '2px dashed var(--border2)',
              borderRadius: '6px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '1rem',
              background: imagePreview ? 'transparent' : 'var(--bg3)'
            }} onClick={() => document.getElementById('imageInput').click()}>
              {imagePreview ? (
                <img src={imagePreview} style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px' }} />
              ) : (
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '13px', color: 'var(--txt3)' }}>
                    {L('คลิกเพื่ออัปโหลดหรือลากรูปที่นี่', 'Click or drag image here')}
                  </div>
                </div>
              )}
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>

            <label style={styles.label}>{L('หมายเหตุ', 'Notes')} ({L('ไม่บังคับ', 'optional')})</label>
            <textarea
              style={{ ...styles.input, minHeight: '80px' }}
              placeholder={L('เช่น หมดนานแค่ไหน หรือกี่ชั่วโมง', 'e.g., Sold out 1 hour before closing...')}
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
            />

            <button style={styles.button} onClick={handleAddReport}>
              ✓ {L('บันทึกรายการ', 'Report this item')}
            </button>
          </div>

          {/* Reported Items List */}
          <div>
            <h4 style={{ ...styles.header, marginTop: '2rem' }}>📝 {L('รายการที่แจ้ง', 'Reported items')} ({reports.length})</h4>
            {reports.length === 0 ? (
              <p style={{ color: 'var(--txt4)', textAlign: 'center', padding: '2rem' }}>
                {L('ยังไม่มีรายการที่แจ้ง', 'No items reported yet')}
              </p>
            ) : (
              reports.map(r => (
                <div key={r.id} style={styles.reportItem}>
                  {r.image ? (
                    <img src={r.image} style={{ ...styles.thumbnail, background: 'transparent', width: '80px', height: '80px' }} />
                  ) : (
                    <div style={styles.thumbnail}>💊</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {r.productCode && <span style={{ color: 'var(--acc2)', fontWeight: '600' }}>{r.productCode}</span>} {r.productName}
                      {r.resolvedAt && (
                        <span style={{ fontSize: '11px', background: 'rgba(34,197,94,.18)', color: 'var(--ok)', border: '1px solid rgba(34,197,94,.35)', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' }}>
                          ✓ {L('สั่งแล้ว', 'Ordered')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--txt3)' }}>
                      {L('แจ้งโดย', 'Reported by')}: {r.reportedBy} • {new Date(r.createdAt).toLocaleDateString('th-TH')} {r.timestamp}
                    </div>
                    {r.notes && (
                      <div style={{ fontSize: '12px', color: 'var(--txt4)', marginTop: '4px' }}>
                        {L('หมายเหตุ', 'Note')}: {r.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD TAB - For Purchasing */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ ...styles.card, background: 'rgba(255,193,7,.12)', border: '1px solid rgba(255,193,7,.35)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--txt)' }}>{activeReports.length} {L('รายการรอสั่ง', 'items to reorder')}</strong>
                <div style={{ fontSize: '13px', color: 'var(--txt3)', marginTop: '4px' }}>
                  {L('แจ้งสำหรับช่วง', 'Reported for period')} {currentPeriod?.start} - {currentPeriod?.end}
                </div>
              </div>
            </div>
          </div>

          <h4 style={{ ...styles.header, marginBottom: '1rem' }}>📋 {L('รายการที่ต้องสั่ง', 'Items to reorder')}</h4>

          {activeReports.length === 0 ? (
            <p style={{ color: 'var(--txt4)', textAlign: 'center', padding: '2rem' }}>
              {L('ไม่มีรายการที่รอสั่งในช่วงนี้', 'No items waiting to reorder this period')}
            </p>
          ) : (
            <div>
              {activeReports.map((r, idx) => (
                <div key={r.id} style={styles.card}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {r.image ? (
                      <img src={r.image} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => window.open(r.image, '_blank')} title={L('คลิกเพื่อดูรูปเต็ม', 'Click to view full image')} />
                    ) : (
                      <div style={{ width: '72px', height: '72px', borderRadius: '6px', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>💊</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '500' }}>
                          {idx + 1}. {r.productCode && <span style={{ color: 'var(--acc2)' }}>[{r.productCode}]</span>} {r.productName}
                        </div>
                        <span style={{ fontSize: '12px', background: 'rgba(255,193,7,.18)', color: 'var(--txt2)', border: '1px solid rgba(255,193,7,.35)', padding: '4px 12px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          ⚠️ {L('หมด', 'Out')}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--txt3)', marginBottom: '4px' }}>
                        {L('แจ้งโดย', 'Reported by')}: {r.reportedBy} • {new Date(r.createdAt).toLocaleDateString('th-TH')} {r.timestamp}
                      </div>
                      {r.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--txt4)', marginBottom: '4px' }}>
                          {L('หมายเหตุ', 'Note')}: {r.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  {perm.canWrite && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button style={{ ...styles.button, background: '#17a2b8', flex: 1 }}
                        onClick={() => handleResolve(r.id)}>
                        ✓ {L('สั่งแล้ว / ลบออกจากรายการ', 'Ordered / Remove from list')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary — handled items are kept here as statistics */}
          <div style={{ ...styles.card, marginTop: '2rem', background: 'var(--bg3)' }}>
            <h5 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500', color: 'var(--txt2)' }}>📊 {L('สรุปสถิติ (ช่วงนี้)', 'Statistics (this period)')}</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--txt3)' }}>{L('รอสั่ง', 'To reorder')}</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--acc2)' }}>{activeReports.length}</div>
              </div>
              <div>
                <div style={{ color: 'var(--txt3)' }}>{L('สั่งแล้ว', 'Ordered')}</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--ok)' }}>{resolvedReports.length}</div>
              </div>
              <div>
                <div style={{ color: 'var(--txt3)' }}>{L('แจ้งทั้งหมด', 'Total reported')}</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--txt2)' }}>{reports.length}</div>
              </div>
            </div>

            {resolvedReports.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--txt3)', marginBottom: '8px', fontWeight: '600' }}>
                  ✓ {L('สั่งแล้ว / ดำเนินการแล้ว', 'Ordered / handled')}
                </div>
                {resolvedReports.map(r => (
                  <div key={r.id} style={{ fontSize: '12px', color: 'var(--txt4)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ textDecoration: 'line-through' }}>
                      {r.productCode && <span style={{ color: 'var(--acc2)' }}>[{r.productCode}]</span>} {r.productName}
                    </span>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {r.resolvedBy ? `${L('โดย', 'by')} ${r.resolvedBy}` : ''} {new Date(r.resolvedAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


/* ===== Reports.jsx ===== */
// Reports.jsx — Reports & Analytics Page

function ReportsPage({ lang, L, drugs, orders, suppliers }) {
  const [activeTab, setActiveTab] = useState('movement');
  const [branchFilter, setBranchFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('2026-06');

  const months = useMemo(() => {
    const s = new Set(orders.map(o => o.poDate?.slice(0, 7)).filter(Boolean));
    return [...s].sort().reverse();
  }, [orders]);

  // Top 10 most ordered drugs
  const top10 = useMemo(() => [...drugs].sort((a, b) => b.orderCount - a.orderCount).slice(0, 10), [drugs]);

  // Bottom 10 (never/rarely ordered)
  const bottom10 = useMemo(() => [...drugs].sort((a, b) => a.orderCount - b.orderCount).slice(0, 10), [drugs]);

  // Monthly movement by branch
  const monthOrders = useMemo(() => {
    let list = orders.filter(o => o.status !== 'cancelled' && o.status !== 'draft');
    if (monthFilter) list = list.filter(o => o.poDate?.startsWith(monthFilter));
    if (branchFilter) list = list.filter(o => o.branch === branchFilter);
    return list;
  }, [orders, monthFilter, branchFilter]);

  const monthTotal = monthOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
  const monthVat = monthOrders.reduce((s, o) => s + (o.vat || 0), 0);
  const monthItems = monthOrders.reduce((s, o) => s + (o.items?.length || 0), 0);

  // Spend by supplier
  const bySupplier = useMemo(() => {
    const map = {};
    monthOrders.forEach(o => {
      map[o.supplierId] = (map[o.supplierId] || 0) + (o.grandTotal || 0);
    });
    return Object.entries(map).map(([id, total]) => ({ supplier: UTILS.getSupplier(id), total })).sort((a, b) => b.total - a.total);
  }, [monthOrders]);

  // Spend by branch
  const byBranch = useMemo(() => {
    return DB.BRANCHES.map(br => ({
      branch: br,
      total: orders.filter(o => o.branch === br.id && o.status !== 'cancelled' && o.status !== 'draft' && (!monthFilter || o.poDate?.startsWith(monthFilter))).reduce((s, o) => s + (o.grandTotal || 0), 0),
      count: orders.filter(o => o.branch === br.id && o.status !== 'cancelled' && (!monthFilter || o.poDate?.startsWith(monthFilter))).length
    }));
  }, [orders, monthFilter]);

  // Chart data
  const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];
  const monthKeys = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
  const totalByMonth = monthKeys.map(k => orders.filter(o => o.poDate?.startsWith(k) && o.status !== 'cancelled' && o.status !== 'draft').reduce((s, o) => s + (o.grandTotal || 0), 0));

  const trendChart = {
    labels: monthLabels,
    datasets: [{ label: L('ยอดสั่งซื้อ (บาท)', 'Purchase Spend (THB)'), data: totalByMonth, fill: true, backgroundColor: 'rgba(17,119,204,.12)', borderColor: '#1177cc', borderWidth: 2, tension: 0.4, pointBackgroundColor: '#8b5cf6' }]
  };

  const catSpendData = useMemo(() => {
    const map = {};
    monthOrders.forEach(po => {
      (po.items || []).forEach(it => {
        const drug = UTILS.getDrug(it.code);
        if (!drug) return;
        const cat = UTILS.getCat(drug.catId);
        const k = lang === 'th' ? cat.name : cat.nameEN;
        map[k] = (map[k] || 0) + (it.amount || 0);
      });
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      labels: sorted.map(([k]) => k),
      datasets: [{ data: sorted.map(([, v]) => +v.toFixed(0)), backgroundColor: ['#1177cc','#06b6d4','#16a34a','#d97706','#dc2626','#e5312a','#3399e8','#059669'], borderWidth: 0 }]
    };
  }, [monthOrders, lang]);

  const branchChart = {
    labels: byBranch.map(b => lang==='th' ? b.branch.name : b.branch.nameEN),
    datasets: [{ label: L('ยอดสั่งซื้อ', 'Spend'), data: byBranch.map(b => b.total), backgroundColor: byBranch.map(b => b.branch.color + 'cc'), borderColor: byBranch.map(b => b.branch.color), borderWidth: 2, borderRadius: 6 }]
  };

  const TABS = [
    { id: 'movement', label: L('รายงานการเคลื่อนไหว', 'Movement Report') },
    { id: 'top10', label: L('Top 10 สั่งบ่อย', 'Top 10 Ordered') },
    { id: 'bottom10', label: L('10 ไม่ได้สั่ง', '10 Rarely Ordered') },
    { id: 'supplier', label: L('ผู้จัดจำหน่าย', 'Supplier Analysis') },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('รายงาน', 'Reports & Analytics')}</div>
          <div className="page-subtitle">{L('วิเคราะห์การสั่งซื้อและการเคลื่อนไหวสินค้า', 'Purchase orders & stock movement analysis')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input input-sm" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="">{L('ทุกเดือน', 'All Months')}</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input input-sm" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="">{L('ทุกสาขา', 'All Branches')}</option>
            {DB.BRANCHES.map(b => <option key={b.id} value={b.id}>{lang==='th'?b.name:b.nameEN}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">{L('ยอดรวมช่วงที่เลือก', 'Period Total')}</div>
          <div className="stat-val" style={{ color: 'var(--acc2)' }}>฿{(monthTotal / 1000).toFixed(0)}K</div>
          <div className="stat-sub">{monthOrders.length} {L('ใบสั่งซื้อ', 'orders')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{L('VAT รวม', 'Total VAT')}</div>
          <div className="stat-val">฿{UTILS.fmt(monthVat, 0)}</div>
          <div className="stat-sub">{L('ภาษีมูลค่าเพิ่ม', 'Value added tax')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{L('รายการสินค้ารวม', 'Total Line Items')}</div>
          <div className="stat-val">{monthItems.toLocaleString()}</div>
          <div className="stat-sub">{L('รายการในใบสั่งซื้อ', 'PO line items')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{L('เฉลี่ย/ใบสั่งซื้อ', 'Avg per PO')}</div>
          <div className="stat-val">฿{UTILS.fmt(monthOrders.length ? monthTotal / monthOrders.length : 0, 0)}</div>
          <div className="stat-sub">{L('ยอดเฉลี่ย', 'average order value')}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card" style={{ gridColumn: '1 / 3' }}>
          <div className="card-header"><span className="card-title">{L('แนวโน้มยอดสั่งซื้อรายเดือน', 'Monthly Purchase Trend')}</span></div>
          <ChartWidget type="line" data={trendChart} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">{L('สัดส่วนตามหมวดหมู่', 'By Category')}</span></div>
          <ChartWidget type="doughnut" data={catSpendData} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }, cutout: '55%' }} height={200} />
        </div>
      </div>

      {/* Branch Comparison */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">{L('เปรียบเทียบยอดสั่งซื้อตามสาขา', 'Branch Purchase Comparison')}</span></div>
        <div className="grid-2">
          <ChartWidget type="bar" data={branchChart} options={{ plugins: { legend: { display: false } } }} height={160} />
          <div>
            {byBranch.map(item => (
              <div key={item.branch.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.branch.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{lang==='th' ? item.branch.name : item.branch.nameEN}</div>
                  <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, marginTop: 4 }}>
                    <div style={{ height: '100%', width: monthTotal > 0 ? (item.total / monthTotal * 100) + '%' : '0%', background: item.branch.color, borderRadius: 3, transition: '.5s' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>฿{(item.total / 1000).toFixed(0)}K</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{item.count} {L('ใบ', 'orders')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {TABS.map(t => <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
      </div>

      {/* Tab: Movement */}
      {activeTab === 'movement' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tbl-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>{L('เลข PO', 'PO No.')}</th>
                  <th>{L('สาขา', 'Branch')}</th>
                  <th>{L('ผู้จัดจำหน่าย', 'Supplier')}</th>
                  <th>{L('วันที่', 'Date')}</th>
                  <th style={{ textAlign: 'right' }}>{L('Gross', 'Gross')}</th>
                  <th style={{ textAlign: 'right' }}>{L('ไม่มี VAT', 'Non-VAT')}</th>
                  <th style={{ textAlign: 'right' }}>{L('มี VAT', 'Taxable')}</th>
                  <th style={{ textAlign: 'right' }}>VAT</th>
                  <th style={{ textAlign: 'right' }}>{L('ยอดสุทธิ', 'Net')}</th>
                  <th>{L('สถานะ', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {monthOrders.length === 0 && <tr><td colSpan={10} className="no-data">{L('ไม่พบข้อมูล', 'No data')}</td></tr>}
                {monthOrders.map(po => (
                  <tr key={po.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{po.poNumber}</td>
                    <td><BranchBadge branchId={po.branch} /></td>
                    <td style={{ fontSize: 12 }} className="ellipsis">{lang==='th'?UTILS.getSupplier(po.supplierId).name:(UTILS.getSupplier(po.supplierId).nameEN||UTILS.getSupplier(po.supplierId).name)}</td>
                    <td style={{ fontSize: 12 }}>{UTILS.fmtDate(po.poDate, lang)}</td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(po.grossTotal, 0)}</td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(po.nonTaxableAmt ?? po.nonTaxable ?? 0, 0)}</td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(po.taxableAmt ?? po.taxable ?? 0, 0)}</td>
                    <td className="tbl-num" style={{ fontSize: 12, color: 'var(--info)' }}>{UTILS.fmt(po.vat || 0, 0)}</td>
                    <td className="tbl-num" style={{ fontWeight: 700 }}>฿{UTILS.fmt(po.grandTotal, 0)}</td>
                    <td><StatusBadge status={po.status} lang={lang} /></td>
                  </tr>
                ))}
              </tbody>
              {monthOrders.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--bg3)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '10px 12px', fontSize: 12 }}>{L('รวมทั้งหมด', 'Grand Total')} ({monthOrders.length} {L('รายการ', 'orders')})</td>
                    <td className="tbl-num">{UTILS.fmt(monthOrders.reduce((s, o) => s + (o.grossTotal || 0), 0), 0)}</td>
                    <td className="tbl-num">{UTILS.fmt(monthOrders.reduce((s, o) => s + (o.nonTaxableAmt ?? o.nonTaxable ?? 0), 0), 0)}</td>
                    <td className="tbl-num">{UTILS.fmt(monthOrders.reduce((s, o) => s + (o.taxableAmt ?? o.taxable ?? 0), 0), 0)}</td>
                    <td className="tbl-num" style={{ color: 'var(--info)' }}>{UTILS.fmt(monthVat, 0)}</td>
                    <td className="tbl-num" style={{ color: 'var(--acc2)', fontSize: 14 }}>฿{UTILS.fmt(monthTotal, 0)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab: Top 10 */}
      {activeTab === 'top10' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="tbl-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>#</th><th>{L('รหัส', 'Code')}</th><th>{L('ชื่อยา', 'Drug Name')}</th><th>{L('หมวด', 'Category')}</th><th style={{ textAlign: 'right' }}>{L('จำนวนครั้งสั่ง/ปี', 'Orders/Yr')}</th><th style={{ textAlign: 'right' }}>{L('ต้นทุน', 'Cost')}</th><th style={{ textAlign: 'right' }}>{L('ราคาขาย', 'Sell')}</th><th style={{ textAlign: 'right' }}>{L('กำไร%', 'Margin%')}</th></tr></thead>
              <tbody>
                {top10.map((d, i) => (
                  <tr key={d.code}>
                    <td>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? 'var(--acc)' : 'var(--bg4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{i + 1}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{d.code}</td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getUnit(d.unit, lang)}</div>
                    </td>
                    <td><span style={{ fontSize: 11, color: UTILS.getCat(d.catId).color }}>{lang === 'th' ? UTILS.getCat(d.catId).name : UTILS.getCat(d.catId).nameEN}</span></td>

                    <td className="tbl-num">
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--acc2)' }}>{d.orderCount}</div>
                      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, marginTop: 3 }}>
                        <div style={{ height: '100%', width: (d.orderCount / top10[0].orderCount * 100) + '%', background: 'var(--acc)', borderRadius: 2 }} />
                      </div>
                    </td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(d.costEx)} ฿</td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(d.sellEx)} ฿</td>
                    <td className="tbl-num" style={{ color: 'var(--ok)', fontWeight: 700 }}>{d.profitMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Bottom 10 */}
      {activeTab === 'bottom10' && (
        <div>
          <div className="card" style={{ padding: 14, marginBottom: 14, borderColor: 'rgba(251,191,36,.3)', background: 'var(--warn-bg)' }}>
            <div style={{ fontSize: 13, color: 'var(--warn)' }}>⚠ {L('รายการสินค้าที่ไม่มีการสั่งซื้อหรือสั่งซื้อน้อยมาก อาจควรพิจารณาตัดออกจากระบบ', 'Products with zero or minimal orders — consider reviewing or removing from catalog')}</div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table>
                <thead><tr><th>#</th><th>{L('รหัส', 'Code')}</th><th>{L('ชื่อยา', 'Drug Name')}</th><th>{L('หมวด', 'Category')}</th><th style={{ textAlign: 'right' }}>{L('ครั้งสั่ง/ปี', 'Orders/Yr')}</th><th style={{ textAlign: 'right' }}>{L('สต็อกรวม', 'Total Stock')}</th><th>{L('สั่งครั้งล่าสุด', 'Last Ordered')}</th><th>{L('ผู้จำหน่าย', 'Supplier')}</th></tr></thead>
                <tbody>
                  {bottom10.map((d, i) => (
                    <tr key={d.code}>
                      <td style={{ color: 'var(--txt3)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--warn)' }}>{d.code}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getUnit(d.unit, lang)}</div>
                      </td>
                      <td><span style={{ fontSize: 11, color: UTILS.getCat(d.catId).color }}>{lang === 'th' ? UTILS.getCat(d.catId).name : UTILS.getCat(d.catId).nameEN}</span></td>
                      <td className="tbl-num" style={{ fontWeight: 700, color: d.orderCount === 0 ? 'var(--err)' : 'var(--warn)' }}>{d.orderCount}</td>
                      <td className="tbl-num" style={{ fontSize: 12 }}>{d.totalStock.toLocaleString()}</td>
                      <td style={{ fontSize: 12, color: 'var(--txt3)' }}>{UTILS.fmtDate(d.lastOrdered, lang)}</td>
                      <td style={{ fontSize: 11 }} className="ellipsis">{lang==='th'?UTILS.getSupplier(d.supplierId).name:(UTILS.getSupplier(d.supplierId).nameEN||UTILS.getSupplier(d.supplierId).name)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Supplier Analysis */}
      {activeTab === 'supplier' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="tbl-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>#</th><th>{L('ผู้จัดจำหน่าย', 'Supplier')}</th><th style={{ textAlign: 'right' }}>{L('ยอดสั่งซื้อ', 'Spend')}</th><th style={{ textAlign: 'right' }}>{L('จำนวนใบ', 'Orders')}</th><th style={{ textAlign: 'right' }}>{L('เฉลี่ย/ใบ', 'Avg/PO')}</th><th>{L('เครดิต', 'Credit')}</th><th style={{ textAlign: 'center' }}>{L('คะแนน', 'Rating')}</th><th>{L('โปรโมชั่น', 'Promotions')}</th></tr></thead>
              <tbody>
                {bySupplier.length === 0 && <tr><td colSpan={8} className="no-data">{L('ไม่พบข้อมูล', 'No data')}</td></tr>}
                {bySupplier.map((item, i) => {
                  const supOrders = monthOrders.filter(o => o.supplierId === item.supplier.id);
                  const sup = suppliers.find(s => s.id === item.supplier.id) || {};
                  return (
                    <tr key={item.supplier.id}>
                      <td style={{ fontWeight: 800, color: i < 3 ? 'var(--acc2)' : 'var(--txt3)' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{lang==='th'?item.supplier.name:(item.supplier.nameEN||item.supplier.name)}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getSupCat(sup.category||'', lang)}</div>
                      </td>
                      <td className="tbl-num">
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--acc2)' }}>฿{(item.total / 1000).toFixed(0)}K</div>
                        <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, marginTop: 4, minWidth: 60 }}>
                          <div style={{ height: '100%', width: bySupplier[0]?.total > 0 ? (item.total / bySupplier[0].total * 100) + '%' : '0%', background: 'var(--acc)', borderRadius: 2 }} />
                        </div>
                      </td>
                      <td className="tbl-num" style={{ fontWeight: 700 }}>{supOrders.length}</td>
                      <td className="tbl-num" style={{ fontSize: 12 }}>฿{UTILS.fmt(supOrders.length ? item.total / supOrders.length : 0, 0)}</td>
                      <td style={{ fontSize: 12 }}>{sup.creditTerm} {L('วัน', 'days')}</td>
                      <td style={{ textAlign: 'center' }}><RatingStars rating={sup.rating || 0} /></td>
                      <td style={{ fontSize: 11 }}>
                        {(sup.promotions || []).map(p => (
                          <div key={p.id} style={{ color: 'var(--ok)', background: 'var(--ok-bg)', borderRadius: 3, padding: '1px 6px', marginBottom: 2, fontSize: 10 }}>{p.name}</div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ReportsPage });


/* ===== Help.jsx ===== */
// Help.jsx — Dynamic User Guide (Update-friendly structure)

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
      steps_th:['ค้นหาด้วยรหัส/ชื่อยา กรองตามหมวดหมู่/VAT/สาขา (เลือกสาขา → เห็นเฉพาะยาที่มีสต็อกในสาขานั้น)','ดูรายละเอียด: ต้นทุน/ขาย, กำไร%, หน่วยบรรจุ, สต็อก','เพิ่มยาใหม่ หรือแก้ไข (กำไรแก้ได้→ราคาขายอัปเดต)','📦 Packaging ON เพื่อดูหน่วยบรรจุแบบเต็ม','หน่วยบรรจุแก้ได้ใน Edit form','🏷️ ปุ่ม "จัดการหมวดหมู่": เพิ่ม/แก้ไข/ลบ หมวดหลัก + หมวดย่อย (2 ภาษา) บันทึกแล้วแชร์ขึ้นคลาวด์','🏪 คอลัมน์ Stock CW แสดงสต็อกจาก CW Pharma แยก 3 สาขา (PTN/RAM/CNX) — สีเขียว>10, เหลือง>0, แดง=หมด; คลิกขยายดูต้นทุน/ราคาขายต่อสาขา'],
      steps_en:['Search by code/name; filter by category/VAT/branch (pick a branch → only drugs stocked there)','View full details: cost/sell, profit%, packaging, stock','Add new or edit drugs (profit editable → auto-update sell)','Toggle Packaging ON to see packaging hierarchy','Edit packaging in the Edit form','🏷️ "Categories" button: add/edit/delete main & sub-categories (bilingual), saved & shared to the cloud','🏪 Stock CW column shows live CW Pharma stock per branch (PTN/RAM/CNX) — green>10, yellow>0, red=out; expand row to see cost/sell per branch'] },
    { icon:'📋', th:'การสั่งซื้อ', en:'Purchase Orders', color:'var(--info)',
      steps_th:['ดูรายการ PO ทั้งหมด กรองตามสาขา/สถานะ/เดือน','เปลี่ยนสถานะ: ส่ง → อนุมัติ → ยืนยันรับ','ดูเอกสาร A4 (ชื่อ Supplier & จำนวนเงินแปลเป็นคำ)', 'สร้าง PO ใหม่: เลือกสาขา+Supplier → ดึงราคา → เลือกสินค้า','สถานที่จัดส่ง: เลือกสาขาจาก Dropdown → ที่อยู่เติมอัตโนมัติ (แก้ไขได้) พร้อมเวลาเปิด+เบอร์โทร','เลือกดีล/โปรโมชั่นของ Supplier — ใช้ข้อมูลล่าสุดเสมอ','🏪 แถบ CW ใต้รายการยา: สต็อก 3 สาขาจาก CW + เปรียบเทียบราคา PO vs ต้นทุน CW'],
      steps_en:['View all POs, filter by branch/status/month','Change status: submit → approve → confirm','View A4 document (supplier name & amount in words translated)','Create PO: select branch+supplier → auto prices → select items','Delivery: pick a branch from the dropdown → address auto-fills (editable) with open hours + phone','Pick a supplier deal/promotion — always uses the latest data','🏪 CW strip below each item: stock per branch from CW Pharma + PO price vs CW cost comparison'] },
    { icon:'🏭', th:'ผู้จัดจำหน่าย', en:'Suppliers', color:'var(--warn)',
      steps_th:['ดูการ์ด Supplier พร้อมยอดซื้อ คะแนน','คลิกการ์ดเพื่อดูรายการยา ประวัติ PO โปรโมชั่น','แก้ไขข้อมูล (ชื่อ/ติดต่อ/เครดิต) หรือเพิ่มผู้จัดจำหน่ายใหม่','เพิ่ม/แก้ไข/ลบโปรโมชั่นในฟอร์มแก้ไข (ชื่อ + ส่วนลด% + ใช้ได้ถึง) → ใช้ตอนสร้าง PO ได้ทันที'],
      steps_en:['View supplier cards with spend, rating, promotions','Click card to see drug list, PO history, deals','Edit info or add new supplier','Add/edit/remove promotions in the edit form (name + discount% + valid-until) → available immediately when creating a PO'] },
    { icon:'⚖', th:'เปรียบเทียบราคา', en:'Price Comparison', color:'var(--err)',
      steps_th:['ค้นหายา หรือเลือกจาก Quick Search ด้านล่าง','ดูราคาทุก Supplier + แนะนำซื้อจากไหน','คอลัมน์ \"vs ถูกสุด\" แสดงส่วนต่างราคา'],
      steps_en:['Search drug or pick from quick search below','See prices from all suppliers + recommendation','\"vs Cheapest\" column shows price difference'] },
    { icon:'📦', th:'ติดตามสินค้า', en:'Stock Tracking', color:'#e5312a',
      steps_th:['ดูสต็อกแยกสาขา (PTN/RAM/CNX) พร้อมแถบสี','กรองดู \"ใกล้หมด\" เพื่อสั่งเร็ว','ดูประวัติการเคลื่อนไหวสต็อก (รับเข้า/จ่ายออก)'],
      steps_en:['View stock per branch with status bars','Filter \"Low Stock\" to see items needing order','View movement history (in/out)'] },
    { icon:'📸', th:'สินค้าหมด', en:'Out of Stock', color:'#d97706',
      steps_th:['แท็บ \"รายงาน\": พิมพ์รหัส/ชื่อยา (มีแนะนำอัตโนมัติ) แนบรูป + หมายเหตุ แล้วกดบันทึก','ข้อมูลแชร์ขึ้นคลาวด์ — ทุกคนเห็นพร้อมกันแบบเรียลไทม์ ไม่ต้องรีเฟรช','รอบรายงาน 7 วัน (จ.–อา.) รีเซ็ตอัตโนมัติ','แท็บ \"แผนการสั่ง\" (Manager/Admin): ดูรายการที่ต้องสั่ง พร้อมรูปภาพ + สรุปสถิติ','สั่งซื้อแล้วกด \"สั่งแล้ว / ลบออกจากรายการ\" → รายการหายจากที่ต้องสั่ง แต่เก็บไว้เป็นสถิติ (สั่งแล้ว/แจ้งทั้งหมด)','⚠️ ต้องรัน database/out_of_stock.sql ใน Supabase ครั้งเดียวก่อนใช้แบบแชร์'],
      steps_en:['\"Report\" tab: type code/name (auto-suggest), attach photo + notes, then save','Reports sync to the cloud — everyone sees them live, no refresh needed','7-day window (Mon–Sun) resets automatically','\"Dashboard\" tab (Manager/Admin): see items to reorder with photos + statistics','After ordering, tap \"Ordered / Remove from list\" → it leaves the active list but is kept as statistics (Ordered / Total reported)','⚠️ Run database/out_of_stock.sql in Supabase once to enable sharing'] },
    { icon:'📊', th:'รายงาน', en:'Reports', color:'var(--acc)',
      steps_th:['เลือกเดือน+สาขา ด้วย filter','ดูกราฟแนวโน้ม หมวดหมู่ เปรียบเทียบสาขา','แท็บ Top 10 / ไม่ได้สั่ง / Supplier Analysis'],
      steps_en:['Select month+branch with filters','View trend, category, branch comparison charts','Tabs: Top 10 / Rarely Ordered / Supplier Analysis'] },
  ];

  // 🎯 EDIT HERE: Update data requirements
  const REQUIRED_DATA = [
    { th:'💊 ฐานข้อมูลยา', en:'💊 Drug Database',
      current_th:'83 ตัวอย่าง', current_en:'83 sample',
      needed_th:'10,258 รายการ', needed_en:'10,258 items',
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
    { priority:'🔴', icon:'💊', th:'นำเข้าฐานข้อมูลยา 10,258 รายการ', en:'Import 10,258 drugs' },
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
          <div className="page-subtitle">UNIPHARMA Purchasing Management — {L('ปรับปรุงล่าสุด:', 'Last updated:')} Jun 2026</div>
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
                {icon:'💊',th:'ข้อมูลตัวอย่าง 83 ยา',en:'83 sample drugs'},
                {icon:'🏭',th:'10 ผู้จัดจำหน่าย',en:'10 suppliers'},
                {icon:'🇹🇭/🇺🇸',th:'2 ภาษา (ไทย/อังกฤษ)',en:'2 languages'},
                {icon:'🌓',th:'โหมดมืด/สว่าง',en:'Dark/Light'},
                {icon:'☁',th:'ซิงค์บนคลาวด์ (Supabase)',en:'Cloud sync (Supabase)'},
                {icon:'⚡',th:'อัปเดตสด เรียลไทม์',en:'Live realtime updates'},
                {icon:'📸',th:'แจ้งสินค้าหมด (แชร์ทุกคน)',en:'Out-of-stock reports (shared)'},
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
                    {icon:'❌',text:L('ลบข้อมูล','Delete Data')},
                    {icon:'❌',text:L('ซิงค์ข้อมูล','Data Sync')},
                  ]
                },
                {
                  num:'3️⃣',
                  role:L('Viewer (ผู้ชมอย่างเดียว)','Viewer - Read-Only'),
                  desc:L('เข้าถึงได้แค่ 2 หน้า: การสั่งซื้อ (ดูเท่านั้น) และ สินค้าหมด (ลงข้อมูลได้)','Access limited to 2 pages: Purchase Orders (view only) and Out of Stock (can submit)'),
                  permissions:[
                    {icon:'✅',text:L('ดู PO (อย่างเดียว)','View PO (only)')},
                    {icon:'✅',text:L('แจ้งสินค้าหมด (ลงข้อมูล)','Report out-of-stock (submit)')},
                    {icon:'❌',text:L('สร้าง/แก้ไข PO','Create/Edit PO')},
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
                    {feat:L('ดู PO','View PO'),a:'✅',m:'✅',v:'✅'},
                    {feat:L('สร้าง PO','Create PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('แก้ไข PO','Edit PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('ลบ PO','Delete PO'),a:'✅',m:'❌',v:'❌'},
                    {feat:L('อนุมัติ PO','Approve PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('จัดการสินค้า','Manage Products'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('จัดการผู้จัดจำหน่าย','Manage Suppliers'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('ซิงค์ข้อมูล','Data Sync'),a:'✅',m:'❌',v:'❌'},
                    {feat:L('ดูรายงาน','View Reports'),a:'✅',m:'✅',v:'✅'},
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
                  <div style={{color:'var(--txt3)',marginBottom:2}}>ปัจจุบัน:</div>
                  <div style={{fontWeight:700,color:'var(--warn)'}}>{lang==='th'?data.current_th:data.current_en}</div>
                </div>
                <div>
                  <div style={{color:'var(--txt3)',marginBottom:2}}>ต้องการ:</div>
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


/* ===== DataSync.jsx ===== */
// DataSync.jsx — Multi-user Sync via Google Sheets + Excel Upload

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


/* ===== CategoryManager.jsx ===== */
// CategoryManager.jsx — add / edit / delete drug categories + sub-categories
function CategoryManagerModal({ lang, L, categories, setCategories, drugs = [], notify, onClose }) {
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const [list, setList] = React.useState(() => JSON.parse(JSON.stringify(categories || [])));
  const [removedIds, setRemovedIds] = React.useState([]);
  const cloudOn = !!(window.UNI_DB && window.UNI_DB.enabled);

  // how many drugs reference each category (so deletes are informed)
  const drugCount = (catId) => drugs.filter(d => d.catId === catId).length;

  const updateCat = (id, k, v) => setList(prev => prev.map(c => c.id === id ? { ...c, [k]: v } : c));
  const removeCat = (id) => { setList(prev => prev.filter(c => c.id !== id)); setRemovedIds(prev => [...prev, id]); };
  const addCat = () => setList(prev => [...prev, { id: uid('CAT'), name: '', nameEN: '', color: '#1177cc', subs: [] }]);

  const addSub = (cid) => setList(prev => prev.map(c => c.id === cid ? { ...c, subs: [...(c.subs || []), { id: uid('S'), name: '', nameEN: '' }] } : c));
  const updateSub = (cid, sid, k, v) => setList(prev => prev.map(c => c.id === cid ? { ...c, subs: c.subs.map(s => s.id === sid ? { ...s, [k]: v } : s) } : c));
  const removeSub = (cid, sid) => setList(prev => prev.map(c => c.id === cid ? { ...c, subs: (c.subs || []).filter(s => s.id !== sid) } : c));

  const save = async () => {
    const clean = list
      .filter(c => (c.name || '').trim() || (c.nameEN || '').trim())
      .map(c => ({ ...c, subs: (c.subs || []).filter(s => (s.name || '').trim() || (s.nameEN || '').trim()) }));
    setCategories(clean);
    if (cloudOn) {
      try {
        if (window.UNI_DB.saveCategoriesBulk) await window.UNI_DB.saveCategoriesBulk(clean);
        if (window.UNI_DB.deleteCategory) for (const id of removedIds) await window.UNI_DB.deleteCategory(id);
      } catch (e) { console.warn('save categories:', e); }
    }
    notify(L('บันทึกหมวดหมู่แล้ว ✓', 'Categories saved ✓'), 'success');
    onClose();
  };

  const lbl = { fontSize: 11, color: 'var(--txt3)', marginBottom: 2 };
  const inp = { width: '100%' };

  return (
    <Modal title={'🏷️ ' + L('จัดการหมวดหมู่ยา', 'Manage Drug Categories')} onClose={onClose} size={780}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก', 'Cancel')}</button>
        <button className="btn btn-primary" onClick={save}>💾 {L('บันทึก', 'Save')}</button>
      </>}>
      <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 12 }}>
        {L('เพิ่ม/แก้ไข/ลบ หมวดหลักและหมวดย่อย (2 ภาษา) — บันทึกแล้วแชร์ขึ้นคลาวด์',
          'Add/edit/delete main & sub-categories (bilingual) — saved & shared to the cloud')}
      </div>

      {list.map((c, ci) => (
        <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 12, background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 44 }}>
              <div style={lbl}>{L('สี', 'Color')}</div>
              <input type="color" value={c.color || '#1177cc'} onChange={e => updateCat(c.id, 'color', e.target.value)}
                style={{ width: 40, height: 34, padding: 0, border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={lbl}>{ci + 1}. {L('ชื่อหมวดหลัก (ไทย)', 'Main category (TH)')}</div>
              <input className="input" style={inp} value={c.name || ''} onChange={e => updateCat(c.id, 'name', e.target.value)} placeholder={L('เช่น โรคหัวใจและหลอดเลือด', 'e.g., Cardiovascular')} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={lbl}>{L('ชื่อหมวดหลัก (อังกฤษ)', 'Main category (EN)')}</div>
              <input className="input" style={inp} value={c.nameEN || ''} onChange={e => updateCat(c.id, 'nameEN', e.target.value)} placeholder="e.g., Cardiovascular Disease" />
            </div>
            <button className="btn btn-ghost" style={{ padding: '8px 10px', color: 'var(--err)' }}
              title={L('ลบหมวดหลัก', 'Delete category')} onClick={() => removeCat(c.id)}>🗑</button>
          </div>

          {drugCount(c.id) > 0 && (
            <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 6 }}>
              ⚠️ {L('มียา', 'Has')} {drugCount(c.id)} {L('รายการในหมวดนี้ (ถ้าลบ ยาจะกลายเป็นไม่มีหมวด)', 'drugs (deleting leaves them uncategorized)')}
            </div>
          )}

          {/* Sub-categories */}
          <div style={{ marginTop: 10, marginLeft: 16, borderLeft: '2px solid var(--border)', paddingLeft: 12 }}>
            {(c.subs || []).map((s, si) => (
              <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 6 }}>
                <div style={{ width: 36, fontSize: 11, color: 'var(--txt4)', paddingBottom: 8 }}>{ci + 1}.{si + 1}</div>
                <div style={{ flex: 1 }}>
                  {si === 0 && <div style={lbl}>{L('หมวดย่อย (ไทย)', 'Sub-category (TH)')}</div>}
                  <input className="input" style={inp} value={s.name || ''} onChange={e => updateSub(c.id, s.id, 'name', e.target.value)} placeholder={L('เช่น ยาลดความดัน', 'e.g., Antihypertensives')} />
                </div>
                <div style={{ flex: 1 }}>
                  {si === 0 && <div style={lbl}>{L('หมวดย่อย (อังกฤษ)', 'Sub-category (EN)')}</div>}
                  <input className="input" style={inp} value={s.nameEN || ''} onChange={e => updateSub(c.id, s.id, 'nameEN', e.target.value)} placeholder="e.g., Antihypertensives" />
                </div>
                <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--err)' }}
                  title={L('ลบหมวดย่อย', 'Delete sub')} onClick={() => removeSub(c.id, s.id)}>✕</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, marginTop: 4 }} onClick={() => addSub(c.id)}>
              + {L('เพิ่มหมวดย่อย', 'Add sub-category')}
            </button>
          </div>
        </div>
      ))}

      <button className="btn btn-primary" style={{ width: '100%' }} onClick={addCat}>
        + {L('เพิ่มหมวดหลัก', 'Add main category')}
      </button>
    </Modal>
  );
}
Object.assign(window, { CategoryManagerModal });


/* ===== tweaks-panel.jsx ===== */
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-omelette-chrome=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = (o) => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({ 2: 16, 3: 10 }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = (s) => {
      const m = options.find((o) => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolve(s))} />;
  }
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

const __TwkCheck = ({ light }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
  </svg>
);

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({ label, value, options, onChange }) {
  if (!options || !options.length) {
    return (
      <div className="twk-row twk-row-h">
        <div className="twk-lbl"><span>{label}</span></div>
        <input type="color" className="twk-swatch" value={value}
               onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = (o) => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const colors = Array.isArray(o) ? o : [o];
          const [hero, ...rest] = colors;
          const sup = rest.slice(0, 4);
          const on = key(o) === cur;
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={colors.join(', ')} title={colors.join(' · ')}
                    style={{ background: hero }}
                    onClick={() => onChange(o)}>
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && <__TwkCheck light={__twkIsLight(hero)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});


/* ===== app.jsx ===== */
// app.jsx — Main App Shell + Routing

function App() {
  // One-time cleanup: drop the old bundled sample-data cache so the app shows
  // only real cloud-synced data (runs once per browser).
  try {
    if (localStorage.getItem('uni_seed') !== 'real-data-v1') {
      ['uni_drugs', 'uni_suppliers', 'uni_orders', 'uni_categories'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('uni_seed', 'real-data-v1');
    }
  } catch (e) {}

  const [page, setPage] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('uni_lang') || 'th');
  const [theme, setTheme] = useState(() => localStorage.getItem('uni_theme') || 'light');
  const [drugs, setDrugs] = useState(() => {
    try { const s = localStorage.getItem('uni_drugs'); return s ? JSON.parse(s) : DB.DRUGS; } catch { return DB.DRUGS; }
  });
  const [suppliers, setSuppliers] = useState(() => {
    try { const s = localStorage.getItem('uni_suppliers'); return s ? JSON.parse(s) : DB.SUPPLIERS; } catch { return DB.SUPPLIERS; }
  });
  const [orders, setOrders] = useState(() => {
    try { const s = localStorage.getItem('uni_orders'); return s ? JSON.parse(s) : DB.PURCHASE_ORDERS; } catch { return DB.PURCHASE_ORDERS; }
  });
  const [categories, setCategories] = useState(() => {
    try { const s = localStorage.getItem('uni_categories'); return s ? JSON.parse(s) : DB.CATEGORIES; } catch { return DB.CATEGORIES; }
  });
  // Mirror React state → global DB so UTILS.getSupplier / getDrug / getCat always return current data.
  // Runs every render (before children), so helpers are never stale after any save/import.
  DB.CATEGORIES = categories;
  DB.DRUGS = drugs;
  DB.SUPPLIERS = suppliers;
  DB.PURCHASE_ORDERS = orders;
  const [viewPO, setViewPO] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [notification, setNotification] = useState(null);
  const [density, setDensity] = useState(() => localStorage.getItem('uni_density') || 'regular');
  const [colorScheme, setColorScheme] = useState(() => localStorage.getItem('uni_colors') || 'blue');

  // ── Auth ──
  // cloudOn  = Supabase configured (data syncs).
  // authOn   = login is actually enforced (REQUIRE_LOGIN flag in config.js).
  const cloudOn = !!(window.UNI_DB && window.UNI_DB.enabled);
  const authOn = !!(window.UNI_DB && window.UNI_DB.requireLogin);
  const [authReady, setAuthReady] = useState(!authOn); // not enforcing → ready immediately
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null); // { role, full_name, email }

  // Color schemes reshape the entire feel
  const SCHEMES = {
    blue: { accent: '#1177cc', accent2: '#06b6d4', ok: '#16a34a', err: '#dc2626', warn: '#d97706' },
    purple: { accent: '#7c3aed', accent2: '#a78bfa', ok: '#10b981', err: '#ef4444', warn: '#f59e0b' },
    emerald: { accent: '#059669', accent2: '#34d399', ok: '#0891b2', err: '#f87171', warn: '#fbbf24' },
    slate: { accent: '#475569', accent2: '#94a3b8', ok: '#22c55e', err: '#ef5350', warn: '#eab308' },
  };
  const colors = SCHEMES[colorScheme];

  // Density affects spacing, sizing
  const DENSITIES = {
    compact: { gap: '6px', cardPad: '10px', fontSize: '13px' },
    regular: { gap: '12px', cardPad: '16px', fontSize: '14px' },
    spacious: { gap: '20px', cardPad: '24px', fontSize: '15px' },
  };
  const dens = DENSITIES[density];

  // Debounced localStorage writer — defers heavy JSON.stringify by 2 s so it
  // never blocks a render. Tiny values (theme/lang) are written immediately.
  const _lsTimers = useRef({});
  const persistLS = useCallback((key, val, delay = 2000) => {
    clearTimeout(_lsTimers.current[key]);
    if (delay === 0) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} return; }
    _lsTimers.current[key] = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
    }, delay);
  }, []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); persistLS('uni_theme', theme, 0); }, [theme]);
  useEffect(() => { persistLS('uni_lang', lang, 0); }, [lang]);
  useEffect(() => { persistLS('uni_drugs', drugs); }, [drugs]);
  useEffect(() => { persistLS('uni_suppliers', suppliers); }, [suppliers]);
  useEffect(() => { UTILS.setRuntimeSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { persistLS('uni_orders', orders); }, [orders]);
  useEffect(() => { persistLS('uni_categories', categories); }, [categories]);

  // Check the auth session on startup and subscribe to changes (only when enforcing login).
  useEffect(() => {
    if (!authOn) return;
    let unsub = () => {};
    (async () => {
      const s = await window.UNI_DB.getSession();
      setSession(s);
      if (s) setMe(await window.UNI_DB.getMyRole());
      setAuthReady(true);
    })();
    unsub = window.UNI_DB.onAuthChange(async (s) => {
      setSession(s);
      setMe(s ? await window.UNI_DB.getMyRole() : null);
    });
    return () => unsub();
  }, []);

  // Load shared data from the cloud. When login is enforced, wait until signed in.
  useEffect(() => {
    if (!cloudOn) return;            // offline → keep localStorage data
    if (authOn && !session) return;  // login required but not signed in yet
    let cancelled = false;
    notify(L('กำลังโหลดข้อมูลจากคลาวด์...', 'Loading data from cloud...'));
    window.UNI_DB.loadAll().then(data => {
      if (cancelled || !data) return;
      // Always set from cloud — cloud is the source of truth (empty cloud → empty UI).
      setDrugs(data.drugs || []);
      setSuppliers(data.suppliers || []);
      setOrders(data.orders || []);
      notify(L(`โหลดข้อมูลแล้ว: ยา ${(data.drugs||[]).length} รายการ`, `Loaded: ${(data.drugs||[]).length} drugs`));
    }).catch(e => {
      console.warn('loadAll error:', e);
      notify(L('โหลดข้อมูลคลาวด์ไม่สำเร็จ — ลองรีเฟรชหน้า', 'Failed to load cloud data — try refreshing'), 'err');
    });
    // Categories live in their own table (flat columns) — load separately.
    window.UNI_DB.loadCategories && window.UNI_DB.loadCategories().then(cats => {
      if (!cancelled && cats && cats.length) setCategories(cats);
    });
    return () => { cancelled = true; };
  }, [session, authOn]);

  // Live data — apply other users' changes without refreshing.
  useEffect(() => {
    if (!cloudOn || !window.UNI_DB.onDataChange) return;
    if (authOn && !session) return;
    const setterOf = { drugs: setDrugs, suppliers: setSuppliers, orders: setOrders };
    const keyOf = { drugs: 'code', suppliers: 'id', orders: 'id' };
    const unsub = window.UNI_DB.onDataChange((kind, p) => {
      // Categories use flat columns (no jsonb `data`) — just reload the list.
      if (kind === 'categories') {
        window.UNI_DB.loadCategories().then(cats => { if (cats && cats.length) setCategories(cats); });
        return;
      }
      const setItems = setterOf[kind], key = keyOf[kind];
      if (!setItems) return;
      if (p.eventType === 'DELETE') {
        const gone = p.old && p.old[key];
        if (gone != null) setItems(prev => prev.filter(x => x[key] !== gone));
        return;
      }
      const obj = p.new && p.new.data;        // the full app object lives in the jsonb `data` column
      if (!obj) return;
      setItems(prev => {
        const i = prev.findIndex(x => x[key] === obj[key]);
        if (i === -1) return kind === 'orders' ? [obj, ...prev] : [...prev, obj];
        const next = prev.slice(); next[i] = obj; return next;
      });
    });
    return unsub;
  }, [session, authOn]);

  // Apply color & density tweaks via CSS variables
  useMemo(() => {
    const root = document.documentElement;
    root.style.setProperty('--acc', colors.accent);
    root.style.setProperty('--acc2', colors.accent2);
    root.style.setProperty('--ok', colors.ok);
    root.style.setProperty('--err', colors.err);
    root.style.setProperty('--warn', colors.warn);
    root.style.setProperty('--density-gap', dens.gap);
    root.style.setProperty('--density-pad', dens.cardPad);
    root.style.setProperty('--density-fs', dens.fontSize);
  }, [colorScheme, density, colors, dens]);

  const setDensityAndSave = (v) => { setDensity(v); localStorage.setItem('uni_density', v); };
  const setColorSchemeAndSave = (v) => { setColorScheme(v); localStorage.setItem('uni_colors', v); };

  const notify = useCallback((msg, type = 'ok') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const L = (th, en) => lang === 'th' ? th : en;

  const NAV = [
    { id: 'dashboard', icon: '▦', th: 'ภาพรวม', en: 'Dashboard' },
    { id: 'drugs', icon: '💊', th: 'ฐานข้อมูลยา', en: 'Drug Database' },
    { id: 'orders', icon: '📋', th: 'การสั่งซื้อ', en: 'Purchase Orders' },
    { id: 'suppliers', icon: '🏭', th: 'ผู้จัดจำหน่าย', en: 'Suppliers' },
    { id: 'comparison', icon: '⚖', th: 'เปรียบเทียบราคา', en: 'Price Comparison' },
    { id: 'stock', icon: '📦', th: 'ติดตามสินค้า', en: 'Stock Tracking' },
    { id: 'out_of_stock', icon: '📸', th: 'สินค้าหมด', en: 'Out of Stock' },
    { id: 'reports', icon: '📊', th: 'รายงาน', en: 'Reports' },
    { id: 'help', icon: '📖', th: 'คู่มือ', en: 'Guide' },
    { id: 'sync', icon: '🔄', th: 'ซิงค์ข้อมูล', en: 'Data Sync', adminOnly: true },
  ];

  const lowStockCount = useMemo(() => drugs.filter(d => Object.values(d.stock || {}).some(v => v <= d.minStock)).length, [drugs]);
  const pendingCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  // Let the mouse wheel scroll the horizontal top-nav (non-passive so we can
  // translate vertical wheel delta into horizontal scroll).
  const navWheelRef = useCallback(node => {
    if (!node) return;
    node.addEventListener('wheel', e => {
      if (!e.deltaY) return;
      e.preventDefault();
      node.scrollLeft += e.deltaY;
    }, { passive: false });
  }, []);

  // Permissions. When login isn't enforced → full control (current open mode).
  // When enforced → driven by the signed-in user's role.
  const role = me ? me.role : (authOn ? 'viewer' : 'admin');
  const perm = {
    role,
    canWrite: role === 'admin' || role === 'manager',
    canApprove: role === 'admin' || role === 'manager',
    canDelete: role === 'admin',
  };
  const roleLabel = { admin: L('ผู้ดูแลระบบ', 'Admin'), manager: L('ฝ่ายจัดซื้อ', 'Purchasing'), viewer: L('ดูอย่างเดียว', 'View-only') }[role] || role;

  // Viewers may only reach the PO page (view-only) and Out of Stock (submit reports).
  const VIEWER_PAGES = ['orders', 'out_of_stock'];
  const isViewer = role === 'viewer';
  const homePage = isViewer ? 'orders' : 'dashboard';
  const curPage = (isViewer && !VIEWER_PAGES.includes(page)) ? homePage : page;
  useEffect(() => {
    // Wait until auth is ready (role is known) before enforcing viewer redirect.
    // Without this guard, the initial null me → role='viewer' fires before the real role loads.
    if (authOn && !authReady) return;
    if (isViewer && !VIEWER_PAGES.includes(page)) setPage(homePage);
  }, [isViewer, page, authReady]);

  const sharedProps = { lang, L, drugs, setDrugs, suppliers, setSuppliers, orders, setOrders, categories, setCategories, notify, setPage, setViewPO, setShowCreate, perm };

  // ── Auth gate (only when login is enforced) ──
  if (authOn && !authReady) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt3)', background: 'var(--bg0)' }}>{L('กำลังโหลด…', 'Loading…')}</div>;
  }
  if (authOn && !session) {
    return <LoginScreen L={L} lang={lang} setLang={setLang} onSignedIn={async () => { const s = await window.UNI_DB.getSession(); setSession(s); setMe(await window.UNI_DB.getMyRole()); }} />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* TWEAKS PANEL */}
      <TweaksPanel>
        <TweakSection label={L('ลักษณะการแสดงผล', 'Appearance')} />
        <TweakRadio label={L('สีหลัก', 'Color Scheme')} value={colorScheme}
          options={['blue', 'purple', 'emerald', 'slate']}
          onChange={setColorSchemeAndSave} />
        <TweakRadio label={L('ความหนาแน่น', 'Density')} value={density}
          options={['compact', 'regular', 'spacious']}
          onChange={setDensityAndSave} />
      </TweaksPanel>

      {/* TOP NAV */}
      <nav className="topnav">
        <a className="topnav-logo" href="#" onClick={e => { e.preventDefault(); setPage(homePage); }}>
          <img src="assets/logo.png" alt="Unipharma" />
          <div className="topnav-brand">
            <span>UNIPHARMA</span>
            <small>Purchasing System</small>
          </div>
        </a>

        <div className="topnav-nav" ref={navWheelRef}>
          {NAV.filter(n => {
            if (n.adminOnly && perm.role !== 'admin') return false;
            if (isViewer) return VIEWER_PAGES.includes(n.id);
            return true;
          }).map(n => (
            <button key={n.id} className={`nav-btn${curPage === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              {L(n.th, n.en)}
              {n.id === 'stock' && lowStockCount > 0 && (
                <span style={{ background: 'var(--err)', color: '#fff', borderRadius: 20, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{lowStockCount}</span>
              )}
              {n.id === 'orders' && pendingCount > 0 && (
                <span style={{ background: 'var(--warn)', color: '#000', borderRadius: 20, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="topnav-right">
          <button className="lang-toggle" onClick={() => setLang(l => l === 'th' ? 'en' : 'th')}>
            {lang === 'th' ? 'EN' : 'ไทย'}
          </button>
          <button className="icon-btn" title="Toggle theme" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          {perm.canWrite && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              + {L('สร้างใบสั่งซื้อ', 'New PO')}
            </button>
          )}
          {authOn && session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4, paddingLeft: 10, borderLeft: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'right', lineHeight: 1.2 }} title={me && me.email}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(me && (me.full_name || me.email)) || ''}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{roleLabel}</div>
              </div>
              <button className="icon-btn" title={L('ออกจากระบบ', 'Sign out')} onClick={async () => { await window.UNI_DB.signOut(); setSession(null); setMe(null); }}>⏏</button>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="main-layout">
        {(curPage === 'dashboard' || (curPage === 'sync' && perm.role !== 'admin')) && <DashboardPage {...sharedProps} />}
        {curPage === 'drugs' && <DrugsPage {...sharedProps} />}
        {curPage === 'orders' && <OrdersPage {...sharedProps} />}
        {curPage === 'suppliers' && <SuppliersPage {...sharedProps} />}
        {curPage === 'comparison' && <ComparisonPage {...sharedProps} />}
        {curPage === 'stock' && <StockPage {...sharedProps} />}
        {curPage === 'out_of_stock' && <OutOfStockPage lang={lang} L={L} perm={perm} notify={notify} drugs={drugs} />}
        {curPage === 'reports' && <ReportsPage {...sharedProps} />}
        {curPage === 'help' && <HelpPage lang={lang} L={L} perm={perm} />}
        {curPage === 'sync' && perm.role === 'admin' && <DataSyncPage lang={lang} L={L} drugs={drugs} setDrugs={setDrugs} suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} perm={perm} />}
      </div>

      {/* CREATE / EDIT PO MODAL */}
      {showCreate && perm.canWrite && (
        <CreatePOModal {...sharedProps}
          editPO={editPO}
          onClose={() => { setShowCreate(false); if (editPO) setViewPO(editPO); setEditPO(null); }}
          onCreated={(po, items) => {
            if (editPO) {
              setOrders(prev => prev.map(o => o.id === po.id ? po : o));
              notify(L('แก้ไขใบสั่งซื้อสำเร็จ', 'PO updated successfully'));
            } else {
              setOrders(prev => [po, ...prev]);
              notify(L('สร้างใบสั่งซื้อสำเร็จ', 'PO created successfully'));
            }
            setShowCreate(false); setEditPO(null); setViewPO(po);
            if (window.UNI_DB) window.UNI_DB.savePOWithUnits(po, items, drugs);
          }} />
      )}

      {/* PO DOCUMENT VIEWER */}
      {viewPO && (
        <PODocumentModal po={viewPO} lang={lang} L={L} suppliers={suppliers}
          onClose={() => setViewPO(null)}
          onEdit={perm.canWrite ? () => { setEditPO(viewPO); setViewPO(null); setShowCreate(true); } : null} />
      )}

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: notification.type === 'ok' ? 'var(--ok)' : notification.type === 'err' ? 'var(--err)' : 'var(--warn)',
          color: '#fff', padding: '10px 18px', borderRadius: 'var(--r2)', boxShadow: 'var(--shadow2)',
          fontSize: 13, fontWeight: 600, animation: 'fadeIn .2s ease'
        }}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
