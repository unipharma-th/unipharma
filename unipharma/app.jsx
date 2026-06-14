// app.jsx — Main App Shell + Routing
const { useState, useEffect, useCallback, useMemo } = React;

function App() {
  const [page, setPage] = useState(() => localStorage.getItem('uni_page') || 'dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('uni_lang') || 'th');
  const [theme, setTheme] = useState(() => localStorage.getItem('uni_theme') || 'light');
  const [drugs, setDrugs] = useState(() => {
    try { const s = localStorage.getItem('uni_drugs'); return s ? JSON.parse(s) : DB.DRUGS; } catch { return DB.DRUGS; }
  });
  const [suppliers, setSuppliers] = useState(() => {
    try { const s = localStorage.getItem('uni_suppliers'); return s ? JSON.parse(s) : DB.SUPPLIERS; } catch { return DB.SUPPLIERS; }
  });
  const [orders, setOrders] = useState(() => {
    try { const s = localStorage.getItem('uni_orders'); return s ? JSON.parse(s) : DB.PURCHASE_ORDERS; } catch { return DB.PURCHASE_ORDERS; }
  });
  const [viewPO, setViewPO] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [notification, setNotification] = useState(null);
  const [density, setDensity] = useState(() => localStorage.getItem('uni_density') || 'regular');
  const [colorScheme, setColorScheme] = useState(() => localStorage.getItem('uni_colors') || 'blue');

  // ── Auth ──
  // cloudOn  = Supabase configured (data syncs).
  // authOn   = login is actually enforced (REQUIRE_LOGIN flag in config.js).
  const cloudOn = !!(window.UNI_DB && window.UNI_DB.enabled);
  const authOn = !!(window.UNI_DB && window.UNI_DB.requireLogin);
  const [authReady, setAuthReady] = useState(!authOn); // not enforcing → ready immediately
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null); // { role, full_name, email }

  // Color schemes reshape the entire feel
  const SCHEMES = {
    blue: { accent: '#1177cc', accent2: '#06b6d4', ok: '#16a34a', err: '#dc2626', warn: '#d97706' },
    purple: { accent: '#7c3aed', accent2: '#a78bfa', ok: '#10b981', err: '#ef4444', warn: '#f59e0b' },
    emerald: { accent: '#059669', accent2: '#34d399', ok: '#0891b2', err: '#f87171', warn: '#fbbf24' },
    slate: { accent: '#475569', accent2: '#94a3b8', ok: '#22c55e', err: '#ef5350', warn: '#eab308' },
  };
  const colors = SCHEMES[colorScheme];

  // Density affects spacing, sizing
  const DENSITIES = {
    compact: { gap: '6px', cardPad: '10px', fontSize: '13px' },
    regular: { gap: '12px', cardPad: '16px', fontSize: '14px' },
    spacious: { gap: '20px', cardPad: '24px', fontSize: '15px' },
  };
  const dens = DENSITIES[density];

  // Persist state
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('uni_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('uni_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('uni_page', page); }, [page]);
  useEffect(() => { localStorage.setItem('uni_drugs', JSON.stringify(drugs)); }, [drugs]);
  useEffect(() => { localStorage.setItem('uni_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('uni_orders', JSON.stringify(orders)); }, [orders]);

  // Check the auth session on startup and subscribe to changes (only when enforcing login).
  useEffect(() => {
    if (!authOn) return;
    let unsub = () => {};
    (async () => {
      const s = await window.UNI_DB.getSession();
      setSession(s);
      if (s) setMe(await window.UNI_DB.getMyRole());
      setAuthReady(true);
    })();
    unsub = window.UNI_DB.onAuthChange(async (s) => {
      setSession(s);
      setMe(s ? await window.UNI_DB.getMyRole() : null);
    });
    return () => unsub();
  }, []);

  // Load shared data from the cloud. When login is enforced, wait until signed in.
  useEffect(() => {
    if (!cloudOn) return;            // offline → keep localStorage data
    if (authOn && !session) return;  // login required but not signed in yet
    let cancelled = false;
    window.UNI_DB.loadAll().then(data => {
      if (cancelled || !data) return;
      if (data.drugs && data.drugs.length) setDrugs(data.drugs);
      if (data.suppliers && data.suppliers.length) setSuppliers(data.suppliers);
      if (data.orders && data.orders.length) setOrders(data.orders);
      notify(L('โหลดข้อมูลล่าสุดจากคลาวด์แล้ว', 'Synced latest data from cloud'));
    });
    return () => { cancelled = true; };
  }, [session, authOn]);

  // Apply color & density tweaks via CSS variables
  useMemo(() => {
    const root = document.documentElement;
    root.style.setProperty('--acc', colors.accent);
    root.style.setProperty('--acc2', colors.accent2);
    root.style.setProperty('--ok', colors.ok);
    root.style.setProperty('--err', colors.err);
    root.style.setProperty('--warn', colors.warn);
    root.style.setProperty('--density-gap', dens.gap);
    root.style.setProperty('--density-pad', dens.cardPad);
    root.style.setProperty('--density-fs', dens.fontSize);
  }, [colorScheme, density, colors, dens]);

  const setDensityAndSave = (v) => { setDensity(v); localStorage.setItem('uni_density', v); };
  const setColorSchemeAndSave = (v) => { setColorScheme(v); localStorage.setItem('uni_colors', v); };

  const notify = useCallback((msg, type = 'ok') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const L = (th, en) => lang === 'th' ? th : en;

  const NAV = [
    { id: 'dashboard', icon: '▦', th: 'ภาพรวม', en: 'Dashboard' },
    { id: 'drugs', icon: '💊', th: 'ฐานข้อมูลยา', en: 'Drug Database' },
    { id: 'orders', icon: '📋', th: 'การสั่งซื้อ', en: 'Purchase Orders' },
    { id: 'suppliers', icon: '🏭', th: 'ผู้จัดจำหน่าย', en: 'Suppliers' },
    { id: 'comparison', icon: '⚖', th: 'เปรียบเทียบราคา', en: 'Price Comparison' },
    { id: 'stock', icon: '📦', th: 'ติดตามสินค้า', en: 'Stock Tracking' },
    { id: 'reports', icon: '📊', th: 'รายงาน', en: 'Reports' },
    { id: 'help', icon: '📖', th: 'คู่มือ', en: 'Guide' },
    { id: 'sync', icon: '🔄', th: 'ซิงค์ข้อมูล', en: 'Data Sync', adminOnly: true },
  ];

  const lowStockCount = drugs.filter(d => Object.values(d.stock).some(v => v <= d.minStock)).length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  // Permissions. When login isn't enforced → full control (current open mode).
  // When enforced → driven by the signed-in user's role.
  const role = me ? me.role : (authOn ? 'viewer' : 'admin');
  const perm = {
    role,
    canWrite: role === 'admin' || role === 'manager',
    canApprove: role === 'admin' || role === 'manager',
    canDelete: role === 'admin',
  };
  const roleLabel = { admin: L('ผู้ดูแลระบบ', 'Admin'), manager: L('ฝ่ายจัดซื้อ', 'Purchasing'), viewer: L('ดูอย่างเดียว', 'View-only') }[role] || role;

  const sharedProps = { lang, L, drugs, setDrugs, suppliers, setSuppliers, orders, setOrders, notify, setPage, setViewPO, setShowCreate, perm };

  // ── Auth gate (only when login is enforced) ──
  if (authOn && !authReady) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt3)', background: 'var(--bg0)' }}>{L('กำลังโหลด…', 'Loading…')}</div>;
  }
  if (authOn && !session) {
    return <LoginScreen L={L} onSignedIn={async () => { const s = await window.UNI_DB.getSession(); setSession(s); setMe(await window.UNI_DB.getMyRole()); }} />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* TWEAKS PANEL */}
      <TweaksPanel>
        <TweakSection label={L('ลักษณะการแสดงผล', 'Appearance')} />
        <TweakRadio label={L('สีหลัก', 'Color Scheme')} value={colorScheme}
          options={['blue', 'purple', 'emerald', 'slate']}
          onChange={setColorSchemeAndSave} />
        <TweakRadio label={L('ความหนาแน่น', 'Density')} value={density}
          options={['compact', 'regular', 'spacious']}
          onChange={setDensityAndSave} />
      </TweaksPanel>

      {/* TOP NAV */}
      <nav className="topnav">
        <a className="topnav-logo" href="#" onClick={e => { e.preventDefault(); setPage('dashboard'); }}>
          <img src="assets/logo.png" alt="Unipharma" />
          <div className="topnav-brand">
            <span>UNIPHARMA</span>
            <small>Purchasing System</small>
          </div>
        </a>

        <div className="topnav-nav">
          {NAV.filter(n => !n.adminOnly || perm.role === 'admin').map(n => (
            <button key={n.id} className={`nav-btn${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              {L(n.th, n.en)}
              {n.id === 'stock' && lowStockCount > 0 && (
                <span style={{ background: 'var(--err)', color: '#fff', borderRadius: 20, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{lowStockCount}</span>
              )}
              {n.id === 'orders' && pendingCount > 0 && (
                <span style={{ background: 'var(--warn)', color: '#000', borderRadius: 20, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="topnav-right">
          <button className="lang-toggle" onClick={() => setLang(l => l === 'th' ? 'en' : 'th')}>
            {lang === 'th' ? 'EN' : 'ไทย'}
          </button>
          <button className="icon-btn" title="Toggle theme" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          {perm.canWrite && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              + {L('สร้างใบสั่งซื้อ', 'New PO')}
            </button>
          )}
          {authOn && session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4, paddingLeft: 10, borderLeft: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'right', lineHeight: 1.2 }} title={me && me.email}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(me && (me.full_name || me.email)) || ''}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{roleLabel}</div>
              </div>
              <button className="icon-btn" title={L('ออกจากระบบ', 'Sign out')} onClick={async () => { await window.UNI_DB.signOut(); setSession(null); setMe(null); }}>⏏</button>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="main-layout">
        {(page === 'dashboard' || (page === 'sync' && perm.role !== 'admin')) && <DashboardPage {...sharedProps} />}
        {page === 'drugs' && <DrugsPage {...sharedProps} />}
        {page === 'orders' && <OrdersPage {...sharedProps} />}
        {page === 'suppliers' && <SuppliersPage {...sharedProps} />}
        {page === 'comparison' && <ComparisonPage {...sharedProps} />}
        {page === 'stock' && <StockPage {...sharedProps} />}
        {page === 'reports' && <ReportsPage {...sharedProps} />}
        {page === 'help' && <HelpPage lang={lang} L={L} perm={perm} />}
        {page === 'sync' && perm.role === 'admin' && <DataSyncPage lang={lang} L={L} drugs={drugs} setDrugs={setDrugs} suppliers={suppliers} setSuppliers={setSuppliers} notify={notify} perm={perm} />}
      </div>

      {/* CREATE PO MODAL */}
      {showCreate && perm.canWrite && (
        <CreatePOModal {...sharedProps} onClose={() => setShowCreate(false)}
          onCreated={po => { setOrders(prev => [po, ...prev]); setShowCreate(false); setViewPO(po); if (window.UNI_DB) window.UNI_DB.savePO(po); notify(L('สร้างใบสั่งซื้อสำเร็จ', 'PO created successfully')); }} />
      )}

      {/* PO DOCUMENT VIEWER */}
      {viewPO && (
        <PODocumentModal po={viewPO} lang={lang} L={L} suppliers={suppliers} onClose={() => setViewPO(null)} />
      )}

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: notification.type === 'ok' ? 'var(--ok)' : notification.type === 'err' ? 'var(--err)' : 'var(--warn)',
          color: '#fff', padding: '10px 18px', borderRadius: 'var(--r2)', boxShadow: 'var(--shadow2)',
          fontSize: 13, fontWeight: 600, animation: 'fadeIn .2s ease'
        }}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
