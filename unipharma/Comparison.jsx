// Comparison.jsx — Price Comparison + CW Price History + Supplier Comparison Summary
const { useState, useMemo, useEffect, useRef } = React;

// ── Price resolver — checks extraSuppliers.costEx first, then main, then supplier tables
function getPrice(drug, sup) {
  if (!sup) return drug.costEx || 0;
  const exSup = (drug.extraSuppliers || []).find(s => s.id === sup.id);
  if (exSup && parseFloat(exSup.costEx) > 0) return +exSup.costEx;
  if (sup.id === drug.supplierId && (drug.costEx || 0) > 0) return +drug.costEx;
  if (sup.drugPrices?.[drug.code] !== undefined) return sup.drugPrices[drug.code];
  const comp = DB.COMP_PRICES[drug.code];
  if (comp && comp[sup.id] !== undefined) return comp[sup.id];
  return drug.costEx || 0;
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

// ── RANK highlight styles (gold / green / blue) ──────────────────
const RANK_STYLES = [
  { rowBg: 'linear-gradient(90deg,#fffbeb,#fefce8)', border: '#f59e0b', nameColor: '#92400e', badgeBg: 'linear-gradient(135deg,#d97706,#f59e0b)', shadow: 'rgba(217,119,6,.4)' },
  { rowBg: 'linear-gradient(90deg,#f0fdf4,#f7fffe)', border: '#22c55e', nameColor: '#15803d', badgeBg: 'linear-gradient(135deg,#16a34a,#22c55e)', shadow: 'rgba(22,163,74,.4)' },
  { rowBg: 'linear-gradient(90deg,#eff6ff,#f5f9ff)', border: '#60a5fa', nameColor: '#1d4ed8', badgeBg: 'linear-gradient(135deg,#2563eb,#60a5fa)', shadow: 'rgba(37,99,235,.35)' },
];

// ── PILL SVG placeholder ─────────────────────────────────────────
const PillSVG = () => (
  <svg viewBox="0 0 64 64" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cpg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f43f5e"/><stop offset="100%" stopColor="#e11d48"/></linearGradient>
      <linearGradient id="cpg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient>
      <linearGradient id="cpshine" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(255,255,255,.35)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/></linearGradient>
    </defs>
    <g transform="rotate(-35,32,32)">
      <rect x="6" y="20" width="52" height="24" rx="12" fill="#e2e8f0"/>
      <rect x="6" y="20" width="26" height="24" rx="12" fill="url(#cpg1)"/>
      <rect x="32" y="20" width="26" height="24" rx="12" fill="url(#cpg2)"/>
      <rect x="30" y="20" width="4" height="24" fill="rgba(0,0,0,.12)"/>
      <rect x="6" y="20" width="52" height="24" rx="12" fill="url(#cpshine)"/>
    </g>
  </svg>
);

// ── SUPPLIER COMPARISON SUMMARY (styled document) ─────────────────
function ComparisonSummary({ drug, rows, realRows: _realRows, lang, L, onCreatePO }) {
  const realRows = _realRows && _realRows.length ? _realRows : rows.filter(r => !r.isCwRef);
  const best = realRows[0] || rows[0];
  const supName = r => lang === 'th' ? r.supplier.name : (r.supplier.nameEN || r.supplier.name);
  const fmtP = v => (v != null && v !== '') ? '฿ ' + UTILS.fmt(+v || 0) : '—';
  const maxSavings = realRows.length > 1 ? +(realRows[realRows.length - 1].totalCost - realRows[0].totalCost).toFixed(2) : 0;

  // Best expiry across all rows
  const expMs = str => { if (!str) return 0; const [m, y] = str.split('/'); return new Date(+y, +m - 1).getTime(); };
  const bestExpRow = [...rows].sort((a, b) => expMs(b.deal.expDate) - expMs(a.deal.expDate))[0];

  // Free-shipping count
  const freeShipCount = rows.filter(r => !r.shippingCost).length;

  const today = new Date();
  const todayStr = [String(today.getDate()).padStart(2,'0'), String(today.getMonth()+1).padStart(2,'0'), today.getFullYear()].join('/');

  const cellB = '1px solid #eef2f7';
  const td = (content, style = {}) => (
    <td style={{ padding: '9px 10px', borderBottom: cellB, borderRight: cellB, verticalAlign: 'middle', ...style }}>{content}</td>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.12)', border: '1px solid #e2e8f0', color: '#1e293b', fontFamily: 'inherit' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(160deg,#0f2240 0%,#1a3a5e 55%,#1e4570 100%)', color: '#fff', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {drug.imageUrl
              ? <img src={drug.imageUrl} alt="" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                  style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 6 }} />
              : null}
            <div style={{ display: drug.imageUrl ? 'none' : 'block' }}><PillSVG /></div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#7ab3d4', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              {drug.code} · {drug.unit}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.35, textShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
              {lang === 'th' ? drug.nameTH : (drug.nameEN || drug.nameTH)}
            </div>
            <div style={{ fontSize: 12, color: '#93c5e8', marginTop: 4 }}>
              📋 {L('สรุปการเปรียบเทียบผู้จัดจำหน่าย','Supplier Comparison Summary')}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#7ab3d4', marginBottom: 2 }}>{L('วันที่อัปเดต','Updated')}</div>
          <div style={{ fontWeight: 700, color: '#c5e4f7', fontSize: 13 }}>{todayStr}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '3px 12px', fontSize: 11, color: '#c5e4f7', fontWeight: 700 }}>
              {rows.length} {L('ผู้จัดจำหน่าย','suppliers')}
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION LABELS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', background: '#1e3a5e' }}>
        <div style={{ padding: '7px 14px', color: '#c8dff0', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {L('การเปรียบเทียบผู้จัดจำหน่าย — เรียงจากถูกสุด','SUPPLIERS COMPARISON — CHEAPEST FIRST')}
        </div>
        <div style={{ padding: '7px 14px', color: '#c8dff0', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,.1)' }}>
          {L('สรุป','SUMMARY')}
        </div>
      </div>

      {/* ── LEGEND ── */}
      <div style={{ background: '#f8fafc', padding: '7px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{L('เรียงตามมูลค่ารวม (รวมขนส่ง)','Sorted by total value (incl. shipping)')}</span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        {[
          { color: '#f59e0b', label: L('อันดับ 1 — ถูกสุด','Rank 1 — Cheapest') },
          { color: '#22c55e', label: L('อันดับ 2','Rank 2') },
          { color: '#60a5fa', label: L('อันดับ 3','Rank 3') },
        ].map(({ color, label }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569', fontWeight: 600 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>

      {/* ── TABLE ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#243d5e' }}>
              {[
                { h: L('อันดับ','Rank'),     align: 'center', w: 52 },
                { h: L('ชื่อผู้จัดจำหน่าย','Supplier Name'), align: 'left' },
                { h: L('ราคา/หน่วย (฿)','Price/Unit (฿)'), align: 'right' },
                { h: 'MOQ',                   align: 'center', w: 52 },
                { h: 'VAT',                   align: 'center', w: 52 },
                { h: L('ค่าขนส่ง (฿)','Ship. (฿)'), align: 'right', w: 90 },
                { h: L('มูลค่ารวม (฿)','Total (฿)'), align: 'right' },
                { h: L('วันหมดอายุ','EXP'),  align: 'center', w: 82 },
                { h: L('ถูกสุด','Cheapest'), align: 'center', w: 60 },
                { h: L('วันที่อ้างอิง','Quote Date'), align: 'center', w: 90 },
                { h: L('หมายเหตุ','Remark'), align: 'left' },
              ].map(({ h, align, w }, i) => (
                <th key={i} style={{ padding: '9px 10px', color: '#c8dff0', fontWeight: 600, fontSize: 11, textAlign: align, borderLeft: i > 0 ? '1px solid rgba(255,255,255,.07)' : 'none', letterSpacing: '.02em', ...(w ? { width: w } : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const realRows = rows.filter(r => !r.isCwRef);
              const realRank = realRows.indexOf(row);
              const rs = row.isCwRef ? null : RANK_STYLES[realRank];
              const isTop = !row.isCwRef && realRank < 3;
              const isCheapest = !row.isCwRef && realRank === 0;
              const rowStyle = row.isCwRef
                ? { background: 'linear-gradient(90deg,#f5f3ff,#faf5ff)', borderLeft: '4px solid #8b5cf6', opacity: .92 }
                : isTop
                  ? { background: rs.rowBg, borderLeft: `4px solid ${rs.border}` }
                  : { background: i % 2 === 0 ? '#fff' : '#fafbfc' };
              const qDate = row.deal.quotedDate
                ? new Date(row.deal.quotedDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : '—';
              const nameColor = row.isCwRef ? '#6d28d9' : isTop ? rs.nameColor : '#1e293b';
              const badgeBg = row.isCwRef ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : isTop ? rs.badgeBg : 'linear-gradient(135deg,#334d6e,#1e3a5e)';
              const remark = row.deal.note || (row.supplier.deliveryDays && row.supplier.deliveryDays !== '—' ? `${L('ส่งภายใน','Lead')} ${row.supplier.deliveryDays}d` : '—');
              const rankLabel = row.isCwRef ? '📡' : (i + 1);
              return (
                <tr key={row.supplier.id} style={rowStyle}>
                  {td(
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: badgeBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: row.isCwRef ? 13 : 12, margin: '0 auto', boxShadow: isTop ? `0 2px 6px ${rs.shadow}` : row.isCwRef ? '0 2px 6px rgba(109,40,217,.35)' : undefined }}>{rankLabel}</div>,
                    { textAlign: 'center' }
                  )}
                  {td(
                    <span style={{ fontWeight: 700, color: nameColor }}>
                      {supName(row)}
                      {row.isMain && <span style={{ marginLeft: 5, fontSize: 10, background: 'rgba(37,99,235,.1)', color: '#2563eb', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>⭐ {L('หลัก','Main')}</span>}
                      {row.isCwRef && <span style={{ marginLeft: 5, fontSize: 10, background: 'rgba(109,40,217,.12)', color: '#7c3aed', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>📡 {L('ราคาอ้างอิง','Ref')}</span>}
                    </span>,
                    { textAlign: 'left' }
                  )}
                  {td(<span style={{ fontWeight: 700, color: nameColor, fontVariantNumeric: 'tabular-nums' }}>{fmtP(row.costEx)}</span>, { textAlign: 'right' })}
                  {td('1', { textAlign: 'center' })}
                  {td(drug.hasVat ? '7%' : '—', { textAlign: 'center' })}
                  {td(
                    row.shippingCost > 0
                      ? <span style={{ color: '#dc2626', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtP(row.shippingCost)}</span>
                      : <span style={{ color: '#94a3b8' }}>—</span>,
                    { textAlign: 'right' }
                  )}
                  {td(<span style={{ fontWeight: 800, color: nameColor, fontVariantNumeric: 'tabular-nums' }}>{fmtP(row.totalCost)}</span>, { textAlign: 'right' })}
                  {td(
                    row.deal.expDate
                      ? <span style={{ fontWeight: isCheapest ? 700 : 400 }}>{row.deal.expDate}</span>
                      : <span style={{ color: '#94a3b8', fontSize: 11 }}>{L('ไม่ระบุ','N/A')}</span>,
                    { textAlign: 'center' }
                  )}
                  {td(
                    row.isCwRef
                      ? <span style={{ fontSize: 10, color: '#7c3aed', fontStyle: 'italic' }}>{L('อ้างอิง','ref only')}</span>
                      : isCheapest
                        ? <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, margin: '0 auto', boxShadow: '0 2px 6px rgba(217,119,6,.35)' }}>✓</div>
                        : <div style={{ width: 18, height: 18, border: '2px solid #cbd5e1', borderRadius: 4, margin: '0 auto', background: '#f8fafc' }} />,
                    { textAlign: 'center' }
                  )}
                  {td(<span style={{ color: '#64748b', fontSize: 11 }}>{qDate}</span>, { textAlign: 'center' })}
                  {td(<span style={{ color: '#64748b', fontSize: 11, fontStyle: 'italic' }}>{remark}</span>, { textAlign: 'left' })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── BOTTOM CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '3px solid #e2e8f0' }}>

        {/* Recommendation */}
        <div style={{ padding: '16px 18px', borderRight: '1px solid #e2e8f0', background: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#16a34a,#4ade80)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏆</div>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#15803d' }}>{L('คำแนะนำ','Recommendation')}</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>{L('ตัวเลือกดีที่สุดโดยรวม','BEST OVERALL CHOICE')}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d', margin: '5px 0 10px', lineHeight: 1.3 }}>{supName(best)}</div>
          <ul style={{ listStyle: 'none', fontSize: 12, color: '#475569' }}>
            {[
              `฿ ${UTILS.fmt(best.costEx)} / ${drug.unit}`,
              best.deal.expDate ? `EXP: ${best.deal.expDate}` : null,
              best.shippingCost > 0 ? `${L('ค่าขนส่ง','Ship')}: ฿${UTILS.fmt(best.shippingCost)}` : L('ค่าขนส่งฟรี','Free shipping'),
              `${L('มูลค่ารวม','Total')}: ฿ ${UTILS.fmt(best.totalCost)}`,
            ].filter(Boolean).map((pt, i) => (
              <li key={i} style={{ display: 'flex', gap: 7, marginBottom: 5, alignItems: 'flex-start' }}>
                <div style={{ width: 16, height: 16, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</div>
                {pt}
              </li>
            ))}
          </ul>
          {maxSavings > 0 && (
            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border: '1px solid #bbf7d0', borderRadius: 8, padding: '9px 11px', marginTop: 10, fontSize: 11, color: '#374151', lineHeight: 1.55 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#15803d', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 3 }}>💡 {L('ส่วนต่าง','Savings')}</div>
              {L(`ประหยัดกว่าแพงสุด ฿${UTILS.fmt(maxSavings)} / ${drug.unit}`, `Saves ฿${UTILS.fmt(maxSavings)}/${drug.unit} vs most expensive`)}
            </div>
          )}
        </div>

        {/* Price Highlight */}
        <div style={{ padding: '16px 18px', borderRight: '1px solid #e2e8f0', background: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#d97706,#fb923c)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏷️</div>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#92400e' }}>{L('ราคาโดดเด่น','Price Highlight')}</span>
          </div>
          {[
            { gradFrom: '#16a34a', gradTo: '#22c55e', label: L('มูลค่ารวมต่ำสุด','LOWEST TOTAL'), bgCard: '#f0fdf4', borderCard: '#bbf7d0', row: best, priceColor: '#16a34a' },
            realRows.length > 1
              ? { gradFrom: '#dc2626', gradTo: '#ef4444', label: L('แพงสุด','MOST EXPENSIVE'), bgCard: '#fff7f7', borderCard: '#fecaca', row: realRows[realRows.length - 1], priceColor: '#dc2626' }
              : null,
          ].filter(Boolean).map(({ gradFrom, gradTo, label, bgCard, borderCard, row, priceColor }, i) => (
            <div key={i} style={{ marginBottom: i === 0 ? 10 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, background: `linear-gradient(90deg,${gradFrom},${gradTo})`, color: '#fff', padding: '6px 10px', borderRadius: '6px 6px 0 0', letterSpacing: '.04em', textAlign: 'center', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderTop: 'none', borderRadius: '0 0 7px 7px', padding: '9px 12px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{supName(row)}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: priceColor, margin: '3px 0', fontVariantNumeric: 'tabular-nums' }}>฿ {UTILS.fmt(row.totalCost)}</div>
                {row.shippingCost > 0 && <div style={{ fontSize: 10, color: '#64748b' }}>฿{UTILS.fmt(row.costEx)} + ฿{UTILS.fmt(row.shippingCost)} {L('ขนส่ง','ship')}</div>}
                {row.deal.expDate && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>EXP {row.deal.expDate}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Comparison */}
        <div style={{ padding: '16px 18px', background: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#2563eb,#60a5fa)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1d4ed8' }}>{L('เปรียบเทียบอย่างรวดเร็ว','Quick Comparison')}</span>
          </div>
          {[
            { ico: '🏷️', icoBg: '#fef3c7', lbl: L('ถูกสุด (รวมขนส่ง)','Cheapest (Incl. Ship)'), val: `${supName(best)}`, sub: `฿ ${UTILS.fmt(best.totalCost)}`, valColor: '#d97706' },
            { ico: '📅', icoBg: '#eff6ff', lbl: L('EXP นานสุด','Longest EXP'), val: bestExpRow.deal.expDate ? `${supName(bestExpRow)} (${bestExpRow.deal.expDate})` : L('ไม่มีข้อมูล EXP','No EXP data'), valColor: bestExpRow.deal.expDate ? '#15803d' : '#94a3b8' },
            { ico: '🚚', icoBg: '#fff7ed', lbl: L('ค่าขนส่ง','Shipping'), val: freeShipCount === rows.length ? L('ทุกเจ้าฟรี','All free') : `${L('ฟรี','Free')} ${freeShipCount} / ${rows.length}` },
            { ico: '🥇', icoBg: '#f0fdf4', lbl: L('ดีสุดโดยรวม','Best Overall'), val: supName(best), valColor: '#15803d' },
          ].map(({ ico, icoBg, lbl, val, sub, valColor }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: icoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{ico}</div>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{lbl}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: valColor || '#1e293b', marginTop: 2, lineHeight: 1.3 }}>{val}{sub && <span style={{ marginLeft: 5, fontWeight: 800 }}>{sub}</span>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL DECISION BANNER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', background: 'linear-gradient(135deg,#0f2240 0%,#1a3a5e 100%)' }}>
        <div style={{ background: 'linear-gradient(160deg,#b45309,#d97706,#f59e0b)', padding: '16px 22px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 160 }}>
          <div style={{ fontSize: 28, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.3))' }}>🏆</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', color: 'rgba(255,255,255,.9)', marginTop: 4, textTransform: 'uppercase' }}>{L('ตัดสินใจสุดท้าย','FINAL DECISION')}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginTop: 4, lineHeight: 1.4, textShadow: '0 1px 4px rgba(0,0,0,.2)', textAlign: 'center' }}>{supName(best)}</div>
        </div>
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.16em', color: '#fbbf24', textTransform: 'uppercase', marginBottom: 5 }}>{L('เหตุผล','REASON')}</div>
          <div style={{ fontSize: 12, color: '#b8d4e8', lineHeight: 1.7 }}>
            {L(
              `มูลค่ารวมต่ำสุด ฿${UTILS.fmt(best.totalCost)} / ${drug.unit}${best.deal.expDate ? ` · EXP ${best.deal.expDate}` : ''}${maxSavings > 0 ? ` · ประหยัดกว่าแพงสุด ฿${UTILS.fmt(maxSavings)} / หน่วย` : ''}`,
              `Lowest total ฿${UTILS.fmt(best.totalCost)} / ${drug.unit}${best.deal.expDate ? ` · EXP ${best.deal.expDate}` : ''}${maxSavings > 0 ? ` · Saves ฿${UTILS.fmt(maxSavings)}/unit vs most expensive` : ''}`
            )}
          </div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
          <button
            style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(22,163,74,.45)', whiteSpace: 'nowrap' }}
            onClick={() => onCreatePO ? onCreatePO(best.supplier.id) : undefined}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = ''}>
            📝
            <div>
              <div>{L('สร้าง PO','Create PO')}</div>
              <div style={{ fontSize: 10, opacity: .85, fontWeight: 500 }}>{supName(best).split(' ')[0]}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPARISON PAGE ──────────────────────────────────────────
function ComparisonPage({ lang, L, drugs, suppliers, onCreatePO }) {
  const [search, setSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [tab, setTab] = useState('current'); // 'current' | 'summary' | 'history'
  const [cwHistory, setCwHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [poHistory,  setPoHistory]  = useState([]);
  const chartRef  = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    if (!selectedDrug || !window.UNI_DB?.enabled) { setCwHistory([]); return; }
    setHistLoading(true);
    window.UNI_DB.loadCwPriceHistory([selectedDrug.code])
      .then(map => setCwHistory(map[selectedDrug.code] || []))
      .catch(() => setCwHistory([]))
      .finally(() => setHistLoading(false));
  }, [selectedDrug]);

  useEffect(() => {
    if (!selectedDrug || !window.UNI_DB?.enabled) { setPoHistory([]); return; }
    window.UNI_DB.loadPriceHistory(selectedDrug.code)
      .then(rows => setPoHistory(rows || []))
      .catch(() => setPoHistory([]));
  }, [selectedDrug]);

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

  // ── Build comparison rows (includes deal data, totalCost, CW reference) ──
  const CW_REF_ID = '__cw_ref__';
  const rows = useMemo(() => {
    if (!selectedDrug) return [];
    const deals = selectedDrug.supplierDeals || {};
    const entries = [];

    // Main supplier
    if (selectedDrug.supplierId) {
      const sup = suppliers.find(s => s.id === selectedDrug.supplierId);
      if (sup) entries.push({ sup, costEx: getPrice(selectedDrug, sup), deal: deals[sup.id] || {}, isMain: true, isCwRef: false });
    }
    // Extra suppliers from drug form
    (selectedDrug.extraSuppliers || []).filter(s => s.id).forEach(es => {
      const sup = suppliers.find(s => s.id === es.id);
      if (sup && !entries.some(e => e.sup.id === sup.id)) {
        entries.push({ sup, costEx: getPrice(selectedDrug, sup), deal: deals[sup.id] || {}, isMain: false, isCwRef: false });
      }
    });
    // Fallback: supplier.drugs[] lookup
    if (!entries.length) {
      suppliers.filter(s => (s.drugs || []).includes(selectedDrug.code)).forEach(s => {
        entries.push({ sup: s, costEx: getPrice(selectedDrug, s), deal: deals[s.id] || {}, isMain: false, isCwRef: false });
      });
    }

    // CW reference price — add automatically if auto-sync has data
    const latestCw = [...cwHistory].sort((a,b)=>(b.sync_date||'')>(a.sync_date||'')?1:-1).find(d=>d.cost_00>0);
    if (latestCw) {
      const cwSup = { id: CW_REF_ID, name: 'CW Pharma (PTN)', nameEN: 'CW Pharma (PTN)', category: 'distributor', creditTerm: '—', deliveryDays: 1, rating: 4, drugPrices: {}, promotions: [] };
      const cwDeal = { expDate: '', shippingCost: 0, quotedDate: latestCw.sync_date, note: `📡 CW sync ${latestCw.sync_date}` };
      entries.push({ sup: cwSup, costEx: latestCw.cost_00, deal: cwDeal, isMain: false, isCwRef: true });
    }

    return entries.map(({ sup, costEx, deal, isMain, isCwRef }) => {
      const costInc = selectedDrug.hasVat ? +(costEx * 1.07).toFixed(2) : costEx;
      const promos = isCwRef ? [] : (sup.promotions || []).filter(p =>
        !p.catId || p.catId === selectedDrug.catId ||
        !p.drugCode || p.drugCode === selectedDrug.code
      );
      const bestPromoDisc = promos.reduce((m, p) => Math.max(m, p.discount || 0), 0);
      const afterPromo = bestPromoDisc > 0 ? +(costEx * (1 - bestPromoDisc / 100)).toFixed(2) : costEx;
      const shippingCost = (deal.shippingCost !== '' && deal.shippingCost !== undefined) ? parseFloat(deal.shippingCost) || 0 : 0;
      const totalCost = +(afterPromo + shippingCost).toFixed(2);
      return { supplier: sup, costEx, costInc, promos, bestPromoDisc, afterPromo, shippingCost, totalCost, deal, isMain, isCwRef };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [selectedDrug, suppliers, cwHistory]);

  const realRows    = rows.filter(r => !r.isCwRef);
  const cheapest    = realRows[0] || rows[0];
  const mostExp     = realRows[realRows.length - 1] || rows[rows.length - 1];
  const maxSavings  = realRows.length > 1 ? +(mostExp.totalCost - cheapest.totalCost).toFixed(2) : 0;

  const popular = useMemo(() => {
    const linkedCodes = new Set([
      ...Object.keys(DB.COMP_PRICES),
      ...suppliers.flatMap(s => s.drugs || []),
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
        <div className="card" style={{ marginBottom: 0, padding: 20 }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <label className="label" style={{ fontSize: 14, textAlign: 'center', display: 'block', marginBottom: 10 }}>
              🔍 {L('ค้นหายาที่ต้องการเปรียบเทียบ', 'Search a drug to compare prices')}
            </label>
            <div style={{ position: 'relative' }}>
              {selectedDrug ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)', padding: '10px 14px' }}>
                  {selectedDrug.imageUrl
                    ? <img src={selectedDrug.imageUrl} alt="" onError={e => { e.target.style.display='none'; }} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
                    : <span style={{ fontSize: 20 }}>💊</span>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{lang === 'th' ? selectedDrug.nameTH : (selectedDrug.nameEN || selectedDrug.nameTH)}</div>
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
                        const supCount = suppliers.filter(s => s.drugs?.includes(d.code)).length + (d.extraSuppliers?.length || 0);
                        return (
                          <div key={d.code} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseDown={() => selectDrug(d)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {d.imageUrl && <img src={d.imageUrl} alt="" onError={e => e.target.style.display='none'} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />}
                              <div>
                                <span style={{ color: 'var(--acc)', fontFamily: 'monospace', fontSize: 12 }}>{d.code}</span>
                                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : (d.nameEN || d.nameTH)}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--txt3)', flexShrink: 0 }}>
                              <div style={{ color: 'var(--ok)', fontWeight: 700 }}>฿{UTILS.fmt(d.costEx)}</div>
                              {supCount > 0 && <div>{supCount} {L('ผู้จัดจำหน่าย', 'suppliers')}</div>}
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

      {/* TAB SWITCHER */}
      {selectedDrug && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${tab === 'current' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('current')}>
            ⚖ {L('ราคาปัจจุบัน', 'Current Prices')}
          </button>
          <button className={`btn btn-sm ${tab === 'summary' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('summary')}
            disabled={rows.length === 0}
            style={rows.length === 0 ? { opacity: .45 } : {}}>
            📋 {L('สรุปเปรียบเทียบ', 'Comparison Summary')}
            {rows.length > 0 && <span style={{ marginLeft: 5, fontSize: 10, background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: 10 }}>{rows.length}</span>}
          </button>
          <button className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('history')}>
            📈 {L('ประวัติราคา CW', 'CW Price History')}
            {cwHistory.length > 0 && <span style={{ marginLeft: 5, fontSize: 10, background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: 10 }}>{cwHistory.length}</span>}
          </button>
        </div>
      )}

      {/* ── SUMMARY TAB ── */}
      {selectedDrug && tab === 'summary' && rows.length > 0 && (
        <ComparisonSummary drug={selectedDrug} rows={rows} realRows={realRows} lang={lang} L={L} onCreatePO={onCreatePO} />
      )}

      {/* ── CURRENT PRICES TAB ── */}
      {selectedDrug && tab === 'current' && rows.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, marginBottom: 20, alignItems: 'stretch' }}>
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              {selectedDrug.imageUrl && (
                <img src={selectedDrug.imageUrl} alt="" onError={e => e.target.style.display='none'}
                  style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{lang === 'th' ? selectedDrug.nameTH : (selectedDrug.nameEN || selectedDrug.nameTH)}</div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>
                  {selectedDrug.code} · {lang === 'th' ? UTILS.getCat(selectedDrug.catId).name : UTILS.getCat(selectedDrug.catId).nameEN} · {selectedDrug.unit}
                  {selectedDrug.hasVat && <span className="badge" style={{ marginLeft: 8, background: 'var(--info-bg)', color: 'var(--info)' }}>VAT 7%</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--txt3)' }}>
                  <span>{L('ราคาขาย', 'Sell price')}: <b style={{ color: 'var(--txt)' }}>฿{UTILS.fmt(selectedDrug.sellEx)}</b></span>
                  <span>{L('กำไร', 'Margin')}: <b style={{ color: 'var(--ok)' }}>{selectedDrug.profitMargin}%</b></span>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700, marginBottom: 4 }}>💚 {L('ราคาถูกสุด', 'Cheapest')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ok)' }}>฿{UTILS.fmt(cheapest.totalCost)}</div>
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{cheapest.supplier.name.split(' ').slice(0, 3).join(' ')}</div>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--err)', fontWeight: 700, marginBottom: 4 }}>🔴 {L('ราคาแพงสุด', 'Most Exp.')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--err)' }}>฿{UTILS.fmt(mostExp.totalCost)}</div>
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{mostExp.supplier.name.split(' ').slice(0, 3).join(' ')}</div>
            </div>
            {maxSavings > 0 && (
              <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130, borderColor: 'rgba(22,163,74,.4)', background: 'var(--ok-bg)' }}>
                <div style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700, marginBottom: 4 }}>💰 {L('ส่วนต่าง', 'Max Savings')}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ok)' }}>฿{UTILS.fmt(maxSavings)}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{L('ต่อหน่วย', 'per unit')}</div>
              </div>
            )}
          </div>

          <div style={{ background: 'linear-gradient(135deg,var(--acc) 0%,var(--acc2) 100%)', borderRadius: 'var(--r)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px var(--glow)' }}>
            <div style={{ fontSize: 36 }}>🏆</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                {L('แนะนำ: ซื้อจาก', 'Recommended: Buy from')} {lang === 'th' ? cheapest.supplier.name : (cheapest.supplier.nameEN || cheapest.supplier.name)}
              </div>
              <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13 }}>
                {L('ราคาต้นทุน', 'Cost price')} <b>฿{UTILS.fmt(cheapest.costEx)}</b>
                {cheapest.shippingCost > 0 && <span> + {L('ขนส่ง','ship')} ฿{UTILS.fmt(cheapest.shippingCost)}</span>}
                {' '}<span style={{ marginLeft: 4, background: 'rgba(255,255,255,.2)', padding: '1px 8px', borderRadius: 20 }}>{L('รวม','Total')} ฿{UTILS.fmt(cheapest.totalCost)}</span>
                {cheapest.deal.expDate && <span style={{ marginLeft: 8, fontSize: 12, opacity: .85 }}>· EXP {cheapest.deal.expDate}</span>}
                {maxSavings > 0 && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,.8)', fontSize: 12 }}>· {L('ประหยัดกว่าแพงสุด','Saves vs. most expensive')} ฿{UTILS.fmt(maxSavings)}</span>}
              </div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 4 }}>
                {L('เครดิต', 'Credit')} {cheapest.supplier.creditTerm} {L('วัน', 'days')} ·
                {L('ส่งภายใน', 'Delivery')} {cheapest.supplier.deliveryDays} {L('วัน', 'days')} ·
                ⭐ {cheapest.supplier.rating}/5
              </div>
            </div>
          </div>

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
                    <th style={{ textAlign: 'right' }}>{L('ต้นทุน', 'Cost')}</th>
                    {selectedDrug.hasVat && <th style={{ textAlign: 'right' }}>+VAT</th>}
                    <th style={{ textAlign: 'right' }}>{L('ค่าขนส่ง','Ship')}</th>
                    <th style={{ textAlign: 'right' }}>{L('รวม','Total')}</th>
                    <th style={{ textAlign: 'center' }}>{L('วันหมดอายุ','EXP')}</th>
                    <th style={{ textAlign: 'right' }}>{L('vs ถูกสุด', 'vs Cheapest')}</th>
                    <th>{L('โปรโมชั่น', 'Promotions')}</th>
                    <th style={{ textAlign: 'center' }}>{L('เครดิต', 'Credit')}</th>
                    <th style={{ textAlign: 'center' }}>{L('ส่ง', 'Lead')}</th>
                    <th style={{ textAlign: 'center' }}>{L('คะแนน', 'Rating')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const isCheap = i === 0;
                    const isExp = i === rows.length - 1 && rows.length > 1;
                    const diff = +(row.totalCost - cheapest.totalCost).toFixed(2);
                    const pctDiff = cheapest.totalCost > 0 ? +((diff / cheapest.totalCost) * 100).toFixed(1) : 0;
                    return (
                      <tr key={row.supplier.id} style={{ background: isCheap ? 'rgba(22,163,74,.07)' : isExp ? 'rgba(220,38,38,.05)' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, margin: '0 auto', background: isCheap ? 'var(--ok)' : isExp ? 'var(--err)' : 'var(--bg4)', color: isCheap || isExp ? '#fff' : 'var(--txt3)' }}>
                            {isCheap ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{row.supplier.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{UTILS.getSupCat(row.supplier.category, lang)}</div>
                          {row.isMain && <span style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700 }}>⭐ {L('ผู้จัดจำหน่ายหลัก','Main')}</span>}
                          {isCheap && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ok)', background: 'var(--ok-bg)', padding: '1px 6px', borderRadius: 20, display: 'block', marginTop: 2, width: 'fit-content' }}>✓ {L('แนะนำ', 'BEST BUY')}</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: isCheap ? 'var(--ok)' : isExp ? 'var(--err)' : 'var(--txt)' }}>
                          ฿{UTILS.fmt(row.costEx)}
                        </td>
                        {selectedDrug.hasVat && <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--info)' }}>฿{UTILS.fmt(row.costInc)}</td>}
                        <td style={{ textAlign: 'right', fontSize: 12 }}>
                          {row.shippingCost > 0 ? <span style={{ color: 'var(--err)' }}>฿{UTILS.fmt(row.shippingCost)}</span> : <span style={{ color: 'var(--txt4)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 14, color: isCheap ? 'var(--ok)' : isExp ? 'var(--err)' : 'var(--txt)' }}>
                          ฿{UTILS.fmt(row.totalCost)}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 12, color: row.deal.expDate ? 'var(--txt)' : 'var(--txt4)' }}>
                          {row.deal.expDate || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {diff === 0 ? <span style={{ color: 'var(--ok)', fontWeight: 700 }}>— {L('ถูกสุด','Cheapest')}</span> : (
                            <div><div style={{ color: 'var(--err)', fontWeight: 700 }}>+฿{UTILS.fmt(diff)}</div><div style={{ fontSize: 10, color: 'var(--txt3)' }}>+{pctDiff}%</div></div>
                          )}
                        </td>
                        <td style={{ maxWidth: 160 }}>
                          {row.promos.length > 0 ? row.promos.map(p => (
                            <div key={p.id} style={{ fontSize: 10, color: 'var(--ok)', background: 'var(--ok-bg)', borderRadius: 4, padding: '2px 7px', marginBottom: 3, lineHeight: 1.4 }}>
                              🎁 {p.name}
                            </div>
                          )) : <span style={{ color: 'var(--txt4)', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 12 }}>{row.supplier.creditTerm} {L('วัน','d')}</td>
                        <td style={{ textAlign: 'center', fontSize: 12 }}>{row.supplier.deliveryDays} {L('วัน','d')}</td>
                        <td style={{ textAlign: 'center' }}><RatingStars rating={row.supplier.rating} /></td>
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
          {histLoading && <div className="no-data card">⏳ {L('กำลังโหลดประวัติราคา…', 'Loading price history…')}</div>}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { lbl: L('วันที่บันทึก','Days Tracked'), val: cwHistory.length, sub: L('รายการ','entries'), color: 'var(--txt)' },
                    { lbl: L('ทุนต่ำสุด','Min Cost'), val: '฿'+UTILS.fmt(minCost), color: 'var(--ok)' },
                    { lbl: L('ทุนสูงสุด','Max Cost'), val: '฿'+UTILS.fmt(maxCost), color: 'var(--err)' },
                    { lbl: L('เปลี่ยนแปลงสุทธิ','Net Change'), val: totalChange === null ? '—' : (isUp ? '+' : '') + totalChange + '%', sub: L('ตั้งแต่รายการแรก','since first record'), color: isUp ? 'var(--err)' : isDown ? 'var(--ok)' : 'var(--txt3)' },
                  ].map(({ lbl, val, sub, color }, i) => (
                    <div key={i} className="card-sm" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: color, marginBottom: 4 }}>{lbl}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                      {sub && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{sub}</div>}
                    </div>
                  ))}
                </div>
                {cwHistory.length >= 2 && (
                  <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>📈 {L('กราฟราคา CW — สาขาประตูน้ำ (PTN)', 'CW Price Chart — PTN Branch')}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, fontSize: 11, color: 'var(--txt3)' }}>
                        {[{ color: '#3b82f6', label: L('ราคาทุน','Cost') }, { color: '#22c55e', label: L('ราคาขาย','Sell') }].map(({ color, label }) => (
                          <span key={label}><span style={{ display: 'inline-block', width: 14, height: 3, background: color, verticalAlign: 'middle', marginRight: 4, borderRadius: 2 }} />{label}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: 200 }}><canvas ref={chartRef} /></div>
                  </div>
                )}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                    🗓 {L('บันทึกราคา CW รายวัน', 'Daily CW Price Log')}
                    <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--txt3)', marginLeft: 8 }}>({cwHistory.length} {L('รายการ','entries')})</span>
                  </div>
                  <div className="tbl-wrap" style={{ border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>{L('วันที่','Date')}</th>
                          <th style={{ textAlign:'right' }}>{L('ทุน PTN','Cost PTN')}</th>
                          <th style={{ textAlign:'right' }}>{L('ขาย PTN','Sell PTN')}</th>
                          <th style={{ textAlign:'right' }}>{L('เปลี่ยนแปลง (ทุน)','Cost Change')}</th>
                          <th style={{ textAlign:'right' }}>Stock PTN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...cwHistory].reverse().map((row, i, arr) => {
                          const prev = arr[i + 1];
                          const cc = prev && prev.cost_00 > 0 && row.cost_00 > 0 ? +(row.cost_00 - prev.cost_00).toFixed(4) : null;
                          const pct = cc !== null && prev.cost_00 > 0 ? (cc / prev.cost_00 * 100).toFixed(1) : null;
                          return (
                            <tr key={row.sync_date}>
                              <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--txt2)' }}>{row.sync_date}</td>
                              <td style={{ textAlign:'right', fontWeight:600 }}>{row.cost_00 > 0 ? '฿'+UTILS.fmt(row.cost_00) : <span style={{ color:'var(--txt4)' }}>—</span>}</td>
                              <td style={{ textAlign:'right', color:'var(--txt2)' }}>{row.sell_00 > 0 ? '฿'+UTILS.fmt(row.sell_00) : <span style={{ color:'var(--txt4)' }}>—</span>}</td>
                              <td style={{ textAlign:'right', fontSize:12 }}>
                                {cc === null ? <span style={{ color:'var(--txt4)' }}>—</span>
                                  : cc === 0 ? <span style={{ color:'var(--txt3)' }}>—</span>
                                  : cc > 0 ? <span style={{ color:'var(--err)', fontWeight:700 }}>▲ ฿{UTILS.fmt(Math.abs(cc))} <span style={{ fontSize:10 }}>(+{pct}%)</span></span>
                                  : <span style={{ color:'var(--ok)', fontWeight:700 }}>▼ ฿{UTILS.fmt(Math.abs(cc))} <span style={{ fontSize:10 }}>({pct}%)</span></span>}
                              </td>
                              <td style={{ textAlign:'right', fontSize:12, color:'var(--txt3)' }}>{row.stock_00 != null ? row.stock_00 : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                    🛒 {L('ประวัติการสั่งซื้อจริง (จาก PO)', 'Actual Purchase History (from POs)')}
                    {poHistory.length > 0 && <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--txt3)', marginLeft: 8 }}>({poHistory.length} {L('รายการ','entries')})</span>}
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
                            <th>{L('วันที่สั่งซื้อ','PO Date')}</th>
                            <th>{L('ผู้แทนฯ','Supplier')}</th>
                            <th style={{ textAlign:'right' }}>{L('ราคา/หน่วย','Unit Price')}</th>
                            <th>{L('เลข PO','PO No.')}</th>
                            <th style={{ textAlign:'right' }}>{L('vs CW','vs CW')}</th>
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
                                <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--txt2)' }}>{row.po_date ? row.po_date.slice(0,10) : '—'}</td>
                                <td style={{ fontWeight:600, fontSize:12 }}>{sup ? (lang==='th'?sup.name:(sup.nameEN||sup.name)) : row.supplier_id}</td>
                                <td style={{ textAlign:'right', fontWeight:700 }}>{row.cost_ex > 0 ? '฿'+UTILS.fmt(row.cost_ex) : '—'}</td>
                                <td style={{ fontSize:11, color:'var(--txt3)', fontFamily:'monospace' }}>{row.po_number || '—'}</td>
                                <td style={{ textAlign:'right', fontSize:12 }}>
                                  {diff === null ? <span style={{ color:'var(--txt4)' }}>—</span>
                                    : diff === 0 ? <span style={{ color:'var(--txt3)' }}>—</span>
                                    : diff > 0 ? <span style={{ color:'var(--err)', fontWeight:700 }}>+฿{UTILS.fmt(Math.abs(diff))}</span>
                                    : <span style={{ color:'var(--ok)', fontWeight:700 }}>-฿{UTILS.fmt(Math.abs(diff))}</span>}
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

      {/* Landing: popular drugs */}
      {!selectedDrug && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt2)', marginBottom: 12 }}>
            ⭐ {L('ค้นหาด่วน — สินค้ายอดนิยม', 'Quick Search — Popular Products')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {popular.map(d => {
              const supList = suppliers.filter(s => s.drugs?.includes(d.code));
              const allSups = [...supList, ...(d.extraSuppliers||[]).filter(s=>s.id).map(es=>suppliers.find(s=>s.id===es.id)).filter(Boolean)];
              const prices = allSups.map(s => getPrice(d, s));
              const minP = prices.length ? Math.min(...prices) : d.costEx;
              const maxP = prices.length ? Math.max(...prices) : d.costEx;
              return (
                <div key={d.code} className="card-sm" style={{ cursor: 'pointer', transition: '.15s' }}
                  onClick={() => selectDrug(d)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {d.imageUrl && <img src={d.imageUrl} alt="" onError={e=>e.target.style.display='none'} style={{ width: 32, height: 32, objectFit:'contain', borderRadius:5, flexShrink:0 }} />}
                    <div style={{ fontWeight: 700, fontSize: 13 }} className="ellipsis">{lang === 'th' ? d.nameTH : (d.nameEN || d.nameTH)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 10 }}>
                    {d.code} · {(d.extraSuppliers?.length || 0) + (supList.length || 0)} {L('ผู้จัดจำหน่าย', 'suppliers')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'flex-end' }}>
                    <div><div style={{ fontSize: 10, color: 'var(--txt4)' }}>{L('ถูกสุด','Cheapest')}</div><div style={{ fontWeight: 800, color: 'var(--ok)', fontSize: 15 }}>฿{UTILS.fmt(minP)}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: 'var(--txt4)' }}>{L('แพงสุด','Most Exp.')}</div><div style={{ fontWeight: 700, color: 'var(--err)' }}>฿{UTILS.fmt(maxP)}</div></div>
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
