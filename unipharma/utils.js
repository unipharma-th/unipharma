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
  function getSupplier(id){ return DB.SUPPLIERS.find(s=>s.id===id)||{name:id,nameEN:id}; }
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
  const PKG_MAP = {
    'เม็ด':    { base:'เม็ด',   baseEN:'Tablet',   levels:[{th:'แผง',en:'Strip',  qty:10},{th:'กล่อง',en:'Box',    qty:10},{th:'ลัง',en:'Carton', qty:24}]},
    'แคปซูล':{ base:'แคปซูล',baseEN:'Capsule', levels:[{th:'แผง',en:'Strip',  qty:10},{th:'กล่อง',en:'Box',    qty:10},{th:'ลัง',en:'Carton', qty:24}]},
    'ขวด':    { base:'ขวด',   baseEN:'Bottle',   levels:[{th:'แพ็ค',en:'Pack', qty:6},{th:'โหล',en:'Dozen', qty:2},{th:'ลัง',en:'Carton', qty:2}]},
    'กระป๋อง':{ base:'กระป๋อง',baseEN:'MDI',     levels:[{th:'กล่อง',en:'Box',    qty:1},{th:'ลัง',en:'Carton', qty:6}]},
    'หลอด':    { base:'หลอด',   baseEN:'Tube',     levels:[{th:'กล่อง',en:'Box',    qty:1},{th:'ลัง',en:'Carton', qty:12}]},
    'ปากกา':  { base:'ปากกา',  baseEN:'Pen',      levels:[{th:'กล่อง',en:'Box',    qty:5}]},
    'แพ็ค':    { base:'ชิ้น',   baseEN:'Piece',    levels:[{th:'แพ็ค',en:'Pack',   qty:100},{th:'ลัง',en:'Carton', qty:10}]},
    'กล่อง':    { base:'ชิ้น',   baseEN:'Piece',    levels:[{th:'กล่อง',en:'Box',    qty:100},{th:'ลัง',en:'Carton', qty:12}]},
    'เครื่อง':  { base:'เครื่อง',  baseEN:'Unit',     levels:[{th:'กล่อง',en:'Box',    qty:1}]},
  };
  function getPackaging(unit, lang, drug){
    // Prefer drug's own custom packaging over defaults
    if(drug && drug.pkgBase && drug.pkgLevels && drug.pkgLevels.length>0){
      const chain=[{th:drug.pkgBase,en:drug.pkgBaseEN||drug.pkgBase,qty:1,cumulative:1}];
      let total=1;
      drug.pkgLevels.forEach(l=>{total*=(l.qty||1);chain.push({...l,cumulative:total});});
      return {base:drug.pkgBase,baseEN:drug.pkgBaseEN||drug.pkgBase,levels:drug.pkgLevels,chain,totalInTop:total};
    }
    // Fall back to default map
    const pkg=PKG_MAP[unit];
    if(!pkg) return null;
    let total=1;
    const chain=[{th:pkg.base,en:pkg.baseEN,qty:1,cumulative:1}];
    pkg.levels.forEach(l=>{total*=l.qty;chain.push({...l,cumulative:total});});
    return {base:pkg.base,baseEN:pkg.baseEN,levels:pkg.levels,chain,totalInTop:total};
  }

  return {fmt,fmtDate,fmtDateISO,numToThaiWords,generatePONumber,statusLabel,statusColor,stars,debounce,
          getCat,getSub,getBranch,getSupplier,getDrug,calcPOSummary,getLowStock,monthlyTotals,
          getUnit,getSupCat,getBranchName,getPackaging};
})();
