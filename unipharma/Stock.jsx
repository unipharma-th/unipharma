// Stock.jsx — Stock Tracking Page
const { useState, useMemo } = React;

function StockPage({ lang, L, drugs, orders, setPage, setShowCreate }) {
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('low');
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPageNum] = useState(1);
  const PER = 50;

  const filtered = useMemo(() => {
    let list = [...drugs];
    if (search) { const q = search.toLowerCase(); list = list.filter(d => d.code.toLowerCase().includes(q) || d.nameTH.includes(q) || d.nameEN.toLowerCase().includes(q)); }
    if (catFilter) list = list.filter(d => d.catId === catFilter);
    if (statusFilter === 'low') list = list.filter(d => Object.entries(d.stock).some(([br, v]) => (!branchFilter || br === branchFilter) && v <= d.minStock));
    else if (statusFilter === 'warning') list = list.filter(d => Object.entries(d.stock).some(([br, v]) => (!branchFilter || br === branchFilter) && v > d.minStock && v <= d.minStock * 2));
    else if (statusFilter === 'ok') list = list.filter(d => Object.entries(d.stock).every(([br, v]) => !branchFilter || br !== branchFilter || v > d.minStock * 2));
    if (branchFilter) list.sort((a, b) => a.stock[branchFilter] - b.stock[branchFilter]);
    else list.sort((a, b) => (a.totalStock / a.minStock) - (b.totalStock / b.minStock));
    return list;
  }, [drugs, search, catFilter, statusFilter, branchFilter]);

  const lowCount = drugs.filter(d => Object.values(d.stock).some(v => v <= d.minStock)).length;
  const warnCount = drugs.filter(d => Object.entries(d.stock).some(([, v]) => v > drugs.find(x=>x.code===d.code)?.minStock && v <= drugs.find(x=>x.code===d.code)?.minStock * 2)).length;
  const pageData = filtered.slice((page - 1) * PER, page * PER);

  const movements = DB.STOCK_MOVEMENTS.slice(0, 10);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('ติดตามสินค้า', 'Stock Tracking')}</div>
          <div className="page-subtitle">{L('ตรวจสอบระดับสต็อกแบบ Real-time ทั้ง 3 สาขา', 'Real-time stock monitoring across all 3 branches')}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ {L('สั่งซื้อเพิ่ม', 'Order More')}</button>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {DB.BRANCHES.map(br => {
          const brLow = drugs.filter(d => d.stock[br.id] <= d.minStock).length;
          const brTotal = drugs.reduce((s, d) => s + d.stock[br.id], 0);
          const brValue = drugs.reduce((s, d) => s + d.costEx * d.stock[br.id], 0);
          return (
            <div key={br.id} className="stat-card" style={{ borderTop: `3px solid ${br.color}` }}>
              <div className="stat-label" style={{ color: br.color }}>{br.name} ({br.id})</div>
              <div className="stat-val">{brTotal.toLocaleString()}</div>
              <div className="stat-sub">{L('หน่วยรวม', 'total units')} · ฿{(brValue / 1000).toFixed(0)}K</div>
              {brLow > 0 && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--err)', fontWeight: 700 }}>⚠ {brLow} {L('รายการใกล้หมด', 'low stock items')}</div>}
            </div>
          );
        })}
        <div className="stat-card">
          <div className="stat-label">{L('สินค้าใกล้หมด', 'Low Stock')}</div>
          <div className="stat-val" style={{ color: lowCount > 0 ? 'var(--err)' : 'var(--ok)' }}>{lowCount}</div>
          <div className="stat-sub">{L('รายการ', 'items')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{L('ระวัง (ใกล้ขีดต่ำ)', 'Warning Level')}</div>
          <div className="stat-val" style={{ color: 'var(--warn)' }}>{warnCount}</div>
          <div className="stat-sub">{L('รายการ', 'items')}</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
        {/* Main Stock Table */}
        <div style={{ gridColumn: '1 / -1' }}>
          {/* Filters */}
          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label className="label">{L('ค้นหา', 'Search')}</label>
                <SearchInput value={search} onChange={v => { setSearch(v); setPageNum(1); }} placeholder={L('รหัส / ชื่อยา…', 'Code / Name…')} />
              </div>
              <div style={{ flex: '0 0 140px' }}>
                <label className="label">{L('สาขา', 'Branch')}</label>
                <select className="input" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPageNum(1); }}>
                  <option value="">{L('ทุกสาขา', 'All')}</option>
                  {DB.BRANCHES.map(b => <option key={b.id} value={b.id}>{lang==='th'?b.name:b.nameEN}</option>)}
                </select>
              </div>
              <div style={{ flex: '0 0 160px' }}>
                <label className="label">{L('สถานะ', 'Status')}</label>
                <select className="input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPageNum(1); }}>
                  <option value="">{L('ทั้งหมด', 'All')}</option>
                  <option value="low">⚠ {L('ใกล้หมด', 'Low Stock')}</option>
                  <option value="warning">⚡ {L('ระวัง', 'Warning')}</option>
                  <option value="ok">✓ {L('ปกติ', 'Normal')}</option>
                </select>
              </div>
              <div style={{ flex: '0 0 180px' }}>
                <label className="label">{L('หมวดหมู่', 'Category')}</label>
                <select className="input" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPageNum(1); }}>
                  <option value="">{L('ทั้งหมด', 'All')}</option>
                  {DB.CATEGORIES.map(c => <option key={c.id} value={c.id}>{lang === 'th' ? c.name : c.nameEN}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{filtered.length} {L('รายการ', 'items')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['low', 'warning', ''].map((s, i) => {
                  const labels = [L('ใกล้หมด', 'Low'), L('ระวัง', 'Warn'), L('ทั้งหมด', 'All')];
                  const colors = ['var(--err)', 'var(--warn)', 'var(--txt3)'];
                  return (
                    <button key={i} className={`chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)} style={{ color: colors[i] }}>
                      {labels[i]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>{L('รหัส', 'Code')}</th>
                    <th>{L('ชื่อยา', 'Drug Name')}</th>
                    <th>{L('หมวด', 'Cat.')}</th>
                    {DB.BRANCHES.map(br => <th key={br.id} style={{ textAlign: 'center', color: br.color }}>{br.id}</th>)}
                    <th style={{ textAlign: 'center' }}>{L('รวม', 'Total')}</th>
                    <th style={{ textAlign: 'center' }}>{L('ขั้นต่ำ', 'Min')}</th>
                    <th style={{ textAlign: 'center' }}>{L('สถานะ', 'Status')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 && <tr><td colSpan={9} className="no-data">{L('ไม่พบข้อมูล', 'No data')}</td></tr>}
                  {pageData.map(d => {
                    const isLow = Object.entries(d.stock).some(([br, v]) => (!branchFilter || br === branchFilter) && v <= d.minStock);
                    const isWarn = !isLow && Object.entries(d.stock).some(([br, v]) => (!branchFilter || br === branchFilter) && v <= d.minStock * 2);
                    return (
                      <tr key={d.code} style={{ background: isLow ? 'rgba(248,113,113,.05)' : isWarn ? 'rgba(251,191,36,.05)' : undefined }}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)', fontWeight: 700 }}>{d.code}</td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : d.nameEN}</div>
                          <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{UTILS.getUnit(d.unit, lang)}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: 11, color: UTILS.getCat(d.catId).color }}>{lang === 'th' ? UTILS.getCat(d.catId).name : UTILS.getCat(d.catId).nameEN}</span>
                        </td>
                        {DB.BRANCHES.map(br => {
                          const v = d.stock[br.id];
                          const low = v <= d.minStock;
                          const warn = v > d.minStock && v <= d.minStock * 2;
                          return (
                            <td key={br.id} style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: low ? 'var(--err)' : warn ? 'var(--warn)' : 'var(--ok)' }}>{v.toLocaleString()}</div>
                              {low && <div style={{ fontSize: 9, color: 'var(--err)' }}>⚠ ต่ำ</div>}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{d.totalStock.toLocaleString()}</td>
                        <td style={{ textAlign: 'center', fontSize: 11, color: 'var(--txt3)' }}>{d.minStock.toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          {isLow ? <span className="badge" style={{ background: 'var(--err-bg)', color: 'var(--err)' }}>⚠ ต่ำ</span>
                            : isWarn ? <span className="badge" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>⚡ ระวัง</span>
                            : <span className="badge" style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}>✓ ปกติ</span>}
                        </td>
                        <td>
                          {isLow && (
                            <button className="btn btn-outline btn-xs" onClick={() => setShowCreate(true)}>
                              🛒 {L('สั่ง', 'Order')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
              <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPageNum} />
            </div>
          </div>
        </div>

        {/* Stock Movements */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">🔄 {L('การเคลื่อนไหวสต็อกล่าสุด', 'Recent Stock Movements')}</span>
            </div>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>{L('วันที่', 'Date')}</th>
                    <th>{L('ประเภท', 'Type')}</th>
                    <th>{L('รหัสสินค้า', 'Code')}</th>
                    <th>{L('ชื่อสินค้า', 'Product')}</th>
                    <th>{L('สาขา', 'Branch')}</th>
                    <th style={{ textAlign: 'right' }}>{L('จำนวน', 'Qty')}</th>
                    <th>{L('เหตุผล', 'Reason')}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => {
                    const drug = UTILS.getDrug(m.code);
                    return (
                      <tr key={i}>
                        <td style={{ fontSize: 12 }}>{UTILS.fmtDate(m.date, lang)}</td>
                        <td>
                          <span className="badge" style={{ background: m.type === 'in' ? 'var(--ok-bg)' : 'var(--err-bg)', color: m.type === 'in' ? 'var(--ok)' : 'var(--err)' }}>
                            {m.type === 'in' ? '↓ ' + L('รับเข้า', 'IN') : '↑ ' + L('จ่ายออก', 'OUT')}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)' }}>{m.code}</td>
                        <td style={{ fontSize: 12 }}>{drug ? (lang === 'th' ? drug.nameTH : drug.nameEN) : m.code}</td>
                        <td><BranchBadge branchId={m.branch} /></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: m.type === 'in' ? 'var(--ok)' : 'var(--err)' }}>
                          {m.type === 'in' ? '+' : '-'}{m.qty.toLocaleString()}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--txt3)' }}>{lang==='en' ? m.reason.replace('ขาย','Sale').replace('รับ',`Received`).replace('รับ เข้า','IN') : m.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StockPage });
