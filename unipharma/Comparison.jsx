// Comparison.jsx — Price Comparison + CW Price History
const { useState, useMemo, useEffect, useRef } = React;

// Get price for a supplier-drug pair.
// Priority: supplier's own drugPrices → drug's own costEx
function getPrice(drug, sup) {
  if (sup?.drugPrices?.[drug.code] !== undefined) return sup.drugPrices[drug.code];
  const comp = DB.COMP_PRICES[drug.code];
  if (comp && comp[sup?.id] !== undefined) return comp[sup.id];
  return drug.costEx;
}

function _drawCwHistoryChart(canvas, prevInst, data) {
  const C = window.Chart;
  if (!C || !canvas || data.length < 2) return null;
  if (prevInst) { try { prevInst.destroy(); } catch(_) {} }
  const labels = data.map(d => d.sync_date ? d.sync_date.slice(5) : '');
  const costs  = data.map(d => d.cost_00 > 0 ? d.cost_00 : null);
  const sells  = data.map(d => d.sell_00 > 0 ? d.sell_00 : null);
  return new C(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'ทุน PTN', data: costs, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.1)', fill: true,  tension: 0.25, pointRadius: 4, borderWidth: 2 },
        { label: 'ขาย PTN', data: sells, borderColor: '#22c55e', backgroundColor: 'transparent',         fill: false, tension: 0.25, pointRadius: 3, borderWidth: 2 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => ' ฿' + (ctx.parsed.y || 0).toLocaleString('th') } },
      },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0, maxTicksLimit: 8 }, grid: { color: 'rgba(45,63,85,.7)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => '฿' + v.toLocaleString('th') }, grid: { color: 'rgba(45,63,85,.7)' } },
      },
    },
  });
}

function ComparisonPage({ lang, L, drugs, suppliers }) {
  const [search, setSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [tab, setTab] = useState('current');
  const [cwHistory, setCwHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [poHistory,  setPoHistory]  = useState([]);
  const chartRef  = useRef(null);
  const chartInst = useRef(null);

  // Load CW price history when drug changes
  useEffect(() => {
    if (!selectedDrug || !window.UNI_DB?.enabled) { setCwHistory([]); return; }
    setHistLoading(true);
    window.UNI_DB.loadCwPriceHistory([selectedDrug.code])
      .then(map => setCwHistory(map[selectedDrug.code] || []))
      .catch(() => setCwHistory([]))
      .finally(() => setHistLoading(false));
  }, [selectedDrug]);

  // Load PO purchase history when drug changes
  useEffect(() => {
    if (!selectedDrug || !window.UNI_DB?.enabled) { setPoHistory([]); return; }
    window.UNI_DB.loadPriceHistory(selectedDrug.code)
      .then(rows => setPoHistory(rows || []))
      .catch(() => setPoHistory([]));
  }, [selectedDrug]);

  // Draw / destroy Chart.js instance when tab or data changes
  useEffect(() => {
    if (tab !== 'history') {
      if (chartInst.current) { try { chartInst.current.destroy(); } catch(_) {} chartInst.current = null; }
      return;
    }
    if (!chartRef.current || cwHistory.length < 2) return;
    const inst = _drawCwHistoryChart(chartRef.current, chartInst.current, cwHistory);
    if (inst) chartInst.current = inst;
    return () => { if (chartInst.current) { try { chartInst.current.destroy(); } catch(_) {} chartInst.current = null; } };
  }, [tab, cwHistory]);

  const searchResults = useMemo(() => {
    if (!search || search.length < 1) return [];
    const q = search.toLowerCase();
    return drugs.filter(d =>
      d.code.toLowerCase().includes(q) ||
      d.nameTH.includes(q) ||
      d.nameEN.toLowerCase().includes(q)
    ).slice(0, 14);
  }, [drugs, search]);

  // Build full comparison rows for selected drug
  const rows = useMemo(() => {
    if (!selectedDrug) return [];
    let supList = suppliers.filter(s => (s.drugs||[]).includes(selectedDrug.code));
    if (!supList.length) {
      const extraIds = (selectedDrug.extraSuppliers||[]).map(s=>s.id).filter(Boolean).length
        ? (selectedDrug.extraSuppliers||[]).map(s=>s.id)
        : (selectedDrug.extraSupplierIds||[]);
      const linked = [selectedDrug.supplierId, ...extraIds].filter(Boolean);
      supList = suppliers.filter(s => linked.includes(s.id));
    }
    return supList.map(s => {
      const costEx = getPrice(selectedDrug, s);
      const costInc = selectedDrug.hasVat ? +(costEx * 1.07).toFixed(2) : costEx;
      const promos = (s.promotions || []).filter(p =>
        !p.catId || p.catId === selectedDrug.catId ||
        !p.drugCode || p.drugCode === selectedDrug.code
      );
      const bestPromoDisc = promos.reduce((m, p) => Math.max(m, p.discount || 0), 0);
      const afterPromo = bestPromoDisc > 0 ? +(costEx * (1 - bestPromoDisc / 100)).toFixed(2) : costEx;
      return { supplier: s, costEx, costInc, promos, bestPromoDisc, afterPromo };
    }).sort((a, b) => a.afterPromo - b.afterPromo);
  }, [selectedDrug, suppliers]);

  const cheapest = rows[0];
  const mostExp  = rows[rows.length - 1];
  const maxSavings = rows.length > 1 ? +(mostExp.afterPromo - cheapest.afterPromo).toFixed(2) : 0;

  const popular = useMemo(() => {
    const linkedCodes = new Set([
      ...Object.keys(DB.COMP_PRICES),
      ...suppliers.flatMap(s => s.drugs||[]),
      ...drugs.filter(d => d.supplierId).map(d => d.code),
    ]);
    return drugs.filter(d => linkedCodes.has(d.code)).slice(0, 12);
  }, [drugs, suppliers]);

  const selectDrug = d => { setSelectedDrug(d); setSearch(''); setShowSearch(false); setTab('current'); };
  const clearDrug  = () => { setSelectedDrug(null); setSearch(''); setTab('current'); setCwHistory([]); setPoHistory([]); };

  return (
    <div className="page">
      <div className="sticky-bar">
        <div className="page-header">
          <div>
            <div className="page-title">⚖ {L('เปรียบเทียบราคา', 'Price Comparison')}</div>
            <div className="page-subtitle">{L('เทียบราคาจากทุกผู้จัดจำหน่ายและรับคำแนะนำซื้อที่ดีที่สุด', 'Compare prices across all suppliers — get the best buying recommendation')}</div>
          </div>
        </div>
        {/* SEARCH BAR */}
        <div className="card" style={{ marginBottom: 0, padding: 20 }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <label className="label" style={{ fontSize: 14, textAlign: 'center', display: 'block', marginBottom: 10 }}>
            🔍 {L('ค้นหายาที่ต้องการเปรียบเทียบ', 'Search a drug to compare prices')}
          </label>
          <div style={{ position: 'relative' }}>
            {selectedDrug ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)', padding: '10px 14px' }}>
                <span style={{ fontSize: 20 }}>💊</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{lang === 'th' ? selectedDrug.nameTH : (selectedDrug.nameEN||selectedDrug.nameTH)}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{selectedDrug.code} · {lang === 'th' ? UTILS.getCat(selectedDrug.catId).name : UTILS.getCat(selectedDrug.catId).nameEN}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={clearDrug}>✕ {L('เปลี่ยน', 'Change')}</button>
              </div>
            ) : (
              <>
                <SearchInput value={search} onChange={v => { setSearch(v); setShowSearch(true); }}
                  placeholder={L('พิมพ์รหัส / ชื่อยา…', 'Type code / drug name…')} />
                {showSearch && searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)', boxShadow: 'var(--shadow2)', zIndex: 50, marginTop: 4, maxHeight: 300, overflowY: 'auto' }}>
                    {searchResults.map(d => {
                      const supCount = suppliers.filter(s => s.drugs?.includes(d.code)).length;
                      const prices = suppliers.filter(s => s.drugs?.includes(d.code)).map(s => getPrice(d, s));
                      const minP = prices.length ? Math.min(...prices) : d.costEx;
                      const maxP = prices.length ? Math.max(...prices) : d.costEx;
                      return (
                        <div key={d.code} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseDown={() => selectDrug(d)}>
                          <div>
                            <span style={{ color: 'var(--acc)', fontFamily: 'monospace', fontSize: 12 }}>{d.code}</span>
                            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</span>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--txt3)', flexShrink: 0 }}>
                            <div style={{ color: 'var(--ok)', fontWeight: 700 }}>฿{UTILS.fmt(minP)} – ฿{UTILS.fmt(maxP)}</div>
                            <div>{supCount} {L('ผู้จัดจำหน่าย', 'suppliers')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* TAB SWITCHER — shown when drug selected */}
      {selectedDrug && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button className={`btn btn-sm ${tab === 'current' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('current')}>
            ⚖ {L('ราคาปัจจุบัน', 'Current Prices')}
          </button>
          <button className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('history')}>
            📈 {L('ประวัติราคา CW', 'CW Price History')}
            {cwHistory.length > 0 && (
              <span style={{ marginLeft: 5, fontSize: 10, background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: 10 }}>
                {cwHistory.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── CURRENT PRICES TAB ── */}
      {selectedDrug && tab === 'current' && rows.length > 0 && (
        <>
          {/* Drug info + Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, marginBottom: 20, alignItems: 'stretch' }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{lang === 'th' ? selectedDrug.nameTH : (selectedDrug.nameEN||selectedDrug.nameTH)}</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>
                {selectedDrug.code} · {lang === 'th' ? UTILS.getCat(selectedDrug.catId).name : UTILS.getCat(selectedDrug.catId).nameEN} · {selectedDrug.unit}
                {selectedDrug.hasVat && <span className="badge" style={{ marginLeft: 8, background: 'var(--info-bg)', color: 'var(--info)' }}>VAT 7%</span>}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--txt3)' }}>
                <span>{L('ราคาขาย', 'Sell price')}: <b style={{ color: 'var(--txt)' }}>฿{UTILS.fmt(selectedDrug.sellEx)}</b></span>
                <span>{L('กำไร', 'Margin')}: <b style={{ color: 'var(--ok)' }}>{selectedDrug.profitMargin}%</b></span>
              </div>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700, marginBottom: 4 }}>💚 {L('ราคาถูกสุด', 'Cheapest')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ok)' }}>฿{UTILS.fmt(cheapest.afterPromo)}</div>
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{lang==='th'?cheapest.supplier.name.split(' ').slice(0,3).join(' '):(cheapest.supplier.nameEN||cheapest.supplier.name).split(' ').slice(0,3).join(' ')}</div>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--err)', fontWeight: 700, marginBottom: 4 }}>🔴 {L('ราคาแพงสุด', 'Most Exp.')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--err)' }}>฿{UTILS.fmt(mostExp.afterPromo)}</div>
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{lang==='th'?mostExp.supplier.name.split(' ').slice(0,3).join(' '):(mostExp.supplier.nameEN||mostExp.supplier.name).split(' ').slice(0,3).join(' ')}</div>
            </div>
            {maxSavings > 0 && (
              <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130, borderColor: 'rgba(22,163,74,.4)', background: 'var(--ok-bg)' }}>
                <div style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700, marginBottom: 4 }}>💰 {L('ส่วนต่าง', 'Max Savings')}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ok)' }}>฿{UTILS.fmt(maxSavings)}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{L('ต่อหน่วย', 'per unit')}</div>
              </div>
            )}
          </div>

          {/* RECOMMENDATION BANNER */}
          <div style={{ background: 'linear-gradient(135deg,var(--acc) 0%,var(--acc2) 100%)', borderRadius: 'var(--r)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px var(--glow)' }}>
            <div style={{ fontSize: 36 }}>🏆</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                {L('แนะนำ: ซื้อจาก', 'Recommended: Buy from')} {lang==='th'?cheapest.supplier.name:(cheapest.supplier.nameEN||cheapest.supplier.name)}
              </div>
              <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13 }}>
                {L('ราคาต้นทุน', 'Cost price')} <b>฿{UTILS.fmt(cheapest.costEx)}</b>
                {selectedDrug.hasVat && <span> ({L('รวม VAT', 'incl. VAT')} ฿{UTILS.fmt(cheapest.costInc)})</span>}
                {cheapest.bestPromoDisc > 0 && (
                  <span style={{ marginLeft: 8, background: 'rgba(255,255,255,.25)', padding: '1px 8px', borderRadius: 20 }}>
                    🎁 {L('ลด', 'Disc.')} {cheapest.bestPromoDisc}% → ฿{UTILS.fmt(cheapest.afterPromo)}
                  </span>
                )}
                {maxSavings > 0 && (
                  <span style={{ marginLeft: 8, color: 'rgba(255,255,255,.8)' }}>
                    · {L('ประหยัดกว่าแพงสุด', 'Saves vs. most expensive')} ฿{UTILS.fmt(maxSavings)}/หน่วย
                  </span>
                )}
              </div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 4 }}>
                {L('เครดิต', 'Credit')} {cheapest.supplier.creditTerm} {L('วัน', 'days')} ·
                {L('ส่งภายใน', 'Delivery')} {cheapest.supplier.deliveryDays} {L('วัน', 'days')} ·
                ⭐ {cheapest.supplier.rating}/5
              </div>
            </div>
          </div>

          {/* FULL COMPARISON TABLE */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
              📊 {L('ราคาจากทุกผู้จัดจำหน่าย', 'All Supplier Prices')} ({rows.length} {L('ราย', 'suppliers')}) — {L('เรียงจากถูกสุดไปแพงสุด', 'Cheapest → Most Expensive')}
            </div>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>{L('อันดับ', 'Rank')}</th>
                    <th>{L('ผู้จัดจำหน่าย', 'Supplier')}</th>
                    <th style={{ textAlign: 'right' }}>{L('ต้นทุน (ไม่รวม VAT)', 'Cost (excl.VAT)')}</th>
                    {selectedDrug.hasVat && <th style={{ textAlign: 'right' }}>{L('ต้นทุน (รวม VAT)', 'Cost (incl.VAT)')}</th>}
                    <th style={{ textAlign: 'right' }}>{L('หลังโปรโมชั่น', 'After Promo')}</th>
                    <th style={{ textAlign: 'right' }}>{L('vs ถูกสุด', 'vs Cheapest')}</th>
                    <th>{L('โปรโมชั่น', 'Promotions')}</th>
                    <th style={{ textAlign: 'center' }}>{L('เครดิต', 'Credit')}</th>
                    <th style={{ textAlign: 'center' }}>{L('ส่งภายใน', 'Lead')}</th>
                    <th style={{ textAlign: 'center' }}>{L('คะแนน', 'Rating')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const isCheap = i === 0;
                    const isExp = i === rows.length - 1 && rows.length > 1;
                    const diff = +(row.afterPromo - cheapest.afterPromo).toFixed(2);
                    const pctDiff = cheapest.afterPromo > 0 ? +((diff / cheapest.afterPromo) * 100).toFixed(1) : 0;
                    return (
                      <tr key={row.supplier.id} style={{ background: isCheap ? 'rgba(22,163,74,.07)' : isExp ? 'rgba(220,38,38,.05)' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, margin: '0 auto',
                            background: isCheap ? 'var(--ok)' : isExp ? 'var(--err)' : 'var(--bg4)',
                            color: isCheap || isExp ? '#fff' : 'var(--txt3)' }}>
                            {isCheap ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{row.supplier.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getSupCat(row.supplier.category, lang)}</div>
                          {isCheap && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ok)', background: 'var(--ok-bg)', padding: '1px 6px', borderRadius: 20 }}>✓ {L('แนะนำ', 'BEST BUY')}</span>}
                          {isExp && <span style={{ fontSize: 10, color: 'var(--err)' }}>↑ {L('แพงสุด', 'MOST EXP.')}</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: isCheap ? 'var(--ok)' : isExp ? 'var(--err)' : 'var(--txt)' }}>
                            ฿{UTILS.fmt(row.costEx)}
                          </div>
                        </td>
                        {selectedDrug.hasVat && (
                          <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--info)' }}>฿{UTILS.fmt(row.costInc)}</td>
                        )}
                        <td style={{ textAlign: 'right' }}>
                          {row.bestPromoDisc > 0 ? (
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ok)' }}>฿{UTILS.fmt(row.afterPromo)}</div>
                              <div style={{ fontSize: 10, color: 'var(--ok)' }}>-{row.bestPromoDisc}% {L('ส่วนลด', 'off')}</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: 'var(--txt3)' }}>= ฿{UTILS.fmt(row.costEx)}</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {diff === 0 ? (
                            <span style={{ color: 'var(--ok)', fontWeight: 700 }}>— {L('ถูกสุด', 'Cheapest')}</span>
                          ) : (
                            <div>
                              <div style={{ color: 'var(--err)', fontWeight: 700 }}>+฿{UTILS.fmt(diff)}</div>
                              <div style={{ fontSize: 10, color: 'var(--txt3)' }}>+{pctDiff}%</div>
                            </div>
                          )}
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          {row.promos.length > 0 ? row.promos.map(p => (
                            <div key={p.id} style={{ fontSize: 10, color: 'var(--ok)', background: 'var(--ok-bg)', borderRadius: 4, padding: '2px 7px', marginBottom: 3, lineHeight: 1.4 }}>
                              🎁 {p.name}
                            </div>
                          )) : <span style={{ color: 'var(--txt4)', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 12 }}>{row.supplier.creditTerm} {L('วัน', 'd')}</td>
                        <td style={{ textAlign: 'center', fontSize: 12 }}>{row.supplier.deliveryDays} {L('วัน', 'd')}</td>
                        <td style={{ textAlign: 'center' }}>
                          <RatingStars rating={row.supplier.rating} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedDrug && tab === 'current' && rows.length === 0 && (
        <div className="no-data card">{L('ไม่มีผู้จัดจำหน่ายสำหรับสินค้านี้ในระบบ', 'No suppliers found for this product')}</div>
      )}

      {/* ── HISTORY TAB ── */}
      {selectedDrug && tab === 'history' && (
        <div>
          {histLoading && (
            <div className="no-data card">⏳ {L('กำลังโหลดประวัติราคา…', 'Loading price history…')}</div>
          )}
          {!histLoading && cwHistory.length === 0 && (
            <div className="no-data card" style={{ paddingTop: 40, paddingBottom: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{L('ยังไม่มีข้อมูลประวัติราคา CW', 'No CW price history yet')}</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', maxWidth: 360 }}>
                {L('ข้อมูลจะเริ่มสะสมตั้งแต่ sync CW รอบแรก (10:00/18:00 น.) หลังสร้าง table เรียบร้อยแล้ว',
                   'Data accumulates starting from the first CW sync (10:00/18:00) after the table is created')}
              </div>
            </div>
          )}
          {!histLoading && cwHistory.length > 0 && (() => {
            const hasCost = cwHistory.filter(d => d.cost_00 > 0);
            const minCost = hasCost.length ? Math.min(...hasCost.map(d => d.cost_00)) : 0;
            const maxCost = hasCost.length ? Math.max(...hasCost.map(d => d.cost_00)) : 0;
            const firstCost = hasCost[0]?.cost_00 || 0;
            const lastCost  = hasCost[hasCost.length - 1]?.cost_00 || 0;
            const totalChange = firstCost > 0 ? ((lastCost - firstCost) / firstCost * 100).toFixed(1) : null;
            const isUp = totalChange !== null && Number(totalChange) > 0;
            const isDown = totalChange !== null && Number(totalChange) < 0;
            return (
              <>
                {/* STAT TILES */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                  <div className="card-sm" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>{L('วันที่บันทึก', 'Days Tracked')}</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{cwHistory.length}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{L('รายการ', 'entries')}</div>
                  </div>
                  <div className="card-sm" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--ok)', marginBottom: 4 }}>{L('ทุนต่ำสุด', 'Min Cost')}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ok)' }}>฿{UTILS.fmt(minCost)}</div>
                  </div>
                  <div className="card-sm" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--err)', marginBottom: 4 }}>{L('ทุนสูงสุด', 'Max Cost')}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--err)' }}>฿{UTILS.fmt(maxCost)}</div>
                  </div>
                  <div className="card-sm" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>{L('เปลี่ยนแปลงสุทธิ', 'Net Change')}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: isUp ? 'var(--err)' : isDown ? 'var(--ok)' : 'var(--txt3)' }}>
                      {totalChange === null ? '—' : (isUp ? '+' : '') + totalChange + '%'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{L('ตั้งแต่รายการแรก', 'since first record')}</div>
                  </div>
                </div>

                {/* CHART */}
                {cwHistory.length >= 2 && (
                  <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>📈 {L('กราฟราคา CW — สาขาประตูน้ำ (PTN)', 'CW Price Chart — PTN Branch')}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, fontSize: 11, color: 'var(--txt3)' }}>
                        <span>
                          <span style={{ display: 'inline-block', width: 14, height: 3, background: '#3b82f6', verticalAlign: 'middle', marginRight: 4, borderRadius: 2 }} />
                          {L('ราคาทุน', 'Cost')}
                        </span>
                        <span>
                          <span style={{ display: 'inline-block', width: 14, height: 3, background: '#22c55e', verticalAlign: 'middle', marginRight: 4, borderRadius: 2 }} />
                          {L('ราคาขาย', 'Sell')}
                        </span>
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: 200 }}>
                      <canvas ref={chartRef} />
                    </div>
                  </div>
                )}

                {/* TABLE */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                    🗓 {L('บันทึกราคา CW รายวัน', 'Daily CW Price Log')}
                    <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--txt3)', marginLeft: 8 }}>({cwHistory.length} {L('รายการ', 'entries')})</span>
                  </div>
                  <div className="tbl-wrap" style={{ border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>{L('วันที่', 'Date')}</th>
                          <th style={{ textAlign: 'right' }}>{L('ทุน PTN', 'Cost PTN')}</th>
                          <th style={{ textAlign: 'right' }}>{L('ขาย PTN', 'Sell PTN')}</th>
                          <th style={{ textAlign: 'right' }}>{L('เปลี่ยนแปลง (ทุน)', 'Cost Change')}</th>
                          <th style={{ textAlign: 'right' }}>{L('Stock PTN', 'Stock PTN')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...cwHistory].reverse().map((row, i, arr) => {
                          const prev = arr[i + 1];
                          const cc   = prev && prev.cost_00 > 0 && row.cost_00 > 0 ? +(row.cost_00 - prev.cost_00).toFixed(4) : null;
                          const pct  = cc !== null && prev.cost_00 > 0 ? (cc / prev.cost_00 * 100).toFixed(1) : null;
                          return (
                            <tr key={row.sync_date}>
                              <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--txt2)' }}>{row.sync_date}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                {row.cost_00 > 0 ? '฿' + UTILS.fmt(row.cost_00) : <span style={{ color: 'var(--txt4)' }}>—</span>}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--txt2)' }}>
                                {row.sell_00 > 0 ? '฿' + UTILS.fmt(row.sell_00) : <span style={{ color: 'var(--txt4)' }}>—</span>}
                              </td>
                              <td style={{ textAlign: 'right', fontSize: 12 }}>
                                {cc === null
                                  ? <span style={{ color: 'var(--txt4)' }}>—</span>
                                  : cc === 0
                                    ? <span style={{ color: 'var(--txt3)' }}>—</span>
                                    : cc > 0
                                      ? <span style={{ color: 'var(--err)', fontWeight: 700 }}>▲ ฿{UTILS.fmt(Math.abs(cc))} <span style={{ fontSize: 10 }}>(+{pct}%)</span></span>
                                      : <span style={{ color: 'var(--ok)',  fontWeight: 700 }}>▼ ฿{UTILS.fmt(Math.abs(cc))} <span style={{ fontSize: 10 }}>({pct}%)</span></span>
                                }
                              </td>
                              <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--txt3)' }}>
                                {row.stock_00 != null ? row.stock_00 : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* PO PURCHASE HISTORY */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                    🛒 {L('ประวัติการสั่งซื้อจริง (จาก PO)', 'Actual Purchase History (from POs)')}
                    {poHistory.length > 0 && (
                      <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--txt3)', marginLeft: 8 }}>({poHistory.length} {L('รายการ', 'entries')})</span>
                    )}
                  </div>
                  {poHistory.length === 0 ? (
                    <div style={{ padding: '20px 16px', fontSize: 12, color: 'var(--txt3)', textAlign: 'center' }}>
                      {L('ยังไม่มีประวัติ — จะบันทึกอัตโนมัติเมื่ออนุมัติ PO', 'No history yet — auto-logged when PO is approved')}
                    </div>
                  ) : (
                    <div className="tbl-wrap" style={{ border: 'none' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>{L('วันที่สั่งซื้อ', 'PO Date')}</th>
                            <th>{L('ผู้แทนฯ', 'Supplier')}</th>
                            <th style={{ textAlign: 'right' }}>{L('ราคา/หน่วย', 'Unit Price')}</th>
                            <th>{L('เลข PO', 'PO No.')}</th>
                            <th style={{ textAlign: 'right' }}>{L('vs CW', 'vs CW')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {poHistory.map((row, i) => {
                            const sup = suppliers.find(s => s.id === row.supplier_id);
                            const cwRef = (() => {
                              if (!cwHistory.length || !row.po_date) return null;
                              const d = row.po_date.slice(0, 10);
                              const near = cwHistory.filter(c => c.sync_date <= d && c.cost_00 > 0);
                              return near.length ? near[near.length - 1].cost_00 : null;
                            })();
                            const diff = cwRef && row.cost_ex ? +(row.cost_ex - cwRef).toFixed(2) : null;
                            return (
                              <tr key={row.id || i}>
                                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--txt2)' }}>{row.po_date ? row.po_date.slice(0, 10) : '—'}</td>
                                <td style={{ fontWeight: 600, fontSize: 12 }}>{sup ? (lang === 'th' ? sup.name : (sup.nameEN || sup.name)) : row.supplier_id}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                  {row.cost_ex > 0 ? '฿' + UTILS.fmt(row.cost_ex) : '—'}
                                </td>
                                <td style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'monospace' }}>{row.po_number || '—'}</td>
                                <td style={{ textAlign: 'right', fontSize: 12 }}>
                                  {diff === null
                                    ? <span style={{ color: 'var(--txt4)' }}>—</span>
                                    : diff === 0
                                      ? <span style={{ color: 'var(--txt3)' }}>—</span>
                                      : diff > 0
                                        ? <span style={{ color: 'var(--err)', fontWeight: 700 }}>+฿{UTILS.fmt(Math.abs(diff))}</span>
                                        : <span style={{ color: 'var(--ok)',  fontWeight: 700 }}>-฿{UTILS.fmt(Math.abs(diff))}</span>
                                  }
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Landing: Popular drugs */}
      {!selectedDrug && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt2)', marginBottom: 12 }}>
            ⭐ {L('ค้นหาด่วน — สินค้ายอดนิยม', 'Quick Search — Popular Products')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {popular.map(d => {
              const supList = suppliers.filter(s => s.drugs?.includes(d.code));
              const prices = supList.map(s => getPrice(d, s));
              const minP = prices.length ? Math.min(...prices) : d.costEx;
              const maxP = prices.length ? Math.max(...prices) : d.costEx;
              const savings = +(maxP - minP).toFixed(2);
              return (
                <div key={d.code} className="card-sm" style={{ cursor: 'pointer', transition: '.15s' }}
                  onClick={() => selectDrug(d)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }} className="ellipsis">{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 10 }}>
                    {d.code} · {supList.length} {L('ผู้จัดจำหน่าย', 'suppliers')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{L('ถูกสุด', 'Cheapest')}</div>
                      <div style={{ fontWeight: 800, color: 'var(--ok)', fontSize: 15 }}>฿{UTILS.fmt(minP)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{L('แพงสุด', 'Most Exp.')}</div>
                      <div style={{ fontWeight: 700, color: 'var(--err)' }}>฿{UTILS.fmt(maxP)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt4)' }}>{L('ส่วนต่าง', 'Savings')}</div>
                      <div style={{ fontWeight: 700, color: savings > 0 ? 'var(--warn)' : 'var(--txt3)' }}>฿{UTILS.fmt(savings)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ComparisonPage });
