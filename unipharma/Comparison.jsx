// Comparison.jsx — Price Comparison (Full Supplier Pricing)
const { useState, useMemo } = React;

// Supplier tier multipliers for price generation
const SUP_MULTIPLIER = {
  SUP001: 1.00, SUP002: 1.07, SUP003: 1.11, SUP004: 1.04,
  SUP005: 0.97, SUP006: 1.09, SUP007: 1.02, SUP008: 0.99,
  SUP009: 1.00, SUP010: 1.03
};

// Get price for a supplier-drug pair (COMP_PRICES or generated)
function getPrice(drug, supId) {
  const comp = DB.COMP_PRICES[drug.code];
  if (comp && comp[supId] !== undefined) return comp[supId];
  const mult = SUP_MULTIPLIER[supId] || 1;
  // Deterministic variation: hash of supId + code
  const hash = [...(supId + drug.code)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((hash % 11) - 5) * 0.005; // ±2.5%
  return +(drug.costEx * (mult + jitter)).toFixed(2);
}

function ComparisonPage({ lang, L, drugs, suppliers }) {
  const [search, setSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

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
    const supList = suppliers.filter(s => s.drugs?.includes(selectedDrug.code));
    return supList.map(s => {
      const costEx = getPrice(selectedDrug, s.id);
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
  const mostExp = rows[rows.length - 1];
  const maxSavings = rows.length > 1 ? +(mostExp.afterPromo - cheapest.afterPromo).toFixed(2) : 0;

  // Popular drugs that have comp_price data
  const popular = useMemo(() => {
    const codes = Object.keys(DB.COMP_PRICES);
    return drugs.filter(d => codes.includes(d.code)).slice(0, 12);
  }, [drugs]);

  const selectDrug = d => { setSelectedDrug(d); setSearch(''); setShowSearch(false); };
  const clearDrug = () => { setSelectedDrug(null); setSearch(''); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">⚖ {L('เปรียบเทียบราคา', 'Price Comparison')}</div>
          <div className="page-subtitle">{L('เทียบราคาจากทุกผู้จัดจำหน่ายและรับคำแนะนำซื้อที่ดีที่สุด', 'Compare prices across all suppliers — get the best buying recommendation')}</div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <label className="label" style={{ fontSize: 14, textAlign: 'center', display: 'block', marginBottom: 10 }}>
            🔍 {L('ค้นหายาที่ต้องการเปรียบเทียบ', 'Search a drug to compare prices')}
          </label>
          <div style={{ position: 'relative' }}>
            {selectedDrug ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)', padding: '10px 14px' }}>
                <span style={{ fontSize: 20 }}>💊</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{lang === 'th' ? selectedDrug.nameTH : selectedDrug.nameEN}</div>
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
                      const prices = suppliers.filter(s => s.drugs?.includes(d.code)).map(s => getPrice(d, s.id));
                      const minP = prices.length ? Math.min(...prices) : d.costEx;
                      const maxP = prices.length ? Math.max(...prices) : d.costEx;
                      return (
                        <div key={d.code} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseDown={() => selectDrug(d)}>
                          <div>
                            <span style={{ color: 'var(--acc)', fontFamily: 'monospace', fontSize: 12 }}>{d.code}</span>
                            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? d.nameTH : d.nameEN}</span>
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

      {/* RESULTS */}
      {selectedDrug && rows.length > 0 && (
        <>
          {/* Drug info + Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, marginBottom: 20, alignItems: 'stretch' }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{lang === 'th' ? selectedDrug.nameTH : selectedDrug.nameEN}</div>
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
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{lang==='th'?cheapest.supplier.name.split(' ').slice(0,3).join(' '):cheapest.supplier.nameEN.split(' ').slice(0,3).join(' ')}</div>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--err)', fontWeight: 700, marginBottom: 4 }}>🔴 {L('ราคาแพงสุด', 'Most Exp.')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--err)' }}>฿{UTILS.fmt(mostExp.afterPromo)}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{lang==='th'?mostExp.supplier.name.split(' ').slice(0,3).join(' '):mostExp.supplier.nameEN.split(' ').slice(0,3).join(' ')}</div>
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
                {L('แนะนำ: ซื้อจาก', 'Recommended: Buy from')} {lang==='th'?cheapest.supplier.name:cheapest.supplier.nameEN}
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

      {selectedDrug && rows.length === 0 && (
        <div className="no-data card">{L('ไม่มีผู้จัดจำหน่ายสำหรับสินค้านี้ในระบบ', 'No suppliers found for this product')}</div>
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
              const prices = supList.map(s => getPrice(d, s.id));
              const minP = prices.length ? Math.min(...prices) : d.costEx;
              const maxP = prices.length ? Math.max(...prices) : d.costEx;
              const savings = +(maxP - minP).toFixed(2);
              return (
                <div key={d.code} className="card-sm" style={{ cursor: 'pointer', transition: '.15s' }}
                  onClick={() => selectDrug(d)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }} className="ellipsis">{lang === 'th' ? d.nameTH : d.nameEN}</div>
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
