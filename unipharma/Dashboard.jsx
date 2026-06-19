// Dashboard.jsx
const { useState, useEffect, useMemo } = React;

function DashboardPage({ lang, L, drugs, orders, suppliers, setPage, setViewPO, setShowCreate }) {
  const lowStock = useMemo(() => drugs.filter(d => Object.values(d.stock).some(v => v <= d.minStock)), [drugs]);
  const pending = orders.filter(o => o.status === 'pending');
  const approved = orders.filter(o => o.status === 'approved');
  const thisMonth = '2026-06';
  const monthOrders = orders.filter(o => o.poDate?.startsWith(thisMonth) && o.status !== 'cancelled');
  const monthSpend = monthOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
  const totalStock = drugs.reduce((s, d) => s + d.totalStock, 0);
  const stockValue = drugs.reduce((s, d) => s + d.costEx * d.totalStock, 0);

  // Monthly spend chart data (last 6 months)
  const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.'];
  const enMonths = ['Jan','Feb','Mar','Apr','May','Jun'];
  const months = lang==='th' ? thMonths : enMonths;
  const monthKeys = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'];
  const ptnData = monthKeys.map(k => orders.filter(o => o.poDate?.startsWith(k) && o.branch==='PTN' && o.status!=='cancelled').reduce((s,o)=>s+o.grandTotal,0));
  const ramData = monthKeys.map(k => orders.filter(o => o.poDate?.startsWith(k) && o.branch==='RAM' && o.status!=='cancelled').reduce((s,o)=>s+o.grandTotal,0));
  const cnxData = monthKeys.map(k => orders.filter(o => o.poDate?.startsWith(k) && o.branch==='CNX' && o.status!=='cancelled').reduce((s,o)=>s+o.grandTotal,0));

  const spendChart = {
    labels: months,
    datasets: [
      { label: lang==='th'?'ประตูน้ำ (PTN)':'Pratu Nam (PTN)', data: ptnData, backgroundColor: 'rgba(17,119,204,.75)', borderColor: '#1177cc', borderWidth: 1.5, borderRadius: 4 },
      { label: lang==='th'?'รามคำแหง (RAM)':'Ramkhamhaeng (RAM)', data: ramData, backgroundColor: 'rgba(6,182,212,.75)', borderColor: '#06b6d4', borderWidth: 1.5, borderRadius: 4 },
      { label: lang==='th'?'เชียงใหม่ (CNX)':'Chiang Mai (CNX)', data: cnxData, backgroundColor: 'rgba(22,163,74,.75)', borderColor: '#16a34a', borderWidth: 1.5, borderRadius: 4 },
    ]
  };

  // Category breakdown
  const catSpend = {};
  drugs.forEach(d => {
    const cat = UTILS.getCat(d.catId);
    const k = lang === 'th' ? cat.name : cat.nameEN;
    catSpend[k] = (catSpend[k] || 0) + d.costEx * d.totalStock;
  });
  const catColors = ['#1177cc','#06b6d4','#16a34a','#d97706','#dc2626','#e5312a','#3399e8','#059669','#0284c7','#64748b'];
  const catLabels = Object.keys(catSpend).slice(0, 8);
  const pieChart = {
    labels: catLabels,
    datasets: [{ data: catLabels.map(k => +catSpend[k].toFixed(0)), backgroundColor: catColors, borderWidth: 0 }]
  };

  // Top 5 drugs by order count
  const top5 = [...drugs].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);

  // Recent POs
  const recentPOs = [...orders].sort((a, b) => new Date(b.poDate) - new Date(a.poDate)).slice(0, 6);

  const StatCard = ({ label, val, sub, color, icon, onClick }) => (
    <div className="stat-card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-val" style={color ? { color } : {}}>{val}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('ภาพรวมระบบ', 'System Dashboard')}</div>
          <div className="page-subtitle">UNIPHARMA — {UTILS.fmtDate('2026-06-14', lang)}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + {L('สร้างใบสั่งซื้อ', 'New Purchase Order')}
        </button>
      </div>

      {/* KPI STATS */}
      <div className="stat-grid">
        <StatCard label={L('ยอดสั่งซื้อเดือนนี้', 'This Month Spend')} val={'฿' + (monthSpend/1000).toFixed(0) + 'K'}
          sub={`${monthOrders.length} ${L('ใบสั่งซื้อ', 'orders')}`} icon="💰" color="var(--acc2)"
          onClick={() => setPage('reports')} />
        <StatCard label={L('รออนุมัติ', 'Pending Approval')} val={pending.length}
          sub={L('ใบสั่งซื้อ', 'purchase orders')} icon="⏳" color={pending.length > 0 ? 'var(--warn)' : 'var(--txt)'}
          onClick={() => setPage('orders')} />
        <StatCard label={L('สินค้าใกล้หมด', 'Low Stock Items')} val={lowStock.length}
          sub={L('รายการ ใน 3 สาขา', 'items across branches')} icon="📦" color={lowStock.length > 0 ? 'var(--err)' : 'var(--ok)'}
          onClick={() => setPage('stock')} />
        <StatCard label={L('มูลค่าสต็อกรวม', 'Total Stock Value')} val={'฿' + (stockValue/1000000).toFixed(2) + 'M'}
          sub={`${totalStock.toLocaleString()} ${L('หน่วย', 'units')}`} icon="🏪"
          onClick={() => setPage('stock')} />
        <StatCard label={L('จำนวนรายการยา', 'Drug Items')} val={drugs.length.toLocaleString()}
          sub={L('รายการในระบบ', 'items in system')} icon="💊"
          onClick={() => setPage('drugs')} />
        <StatCard label={L('ผู้จัดจำหน่าย', 'Suppliers')} val={suppliers.length}
          sub={L('ราย', 'suppliers')} icon="🏭" onClick={() => setPage('suppliers')} />
        <StatCard label={L('PO ที่อนุมัติแล้ว', 'Approved POs')} val={approved.length}
          sub={L('รอจัดส่ง', 'awaiting delivery')} icon="✅" color="var(--ok)"
          onClick={() => setPage('orders')} />
        <StatCard label={L('ราคาถัวเฉลี่ย/รายการ', 'Avg Cost/Item')} val={'฿' + UTILS.fmt(stockValue / Math.max(drugs.length, 1), 0)}
          sub={L('ต้นทุนเฉลี่ย', 'average cost')} icon="📈"
          onClick={() => setPage('reports')} />
      </div>

      {/* CHARTS ROW */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{L('ยอดสั่งซื้อรายเดือน (บาท)', 'Monthly Purchase Spend (THB)')}</span>
          </div>
          <ChartWidget type="bar" data={spendChart} options={{ plugins: { legend: { position: 'bottom' } } }} />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{L('มูลค่าสต็อกตามหมวดหมู่', 'Stock Value by Category')}</span>
          </div>
          <ChartWidget type="doughnut" data={pieChart} options={{ plugins: { legend: { position: 'right' } }, cutout: '60%' }} />
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid-2">
        {/* Top ordered drugs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{L('ยา 5 อันดับสั่งซื้อบ่อย', 'Top 5 Most Ordered Drugs')}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('reports')}>{L('ดูทั้งหมด', 'View All')}</button>
          </div>
          {top5.map((d, i) => (
            <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--acc2)', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ellipsis" style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : d.nameEN}</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{d.code} · {lang === 'th' ? UTILS.getCat(d.catId).name : UTILS.getCat(d.catId).nameEN}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--acc2)' }}>{d.orderCount}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{L('ครั้ง/ปี', 'times/yr')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent POs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{L('ใบสั่งซื้อล่าสุด', 'Recent Purchase Orders')}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('orders')}>{L('ดูทั้งหมด', 'View All')}</button>
          </div>
          {recentPOs.map((po, i) => {
            const sup = UTILS.getSupplier(po.supplierId);
            return (
              <div key={po.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < recentPOs.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                onClick={() => setViewPO(po)}>
                <BranchBadge branchId={po.branch} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{po.poNumber}</div>
                  <div className="ellipsis" style={{ fontSize: 11, color: 'var(--txt3)' }}>{lang==='th'?sup.name:sup.nameEN}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>฿{UTILS.fmt(po.grandTotal, 0)}</div>
                  <StatusBadge status={po.status} lang={lang} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LOW STOCK ALERT */}
      {lowStock.length > 0 && (
        <div className="card" style={{ marginTop: 20, borderColor: 'rgba(248,113,113,.3)', background: 'var(--err-bg)' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--err)' }}>⚠ {L('สินค้าใกล้หมดสต็อก', 'Low Stock Alert')} ({lowStock.length} {L('รายการ', 'items')})</span>
            <button className="btn btn-sm" style={{ background: 'var(--err)', color: '#fff' }} onClick={() => setPage('stock')}>{L('ดูทั้งหมด', 'View All')}</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {lowStock.slice(0, 6).map(d => (
              <div key={d.code} className="card-sm" style={{ flex: '1 1 180px', borderColor: 'rgba(248,113,113,.3)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--err)', marginBottom: 4 }} className="ellipsis">{lang === 'th' ? d.nameTH : d.nameEN}</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>{d.code}</div>
                {DB.BRANCHES.map(br => (
                  <div key={br.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: br.color }}>{br.id}</span>
                    <span style={{ color: d.stock[br.id] <= d.minStock ? 'var(--err)' : 'var(--txt3)', fontWeight: d.stock[br.id] <= d.minStock ? 700 : 400 }}>{d.stock[br.id].toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--txt4)', marginTop: 4 }}>Min: {d.minStock.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DashboardPage });
