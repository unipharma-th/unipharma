// Reports.jsx — Reports & Analytics Page
const { useState, useMemo } = React;

function ReportsPage({ lang, L, drugs, orders, suppliers }) {
  const [activeTab, setActiveTab] = useState('movement');
  const [branchFilter, setBranchFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('2026-06');

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
    let list = orders.filter(o => o.status !== 'cancelled' && o.status !== 'draft');
    if (monthFilter) list = list.filter(o => o.poDate?.startsWith(monthFilter));
    if (branchFilter) list = list.filter(o => o.branch === branchFilter);
    return list;
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

  // Chart data
  const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];
  const monthKeys = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
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

  const TABS = [
    { id: 'movement', label: L('รายงานการเคลื่อนไหว', 'Movement Report') },
    { id: 'top10', label: L('Top 10 สั่งบ่อย', 'Top 10 Ordered') },
    { id: 'bottom10', label: L('10 ไม่ได้สั่ง', '10 Rarely Ordered') },
    { id: 'supplier', label: L('ผู้จัดจำหน่าย', 'Supplier Analysis') },
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
    </div>
  );
}

Object.assign(window, { ReportsPage });
