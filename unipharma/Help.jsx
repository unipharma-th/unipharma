// Help.jsx — Dynamic User Guide (Update-friendly structure)
const { useState } = React;

function HelpPage({ lang, L, perm = { role: 'admin' } }) {
  const [section, setSection] = useState('overview');
  const isAdmin = perm.role === 'admin';

  // 🎯 EDIT HERE: Add/remove sections. adminOnly tabs show only to Admin (when Login is on).
  const ALL_SECTIONS = [
    { id:'overview',  icon:'📋', th:'ภาพรวมระบบ',         en:'System Overview' },
    { id:'pages',     icon:'🖥',  th:'วิธีใช้แต่ละหน้า',    en:'How to Use Each Page' },
    { id:'data',      icon:'📦', th:'ข้อมูลที่ต้องเตรียม',   en:'Required Data',  adminOnly:true },
    { id:'sync',      icon:'🔄', th:'ซิงค์ข้อมูล',          en:'Data Sync',       adminOnly:true },
    { id:'nextsteps', icon:'🚀', th:'ขั้นตอนถัดไป',         en:'Next Steps',      adminOnly:true },
  ];
  const SECTIONS = ALL_SECTIONS.filter(s => !s.adminOnly || isAdmin);
  // If the saved section is admin-only and the user isn't admin, fall back to overview.
  const sec = SECTIONS.some(s => s.id === section) ? section : 'overview';

  // 🎯 EDIT HERE: Add new pages to the guide
  const PAGES = [
    { icon:'▦', th:'ภาพรวม', en:'Dashboard', color:'var(--acc)',
      steps_th:['ดูยอดสั่งซื้อประจำเดือน, จำนวน PO รอ, สินค้าใกล้หมด','ดูกราฟยอดสั่งซื้อแยกสาขา และสัดส่วนตามหมวดหมู่','คลิก Card เพื่อไปหน้าอื่น หรือสร้าง PO ใหม่'],
      steps_en:['View monthly spend, pending POs, low stock alerts','See branch spending & category breakdown','Click cards to navigate or create new PO'] },
    { icon:'💊', th:'ฐานข้อมูลยา', en:'Drug Database', color:'var(--ok)',
      steps_th:['ค้นหาด้วยรหัส/ชื่อยา กรองตามหมวดหมู่/VAT','ดูรายละเอียด: ต้นทุน/ขาย, กำไร%, หน่วยบรรจุ, สต็อก','เพิ่มยาใหม่ หรือแก้ไข (กำไรแก้ได้→ราคาขายอัปเดต)','📦 Packaging ON เพื่อดูหน่วยบรรจุแบบเต็ม','หน่วยบรรจุแก้ได้ใน Edit form'],
      steps_en:['Search by code/name, filter by category/VAT','View full details: cost/sell, profit%, packaging, stock','Add new or edit drugs (profit editable → auto-update sell)','Toggle Packaging ON to see packaging hierarchy','Edit packaging in the Edit form'] },
    { icon:'📋', th:'การสั่งซื้อ', en:'Purchase Orders', color:'var(--info)',
      steps_th:['ดูรายการ PO ทั้งหมด กรองตามสาขา/สถานะ/เดือน','เปลี่ยนสถานะ: ส่ง → อนุมัติ → ยืนยันรับ','ดูเอกสาร A4 (ชื่อ Supplier & จำนวนเงินแปลเป็นคำ)', 'สร้าง PO ใหม่: เลือกสาขา+Supplier → ดึงราคา → เลือกสินค้า'],
      steps_en:['View all POs, filter by branch/status/month','Change status: submit → approve → confirm','View A4 document (supplier name & amount in words translated)','Create PO: select branch+supplier → auto prices → select items'] },
    { icon:'🏭', th:'ผู้จัดจำหน่าย', en:'Suppliers', color:'var(--warn)',
      steps_th:['ดูการ์ด Supplier พร้อมยอดซื้อ คะแนน','คลิกการ์ดเพื่อดูรายการยา ประวัติ PO โปรโมชั่น','แก้ไขข้อมูล (ชื่อ/ติดต่อ/เครดิต) หรือเพิ่มผู้จัดจำหน่ายใหม่'],
      steps_en:['View supplier cards with spend, rating, promotions','Click card to see drug list, PO history, deals','Edit info or add new supplier'] },
    { icon:'⚖', th:'เปรียบเทียบราคา', en:'Price Comparison', color:'var(--err)',
      steps_th:['ค้นหายา หรือเลือกจาก Quick Search ด้านล่าง','ดูราคาทุก Supplier + แนะนำซื้อจากไหน','คอลัมน์ \"vs ถูกสุด\" แสดงส่วนต่างราคา'],
      steps_en:['Search drug or pick from quick search below','See prices from all suppliers + recommendation','\"vs Cheapest\" column shows price difference'] },
    { icon:'📦', th:'ติดตามสินค้า', en:'Stock Tracking', color:'#e5312a',
      steps_th:['ดูสต็อกแยกสาขา (PTN/RAM/CNX) พร้อมแถบสี','กรองดู \"ใกล้หมด\" เพื่อสั่งเร็ว','ดูประวัติการเคลื่อนไหวสต็อก (รับเข้า/จ่ายออก)'],
      steps_en:['View stock per branch with status bars','Filter \"Low Stock\" to see items needing order','View movement history (in/out)'] },
    { icon:'📊', th:'รายงาน', en:'Reports', color:'var(--acc)',
      steps_th:['เลือกเดือน+สาขา ด้วย filter','ดูกราฟแนวโน้ม หมวดหมู่ เปรียบเทียบสาขา','แท็บ Top 10 / ไม่ได้สั่ง / Supplier Analysis'],
      steps_en:['Select month+branch with filters','View trend, category, branch comparison charts','Tabs: Top 10 / Rarely Ordered / Supplier Analysis'] },
  ];

  // 🎯 EDIT HERE: Update data requirements
  const REQUIRED_DATA = [
    { th:'💊 ฐานข้อมูลยา', en:'💊 Drug Database',
      current_th:'83 ตัวอย่าง', current_en:'83 sample',
      needed_th:'10,258 รายการ', needed_en:'10,258 items',
      fields:[['รหัสสินค้า','Code'],['ชื่อไทย','Name TH'],['ชื่ออังกฤษ','Name EN'],['หน่วย','Unit'],['หมวดหมู่','Category'],['VAT','Has VAT'],['ต้นทุน','Cost'],['ราคาขาย','Sell'],['สต็อก PTN/RAM/CNX','Stock'],['สต็อกขั้นต่ำ','Min Stock'],['ผู้จัดจำหน่าย','Supplier'],['หน่วยบรรจุ','Packaging (ใหม่)']] },
    { th:'🏭 ผู้จัดจำหน่าย', en:'🏭 Suppliers',
      current_th:'10 ราย', current_en:'10',
      needed_th:'410 ราย', needed_en:'410',
      fields:[['รหัส','ID'],['ชื่อไทย','Name TH'],['ชื่ออังกฤษ','Name EN'],['ติดต่อ','Contact'],['โทร','Phone'],['เครดิต','Credit Days'],['ส่งภายใน','Delivery Days'],['ยาที่จำหน่าย','Drugs (ใหม่)'],['ราคาต้นทุน','Cost Price (ใหม่)'],['โปรโมชั่น','Promotions (ใหม่)']] },
    { th:'📦 สต็อกเริ่มต้น', en:'📦 Initial Stock',
      current_th:'ตัวอย่าง', current_en:'Sample',
      needed_th:'สต็อกจริงทั้ง 3 สาขา', needed_en:'Real stock all 3 branches',
      fields:[['วันที่','Date'],['สาขา','Branch'],['รหัสยา','Drug Code'],['จำนวน','Quantity']] },
  ];

  // 🎯 EDIT HERE: Update next steps
  const NEXT_STEPS = [
    { priority:'🔴', icon:'💊', th:'นำเข้าฐานข้อมูลยา 10,258 รายการ', en:'Import 10,258 drugs' },
    { priority:'🔴', icon:'🏭', th:'นำเข้าผู้จัดจำหน่าย 410 ราย + ราคา + ยา', en:'Import 410 suppliers + pricing' },
    { priority:'🟡', icon:'📦', th:'บันทึกสต็อกจริงทั้ง 3 สาขา', en:'Record real stock all branches' },
    { priority:'🟡', icon:'🎁', th:'ตั้งค่าโปรโมชั่น Supplier', en:'Set up supplier promotions' },
    { priority:'🟢', icon:'☁', th:'ฐานข้อมูลคลาวด์ Supabase (เชื่อมแล้ว ✓)', en:'Supabase cloud database (connected ✓)' },
    { priority:'🟢', icon:'🔐', th:'เปิดใช้ระบบ Login + สิทธิ์ (พร้อมแล้ว เปิดเมื่อต้องการ)', en:'Enable Login + roles (ready to turn on)' },
  ];

  const Card = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid var(--acc)` }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--acc)', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );

  const Step = ({ n, th, en }) => (
    <div style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--acc)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>{n}</div>
      <div style={{ fontSize:13, color:'var(--txt)', paddingTop:4 }}>{lang==='th' ? th : en}</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">📖 {L('คู่มือการใช้งาน', 'User Guide')}</div>
          <div className="page-subtitle">UNIPHARMA Purchasing Management — {L('ปรับปรุงล่าสุด:', 'Last updated:')} Jun 2026</div>
        </div>
      </div>

      <div className="tabs" style={{marginBottom:20}}>
        {SECTIONS.map(s => (
          <button key={s.id} className={`tab-btn${sec===s.id?' active':''}`} onClick={()=>setSection(s.id)}>
            {s.icon} {lang==='th'?s.th:s.en}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {sec==='overview' && (
        <div>
          <Card title={L('ระบบนี้ใช้ได้เลยตอนนี้ — ข้อมูลตัวอย่างพร้อม', 'This system is ready to use now — sample data included')}>
            <div style={{fontSize:13,color:'var(--txt3)',lineHeight:1.8,marginBottom:12}}>
              {L('ใช้ได้เลย: สร้าง PO, ดูรายงาน, เปรียบเทียบราคา, ระบบ 2 ภาษา + Dark mode',
                'Ready now: Create POs, view reports, compare prices, bilingual + dark mode')}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
              {[
                {icon:'✅',th:'พร้อมใช้งานทันที',en:'Ready to use'},
                {icon:'💊',th:'ข้อมูลตัวอย่าง 83 ยา',en:'83 sample drugs'},
                {icon:'🏭',th:'10 ผู้จัดจำหน่าย',en:'10 suppliers'},
                {icon:'🇹🇭/🇺🇸',th:'2 ภาษา (ไทย/อังกฤษ)',en:'2 languages'},
                {icon:'🌓',th:'โหมดมืด/สว่าง',en:'Dark/Light'},
                {icon:'☁',th:'ซิงค์บนคลาวด์ (Supabase)',en:'Cloud sync (Supabase)'},
              ].map((item,i)=>(
                <div key={i} style={{background:'var(--bg3)',borderRadius:8,padding:12}}>
                  <div style={{fontSize:20,marginBottom:4}}>{item.icon}</div>
                  <div style={{fontSize:12,color:'var(--txt)'}}>{lang==='th'?item.th:item.en}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={L('🔐 สิทธิ์การเข้าถึง (Roles & Permissions)', '🔐 Roles & Permissions')}>
            <div style={{fontSize:13,color:'var(--txt3)',lineHeight:1.8,marginBottom:12}}>
              {L('ระบบมี 3 บทบาท สำหรับการควบคุมสิทธิ์: Admin, Manager, Viewer',
                'System has 3 roles to control access: Admin, Manager, Viewer')}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12}}>
              {[
                {icon:'1️⃣',role:L('Admin (ผู้ดูแลระบบ)','Admin'),desc:L('สิทธิ์เต็มทั้งหมด สร้าง/แก้ไข/ลบ/อนุมัติ/ซิงค์ข้อมูล','Full access: create, edit, delete, approve, sync data')},
                {icon:'2️⃣',role:L('Manager (ฝ่ายจัดซื้อ)','Manager'),desc:L('สร้าง/แก้ไข/อนุมัติ PO แต่ไม่ลบข้อมูลและไม่ซิงค์','Can create/edit/approve PO, no delete or data sync')},
                {icon:'3️⃣',role:L('Viewer (ดูอย่างเดียว)','Viewer'),desc:L('ดูข้อมูลเท่านั้น ไม่สามารถสร้าง/แก้ไข/ลบได้','View-only access, cannot create/edit/delete')},
              ].map((item,i)=>(
                <div key={i} style={{background:'var(--bg3)',borderRadius:8,padding:12,borderLeft:`4px solid var(--acc)`}}>
                  <div style={{fontSize:16,marginBottom:4}}>{item.icon} {item.role}</div>
                  <div style={{fontSize:12,color:'var(--txt3)'}}>{item.desc}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,padding:12,background:'var(--bg2)',borderRadius:8,fontSize:12,color:'var(--txt3)'}}>
              {L('📖 ดูรายละเอียดทั้งหมด: ','📖 Full details: ')}<a href="ROLES_AND_PERMISSIONS.md" target="_blank" style={{color:'var(--acc)',textDecoration:'none'}}>Roles & Permissions Documentation</a>
            </div>
          </Card>
        </div>
      )}

      {/* PAGES */}
      {sec==='pages' && (
        <div>
          {PAGES.map(page => (
            <Card key={page.en} title={`${page.icon} ${lang==='th'?page.th:page.en}`}>
              {(lang==='th'?page.steps_th:page.steps_en).map((s,i) => <Step key={i} n={i+1} th={s} en={s} />)}
            </Card>
          ))}
        </div>
      )}

      {/* DATA */}
      {sec==='data' && (
        <div>
          {REQUIRED_DATA.map(data => (
            <Card key={data.en} title={lang==='th'?data.th:data.en}>
              <div style={{display:'flex',gap:20,marginBottom:12,fontSize:12}}>
                <div>
                  <div style={{color:'var(--txt3)',marginBottom:2}}>ปัจจุบัน:</div>
                  <div style={{fontWeight:700,color:'var(--warn)'}}>{lang==='th'?data.current_th:data.current_en}</div>
                </div>
                <div>
                  <div style={{color:'var(--txt3)',marginBottom:2}}>ต้องการ:</div>
                  <div style={{fontWeight:700,color:'var(--ok)'}}>{lang==='th'?data.needed_th:data.needed_en}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:'var(--txt3)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {data.fields.map(([th,en],i) => (
                  <div key={i}>✓ {lang==='th'?th:en}</div>
                ))}
              </div>
            </Card>
          ))}
          <Card title={L('วิธีการนำเข้า','How to import')}>
            <Step n={1} th="เตรียมข้อมูล Excel ตามฟอร์แมตข้างบน" en="Prepare Excel in format above" />
            <Step n={2} th="ไปเมนู '🔄 Data Sync'" en="Go to '🔄 Data Sync' menu" />
            <Step n={3} th="Upload File หรือ Google Sheets" en="Upload File or use Google Sheets" />
            <Step n={4} th="ระบบจับคู่คอลัมน์ → Preview → Import" en="System maps columns → preview → import" />
          </Card>
        </div>
      )}

      {/* SYNC */}
      {sec==='sync' && (
        <div>
          <Card title={L('ตัวเลือก 1: Google Sheets (แนะนำ)','Option 1: Google Sheets (Recommended)')}>
            <Step n={1} th="สร้าง Google Sheet" en="Create Google Sheet" />
            <Step n={2} th="ใส่ข้อมูล (copy จาก Excel ได้)" en="Add data (can copy from Excel)" />
            <Step n={3} th="File → Share → Anyone with link → Viewer" en="File → Share → Anyone with link → Viewer" />
            <Step n={4} th="คัดลอก URL → วางในระบบ → ดึงข้อมูล" en="Copy URL → paste in system → fetch data" />
            <Step n={5} th="ทำซ้ำทุก 2 เดือน — ระบบ Merge ข้อมูลเก่า+ใหม่" en="Repeat every 2 months — system merges data" />
          </Card>
          <Card title={L('ตัวเลือก 2: Upload Excel','Option 2: Upload Excel')}>
            <Step n={1} th="เตรียมไฟล์ .xlsx" en="Prepare .xlsx file" />
            <Step n={2} th="เมนู Data Sync → Upload File" en="Data Sync menu → Upload File" />
            <Step n={3} th="Drag & Drop หรือเลือกไฟล์" en="Drag & drop or select file" />
            <Step n={4} th="จับคู่คอลัมน์ → Preview → Import" en="Map columns → preview → import" />
          </Card>
        </div>
      )}

      {/* NEXT STEPS */}
      {sec==='nextsteps' && (
        <div className="card" style={{padding:0}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',fontWeight:700}}>
            {L('ทำตามลำดับเพื่อให้ระบบสมบูรณ์','Complete in this order')}
          </div>
          {NEXT_STEPS.map((step,i) => (
            <div key={i} style={{display:'flex',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
              <span style={{fontSize:20,minWidth:30}}>{step.icon}</span>
              <span style={{fontSize:13,flex:1}}>{lang==='th'?step.th:step.en}</span>
              <span style={{fontWeight:700,color:'var(--txt3)',fontSize:12}}>{step.priority}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HelpPage });
