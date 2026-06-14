// Suppliers.jsx — Supplier Management
const { useState, useMemo } = React;

function SuppliersPage({ lang, L, suppliers, setSuppliers, drugs, orders, notify, setShowCreate, perm = { canWrite: true } }) {
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
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--txt)', marginBottom: 2 }} className="ellipsis">{lang==='th'?sup.name:sup.nameEN}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }} className="ellipsis">{lang==='th'?sup.nameEN:sup.name}</div>
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
                <div>
                  <div style={{ fontSize: 10, color: 'var(--txt4)', marginBottom: 4, fontWeight: 600 }}>🎁 {L('โปรโมชั่น', 'Promotions')}</div>
                  {sup.promotions.map(p => (
                    <div key={p.id} style={{ fontSize: 11, color: 'var(--ok)', background: 'var(--ok-bg)', borderRadius: 4, padding: '3px 8px', marginBottom: 3 }}>
                      {p.name} · {L('ถึง', 'until')} {UTILS.fmtDate(p.validUntil, lang)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewSup && <SupplierDetail sup={viewSup} lang={lang} L={L} drugs={drugs} orders={orders} onClose={() => setViewSup(null)} onEdit={() => { setEditSup(viewSup); setViewSup(null); }} />}
      {(showAdd || editSup) && <SupplierForm sup={editSup} lang={lang} L={L} onSave={saveSup} onClose={() => { setShowAdd(false); setEditSup(null); }} />}
    </div>
  );
}

function SupplierDetail({ sup, lang, L, drugs, orders, onClose, onEdit }) {
  const supDrugs = drugs.filter(d => sup.drugs?.includes(d.code));
  const supOrders = orders.filter(o => o.supplierId === sup.id).sort((a, b) => new Date(b.poDate) - new Date(a.poDate));
  return (
    <Modal title={lang==='th'?sup.name:sup.nameEN} onClose={onClose} size={800}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{L('ปิด', 'Close')}</button><button className="btn btn-outline" onClick={onEdit}>✏ {L('แก้ไข', 'Edit')}</button></>}>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>{L('ข้อมูลทั่วไป', 'General Info')}</div>
          {[['Tax ID', sup.taxId], [L('ที่อยู่', 'Address'), sup.address], [L('ผู้ติดต่อ', 'Contact'), sup.contact], [L('โทร', 'Phone'), sup.phone], ['Email', sup.email], [L('เครดิต', 'Credit Term'), `${sup.creditTerm} ${lang==='th'?'วัน':'days'}`], [L('ระยะส่ง', 'Delivery'), `${sup.deliveryDays} ${lang==='th'?'วัน':'days'}`], [L('สั่งขั้นต่ำ', 'Min Order'), `฿${UTILS.fmt(sup.minOrder, 0)}`]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12 }}>
              <span style={{ color: 'var(--txt3)', minWidth: 80, flexShrink: 0 }}>{k}:</span>
              <span style={{ color: 'var(--txt)' }}>{v}</span>
            </div>
          ))}
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
      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>📦 {L('รายการสินค้า', 'Products')} ({supDrugs.length})</div>
      <div className="tbl-wrap" style={{ maxHeight: 200, marginBottom: 16 }}>
        <table>
          <thead><tr><th>{L('รหัส', 'Code')}</th><th>{L('ชื่อ', 'Name')}</th><th>{L('หน่วย', 'Unit')}</th><th className="tbl-num">{L('ต้นทุน', 'Cost')}</th><th className="tbl-num">{L('ราคาขาย', 'Sell')}</th></tr></thead>
          <tbody>{supDrugs.slice(0, 30).map(d => (
            <tr key={d.code}>
              <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{d.code}</td>
              <td style={{ fontSize: 12 }}>{lang === 'th' ? d.nameTH : d.nameEN}</td>
              <td style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getUnit(d.unit, lang)}</td>
              <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(d.costEx)} ฿</td>
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

function SupplierForm({ sup, lang, L, onSave, onClose }) {
  const isEdit = !!sup;
  const [form, setForm] = useState(sup || { id: 'SUP' + Date.now(), code: '', name: '', nameEN: '', contact: '', phone: '', email: '', taxId: '', creditTerm: 30, deliveryDays: 3, rating: 4.0, minOrder: 5000, address: '', category: '', promotions: [], drugs: [] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = (k, lbl, type = 'text') => (
    <div className="form-group">
      <label className="label">{lbl}</label>
      <input className="input" type={type} value={form[k] || ''} onChange={e => set(k, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} />
    </div>
  );
  return (
    <Modal title={isEdit ? L('แก้ไขผู้จัดจำหน่าย', 'Edit Supplier') : L('เพิ่มผู้จัดจำหน่าย', 'Add Supplier')} onClose={onClose} size={640}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก', 'Cancel')}</button><button className="btn btn-primary" onClick={() => onSave(form)}>{L('บันทึก', 'Save')}</button></>}>
      <div className="form-row">
        {inp('name', L('ชื่อบริษัท (ไทย)', 'Thai Name'))}
        {inp('nameEN', L('ชื่อบริษัท (อังกฤษ)', 'English Name'))}
      </div>
      <div className="form-row">
        {inp('contact', L('ผู้ติดต่อ', 'Contact Person'))}
        {inp('phone', L('โทรศัพท์', 'Phone'))}
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
    </Modal>
  );
}

Object.assign(window, { SuppliersPage });
