// CreatePO.jsx — Create / Edit Purchase Order Modal
const { useState, useMemo, useEffect, useRef } = React;

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
  // Prevent auto-fill effects from overwriting loaded edit values on first mount
  const didInit = useRef(false);
  useEffect(() => { didInit.current = true; }, []);

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
                          <input className="input input-sm" type="text" value={it.unit} onChange={e => updateItem(it.code, 'unit', e.target.value)} placeholder={L('หน่วย', 'Unit')} style={{ width: '100%' }} />
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
