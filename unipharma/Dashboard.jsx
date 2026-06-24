// Dashboard.jsx
const { useState, useEffect, useMemo } = React;

function DashboardPage({ lang, L, drugs, orders, suppliers, setPage, setViewPO, setShowCreate }) {
  const lowStock = useMemo(() => drugs.filter(d => Object.values(d.stock || {}).some(v => v <= d.minStock)), [drugs]);

  // All order-derived stats memoized together — single pass over orders
  const orderStats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthKeys = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      monthKeys.push(d.toISOString().slice(0, 7));
    }
    const ptn = monthKeys.map(() => 0), ram = [...ptn.map(()=>0)], cnx = [...ptn.map(()=>0)];
    let pending = 0, approved = 0, monthSpend = 0, monthOrderCount = 0;
    orders.forEach(o => {
      if (o.status === 'pending') pending++;
      if (o.status === 'approved') approved++;
      if (o.status === 'cancelled') return;
      const ki = monthKeys.indexOf(o.poDate?.slice(0, 7));
      if (ki >= 0) {
        const t = o.grandTotal || 0;
        if (o.branch === 'PTN') ptn[ki] += t;
        else if (o.branch === 'RAM') ram[ki] += t;
        else if (o.branch === 'CNX') cnx[ki] += t;
      }
      if (o.poDate?.startsWith(thisMonth)) { monthSpend += o.grandTotal || 0; monthOrderCount++; }
    });
    return { pending, approved, monthSpend, monthOrderCount, monthKeys, ptnData: ptn, ramData: ram, cnxData: cnx };
  }, [orders]);

  const { pending, approved, monthSpend, monthOrderCount, monthKeys, ptnData, ramData, cnxData } = orderStats;

  // Drug totals — single reduce pass
  const drugTotals = useMemo(() => {
    let totalStock = 0, stockValue = 0;
    drugs.forEach(d => { totalStock += d.totalStock || 0; stockValue += (d.costEx || 0) * (d.totalStock || 0); });
    return { totalStock, stockValue };
  }, [drugs]);
  const { totalStock, stockValue } = drugTotals;

  // Monthly spend chart data (last 6 months, dynamic)
  const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const enMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = monthKeys.map(k => { const m = parseInt(k.slice(5)) - 1; return lang === 'th' ? thMonths[m] : enMonths[m]; });

  const spendChart = {
    labels: months,
    datasets: [
      { label: lang==='th'?'ประตูน้ำ (PTN)':'Pratu Nam (PTN)', data: ptnData, backgroundColor: 'rgba(17,119,204,.75)', borderColor: '#1177cc', borderWidth: 1.5, borderRadius: 4 },
      { label: lang==='th'?'รามคำแหง (RAM)':'Ramkhamhaeng (RAM)', data: ramData, backgroundColor: 'rgba(6,182,212,.75)', borderColor: '#06b6d4', borderWidth: 1.5, borderRadius: 4 },
      { label: lang==='th'?'เชียงใหม่ (CNX)':'Chiang Mai (CNX)', data: cnxData, backgroundColor: 'rgba(22,163,74,.75)', borderColor: '#16a34a', borderWidth: 1.5, borderRadius: 4 },
    ]
  };

  // Category breakdown — label + colour come from the live category list,
  // so it always reflects the current (and edited) categories.
  // Falls back to SKU count when no cost prices are filled in (value all zero).
  const catMap = {}; // catId -> { label, value, count, color }
  drugs.forEach(d => {
    const cat = UTILS.getCat(d.catId);
    if (!catMap[d.catId]) catMap[d.catId] = { label: lang === 'th' ? cat.name : (cat.nameEN || cat.name), value: 0, count: 0, color: cat.color || '#94a3b8' };
    catMap[d.catId].value += (d.costEx || 0) * (d.totalStock || 0);
    catMap[d.catId].count += 1;
  });
  const totalCatValue = Object.values(catMap).reduce((s, c) => s + c.value, 0);
  const pieByCount = totalCatValue === 0;
  const catArr = Object.values(catMap)
    .filter(c => pieByCount ? c.count > 0 : c.value > 0)
    .sort((a, b) => pieByCount ? b.count - a.count : b.value - a.value)
    .slice(0, 12);
  const pieChart = {
    labels: catArr.map(c => c.label),
    datasets: [{ data: catArr.map(c => pieByCount ? c.count : +c.value.toFixed(0)), backgroundColor: catArr.map(c => c.color), borderWidth: 0 }]
  };

  // Drug counts per category / subcategory for the overview panel
  const catStats = useMemo(() => {
    const byMain = {}, bySub = {};
    drugs.forEach(d => {
      byMain[d.catId] = (byMain[d.catId] || 0) + 1;
      if (d.subId) bySub[d.subId] = (bySub[d.subId] || 0) + 1;
    });
    return { byMain, bySub };
  }, [drugs]);

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
          sub={`${monthOrderCount} ${L('ใบสั่งซื้อ', 'orders')}`} icon="💰" color="var(--acc2)"
          onClick={() => setPage('reports')} />
        <StatCard label={L('รออนุมัติ', 'Pending Approval')} val={pending}
          sub={L('ใบสั่งซื้อ', 'purchase orders')} icon="⏳" color={pending > 0 ? 'var(--warn)' : 'var(--txt)'}
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
        <StatCard label={L('PO ที่อนุมัติแล้ว', 'Approved POs')} val={approved}
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
            <span className="card-title">{pieByCount ? L('จำนวนรายการยาตามหมวดหมู่', 'Drug Count by Category') : L('มูลค่าสต็อกตามหมวดหมู่', 'Stock Value by Category')}</span>
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
                <div className="ellipsis" style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
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
                  <div className="ellipsis" style={{ fontSize: 11, color: 'var(--txt3)' }}>{lang==='th'?sup.name:(sup.nameEN||sup.name)}</div>
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
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--err)', marginBottom: 4 }} className="ellipsis">{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
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

      {/* CATEGORY OVERVIEW */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">{L('หมวดหมู่ยาทั้งหมด', 'All Drug Categories')}</span>
          <span style={{ fontSize: 12, color: 'var(--txt3)' }}>
            {DB.CATEGORIES.length} {L('หมวดหลัก', 'main')} · {DB.CATEGORIES.reduce((n, c) => n + c.subs.length, 0)} {L('หมวดรอง', 'sub')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
          {DB.CATEGORIES.map(cat => {
            const mainCount = catStats.byMain[cat.id] || 0;
            return (
              <div key={cat.id} style={{ borderRadius: 8, border: '1px solid var(--border)', borderLeft: `4px solid ${cat.color}`, padding: '10px 12px', background: 'var(--bg2)', cursor: 'pointer' }}
                onClick={() => setPage('drugs')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: cat.color, marginBottom: 2, letterSpacing: .3 }}>{cat.id}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35, color: 'var(--txt)' }}>{lang === 'th' ? cat.name : cat.nameEN}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: cat.color, flexShrink: 0, lineHeight: 1 }}>
                    {mainCount.toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {cat.subs.map(sub => {
                    const subCount = catStats.bySub[sub.id] || 0;
                    return (
                      <span key={sub.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'var(--bg3)', color: 'var(--txt3)', lineHeight: 1.6 }}>
                        {lang === 'th' ? sub.name : sub.nameEN}
                        {subCount > 0 && (
                          <span style={{ fontWeight: 700, color: cat.color }}>{subCount}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage });
