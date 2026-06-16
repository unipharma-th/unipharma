const OutOfStockPage = ({ lang, L, perm, notify, drugs }) => {
  const [reports, setReports] = React.useState([]);
  const [currentPeriod, setCurrentPeriod] = React.useState(null);
  const [tab, setTab] = React.useState(perm.role === 'admin' || perm.role === 'manager' ? 'dashboard' : 'report');
  const [form, setForm] = React.useState({ productCode: '', productName: '', notes: '' });
  const [imagePreview, setImagePreview] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);

  React.useEffect(() => {
    initializePeriod();
    loadReports();
  }, []);

  const initializePeriod = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    setCurrentPeriod({
      start: startOfWeek.toLocaleDateString('en-CA'),
      end: endOfWeek.toLocaleDateString('en-CA'),
      daysLeft: Math.ceil((endOfWeek - today) / (1000 * 60 * 60 * 24))
    });
  };

  const loadReports = async () => {
    try {
      const stored = localStorage.getItem('uni_out_of_stock') || '[]';
      const data = JSON.parse(stored);
      // Filter only current period
      const today = new Date();
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay() + 1);

      const filtered = data.filter(r => new Date(r.createdAt) >= currentWeekStart);
      setReports(filtered);
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

  const handleAddReport = () => {
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
      reportedBy: 'Viewer',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const updated = [...reports, newReport];
      setReports(updated);
      localStorage.setItem('uni_out_of_stock', JSON.stringify(updated));

      setForm({ productCode: '', productName: '', notes: '' });
      setImagePreview(null);
      setSuggestions([]);
      notify(L('บันทึกรายการเรียบร้อย ✓', 'Report saved ✓'), 'success');
    } catch (e) {
      notify(L('เกิดข้อผิดพลาด', 'Error saving'), 'error');
      console.error('Save error:', e);
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
    tabsContainer: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '0.5px solid #ddd', paddingBottom: '1rem' },
    tab: (active) => ({
      background: 'none',
      border: 'none',
      padding: '0.5rem 1rem',
      fontSize: '14px',
      fontWeight: active ? '500' : '400',
      color: active ? '#0055cc' : '#666',
      borderBottom: active ? '2px solid #0055cc' : 'none',
      cursor: 'pointer'
    }),
    card: { background: '#fff', border: '0.5px solid #ddd', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' },
    header: { fontSize: '18px', fontWeight: '500', marginBottom: '1rem' },
    label: { display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: '500' },
    input: { width: '100%', padding: '8px 12px', border: '0.5px solid #ddd', borderRadius: '6px', fontSize: '14px', marginBottom: '1rem', fontFamily: 'inherit' },
    button: { background: '#0055cc', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '14px' },
    reportItem: { background: '#f9f9f9', border: '0.5px solid #ddd', borderRadius: '6px', padding: '1rem', marginBottom: '12px', display: 'flex', gap: '1rem' },
    thumbnail: { width: '60px', height: '60px', background: '#e8e8e8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
    periodHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' },
    topicBox: { background: '#f0f7ff', border: '0.5px solid #b3d9ff', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }
  };

  return (
    <div style={styles.container}>
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
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '500' }}>
                  📍 {L('สินค้าหมด', 'Out of stock')}
                </h3>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666' }}>
                  {L('ช่วง', 'Period')}: {currentPeriod?.start} - {currentPeriod?.end} (7 {L('วัน', 'days')})
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                <div>{reports.length} {L('รายการ', 'items')}</div>
                <div style={{ color: '#999', marginTop: '4px' }}>{L('รีเซ็ตในอีก', 'Reset in')} {currentPeriod?.daysLeft} {L('วัน', 'days')}</div>
              </div>
            </div>
            <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
              <strong>{L('ถ้าพบรายการยาที่หมดระหว่างการขายในช่วงนี้ รบกวนช่วยแนบรูปหรือพิมพ์ชื่อยาลงในโพสนี้ ขอบคุณครับ/ค่ะ', 'If you found any item out of stock during this period, please help to attach the photo or name of items in this post. Thank you!')}</strong><br/>
              <span style={{ color: '#666', display: 'block', marginTop: '8px' }}>🙏</span>
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
                placeholder={L('เช่น A001 หรือ พาราเซตามอล 500มก.', 'e.g., A001 or Paracetamol 500mg')}
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
                  background: '#fff',
                  border: '0.5px solid #ddd',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {suggestions.map(drug => (
                    <div
                      key={drug.code}
                      style={{
                        padding: '12px',
                        borderBottom: '0.5px solid #eee',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                      onClick={() => selectProduct(drug)}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ fontWeight: 500 }}>{drug.code} - {drug.nameTH || drug.nameEN}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{drug.nameEN}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label style={styles.label}>{L('รูปภาพสินค้า', 'Product image')} *</label>
            <div style={{
              border: '2px dashed #bbb',
              borderRadius: '6px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '1rem',
              background: imagePreview ? 'transparent' : '#fafafa'
            }} onClick={() => document.getElementById('imageInput').click()}>
              {imagePreview ? (
                <img src={imagePreview} style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px' }} />
              ) : (
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
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
              <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
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
                      {r.productCode && <span style={{ color: '#0055cc', fontWeight: '600' }}>{r.productCode}</span>} {r.productName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {L('แจ้งโดย', 'Reported by')}: {r.reportedBy} • {new Date(r.createdAt).toLocaleDateString('th-TH')} {r.timestamp}
                    </div>
                    {r.notes && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
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
          <div style={{ ...styles.card, background: '#fff3cd', border: '0.5px solid #ffc107', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <div>
                <strong style={{ fontSize: '14px' }}>{reports.length} {L('รายการสินค้าหมด', 'items out of stock')}</strong>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {L('แจ้งสำหรับช่วง', 'Reported for period')} {currentPeriod?.start} - {currentPeriod?.end}
                </div>
              </div>
            </div>
          </div>

          <h4 style={{ ...styles.header, marginBottom: '1rem' }}>📋 {L('รายการที่ต้องสั่ง', 'Items to reorder')}</h4>

          {reports.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
              {L('ไม่มีรายการที่หมดในช่วงนี้', 'No out of stock items this period')}
            </p>
          ) : (
            <div>
              {reports.map((r, idx) => (
                <div key={r.id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '500' }}>
                      {idx + 1}. {r.productCode && <span style={{ color: '#0055cc' }}>[{r.productCode}]</span>} {r.productName}
                    </div>
                    <span style={{ fontSize: '12px', background: '#fff3cd', color: '#856404', padding: '4px 12px', borderRadius: '4px' }}>
                      ⚠️ {L('หมด', 'Out')}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                    {L('แจ้งล่าสุด', 'Last reported')}: {new Date(r.createdAt).toLocaleDateString('th-TH')} •
                    {L('หมด stock ครั้งล่าสุด', 'Current stock')}: 0 {L('หน่วย', 'units')}
                  </div>
                  <button style={{ ...styles.button, background: '#17a2b8' }}>
                    → {L('สร้าง PO', 'Create PO')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div style={{ ...styles.card, marginTop: '2rem', background: '#f0f7ff' }}>
            <h5 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500' }}>📊 {L('สรุปสถิติ', 'Summary')}</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: '#666' }}>{L('รายการที่หมด', 'Items out')}</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: '#0055cc' }}>{reports.length}</div>
              </div>
              <div>
                <div style={{ color: '#666' }}>{L('สั้นสูตรชิด', 'High priority')}</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: '#ff6b6b' }}>
                  {reports.filter(r => !r.notes || r.notes.length < 50).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
