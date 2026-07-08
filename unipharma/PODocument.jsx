// PODocument.jsx — A4 PO Document Viewer + Print
function numToEnWords(n){
  const a=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const b=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function conv(n){if(n<20)return a[n];if(n<100)return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'');if(n<1000)return a[Math.floor(n/100)]+' hundred'+(n%100?' '+conv(n%100):'');if(n<1000000)return conv(Math.floor(n/1000))+' thousand'+(n%1000?' '+conv(n%1000):'');return conv(Math.floor(n/1000000))+' million'+(n%1000000?' '+conv(n%1000000):'');}
  const rounded=Math.round(n*100)/100;
  const intPart=Math.floor(rounded);
  const dec=Math.round((rounded-intPart)*100);
  let res=intPart===0?'zero':conv(intPart);
  res+=' baht';
  if(dec>0) res+=' and '+conv(dec)+' satang';
  else res+=' only';
  return res.charAt(0).toUpperCase()+res.slice(1);
}
function PODocumentModal({ po, lang, L, suppliers, onClose, onEdit }) {
  const supplier = suppliers.find(s => s.id === po.supplierId) || {};
  const branch = DB.BRANCHES.find(b => b.id === po.branch) || {};
  const deliveryBranch = DB.BRANCHES.find(b => b.id === (po.deliveryBranch || po.branch)) || branch;

  const COMPANY = {
    nameTH: 'บริษัท แม็กนิฟิเซนท์ สตาร์ จำกัด (สำนักงานใหญ่)',
    nameEN: 'MAGNIFICENT STAR CO., LTD. (Head Office)',
    taxId: '0105565115671',
    address: '491/4 ถนนราชปรารภ แขวงมักกะสัน เขตราชเทวี กรุงเทพมหานคร 10400',
    addressEN: '491/4 Ratchaprarop Road, Makkasan Subdistrict, Ratchathewi District, Bangkok 10400',
    tel: '+66 80 005 5690, +66 92 938 1490, +66 80 182 7287'
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=900,height=700');
    const style = `
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Noto Sans Thai','Times New Roman',serif;font-size:10pt;color:#111;background:#fff}
        .doc{width:210mm;min-height:297mm;margin:0 auto;padding:10mm 14mm 12mm 14mm;position:relative;display:flex;flex-direction:column}
        .header{display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;border-bottom:2px solid #333;padding-bottom:12px}
        .logo{width:80px;flex-shrink:0}
        .logo img{width:100%;object-fit:contain}
        .company-info{flex:1}
        .company-name-th{font-size:13pt;font-weight:700;color:#1a1a1a}
        .company-name-en{font-size:11pt;font-weight:700;margin-bottom:4px}
        .company-detail{font-size:8.5pt;color:#444;line-height:1.65}
        .po-title{text-align:center;margin:12px 0;background:#e8e8e8;padding:9px;border-radius:2px}
        .po-title h1{font-size:15pt;font-weight:800;letter-spacing:2px}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:10px;border:1px solid #ccc}
        .info-col{padding:9px 11px;border-right:1px solid #ccc}
        .info-col:last-child{border-right:none}
        .info-row{margin-bottom:4px;font-size:9pt;line-height:1.4}
        .currency-row{text-align:right;font-size:9pt;font-weight:700;margin-bottom:7px;color:#333}
        table{width:100%;border-collapse:collapse;margin-bottom:12px}
        th{background:#d0d0d0;font-weight:700;padding:6px 8px;text-align:left;border:1px solid #999;font-size:9pt}
        td{padding:6px 8px;border:1px solid #ccc;font-size:9pt;vertical-align:top}
        .item-deal{font-size:7.5pt;color:#1a5c1a;margin-top:3px;background:#f0faf0;padding:2px 6px;border-radius:2px;border-left:2px solid #6dba6d;display:inline-block;line-height:1.5}
        .summary-section{width:270px;margin-left:auto}
        .sum-row{display:flex;justify-content:space-between;padding:3px 0;font-size:9.5pt;border-bottom:1px solid #eee}
        .grand-total{font-weight:800;font-size:11pt;border-top:2px solid #333;padding-top:5px;margin-top:4px;display:flex;justify-content:space-between}
        .sig-area{position:absolute;bottom:10mm;left:14mm;right:14mm;display:flex;justify-content:center}
        .sig-box{text-align:center;min-width:220px}
        .sig-name{font-style:italic;font-size:10pt;font-weight:700;margin-bottom:12px}
        .sig-line{border-top:1px dashed #999;padding-top:6px;font-size:9pt}
        .page-num{position:absolute;bottom:10mm;right:14mm;font-size:8pt;color:#888}
        @page{size:A4;margin:0}
      </style>
    `;
    const html = printWin.document;
    html.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PO - ${po.poNumber}</title>${style}<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700&display=swap" rel="stylesheet"></head><body><div class="doc">${document.getElementById('po-doc-inner').innerHTML}</div></body></html>`);
    html.close();
    setTimeout(() => { printWin.focus(); printWin.print(); }, 800);
  };

  const rows = po.items || [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 860, width: '95vw', maxHeight: '95vh' }}>
        <div className="modal-header no-print">
          <span className="modal-title">📄 {po.poNumber}</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={po.status} lang={lang} />
            {onEdit && (
              <button className="btn btn-outline btn-sm" onClick={onEdit}>
                ✏ {L('แก้ไข/เพิ่มรายการ', 'Edit / Add Items')}
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨 {L('พิมพ์', 'Print')}</button>
            <button className="btn-icon" onClick={onClose} style={{ border: 'none', fontSize: 18 }}>✕</button>
          </div>
        </div>
        <div className="modal-body" style={{ background: '#e0e0e0', padding: 24 }}>
          {/* A4 Document */}
          <div id="po-doc-inner" className="po-doc" style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '297mm' }}>

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14, borderBottom: '2px solid #222', paddingBottom: 12 }}>
              <img src="assets/logo.png" alt="Unipharma" style={{ width: 80, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13pt', fontWeight: 800, color: '#111', lineHeight: 1.3 }}>{COMPANY.nameTH}</div>
                <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 6, color: '#222' }}>{COMPANY.nameEN}</div>
                <div style={{ fontSize: '8.5pt', color: '#444', lineHeight: 1.7 }}>
                  <div><b>Tax ID:</b> {COMPANY.taxId}</div>
                  <div>{COMPANY.address}</div>
                  <div>{COMPANY.addressEN}</div>
                  <div><b>Contact:</b> {COMPANY.tel}</div>
                </div>
              </div>
            </div>

            {/* PO TITLE */}
            <div style={{ textAlign: 'center', background: '#e0e0e0', padding: '8px 0', margin: '12px 0', borderRadius: 2 }}>
              <div style={{ fontSize: '15pt', fontWeight: 800, letterSpacing: 2 }}>Purchase Order</div>
              {po.isNonPO && <div style={{ fontSize: '9pt', color: '#666' }}>(Non-PO Receipt)</div>}
            </div>

            {/* SUPPLIER + PO INFO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #ccc', marginBottom: 12 }}>
              {/* LEFT — Supplier */}
              <div style={{ padding: '10px 12px', borderRight: '1px solid #ccc' }}>
                {[
                  ['Name', lang==='th'?(supplier.name||'-'):(supplier.nameEN||supplier.name||'-')],
                  ['Address', supplier.address || '-'],
                  ['Tax ID', supplier.taxId || '-'],
                  ['Contact Accounting / Tel.', [supplier.contact, supplier.phone].filter(Boolean).join(' · ') || '-'],
                  po.repBrand ? ['Division / Brand', lang==='en'?(po.repBrandEN||po.repBrand):po.repBrand] : null,
                  po.repName ? ['Sales Rep', `${po.repName}${po.repPhone?' · '+po.repPhone:''}`] : null,
                  ['Credit Term', `${po.creditTerm || 30} Days`],
                ].filter(Boolean).map(([lbl, val]) => (
                  <div key={lbl} style={{ marginBottom: 4, fontSize: '9.5pt', lineHeight: 1.4 }}>
                    <b>{lbl}:</b> <span style={{ color: '#333' }}>{val}</span>
                  </div>
                ))}
              </div>
              {/* RIGHT — PO Info */}
              <div style={{ padding: '10px 12px' }}>
                {[
                  ['Purchase Order No.', po.poNumber],
                  ['Purchase Requisition No.', po.isNonPO ? 'Non-PO' : '-'],
                  ['Purchase Order Date', UTILS.fmtDate(po.poDate, 'en')],
                  ['Delivery Date', UTILS.fmtDate(po.deliveryDate, 'en')],
                  ['Deliver To', po.location || deliveryBranch.addressEN || deliveryBranch.nameEN || '-'],
                  ['Branch No.', branch.code ? `${branch.id} (${branch.code})` : (branch.id || '-')],
                  ['Branch Tel', deliveryBranch.phone || '-'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ marginBottom: 4, fontSize: '9.5pt', lineHeight: 1.4 }}>
                    <b>{lbl}:</b> <span style={{ color: '#333' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CURRENCY */}
            <div style={{ textAlign: 'right', fontSize: '9pt', fontWeight: 700, marginBottom: 8 }}>Currency: THB</div>

            {/* ITEMS TABLE */}
            <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
              <thead>
                <tr>
                  {[
                    { h: 'No.',        align: 'center', w: 28 },
                    { h: 'Description',align: 'left' },
                    { h: 'Quantity',   align: 'right',  w: 62 },
                    { h: 'Unit',       align: 'left',   w: 46 },
                    { h: 'Unit Price', align: 'right',  w: 74 },
                    { h: 'Amount',     align: 'right',  w: 80 },
                    { h: 'Remarks',    align: 'left',   w: 100 },
                  ].map(({ h, align, w }) => (
                    <th key={h} style={{ background: '#d5d5d5', padding: '6px 8px', border: '1px solid #999', fontSize: '9pt', fontWeight: 700, textAlign: align, ...(w ? { width: w } : {}) }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((it, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontSize: '9pt' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '9pt' }}>
                      <div style={{ fontWeight: 600 }}>{it.code} — {lang === 'th' ? it.nameTH : (it.nameEN || it.nameTH)}</div>
                      {it.discount > 0 && <div style={{ fontSize: '8pt', color: '#888', marginTop: 1 }}>Disc. {it.discount}%</div>}
                      {it.dealNote && (
                        <div style={{ fontSize: '7.5pt', color: '#1a5c1a', marginTop: 3, background: '#f0faf0', padding: '2px 6px', borderRadius: 2, borderLeft: '2px solid #6dba6d', display: 'inline-block', lineHeight: 1.5 }}>{it.dealNote}</div>
                      )}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt' }}>{it.qty?.toLocaleString()}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '9pt' }}>{UTILS.getUnit(it.unit, lang)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt' }}>{UTILS.fmt(it.unitPrice)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt', fontWeight: 600 }}>{UTILS.fmt(it.amount || (it.unitPrice * it.qty * (1 - (it.discount || 0) / 100)))}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '8.5pt', color: '#444' }}>{it.remark || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* MEMO + SUMMARY */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '9.5pt', fontWeight: 700, marginBottom: 4 }}>Memo:</div>
                <div style={{ fontSize: '9pt', color: '#444', lineHeight: 1.6 }}>{po.memo && po.memo.trim() ? po.memo : ''}</div>
              </div>
              <div style={{ minWidth: 260 }}>
                {[
                  ['Gross Total', UTILS.fmt(po.grossTotal || 0)],
                  ['Non-Taxable Amount Total', UTILS.fmt(po.nonTaxableAmt ?? po.nonTaxable ?? 0)],
                  ['Taxable Amount Total', UTILS.fmt(po.taxableAmt ?? po.taxable ?? 0)],
                  ['VAT', UTILS.fmt(po.vat || 0)],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5pt', padding: '3px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ color: '#555' }}>{lbl}</span>
                    <span style={{ fontFamily: 'monospace' }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt', fontWeight: 800, borderTop: '2px solid #333', paddingTop: 6, marginTop: 4 }}>
                  <span>Grand Total</span>
                  <span>{UTILS.fmt(po.grandTotal || 0)}</span>
                </div>
                <div style={{ fontSize: '8.5pt', color: '#555', fontStyle: 'italic', marginTop: 4, textAlign: 'right' }}>
                  ({lang==='th' ? UTILS.numToThaiWords(po.grandTotal || 0) : numToEnWords(po.grandTotal || 0)})
                </div>
              </div>
            </div>

            {/* spacer pushes sig to bottom of A4 */}
            <div style={{ flex: 1 }} />

            {/* SIGNATURES */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
              <div style={{ textAlign: 'center', minWidth: 220 }}>
                <div style={{ fontStyle: 'italic', fontSize: '11pt', fontWeight: 700, marginBottom: 12, color: '#333' }}>{po.createdBy || '-'}</div>
                <div style={{ borderTop: '1px solid #999', paddingTop: 6, fontSize: '9pt' }}>Created By</div>
                <div style={{ fontSize: '9pt', color: '#555', marginTop: 4 }}>Date …{UTILS.fmtDate(po.poDate, 'en')}…</div>
              </div>
            </div>

            {/* PAGE — screen only */}
            <div style={{ textAlign: 'right', fontSize: '8pt', color: '#aaa', paddingTop: 6 }}>1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PODocumentModal });
