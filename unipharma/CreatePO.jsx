// CreatePO.jsx — Create Purchase Order Modal
const { useState, useMemo, useEffect } = React;

function CreatePOModal({ lang, L, drugs, suppliers, orders, onClose, onCreated, notify }) {
  const today = new Date().toISOString().split('T')[0];
  const [branch, setBranch] = useState('PTN');
  const [supplierId, setSupplierId] = useState('SUP001');
  const [poDate, setPoDate] = useState(today);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [creditTerm, setCreditTerm] = useState(30);
  const [deliveryBranch, setDeliveryBranch] = useState('PTN');
  const [location, setLocation] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedDeal, setSelectedDeal] = useState('');
  const [dealDiscount, setDealDiscount] = useState(0);
  const [items, setItems] = useState([]);
  const [searchDrug, setSearchDrug] = useState('');
  const [isNonPO, setIsNonPO] = useState(false);
  const [createdBy, setCreatedBy] = useState('');
  const [errors, setErrors] = useState({});

  const supplier = useMemo(() => suppliers.find(s => s.id === supplierId), [suppliers, supplierId]);

  // Auto-set credit term from supplier
  useEffect(() => {
    if (supplier) {
      setCreditTerm(supplier.creditTerm);
      setSelectedDeal('');
      setDealDiscount(0);
    }
  }, [supplier]);

  // Branch address in the current language (editable once filled).
  const branchAddr = (id) => {
    const b = DB.BRANCHES.find(x => x.id === id) || {};
    return lang === 'th' ? (b.address || '') : (b.addressEN || b.address || '');
  };

  // Delivery address defaults to the ordering branch; refilled when it changes.
  useEffect(() => {
    setDeliveryBranch(branch);
    setLocation(branchAddr(branch));
  }, [branch, lang]);

  // Auto-set delivery date
  useEffect(() => {
    if (poDate && supplier) {
      const d = new Date(poDate);
      d.setDate(d.getDate() + supplier.deliveryDays);
      setDeliveryDate(d.toISOString().split('T')[0]);
    }
  }, [poDate, supplier]);

  // Drug search results filtered by supplier's drugs list
  const supplierDrugs = useMemo(() => {
    if (!supplier) return [];
    return drugs.filter(d => supplier.drugs.includes(d.code));
  }, [supplier, drugs]);

  const filteredDrugs = useMemo(() => {
    if (!searchDrug) return supplierDrugs.slice(0, 20);
    const q = searchDrug.toLowerCase();
    return supplierDrugs.filter(d => d.code.toLowerCase().includes(q) || d.nameTH.includes(q) || d.nameEN.toLowerCase().includes(q)).slice(0, 20);
  }, [supplierDrugs, searchDrug]);

  const units = ['เม็ด', 'แคปซูล', 'ซอฟเจล', 'ขวด (ml)', 'ขวด (pcs)', 'แผง', 'ชุด', 'กระป๋อง'];

  const addItem = drug => {
    setItems(prev => {
      const exists = prev.find(i => i.code === drug.code);
      if (exists) return prev.map(i => i.code === drug.code ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { code: drug.code, nameTH: drug.nameTH, nameEN: drug.nameEN, unit: drug.unit, unitMode: 'select', qty: 1, unitPrice: drug.costEx, vatRate: drug.vatRate, discount: 0 }];
    });
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
    const poNumber = UTILS.generatePONumber(branch, poDate);
    const promo = supplier?.promotions.find(p => p.id === selectedDeal);
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
      items: items.map(it => ({ ...it, amount: calcLine(it) })),
      grossTotal: summary.gross,
      discount: summary.discount,
      taxableAmt: summary.taxable,
      nonTaxableAmt: summary.nonTaxable,
      vat: summary.vat,
      grandTotal: summary.grandTotal,
      createdBy: createdBy || L('ผู้ใช้งาน', 'User'),
      approvedBy: status === 'approved' ? L('ผู้จัดการจัดซื้อ', 'Purchasing Manager') : '-'
    };
    onCreated(newPO, items);
  };

  const branchInfo = DB.BRANCHES.find(b => b.id === branch);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 900, width: '95vw' }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">+ {L('สร้างใบสั่งซื้อ', 'Create Purchase Order')}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
              {L('รูปแบบ:', 'Format:')} PO{branchInfo?.code}-{poDate?.replace(/-/g,'').slice(2)}-XXX
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
              <select className={`input${errors.supplierId ? ' border-red' : ''}`} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
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

          {/* Deal / Promotion */}
          {supplier?.promotions?.length > 0 && (
            <div className="form-group">
              <label className="label">🎁 {L('เลือกดีล/โปรโมชั่น', 'Select Deal/Promotion')}</label>
              <select className="input" value={selectedDeal} onChange={e => handleDealChange(e.target.value)}>
                <option value="">{L('ไม่มีโปรโมชั่น', 'No promotion')}</option>
                {supplier.promotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {dealDiscount > 0 && (
                <div style={{ fontSize: 12, color: 'var(--ok)', marginTop: 4 }}>
                  ✓ {L('ส่วนลด', 'Discount')} {dealDiscount}% {L('จะถูกคำนวณในยอดรวม', 'applied to total')}
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
                        <span style={{ marginLeft: 8, fontSize: 13 }}>{lang === 'th' ? d.nameTH : d.nameEN}</span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--txt3)' }}>
                        <div>ต้นทุน ฿{UTILS.fmt(d.costEx)}</div>
                        <div>สต็อก {d.stock[branch] || 0}</div>
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
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === 'th' ? it.nameTH : it.nameEN}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{it.code}</div>
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
                          <input className="input input-sm" type="text" value={it.unit} onChange={e => updateItem(it.code, 'unit', e.target.value)} placeholder="หน่วย" style={{ width: '100%' }} />
                        )}
                      </td>
                      <td>
                        <input className="input input-sm" type="number" min="1" value={it.qty} style={{ width: 70, textAlign: 'right' }} onChange={e => updateItem(it.code, 'qty', e.target.value)} />
                      </td>
                      <td>
                        <input className="input input-sm" type="number" step="0.01" value={it.unitPrice} style={{ width: 90, textAlign: 'right' }} onChange={e => updateItem(it.code, 'unitPrice', e.target.value)} />
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
          <button className="btn btn-outline" onClick={() => handleSubmit('draft')}>💾 {L('บันทึกร่าง', 'Save Draft')}</button>
          <button className="btn btn-primary" onClick={() => handleSubmit('pending')}>📤 {L('ส่งอนุมัติ', 'Submit for Approval')}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CreatePOModal });
