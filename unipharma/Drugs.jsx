// Drugs.jsx — Drug Database Page
const { useState, useMemo, useCallback, useEffect } = React;

// Maps CW Pharma Thai unit strings → UNIPHARMA unit codes
const CW_UNIT_MAP = {
  // Dosage forms
  'เม็ด':'TAB','แคปซูล':'CAP','ซอฟต์เจล':'SGC','ยาเหน็บ':'SUPP',
  'ยาอม':'LOZ','ผงยา':'POW','ยาผงซอง':'SACH','แกรนูล':'GRAN',
  // Liquid
  'มิลลิลิตร':'ML','มล.':'ML','ซีซี':'CC','ลิตร':'L','สเปรย์':'SPRAY',
  // Medical
  'หลอดยา':'AMP','แอมพูล':'AMP','ไวอัล':'VIAL','แผ่นแปะ':'PATCH',
  // Packaging
  'แผง':'STRIP','ขวด':'BTL','กล่อง':'BOX','ซอง':'POUCH','หลอด':'TUBE',
  'กระปุก':'JAR','กระป๋อง':'CAN','ถุง':'BAG','แพ็ก':'PK','ม้วน':'ROLL',
  'ชุด':'SET','คู่':'PAIR','โหล':'DOZ','ลัง':'CTN',
  // Generic
  'ชิ้น':'EA','อัน':'EA','แท่ง':'EA','ก้าน':'EA',
};

const PER_PAGE = 50;
// Created once at module level — Intl.Collator construction is expensive
const NATURAL_CMP = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function UnusedDrugsPanel({ lang, L, drugs, onEdit }) {
  const [usedCodes, setUsedCodes] = useState(null);
  useEffect(() => {
    if (window.UNI_DB && window.UNI_DB.loadUsedDrugCodes) {
      window.UNI_DB.loadUsedDrugCodes().then(codes => setUsedCodes(codes));
    } else {
      setUsedCodes(new Set());
    }
  }, []);
  const unused = React.useMemo(() =>
    usedCodes ? drugs.filter(d => !usedCodes.has(d.code)) : null,
    [drugs, usedCodes]
  );
  if (!unused) return <div style={{padding:40,textAlign:'center',color:'var(--txt3)'}}>⏳ {L('กำลังตรวจสอบ…','Checking…')}</div>;
  return (
    <div>
      <div style={{padding:'10px 0',color:'var(--txt3)',fontSize:13,marginBottom:8}}>
        {L('พบ','Found')} <strong>{unused.length.toLocaleString()}</strong> {L('รายการที่ยังไม่เคยมี PO','items with no purchase order yet')}
      </div>
      {unused.length === 0 ? (
        <div style={{textAlign:'center',padding:40,color:'var(--ok)',fontSize:14}}>✅ {L('ทุกรายการมี PO แล้ว','All items have POs')}</div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table className="table" style={{width:'100%',fontSize:13}}>
            <thead><tr>
              <th style={{width:100}}>{L('รหัส','Code')}</th>
              <th>{L('ชื่อไทย','Thai Name')}</th>
              <th>{L('ชื่ออังกฤษ','English Name')}</th>
              <th style={{width:80}}>{L('หน่วย','Unit')}</th>
              <th style={{width:80}}></th>
            </tr></thead>
            <tbody>
              {unused.map(d => (
                <tr key={d.code} style={{cursor:'pointer'}} onClick={()=>onEdit(d)}>
                  <td><code style={{fontSize:11,background:'var(--bg3)',borderRadius:4,padding:'2px 6px'}}>{d.code}</code></td>
                  <td>{d.nameTH}</td>
                  <td style={{color:'var(--txt3)',fontSize:12}}>{d.nameEN}</td>
                  <td style={{color:'var(--txt3)'}}>{d.unit}</td>
                  <td><button className="btn btn-xs btn-ghost" onClick={e=>{e.stopPropagation();onEdit(d);}}>✏️ {L('แก้ไข','Edit')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CwPriceChart({ history, lang }) {
  const [branch, setBranch] = React.useState('00');
  if (!history) return (
    <div style={{ fontSize:10, color:'var(--txt4)', marginTop:6 }}>
      ⏳ {lang==='th' ? 'กำลังโหลดประวัติราคา…' : 'Loading price history…'}
    </div>
  );
  if (history.length < 2) return (
    <div style={{ fontSize:10, color:'var(--txt4)', fontStyle:'italic', marginTop:6 }}>
      {lang==='th' ? '(ยังไม่มีประวัติ — จะสะสมทีละวันจากนี้)' : '(No history yet — builds up daily from now)'}
    </div>
  );
  const W = 300, H = 72, PX = 6, PY = 10;
  const ck = 'cost_' + branch, sk = 'sell_' + branch;
  const vals = history.flatMap(h => [+(h[ck]||0), +(h[sk]||0)]).filter(v => v > 0);
  if (!vals.length) return null;
  const minV = Math.min(...vals) * 0.97, maxV = Math.max(...vals) * 1.03, rng = maxV - minV || 1;
  const n = history.length;
  const px = i => PX + (i / (n - 1)) * (W - 2 * PX);
  const py = v => H - PY - ((v - minV) / rng) * (H - 2 * PY);
  const path = key => history.map((h,i) => (i===0?'M':'L') + px(i).toFixed(1) + ',' + py(+(h[key]||0)).toFixed(1)).join('');
  const last = history[history.length - 1];
  const lc = +(last[ck]||0), ls = +(last[sk]||0);
  const profit = ls - lc;
  const margin = ls > 0 ? ((profit / ls) * 100).toFixed(1) : '0.0';
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
        <span style={{ fontSize:10, fontWeight:600, color:'var(--txt3)' }}>📈 {lang==='th'?'ประวัติราคา':'Price History'}</span>
        {['00','01','02'].map(b => (
          <button key={b} onClick={()=>setBranch(b)} style={{
            fontSize:9, padding:'1px 5px', borderRadius:3, border:'1px solid var(--border)',
            background: branch===b ? 'var(--acc1)' : 'transparent',
            color: branch===b ? '#fff' : 'var(--txt3)', cursor:'pointer' }}>
            {b==='00'?'PTN':b==='01'?'RAM':'CNX'}
          </button>
        ))}
        <span style={{ fontSize:9, color:'var(--txt4)', marginLeft:'auto' }}>
          {history[0].sync_date.slice(5)} – {last.sync_date.slice(5)} ({n} {lang==='th'?'จุด':'pts'})
        </span>
      </div>
      <svg width={W} height={H} style={{ display:'block', border:'1px solid var(--border)', borderRadius:4 }}>
        <path d={path(ck)} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        <path d={path(sk)} fill="none" stroke="#22c55e" strokeWidth="1.5" />
        <circle cx={px(n-1)} cy={py(lc)} r="2.5" fill="#3b82f6" />
        <circle cx={px(n-1)} cy={py(ls)} r="2.5" fill="#22c55e" />
      </svg>
      <div style={{ display:'flex', gap:10, fontSize:10, color:'var(--txt4)', marginTop:2 }}>
        <span><span style={{color:'#3b82f6'}}>●</span> {lang==='th'?'ต้นทุน':'Cost'} {lc?UTILS.fmt(lc)+' ฿':'-'}</span>
        <span><span style={{color:'#22c55e'}}>●</span> {lang==='th'?'ราคาขาย':'Sell'} {ls?UTILS.fmt(ls)+' ฿':'-'}</span>
        {profit > 0 && <span style={{color:'var(--ok)'}}>กำไร {UTILS.fmt(profit)} ฿ ({margin}%)</span>}
      </div>
    </div>
  );
}

function DrugDetailModal({ drug: d, lang, L, suppliers, cats, cwStock, cwHistory, orders, onEdit, onClose }) {
  const [tab, setTab] = React.useState('info');

  const cat = cats.find(c => c.id === d.catId) || { name: d.catId || '', nameEN: d.catId || '', color: '#94a3b8', subs: [] };
  const sub = (cat.subs || []).find(s => s.id === d.subId) || { name: d.subId || '', nameEN: d.subId || '' };
  const supplier = suppliers.find(x => x.id === d.supplierId) || suppliers.find(x => (x.drugs || []).includes(d.code));

  // PO history for this drug (non-cancelled, newest first)
  const drugPOs = React.useMemo(() => (orders || [])
    .filter(o => o.status !== 'cancelled' && (o.items || []).some(it => it.code === d.code))
    .sort((a, b) => (b.poDate || '').localeCompare(a.poDate || '')),
    [orders, d.code]);
  const lastPO = drugPOs[0] || null;
  const lastPOSup = lastPO ? suppliers.find(x => x.id === lastPO.supplierId) : null;
  // Unique suppliers from PO history with count + latest date
  const poSupRows = React.useMemo(() => {
    const m = {};
    drugPOs.forEach(o => {
      if (!o.supplierId) return;
      if (!m[o.supplierId]) m[o.supplierId] = { id: o.supplierId, count: 0, lastDate: '' };
      m[o.supplierId].count++;
      if (!m[o.supplierId].lastDate || o.poDate > m[o.supplierId].lastDate) m[o.supplierId].lastDate = o.poDate;
    });
    return Object.values(m).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [drugPOs]);
  const cw = cwStock[d.code];
  const history = cwHistory[d.code];
  const rmk = d.remark ? DRUG_REMARKS.find(x => x.code === d.remark) : null;
  const cwBranches = cw ? [
    { id: 'PTN', stock: cw.stock_00 ?? 0, cost: cw.cost_00 ?? 0, sell: cw.sell_00 ?? 0, color: '#f59e0b' },
    { id: 'RAM', stock: cw.stock_01 ?? 0, cost: cw.cost_01 ?? 0, sell: cw.sell_01 ?? 0, color: '#06b6d4' },
    { id: 'CNX', stock: cw.stock_02 ?? 0, cost: cw.cost_02 ?? 0, sell: cw.sell_02 ?? 0, color: '#8b5cf6' },
  ] : [];
  const cwTotal = cwBranches.reduce((s, b) => s + b.stock, 0);

  const supsRaw = (d.extraSuppliers || (d.extraSupplierIds || []).map(id => ({ id, costEx: 0, sellEx: 0 }))).filter(s => s.id);
  const deals = d.supplierDeals || {};
  const supIds = [d.supplierId, ...supsRaw.map(s => s.id)].filter(Boolean);
  const activeDeals = supIds.map(sid => ({ sid, deal: deals[sid] })).filter(({ deal }) => deal && (deal.buyQty > 0 || deal.freeQty > 0 || deal.freeItems || deal.specialDiscount > 0 || deal.note));

  React.useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const CARD = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 };
  const CARD_T = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '.8px', color: '#f59e0b', fontWeight: 700, marginBottom: 12 };
  const ROW = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8 };
  const ROW_K = { color: 'var(--txt3)', flexShrink: 0 };
  const ROW_V = { color: 'var(--txt)', fontWeight: 500, textAlign: 'right' };

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:18, width:'100%', maxWidth:820, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 40px 100px rgba(0,0,0,.7)', animation:'modal-in .3s cubic-bezier(.34,1.46,.64,1)' }}>

        {/* ── Banner ── */}
        <div style={{ padding:'22px 28px 18px', flexShrink:0, background:'linear-gradient(135deg,rgba(245,158,11,.1) 0%,var(--bg1) 60%)', borderBottom:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-50, right:-30, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,.15) 0%,transparent 70%)', pointerEvents:'none' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:16, position:'relative', zIndex:1 }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.28)', color:'#f59e0b', fontSize:11, fontWeight:800, padding:'3px 12px', borderRadius:99, marginBottom:6, letterSpacing:'.3px' }}>
                {d.code} · {lang === 'th' ? cat.name : cat.nameEN}
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--txt)', lineHeight:1.2 }}>{lang === 'th' ? d.nameTH : (d.nameEN || d.nameTH)}</div>
              <div style={{ fontSize:12, color:'var(--txt3)', marginTop:3 }}>{lang === 'th' ? (d.nameEN || '') : d.nameTH}</div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:'50%', width:34, height:34, color:'var(--txt2)', cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, lineHeight:1 }}>×</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, position:'relative', zIndex:1 }}>
            {[
              { label:L('ต้นทุน excl.','Cost excl.'),       val:UTILS.fmt(d.costEx)+' ฿',                           sub:d.hasVat?'incl. '+UTILS.fmt(d.costInc)+' ฿':null },
              { label:L('ราคาขาย excl.','Sell excl.'),      val:UTILS.fmt(d.sellEx)+' ฿', color:'#22d3ee',          sub:d.hasVat?'incl. '+UTILS.fmt(d.sellInc)+' ฿':null },
              { label:L('กำไร/หน่วย','Profit/unit'),        val:UTILS.fmt(d.profitEx)+' ฿', color:'var(--ok)',       sub:d.profitMargin+'%' },
              { label:L('Stock CW รวม','Total CW stock'),    val:(cw?cwTotal:d.totalStock).toLocaleString(), color:'#fbbf24', sub:L('3 สาขา','3 branches') },
            ].map(({ label, val, sub, color }) => (
              <div key={label}>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.6px', color:'var(--txt4)', fontWeight:700 }}>{label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:color||'var(--txt)', marginTop:4, fontVariantNumeric:'tabular-nums' }}>{val}</div>
                {sub && <div style={{ fontSize:10, color:'var(--txt4)', marginTop:2 }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 28px', flexShrink:0, background:'var(--bg1)' }}>
          {[
            { key:'info',     label:L('📋 ข้อมูลยา','📋 Drug Info') },
            { key:'stock',    label:L('📦 สต็อก CW','📦 CW Stock') },
            { key:'supplier', label:L('🏢 ซัพพลายเออร์','🏢 Supplier') },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:'11px 16px', fontSize:13, color:tab===t.key?'#f59e0b':'var(--txt3)', cursor:'pointer', whiteSpace:'nowrap', border:'none', borderBottom:`2px solid ${tab===t.key?'#f59e0b':'transparent'}`, marginBottom:-1, fontWeight:500, background:'none', fontFamily:'inherit', transition:'color .15s' }}>{t.label}</button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'22px 28px' }}>

          {tab === 'info' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={CARD}>
                  <div style={CARD_T}>{L('ข้อมูลพื้นฐาน','Basic Info')}</div>
                  {[
                    [L('หมวดหมู่','Category'),     <span style={{color:cat.color,fontWeight:600}}>{lang==='th'?cat.name:cat.nameEN}</span>],
                    [L('หมวดย่อย','Sub-category'),  (lang==='th'?sub.name:sub.nameEN)||'—'],
                    [L('หน่วย','Unit'),              UTILS.getUnit(d.unit, lang)],
                    ['VAT',                          d.hasVat?<span className="badge" style={{background:'var(--info-bg)',color:'var(--info)'}}>VAT 7%</span>:'—'],
                    [L('สั่งซื้อแล้ว','Ordered'),   `${d.orderCount||0} ${L('ครั้ง/ปี','times/yr')}`],
                    [L('Min Stock','Min Stock'),      d.minStock],
                  ].map(([k,v],i,arr)=>(
                    <div key={k} style={{...ROW, borderBottom:i===arr.length-1?'none':'1px solid var(--border)'}}>
                      <span style={ROW_K}>{k}</span><span style={ROW_V}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={CARD}>
                  <div style={CARD_T}>{L('ราคา','Price')}</div>
                  {[
                    [L('ต้นทุน excl. VAT','Cost excl. VAT'),  UTILS.fmt(d.costEx)+' ฿'],
                    [L('ต้นทุน incl. VAT','Cost incl. VAT'),  UTILS.fmt(d.costInc)+' ฿'],
                    [L('ราคาขาย excl.','Sell excl.'),          <span style={{color:'#22d3ee',fontWeight:700}}>{UTILS.fmt(d.sellEx)} ฿</span>],
                    [L('ราคาขาย incl.','Sell incl.'),          UTILS.fmt(d.sellInc)+' ฿'],
                    [L('กำไร/หน่วย','Profit/unit'),            <span style={{color:'var(--ok)',fontWeight:700}}>{UTILS.fmt(d.profitEx)} ฿ ({d.profitMargin}%)</span>],
                  ].map(([k,v],i,arr)=>(
                    <div key={k} style={{...ROW, borderBottom:i===arr.length-1?'none':'1px solid var(--border)'}}>
                      <span style={ROW_K}>{k}</span><span style={ROW_V}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {rmk && (
                <div style={{...CARD, marginTop:14}}>
                  <div style={CARD_T}>📝 {L('หมายเหตุ','Remark')}</div>
                  <div style={{fontSize:12,padding:'3px 10px',borderRadius:20,background:'var(--warn-bg)',color:'var(--warn)',fontWeight:700,display:'inline-block',marginBottom:8}}>{lang==='th'?rmk.th:rmk.en}</div>
                  <div style={{fontSize:13,color:'var(--txt2)',lineHeight:1.5}}>{lang==='th'?rmk.detailTH:rmk.detailEN}</div>
                  {d.remarkNote&&<div style={{fontSize:11,color:'var(--txt4)',marginTop:6,fontStyle:'italic'}}>📌 {d.remarkNote}</div>}
                </div>
              )}
              {DB.BRANCHES.some(br=>d.costByBranch?.[br.id]!=null)&&(
                <div style={{...CARD, marginTop:14}}>
                  <div style={CARD_T}>{L('ต้นทุนแต่ละสาขา','Cost by Branch')}</div>
                  {DB.BRANCHES.map(br=>d.costByBranch?.[br.id]!=null?(
                    <div key={br.id} style={{...ROW, borderBottom:'1px solid var(--border)'}}>
                      <span style={{color:br.color,fontWeight:700}}>{lang==='th'?br.name:br.nameEN}</span>
                      <span style={{fontWeight:600}}>{UTILS.fmt(d.costByBranch[br.id])} ฿</span>
                    </div>
                  ):null)}
                </div>
              )}
            </div>
          )}

          {tab === 'stock' && (
            <div>
              <div style={{...CARD, marginBottom:14}}>
                <div style={CARD_T}>{L('สต็อกสาขา (ระบบ)','Branch Stock (System)')}</div>
                {DB.BRANCHES.map(br=>(
                  <div key={br.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', marginBottom:8 }}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:8,background:br.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:br.color}}>{br.id}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--txt)'}}>{lang==='th'?br.name:br.nameEN}</div>
                        <div style={{fontSize:11,color:'var(--txt4)'}}>Min: {d.minStock}</div>
                      </div>
                    </div>
                    <div style={{fontSize:28,fontWeight:800,color:d.stock[br.id]>d.minStock?'var(--ok)':d.stock[br.id]>0?'var(--warn)':'var(--err)'}}>{d.stock[br.id].toLocaleString()}</div>
                  </div>
                ))}
              </div>
              {cw ? (
                <div style={CARD}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={CARD_T}>🏪 {L('Stock CW Pharma','CW Pharma Stock')}</div>
                    <span style={{fontSize:10,color:'var(--txt4)'}}>{L('ขายแล้ว','Sold')} {(cw.qty_sold||0).toLocaleString()} {L('ชิ้น/ปี','pcs/yr')}</span>
                  </div>
                  {cw.name&&<div style={{fontSize:11,marginBottom:12,padding:'4px 12px',background:'var(--bg4)',borderRadius:8,display:'flex',alignItems:'center',gap:8}}><span style={{color:'var(--txt3)'}}>{L('ชื่อ CW','CW name')}:</span><span style={{fontWeight:600}}>{cw.name}</span></div>}
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {cwBranches.map(b=>(
                      <div key={b.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px' }}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:36,height:36,borderRadius:8,background:b.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:b.color}}>{b.id}</div>
                          <div>
                            {b.cost>0&&<div style={{fontSize:11,color:'var(--txt3)'}}>{L('ทุน','Cost')} <b style={{color:'var(--txt)'}}>{UTILS.fmt(b.cost)} ฿</b></div>}
                            {b.sell>0&&<div style={{fontSize:11,color:'var(--txt3)'}}>{L('ขาย','Sell')} <b style={{color:'var(--txt)'}}>{UTILS.fmt(b.sell)} ฿</b></div>}
                            {b.sell>0&&b.cost>0&&<div style={{fontSize:10,color:'var(--ok)',fontWeight:700}}>{UTILS.fmt(b.sell-b.cost)} ฿ ({((b.sell-b.cost)/b.sell*100).toFixed(1)}%)</div>}
                          </div>
                        </div>
                        <div style={{fontSize:28,fontWeight:800,color:b.stock>10?'var(--ok)':b.stock>0?'var(--warn)':'var(--err)'}}>{b.stock}</div>
                      </div>
                    ))}
                  </div>
                  <CwPriceChart history={history} lang={lang}/>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'30px 20px',color:'var(--txt4)',fontSize:13}}>{L('ไม่มีข้อมูล CW Pharma สำหรับสินค้านี้','No CW Pharma data for this item')}</div>
              )}
            </div>
          )}

          {tab === 'supplier' && (
            <div>
              {/* ── Main supplier ── */}
              {supplier ? (
                <div style={{...CARD, marginBottom:12}}>
                  <div style={CARD_T}>🏢 {L('ซัพพลายเออร์หลัก','Main Supplier')}</div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:8,color:'var(--txt)'}}>{lang==='th'?supplier.name:(supplier.nameEN||supplier.name)}</div>
                  {[
                    supplier.contactName && [L('ผู้ติดต่อ','Contact'), supplier.contactName],
                    supplier.phone       && [L('โทรศัพท์','Phone'),   supplier.phone],
                    supplier.email       && ['Email',                  supplier.email],
                  ].filter(Boolean).map(([k,v])=>(
                    <div key={k} style={{...ROW, borderBottom:'1px solid var(--border)'}}><span style={ROW_K}>{k}</span><span style={ROW_V}>{v}</span></div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:16,color:'var(--txt3)',fontSize:13,marginBottom:12,background:'var(--bg3)',borderRadius:10,border:'1px solid var(--border)'}}>{L('ยังไม่ได้กำหนดซัพพลายเออร์หลัก','No main supplier assigned')}</div>
              )}

              {/* ── Last purchased from ── */}
              {lastPO && (
                <div style={{...CARD, marginBottom:12, borderLeft:'3px solid var(--acc2)'}}>
                  <div style={CARD_T}>🕐 {L('ซื้อล่าสุดจาก','Last Purchased From')}</div>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--txt)',marginBottom:6}}>
                    {lastPOSup ? (lang==='th'?lastPOSup.name:(lastPOSup.nameEN||lastPOSup.name)) : lastPO.supplierId}
                    {lastPOSup?.id === (supplier?.id) && (
                      <span style={{fontSize:10,marginLeft:8,padding:'2px 7px',background:'var(--ok-bg)',color:'var(--ok)',borderRadius:99,fontWeight:600}}>{L('= ซัพพลายเออร์หลัก','= Main')}</span>
                    )}
                    {lastPOSup && lastPOSup.id !== (supplier?.id) && (
                      <span style={{fontSize:10,marginLeft:8,padding:'2px 7px',background:'var(--warn-bg)',color:'var(--warn)',borderRadius:99,fontWeight:600}}>{L('ต่างจากหลัก','≠ Main')}</span>
                    )}
                  </div>
                  <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                    <div style={{fontSize:12,color:'var(--txt2)'}}>
                      <span style={{color:'var(--txt3)',marginRight:4}}>{L('PO','PO')}</span>{lastPO.poNumber||lastPO.id?.slice(0,8)}
                    </div>
                    <div style={{fontSize:12,color:'var(--txt2)'}}>
                      <span style={{color:'var(--txt3)',marginRight:4}}>{L('วันที่','Date')}</span>{UTILS.fmtDate(lastPO.poDate,lang)}
                    </div>
                    <div style={{fontSize:12,color:'var(--txt2)'}}>
                      <span style={{color:'var(--txt3)',marginRight:4}}>{L('สถานะ','Status')}</span>
                      <span style={{color:UTILS.statusColor(lastPO.status)}}>{UTILS.statusLabel(lastPO.status,lang)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PO supplier history ── */}
              {poSupRows.length > 0 && (
                <div style={{...CARD, marginBottom:12}}>
                  <div style={CARD_T}>📋 {L('บริษัทที่เคยซื้อ','Purchase History by Supplier')}</div>
                  {poSupRows.map(row => {
                    const s = suppliers.find(x => x.id === row.id);
                    const isMain = row.id === supplier?.id;
                    return (
                      <div key={row.id} style={{...ROW, borderBottom:'1px solid var(--border)'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:'var(--txt)',display:'flex',alignItems:'center',gap:6}}>
                            {s?(lang==='th'?s.name:(s.nameEN||s.name)):row.id}
                            {isMain && <span style={{fontSize:9,padding:'1px 6px',background:'var(--acc2)',color:'#fff',borderRadius:99,fontWeight:700}}>{L('หลัก','Main')}</span>}
                          </div>
                          <div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>{L('ล่าสุด','Last')}: {UTILS.fmtDate(row.lastDate,lang)}</div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:14,fontWeight:700,color:'var(--acc2)',fontVariantNumeric:'tabular-nums'}}>{row.count}</div>
                          <div style={{fontSize:10,color:'var(--txt3)'}}>{L('PO','POs')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!lastPO && (
                <div style={{textAlign:'center',padding:12,color:'var(--txt3)',fontSize:12,marginBottom:12}}>{L('ยังไม่มีประวัติการสั่งซื้อ','No purchase history yet')}</div>
              )}
              {activeDeals.length > 0 && (
                <div style={{...CARD, marginBottom:14}}>
                  <div style={CARD_T}>🎁 {L('ดีล','Deals')}</div>
                  {activeDeals.map(({sid,deal})=>{
                    const sup=UTILS.getSupplier(sid);
                    const parts=[];
                    if(deal.buyQty>0&&deal.freeQty>0)parts.push(`ซื้อ ${deal.buyQty} แถม ${deal.freeQty}`);
                    if(deal.freeItems)parts.push(`ของแถม: ${deal.freeItems}`);
                    if(deal.specialDiscount>0)parts.push(`ส่วนลด ${deal.specialDiscount}%`);
                    if(deal.note)parts.push(deal.note);
                    return(
                      <div key={sid} style={{fontSize:12,marginBottom:6,padding:'8px 12px',background:'var(--ok-bg)',borderRadius:8,border:'1px solid rgba(22,163,74,.2)'}}>
                        <span style={{fontWeight:700,color:'var(--ok)',marginRight:6}}>{sup?(lang==='th'?sup.name:(sup.nameEN||sup.name)):sid}:</span>{parts.join(' · ')}
                      </div>
                    );
                  })}
                </div>
              )}
              {supsRaw.length > 0 && (
                <div style={CARD}>
                  <div style={CARD_T}>{L('ซัพพลายเออร์เพิ่มเติม','Additional Suppliers')}</div>
                  {supsRaw.map(sup=>{
                    const s=suppliers.find(x=>x.id===sup.id);
                    return(
                      <div key={sup.id} style={{...ROW, borderBottom:'1px solid var(--border)'}}>
                        <span style={ROW_K}>{s?(lang==='th'?s.name:(s.nameEN||s.name)):sup.id}</span>
                        {(sup.costEx>0||sup.sellEx>0)&&<span style={{color:'var(--txt2)',fontSize:12}}>{UTILS.fmt(sup.costEx)}/{UTILS.fmt(sup.sellEx)} ฿</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'13px 28px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, background:'var(--bg1)' }}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {d.hasVat&&<span className="badge" style={{background:'var(--info-bg)',color:'var(--info)'}}>VAT 7%</span>}
            {rmk&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:'var(--warn-bg)',color:'var(--warn)',fontWeight:700}}>{lang==='th'?rmk.th:rmk.en}</span>}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost" onClick={onClose}>{L('ปิด','Close')}</button>
            <button className="btn btn-primary" onClick={onEdit}>✏ {L('แก้ไข','Edit')}</button>
          </div>
        </div>

      </div>
    </div>
  );
}

function DrugsPage({ lang, L, drugs, setDrugs, suppliers, orders, categories, setCategories, notify, perm = { canWrite: true } }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [vatFilter, setVatFilter] = useState('all'); // all | vat | novat
  const [branchFilter, setBranchFilter] = useState(''); // '' = all branches; else PTN|RAM|CNX
  const [page, setPage] = useState(1);
  const [editDrug, setEditDrug] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unused'
  const [sortCol, setSortCol] = useState('code');
  const [sortDir, setSortDir] = useState('asc');
  const [showPkg, setShowPkg] = useState(false);
  const [detailDrug, setDetailDrug] = useState(null);
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [cwStock, setCwStock] = useState({});
  const [cwSyncedAt, setCwSyncedAt] = useState(null);
  const [cwHistory, setCwHistory] = useState({});
  const cwAutoSynced = React.useRef(false);

  const cats = categories || DB.CATEGORIES;
  const selectedCat = cats.find(c => c.id === catFilter);

  // Load CW Pharma stock — cached in IDB via UNI_DB.loadCwStock (6 h TTL)
  // Also auto-updates nameEN for products whose CW name differs from the system name
  const refreshCw = async () => {
    if (!window.UNI_DB || !window.UNI_DB.enabled) return;
    try { localStorage.removeItem('uni_cw_idb_ts'); } catch(e) {}
    const data = await window.UNI_DB.loadCwStock().catch(() => null);
    if (!data || !data.length) return;
    const map = {};
    data.forEach(r => { map[r.code] = r; });
    setCwStock(map);
    setCwSyncedAt(data.reduce((m, r) => (r.synced_at || '') > m ? (r.synced_at || '') : m, ''));
  };

  useEffect(() => {
    if (!window.UNI_DB || !window.UNI_DB.enabled) return;
    (async () => {
      const data = await window.UNI_DB.loadCwStock().catch(() => null);
      if (!data || !data.length) return;
      const map = {};
      data.forEach(r => { map[r.code] = r; });
      setCwStock(map);
      setCwSyncedAt(data.reduce((m, r) => (r.synced_at || '') > m ? (r.synced_at || '') : m, ''));

      if (cwAutoSynced.current) return;
      cwAutoSynced.current = true;

      const _sim = window._nameSim || (() => 1);
      const mismatched = drugs.filter(d => {
        const cw = map[d.code];
        if (!cw || !cw.name) return false;
        if (_sim(cw.name, d.nameEN || '') >= 0.85) return false; // EN already matches
        if (_sim(cw.name, d.nameTH || '') >= 0.85) return false; // CW name is Thai & matches TH — skip
        return true;
      });
      if (!mismatched.length) return;

      // Products where the entire drug changed (code reassigned) — need TH translation
      const needsThUpdate = mismatched.filter(d => _sim(map[d.code].name, d.nameTH || '') < 0.5);
      const thTranslations = {};
      if (needsThUpdate.length && typeof _gtranslate === 'function') {
        await Promise.all(needsThUpdate.map(async d => {
          const thai = await _gtranslate(map[d.code].name, 'en', 'th').catch(() => '');
          if (thai) thTranslations[d.code] = thai;
        }));
      }

      const updatedList = mismatched.map(d => {
        const cwName = map[d.code].name;
        const translatedTH = thTranslations[d.code];
        return translatedTH ? { ...d, nameEN: cwName, nameTH: translatedTH } : { ...d, nameEN: cwName };
      });
      const thUpdatedCount = Object.keys(thTranslations).length;

      await window.UNI_DB.saveDrugsBulk(updatedList);
      setDrugs(prev => {
        const byCode = {};
        updatedList.forEach(u => { byCode[u.code] = u; });
        return prev.map(d => byCode[d.code] || d);
      });
      const thNote = thUpdatedCount ? L(' (รวมชื่อ TH ' + thUpdatedCount + ' รายการที่สินค้าเปลี่ยน)', ' (incl. ' + thUpdatedCount + ' TH names where product changed)') : '';
      if (notify) notify(
        L('อัปเดตชื่อ EN ' + mismatched.length + ' รายการจาก CW Pharma อัตโนมัติ' + thNote,
          'Auto-updated ' + mismatched.length + ' names from CW Pharma' + thNote),
        'ok'
      );
    })().catch(e => console.warn('[CW auto-sync]', e));
  }, []);

  // Load CW price history for the detail popup drug (lazy, per-code, cached in cwHistory state)
  useEffect(() => {
    if (!detailDrug) return;
    const code = detailDrug.code;
    if (cwHistory[code] !== undefined) return; // already loaded
    if (!window.UNI_DB || !window.UNI_DB.loadCwPriceHistory) return;
    setCwHistory(prev => Object.assign({}, prev, { [code]: null }));
    window.UNI_DB.loadCwPriceHistory([code])
      .then(data => {
        const arr = (data || {})[code] || [];
        setCwHistory(prev => Object.assign({}, prev, { [code]: arr }));
      })
      .catch(e => {
        console.warn('[CW hist]', e);
        setCwHistory(prev => Object.assign({}, prev, { [code]: [] }));
      });
  }, [detailDrug]);

  // Keep --sticky-bar-h in sync (used by other pages)
  useEffect(() => {
    const bar = document.querySelector('.sticky-bar');
    if (!bar) return;
    const update = () => document.documentElement.style.setProperty('--sticky-bar-h', bar.offsetHeight + 'px');
    update();
    const ro = new ResizeObserver(update);
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  // Sync horizontal scroll between sticky thead wrapper and tbody table
  useEffect(() => {
    const wrap = document.getElementById('drug-tbl-wrap');
    const hdr  = document.getElementById('drug-hdr-scroll');
    if (!wrap || !hdr) return;
    const sync = () => { hdr.scrollLeft = wrap.scrollLeft; };
    wrap.addEventListener('scroll', sync, { passive: true });
    return () => wrap.removeEventListener('scroll', sync);
  }, [activeTab]);

  // Count items available per branch (stock > 0)
  const branchCounts = useMemo(() => {
    const counts = { '': drugs.length };
    DB.BRANCHES.forEach(br => { counts[br.id] = drugs.filter(d => (d.stock?.[br.id] || 0) > 0).length; });
    return counts;
  }, [drugs]);

  // Effective cost for a drug given the current branch filter
  const getCost = (d, br) => (br && d.costByBranch?.[br] != null) ? d.costByBranch[br] : d.costEx;

  const filtered = useMemo(() => {
    const q = search ? search.toLowerCase() : '';
    // Single-pass filter instead of chained .filter() calls (avoids N intermediate arrays)
    const needFilter = q || catFilter || subFilter || vatFilter !== 'all' || branchFilter;
    let list = needFilter
      ? drugs.filter(d => {
          if (d.archived) return false;
          if (q && !d.code.toLowerCase().includes(q) && !(d.nameTH||'').toLowerCase().includes(q) && !(d.nameEN||'').toLowerCase().includes(q)) return false;
          if (catFilter && d.catId !== catFilter) return false;
          if (subFilter && d.subId !== subFilter) return false;
          if (vatFilter === 'vat' && !d.hasVat) return false;
          if (vatFilter === 'novat' && d.hasVat) return false;
          if (branchFilter && !((d.stock && d.stock[branchFilter]) || 0)) return false;
          return true;
        })
      : drugs.filter(d => !d.archived); // exclude archived
    list.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const cmp = (typeof av === 'string' || typeof bv === 'string')
        ? NATURAL_CMP.compare(av == null ? '' : String(av), bv == null ? '' : String(bv))
        : (av > bv ? 1 : av < bv ? -1 : 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [drugs, search, catFilter, subFilter, vatFilter, branchFilter, sortCol, sortDir]);

  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const sort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const exportDrugs = () => {
    if (!window.XLSX) { notify(L('กำลังโหลด SheetJS กรุณารอสักครู่', 'Loading SheetJS, please wait'), 'warn'); return; }
    const rows = filtered.map(d => ({
      [L('รหัส', 'Code')]: d.code,
      [L('ชื่อยา (ไทย)', 'Name (TH)')]: d.nameTH || '',
      [L('ชื่อยา (อังกฤษ)', 'Name (EN)')]: d.nameEN || '',
      [L('หน่วย', 'Unit')]: d.unit || '',
      [L('หมวดหมู่', 'Category')]: d.catId || '',
      [L('หมวดย่อย', 'Sub-category')]: d.subId || '',
      'VAT': d.hasVat ? 'VAT 7%' : '-',
      [L('ต้นทุน (฿)', 'Cost (฿)')]: d.costEx || 0,
      [L('ราคาขาย ไม่รวม VAT (฿)', 'Sell excl. VAT (฿)')]: d.sellEx || 0,
      [L('ราคาขาย รวม VAT (฿)', 'Sell incl. VAT (฿)')]: d.sellInc || 0,
      [L('กำไร (%)', 'Margin (%)')]: d.profitMargin || 0,
      [L('สต็อกรวม', 'Total Stock')]: d.totalStock || 0,
      'Stock PTN': (d.stock && d.stock.PTN) || 0,
      'Stock RAM': (d.stock && d.stock.RAM) || 0,
      'Stock CNX': (d.stock && d.stock.CNX) || 0,
      [L('สต็อกขั้นต่ำ', 'Min Stock')]: d.minStock || 0,
      [L('ผู้จัดจำหน่าย', 'Supplier')]: (() => { const s = suppliers.find(x=>x.id===d.supplierId)||suppliers.find(x=>(x.drugs||[]).includes(d.code)); return s?s.name:(d.supplierId||''); })(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch:10},{wch:40},{wch:40},{wch:12},{wch:20},{wch:20},{wch:10},{wch:14},{wch:22},{wch:22},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:12},{wch:30}];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, L('ยา', 'Drugs'));
    XLSX.writeFile(wb, `drugs_${new Date().toISOString().slice(0,10)}.xlsx`);
    notify(L(`Export ${filtered.length} รายการ ✓`, `Exported ${filtered.length} items ✓`), 'ok');
  };
  const SortIcon = ({ col }) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const saveDrug = useCallback(saved => {
    setDrugs(prev => {
      const idx = prev.findIndex(d => d.code === saved.code);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setEditDrug(null); setShowAdd(false);
    if (window.UNI_DB) window.UNI_DB.saveDrug(saved);
    notify(L('บันทึกข้อมูลสำเร็จ', 'Saved successfully'));
  }, [setDrugs, notify, L]);

  const saveQuickDrug = useCallback(saved => {
    setDrugs(prev => {
      const idx = prev.findIndex(d => d.code === saved.code);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setShowAdd(false);
    setEditDrug(saved);
    if (window.UNI_DB) window.UNI_DB.saveDrug(saved);
    notify(L('บันทึกข้อมูลสำเร็จ', 'Saved successfully'));
  }, [setDrugs, notify, L]);

  const handleReuseCode = useCallback(matchedDrug => {
    setShowAdd(false);
    setEditDrug(matchedDrug);
    notify(L(`เปิดแก้ไขสินค้ารหัส ${matchedDrug.code}`, `Editing existing product ${matchedDrug.code}`));
  }, [notify, L]);

  const archivedCount = useMemo(() => drugs.filter(d => d.archived).length, [drugs]);

  const archiveDrug = useCallback(async d => {
    const updated = { ...d, archived: true };
    setDrugs(prev => prev.map(x => x.code === d.code ? updated : x));
    if (window.UNI_DB?.enabled) await window.UNI_DB.saveDrug(updated).catch(e => console.warn('[archive]', e));
    notify(L(`Archive "${d.nameTH}" เรียบร้อย`, `Archived "${d.nameEN || d.nameTH}"`), 'ok');
  }, [setDrugs, notify, L]);

  const restoreDrug = useCallback(async d => {
    const updated = { ...d, archived: false };
    setDrugs(prev => prev.map(x => x.code === d.code ? updated : x));
    if (window.UNI_DB?.enabled) await window.UNI_DB.saveDrug(updated).catch(e => console.warn('[restore]', e));
    notify(L(`Restore "${d.nameTH}" เรียบร้อย`, `Restored "${d.nameEN || d.nameTH}"`), 'ok');
  }, [setDrugs, notify, L]);

  const archiveDetected = useCallback(async () => {
    const candidates = drugs.filter(d =>
      !d.archived &&
      d.totalStock === 0
    );
    if (!candidates.length) { notify(L('ไม่พบสินค้าที่ตรงเกณฑ์', 'No inactive products found'), 'ok'); return; }
    const updated = candidates.map(d => ({ ...d, archived: true }));
    setDrugs(prev => {
      const map = {}; updated.forEach(u => { map[u.code] = u; });
      return prev.map(d => map[d.code] || d);
    });
    if (window.UNI_DB?.enabled) await window.UNI_DB.saveDrugsBulk(updated).catch(e => console.warn('[archive bulk]', e));
    notify(L(`Archive ${updated.length} รายการ ✓`, `Archived ${updated.length} items ✓`), 'ok');
  }, [drugs, setDrugs, notify, L]);

  const stockStatus = d => {
    const total = d.totalStock;
    if (total <= d.minStock) return 'err';
    if (total <= d.minStock * 2) return 'warn';
    return 'ok';
  };

  const ColHead = ({ col, children }) => (
    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => sort(col)}>
      {children}{SortIcon({ col })}
    </th>
  );

  return (
    <div className="page">
      <div className="sticky-bar" style={{ paddingBottom:0, borderBottom:'none', marginBottom:0 }}>
      <div className="page-header">
        <div>
          <div className="page-title">{L('ฐานข้อมูลยา', 'Drug Database')}</div>
          <div className="page-subtitle" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span>{L('แสดง', 'Showing')} {filtered.length.toLocaleString()} {L('จาก', 'of')} {(drugs.length - archivedCount).toLocaleString()} {L('รายการ', 'items')}
            {branchFilter && ` · ${lang === 'th' ? (DB.BRANCHES.find(b=>b.id===branchFilter)||{}).name : (DB.BRANCHES.find(b=>b.id===branchFilter)||{}).nameEN}`}</span>
            {cwSyncedAt && (
              <span onClick={refreshCw} title={L('คลิกเพื่อรีเฟรชข้อมูล CW ล่าสุด','Click to refresh CW data')} style={{ fontSize:11, background:'var(--ok-bg)', color:'var(--ok)', borderRadius:99, padding:'1px 9px', fontWeight:500, cursor:'pointer' }}>
                ⟳ CW {new Date(cwSyncedAt).toLocaleString('th-TH', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className={`btn ${showPkg?'btn-primary':'btn-ghost'} btn-sm`} onClick={()=>setShowPkg(v=>!v)}>
            📦 {L('หน่วยบรรจุ','Packaging')} {showPkg?'ON':'OFF'}
          </button>
          {perm.canWrite && (
          <button className="btn btn-ghost" onClick={exportDrugs} title={L(`Export ${filtered.length} รายการ เป็น Excel`, `Export ${filtered.length} items to Excel`)}>
            📥 {L('Export Excel', 'Export Excel')}
          </button>
          )}
          {perm.canWrite && (
          <button className="btn btn-ghost" onClick={() => setShowCatMgr(true)}>
            🏷️ {L('จัดการหมวดหมู่', 'Categories')}
          </button>
          )}
          {perm.canWrite && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + {L('เพิ่มสินค้าใหม่', 'Add Product')}
          </button>
          )}
        </div>
      </div>

      {showCatMgr && (
        <CategoryManagerModal lang={lang} L={L} categories={cats} setCategories={setCategories}
          drugs={drugs} notify={notify} onClose={() => setShowCatMgr(false)} />
      )}

      {/* TAB BAR */}
      <div style={{display:'flex',gap:0,borderBottom:'2px solid var(--border)',marginBottom:0}}>
        {[
          {key:'all',      label:L('สินค้าทั้งหมด','All Products'), icon:'💊'},
          {key:'unused',   label:L('ยังไม่มี PO','No PO Yet'),      icon:'📋'},
          {key:'archived', label:L(`🗄️ ไม่ใช้งาน${archivedCount?' ('+archivedCount+')':''}`,`🗄️ Archived${archivedCount?' ('+archivedCount+')':''}`), icon:''},
        ].map(({key,label,icon})=>(
          <button key={key} onClick={()=>setActiveTab(key)}
            style={{padding:'6px 14px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab===key?700:400,
              color:activeTab===key?(key==='archived'?'var(--warn)':'var(--acc2)'):'var(--txt3)',
              borderBottom:activeTab===key?`2px solid ${key==='archived'?'var(--warn)':'var(--acc2)'}`:'2px solid transparent',
              marginBottom:-2,fontSize:13}}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* FILTERS — sticky */}
      {activeTab === 'all' && (
      <div className="card" style={{ marginTop:6, marginBottom:0, padding:'7px 12px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 220px' }}>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={L('รหัส / ชื่อยา…', 'Code / Drug name…')} />
          </div>
          <div style={{ flex: '0 0 170px' }}>
            <select className="input" value={catFilter} onChange={e => { setCatFilter(e.target.value); setSubFilter(''); setPage(1); }}>
              <option value="">{L('หมวดหมู่: ทั้งหมด', 'Category: All')}</option>
              {cats.map(c => <option key={c.id} value={c.id}>{lang === 'th' ? c.name : c.nameEN}</option>)}
            </select>
          </div>
          {selectedCat && (
            <div style={{ flex: '0 0 160px' }}>
              <select className="input" value={subFilter} onChange={e => { setSubFilter(e.target.value); setPage(1); }}>
                <option value="">{L('หมวดย่อย: ทั้งหมด', 'Sub: All')}</option>
                {selectedCat.subs.map(s => <option key={s.id} value={s.id}>{lang === 'th' ? s.name : s.nameEN}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: '0 0 auto', display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
            {[{ id: '', name: 'ทุกสาขา', nameEN: 'All', color: 'var(--acc)' }, ...DB.BRANCHES].map(b => (
              <button key={b.id}
                className={`btn btn-sm ${branchFilter === b.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setBranchFilter(b.id); setPage(1); }}
                style={{ whiteSpace: 'nowrap' }}>
                <span style={{ color: branchFilter === b.id ? '' : b.color, fontWeight: 700 }}>
                  {lang === 'th' ? b.name : b.nameEN}
                </span>
                <span style={{ marginLeft: 5, fontSize: 11, opacity: .75 }}>
                  {(branchCounts[b.id] ?? 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
          <div style={{ flex: '0 0 130px' }}>
            <select className="input" value={vatFilter} onChange={e => { setVatFilter(e.target.value); setPage(1); }}>
              <option value="all">{L('VAT: ทั้งหมด', 'VAT: All')}</option>
              <option value="vat">{L('มี VAT', 'With VAT')}</option>
              <option value="novat">{L('ไม่มี VAT', 'No VAT')}</option>
            </select>
          </div>
          {(search || catFilter || subFilter || vatFilter !== 'all' || branchFilter) && (
            <button className="btn btn-ghost" onClick={() => { setSearch(''); setCatFilter(''); setSubFilter(''); setVatFilter('all'); setBranchFilter(''); setPage(1); }}>
              ✕ {L('ล้าง', 'Clear')}
            </button>
          )}
          {perm.canWrite && (
            <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', color:'var(--warn)', borderColor:'rgba(245,158,11,.3)', whiteSpace:'nowrap' }}
              onClick={archiveDetected}
              title={L('ตรวจหาสินค้าที่ stock=0 และไม่มีการสั่งซื้อในช่วง 2 ปี แล้ว Archive ทันที','Detect drugs with stock=0 and no orders in 2 years, then archive them')}>
              🔍 {L('ตรวจหาไม่ใช้งาน', 'Detect Inactive')}
            </button>
          )}
        </div>
      </div>
      )}

      {/* Option B — column headers live in sticky-bar, scroll in sync with tbody */}
      {activeTab === 'all' && (
        <div id="drug-hdr-scroll" style={{ overflowX:'hidden', borderTop:'1px solid var(--border)' }}>
          <table style={{ tableLayout:'fixed', width:'100%', minWidth:1000, borderCollapse:'collapse', fontSize:13 }}>
            <colgroup>
              <col style={{width:95}}/><col/><col style={{width:70}}/><col style={{width:130}}/>
              <col style={{width:70}}/><col style={{width:110}}/><col style={{width:110}}/>
              <col style={{width:90}}/><col style={{width:140}}/><col style={{width:85}}/>
            </colgroup>
            <thead>
              <tr>
                <ColHead col="code">{L('รหัส', 'Code')}</ColHead>
                <ColHead col="nameTH">{L('ชื่อยา', 'Drug Name')}</ColHead>
                <th>{L('หน่วย', 'Unit')}</th>
                <th>{L('หมวดหมู่', 'Category')}</th>
                <th style={{ textAlign: 'center' }}>VAT</th>
                <ColHead col="costEx">{L('ต้นทุน', 'Cost')}{branchFilter ? ` [${branchFilter}]` : ''}</ColHead>
                <ColHead col="sellEx">{L('ราคาขาย', 'Sell Price')}</ColHead>
                <ColHead col="profitMargin">{L('กำไร', 'Profit')}</ColHead>
                <ColHead col="totalStock">{Object.keys(cwStock).length ? L('Stock CW (3 สาขา)', 'Stock CW (3 branches)') : L('สต็อกรวม', 'Total Stock')}</ColHead>
                <th style={{ textAlign: 'center' }}>{L('จัดการ', 'Action')}</th>
              </tr>
            </thead>
          </table>
        </div>
      )}
      </div>

      {/* UNUSED DRUGS PANEL */}
      {activeTab === 'unused' && (
        <div className="card" style={{padding:16}}>
          <UnusedDrugsPanel lang={lang} L={L} drugs={drugs} onEdit={d=>{setEditDrug(d);setShowAdd(false);}} />
        </div>
      )}

      {/* ARCHIVED PANEL */}
      {activeTab === 'archived' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', background:'var(--bg3)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--warn)' }}>🗄️ {L('สินค้าไม่ใช้งาน','Archived Items')}</span>
              <span style={{ fontSize:11, color:'var(--txt3)', marginLeft:8 }}>{L('ไม่แสดงในตารางหลักและไม่นับในสถิติ','Hidden from main table and excluded from all stats')}</span>
            </div>
            {perm.canWrite && (
              <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', color:'var(--warn)', borderColor:'rgba(245,158,11,.3)' }}
                onClick={archiveDetected}>
                🔍 {L('ตรวจหาเพิ่มเติม','Detect More')}
              </button>
            )}
          </div>
          {drugs.filter(d => d.archived).length === 0 ? (
            <div style={{ padding:'32px 16px', textAlign:'center', color:'var(--txt3)', fontSize:13 }}>
              {L('ยังไม่มีสินค้าใน Archive — กด "🔍 ตรวจหาไม่ใช้งาน" เพื่อเริ่มต้น','No archived items yet — click "🔍 Detect Inactive" to start')}
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{L('รหัส','Code')}</th>
                    <th>{L('ชื่อยา','Drug Name')}</th>
                    <th>{L('หมวดหมู่','Category')}</th>
                    <th style={{textAlign:'center'}}>{L('สั่งซื้อล่าสุด','Last Order')}</th>
                    <th style={{textAlign:'center'}}>{L('คืนค่า','Restore')}</th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.filter(d => d.archived).sort((a,b)=>(a.code||'').localeCompare(b.code||'',undefined,{numeric:true,sensitivity:'base'})).map(d => {
                    const cat = cats.find(c=>c.id===d.catId)||{name:d.catId||'—',nameEN:d.catId||'—',color:'#94a3b8'};
                    return (
                      <tr key={d.code} style={{ cursor:'pointer' }} onClick={() => setDetailDrug(d)}>
                        <td><span style={{ fontSize:12, fontFamily:'monospace', color:'var(--warn)', fontWeight:700 }}>{d.code}</span></td>
                        <td>
                          <div style={{ fontWeight:600, fontSize:12 }}>{lang==='th'?d.nameTH:(d.nameEN||d.nameTH)}</div>
                          <div style={{ fontSize:10, color:'var(--txt3)' }}>{lang==='th'?(d.nameEN||''):d.nameTH}</div>
                        </td>
                        <td><span style={{ fontSize:11, color:cat.color, fontWeight:600 }}>{lang==='th'?cat.name:cat.nameEN}</span></td>
                        <td style={{ textAlign:'center', fontSize:11, color:'var(--txt3)' }}>
                          {d.lastOrdered ? UTILS.fmtDate(d.lastOrdered, lang) : L('ไม่มีข้อมูล','—')}
                        </td>
                        <td style={{ textAlign:'center' }} onClick={e => e.stopPropagation()}>
                          {perm.canWrite && (
                            <button className="btn btn-ghost btn-xs" onClick={() => restoreDrug(d)}>
                              ↩ {L('Restore','Restore')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'all' && <>

      {/* Packaging info banner */}
      {showPkg && (
        <div style={{ background:'linear-gradient(135deg,var(--acc) 0%,var(--acc2) 100%)', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>📦</span>
          <div style={{ flex:1, color:'#fff' }}>
            <div style={{ fontWeight:700, fontSize:13 }}>{L('โหมดแสดงหน่วยบรรจุ (Preview)','Packaging Units Preview Mode')}</div>
            <div style={{ fontSize:12, opacity:.85 }}>{L('คลิกแถวยาใดก็ได้เพื่อดูหน่วยบรรจุเต็ม · เช่น 1 กล่อง = 3 แผง = 30 เม็ด · ตัวเลขสามารถปรับได้ในหน้าแก้ไขยา',
              'Click any row to see full packaging chain · e.g. 1 Box = 3 Strips = 30 Tablets · Values editable in the Edit screen')}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ color:'#fff', borderColor:'rgba(255,255,255,.4)' }} onClick={()=>setShowPkg(false)}>× {L('ปิด','Close')}</button>
        </div>
      )}

      {/* TABLE — thead lives in sticky-bar above; tbody only here */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderTop: 'none', borderRadius: '0 0 var(--r) var(--r)' }}>
        <div className="tbl-wrap" id="drug-tbl-wrap" style={{ border: 'none' }}>
          <table style={{ tableLayout: 'fixed', minWidth: 1000 }}>
            <colgroup>
              <col style={{width:95}}/><col/><col style={{width:70}}/><col style={{width:130}}/>
              <col style={{width:70}}/><col style={{width:110}}/><col style={{width:110}}/>
              <col style={{width:90}}/><col style={{width:140}}/><col style={{width:85}}/>
            </colgroup>
            <tbody>
              {pageData.length === 0 && (
                <tr><td colSpan={10} className="no-data">{L('ไม่พบข้อมูล', 'No results found')}</td></tr>
              )}
              {pageData.map(d => {
                const cat = cats.find(c=>c.id===d.catId) || {name:d.catId||'',nameEN:d.catId||'',color:'#94a3b8',subs:[]};
                const sub = (cat.subs||[]).find(s=>s.id===d.subId) || {name:d.subId||'',nameEN:d.subId||''};
                const ss = stockStatus(d);
                return (
                  <tr key={d.code} style={{ cursor: 'pointer' }} onClick={() => setDetailDrug(d)}>
                      <td>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--acc2)', fontWeight: 700 }}>{d.code}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === 'th' ? d.nameTH : (d.nameEN||d.nameTH)}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{lang === 'th' ? (d.nameEN||'') : d.nameTH}</div>
                        {d.remark && (() => { const r = DRUG_REMARKS.find(x=>x.code===d.remark); return r ? (
                          <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:'var(--warn-bg)', color:'var(--warn)', fontWeight:600, display:'inline-block', marginTop:2 }}>
                            📝 {lang==='th'?r.th:r.en}
                          </span>
                        ) : null; })()}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{UTILS.getUnit(d.unit, lang)}</span>
                        {showPkg && (() => { const pkg=UTILS.getPackaging(d.unit,lang,d); return pkg ? (
                          <div style={{ fontSize:10, color:'var(--acc2)', marginTop:2, lineHeight:1.4 }}>
                            {pkg.chain.map((c,i)=>(
                              <span key={i}>{i>0&&<span style={{color:'var(--txt4)'}}> ▸ </span>}
                                <b>{i===0?'1':pkg.chain[i].qty}</b> {lang==='th'?c.th:c.en}
                              </span>
                            ))}
                            {pkg.chain.length>1&&<span style={{color:'var(--ok)'}}>  ={pkg.totalInTop} {lang==='th'?pkg.base:pkg.baseEN}</span>}
                          </div>
                        ) : null; })()}
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: cat.color, fontWeight: 600 }}>{lang === 'th' ? cat.name : cat.nameEN}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt4)' }}>{lang === 'th' ? sub.name : sub.nameEN}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {d.hasVat
                          ? <span className="badge" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>VAT 7%</span>
                          : <span className="badge" style={{ background: 'var(--bg4)', color: 'var(--txt3)' }}>-</span>}
                      </td>
                      <td className="tbl-num">
                        {d.hasVat ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{UTILS.fmt(d.costInc)} ฿</div>
                            <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ไม่รวม VAT {UTILS.fmt(getCost(d, branchFilter))} ฿</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontWeight: 600 }}>{UTILS.fmt(getCost(d, branchFilter))} ฿</div>
                            {branchFilter && d.costByBranch?.[branchFilter] != null && (
                              <div style={{ fontSize: 10, color: 'var(--acc2)' }}>≠ {UTILS.fmt(d.costEx)} ฿</div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="tbl-num">
                        {d.hasVat
                          ? <><div style={{ fontWeight: 600 }}>{UTILS.fmt(d.sellInc)} ฿</div><div style={{ fontSize: 10, color: 'var(--txt3)' }}>ไม่รวม VAT {UTILS.fmt(d.sellEx)} ฿</div></>
                          : <div style={{ fontWeight: 600 }}>{UTILS.fmt(d.sellEx)} ฿</div>
                        }
                      </td>
                      <td className="tbl-num">
                        <div style={{ fontWeight: 700, color: 'var(--ok)' }}>{UTILS.fmt(d.profitEx)} ฿</div>
                        <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{d.profitMargin}%</div>
                      </td>
                      <td>
                        {(() => {
                          const cw = cwStock[d.code];
                          if (cw) {
                            const brs = [
                              { id: 'PTN', val: cw.stock_00 ?? 0 },
                              { id: 'RAM', val: cw.stock_01 ?? 0 },
                              { id: 'CNX', val: cw.stock_02 ?? 0 },
                            ];
                            return (
                              <div style={{ display:'flex', gap:3 }}>
                                {brs.map(b => (
                                  <span key={b.id} style={{
                                    display:'inline-flex', flexDirection:'column', alignItems:'center',
                                    minWidth:34, background: b.val > 10 ? 'var(--ok-bg)' : b.val > 0 ? 'var(--warn-bg)' : 'var(--err-bg)',
                                    borderRadius:6, padding:'2px 3px', gap:0,
                                  }}>
                                    <span style={{ fontSize:9, color:'var(--txt3)', fontWeight:600 }}>{b.id}</span>
                                    <span style={{ fontSize:12, fontWeight:700, color: b.val > 10 ? 'var(--ok)' : b.val > 0 ? 'var(--warn)' : 'var(--err)' }}>{b.val}</span>
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          if (branchFilter) return (
                            <span style={{ color:(d.stock?.[branchFilter]||0)<=d.minStock?'var(--err)':'var(--ok)', fontWeight:700, fontSize:13 }}>
                              {(d.stock?.[branchFilter]||0).toLocaleString()}
                            </span>
                          );
                          return (
                            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                              <span style={{ color:ss==='err'?'var(--err)':ss==='warn'?'var(--warn)':'var(--ok)', fontWeight:700, fontSize:13 }}>
                                {d.totalStock.toLocaleString()}
                              </span>
                              <div style={{ display:'flex', gap:3, fontSize:10 }}>
                                {DB.BRANCHES.map(br => (
                                  <span key={br.id} style={{ color:d.stock[br.id]<=d.minStock?'var(--err)':'var(--txt4)' }}>
                                    {br.id}:{d.stock[br.id]}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        {perm.canWrite ? (
                        <div style={{ display:'flex', gap:3, justifyContent:'center' }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => setEditDrug(d)}>
                            ✏ {L('แก้ไข', 'Edit')}
                          </button>
                          <button className="btn btn-ghost btn-xs" style={{ color:'var(--txt3)', fontSize:11 }}
                            title={L('Archive — ซ่อนสินค้าไม่ใช้งาน','Archive — hide inactive item')}
                            onClick={() => archiveDrug(d)}>🗄️</button>
                        </div>
                        ) : <span className="text-muted" style={{ fontSize: 11 }}>—</span>}
                      </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} lang={lang} />
        </div>
      </div>

      </> }

      {/* DRUG DETAIL POPUP */}
      {detailDrug && (
        <DrugDetailModal
          drug={detailDrug} lang={lang} L={L}
          suppliers={suppliers} cats={cats}
          cwStock={cwStock} cwHistory={cwHistory}
          orders={orders}
          onEdit={() => { setEditDrug(detailDrug); setDetailDrug(null); }}
          onClose={() => setDetailDrug(null)}
        />
      )}

      {/* ADD / EDIT MODAL */}
      {showAdd && !editDrug && (
        <QuickDrugForm lang={lang} L={L} drugs={drugs} onReuseCode={handleReuseCode}
          onSave={saveQuickDrug} onClose={() => { setShowAdd(false); setEditDrug(null); }} />
      )}
      {editDrug && (
        <DrugForm drug={editDrug} lang={lang} L={L} suppliers={suppliers} drugs={drugs} onReuseCode={handleReuseCode}
          cwName={(cwStock[editDrug.code]||{}).name||''}
          cwData={cwStock[editDrug.code]||{}}
          onSave={saveDrug} onClose={() => { setShowAdd(false); setEditDrug(null); }} />
      )}
    </div>
  );
}

Object.assign(window, { DrugsPage });
