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
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({ buyQty:'', freeQty:'', discount:'', bonusItems:'', dealNote:'' });
  const [items, setItems] = useState(() => editPO?.items ? editPO.items.map(it => ({ ...it, unitMode: 'select' })) : []);
  const [searchDrug, setSearchDrug] = useState('');
  const [isNonPO, setIsNonPO] = useState(() => !!editPO?.isNonPO);
  const [createdBy, setCreatedBy] = useState(() => editPO?.createdBy || '');
  const [errors, setErrors] = useState({});
  const [priceHist, setPriceHist] = useState({}); // {[code]: {min, avg, count, lastDate, lastPO}}
  const [cwStock, setCwStock] = useState({});
  const [selectedRep, setSelectedRep] = useState(() => {
    if (editPO?.repId) return { id:editPO.repId, name:editPO.repName||'', brand:editPO.repBrand||'', brandEN:editPO.repBrandEN||'', phone:editPO.repPhone||'' };
    return null;
  });
  // Prevent auto-fill effects from overwriting loaded edit values on first mount
  const didInit = useRef(false);
  useEffect(() => { didInit.current = true; }, []);

  // Load CW Pharma stock — cached in IDB via UNI_DB.loadCwStock (6 h TTL)
  useEffect(() => {
    if (!window.UNI_DB || !window.UNI_DB.enabled) return;
    window.UNI_DB.loadCwStock().then(data => {
      if (!data || !data.length) return;
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
      setShowNewDeal(false);
      const firstPromo = (supplier.promotions || [])[0];
      if (firstPromo) {
        setNewDeal({
          buyQty: firstPromo.buyQty ? String(firstPromo.buyQty) : '',
          freeQty: firstPromo.freeQty ? String(firstPromo.freeQty) : '',
          discount: firstPromo.discount ? String(firstPromo.discount) : '',
          bonusItems: firstPromo.bonusItems || '',
          dealNote: firstPromo.dealNote || '',
        });
      } else {
        setNewDeal({ buyQty:'', freeQty:'', discount:'', bonusItems:'', dealNote:'' });
      }
      if ((supplier.reps||[]).length === 1) setSelectedRep(supplier.reps[0]);
      else setSelectedRep(null);
    }
  }, [supplierId]);

  // Auto-suggest best rep when PO items change (rep with most matching drugs wins)
  useEffect(() => {
    const reps = supplier?.reps || [];
    if (reps.length <= 1 || items.length === 0) return;
    const codes = new Set(items.map(i => i.code));
    let best = null, bestCount = -1;
    reps.forEach(r => {
      const cnt = (r.drugs || []).filter(c => codes.has(c)).length;
      if (cnt > bestCount) { bestCount = cnt; best = r; }
    });
    if (best && bestCount > 0) setSelectedRep(best);
  }, [items]);


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
    setPriceHist(prev => ({ ...prev, [code]: null })); // mark loading
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
    if (!val) {
      setDealDiscount(0);
      setNewDeal({ buyQty:'', freeQty:'', discount:'', bonusItems:'', dealNote:'' });
      return;
    }
    const promo = supplier?.promotions.find(p => p.id === val);
    setDealDiscount(promo?.discount || 0);
    if (promo) {
      setNewDeal({
        buyQty: promo.buyQty ? String(promo.buyQty) : '',
        freeQty: promo.freeQty ? String(promo.freeQty) : '',
        discount: promo.discount ? String(promo.discount) : '',
        bonusItems: promo.bonusItems || '',
        dealNote: promo.dealNote || '',
      });
    }
  };

  const saveNewDeal = async () => {
    const buyQty = parseInt(newDeal.buyQty) || 0;
    const freeQty = parseInt(newDeal.freeQty) || 0;
    const discount = parseFloat(newDeal.discount) || 0;
    const bonusItems = (newDeal.bonusItems || '').trim();
    const dealNote = (newDeal.dealNote || '').trim();
    if (!buyQty && !freeQty && !discount && !bonusItems) {
      notify(L('กรุณาใส่ข้อมูลดีลอย่างน้อย 1 ช่อง', 'Please fill in at least one deal field'), 'err');
      return;
    }
    if (!supplier) return;
    const promoId = 'DEAL' + Date.now();
    const promo = { id: promoId, buyQty, freeQty, bonusItems, discount, dealNote };
    const updated = { ...supplier, promotions: [...(supplier.promotions || []), promo] };
    if (setSuppliers) setSuppliers(prev => prev.map(s => s.id === supplier.id ? updated : s));
    try { if (window.UNI_DB?.saveSupplier) await window.UNI_DB.saveSupplier(updated); } catch (e) { console.warn('saveNewDeal:', e); }
    setSelectedDeal(promoId);
    setDealDiscount(discount);
    setShowNewDeal(false);
    setNewDeal({ buyQty:'', freeQty:'', discount:'', bonusItems:'', dealNote:'' });
    notify(L('เพิ่มดีลแล้ว ✓', 'Deal added ✓'), 'success');
  };

  const validate = () => {
    const e = {};
    if (!branch) e.branch = true;
    if (!supplierId) e.supplierId = true;
    if (items.length === 0) e.items = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (status = 'draft') => {
    if (!validate()) { notify(L('กรุณากรอกข้อมูลให้ครบ', 'Please fill in all required fields'), 'err'); return; }
    const promo = supplier?.promotions?.find(p => p.id === selectedDeal);
    const mappedItems = items.map(it => ({ ...it, amount: calcLine(it) }));

    // Build structured deal object from newDeal fields (takes priority over selected promo)
    const nd = {
      buyQty: parseInt(newDeal.buyQty) || 0,
      freeQty: parseInt(newDeal.freeQty) || 0,
      bonusItems: (newDeal.bonusItems || '').trim(),
      discount: parseFloat(newDeal.discount) || 0,
      note: (newDeal.dealNote || '').trim(),
    };
    const hasNewDeal = nd.buyQty || nd.freeQty || nd.discount || nd.bonusItems || nd.note;

    // poDeal: prefer newDeal if filled, else pull from selected promo
    const poDeal = hasNewDeal ? nd : (promo ? {
      buyQty: promo.buyQty || 0, freeQty: promo.freeQty || 0,
      bonusItems: promo.bonusItems || '', discount: promo.discount || 0,
      note: promo.dealNote || '',
    } : null);

    // Build dealNote string (human-readable summary for header)
    const buildDealNote = (d, fallback) => {
      if (!d) return fallback || '-';
      const parts = [];
      if (d.buyQty > 0) parts.push(`ซื้อ ${d.buyQty} แถม ${d.freeQty || 0}`);
      if (d.discount > 0) parts.push(`ส่วนลด ${d.discount}%`);
      if (d.bonusItems) parts.push(d.bonusItems);
      if (d.note) parts.push(d.note);
      return parts.join(' · ') || fallback || '-';
    };
    const dealNoteStr = poDeal
      ? buildDealNote(poDeal, dealDiscount > 0 ? `ส่วนลด ${dealDiscount}%` : (editPO?.dealNote || '-'))
      : (dealDiscount > 0 ? `ส่วนลด ${dealDiscount}%` : (editPO?.dealNote || '-'));

    // Auto-save deal to supplier when submitting (no need to click "บันทึกดีลนี้ให้ Supplier" separately)
    if (hasNewDeal && supplier) {
      const promoId = 'DEAL' + Date.now();
      const newPromo = { id: promoId, buyQty: nd.buyQty, freeQty: nd.freeQty, bonusItems: nd.bonusItems, discount: nd.discount, dealNote: nd.note };
      const updated = { ...supplier, promotions: [...(supplier.promotions || []), newPromo] };
      if (setSuppliers) setSuppliers(prev => prev.map(s => s.id === supplier.id ? updated : s));
      try { if (window.UNI_DB?.saveSupplier) await window.UNI_DB.saveSupplier(updated); } catch (e) { console.warn('auto-save deal:', e); }
    }

    if (editPO) {
      const updatedPO = {
        ...editPO,
        branch, supplierId, poDate, deliveryDate,
        creditTerm: parseInt(creditTerm),
        deliveryBranch, location, memo, isNonPO,
        dealNote: dealNoteStr,
        poDeal,
        repId: selectedRep?.id || '',
        repName: selectedRep?.name || '',
        repBrand: selectedRep?.brand || '',
        repBrandEN: selectedRep?.brandEN || '',
        repPhone: selectedRep?.phone || '',
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
      dealNote: dealNoteStr,
      poDeal,
      repId: selectedRep?.id || '',
      repName: selectedRep?.name || '',
      repBrand: selectedRep?.brand || '',
      repBrandEN: selectedRep?.brandEN || '',
      repPhone: selectedRep?.phone || '',
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
              {supplier && (supplier.reps||[]).length > 0 && (
                <div style={{ marginTop:10 }}>
                  <label className="label">👥 {L('ผู้แทน / Brand','Sales Rep / Brand')}</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:6 }}>
                    {(supplier.reps||[]).map(r => {
                      const itemCodes = new Set(items.map(i=>i.code));
                      const matchCount = (r.drugs||[]).filter(c=>itemCodes.has(c)).length;
                      const isSelected = selectedRep?.id===r.id;
                      return (
                        <div key={r.id}
                          onClick={() => setSelectedRep(isSelected ? null : r)}
                          style={{ padding:'8px 12px', border:`1px solid ${isSelected?'var(--acc2)':'var(--bdr)'}`, borderRadius:8, cursor:'pointer', background:isSelected?'var(--acc-bg)':'var(--card2)', position:'relative' }}>
                          <div style={{ fontWeight:700, fontSize:11, color:isSelected?'var(--acc2)':'var(--ok)' }}>{lang==='en'?(r.brandEN||r.brand):r.brand}</div>
                          <div style={{ fontSize:12, color:isSelected?'var(--txt)':'var(--txt)' }}>{r.name}</div>
                          {r.phone && <div style={{ fontSize:10, color:'var(--txt4)' }}>{r.phone}</div>}
                          {matchCount > 0 && (
                            <div style={{ fontSize:10, color:'var(--ok)', marginTop:2 }}>
                              ✓ {L('ดูแล','Manages')} {matchCount} {L('รายการในใบสั่งนี้','items in this PO')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedRep && (
                    <div style={{ fontSize:11, color:'var(--ok)' }}>
                      ✓ {selectedRep.name} · {lang==='en'?(selectedRep.brandEN||selectedRep.brand):selectedRep.brand}{selectedRep.phone?' · '+selectedRep.phone:''}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">{L('เงื่อนไขชำระเงิน (วัน)', 'Credit Term (days)')}</label>
              <input className="input" type="number" value={creditTerm} onChange={e => setCreditTerm(e.target.value)} />
            </div>
          </div>

          {/* Deal / Promotion — dropdown selector */}
          {supplier && (
            <div className="form-group">
              <label className="label">🎁 {L('ดีล/โปรโมชั่น', 'Deal/Promotion')}</label>
              <select className="input" value={selectedDeal} onChange={e => handleDealChange(e.target.value)}>
                <option value="">{L('ไม่มีโปรโมชั่น', 'No promotion')}</option>
                {(supplier.promotions || []).map(p => {
                  const label = p.buyQty > 0
                    ? `ซื้อ ${p.buyQty} แถม ${p.freeQty||0}${p.discount>0?` ลด${p.discount}%`:''}`
                    : (p.name || `ส่วนลด ${p.discount||0}%`);
                  return <option key={p.id} value={p.id}>{label}</option>;
                })}
              </select>
              {dealDiscount > 0 && (
                <div style={{ fontSize:12, color:'var(--ok)', marginTop:4 }}>
                  ✓ {L('ส่วนลด','Discount')} {dealDiscount}% {L('จะถูกคำนวณในยอดรวม','applied to total')}
                </div>
              )}
              <button type="button" className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12, marginTop:8 }}
                onClick={() => setShowNewDeal(s => !s)}>
                {showNewDeal ? '▲' : '+'} {L('เพิ่มดีลใหม่', 'Add New Deal')}
              </button>
              {showNewDeal && (
                <div style={{ marginTop:8, padding:12, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:8 }}>
                    <div className="form-group" style={{ flex:1, margin:0 }}>
                      <label className="label" style={{ fontSize:11 }}>{L('ซื้อ (ชิ้น)','Buy (pcs)')}</label>
                      <input className="input" type="number" min="0" value={newDeal.buyQty}
                        onChange={e => setNewDeal(d => ({...d, buyQty:e.target.value}))} placeholder="0" />
                    </div>
                    <div className="form-group" style={{ flex:1, margin:0 }}>
                      <label className="label" style={{ fontSize:11 }}>{L('แถม (ชิ้น)','Free (pcs)')}</label>
                      <input className="input" type="number" min="0" value={newDeal.freeQty}
                        onChange={e => setNewDeal(d => ({...d, freeQty:e.target.value}))} placeholder="0" />
                    </div>
                    <div className="form-group" style={{ flex:2, margin:0 }}>
                      <label className="label" style={{ fontSize:11 }}>{L('รายการขอแถม','Bonus Items')}</label>
                      <input className="input" value={newDeal.bonusItems}
                        onChange={e => setNewDeal(d => ({...d, bonusItems:e.target.value}))}
                        placeholder={L('เช่น ถุงมือ, กล่อง, อุปกรณ์…','e.g. gloves...')} />
                    </div>
                    <div className="form-group" style={{ flex:1, margin:0 }}>
                      <label className="label" style={{ fontSize:11 }}>Special Discount %</label>
                      <input className="input" type="number" min="0" max="100" value={newDeal.discount}
                        onChange={e => setNewDeal(d => ({...d, discount:e.target.value}))} placeholder="0" />
                    </div>
                    <button type="button" className="btn btn-ghost" style={{ padding:'8px 10px', color:'var(--err)', flexShrink:0 }}
                      onClick={() => { setShowNewDeal(false); setNewDeal({buyQty:'',freeQty:'',discount:'',bonusItems:'',dealNote:''}); }}>🗑</button>
                  </div>
                  <div className="form-group" style={{ margin:'0 0 8px' }}>
                    <label className="label" style={{ fontSize:11 }}>{L('หมายเหตุดีล','Deal Note')}</label>
                    <input className="input" value={newDeal.dealNote}
                      onChange={e => setNewDeal(d => ({...d, dealNote:e.target.value}))}
                      placeholder={L('เช่น แจ้ง Rep ก่อนสั่ง, ออนไลน์เท่านั้น…','e.g. inform Rep first…')} />
                  </div>
                  <button type="button" className="btn btn-primary" style={{ padding:'8px 16px', fontSize:12 }}
                    onClick={saveNewDeal}>
                    💾 {L('บันทึกดีล','Save Deal')}
                  </button>
                  <span style={{ fontSize:11, color:'var(--txt4)', marginLeft:10 }}>
                    {L('บันทึกแล้วจะอยู่กับ Supplier นี้ทุกครั้ง','Saved to this supplier permanently')}
                  </span>
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
                          const stockMap = { PTN:'stock_00', RAM:'stock_01', CNX:'stock_02' };
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

          {/* Summary + Deal reminder (side by side) */}
          {items.length > 0 && (
            <div style={{ display:'flex', gap:20, marginBottom:16, alignItems:'flex-start' }}>
              {/* Left: Deal reminder */}
              {supplier && (
                <div style={{ flex:1, minWidth:0, padding:14, background:'var(--card2)', border:'1px solid var(--border)', borderRadius:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--ok)', marginBottom:4 }}>
                    🎁 {L('ดีลแต่ละผู้จัดจำหน่าย','Deal per Supplier')}
                    <span style={{ fontWeight:400, fontSize:11, color:'var(--txt4)', marginLeft:4 }}>
                      ({L('แสดงเป็น reminder ตอนสั่งซื้อ','shown as reminder when ordering')})
                    </span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--warn)', marginBottom:10 }}>
                    ⭐ {lang==='th'?supplier.name:(supplier.nameEN||supplier.name)} {L('(ผู้จัดจำหน่ายหลัก)','(main supplier)')}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr', gap:6, marginBottom:6 }}>
                    <div className="form-group" style={{ margin:0 }}>
                      <label className="label" style={{ fontSize:10 }}>{L('ซื้อ (ชิ้น)','Buy (pcs)')}</label>
                      <input className="input input-sm" type="number" min="0" value={newDeal.buyQty}
                        onChange={e => setNewDeal(d => ({...d, buyQty:e.target.value}))} placeholder="0" />
                    </div>
                    <div className="form-group" style={{ margin:0 }}>
                      <label className="label" style={{ fontSize:10 }}>{L('แถม (ชิ้น)','Free (pcs)')}</label>
                      <input className="input input-sm" type="number" min="0" value={newDeal.freeQty}
                        onChange={e => setNewDeal(d => ({...d, freeQty:e.target.value}))} placeholder="0" />
                    </div>
                    <div className="form-group" style={{ margin:0 }}>
                      <label className="label" style={{ fontSize:10 }}>{L('รายการขอแถม','Bonus Items')}</label>
                      <input className="input input-sm" value={newDeal.bonusItems}
                        onChange={e => setNewDeal(d => ({...d, bonusItems:e.target.value}))}
                        placeholder={L('เช่น ถุงมือ, กล่อง, อุปกรณ์…','e.g. gloves, boxes…')} />
                    </div>
                    <div className="form-group" style={{ margin:0 }}>
                      <label className="label" style={{ fontSize:10 }}>Special Discount %</label>
                      <input className="input input-sm" type="number" min="0" max="100" value={newDeal.discount}
                        onChange={e => setNewDeal(d => ({...d, discount:e.target.value}))} placeholder="0" />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin:'0 0 8px' }}>
                    <label className="label" style={{ fontSize:10 }}>{L('หมายเหตุ / Note','Note')}</label>
                    <input className="input input-sm" value={newDeal.dealNote}
                      onChange={e => setNewDeal(d => ({...d, dealNote:e.target.value}))}
                      placeholder={L('เช่น โทรขอก่อนสั่ง, เฉพาะออนไลน์, ต้องสั่งขั้นต่ำ…','e.g. call first, online only…')} />
                  </div>
                  <button type="button" className="btn btn-ghost" style={{ fontSize:11, padding:'4px 10px' }}
                    onClick={saveNewDeal}>
                    💾 {L('บันทึกดีลนี้ให้ Supplier','Save deal to Supplier')}
                  </button>
                </div>
              )}

              {/* Right: Summary */}
              <div style={{ minWidth:300 }}>
                <div className="card-sm" style={{ padding:16 }}>
                  {[
                    [L('ยอดรวมก่อนส่วนลด (Gross)', 'Gross Total'), UTILS.fmt(summary.gross)],
                    dealDiscount > 0 ? [L(`ส่วนลดดีล ${dealDiscount}%`, `Deal Discount ${dealDiscount}%`), `- ${UTILS.fmt(summary.discount)}`, 'var(--ok)'] : null,
                    [L('รายการไม่มี VAT', 'Non-Taxable'), UTILS.fmt(summary.nonTaxable)],
                    [L('รายการมี VAT', 'Taxable Amount'), UTILS.fmt(summary.taxable)],
                    [L('ภาษีมูลค่าเพิ่ม 7%', 'VAT 7%'), UTILS.fmt(summary.vat)],
                  ].filter(Boolean).map(([lbl, val, color]) => (
                    <div key={lbl} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                      <span style={{ color:'var(--txt3)' }}>{lbl}</span>
                      <span style={{ fontWeight:600, color: color || 'var(--txt)' }}>฿{val}</span>
                    </div>
                  ))}
                  <div className="divider" />
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800 }}>
                    <span style={{ color:'var(--acc2)' }}>{L('ยอดสุทธิ', 'Grand Total')}</span>
                    <span style={{ color:'var(--acc2)' }}>฿{UTILS.fmt(summary.grandTotal)}</span>
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
