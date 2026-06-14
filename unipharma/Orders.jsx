// Orders.jsx — Purchase Orders Management
const { useState, useMemo } = React;

function OrdersPage({ lang, L, orders, setOrders, drugs, suppliers, notify, setViewPO, setShowCreate }) {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState(null);
  const PER = 15;

  const months = useMemo(() => {
    const s = new Set(orders.map(o => o.poDate?.slice(0, 7)).filter(Boolean));
    return [...s].sort().reverse();
  }, [orders]);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.poNumber?.toLowerCase().includes(q) || UTILS.getSupplier(o.supplierId)?.name?.toLowerCase().includes(q));
    }
    if (branchFilter) list = list.filter(o => o.branch === branchFilter);
    if (statusFilter) list = list.filter(o => o.status === statusFilter);
    if (monthFilter) list = list.filter(o => o.poDate?.startsWith(monthFilter));
    return list.sort((a, b) => new Date(b.poDate) - new Date(a.poDate));
  }, [orders, search, branchFilter, statusFilter, monthFilter]);

  const pageData = filtered.slice((page - 1) * PER, page * PER);

  const totalSpend = filtered.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.grandTotal || 0), 0);

  const updateStatus = (id, newStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, status: newStatus, approvedBy: newStatus === 'approved' ? 'ผู้จัดการจัดซื้อ' : o.approvedBy };
      if (window.UNI_DB) window.UNI_DB.savePO(updated);
      return updated;
    }));
    notify(L('อัปเดตสถานะสำเร็จ', 'Status updated'));
    setConfirmId(null);
  };

  const deleteOrder = id => {
    setOrders(prev => prev.filter(o => o.id !== id));
    notify(L('ลบใบสั่งซื้อแล้ว', 'PO deleted'), 'warn');
    setConfirmId(null);
  };

  const statusNextMap = { draft: 'pending', pending: 'approved', approved: 'completed' };
  const statusNextLabel = { draft: L('ส่งอนุมัติ', 'Submit'), pending: L('อนุมัติ', 'Approve'), approved: L('ยืนยันรับ', 'Confirm') };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{L('การสั่งซื้อ', 'Purchase Orders')}</div>
          <div className="page-subtitle">{filtered.length} {L('รายการ · ยอดรวม', 'orders · Total')} ฿{UTILS.fmt(totalSpend, 0)}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + {L('สร้างใบสั่งซื้อ', 'New PO')}
        </button>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['draft', 'pending', 'approved', 'completed', 'cancelled'].map(s => {
          const cnt = orders.filter(o => o.status === s).length;
          return (
            <div key={s} className={`chip${statusFilter === s ? ' active' : ''}`} onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge-dot" style={{ background: UTILS.statusColor(s) }} />
              {UTILS.statusLabel(s, lang)} ({cnt})
            </div>
          );
        })}
      </div>

      {/* FILTERS */}
      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="label">{L('ค้นหา', 'Search')}</label>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={L('เลข PO / ผู้จัดจำหน่าย…', 'PO No. / Supplier…')} />
          </div>
          <div style={{ flex: '0 0 150px' }}>
            <label className="label">{L('สาขา', 'Branch')}</label>
            <select className="input" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }}>
              <option value="">{L('ทุกสาขา', 'All Branches')}</option>
              {DB.BRANCHES.map(b => <option key={b.id} value={b.id}>{lang==='th'?b.name:b.nameEN}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 150px' }}>
            <label className="label">{L('เดือน', 'Month')}</label>
            <select className="input" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1); }}>
              <option value="">{L('ทั้งหมด', 'All')}</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>{L('เลขที่ PO', 'PO Number')}</th>
                <th>{L('สาขา', 'Branch')}</th>
                <th>{L('ผู้จัดจำหน่าย', 'Supplier')}</th>
                <th>{L('วันที่สั่ง', 'PO Date')}</th>
                <th>{L('วันที่ส่ง', 'Delivery')}</th>
                <th style={{ textAlign: 'right' }}>{L('ยอดรวม', 'Grand Total')}</th>
                <th>{L('สถานะ', 'Status')}</th>
                <th style={{ textAlign: 'center' }}>{L('จัดการ', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr><td colSpan={8} className="no-data">{L('ไม่พบข้อมูล', 'No orders found')}</td></tr>
              )}
              {pageData.map(po => {
                const sup = UTILS.getSupplier(po.supplierId);
                const next = statusNextMap[po.status];
                return (
                  <tr key={po.id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--acc2)' }}>{po.poNumber}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{po.items?.length || 0} {L('รายการ', 'items')}</div>
                    </td>
                    <td><BranchBadge branchId={po.branch} /></td>
                    <td>
                      <div className="ellipsis" style={{ maxWidth: 180, fontSize: 13 }}>{lang==='th'?sup.name:sup.nameEN}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{L('เครดิต', 'Credit')} {po.creditTerm} {L('วัน', 'days')}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{UTILS.fmtDate(po.poDate, lang)}</td>
                    <td style={{ fontSize: 12 }}>{UTILS.fmtDate(po.deliveryDate, lang)}</td>
                    <td className="tbl-num">
                      <div style={{ fontWeight: 700 }}>฿{UTILS.fmt(po.grandTotal, 0)}</div>
                      {po.vat > 0 && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>VAT ฿{UTILS.fmt(po.vat, 0)}</div>}
                    </td>
                    <td><StatusBadge status={po.status} lang={lang} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => setViewPO(po)}>
                          📄 {L('ดูเอกสาร', 'View')}
                        </button>
                        {next && (
                          <button className="btn btn-outline btn-xs" onClick={() => updateStatus(po.id, next)}>
                            {statusNextLabel[po.status]}
                          </button>
                        )}
                        {po.status === 'draft' && (
                          <button className="btn btn-danger btn-xs" onClick={() => setConfirmId(po.id)}>
                            {L('ลบ', 'Delete')}
                          </button>
                        )}
                        {po.status === 'pending' && (
                          <button className="btn btn-danger btn-xs" onClick={() => updateStatus(po.id, 'cancelled')}>
                            {L('ยกเลิก', 'Cancel')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
        </div>
      </div>

      {/* NON-PO RECEIPT */}
      <div className="card" style={{ marginTop: 16, padding: 14, borderColor: 'rgba(251,191,36,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🧾</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{L('บันทึกซื้อตรง (Non-PO Receipt)', 'Non-PO Direct Receipt')}</div>
            <div style={{ fontSize: 12, color: 'var(--txt3)' }}>{L('สำหรับการซื้อผ่านยี่ปั๊ว ไม่มีเลข PO', 'For direct purchases without a PO number')}</div>
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
            {L('บันทึก Non-PO', 'Record Non-PO')}
          </button>
        </div>
      </div>

      {confirmId && (
        <Confirm lang={lang} msg={L('ต้องการลบใบสั่งซื้อนี้ใช่ไหม?', 'Delete this purchase order?')}
          onConfirm={() => deleteOrder(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  );
}

Object.assign(window, { OrdersPage });
