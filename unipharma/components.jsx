// components.jsx — Shared UI Components
const { useState, useEffect, useRef, useCallback } = React;

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

/* ── Drug Remarks (non-stock / special conditions) ── */
const DRUG_REMARKS = [
  { code:'on_demand',         th:'สั่งซื้อเมื่อมีคำสั่งซื้อ',   en:'Purchase on Demand',   detailTH:'สั่งซื้อเมื่อมีคำสั่งซื้อจากลูกค้าหรือสาขาเท่านั้น',             detailEN:'Purchased only upon customer or branch request.' },
  { code:'low_demand',        th:'ความต้องการต่ำ',              en:'Low Demand',           detailTH:'ยอดขายหรือการใช้งานต่ำ ไม่คุ้มค่าต่อการเก็บสต็อก',             detailEN:'Low sales or usage; not cost-effective to keep in stock.' },
  { code:'high_value',        th:'ราคาสูง / ต้นทุนสูง',         en:'High-Value Item',      detailTH:'สินค้ามีมูลค่าสูง จึงไม่เก็บสต็อกเพื่อลดต้นทุน',               detailEN:'High inventory value; stocked only when required to reduce carrying cost.' },
  { code:'short_shelf',       th:'อายุสินค้าสั้น',              en:'Short Shelf Life',     detailTH:'มีอายุการใช้งานสั้นหรือมีความเสี่ยงหมดอายุก่อนใช้งาน',        detailEN:'Short shelf life or high risk of expiry before use.' },
  { code:'substitute',        th:'มีสินค้าทดแทน',               en:'Substitute Available', detailTH:'มีสินค้าอื่นที่สามารถใช้ทดแทนได้',                             detailEN:'An alternative stocked item is available.' },
  { code:'supply_constraint', th:'ข้อจำกัดด้านการจัดหา',        en:'Supply Constraints',   detailTH:'เป็นสินค้านำเข้า ผลิตตามสั่ง หรือมีข้อจำกัดในการจัดหา',         detailEN:'Imported, made-to-order, or subject to supply limitations.' },
  { code:'storage_constraint',th:'ข้อจำกัดด้านการจัดเก็บ',      en:'Storage Constraints',  detailTH:'ต้องใช้พื้นที่หรือเงื่อนไขการจัดเก็บเป็นพิเศษ',                 detailEN:'Requires special storage conditions or significant storage space.' },
  { code:'policy',            th:'ตามนโยบายบริษัท',             en:'Company Policy',       detailTH:'กำหนดเป็นสินค้า Non-stock ตามนโยบายของบริษัท',                 detailEN:'Designated as a non-stock item according to company policy.' },
];

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
      <div className="form-row">
        <div className="form-group">
          <label className="label">📝 {L('หมายเหตุสินค้า','Product Remarks')}</label>
          <select className="input" value={form.remark||''} onChange={e=>set('remark',e.target.value)}>
            <option value="">— {L('ไม่ระบุ','None')} —</option>
            {DRUG_REMARKS.map(r => (
              <option key={r.code} value={r.code}>{lang==='th'?r.th:r.en}</option>
            ))}
          </select>
          {form.remark && (
            <div style={{ fontSize:11, color:'var(--txt3)', marginTop:4, lineHeight:1.5 }}>
              {lang==='th' ? DRUG_REMARKS.find(r=>r.code===form.remark)?.detailTH : DRUG_REMARKS.find(r=>r.code===form.remark)?.detailEN}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="label">{L('หมายเหตุเพิ่มเติม','Additional Note')}</label>
          <input className="input" value={form.remarkNote||''} onChange={e=>set('remarkNote',e.target.value)}
            placeholder={L('หมายเหตุเพิ่มเติม (ถ้ามี)','Additional note (optional)')} />
        </div>
      </div>

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
