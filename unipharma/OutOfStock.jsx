const OutOfStockPage = ({ lang, L, perm, notify, drugs }) => {
  const [reports, setReports] = React.useState([]);
  const [currentPeriod, setCurrentPeriod] = React.useState(null);
  const [tab, setTab] = React.useState(perm.role === 'admin' || perm.role === 'manager' ? 'dashboard' : 'report');
  const [form, setForm] = React.useState({ productCode: '', productName: '', notes: '' });
  const [imagePreview, setImagePreview] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);

  const cloudOn = !!(window.UNI_DB && window.UNI_DB.enabled);

  // Monday 00:00 of the current week — the start of the 7-day reporting window.
  const weekStart = () => {
    const t = new Date();
    const s = new Date(t);
    s.setDate(t.getDate() - t.getDay() + 1);
    s.setHours(0, 0, 0, 0);
    return s;
  };

  React.useEffect(() => {
    initializePeriod();
    loadReports();
    // Live updates: re-fetch whenever anyone adds/changes a report.
    let unsub = () => {};
    if (cloudOn && window.UNI_DB.onOutOfStockChange) {
      unsub = window.UNI_DB.onOutOfStockChange(() => loadReports());
    }
    return () => unsub();
  }, []);

  const initializePeriod = () => {
    const startOfWeek = weekStart();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    setCurrentPeriod({
      start: startOfWeek.toLocaleDateString('en-CA'),
      end: endOfWeek.toLocaleDateString('en-CA'),
      daysLeft: Math.max(0, Math.ceil((endOfWeek - new Date()) / (1000 * 60 * 60 * 24)))
    });
  };

  const loadReports = async () => {
    const since = weekStart();
    try {
      if (cloudOn && window.UNI_DB.loadOutOfStock) {
        const cloud = await window.UNI_DB.loadOutOfStock(since.toISOString());
        if (cloud) { setReports(cloud); return; }
      }
      // Offline fallback → this browser's localStorage only.
      const data = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
      setReports(data.filter(r => new Date(r.createdAt) >= since));
    } catch (e) {
      console.log('Load reports error:', e);
    }
  };

  const handleProductCodeChange = (code) => {
    setForm({...form, productCode: code});
    setSuggestions([]);

    if (code.trim()) {
      const filtered = drugs.filter(d =>
        d.code.toLowerCase().includes(code.toLowerCase()) ||
        d.nameTH?.toLowerCase().includes(code.toLowerCase()) ||
        d.nameEN?.toLowerCase().includes(code.toLowerCase())
      ).slice(0, 5);

      setSuggestions(filtered);
    }
  };

  const selectProduct = (drug) => {
    setForm({
      productCode: drug.code,
      productName: drug.nameTH || drug.nameEN || '',
      notes: ''
    });
    setSuggestions([]);
  };

  const handleAddReport = async () => {
    const code = (form.productCode || '').trim();
    const name = (form.productName || '').trim();

    if (!code && !name) {
      notify(L('กรุณาระบุรหัสหรือชื่อสินค้า', 'Please enter product code or name'), 'error');
      return;
    }

    const newReport = {
      id: 'oos_' + Date.now(),
      productCode: code,
      productName: name,
      notes: (form.notes || '').trim(),
      image: imagePreview || null,
      reportedBy: perm.role || 'Viewer',
      periodStart: currentPeriod?.start || null,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic update so the reporter sees it immediately; realtime keeps
    // everyone else in sync.
    setReports(prev => [...prev, newReport]);
    setForm({ productCode: '', productName: '', notes: '' });
    setImagePreview(null);
    setSuggestions([]);

    try {
      if (cloudOn && window.UNI_DB.saveOutOfStock) {
        const ok = await window.UNI_DB.saveOutOfStock(newReport);
        if (!ok) throw new Error('cloud save failed');
        notify(L('บันทึกและแชร์ให้ทุกคนแล้ว ✓', 'Saved & shared with everyone ✓'), 'success');
      } else {
        // Offline → persist to this browser only.
        const stored = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
        localStorage.setItem('uni_out_of_stock', JSON.stringify([...stored, newReport]));
        notify(L('บันทึกแล้ว (เครื่องนี้เท่านั้น)', 'Saved (this device only)'), 'success');
      }
    } catch (e) {
      console.error('Save error:', e);
      notify(L('บันทึกขึ้นคลาวด์ไม่สำเร็จ', 'Could not save to cloud'), 'error');
      loadReports(); // roll back optimistic add to the true server state
    }
  };

  // Admin/Manager mark an item handled after ordering. The record is kept in
  // the database as statistics — it is just removed from the active list.
  const handleResolve = async (id) => {
    const stamp = { resolvedAt: new Date().toISOString(), resolvedBy: perm.role || '' };
    // Optimistic: flag it locally so it leaves the active list immediately.
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...stamp } : r));
    try {
      if (cloudOn && window.UNI_DB.setOutOfStockResolved) {
        const ok = await window.UNI_DB.setOutOfStockResolved(id, perm.role || '');
        if (!ok) throw new Error('cloud update failed');
      } else {
        const stored = JSON.parse(localStorage.getItem('uni_out_of_stock') || '[]');
        localStorage.setItem('uni_out_of_stock', JSON.stringify(stored.map(r => r.id === id ? { ...r, ...stamp } : r)));
      }
      notify(L('ย้ายไปสถิติแล้ว ✓', 'Moved to statistics ✓'), 'success');
    } catch (e) {
      console.error('Resolve error:', e);
      notify(L('ดำเนินการไม่สำเร็จ', 'Could not update'), 'error');
      loadReports();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setImagePreview(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const styles = {
    container: { padding: '1.5rem', maxWidth: '900px', margin: '0 auto' },
    tabsContainer: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' },
    tab: (active) => ({
      background: 'none',
      border: 'none',
      padding: '0.5rem 1rem',
      fontSize: '14px',
      fontWeight: active ? '500' : '400',
      color: active ? 'var(--acc2)' : 'var(--txt3)',
      borderBottom: active ? '2px solid var(--acc)' : 'none',
      cursor: 'pointer'
    }),
    card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' },
    header: { fontSize: '18px', fontWeight: '500', marginBottom: '1rem', color: 'var(--txt2)' },
    label: { display: 'block', fontSize: '13px', color: 'var(--txt3)', marginBottom: '6px', fontWeight: '500' },
    input: { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', marginBottom: '1rem', fontFamily: 'inherit', background: 'var(--bg1)', color: 'var(--txt)' },
    button: { background: 'var(--acc)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '14px' },
    reportItem: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', marginBottom: '12px', display: 'flex', gap: '1rem' },
    thumbnail: { width: '60px', height: '60px', background: 'var(--bg4)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
    periodHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' },
    topicBox: { background: 'var(--glow)', border: '1px solid var(--border2)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }
  };

  // Active = still needs ordering; resolved = handled, kept as statistics.
  const activeReports = reports.filter(r => !r.resolvedAt);
  const resolvedReports = reports.filter(r => r.resolvedAt);

  return (
    <div style={{
      ...styles.container,
      background: 'var(--bg0)',
      transition: 'background 0.3s ease'
    }}>
      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button style={styles.tab(tab === 'report')} onClick={() => setTab('report')}>
          📸 {L('รายงาน', 'Report')}
        </button>
        {(perm.role === 'admin' || perm.role === 'manager') && (
          <button style={styles.tab(tab === 'dashboard')} onClick={() => setTab('dashboard')}>
            📊 {L('แผนการสั่ง', 'Dashboard')}
          </button>
        )}
      </div>

      {/* REPORT TAB */}
      {tab === 'report' && (
        <div>
          {/* Topic/Period Header */}
          <div style={styles.topicBox}>
            <div style={styles.periodHeader}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '500', color: 'var(--txt2)' }}>
                  📍 {L('สินค้าหมด', 'Out of stock')}
                </h3>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--txt3)' }}>
                  {L('ช่วง', 'Period')}: {currentPeriod?.start} - {currentPeriod?.end} (7 {L('วัน', 'days')})
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--txt3)' }}>
                <div>{reports.length} {L('รายการ', 'items')}</div>
                <div style={{ color: 'var(--txt4)', marginTop: '4px' }}>{L('รีเซ็ตในอีก', 'Reset in')} {currentPeriod?.daysLeft} {L('วัน', 'days')}</div>
              </div>
            </div>
            <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.6', color: 'var(--txt)' }}>
              <strong>{L('ถ้าพบรายการยาที่หมดระหว่างการขายในช่วงนี้ รบกวนช่วยแนบรูปหรือพิมพ์ชื่อยาลงในโพสนี้ ขอบคุณครับ/ค่ะ', 'If you found any item out of stock during this period, please help to attach the photo or name of items in this post. Thank you!')}</strong><br/>
              <span style={{ color: 'var(--txt3)', display: 'block', marginTop: '8px' }}>🙏</span>
            </p>
          </div>

          {/* Report Form */}
          <div style={styles.card}>
            <h4 style={{ ...styles.header, marginBottom: '1rem', fontSize: '14px' }}>📸 {L('แจ้งรายการสินค้าหมด', 'Report item')}</h4>

            <label style={styles.label}>{L('รหัสสินค้า', 'Product code')} / {L('ชื่อสินค้า', 'Product name')} *</label>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type="text"
                style={styles.input}
                placeholder={L('เช่น P-1234 หรือ ชื่อยา', 'e.g., P-1234 or drug name')}
                value={form.productCode || form.productName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (drugs.some(d => d.code === val)) {
                    const drug = drugs.find(d => d.code === val);
                    selectProduct(drug);
                  } else {
                    handleProductCodeChange(val);
                    if (!drugs.some(d => d.code.toLowerCase() === val.toLowerCase())) {
                      setForm({...form, productCode: '', productName: val});
                    }
                  }
                }}
              />
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg1)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {suggestions.map(drug => (
                    <div
                      key={drug.code}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--txt)'
                      }}
                      onClick={() => selectProduct(drug)}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg1)'}
                    >
                      <div style={{ fontWeight: 500 }}>{drug.code} - {drug.nameTH || drug.nameEN}</div>
                      <div style={{ fontSize: '12px', color: 'var(--txt3)' }}>{drug.nameEN||drug.nameTH}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label style={styles.label}>{L('รูปภาพสินค้า', 'Product image')} *</label>
            <div style={{
              border: '2px dashed var(--border2)',
              borderRadius: '6px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '1rem',
              background: imagePreview ? 'transparent' : 'var(--bg3)'
            }} onClick={() => document.getElementById('imageInput').click()}>
              {imagePreview ? (
                <img src={imagePreview} style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px' }} />
              ) : (
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '13px', color: 'var(--txt3)' }}>
                    {L('คลิกเพื่ออัปโหลดหรือลากรูปที่นี่', 'Click or drag image here')}
                  </div>
                </div>
              )}
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>

            <label style={styles.label}>{L('หมายเหตุ', 'Notes')} ({L('ไม่บังคับ', 'optional')})</label>
            <textarea
              style={{ ...styles.input, minHeight: '80px' }}
              placeholder={L('เช่น หมดนานแค่ไหน หรือกี่ชั่วโมง', 'e.g., Sold out 1 hour before closing...')}
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
            />

            <button style={styles.button} onClick={handleAddReport}>
              ✓ {L('บันทึกรายการ', 'Report this item')}
            </button>
          </div>

          {/* Reported Items List */}
          <div>
            <h4 style={{ ...styles.header, marginTop: '2rem' }}>📝 {L('รายการที่แจ้ง', 'Reported items')} ({reports.length})</h4>
            {reports.length === 0 ? (
              <p style={{ color: 'var(--txt4)', textAlign: 'center', padding: '2rem' }}>
                {L('ยังไม่มีรายการที่แจ้ง', 'No items reported yet')}
              </p>
            ) : (
              reports.map(r => (
                <div key={r.id} style={styles.reportItem}>
                  {r.image ? (
                    <img src={r.image} style={{ ...styles.thumbnail, background: 'transparent', width: '80px', height: '80px' }} />
                  ) : (
                    <div style={styles.thumbnail}>💊</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {r.productCode && <span style={{ color: 'var(--acc2)', fontWeight: '600' }}>{r.productCode}</span>} {r.productName}
                      {r.resolvedAt && (
                        <span style={{ fontSize: '11px', background: 'rgba(34,197,94,.18)', color: 'var(--ok)', border: '1px solid rgba(34,197,94,.35)', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' }}>
                          ✓ {L('สั่งแล้ว', 'Ordered')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--txt3)' }}>
                      {L('แจ้งโดย', 'Reported by')}: {r.reportedBy} • {new Date(r.createdAt).toLocaleDateString('th-TH')} {r.timestamp}
                    </div>
                    {r.notes && (
                      <div style={{ fontSize: '12px', color: 'var(--txt4)', marginTop: '4px' }}>
                        {L('หมายเหตุ', 'Note')}: {r.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD TAB - For Purchasing */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ ...styles.card, background: 'rgba(255,193,7,.12)', border: '1px solid rgba(255,193,7,.35)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--txt)' }}>{activeReports.length} {L('รายการรอสั่ง', 'items to reorder')}</strong>
                <div style={{ fontSize: '13px', color: 'var(--txt3)', marginTop: '4px' }}>
                  {L('แจ้งสำหรับช่วง', 'Reported for period')} {currentPeriod?.start} - {currentPeriod?.end}
                </div>
              </div>
            </div>
          </div>

          <h4 style={{ ...styles.header, marginBottom: '1rem' }}>📋 {L('รายการที่ต้องสั่ง', 'Items to reorder')}</h4>

          {activeReports.length === 0 ? (
            <p style={{ color: 'var(--txt4)', textAlign: 'center', padding: '2rem' }}>
              {L('ไม่มีรายการที่รอสั่งในช่วงนี้', 'No items waiting to reorder this period')}
            </p>
          ) : (
            <div>
              {activeReports.map((r, idx) => (
                <div key={r.id} style={styles.card}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {r.image ? (
                      <img src={r.image} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => window.open(r.image, '_blank')} title={L('คลิกเพื่อดูรูปเต็ม', 'Click to view full image')} />
                    ) : (
                      <div style={{ width: '72px', height: '72px', borderRadius: '6px', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>💊</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '500' }}>
                          {idx + 1}. {r.productCode && <span style={{ color: 'var(--acc2)' }}>[{r.productCode}]</span>} {r.productName}
                        </div>
                        <span style={{ fontSize: '12px', background: 'rgba(255,193,7,.18)', color: 'var(--txt2)', border: '1px solid rgba(255,193,7,.35)', padding: '4px 12px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          ⚠️ {L('หมด', 'Out')}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--txt3)', marginBottom: '4px' }}>
                        {L('แจ้งโดย', 'Reported by')}: {r.reportedBy} • {new Date(r.createdAt).toLocaleDateString('th-TH')} {r.timestamp}
                      </div>
                      {r.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--txt4)', marginBottom: '4px' }}>
                          {L('หมายเหตุ', 'Note')}: {r.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  {perm.canWrite && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button style={{ ...styles.button, background: '#17a2b8', flex: 1 }}
                        onClick={() => handleResolve(r.id)}>
                        ✓ {L('สั่งแล้ว / ลบออกจากรายการ', 'Ordered / Remove from list')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary — handled items are kept here as statistics */}
          <div style={{ ...styles.card, marginTop: '2rem', background: 'var(--bg3)' }}>
            <h5 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500', color: 'var(--txt2)' }}>📊 {L('สรุปสถิติ (ช่วงนี้)', 'Statistics (this period)')}</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--txt3)' }}>{L('รอสั่ง', 'To reorder')}</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--acc2)' }}>{activeReports.length}</div>
              </div>
              <div>
                <div style={{ color: 'var(--txt3)' }}>{L('สั่งแล้ว', 'Ordered')}</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--ok)' }}>{resolvedReports.length}</div>
              </div>
              <div>
                <div style={{ color: 'var(--txt3)' }}>{L('แจ้งทั้งหมด', 'Total reported')}</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--txt2)' }}>{reports.length}</div>
              </div>
            </div>

            {resolvedReports.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--txt3)', marginBottom: '8px', fontWeight: '600' }}>
                  ✓ {L('สั่งแล้ว / ดำเนินการแล้ว', 'Ordered / handled')}
                </div>
                {resolvedReports.map(r => (
                  <div key={r.id} style={{ fontSize: '12px', color: 'var(--txt4)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ textDecoration: 'line-through' }}>
                      {r.productCode && <span style={{ color: 'var(--acc2)' }}>[{r.productCode}]</span>} {r.productName}
                    </span>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {r.resolvedBy ? `${L('โดย', 'by')} ${r.resolvedBy}` : ''} {new Date(r.resolvedAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
