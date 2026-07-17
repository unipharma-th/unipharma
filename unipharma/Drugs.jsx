// Drugs.jsx — Drug Database Page
const { useState, useMemo, useCallback, useEffect } = React;

// Maps CW Pharma Thai unit strings → UNIPHARMA unit codes
const CW_UNIT_MAP = {
  // Dosage forms
  'เม็ด':'TAB','แคปซูล':'CAP','ซอฟต์เจล':'SGC','ยาเหน็บ':'SUPP',
  'ยาอม':'LOZ','ผงยา':'POW','ยาผงซอง':'SACH','แกรนูล':'GRAN',
  // Liquid
  'มิลลิลิตร':'ML','มล.':'ML','ซีซี':'CC','ลิตร':'L','สเปรย์':'SPRAY',
  // Medical
  'หลอดยา':'AMP','แอมพูล':'AMP','ไวอัล':'VIAL','แผ่นแปะ':'PATCH',
  // Packaging
  'แผง':'STRIP','ขวด':'BTL','กล่อง':'BOX','ซอง':'POUCH','หลอด':'TUBE',
  'กระปุก':'JAR','กระป๋อง':'CAN','ถุง':'BAG','แพ็ก':'PK','ม้วน':'ROLL',
  'ชุด':'SET','คู่':'PAIR','โหล':'DOZ','ลัง':'CTN',
  // Generic
  'ชิ้น':'EA','อัน':'EA','แท่ง':'EA','ก้าน':'EA',
};

const PER_PAGE = 50;
// Created once at module level — Intl.Collator construction is expensive
const NATURAL_CMP = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function UnusedDrugsPanel({ lang, L, drugs, onEdit }) {
  const [usedCodes, setUsedCodes] = useState(null);
  useEffect(() => {
    if (window.UNI_DB && window.UNI_DB.loadUsedDrugCodes) {
      window.UNI_DB.loadUsedDrugCodes().then(codes => setUsedCodes(codes));
    } else {
      setUsedCodes(new Set());
    }
  }, []);
  const unused = React.useMemo(() =>
    usedCodes ? drugs.filter(d => !usedCodes.has(d.code)) : null,
    [drugs, usedCodes]
  );
  if (!unused) return <div style={{padding:40,textAlign:'center',color:'var(--txt3)'}}>⏳ {L('กำลังตรวจสอบ…','Checking…')}</div>;
  return (
    <div>
      <div style={{padding:'10px 0',color:'var(--txt3)',fontSize:13,marginBottom:8}}>
        {L('พบ','Found')} <strong>{unused.length.toLocaleString()}</strong> {L('รายการที่ยังไม่เคยมี PO','items with no purchase order yet')}
      </div>
      {unused.length === 0 ? (
        <div style={{textAlign:'center',padding:40,color:'var(--ok)',fontSize:14}}>✅ {L('ทุกรายการมี PO แล้ว','All items have POs')}</div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table className="table" style={{width:'100%',fontSize:13}}>
            <thead><tr>
              <th style={{width:100}}>{L('รหัส','Code')}</th>
              <th>{L('ชื่อไทย','Thai Name')}</th>
              <th>{L('ชื่ออังกฤษ','English Name')}</th>
              <th style={{width:80}}>{L('หน่วย','Unit')}</th>
              <th style={{width:80}}></th>
            </tr></thead>
            <tbody>
              {unused.map(d => (
                <tr key={d.code} style={{cursor:'pointer'}} onClick={()=>onEdit(d)}>
                  <td><code style={{fontSize:11,background:'var(--bg3)',borderRadius:4,padding:'2px 6px'}}>{d.code}</code></td>
                  <td>{d.nameTH}</td>
                  <td style={{color:'var(--txt3)',fontSize:12}}>{d.nameEN}</td>
                  <td style={{color:'var(--txt3)'}}>{d.unit}</td>
                  <td><button className="btn btn-xs btn-ghost" onClick={e=>{e.stopPropagation();onEdit(d);}}>✏️ {L('แก้ไข','Edit')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CwPriceChart({ history, lang }) {
  const [branch, setBranch] = React.useState('00');
  if (!history) return (
    <div style={{ fontSize:10, color:'var(--txt4)', marginTop:6 }}>
      ⏳ {lang==='th' ? 'กำลังโหลดประวัติราคา…' : 'Loading price history…'}
    </div>
  );
  if (history.length < 2) return (
    <div style={{ fontSize:10, color:'var(--txt4)', fontStyle:'italic', marginTop:6 }}>
      {lang==='th' ? '(ยังไม่มีประวัติ — จะสะสมทีละวันจากนี้)' : '(No history yet — builds up daily from now)'}
    </div>
  );
  const W = 300, H = 72, PX = 6, PY = 10;
  const ck = 'cost_' + branch, sk = 'sell_' + branch;
  const vals = history.flatMap(h => [+(h[ck]||0), +(h[sk]||0)]).filter(v => v > 0);
  if (!vals.length) return null;
  const minV = Math.min(...vals) * 0.97, maxV = Math.max(...vals) * 1.03, rng = maxV - minV || 1;
  const n = history.length;
  const px = i => PX + (i / (n - 1)) * (W - 2 * PX);
  const py = v => H - PY - ((v - minV) / rng) * (H - 2 * PY);
  const path = key => history.map((h,i) => (i===0?'M':'L') + px(i).toFixed(1) + ',' + py(+(h[key]||0)).toFixed(1)).join('');
  const last = history[history.length - 1];
  const lc = +(last[ck]||0), ls = +(last[sk]||0);
  const profit = ls - lc;
  const margin = ls > 0 ? ((profit / ls) * 100).toFixed(1) : '0.0';
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
        <span style={{ fontSize:10, fontWeight:600, color:'var(--txt3)' }}>📈 {lang==='th'?'ประวัติราคา':'Price History'}</span>
        {['00','01','02'].map(b => (
          <button key={b} onClick={()=>setBranch(b)} style={{
            fontSize:9, padding:'1px 5px', borderRadius:3, border:'1px solid var(--border)',
            background: branch===b ? 'var(--acc1)' : 'transparent',
            color: branch===b ? '#fff' : 'var(--txt3)', cursor:'pointer' }}>
            {b==='00'?'PTN':b==='01'?'RAM':'CNX'}
          </button>
        ))}
        <span style={{ fontSize:9, color:'var(--txt4)', marginLeft:'auto' }}>
          {history[0].sync_date.slice(5)} – {last.sync_date.slice(5)} ({n} {lang==='th'?'จุด':'pts'})
        </span>
      </div>
      <svg width={W} height={H} style={{ display:'block', border:'1px solid var(--border)', borderRadius:4 }}>
        <path d={path(ck)} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        <path d={path(sk)} fill="none" stroke="#22c55e" strokeWidth="1.5" />
        <circle cx={px(n-1)} cy={py(lc)} r="2.5" fill="#3b82f6" />
        <circle cx={px(n-1)} cy={py(ls)} r="2.5" fill="#22c55e" />
      </svg>
      <div style={{ display:'flex', gap:10, fontSize:10, color:'var(--txt4)', marginTop:2 }}>
        <span><span style={{color:'#3b82f6'}}>●</span> {lang==='th'?'ต้นทุน':'Cost'} {lc?UTILS.fmt(lc)+' ฿':'-'}</span>
        <span><span style={{color:'#22c55e'}}>●</span> {lang==='th'?'ราคาขาย':'Sell'} {ls?UTILS.fmt(ls)+' ฿':'-'}</span>
        {profit > 0 && <span style={{color:'var(--ok)'}}>กำไร {UTILS.fmt(profit)} ฿ ({margin}%)</span>}
      </div>
    </div>
  );
}

function DrugsPage({ lang, L, drugs, setDrugs, suppliers, categories, setCategories, notify, perm = { canWrite: true } }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [vatFilter, setVatFilter] = useState('all'); // all | vat | novat
  const [branchFilter, setBranchFilter] = useState(''); // '' = all branches; else PTN|RAM|CNX
  const [page, setPage] = useState(1);
  const [editDrug, setEditDrug] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unused'
  const [sortCol, setSortCol] = useState('code');
  const [sortDir, setSortDir] = useState('asc');
  const [showPkg, setShowPkg] = useState(false);
  const [expandedCode, setExpandedCode] = useState(null);
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [cwStock, setCwStock] = useState({});
  const [cwSyncedAt, setCwSyncedAt] = useState(null);
  const [cwHistory, setCwHistory] = useState({});
  const cwAutoSynced = React.useRef(false);

  const cats = categories || DB.CATEGORIES;
  const selectedCat = cats.find(c => c.id === catFilter);

  // Load CW Pharma stock — cached in IDB via UNI_DB.loadCwStock (6 h TTL)
  // Also auto-updates nameEN for products whose CW name differs from the system name
  useEffect(() => {
    if (!window.UNI_DB || !window.UNI_DB.enabled) return;
    (async () => {
      const data = await window.UNI_DB.loadCwStock().catch(() => null);
      if (!data || !data.length) return;
      const map = {};
      data.forEach(r => { map[r.code] = r; });
      setCwStock(map);
      setCwSyncedAt(data[0].synced_at);

      if (cwAutoSynced.current) return;
      cwAutoSynced.current = true;

      const _sim = window._nameSim || (() => 1);
      const mismatched = drugs.filter(d => {
        const cw = map[d.code];
        if (!cw || !cw.name) return false;
        if (_sim(cw.name, d.nameEN || '') >= 0.85) return false; // EN already matches
        if (_sim(cw.name, d.nameTH || '') >= 0.85) return false; // CW name is Thai & matches TH — skip
        return true;
      });
      if (!mismatched.length) return;

      // Products where the entire drug changed (code reassigned) — need TH translation
      const needsThUpdate = mismatched.filter(d => _sim(map[d.code].name, d.nameTH || '') < 0.5);
      const thTranslations = {};
      if (needsThUpdate.length && typeof _gtranslate === 'function') {
        await Promise.all(needsThUpdate.map(async d => {
          const thai = await _gtranslate(map[d.code].name, 'en', 'th').catch(() => '');
          if (thai) thTranslations[d.code] = thai;
        }));
      }

      const updatedList = mismatched.map(d => {
        const cwName = map[d.code].name;
        const translatedTH = thTranslations[d.code];
        return translatedTH ? { ...d, nameEN: cwName, nameTH: translatedTH } : { ...d, nameEN: cwName };
      });
      const thUpdatedCount = Object.keys(thTranslations).length;

      await window.UNI_DB.saveDrugsBulk(updatedList);
      setDrugs(prev => {
        const byCode = {};
        updatedList.forEach(u => { byCode[u.code] = u; });
        return prev.map(d => byCode[d.code] || d);
      });
      const thNote = thUpdatedCount ? L(' (รวมชื่อ TH ' + thUpdatedCount + ' รายการที่สินค้าเปลี่ยน)', ' (incl. ' + thUpdatedCount + ' TH names where product changed)') : '';
      if (notify) notify(
        L('อัปเดตชื่อ EN ' + mismatched.length + ' รายการจาก CW Pharma อัตโนมัติ' + thNote,
          'Auto-updated ' + mismatched.length + ' names from CW Pharma' + thNote),
        'ok'
      );
    })().catch(e => console.warn('[CW auto-sync]', e));
  }, []);

  // Load CW price history for the expanded drug (lazy, per-code, cached in cwHistory state)
  useEffect(() => {
    if (!expandedCode) return;
    if (cwHistory[expandedCode] !== undefined) return; // already loaded
    if (!window.UNI_DB || !window.UNI_DB.loadCwPriceHistory) return;
    // null = loading; array = loaded
    setCwHistory(prev => Object.assign({}, prev, { [expandedCode]: null }));
    window.UNI_DB.loadCwPriceHistory([expandedCode])
      .then(data => {
        const arr = (data || {})[expandedCode] || [];
        setCwHistory(prev => Object.assign({}, prev, { [expandedCode]: arr }));
      })
      .catch(e => {
        console.warn('[CW hist]', e);
        setCwHistory(prev => Object.assign({}, prev, { [expandedCode]: [] }));
      });
  }, [expandedCode]);

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
      [L('ผู้จัดจำหน่าย', 'Supplier')]: (() => { const s = suppliers.find(x=>x.id===d.supplierId)||suppliers.find(x=>(x.drugs||[]).includes(d.code)); return s?s.name:(d.supplierId||''); })(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch:10},{wch:40},{wch:40},{wch:12},{wch:20},{wch:20},{wch:10},{wch:14},{wch:22},{wch:22},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:12},{wch:30}];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, L('ยา', 'Drugs'));
    XLSX.writeFile(wb, `drugs_${new Date().toISOString().slice(0,10)}.xlsx`);
    notify(L(`Export ${filtered.length} รายการ ✓`, `Exported ${filtered.length} items ✓`), 'ok');
  };
  const SortIcon = ({ col }) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

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

  const handleReuseCode = useCallback(matchedDrug => {
    setShowAdd(false);
    setEditDrug(matchedDrug);
    notify(L(`เปิดแก้ไขสินค้ารหัส ${matchedDrug.code}`, `Editing existing product ${matchedDrug.code}`));
  }, [notify, L]);

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
          <div className="page-subtitle" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span>{L('แสดง', 'Showing')} {filtered.length.toLocaleString()} {L('จาก', 'of')} {drugs.length.toLocaleString()} {L('รายการ', 'items')}
            {branchFilter && ` · ${lang === 'th' ? (DB.BRANCHES.find(b=>b.id===branchFilter)||{}).name : (DB.BRANCHES.find(b=>b.id===branchFilter)||{}).nameEN}`}</span>
            {cwSyncedAt && (
              <span style={{ fontSize:11, background:'var(--ok-bg)', color:'var(--ok)', borderRadius:99, padding:'1px 9px', fontWeight:500 }}>
                ⟳ CW {new Date(cwSyncedAt).toLocaleString('th-TH', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
              </span>
            )}
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

      {/* TAB BAR */}
      <div style={{display:'flex',gap:0,borderBottom:'2px solid var(--border)',marginBottom:14}}>
        {[
          {key:'all',  label:L('สินค้าทั้งหมด','All Products'), icon:'💊'},
          {key:'unused',label:L('ยังไม่มี PO','No PO Yet'),   icon:'📋'},
        ].map(({key,label,icon})=>(
          <button key={key} onClick={()=>setActiveTab(key)}
            style={{padding:'8px 18px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab===key?700:400,
              color:activeTab===key?'var(--acc2)':'var(--txt3)',
              borderBottom:activeTab===key?'2px solid var(--acc2)':'2px solid transparent',
              marginBottom:-2,fontSize:13}}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* UNUSED DRUGS PANEL */}
      {activeTab === 'unused' && (
        <div className="card" style={{padding:16}}>
          <UnusedDrugsPanel lang={lang} L={L} drugs={drugs} onEdit={d=>{setEditDrug(d);setShowAdd(false);}} />
        </div>
      )}

      {activeTab === 'all' && <>

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
          {(search || catFilter || subFilter || vatFilter !== 'all' || branchFilter) && (
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
                <ColHead col="totalStock">{Object.keys(cwStock).length ? L('Stock CW (3 สาขา)', 'Stock CW (3 branches)') : L('สต็อกรวม', 'Total Stock')}</ColHead>
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
                        {d.remark && (() => { const r = DRUG_REMARKS.find(x=>x.code===d.remark); return r ? (
                          <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:'var(--warn-bg)', color:'var(--warn)', fontWeight:600, display:'inline-block', marginTop:2 }}>
                            📝 {lang==='th'?r.th:r.en}
                          </span>
                        ) : null; })()}
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
                        {d.hasVat
                          ? <><div style={{ fontWeight: 600 }}>{UTILS.fmt(d.sellInc)} ฿</div><div style={{ fontSize: 10, color: 'var(--txt3)' }}>ไม่รวม VAT {UTILS.fmt(d.sellEx)} ฿</div></>
                          : <div style={{ fontWeight: 600 }}>{UTILS.fmt(d.sellEx)} ฿</div>
                        }
                      </td>
                      <td className="tbl-num">
                        <div style={{ fontWeight: 700, color: 'var(--ok)' }}>{UTILS.fmt(d.profitEx)} ฿</div>
                        <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{d.profitMargin}%</div>
                      </td>
                      <td>
                        {(() => {
                          const cw = cwStock[d.code];
                          if (cw) {
                            const brs = [
                              { id: 'PTN', val: cw.stock_00 ?? 0 },
                              { id: 'RAM', val: cw.stock_01 ?? 0 },
                              { id: 'CNX', val: cw.stock_02 ?? 0 },
                            ];
                            return (
                              <div style={{ display:'flex', gap:3 }}>
                                {brs.map(b => (
                                  <span key={b.id} style={{
                                    display:'inline-flex', flexDirection:'column', alignItems:'center',
                                    minWidth:34, background: b.val > 10 ? 'var(--ok-bg)' : b.val > 0 ? 'var(--warn-bg)' : 'var(--err-bg)',
                                    borderRadius:6, padding:'2px 3px', gap:0,
                                  }}>
                                    <span style={{ fontSize:9, color:'var(--txt3)', fontWeight:600 }}>{b.id}</span>
                                    <span style={{ fontSize:12, fontWeight:700, color: b.val > 10 ? 'var(--ok)' : b.val > 0 ? 'var(--warn)' : 'var(--err)' }}>{b.val}</span>
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          if (branchFilter) return (
                            <span style={{ color:(d.stock?.[branchFilter]||0)<=d.minStock?'var(--err)':'var(--ok)', fontWeight:700, fontSize:13 }}>
                              {(d.stock?.[branchFilter]||0).toLocaleString()}
                            </span>
                          );
                          return (
                            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                              <span style={{ color:ss==='err'?'var(--err)':ss==='warn'?'var(--warn)':'var(--ok)', fontWeight:700, fontSize:13 }}>
                                {d.totalStock.toLocaleString()}
                              </span>
                              <div style={{ display:'flex', gap:3, fontSize:10 }}>
                                {DB.BRANCHES.map(br => (
                                  <span key={br.id} style={{ color:d.stock[br.id]<=d.minStock?'var(--err)':'var(--txt4)' }}>
                                    {br.id}:{d.stock[br.id]}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
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
                            {d.remark && (() => {
                              const r = DRUG_REMARKS.find(x=>x.code===d.remark);
                              if (!r) return null;
                              return (
                                <div>
                                  <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:4, fontWeight:600 }}>📝 {L('หมายเหตุ','Remarks')}</div>
                                  <div style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'var(--warn-bg)', color:'var(--warn)', fontWeight:600, display:'inline-block', marginBottom:4 }}>
                                    {lang==='th'?r.th:r.en}
                                  </div>
                                  <div style={{ fontSize:11, color:'var(--txt3)' }}>{lang==='th'?r.detailTH:r.detailEN}</div>
                                  {d.remarkNote && <div style={{ fontSize:11, color:'var(--txt4)', marginTop:4, fontStyle:'italic' }}>📌 {d.remarkNote}</div>}
                                </div>
                              );
                            })()}
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
                            {(() => {
                              const cw = cwStock[d.code];
                              if (!cw) return null;
                              const brs = [
                                { id:'PTN', stock:cw.stock_00??0, cost:cw.cost_00??0, sell:cw.sell_00??0 },
                                { id:'RAM', stock:cw.stock_01??0, cost:cw.cost_01??0, sell:cw.sell_01??0 },
                                { id:'CNX', stock:cw.stock_02??0, cost:cw.cost_02??0, sell:cw.sell_02??0 },
                              ];
                              return (
                                <div>
                                  <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:6, fontWeight:600 }}>
                                    🏪 {L('ข้อมูล CW Pharma', 'CW Pharma Data')}
                                    <span style={{ fontSize:10, color:'var(--txt4)', marginLeft:6, fontWeight:400 }}>
                                      {L('ขายแล้ว', 'Sold')} {(cw.qty_sold||0).toLocaleString()} {L('ชิ้น/ปี', 'pcs/yr')}
                                    </span>
                                  </div>
                                  {cw.name && (
                                    <div style={{fontSize:11,marginBottom:6,padding:'4px 10px',background:'var(--bg4)',borderRadius:6}}>
                                      <span style={{color:'var(--txt3)'}}>{L('ชื่อใน CW','CW name')}: </span>
                                      <span style={{fontWeight:500}}>{cw.name}</span>
                                      {(window._nameSim||function(){return 1;})(cw.name,d.nameEN||'') < 0.5 && (
                                        <span style={{marginLeft:6,color:'var(--warn)',fontWeight:700,fontSize:10}}>
                                          ⚠️ {L('ชื่อต่างจากในระบบ','Name differs from system')}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {cw.unit && (() => {
                                    const code = CW_UNIT_MAP[cw.unit];
                                    const uo = code && (DB.UNITS||[]).find(u => u.code === code);
                                    return (
                                      <div style={{fontSize:11,marginBottom:8,padding:'4px 10px',background:'var(--bg4)',borderRadius:6,display:'flex',alignItems:'center',gap:6}}>
                                        <span style={{color:'var(--txt3)'}}>{L('หน่วย CW','CW Unit')}:</span>
                                        <span style={{fontWeight:600}}>{cw.unit}</span>
                                        {uo ? (
                                          <>
                                            <span style={{color:'var(--txt4)'}}>→</span>
                                            <span style={{background:'var(--acc2)',color:'#fff',fontSize:9,padding:'1px 7px',borderRadius:10,fontWeight:700}}>{uo.code}</span>
                                            <span style={{color:'var(--ok)',fontSize:10}}>{lang==='th'?uo.th:uo.en}</span>
                                          </>
                                        ) : (
                                          <span style={{color:'var(--txt4)',fontSize:10}}>{L('(ยังไม่ match)','(unmapped)')}</span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  <div style={{ display:'flex', gap:8 }}>
                                    {brs.map(b => (
                                      <div key={b.id} style={{ background:'var(--bg4)', borderRadius:8, padding:'6px 10px', minWidth:76 }}>
                                        <div style={{ fontSize:10, fontWeight:700, color:'var(--acc2)', marginBottom:4 }}>{b.id}</div>
                                        <div style={{ fontSize:11, marginBottom:2 }}>
                                          {L('คงเหลือ','Stock')}{' '}
                                          <b style={{ color:b.stock>10?'var(--ok)':b.stock>0?'var(--warn)':'var(--err)' }}>{b.stock}</b>
                                        </div>
                                        {b.cost>0 && <div style={{ fontSize:11, color:'var(--txt3)' }}>{L('ต้นทุน','Cost')} <b>{UTILS.fmt(b.cost)} ฿</b></div>}
                                        {b.sell>0 && <div style={{ fontSize:11, color:'var(--txt3)' }}>{L('ราคาขาย','Sell')} <b>{UTILS.fmt(b.sell)} ฿</b></div>}
                                        {b.sell>0 && b.cost>0 && <div style={{ fontSize:10, color:'var(--ok)' }}>{L('กำไร','Profit')} <b>{UTILS.fmt(b.sell-b.cost)} ฿</b></div>}
                                      </div>
                                    ))}
                                  </div>
                                  <CwPriceChart history={cwHistory[d.code]} lang={lang} />
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
          <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} lang={lang} />
        </div>
      </div>

      </> }

      {/* ADD / EDIT MODAL */}
      {showAdd && !editDrug && (
        <QuickDrugForm lang={lang} L={L} drugs={drugs} onReuseCode={handleReuseCode}
          onSave={saveQuickDrug} onClose={() => { setShowAdd(false); setEditDrug(null); }} />
      )}
      {editDrug && (
        <DrugForm drug={editDrug} lang={lang} L={L} suppliers={suppliers} drugs={drugs} onReuseCode={handleReuseCode}
          cwName={(cwStock[editDrug.code]||{}).name||''}
          cwData={cwStock[editDrug.code]||{}}
          onSave={saveDrug} onClose={() => { setShowAdd(false); setEditDrug(null); }} />
      )}
    </div>
  );
}

Object.assign(window, { DrugsPage });
