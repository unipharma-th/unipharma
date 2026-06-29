// Drugs.jsx — Drug Database Page
const { useState, useMemo, useCallback } = React;

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
                        <div style={{ fontWeight: 600 }}>{UTILS.fmt(getCost(d, branchFilter))} ฿</div>
                        {branchFilter && d.costByBranch?.[branchFilter] != null && (
                          <div style={{ fontSize: 10, color: 'var(--acc2)' }}>≠ {UTILS.fmt(d.costEx)} ฿</div>
                        )}
                        {d.hasVat && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>+VAT</div>}
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
                                {UTILS.getSupplier(d.supplierId).name}
                              </div>
                              {(d.extraSuppliers || (d.extraSupplierIds||[]).map(id=>({id,costEx:0,sellEx:0}))).filter(s=>s.id).map((sup, i) => (
                                <div key={sup.id} style={{ fontSize: 12, marginTop: 2 }}>
                                  <span style={{ color: 'var(--txt4)', fontSize: 10, marginRight: 4 }}>รายย่อย {i+1}</span>
                                  {UTILS.getSupplier(sup.id).name || sup.id}
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
