// Reports.jsx — Reports & Analytics Page
const { useState, useMemo } = React;

function ReportsPage({ lang, L, drugs, orders, suppliers }) {
  const [activeTab, setActiveTab] = useState('movement');
  const [branchFilter, setBranchFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [openPO, setOpenPO] = useState(null);

  const months = useMemo(() => {
    const s = new Set(orders.map(o => o.poDate?.slice(0, 7)).filter(Boolean));
    return [...s].sort().reverse();
  }, [orders]);

  // Top 10 most ordered drugs
  const top10 = useMemo(() => [...drugs].sort((a, b) => b.orderCount - a.orderCount).slice(0, 10), [drugs]);

  // Bottom 10 (never/rarely ordered)
  const bottom10 = useMemo(() => [...drugs].sort((a, b) => a.orderCount - b.orderCount).slice(0, 10), [drugs]);

  // Monthly movement by branch
  const monthOrders = useMemo(() => {
    const natCmp = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    let list = orders.filter(o => o.status !== 'cancelled' && o.status !== 'draft');
    if (monthFilter) list = list.filter(o => o.poDate?.startsWith(monthFilter));
    if (branchFilter) list = list.filter(o => o.branch === branchFilter);
    return list.sort((a, b) => natCmp.compare(a.poNumber || '', b.poNumber || ''));
  }, [orders, monthFilter, branchFilter]);

  const monthTotal = monthOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
  const monthVat = monthOrders.reduce((s, o) => s + (o.vat || 0), 0);
  const monthItems = monthOrders.reduce((s, o) => s + (o.items?.length || 0), 0);

  // Spend by supplier
  const bySupplier = useMemo(() => {
    const map = {};
    monthOrders.forEach(o => {
      map[o.supplierId] = (map[o.supplierId] || 0) + (o.grandTotal || 0);
    });
    return Object.entries(map).map(([id, total]) => ({ supplier: UTILS.getSupplier(id), total })).sort((a, b) => b.total - a.total);
  }, [monthOrders]);

  // Spend by branch
  const byBranch = useMemo(() => {
    return DB.BRANCHES.map(br => ({
      branch: br,
      total: orders.filter(o => o.branch === br.id && o.status !== 'cancelled' && o.status !== 'draft' && (!monthFilter || o.poDate?.startsWith(monthFilter))).reduce((s, o) => s + (o.grandTotal || 0), 0),
      count: orders.filter(o => o.branch === br.id && o.status !== 'cancelled' && (!monthFilter || o.poDate?.startsWith(monthFilter))).length
    }));
  }, [orders, monthFilter]);

  // Chart data — dynamic: last 6 months from today
  const { monthLabels, monthKeys } = useMemo(() => {
    const TH_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const keys = [], labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
      labels.push(lang === 'th' ? TH_MONTHS[d.getMonth()] : EN_MONTHS[d.getMonth()]);
    }
    return { monthKeys: keys, monthLabels: labels };
  }, [lang]);
  const totalByMonth = monthKeys.map(k => orders.filter(o => o.poDate?.startsWith(k) && o.status !== 'cancelled' && o.status !== 'draft').reduce((s, o) => s + (o.grandTotal || 0), 0));

  const trendChart = {
    labels: monthLabels,
    datasets: [{ label: L('ยอดสั่งซื้อ (บาท)', 'Purchase Spend (THB)'), data: totalByMonth, fill: true, backgroundColor: 'rgba(17,119,204,.12)', borderColor: '#1177cc', borderWidth: 2, tension: 0.4, pointBackgroundColor: '#8b5cf6' }]
  };

  const catSpendData = useMemo(() => {
    const map = {};
    monthOrders.forEach(po => {
      (po.items || []).forEach(it => {
        const drug = UTILS.getDrug(it.code);
        if (!drug) return;
        const cat = UTILS.getCat(drug.catId);
        const k = lang === 'th' ? cat.name : cat.nameEN;
        map[k] = (map[k] || 0) + (it.amount || 0);
      });
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      labels: sorted.map(([k]) => k),
      datasets: [{ data: sorted.map(([, v]) => +v.toFixed(0)), backgroundColor: ['#1177cc','#06b6d4','#16a34a','#d97706','#dc2626','#e5312a','#3399e8','#059669'], borderWidth: 0 }]
    };
  }, [monthOrders, lang]);

  const branchChart = {
    labels: byBranch.map(b => lang==='th' ? b.branch.name : b.branch.nameEN),
    datasets: [{ label: L('ยอดสั่งซื้อ', 'Spend'), data: byBranch.map(b => b.total), backgroundColor: byBranch.map(b => b.branch.color + 'cc'), borderColor: byBranch.map(b => b.branch.color), borderWidth: 2, borderRadius: 6 }]
  };

  // ── 2-Month History ──────────────────────────────────────────
  const H2M_SUP_COLORS = ['#38bdf8','#4ade80','#a78bfa','#fbbf24','#fb923c','#f87171','#34d399','#e879f9'];
  const TH_MONTHS_H = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const EN_MONTHS_H = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const h2mCutoff = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().slice(0, 10);
  }, []);

  const history2m = useMemo(() =>
    orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'draft' && (o.poDate || '') >= h2mCutoff)
      .sort((a, b) => (b.poDate || '').localeCompare(a.poDate || '')),
    [orders, h2mCutoff]);

  const h2mByMonth = useMemo(() => {
    const m = {};
    history2m.forEach(o => {
      const k = (o.poDate || '').slice(0, 7);
      if (!m[k]) m[k] = [];
      m[k].push(o);
    });
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  }, [history2m]);

  const h2mTotal   = history2m.reduce((s, o) => s + (o.grandTotal || 0), 0);
  const h2mSupIds  = [...new Set(history2m.map(o => o.supplierId).filter(Boolean))];
  const h2mLines   = history2m.reduce((s, o) => s + (o.items?.length || 0), 0);
  const h2mUniqDrugs = new Set(history2m.flatMap(o => (o.items || []).map(it => it.code))).size;

  const h2mBySupplier = useMemo(() => {
    const m = {};
    history2m.forEach(o => {
      if (!o.supplierId) return;
      if (!m[o.supplierId]) m[o.supplierId] = { id: o.supplierId, total: 0, count: 0 };
      m[o.supplierId].total += o.grandTotal || 0;
      m[o.supplierId].count++;
    });
    return Object.values(m)
      .sort((a, b) => b.total - a.total)
      .map((row, i) => ({ ...row, sup: UTILS.getSupplier(row.id), color: H2M_SUP_COLORS[i % H2M_SUP_COLORS.length] }));
  }, [history2m]);

  const h2mMaxSpend = h2mBySupplier[0]?.total || 1;

  function h2mMonthLabel(ym) {
    const [y, m] = ym.split('-');
    const idx = parseInt(m, 10) - 1;
    const monthStr = lang === 'th' ? TH_MONTHS_H[idx] : EN_MONTHS_H[idx];
    const yearBE = lang === 'th' ? (parseInt(y, 10) + 543) : parseInt(y, 10);
    return `${monthStr} ${yearBE}`;
  }

  const TABS = [
    { id: 'movement', label: L('รายงานการเคลื่อนไหว', 'Movement Report') },
    { id: 'top10', label: L('Top 10 สั่งบ่อย', 'Top 10 Ordered') },
    { id: 'bottom10', label: L('10 ไม่ได้สั่ง', '10 Rarely Ordered') },
    { id: 'supplier', label: L('ผู้จัดจำหน่าย', 'Supplier Analysis') },
    { id: 'history2m', label: L('📋 ประวัติ 2 เดือน', '📋 2-Month History') },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('รายงาน', 'Reports & Analytics')}</div>
          <div className="page-subtitle">{L('วิเคราะห์การสั่งซื้อและการเคลื่อนไหวสินค้า', 'Purchase orders & stock movement analysis')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input input-sm" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="">{L('ทุกเดือน', 'All Months')}</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input input-sm" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="">{L('ทุกสาขา', 'All Branches')}</option>
            {DB.BRANCHES.map(b => <option key={b.id} value={b.id}>{lang==='th'?b.name:b.nameEN}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">{L('ยอดรวมช่วงที่เลือก', 'Period Total')}</div>
          <div className="stat-val" style={{ color: 'var(--acc2)' }}>฿{(monthTotal / 1000).toFixed(0)}K</div>
          <div className="stat-sub">{monthOrders.length} {L('ใบสั่งซื้อ', 'orders')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{L('VAT รวม', 'Total VAT')}</div>
          <div className="stat-val">฿{UTILS.fmt(monthVat, 0)}</div>
          <div className="stat-sub">{L('ภาษีมูลค่าเพิ่ม', 'Value added tax')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{L('รายการสินค้ารวม', 'Total Line Items')}</div>
          <div className="stat-val">{monthItems.toLocaleString()}</div>
          <div className="stat-sub">{L('รายการในใบสั่งซื้อ', 'PO line items')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{L('เฉลี่ย/ใบสั่งซื้อ', 'Avg per PO')}</div>
          <div className="stat-val">฿{UTILS.fmt(monthOrders.length ? monthTotal / monthOrders.length : 0, 0)}</div>
          <div className="stat-sub">{L('ยอดเฉลี่ย', 'average order value')}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card" style={{ gridColumn: '1 / 3' }}>
          <div className="card-header"><span className="card-title">{L('แนวโน้มยอดสั่งซื้อรายเดือน', 'Monthly Purchase Trend')}</span></div>
          <ChartWidget type="line" data={trendChart} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">{L('สัดส่วนตามหมวดหมู่', 'By Category')}</span></div>
          <ChartWidget type="doughnut" data={catSpendData} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }, cutout: '55%' }} height={200} />
        </div>
      </div>

      {/* Branch Comparison */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">{L('เปรียบเทียบยอดสั่งซื้อตามสาขา', 'Branch Purchase Comparison')}</span></div>
        <div className="grid-2">
          <ChartWidget type="bar" data={branchChart} options={{ plugins: { legend: { display: false } } }} height={160} />
          <div>
            {byBranch.map(item => (
              <div key={item.branch.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.branch.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{lang==='th' ? item.branch.name : item.branch.nameEN}</div>
                  <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, marginTop: 4 }}>
                    <div style={{ height: '100%', width: monthTotal > 0 ? (item.total / monthTotal * 100) + '%' : '0%', background: item.branch.color, borderRadius: 3, transition: '.5s' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>฿{(item.total / 1000).toFixed(0)}K</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{item.count} {L('ใบ', 'orders')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {TABS.map(t => <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
      </div>

      {/* Tab: Movement */}
      {activeTab === 'movement' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tbl-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>{L('เลข PO', 'PO No.')}</th>
                  <th>{L('สาขา', 'Branch')}</th>
                  <th>{L('ผู้จัดจำหน่าย', 'Supplier')}</th>
                  <th>{L('วันที่', 'Date')}</th>
                  <th style={{ textAlign: 'right' }}>{L('Gross', 'Gross')}</th>
                  <th style={{ textAlign: 'right' }}>{L('ไม่มี VAT', 'Non-VAT')}</th>
                  <th style={{ textAlign: 'right' }}>{L('มี VAT', 'Taxable')}</th>
                  <th style={{ textAlign: 'right' }}>VAT</th>
                  <th style={{ textAlign: 'right' }}>{L('ยอดสุทธิ', 'Net')}</th>
                  <th>{L('สถานะ', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {monthOrders.length === 0 && <tr><td colSpan={10} className="no-data">{L('ไม่พบข้อมูล', 'No data')}</td></tr>}
                {monthOrders.map(po => (
                  <tr key={po.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{po.poNumber}</td>
                    <td><BranchBadge branchId={po.branch} /></td>
                    <td style={{ fontSize: 12 }} className="ellipsis">{lang==='th'?UTILS.getSupplier(po.supplierId).name:(UTILS.getSupplier(po.supplierId).nameEN||UTILS.getSupplier(po.supplierId).name)}</td>
                    <td style={{ fontSize: 12 }}>{UTILS.fmtDate(po.poDate, lang)}</td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(po.grossTotal, 0)}</td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(po.nonTaxableAmt ?? po.nonTaxable ?? 0, 0)}</td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(po.taxableAmt ?? po.taxable ?? 0, 0)}</td>
                    <td className="tbl-num" style={{ fontSize: 12, color: 'var(--info)' }}>{UTILS.fmt(po.vat || 0, 0)}</td>
                    <td className="tbl-num" style={{ fontWeight: 700 }}>฿{UTILS.fmt(po.grandTotal, 0)}</td>
                    <td><StatusBadge status={po.status} lang={lang} /></td>
                  </tr>
                ))}
              </tbody>
              {monthOrders.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--bg3)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '10px 12px', fontSize: 12 }}>{L('รวมทั้งหมด', 'Grand Total')} ({monthOrders.length} {L('รายการ', 'orders')})</td>
                    <td className="tbl-num">{UTILS.fmt(monthOrders.reduce((s, o) => s + (o.grossTotal || 0), 0), 0)}</td>
                    <td className="tbl-num">{UTILS.fmt(monthOrders.reduce((s, o) => s + (o.nonTaxableAmt ?? o.nonTaxable ?? 0), 0), 0)}</td>
                    <td className="tbl-num">{UTILS.fmt(monthOrders.reduce((s, o) => s + (o.taxableAmt ?? o.taxable ?? 0), 0), 0)}</td>
                    <td className="tbl-num" style={{ color: 'var(--info)' }}>{UTILS.fmt(monthVat, 0)}</td>
                    <td className="tbl-num" style={{ color: 'var(--acc2)', fontSize: 14 }}>฿{UTILS.fmt(monthTotal, 0)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab: Top 10 */}
      {activeTab === 'top10' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="tbl-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>#</th><th>{L('รหัส', 'Code')}</th><th>{L('ชื่อยา', 'Drug Name')}</th><th>{L('หมวด', 'Category')}</th><th style={{ textAlign: 'right' }}>{L('จำนวนครั้งสั่ง/ปี', 'Orders/Yr')}</th><th style={{ textAlign: 'right' }}>{L('ต้นทุน', 'Cost')}</th><th style={{ textAlign: 'right' }}>{L('ราคาขาย', 'Sell')}</th><th style={{ textAlign: 'right' }}>{L('กำไร%', 'Margin%')}</th></tr></thead>
              <tbody>
                {top10.map((d, i) => (
                  <tr key={d.code}>
                    <td>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? 'var(--acc)' : 'var(--bg4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{i + 1}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{d.code}</td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getUnit(d.unit, lang)}</div>
                    </td>
                    <td><span style={{ fontSize: 11, color: UTILS.getCat(d.catId).color }}>{lang === 'th' ? UTILS.getCat(d.catId).name : UTILS.getCat(d.catId).nameEN}</span></td>

                    <td className="tbl-num">
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--acc2)' }}>{d.orderCount}</div>
                      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, marginTop: 3 }}>
                        <div style={{ height: '100%', width: (d.orderCount / top10[0].orderCount * 100) + '%', background: 'var(--acc)', borderRadius: 2 }} />
                      </div>
                    </td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(d.costEx)} ฿</td>
                    <td className="tbl-num" style={{ fontSize: 12 }}>{UTILS.fmt(d.sellEx)} ฿</td>
                    <td className="tbl-num" style={{ color: 'var(--ok)', fontWeight: 700 }}>{d.profitMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Bottom 10 */}
      {activeTab === 'bottom10' && (
        <div>
          <div className="card" style={{ padding: 14, marginBottom: 14, borderColor: 'rgba(251,191,36,.3)', background: 'var(--warn-bg)' }}>
            <div style={{ fontSize: 13, color: 'var(--warn)' }}>⚠ {L('รายการสินค้าที่ไม่มีการสั่งซื้อหรือสั่งซื้อน้อยมาก อาจควรพิจารณาตัดออกจากระบบ', 'Products with zero or minimal orders — consider reviewing or removing from catalog')}</div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table>
                <thead><tr><th>#</th><th>{L('รหัส', 'Code')}</th><th>{L('ชื่อยา', 'Drug Name')}</th><th>{L('หมวด', 'Category')}</th><th style={{ textAlign: 'right' }}>{L('ครั้งสั่ง/ปี', 'Orders/Yr')}</th><th style={{ textAlign: 'right' }}>{L('สต็อกรวม', 'Total Stock')}</th><th>{L('สั่งครั้งล่าสุด', 'Last Ordered')}</th><th>{L('ผู้จำหน่าย', 'Supplier')}</th></tr></thead>
                <tbody>
                  {bottom10.map((d, i) => (
                    <tr key={d.code}>
                      <td style={{ color: 'var(--txt3)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--warn)' }}>{d.code}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getUnit(d.unit, lang)}</div>
                      </td>
                      <td><span style={{ fontSize: 11, color: UTILS.getCat(d.catId).color }}>{lang === 'th' ? UTILS.getCat(d.catId).name : UTILS.getCat(d.catId).nameEN}</span></td>
                      <td className="tbl-num" style={{ fontWeight: 700, color: d.orderCount === 0 ? 'var(--err)' : 'var(--warn)' }}>{d.orderCount}</td>
                      <td className="tbl-num" style={{ fontSize: 12 }}>{d.totalStock.toLocaleString()}</td>
                      <td style={{ fontSize: 12, color: 'var(--txt3)' }}>{UTILS.fmtDate(d.lastOrdered, lang)}</td>
                      <td style={{ fontSize: 11 }} className="ellipsis">{lang==='th'?UTILS.getSupplier(d.supplierId).name:(UTILS.getSupplier(d.supplierId).nameEN||UTILS.getSupplier(d.supplierId).name)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Supplier Analysis */}
      {activeTab === 'supplier' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="tbl-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>#</th><th>{L('ผู้จัดจำหน่าย', 'Supplier')}</th><th style={{ textAlign: 'right' }}>{L('ยอดสั่งซื้อ', 'Spend')}</th><th style={{ textAlign: 'right' }}>{L('จำนวนใบ', 'Orders')}</th><th style={{ textAlign: 'right' }}>{L('เฉลี่ย/ใบ', 'Avg/PO')}</th><th>{L('เครดิต', 'Credit')}</th><th style={{ textAlign: 'center' }}>{L('คะแนน', 'Rating')}</th><th>{L('โปรโมชั่น', 'Promotions')}</th></tr></thead>
              <tbody>
                {bySupplier.length === 0 && <tr><td colSpan={8} className="no-data">{L('ไม่พบข้อมูล', 'No data')}</td></tr>}
                {bySupplier.map((item, i) => {
                  const supOrders = monthOrders.filter(o => o.supplierId === item.supplier.id);
                  const sup = suppliers.find(s => s.id === item.supplier.id) || {};
                  return (
                    <tr key={item.supplier.id}>
                      <td style={{ fontWeight: 800, color: i < 3 ? 'var(--acc2)' : 'var(--txt3)' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{lang==='th'?item.supplier.name:(item.supplier.nameEN||item.supplier.name)}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getSupCat(sup.category||'', lang)}</div>
                      </td>
                      <td className="tbl-num">
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--acc2)' }}>฿{(item.total / 1000).toFixed(0)}K</div>
                        <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, marginTop: 4, minWidth: 60 }}>
                          <div style={{ height: '100%', width: bySupplier[0]?.total > 0 ? (item.total / bySupplier[0].total * 100) + '%' : '0%', background: 'var(--acc)', borderRadius: 2 }} />
                        </div>
                      </td>
                      <td className="tbl-num" style={{ fontWeight: 700 }}>{supOrders.length}</td>
                      <td className="tbl-num" style={{ fontSize: 12 }}>฿{UTILS.fmt(supOrders.length ? item.total / supOrders.length : 0, 0)}</td>
                      <td style={{ fontSize: 12 }}>{sup.creditTerm} {L('วัน', 'days')}</td>
                      <td style={{ textAlign: 'center' }}><RatingStars rating={sup.rating || 0} /></td>
                      <td style={{ fontSize: 11 }}>
                        {(sup.promotions || []).map(p => (
                          <div key={p.id} style={{ color: 'var(--ok)', background: 'var(--ok-bg)', borderRadius: 3, padding: '1px 6px', marginBottom: 2, fontSize: 10 }}>{p.name}</div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: 2-Month Purchase History ───────────────────────── */}
      {activeTab === 'history2m' && (
        <div>
          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            {[
              [L('ใบสั่งซื้อ','POs'), history2m.length, 'var(--acc2)'],
              [L('ยอดรวม (excl.VAT)','Total Spend'), '฿'+UTILS.fmt(h2mTotal,0), 'var(--ok)'],
              [L('ซัพพลายเออร์','Suppliers'), h2mSupIds.length, 'var(--warn)'],
              [L('รายการยาไม่ซ้ำ','Unique Drugs'), h2mUniqDrugs, 'var(--acc)'],
            ].map(([lbl, val, clr]) => (
              <div key={lbl} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontSize:20, fontWeight:800, color:clr, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:11, color:'var(--txt3)', marginTop:6 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Spend by supplier bar chart */}
          {h2mBySupplier.length > 0 && (
            <div className="card" style={{ marginBottom:16 }}>
              <div className="card-header"><span className="card-title">{L('ยอดสั่งซื้อแยกซัพพลายเออร์','Spend by Supplier')}</span></div>
              <div style={{ padding:'4px 0' }}>
                {h2mBySupplier.map(row => {
                  const name = row.sup ? (lang==='th' ? row.sup.name : (row.sup.nameEN||row.sup.name)) : row.id;
                  const pct  = (row.total / h2mTotal * 100).toFixed(1);
                  const barW = (row.total / h2mMaxSpend * 100).toFixed(1);
                  return (
                    <div key={row.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ width:140, fontSize:12, color:'var(--txt2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:0 }} title={name}>{name}</div>
                      <div style={{ flex:1, height:22, background:'var(--bg4)', borderRadius:4, overflow:'hidden', position:'relative' }}>
                        <div style={{ width:barW+'%', height:'100%', background:row.color, borderRadius:4, display:'flex', alignItems:'center', paddingLeft:8, transition:'width .4s' }}>
                          <span style={{ fontSize:11, fontWeight:700, color:'#fff', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>฿{UTILS.fmt(row.total,0)}</span>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:'var(--txt3)', width:36, textAlign:'right', flexShrink:0 }}>{pct}%</div>
                      <div style={{ fontSize:11, color:'var(--txt3)', width:26, textAlign:'right', flexShrink:0 }}>{row.count} {L('ใบ','POs')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PO list grouped by month */}
          {history2m.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:40, color:'var(--txt3)' }}>
              {L('ไม่มีข้อมูลการสั่งซื้อในช่วง 2 เดือนที่ผ่านมา','No purchase orders in the last 2 months')}
            </div>
          ) : h2mByMonth.map(([ym, pos]) => (
            <div key={ym} style={{ marginBottom:20 }}>
              {/* Month separator */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--txt2)', whiteSpace:'nowrap' }}>{h2mMonthLabel(ym)}</span>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
                <span style={{ fontSize:11, color:'var(--txt3)', whiteSpace:'nowrap' }}>
                  {pos.length} {L('ใบ','POs')} · ฿{UTILS.fmt(pos.reduce((s,o)=>s+(o.grandTotal||0),0),0)}
                </span>
              </div>

              {/* PO rows */}
              <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                {pos.map((po, idx) => {
                  const sup     = UTILS.getSupplier(po.supplierId);
                  const supName = sup ? (lang==='th' ? sup.name : (sup.nameEN||sup.name)) : (po.supplierId || '-');
                  const supClr  = h2mBySupplier.find(r => r.id === po.supplierId)?.color || 'var(--txt2)';
                  const isOpen  = openPO === po.id;
                  const isLast  = idx === pos.length - 1;
                  return (
                    <div key={po.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                      {/* Header row */}
                      <div
                        onClick={() => setOpenPO(isOpen ? null : po.id)}
                        style={{ display:'grid', gridTemplateColumns:'100px 1fr 110px 110px 80px', alignItems:'center', gap:8, padding:'12px 16px', cursor:'pointer', background: isOpen ? 'var(--acc-bg)' : '', transition:'background .1s' }}
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background='var(--bg3)'; }}
                        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background=''; }}
                      >
                        <div>
                          <div style={{ fontSize:12, color:'var(--txt3)', fontVariantNumeric:'tabular-nums' }}>{UTILS.fmtDate(po.poDate, lang)}</div>
                          <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--txt4)', marginTop:2 }}>{po.poNumber || po.id?.slice(0,10)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:supClr, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{supName}</div>
                          <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>{po.items?.length||0} {L('รายการ','lines')}{po.branch ? ' · '+po.branch : ''}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'var(--acc2)', fontVariantNumeric:'tabular-nums' }}>฿{UTILS.fmt(po.grandTotal||0,0)}</div>
                          {po.vat > 0 && <div style={{ fontSize:10, color:'var(--txt3)' }}>+VAT ฿{UTILS.fmt(po.vat,0)}</div>}
                        </div>
                        <div style={{ textAlign:'center' }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:UTILS.statusColor(po.status)+'22', color:UTILS.statusColor(po.status) }}>
                            {UTILS.statusLabel(po.status, lang)}
                          </span>
                        </div>
                        <div style={{ textAlign:'center', fontSize:9, color: isOpen ? 'var(--acc2)' : 'var(--txt3)', transition:'transform .2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▶</div>
                      </div>

                      {/* Expanded items */}
                      {isOpen && (po.items||[]).length > 0 && (
                        <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg3)', padding:'10px 16px 14px' }}>
                          <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead>
                              <tr>
                                {[L('ชื่อยา','Drug'), L('จำนวน','Qty'), L('ราคา/หน่วย','Unit Price'), L('รวม','Total')].map((h,i) => (
                                  <th key={h} style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.5px', color:'var(--txt3)', padding:'4px 0 8px', textAlign: i===0?'left':'right', fontWeight:600 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {po.items.map(it => (
                                <tr key={it.code}>
                                  <td style={{ fontSize:12, padding:'5px 0', borderBottom:'1px solid var(--border)', color:'var(--txt)' }}>
                                    <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--txt3)', marginRight:6 }}>{it.code}</span>
                                    {lang==='th' ? (it.nameTH||it.code) : (it.nameEN||it.nameTH||it.code)}
                                  </td>
                                  <td style={{ fontSize:12, padding:'5px 0', borderBottom:'1px solid var(--border)', color:'var(--txt2)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{it.qty?.toLocaleString()||'-'} {it.unit||''}</td>
                                  <td style={{ fontSize:12, padding:'5px 0', borderBottom:'1px solid var(--border)', color:'var(--txt2)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{it.unitPrice ? UTILS.fmt(it.unitPrice)+' ฿' : '-'}</td>
                                  <td style={{ fontSize:12, padding:'5px 0', borderBottom:'1px solid var(--border)', fontWeight:600, color:'var(--acc2)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                                    {it.qty && it.unitPrice ? '฿'+UTILS.fmt(Math.round(it.qty * it.unitPrice),0) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Summary footer */}
          {history2m.length > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 20px', marginTop:4 }}>
              {[
                [L('ยอดรวม 2 เดือน','2-Month Total'), '฿'+UTILS.fmt(h2mTotal,0), 'var(--ok)'],
                [L('เฉลี่ย/ใบสั่งซื้อ','Avg per PO'), history2m.length ? '฿'+UTILS.fmt(Math.round(h2mTotal/history2m.length),0) : '-', 'var(--acc2)'],
                [L('รายการทั้งหมด','Total Lines'), h2mLines.toLocaleString(), 'var(--txt)'],
                [L('ยาที่สั่ง (ไม่ซ้ำ)','Unique Drugs'), h2mUniqDrugs, 'var(--acc)'],
              ].map(([lbl, val, clr]) => (
                <div key={lbl} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:clr, fontVariantNumeric:'tabular-nums' }}>{val}</div>
                  <div style={{ fontSize:10, color:'var(--txt3)', marginTop:3 }}>{lbl}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ReportsPage });
