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
    nameTH: 'บริษัท แม็กนิฟิเซนท์ เมียนม่าร์ จำกัด (สำนักงานใหญ่)',
    nameEN: 'MAGNIFICENT MYANMAR CO., LTD. (Head Office)',
    taxId: '0105565115671',
    address: '491/4 ถนนราชปรารภ แขวงมักกะสัน เขตราชเทวี กรุงเทพมหานคร 10400',
    tel: '+66 80 005 5690, +66 92 938 1490, +66 80 182 7287'
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=900,height=700');
    const style = `
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Noto Sans Thai','Times New Roman',serif;font-size:10pt;color:#111;background:#fff}
        .doc{width:210mm;margin:0 auto;padding:14mm}
        .header{display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;border-bottom:2px solid #333;padding-bottom:12px}
        .logo{width:80px;flex-shrink:0}
        .logo img{width:100%;object-fit:contain}
        .company-info{flex:1}
        .company-name-th{font-size:13pt;font-weight:700;color:#1a1a1a}
        .company-name-en{font-size:11pt;font-weight:700;margin-bottom:4px}
        .company-detail{font-size:8.5pt;color:#444;line-height:1.6}
        .po-title{text-align:center;margin:16px 0;background:#e8e8e8;padding:10px;border-radius:4px}
        .po-title h1{font-size:16pt;font-weight:700;letter-spacing:1px}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:12px;border:1px solid #ccc}
        .info-col{padding:10px 12px;border-right:1px solid #ccc}
        .info-col:last-child{border-right:none}
        .info-row{margin-bottom:5px;font-size:9.5pt;line-height:1.4}
        .info-label{font-weight:700;color:#333;margin-right:4px}
        .currency-row{text-align:right;font-size:9pt;font-weight:700;margin-bottom:8px;color:#333}
        table{width:100%;border-collapse:collapse;margin-bottom:12px}
        th{background:#d0d0d0;font-weight:700;padding:6px 8px;text-align:left;border:1px solid #999;font-size:9pt}
        td{padding:6px 8px;border:1px solid #ccc;font-size:9pt;vertical-align:top}
        .num{text-align:right}
        .summary-row{display:flex;justify-content:space-between;padding:3px 0;font-size:9.5pt}
        .summary-section{width:280px;margin-left:auto;margin-bottom:12px;border-top:1px solid #999;padding-top:8px}
        .grand-total{font-weight:700;font-size:11pt;border-top:2px solid #333;padding-top:4px;margin-top:4px}
        .thai-words{font-style:italic;font-size:9pt;color:#444;margin-bottom:16px}
        .sig-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px}
        .sig-box{text-align:center;border-top:1px dashed #999;padding-top:8px;font-size:9pt}
        .sig-name{font-style:italic;font-size:10pt;font-weight:700;margin-bottom:4px}
        .memo-section{font-size:9pt;color:#444;margin-bottom:12px}
        @page{size:A4;margin:0}
      </style>
    `;
    const html = printWin.document;
    html.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PO - ${po.poNumber}</title>${style}<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700&display=swap" rel="stylesheet"></head><body><div class="doc">${document.getElementById('po-doc-inner').innerHTML}</div></body></html>`);
    html.close();
    setTimeout(() => { printWin.focus(); printWin.print(); }, 800);
  };

  const rows = po.items || [];
  const hasVatItems = rows.some(r => r.vatRate > 0);

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
          <div id="po-doc-inner" className="po-doc" style={{ margin: '0 auto' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14, borderBottom: '2px solid #222', paddingBottom: 12 }}>
              <img src="assets/logo.png" alt="Unipharma" style={{ width: 80, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13pt', fontWeight: 800, color: '#111', lineHeight: 1.3 }}>{COMPANY.nameTH}</div>
                <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 6, color: '#222' }}>{COMPANY.nameEN}</div>
                <div style={{ fontSize: '8.5pt', color: '#444', lineHeight: 1.7 }}>
                  <div><b>Tax ID:</b> {COMPANY.taxId}</div>
                  <div>{COMPANY.address}</div>
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
              <div style={{ padding: '10px 12px', borderRight: '1px solid #ccc' }}>
                {[
                  ['Name', lang==='th'?(supplier.name||'-'):(supplier.nameEN||supplier.name||'-')],
                  ['Address', supplier.address || '-'],
                  ['Branch No.', branch.code ? `${branch.id} (${branch.code})` : '-'],
                  ['Tax ID', supplier.taxId || '-'],
                  ['Contact', supplier.contact || '-'],
                  ['Tel', supplier.phone || '-'],
                  ['Credit Term', `${po.creditTerm || 30} Days`],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ marginBottom: 4, fontSize: '9.5pt', lineHeight: 1.4 }}>
                    <b>{lbl}:</b> <span style={{ color: '#333' }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 12px' }}>
                {[
                  ['Purchase Order No.', po.poNumber],
                  ['Purchase Requisition No.', po.isNonPO ? 'Non-PO' : '-'],
                  ['Purchase Order Date', UTILS.fmtDate(po.poDate, 'en')],
                  ['Delivery Date', UTILS.fmtDate(po.deliveryDate, 'en')],
                  ['Deliver To', po.location || deliveryBranch.addressEN || deliveryBranch.nameEN || '-'],
                  ['Branch Tel', deliveryBranch.phone || '-'],
                  ['Deal / Note', po.dealNote || '-'],
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
                  {['No.', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Amount', 'VAT'].map(h => (
                    <th key={h} style={{ background: '#d5d5d5', padding: '6px 8px', border: '1px solid #999', fontSize: '9pt', fontWeight: 700, textAlign: h === 'No.' || h === 'VAT' ? 'center' : h === 'Quantity' || h === 'Unit Price' || h === 'Amount' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((it, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontSize: '9pt' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '9pt' }}>
                      <div style={{ fontWeight: 600 }}>{it.code} — {lang === 'th' ? it.nameTH : (it.nameEN || it.nameTH)}</div>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt' }}>{it.qty?.toLocaleString()}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '9pt' }}>{UTILS.getUnit(it.unit, lang)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt' }}>
                      {UTILS.fmt(it.unitPrice)}
                      {it.discount > 0 && <div style={{ fontSize: '8pt', color: '#888' }}>{lang==='th'?'ส่วนลด':'Disc.'} {it.discount}%</div>}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontSize: '9pt', fontWeight: 600 }}>{UTILS.fmt(it.amount || (it.unitPrice * it.qty * (1 - (it.discount || 0) / 100)))}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', fontSize: '9pt' }}>{it.vatRate > 0 ? it.vatRate : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* MEMO + SUMMARY */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '9.5pt', fontWeight: 700, marginBottom: 4 }}>Memo:</div>
                <div style={{ fontSize: '9pt', color: '#444', lineHeight: 1.6 }}>{po.memo || '-'}</div>
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

            {/* SIGNATURES */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <div style={{ textAlign: 'center', minWidth: 220 }}>
                <div style={{ fontStyle: 'italic', fontSize: '11pt', fontWeight: 700, marginBottom: 12, color: '#333' }}>{po.createdBy || '-'}</div>
                <div style={{ borderTop: '1px solid #999', paddingTop: 6, fontSize: '9pt' }}>Created By</div>
                <div style={{ fontSize: '9pt', color: '#555', marginTop: 4 }}>Date …{UTILS.fmtDate(po.poDate, 'en')}…</div>
              </div>
            </div>

            {/* PAGE */}
            <div style={{ textAlign: 'right', fontSize: '8pt', color: '#888', marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 6 }}>1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PODocumentModal });
