// Suppliers.jsx — Supplier Management
const { useState, useMemo, useRef, useEffect } = React;

function SuppliersPage({ lang, L, suppliers, setSuppliers, drugs, setDrugs, orders, notify, setShowCreate, perm = { canWrite: true } }) {
  const [search, setSearch] = useState('');
  const [editSup, setEditSup] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [viewSup, setViewSup] = useState(null);

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(s => s.name.toLowerCase().includes(q) || s.nameEN.toLowerCase().includes(q) || (s.contact||'').toLowerCase().includes(q) || (s.contacts||[]).some(c=>(c.name||'').toLowerCase().includes(q)||(c.phone||'').toLowerCase().includes(q)));
  }, [suppliers, search]);

  const exportSuppliers = () => {
    if (!window.XLSX) { notify(L('กำลังโหลด SheetJS กรุณารอสักครู่', 'Loading SheetJS, please wait'), 'warn'); return; }
    const rows = filtered.map(s => {
      const stats = getSupStats(s);
      return {
        [L('รหัส', 'ID')]: s.id || '',
        [L('ชื่อบริษัท (ไทย)', 'Name (TH)')]: s.name || '',
        [L('ชื่อบริษัท (อังกฤษ)', 'Name (EN)')]: s.nameEN || '',
        [L('ผู้ติดต่อ', 'Contact')]: s.contact || '',
        [L('เบอร์โทร', 'Phone')]: s.phone || '',
        [L('อีเมล', 'Email')]: s.email || '',
        [L('เลขผู้เสียภาษี', 'Tax ID')]: s.taxId || '',
        [L('เครดิต (วัน)', 'Credit (days)')]: s.creditTerm || 0,
        [L('ระยะส่ง (วัน)', 'Delivery (days)')]: s.deliveryDays || 0,
        [L('คะแนน', 'Rating')]: s.rating || '',
        [L('ประเภท', 'Category')]: s.category || '',
        [L('จำนวน PO', 'Order Count')]: stats.orderCount,
        [L('ยอดซื้อรวม (฿)', 'Total Spend (฿)')]: stats.totalSpend,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch:12},{wch:35},{wch:35},{wch:20},{wch:14},{wch:28},{wch:16},{wch:14},{wch:14},{wch:8},{wch:20},{wch:12},{wch:18}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, L('ผู้จัดจำหน่าย', 'Suppliers'));
    XLSX.writeFile(wb, `suppliers_${new Date().toISOString().slice(0,10)}.xlsx`);
    notify(L(`Export ${filtered.length} รายการ ✓`, `Exported ${filtered.length} items ✓`), 'ok');
  };

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

  const showForm = showAdd || !!editSup;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('ผู้จัดจำหน่าย', 'Suppliers')}</div>
          {!showForm && <div className="page-subtitle">{filtered.length} {L('ราย', 'suppliers')}</div>}
        </div>
        {!showForm && <div style={{ display: 'flex', gap: 8 }}>
          {perm.canWrite && <button className="btn btn-ghost" onClick={exportSuppliers}>📥 {L('Export Excel', 'Export Excel')}</button>}
          {perm.canWrite && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ {L('เพิ่มผู้จัดจำหน่าย', 'Add Supplier')}</button>}
        </div>}
      </div>

      {showForm ? (
        <div style={{ maxWidth:740, width:'100%', alignSelf:'center', margin:'0 auto' }}>
        <SupplierForm sup={editSup} lang={lang} L={L} drugs={drugs} onSave={saveSup} onClose={() => { setShowAdd(false); setEditSup(null); }} />
        </div>
      ) : (<>
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
                      {lang==='th'?`ซื้อ ${p.buyQty||0} แถม ${p.freeQty||0}`:
                       `Buy ${p.buyQty||0} → Free ${p.freeQty||0}`}
                      {p.discount>0 && ` · ${p.discount}%`}
                      {p.dealNote && ` (${p.dealNote})`}
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
      </>)}
    </div>
  );
}

function SupplierDetail({ sup, lang, L, drugs, setDrugs, orders, onClose, onEdit }) {
  const [dealEdit, setDealEdit] = useState(null);
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
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>🎁 {L('ดีล / โปรโมชั่น', 'Deals / Promotions')}</div>
          {sup.promotions?.map(p => (
            <div key={p.id} className="card-sm" style={{ marginBottom: 8, borderColor: 'rgba(52,211,153,.3)' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ok)', marginBottom: 4 }}>
                {lang==='th'?`ซื้อ ${p.buyQty||0} → แถม ${p.freeQty||0}`:
                 `Buy ${p.buyQty||0} → Free ${p.freeQty||0}`}
                {p.discount>0 && <span style={{ marginLeft:8, fontWeight:400 }}>💲 {p.discount}%</span>}
              </div>
              {p.bonusItems && <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:2 }}>🎁 {p.bonusItems}</div>}
              {p.dealNote && <div style={{ fontSize:11, color:'var(--txt4)', fontStyle:'italic' }}>📝 {p.dealNote}</div>}
            </div>
          ))}
          {(!sup.promotions || sup.promotions.length === 0) && <div style={{ fontSize: 12, color: 'var(--txt4)' }}>{L('ยังไม่มีดีล', 'No deals yet')}</div>}
        </div>
      </div>

      {sup.reps?.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:12, color:'var(--txt3)', marginBottom:8 }}>👥 {L('ผู้แทน / Brand','Sales Reps')}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {sup.reps.map(r => (
              <div key={r.id} style={{ background:'var(--card2)', border:'1px solid var(--bdr)', borderRadius:8, padding:'8px 12px', minWidth:140 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'var(--acc2)' }}>{lang==='en'?(r.brandEN||r.brand):r.brand}</div>
                <div style={{ fontSize:13, color:'var(--txt)', marginTop:2 }}>{r.name}</div>
                {r.phone && <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>📞 {r.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

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
              <td className="tbl-num" style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>{UTILS.fmt(d.hasVat ? d.sellInc : d.sellEx)} ฿</div>
                {d.hasVat && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ไม่รวม VAT {UTILS.fmt(d.sellEx)} ฿</div>}
              </td>
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
  const [drugCode, setDrugCode] = useState(initialDrugCode || '');
  const [query, setQuery] = useState('');
  const [showList, setShowList] = useState(!initialDrugCode);
  const [form, setForm] = useState(initialDeal || { buyQty:'', freeQty:'', freeItems:'', specialDiscount:'', note:'' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const filteredDrugs = useMemo(() => {
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
    if (!sup) return { id:'SUP'+Date.now(), code:'', name:'', nameEN:'', contact:'', phone:'', email:'', taxId:'', creditTerm:30, deliveryDays:3, rating:4.0, minOrder:5000, address:'', addressEN:'', promotions:[], drugs:[], drugPrices:{}, contacts:[{name:'',phone:''}], returnPolicy:'', returnPolicyEN:'', reps:[] };
    const existingContacts = (sup.contacts||[]).filter(c=>c.name||c.phone);
    const migrateRepDrugs = ds => (ds||[]).map(d => typeof d === 'string' ? {code:d, buyQty:0, freeQty:0, discount:0, note:'', returnPolicy:'', returnPolicyEN:''} : {...d, returnPolicyEN: d.returnPolicyEN||''});
    return { ...sup, addressEN: sup.addressEN||'', contacts: existingContacts.length ? existingContacts : (sup.contact ? [{name:sup.contact,phone:sup.phone||''}] : [{name:'',phone:''}]), returnPolicy: sup.returnPolicy||'', returnPolicyEN: sup.returnPolicyEN||'', reps: (sup.reps||[]).map(r=>({...r, drugs:migrateRepDrugs(r.drugs)})) };
  });
  const [drugSearch, setDrugSearch] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setContact = (i, k, v) => setForm(f => {
    const contacts = [...(f.contacts||[{name:'',phone:''}])];
    contacts[i] = { ...contacts[i], [k]: v };
    return { ...f, contacts, contact: contacts[0]?.name||'', phone: contacts[0]?.phone||'' };
  });
  const addContact = () => setForm(f => ({...f, contacts: [...(f.contacts||[{name:'',phone:''}]), {name:'',phone:''}]}));
  const removeContact = (i) => setForm(f => {
    const contacts = (f.contacts||[]).filter((_,idx)=>idx!==i);
    const kept = contacts.length ? contacts : [{name:'',phone:''}];
    return {...f, contacts:kept, contact:kept[0]?.name||'', phone:kept[0]?.phone||''};
  });
  const promos = form.promotions || [];
  const drugList = form.drugs || [];
  const drugPrices = form.drugPrices || {};
  const addPromo = () => setForm(f => ({ ...f, promotions: [...(f.promotions || []), { id:'P'+Date.now(), buyQty:0, freeQty:0, bonusItems:'', discount:0, dealNote:'' }] }));
  const updatePromo = (id, k, v) => setForm(f => ({ ...f, promotions: (f.promotions || []).map(p => p.id === id ? { ...p, [k]: v } : p) }));
  const removePromo = (id) => setForm(f => ({ ...f, promotions: (f.promotions || []).filter(p => p.id !== id) }));

  const reps = form.reps || [];
  const [repDrugSearches, setRepDrugSearches] = useState({});
  const promoDragSrc = useRef(null);
  const [promoDragOver, setPromoDragOver] = useState(null);
  const repDragSrc = useRef(null);
  const [repDragOver, setRepDragOver] = useState(null);
  const addRep = () => setForm(f => ({ ...f, reps: [...(f.reps||[]), { id:'REP'+Date.now(), name:'', brand:'', brandEN:'', phone:'', drugs:[] }] }));
  const updateRep = (id, k, v) => setForm(f => ({ ...f, reps: (f.reps||[]).map(r => r.id===id ? {...r,[k]:v} : r) }));
  const removeRep = (id) => setForm(f => ({ ...f, reps: (f.reps||[]).filter(r => r.id!==id) }));
  const setRepDrugSearch = (repId, val) => setRepDrugSearches(s => ({...s, [repId]: val}));
  const addRepDrug = (repId, code) => {
    setForm(f => ({...f, reps:(f.reps||[]).map(r => {
      if (r.id !== repId) return r;
      const existing = r.drugs||[];
      if (existing.find(d=>d.code===code)) return r;
      return {...r, drugs:[...existing, {code, buyQty:0, freeQty:0, discount:0, note:'', returnPolicy:'', returnPolicyEN:''}]};
    })}));
    setRepDrugSearch(repId,'');
  };
  const removeRepDrug = (repId, code) => setForm(f => ({...f, reps:(f.reps||[]).map(r => r.id===repId ? {...r, drugs:(r.drugs||[]).filter(d=>d.code!==code)} : r)}));
  const updRepDrug = (repId, code, k, v) => setForm(f => ({...f, reps:(f.reps||[]).map(r => r.id===repId ? {...r, drugs:(r.drugs||[]).map(d=>d.code===code?{...d,[k]:v}:d)} : r)}));

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
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div className="page-title" style={{ fontSize:16 }}>
          {isEdit ? L('แก้ไขผู้จัดจำหน่าย','Edit Supplier') : L('เพิ่มผู้จัดจำหน่าย','Add Supplier')}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก','Cancel')}</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>{L('บันทึก','Save')}</button>
        </div>
      </div>
      <div className="card">
      <div className="form-row">
        {inp('name', L('ชื่อบริษัท (ไทย)', 'Thai Name'))}
        {inp('nameEN', L('ชื่อบริษัท (อังกฤษ)', 'English Name'))}
      </div>
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <label className="label" style={{ margin:0 }}>👤 {L('ผู้ติดต่อ / โทรศัพท์', 'Contact / Phone')}</label>
          <button type="button" className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12 }} onClick={addContact}>
            + {L('เพิ่มผู้ติดต่อ', 'Add Contact')}
          </button>
        </div>
        {(form.contacts||[{name:'',phone:''}]).map((c,i) => (
          <div key={i} className="form-row" style={{ marginBottom:6, alignItems:'center' }}>
            <div className="form-group" style={{ margin:0 }}>
              <input className="input" placeholder={L(`ผู้ติดต่อ ${i+1}`,`Contact ${i+1}`)}
                value={c.name||''} onChange={e=>setContact(i,'name',e.target.value)} />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <input className="input" placeholder={L(`เบอร์โทร ${i+1}`,`Phone ${i+1}`)}
                value={c.phone||''} onChange={e=>setContact(i,'phone',e.target.value)} />
            </div>
            {(form.contacts||[]).length > 1 && (
              <button type="button" className="btn btn-ghost" style={{ padding:'8px 10px', color:'var(--err)', flexShrink:0 }}
                onClick={()=>removeContact(i)}>🗑</button>
            )}
          </div>
        ))}
      </div>
      <div className="form-row">
        {inp('email', 'Email', 'email')}
        {inp('taxId', L('เลขภาษี', 'Tax ID'))}
      </div>
      <div className="form-row">
        {inp('address', L('ที่อยู่ (ไทย)', 'Address (TH)'))}
        {inp('addressEN', L('ที่อยู่ (อังกฤษ)', 'Address (EN)'))}
      </div>
      <div className="form-row-3">
        {inp('creditTerm', L('เครดิต (วัน)', 'Credit Term'), 'number')}
        {inp('deliveryDays', L('ระยะส่ง (วัน)', 'Delivery Days'), 'number')}
        {inp('rating', L('คะแนน', 'Rating'), 'number')}
      </div>
      {inp('minOrder', L('ขั้นต่ำ (บาท)', 'Min Order (THB)'), 'number')}

      <div className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label className="label" style={{ margin: 0 }}>🎁 {L('โปรโมชั่น / ดีล', 'Promotions / Deals')}</label>
        <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={addPromo}>
          + {L('เพิ่มดีล', 'Add Deal')}
        </button>
      </div>
      {promos.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--txt4)', marginBottom: 8 }}>{L('ยังไม่มีดีล — กด + เพิ่มดีล', 'No deals yet — click + Add Deal')}</div>
      )}
      {promos.map((p, idx) => (
        <div key={p.id}
          draggable="true"
          onDragStart={() => { promoDragSrc.current = idx; }}
          onDragOver={e => { e.preventDefault(); setPromoDragOver(idx); }}
          onDrop={e => {
            e.preventDefault();
            const src = promoDragSrc.current;
            promoDragSrc.current = null; setPromoDragOver(null);
            if (src === null || src === idx) return;
            setForm(f => { const a=[...f.promotions]; const [m]=a.splice(src,1); a.splice(idx,0,m); return {...f,promotions:a}; });
          }}
          onDragEnd={() => { promoDragSrc.current = null; setPromoDragOver(null); }}
          style={{ background:'var(--card2)', border:`1px solid ${promoDragOver===idx?'var(--acc2)':'var(--bdr)'}`, borderRadius:8, padding:12, marginBottom:10 }}>
          <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:8 }}>
            <span title={L('ลากเพื่อเรียงลำดับ','Drag to reorder')} style={{ color:'var(--txt4)', fontSize:16, opacity:0.4, cursor:'grab', userSelect:'none', paddingBottom:8, flexShrink:0 }}>⠿</span>
            <div className="form-group" style={{ width:90, margin:0 }}>
              <label className="label" style={{ fontSize:11 }}>{L('ซื้อ (จำนวน)', 'Buy (qty)')}</label>
              <input className="input" type="number" min="0" value={p.buyQty||0} onChange={e => updatePromo(p.id,'buyQty',parseInt(e.target.value)||0)} />
            </div>
            <div className="form-group" style={{ width:90, margin:0 }}>
              <label className="label" style={{ fontSize:11 }}>{L('แถม (จำนวน)', 'Free (qty)')}</label>
              <input className="input" type="number" min="0" value={p.freeQty||0} onChange={e => updatePromo(p.id,'freeQty',parseInt(e.target.value)||0)} />
            </div>
            <div className="form-group" style={{ width:90, margin:0 }}>
              <label className="label" style={{ fontSize:11 }}>{L('ส่วนลดพิเศษ %', 'Special Discount %')}</label>
              <input className="input" type="number" min="0" max="100" value={p.discount||0} onChange={e => updatePromo(p.id,'discount',parseFloat(e.target.value)||0)} />
            </div>
            <button type="button" className="btn btn-ghost" style={{ padding:'8px 10px', color:'var(--err)' }}
              title={L('ลบ','Remove')} onClick={() => removePromo(p.id)}>🗑</button>
          </div>
          <div className="form-group" style={{ margin:'0 0 8px' }}>
            <label className="label" style={{ fontSize:11 }}>{L('สินค้าแถม / ของแถม', 'Bonus Items to Request')}</label>
            <input className="input" value={p.bonusItems||''} onChange={e => updatePromo(p.id,'bonusItems',e.target.value)}
              placeholder={L('เช่น ถุงมือ, กล่อง, อุปกรณ์...', 'e.g. gloves, box, accessories...')} />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="label" style={{ fontSize:11 }}>{L('หมายเหตุดีล', 'Deal Note')}</label>
            <input className="input" value={p.dealNote||''} onChange={e => updatePromo(p.id,'dealNote',e.target.value)}
              placeholder={L('เช่น แจ้ง Rep ก่อนสั่ง, ออนไลน์เท่านั้น...', 'e.g. Call before ordering, online only...')} />
          </div>
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

      {/* ── Reps / Brand section ── */}
      <div className="divider" />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <label className="label" style={{ margin:0 }}>👥 {L('ผู้แทน / Brand','Sales Reps / Brand')}</label>
        <button type="button" className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12 }} onClick={addRep}>
          + {L('เพิ่มผู้แทน','Add Rep')}
        </button>
      </div>
      {reps.length === 0 && (
        <div style={{ fontSize:12, color:'var(--txt4)', marginBottom:8 }}>{L('ยังไม่มีผู้แทน — กด + เพิ่มผู้แทน','No reps yet — click + Add Rep')}</div>
      )}
      {reps.map((r, idx) => {
        const repSearch = repDrugSearches[r.id] || '';
        const repDrugs = r.drugs || [];
        const repSearchResults = repSearch.length > 0
          ? allDrugs.filter(d => !repDrugs.find(x=>x.code===d.code) && (
              d.code.toLowerCase().includes(repSearch.toLowerCase()) ||
              (d.nameTH||'').includes(repSearch) ||
              (d.nameEN||'').toLowerCase().includes(repSearch.toLowerCase())
            )).slice(0, 10)
          : [];
        return (
          <div key={r.id}
            draggable="true"
            onDragStart={() => { repDragSrc.current = idx; }}
            onDragOver={e => { e.preventDefault(); setRepDragOver(idx); }}
            onDrop={e => {
              e.preventDefault();
              const src = repDragSrc.current;
              repDragSrc.current = null; setRepDragOver(null);
              if (src === null || src === idx) return;
              setForm(f => { const a=[...f.reps]; const [m]=a.splice(src,1); a.splice(idx,0,m); return {...f,reps:a}; });
            }}
            onDragEnd={() => { repDragSrc.current = null; setRepDragOver(null); }}
            style={{ marginBottom:10, padding:'10px 12px', background:'var(--card2)', borderRadius:10, border:`1px solid ${repDragOver===idx?'var(--acc2)':'var(--border)'}` }}>
            {/* ── Info row ── */}
            <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:8 }}>
              <span title={L('ลากเพื่อเรียงลำดับ','Drag to reorder')} style={{ color:'var(--txt4)', fontSize:16, opacity:0.4, cursor:'grab', userSelect:'none', paddingBottom:8, flexShrink:0 }}>⠿</span>
              <div className="form-group" style={{ flex:2, margin:0 }}>
                <label className="label" style={{ fontSize:11 }}>{L('Brand (ไทย)','Brand (TH)')}</label>
                <input className="input" value={r.brand||''} onChange={e=>updateRep(r.id,'brand',e.target.value)} placeholder="Sandoz" />
              </div>
              <div className="form-group" style={{ flex:2, margin:0 }}>
                <label className="label" style={{ fontSize:11 }}>Brand (EN)</label>
                <input className="input" value={r.brandEN||''} onChange={e=>updateRep(r.id,'brandEN',e.target.value)} placeholder="Sandoz" />
              </div>
              <div className="form-group" style={{ flex:2, margin:0 }}>
                <label className="label" style={{ fontSize:11 }}>{L('ชื่อผู้แทน','Rep Name')}</label>
                <input className="input" value={r.name||''} onChange={e=>updateRep(r.id,'name',e.target.value)} placeholder={L('เช่น คุณนิ้ง','e.g. Ning')} />
              </div>
              <div className="form-group" style={{ flex:2, margin:0 }}>
                <label className="label" style={{ fontSize:11 }}>{L('เบอร์โทร','Phone')}</label>
                <input className="input" value={r.phone||''} onChange={e=>updateRep(r.id,'phone',e.target.value)} placeholder="08x-xxx-xxxx" />
              </div>
              <button type="button" className="btn btn-ghost" style={{ padding:'8px 10px', color:'var(--err)', flexShrink:0 }}
                title={L('ลบ','Remove')} onClick={()=>removeRep(r.id)}>🗑</button>
            </div>
            {/* ── Drug assignment ── */}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:8 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--txt3)', marginBottom:6 }}>
                📦 {L('สินค้าที่ดูแล','Products Managed')}
                <span style={{ fontWeight:400, marginLeft:6, color:'var(--txt4)' }}>({repDrugs.length} {L('รายการ','items')})</span>
              </div>
              {repDrugs.map(drug => {
                const d = allDrugs.find(x=>x.code===drug.code);
                return (
                  <div key={drug.code} style={{ border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', marginBottom:6, background:'var(--bg1)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                      <span style={{ background:'var(--acc-bg)', color:'var(--acc2)', borderRadius:99, fontSize:11, padding:'2px 8px', fontFamily:'monospace', flexShrink:0 }}>{drug.code}</span>
                      <span style={{ fontSize:11, color:'var(--txt2)', flex:1 }}>{d?.nameTH}</span>
                      <button type="button" onClick={()=>removeRepDrug(r.id,drug.code)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:'0 4px', color:'var(--txt4)', fontSize:14, lineHeight:1 }}>×</button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'70px 70px 70px 1fr', gap:5, marginBottom:5 }}>
                      <div>
                        <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>{L('ซื้อ (ชิ้น)','Buy')}</div>
                        <input className="input" type="number" min="0" value={drug.buyQty||0} style={{ fontSize:11 }}
                          onChange={e=>updRepDrug(r.id,drug.code,'buyQty',parseInt(e.target.value)||0)} />
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>{L('แถม (ชิ้น)','Free')}</div>
                        <input className="input" type="number" min="0" value={drug.freeQty||0} style={{ fontSize:11 }}
                          onChange={e=>updRepDrug(r.id,drug.code,'freeQty',parseInt(e.target.value)||0)} />
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>{L('ส่วนลด %','Disc%')}</div>
                        <input className="input" type="number" min="0" max="100" value={drug.discount||0} style={{ fontSize:11 }}
                          onChange={e=>updRepDrug(r.id,drug.code,'discount',parseFloat(e.target.value)||0)} />
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>{L('หมายเหตุดีล','Deal Note')}</div>
                        <input className="input" value={drug.note||''} style={{ fontSize:11 }}
                          onChange={e=>updRepDrug(r.id,drug.code,'note',e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                      <div>
                        <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>↩ {L('นโยบายการคืน (ไทย)','Return Policy (TH)')}</div>
                        <input className="input" value={drug.returnPolicy||''} style={{ fontSize:11 }}
                          onChange={e=>updRepDrug(r.id,drug.code,'returnPolicy',e.target.value)}
                          placeholder={L('เช่น คืนได้ภายใน 7 วัน...','e.g. return within 7 days...')} />
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>↩ Return Policy (EN)</div>
                        <input className="input" value={drug.returnPolicyEN||''} style={{ fontSize:11 }}
                          onChange={e=>updRepDrug(r.id,drug.code,'returnPolicyEN',e.target.value)}
                          placeholder="e.g. return within 7 days..." />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ position:'relative' }}>
                <input className="input" style={{ fontSize:12 }} value={repSearch}
                  onChange={e=>setRepDrugSearch(r.id,e.target.value)}
                  placeholder={allDrugs.length===0 ? L('ยังไม่มีข้อมูลยาในระบบ','No drug data in system') : L('ค้นหาสินค้าเพื่อเพิ่ม (รหัส / ชื่อ)…','Search drug to add (code / name)…')}
                  disabled={allDrugs.length===0} />
                {repSearch.length > 0 && repSearchResults.length === 0 && allDrugs.length > 0 && (
                  <div style={{ position:'absolute', bottom:'100%', left:0, right:0, marginBottom:2, background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--txt4)', zIndex:40, boxShadow:'0 6px 18px rgba(0,0,0,.2)' }}>
                    {L('ไม่พบสินค้าที่ตรงกัน','No matching drugs found')}
                  </div>
                )}
                {repSearchResults.length > 0 && (
                  <div style={{ position:'absolute', bottom:'100%', left:0, right:0, marginBottom:2, background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:8, maxHeight:180, overflowY:'auto', zIndex:40, boxShadow:'0 6px 18px rgba(0,0,0,.2)' }}>
                    {repSearchResults.map(d => (
                      <div key={d.code} onMouseDown={()=>addRepDrug(r.id,d.code)}
                        style={{ padding:'7px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:12 }}
                        onMouseOver={e=>e.currentTarget.style.background='var(--bg3)'}
                        onMouseOut={e=>e.currentTarget.style.background=''}>
                        <span>
                          <span style={{ fontFamily:'monospace', color:'var(--acc2)', marginRight:8 }}>{d.code}</span>
                          {d.nameTH}
                        </span>
                        <span style={{ color:'var(--txt4)', fontSize:11 }}>{d.nameEN}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

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
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{UTILS.fmt(drug.hasVat ? drug.sellInc : drug.sellEx)} ฿</div>
                      {drug.hasVat && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ไม่รวม VAT {UTILS.fmt(drug.sellEx)} ฿</div>}
                    </td>
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
      </div>{/* end card */}
    </div>
  );
}

Object.assign(window, { SuppliersPage });
