// OutOfStock.jsx — ระบบแจ้งสินค้าหมด / Out-of-Stock Report System
// Roles: viewer = report only | admin/manager = report + manage + history

const OOS_STATUS = {
  pending:     { th: 'รอสั่ง',       en: 'Pending',      color: 'var(--warn)',  bg: 'rgba(217,119,6,.10)',  border: 'rgba(217,119,6,.35)'  },
  ordered:     { th: 'สั่งแล้ว',      en: 'Ordered',      color: '#1177cc',      bg: 'rgba(17,119,204,.10)', border: 'rgba(17,119,204,.35)' },
  not_ordered: { th: 'ไม่ได้สั่ง',   en: 'Not Ordered',  color: 'var(--txt3)',  bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.3)' },
  backorder:   { th: 'Back Order',   en: 'Back Order',   color: 'var(--err)',   bg: 'rgba(220,38,38,.1)',   border: 'rgba(220,38,38,.35)'  },
  arrived:     { th: 'ของมาแล้ว ✓', en: 'Arrived ✓',    color: 'var(--ok)',    bg: 'rgba(22,163,74,.10)',  border: 'rgba(22,163,74,.35)'  },
};

const OutOfStockPage = ({ lang, L, perm, notify, drugs }) => {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;

  const [reports, setReports] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const canManage = perm.role === 'admin' || perm.role === 'manager';
  const [tab, setTab] = useState('report');

  // ── form ──
  const [drugSearch, setDrugSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showDrop, setShowDrop] = useState(false);
  const [remainingQty, setRemainingQty] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const dropRef = useRef(null);
  const searchRef = useRef(null);

  // ── manage tab ──
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});

  // ── history tab ──
  const [allHistory, setAllHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [expandedPeriod, setExpandedPeriod] = useState(null);

  // ── manage filter ──
  const [filterStatus, setFilterStatus] = useState(null);

  const cloudOn = !!(window.UNI_DB && window.UNI_DB.enabled);

  const weekStart = () => {
    const t = new Date(), s = new Date(t);
    const day = t.getDay(); // 0=Sun, 1=Mon … 6=Sat
    s.setDate(t.getDate() - (day === 0 ? 6 : day - 1)); // always go back to Monday
    s.setHours(0, 0, 0, 0);
    return s;
  };

  useEffect(() => {
    const s = weekStart(), e = new Date(s);
    e.setDate(s.getDate() + 6); e.setHours(23, 59, 59, 999);
    setCurrentPeriod({
      start: s.toLocaleDateString('en-CA'),
      end: e.toLocaleDateString('en-CA'),
      daysLeft: Math.max(0, Math.ceil((e - new Date()) / 864e5)),
    });
    loadReports();
    let unsub = () => {};
    if (cloudOn && window.UNI_DB.onOutOfStockChange) unsub = window.UNI_DB.onOutOfStockChange(loadReports);
    // Auto-poll every 60 s as fallback when realtime subscription is not available
    const poll = cloudOn ? setInterval(loadReports, 60000) : null;
    return () => { unsub(); if (poll) clearInterval(poll); };
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const loadReports = async () => {
    try {
      if (cloudOn && window.UNI_DB.loadOutOfStockAll) {
        const cloud = await window.UNI_DB.loadOutOfStockAll();
        if (cloud) { setReports(cloud); return; }
      }
      // offline fallback: show last 60 days so old unresolved items stay visible
      const since = new Date(); since.setDate(since.getDate() - 60);
      const data = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
      setReports(data.filter(r => new Date(r.timestamp || r.createdAt) >= since));
    } catch (e) { console.warn('loadReports:', e); }
  };

  const loadHistory = async () => {
    if (historyLoaded) return;
    try {
      if (cloudOn && window.UNI_DB.loadOutOfStockAll) {
        const all = await window.UNI_DB.loadOutOfStockAll();
        if (all) { setAllHistory(all); setHistoryLoaded(true); return; }
      }
      const data = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
      setAllHistory([...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (e) {}
    setHistoryLoaded(true);
  };

  // ── drug suggestions ──
  const suggestions = useMemo(() => {
    const q = (drugSearch || '').toLowerCase();
    if (!q) return drugs.slice(0, 50);
    return drugs.filter(d =>
      d.code.toLowerCase().includes(q) ||
      (d.nameTH || '').toLowerCase().includes(q) ||
      (d.nameEN || '').toLowerCase().includes(q)
    ).slice(0, 30);
  }, [drugs, drugSearch]);

  const selectDrug = (drug) => {
    setSelectedDrug(drug);
    setDrugSearch('');
    setShowDrop(false);
  };

  // ── submit report ──
  const handleSubmit = async () => {
    const code = selectedDrug?.code || '';
    const name = selectedDrug ? (selectedDrug.nameTH || selectedDrug.nameEN || '') : drugSearch.trim();
    if (!code && !name) {
      notify(L('กรุณาเลือกหรือพิมพ์ชื่อสินค้า', 'Please select or enter a product'), 'err');
      return;
    }
    const r = {
      id: 'oos_' + Date.now(),
      productCode: code,
      productName: name,
      remainingQty: remainingQty || '',
      notes: formNotes.trim(),
      image: imagePreview || null,
      reportedBy: perm.role || 'viewer',
      periodStart: currentPeriod?.start || null,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
    };
    setReports(prev => [...prev, r]);
    setSelectedDrug(null); setDrugSearch(''); setRemainingQty(''); setFormNotes(''); setImagePreview(null);
    try {
      if (cloudOn && window.UNI_DB.saveOutOfStock) {
        const ok = await window.UNI_DB.saveOutOfStock(r);
        if (!ok) throw new Error('save failed');
        notify(L('แจ้งแล้ว — ฝ่ายจัดซื้อจะดำเนินการ ✓', 'Reported — Purchasing will follow up ✓'), 'ok');
      } else {
        notify(L('บันทึกแล้ว ✓', 'Saved ✓'), 'ok');
      }
      // Always keep localStorage in sync (fallback stays current after refresh)
      try {
        const stored = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
        localStorage.setItem('uni_out_of_stock', JSON.stringify([...stored, r]));
      } catch(e) {}
    } catch (e) { notify(L('บันทึกไม่สำเร็จ', 'Save failed'), 'err'); loadReports(); }
  };

  // ── manage: start editing ──
  const startEdit = (r) => {
    setEditingId(r.id);
    setEditFields({
      status: r.status || 'pending',
      orderNote: r.orderNote || '',
      supplierNotifyDate: r.supplierNotifyDate || '',
      supplierNote: r.supplierNote || '',
      eta: r.eta || '',
      backInStockDate: r.backInStockDate || '',
      replacement: r.replacement || '',
    });
  };

  const saveEdit = async (r) => {
    const updated = { ...r, ...editFields };
    if (editFields.status === 'arrived' && !updated.resolvedAt) {
      updated.resolvedAt = new Date().toISOString();
      updated.resolvedBy = perm.role;
    }
    setReports(prev => prev.map(x => x.id === r.id ? updated : x));
    setEditingId(null);
    try {
      if (cloudOn && window.UNI_DB.updateOutOfStock) {
        const ok = await window.UNI_DB.updateOutOfStock(r.id, updated);
        if (!ok) throw new Error('updateOutOfStock returned false');
      }
      // Always keep localStorage in sync (fallback stays current after refresh)
      try {
        const stored = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
        localStorage.setItem('uni_out_of_stock', JSON.stringify(stored.map(x => x.id === r.id ? updated : x)));
      } catch(e) {}
      notify(L('อัปเดตแล้ว ✓', 'Updated ✓'), 'ok');
    } catch (e) { notify(L('อัปเดตไม่สำเร็จ', 'Update failed'), 'err'); loadReports(); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── history grouping by period ──
  const historyByPeriod = useMemo(() => {
    const map = {};
    allHistory.forEach(r => {
      const key = r.periodStart || r.createdAt?.slice(0, 10) || '?';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allHistory]);

  const activeReports = reports.filter(r => r.status !== 'arrived');
  const arrivedReports = reports.filter(r => r.status === 'arrived');

  // ── style helpers ──
  const tabSt = (active) => ({
    background: 'none', border: 'none', padding: '8px 16px', fontSize: '14px',
    fontWeight: active ? '600' : '400',
    color: active ? 'var(--acc2)' : 'var(--txt3)',
    borderBottom: active ? '2px solid var(--acc)' : '2px solid transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
  });

  const badge = (status) => {
    const s = OOS_STATUS[status] || OOS_STATUS.pending;
    return (
      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', whiteSpace: 'nowrap',
        color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
        {lang === 'th' ? s.th : s.en}
      </span>
    );
  };

  const S = {
    page:  { padding: '1.5rem', maxWidth: '900px', margin: '0 auto', background: 'var(--bg0)' },
    card:  { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' },
    row:   { marginBottom: '14px' },
    label: { display: 'block', fontSize: '13px', color: 'var(--txt3)', marginBottom: '5px', fontWeight: '500' },
    inp:   { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', background: 'var(--bg1)', color: 'var(--txt)', boxSizing: 'border-box' },
    btn:   (col) => ({ background: col || 'var(--acc)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }),
    ghost: { background: 'none', border: '1px solid var(--border)', color: 'var(--txt2)', padding: '6px 14px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '13px' },
  };

  // ================================================================
  // REPORT TAB — available to all roles
  // ================================================================
  const ReportTab = () => (
    <div>
      {/* Period header */}
      <div style={{ background: 'var(--glow)', border: '1px solid var(--border2)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
              📍 {L('สินค้าหมดประจำสัปดาห์', 'Weekly Out-of-Stock Report')}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--txt3)' }}>
              {L('ช่วง', 'Period')}: {currentPeriod?.start} – {currentPeriod?.end}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--txt3)' }}>
            <div style={{ fontWeight: '600', color: 'var(--txt2)', fontSize: '14px' }}>{reports.length} {L('รายการ', 'items')}</div>
            <div style={{ marginTop: '2px' }}>{L('รีเซ็ตในอีก', 'Reset in')} {currentPeriod?.daysLeft} {L('วัน', 'days')}</div>
          </div>
        </div>
        <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--txt)', lineHeight: 1.6 }}>
          <strong>{L('ถ้าพบสินค้าหมดระหว่างการขาย รบกวนแจ้งผ่านฟอร์มด้านล่างนี้ด้วยนะคะ/ครับ 🙏',
            'If you find any item out of stock during sales, please report it using the form below. 🙏')}</strong>
        </div>
      </div>

      {/* Form */}
      <div style={S.card}>
        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '1rem', color: 'var(--txt2)' }}>
          📸 {L('แจ้งรายการสินค้าหมด', 'Report Out-of-Stock Item')}
        </div>

        {/* Drug selector */}
        <div style={S.row}>
          <label style={S.label}>{L('รหัสสินค้า / ชื่อสินค้า', 'Product Code / Name')} *</label>
          {selectedDrug ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--acc)', borderRadius: '6px', background: 'var(--glow)' }}>
              <span style={{ flex: 1, fontSize: '14px', color: 'var(--txt)' }}>
                <span style={{ fontWeight: '600', color: 'var(--acc2)' }}>{selectedDrug.code}</span>
                {' — '}{selectedDrug.nameTH || selectedDrug.nameEN}
              </span>
              {selectedDrug.totalStock != null && (
                <span style={{ fontSize: '12px', color: 'var(--txt3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: '4px' }}>
                  {L('คงเหลือ', 'Stock')}: {selectedDrug.totalStock}
                </span>
              )}
              <button onClick={() => setSelectedDrug(null)} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '2px 4px' }}>✕</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }} ref={dropRef}>
              <input
                ref={searchRef}
                type="text"
                style={{ ...S.inp, paddingRight: '36px' }}
                placeholder={L('พิมพ์รหัสหรือชื่อยาเพื่อค้นหา…', 'Type code or drug name to search…')}
                value={drugSearch}
                onChange={e => { setDrugSearch(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
              />
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt4)', fontSize: '16px', pointerEvents: 'none' }}>▾</span>
              {showDrop && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg1)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', maxHeight: '260px', overflowY: 'auto', zIndex: 50, boxShadow: '0 6px 20px rgba(0,0,0,.18)' }}>
                  {suggestions.length === 0 ? (
                    <div style={{ padding: '12px', fontSize: '13px', color: 'var(--txt4)', textAlign: 'center' }}>
                      {L('ไม่พบสินค้า', 'No product found')}
                    </div>
                  ) : suggestions.map(d => (
                    <div key={d.code}
                      style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px' }}
                      onMouseDown={() => selectDrug(d)}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseOut={e => e.currentTarget.style.background = ''}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span>
                          <span style={{ fontWeight: '600', color: 'var(--acc2)' }}>{d.code}</span>
                          <span style={{ color: 'var(--txt)', marginLeft: '6px' }}>{d.nameTH || d.nameEN}</span>
                        </span>
                        {d.totalStock != null && (
                          <span style={{ fontSize: '11px', color: d.totalStock <= (d.minStock || 0) ? 'var(--err)' : 'var(--txt4)', whiteSpace: 'nowrap' }}>
                            {L('คงเหลือ', 'Stock')}: {d.totalStock}
                          </span>
                        )}
                      </div>
                      {d.nameEN && d.nameEN !== d.nameTH && (
                        <div style={{ fontSize: '11px', color: 'var(--txt4)', marginTop: '2px' }}>{d.nameEN}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remaining quantity */}
        <div style={S.row}>
          <label style={S.label}>{L('จำนวนคงเหลือ (ณ ตอนที่แจ้ง)', 'Remaining Qty (at time of report)')}</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              min="0"
              style={{ ...S.inp, width: '120px' }}
              placeholder="0"
              value={remainingQty}
              onChange={e => setRemainingQty(e.target.value)}
            />
            <span style={{ fontSize: '13px', color: 'var(--txt3)' }}>{selectedDrug?.unit || L('หน่วย', 'units')}</span>
          </div>
        </div>

        {/* Image */}
        <div style={S.row}>
          <label style={S.label}>{L('รูปภาพสินค้า', 'Product Photo')}</label>
          <div
            style={{ border: '2px dashed var(--border2)', borderRadius: '8px', padding: imagePreview ? '8px' : '1.5rem', textAlign: 'center', cursor: 'pointer', background: imagePreview ? 'transparent' : 'var(--bg3)' }}
            onClick={() => document.getElementById('oosImgInput').click()}>
            {imagePreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={imagePreview} style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: '6px' }} />
                <button onClick={e => { e.stopPropagation(); setImagePreview(null); }}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--err)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div>
                <div style={{ fontSize: '13px', color: 'var(--txt3)' }}>{L('คลิกเพื่ออัปโหลดรูปสินค้า', 'Click to upload product photo')}</div>
              </>
            )}
          </div>
          <input id="oosImgInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        </div>

        {/* Notes */}
        <div style={S.row}>
          <label style={S.label}>{L('หมายเหตุ', 'Notes')} ({L('ไม่บังคับ', 'optional')})</label>
          <textarea
            style={{ ...S.inp, minHeight: '72px', resize: 'vertical' }}
            placeholder={L('เช่น หมดมาแล้วหลายวัน หรือขายออกเร็วมาก', 'e.g. Has been out for several days, or selling very fast')}
            value={formNotes}
            onChange={e => setFormNotes(e.target.value)}
          />
        </div>

        <button style={S.btn()} onClick={handleSubmit}>
          ✓ {L('บันทึกรายการ', 'Submit Report')}
        </button>
      </div>

      {/* This week's reports */}
      {reports.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', color: 'var(--txt2)' }}>
            📝 {L('รายการที่แจ้งสัปดาห์นี้', "This Week's Reports")} ({reports.length})
          </div>
          {reports.map(r => (
            <div key={r.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {r.image ? (
                <img src={r.image} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, cursor: 'pointer' }} onClick={() => window.open(r.image, '_blank')} />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '6px', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>💊</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--acc2)' }}>{r.productCode}</span>
                  <span style={{ fontSize: '14px', color: 'var(--txt)' }}>{r.productName}</span>
                  {badge(r.status)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--txt3)' }}>
                  {r.remainingQty !== '' && r.remainingQty != null && (
                    <span style={{ marginRight: '10px' }}>{L('คงเหลือ', 'Remaining')}: <strong>{r.remainingQty}</strong></span>
                  )}
                  {L('แจ้งโดย', 'By')}: {r.reportedBy} • {new Date(r.createdAt).toLocaleDateString('th-TH')} {r.timestamp}
                </div>
                {r.notes && <div style={{ fontSize: '12px', color: 'var(--txt4)', marginTop: '3px' }}>{r.notes}</div>}
                {/* Show procurement update to viewer */}
                {r.eta && <div style={{ fontSize: '12px', color: 'var(--acc2)', marginTop: '3px' }}>📅 ETA: {r.eta}</div>}
                {r.supplierNote && <div style={{ fontSize: '12px', color: 'var(--txt3)', marginTop: '2px' }}>🏭 {r.supplierNote}</div>}
                {r.replacement && <div style={{ fontSize: '12px', color: 'var(--warn)', marginTop: '2px' }}>↪ {L('สินค้าทดแทน', 'Replacement')}: {r.replacement}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ================================================================
  // MANAGE TAB — admin / manager only
  // ================================================================
  const ManageTab = () => (
    <div>
      {/* Toolbar: last-synced indicator + refresh button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '12px', color: 'var(--txt4)' }}>
          {L('อัปเดตอัตโนมัติทุก 60 วิ', 'Auto-refreshes every 60 s')}
        </span>
        <button onClick={() => loadReports()}
          style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          🔄 {L('รีเฟรช', 'Refresh')}
        </button>
      </div>

      {/* Summary bar — clickable to filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: filterStatus ? '0.75rem' : '1.5rem' }}>
        {Object.entries(OOS_STATUS).map(([key, def]) => {
          const cnt = reports.filter(r => (r.status || 'pending') === key).length;
          const isActive = filterStatus === key;
          return (
            <div key={key}
              onClick={() => setFilterStatus(isActive ? null : key)}
              style={{ background: def.bg, border: `2px solid ${isActive ? def.color : def.border}`, borderRadius: '8px', padding: '12px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s', boxShadow: isActive ? `0 0 0 2px ${def.color}44` : 'none' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: def.color }}>{cnt}</div>
              <div style={{ fontSize: '12px', color: 'var(--txt3)', marginTop: '2px' }}>{lang === 'th' ? def.th : def.en}</div>
            </div>
          );
        })}
      </div>

      {/* Active filter chip */}
      {filterStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <span style={{ fontSize: '13px', color: 'var(--txt3)' }}>{L('กรองตาม', 'Filtered by')}:</span>
          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600',
            color: OOS_STATUS[filterStatus].color, background: OOS_STATUS[filterStatus].bg, border: `1px solid ${OOS_STATUS[filterStatus].border}` }}>
            {lang === 'th' ? OOS_STATUS[filterStatus].th : OOS_STATUS[filterStatus].en}
          </span>
          <button onClick={() => setFilterStatus(null)}
            style={{ background: 'none', border: 'none', color: 'var(--txt4)', cursor: 'pointer', fontSize: '13px', padding: '2px 6px' }}>
            ✕ {L('ล้าง', 'Clear')}
          </button>
        </div>
      )}

      {(() => {
        const visible = filterStatus ? reports.filter(r => (r.status || 'pending') === filterStatus) : reports;
        return visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--txt4)' }}>
          {filterStatus ? L('ไม่มีรายการในสถานะนี้', 'No items with this status') : L('ไม่มีรายการในสัปดาห์นี้', 'No reports this week')}
        </div>
      ) : (
        visible.map(r => {
          const isEditing = editingId === r.id;
          const sdef = OOS_STATUS[r.status || 'pending'] || OOS_STATUS.pending;
          return (
            <div key={r.id} style={{ ...S.card, borderLeft: `3px solid ${sdef.color}` }}>
              {/* Header row */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {r.image ? (
                  <img src={r.image} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, cursor: 'pointer' }} onClick={() => window.open(r.image, '_blank')} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '6px', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>💊</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--acc2)', fontSize: '15px' }}>{r.productCode}</span>
                    <span style={{ fontSize: '14px', color: 'var(--txt)', fontWeight: '500' }}>{r.productName}</span>
                    {badge(r.status)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--txt3)' }}>
                    {r.remainingQty !== '' && r.remainingQty != null && <span style={{ marginRight: '10px' }}>{L('คงเหลือ', 'Remaining')}: <strong style={{ color: 'var(--err)' }}>{r.remainingQty}</strong></span>}
                    {L('แจ้งโดย', 'By')}: {r.reportedBy} • {new Date(r.createdAt).toLocaleDateString('th-TH')} {r.timestamp}
                  </div>
                  {r.notes && <div style={{ fontSize: '12px', color: 'var(--txt4)', marginTop: '3px' }}>📝 {r.notes}</div>}
                  {r.eta && <div style={{ fontSize: '12px', color: 'var(--acc2)', marginTop: '2px' }}>📅 ETA: {r.eta}</div>}
                  {r.backInStockDate && <div style={{ fontSize: '12px', color: 'var(--ok)', marginTop: '2px' }}>✅ {L('วันกลับมา', 'Back-in-stock')}: {r.backInStockDate}</div>}
                  {r.replacement && <div style={{ fontSize: '12px', color: 'var(--warn)', marginTop: '2px' }}>↪ {L('สินค้าทดแทน', 'Replacement')}: {r.replacement}</div>}
                  {r.supplierNote && <div style={{ fontSize: '12px', color: 'var(--txt3)', marginTop: '2px' }}>🏭 {r.supplierNote}</div>}
                </div>
                {canManage && (
                  <button style={S.ghost} onClick={() => isEditing ? setEditingId(null) : startEdit(r)}>
                    {isEditing ? L('ยกเลิก', 'Cancel') : L('จัดการ', 'Manage')}
                  </button>
                )}
              </div>

              {/* Expanded edit panel */}
              {isEditing && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    {/* Status */}
                    <div>
                      <label style={S.label}>{L('สถานะ', 'Status')}</label>
                      <select
                        style={{ ...S.inp }}
                        value={editFields.status}
                        onChange={e => setEditFields(f => ({ ...f, status: e.target.value }))}>
                        {Object.entries(OOS_STATUS).map(([k, v]) => (
                          <option key={k} value={k}>{lang === 'th' ? v.th : v.en}</option>
                        ))}
                      </select>
                    </div>
                    {/* ETA */}
                    <div>
                      <label style={S.label}>ETA {L('(คาดว่าจะได้)', '(Expected Arrival)')}</label>
                      <input type="date" style={S.inp} value={editFields.eta}
                        onChange={e => setEditFields(f => ({ ...f, eta: e.target.value }))} />
                    </div>
                    {/* Supplier notify date */}
                    <div>
                      <label style={S.label}>{L('วันที่ผู้จัดจำหน่ายแจ้ง', 'Supplier Notification Date')}</label>
                      <input type="date" style={S.inp} value={editFields.supplierNotifyDate}
                        onChange={e => setEditFields(f => ({ ...f, supplierNotifyDate: e.target.value }))} />
                    </div>
                    {/* Back-in-stock date */}
                    <div>
                      <label style={S.label}>{L('วันที่ของกลับมา (จริง)', 'Back-in-Stock Date (Actual)')}</label>
                      <input type="date" style={S.inp} value={editFields.backInStockDate}
                        onChange={e => setEditFields(f => ({ ...f, backInStockDate: e.target.value }))} />
                    </div>
                  </div>
                  {/* Supplier note */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={S.label}>{L('หมายเหตุจากผู้จัดจำหน่าย', 'Supplier Note')}</label>
                    <input type="text" style={S.inp} placeholder={L('เช่น ผลิตภัณฑ์หมดจากโรงงาน คาดว่า 2 สัปดาห์', 'e.g. Out of factory stock, est. 2 weeks')}
                      value={editFields.supplierNote}
                      onChange={e => setEditFields(f => ({ ...f, supplierNote: e.target.value }))} />
                  </div>
                  {/* Replacement */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={S.label}>{L('สินค้าทดแทน (ถ้ามี)', 'Replacement Product (if any)')}</label>
                    <input type="text" style={S.inp} placeholder={L('ชื่อหรือรหัสสินค้าทดแทน', 'Name or code of replacement product')}
                      value={editFields.replacement}
                      onChange={e => setEditFields(f => ({ ...f, replacement: e.target.value }))} />
                  </div>
                  {/* Order note */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={S.label}>{L('หมายเหตุการสั่ง', 'Order Note')}</label>
                    <input type="text" style={S.inp} placeholder={L('เช่น สั่งพิเศษ 50 กล่อง', 'e.g. Special order 50 boxes')}
                      value={editFields.orderNote}
                      onChange={e => setEditFields(f => ({ ...f, orderNote: e.target.value }))} />
                  </div>
                  <button style={S.btn()} onClick={() => saveEdit(r)}>
                    ✓ {L('บันทึกการจัดการ', 'Save')}
                  </button>
                </div>
              )}
            </div>
          );
        })
      );
      })()}
    </div>
  );

  // ================================================================
  // HISTORY / STATISTICS TAB — admin / manager only
  // ================================================================
  const HistoryTab = () => {
    const statusKeys = Object.keys(OOS_STATUS);
    return (
      <div>
        {!historyLoaded ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--txt4)' }}>
            {L('กำลังโหลด…', 'Loading…')}
          </div>
        ) : historyByPeriod.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--txt4)' }}>
            {L('ยังไม่มีประวัติ', 'No history yet')}
          </div>
        ) : (
          historyByPeriod.map(([period, items]) => {
            const isOpen = expandedPeriod === period;
            const counts = {};
            statusKeys.forEach(k => { counts[k] = items.filter(r => (r.status || 'pending') === k).length; });
            return (
              <div key={period} style={S.card}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedPeriod(isOpen ? null : period)}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--txt2)' }}>
                      📅 {L('สัปดาห์เริ่ม', 'Week starting')} {period}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--txt4)', marginTop: '4px' }}>
                      {items.length} {L('รายการ', 'items')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {statusKeys.filter(k => counts[k] > 0).map(k => (
                      <span key={k} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', fontWeight: '600',
                        color: OOS_STATUS[k].color, background: OOS_STATUS[k].bg, border: `1px solid ${OOS_STATUS[k].border}` }}>
                        {lang === 'th' ? OOS_STATUS[k].th : OOS_STATUS[k].en} ({counts[k]})
                      </span>
                    ))}
                    <span style={{ color: 'var(--txt4)', fontSize: '16px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    {items.map(r => (
                      <div key={r.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        {r.image ? (
                          <img src={r.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0, cursor: 'pointer' }} onClick={() => window.open(r.image, '_blank')} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>💊</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500' }}>
                            {r.productCode && <span style={{ color: 'var(--acc2)', marginRight: '6px' }}>{r.productCode}</span>}
                            {r.productName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--txt4)', marginTop: '2px' }}>
                            {r.reportedBy} • {new Date(r.createdAt).toLocaleDateString('th-TH')}
                            {r.eta && <span style={{ marginLeft: '8px' }}>ETA: {r.eta}</span>}
                            {r.backInStockDate && <span style={{ marginLeft: '8px', color: 'var(--ok)' }}>✅ {r.backInStockDate}</span>}
                          </div>
                        </div>
                        {badge(r.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div style={S.page}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        <button style={tabSt(tab === 'report')} onClick={() => setTab('report')}>
          📸 {L('แจ้งสินค้าหมด', 'Report')}
        </button>
        <button style={tabSt(tab === 'manage')} onClick={() => setTab('manage')}>
          📋 {L('รายการ/จัดการ', 'List / Manage')}
          {activeReports.length > 0 && (
            <span style={{ background: 'var(--err)', color: '#fff', borderRadius: '20px', fontSize: '10px', padding: '1px 6px', fontWeight: '700' }}>
              {activeReports.length}
            </span>
          )}
        </button>
        <button style={tabSt(tab === 'history')} onClick={() => { setTab('history'); loadHistory(); }}>
          📊 {L('สถิติ/ประวัติ', 'Statistics')}
        </button>
      </div>

      {tab === 'report' && ReportTab()}
      {tab === 'manage' && ManageTab()}
      {tab === 'history' && HistoryTab()}
    </div>
  );
};
