// Help.jsx — Dynamic User Guide (Update-friendly structure)
const { useState } = React;

function HelpPage({ lang, L, perm = { role: 'admin' } }) {
  const [section, setSection] = useState('overview');
  const isAdmin = perm.role === 'admin';

  // 🎯 EDIT HERE: Add/remove sections. adminOnly tabs show only to Admin (when Login is on).
  const ALL_SECTIONS = [
    { id:'overview',  icon:'📋', th:'ภาพรวมระบบ',         en:'System Overview' },
    { id:'pages',     icon:'🖥',  th:'วิธีใช้แต่ละหน้า',    en:'How to Use Each Page' },
    { id:'roles',     icon:'🔐', th:'สิทธิ์การเข้าถึง',     en:'Roles & Permissions' },
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
      steps_th:['ดูรายการ PO ทั้งหมด กรองตามสาขา/สถานะ/เดือน','เปลี่ยนสถานะ: ส่ง → อนุมัติ → ยืนยันรับ','ดูเอกสาร A4 (ชื่อ Supplier & จำนวนเงินแปลเป็นคำ)', 'สร้าง PO ใหม่: เลือกสาขา+Supplier → ดึงราคา → เลือกสินค้า','สถานที่จัดส่ง: เลือกสาขาจาก Dropdown → ที่อยู่เติมอัตโนมัติ (แก้ไขได้) พร้อมเวลาเปิด+เบอร์โทร','เลือกดีล/โปรโมชั่นของ Supplier — ใช้ข้อมูลล่าสุดเสมอ'],
      steps_en:['View all POs, filter by branch/status/month','Change status: submit → approve → confirm','View A4 document (supplier name & amount in words translated)','Create PO: select branch+supplier → auto prices → select items','Delivery: pick a branch from the dropdown → address auto-fills (editable) with open hours + phone','Pick a supplier deal/promotion — always uses the latest data'] },
    { icon:'🏭', th:'ผู้จัดจำหน่าย', en:'Suppliers', color:'var(--warn)',
      steps_th:['ดูการ์ด Supplier พร้อมยอดซื้อ คะแนน','คลิกการ์ดเพื่อดูรายการยา ประวัติ PO โปรโมชั่น','แก้ไขข้อมูล (ชื่อ/ติดต่อ/เครดิต) หรือเพิ่มผู้จัดจำหน่ายใหม่','เพิ่ม/แก้ไข/ลบโปรโมชั่นในฟอร์มแก้ไข (ชื่อ + ส่วนลด% + ใช้ได้ถึง) → ใช้ตอนสร้าง PO ได้ทันที'],
      steps_en:['View supplier cards with spend, rating, promotions','Click card to see drug list, PO history, deals','Edit info or add new supplier','Add/edit/remove promotions in the edit form (name + discount% + valid-until) → available immediately when creating a PO'] },
    { icon:'⚖', th:'เปรียบเทียบราคา', en:'Price Comparison', color:'var(--err)',
      steps_th:['ค้นหายา หรือเลือกจาก Quick Search ด้านล่าง','ดูราคาทุก Supplier + แนะนำซื้อจากไหน','คอลัมน์ \"vs ถูกสุด\" แสดงส่วนต่างราคา'],
      steps_en:['Search drug or pick from quick search below','See prices from all suppliers + recommendation','\"vs Cheapest\" column shows price difference'] },
    { icon:'📦', th:'ติดตามสินค้า', en:'Stock Tracking', color:'#e5312a',
      steps_th:['ดูสต็อกแยกสาขา (PTN/RAM/CNX) พร้อมแถบสี','กรองดู \"ใกล้หมด\" เพื่อสั่งเร็ว','ดูประวัติการเคลื่อนไหวสต็อก (รับเข้า/จ่ายออก)'],
      steps_en:['View stock per branch with status bars','Filter \"Low Stock\" to see items needing order','View movement history (in/out)'] },
    { icon:'📸', th:'สินค้าหมด', en:'Out of Stock', color:'#d97706',
      steps_th:['แท็บ \"รายงาน\": พิมพ์รหัส/ชื่อยา (มีแนะนำอัตโนมัติ) แนบรูป + หมายเหตุ แล้วกดบันทึก','ข้อมูลแชร์ขึ้นคลาวด์ — ทุกคนเห็นพร้อมกันแบบเรียลไทม์ ไม่ต้องรีเฟรช','รอบรายงาน 7 วัน (จ.–อา.) รีเซ็ตอัตโนมัติ','แท็บ \"แผนการสั่ง\" (Manager/Admin): ดูรายการที่ต้องสั่ง พร้อมรูปภาพ + สรุปสถิติ','สั่งซื้อแล้วกด \"สั่งแล้ว / ลบออกจากรายการ\" → รายการหายจากที่ต้องสั่ง แต่เก็บไว้เป็นสถิติ (สั่งแล้ว/แจ้งทั้งหมด)','⚠️ ต้องรัน database/out_of_stock.sql ใน Supabase ครั้งเดียวก่อนใช้แบบแชร์'],
      steps_en:['\"Report\" tab: type code/name (auto-suggest), attach photo + notes, then save','Reports sync to the cloud — everyone sees them live, no refresh needed','7-day window (Mon–Sun) resets automatically','\"Dashboard\" tab (Manager/Admin): see items to reorder with photos + statistics','After ordering, tap \"Ordered / Remove from list\" → it leaves the active list but is kept as statistics (Ordered / Total reported)','⚠️ Run database/out_of_stock.sql in Supabase once to enable sharing'] },
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
                {icon:'⚡',th:'อัปเดตสด เรียลไทม์',en:'Live realtime updates'},
                {icon:'📸',th:'แจ้งสินค้าหมด (แชร์ทุกคน)',en:'Out-of-stock reports (shared)'},
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

      {/* ROLES & PERMISSIONS */}
      {sec==='roles' && (
        <div>
          <Card title={L('🔐 สิทธิ์การเข้าถึงระบบ', '🔐 System Access Control')}>
            <div style={{fontSize:13,color:'var(--txt3)',lineHeight:1.8,marginBottom:16}}>
              {L('ระบบมี 3 บทบาทการใช้งาน เพื่อจัดการสิทธิ์การเข้าถึง feature ต่างๆ',
                'The system has 3 user roles to manage access to different features')}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16}}>
              {[
                {
                  num:'1️⃣',
                  role:L('Admin (ผู้ดูแลระบบ)','Admin - Full Control'),
                  desc:L('สิทธิ์ทั้งหมด - สร้าง แก้ไข ลบ อนุมัติ ซิงค์ข้อมูล','Full access to all features'),
                  permissions:[
                    {icon:'✅',text:L('สร้าง/แก้ไข/ลบ PO','Create/Edit/Delete PO')},
                    {icon:'✅',text:L('อนุมัติ PO','Approve PO')},
                    {icon:'✅',text:L('จัดการสินค้า','Manage Products')},
                    {icon:'✅',text:L('จัดการผู้จัดจำหน่าย','Manage Suppliers')},
                    {icon:'✅',text:L('ซิงค์ข้อมูล (Import)','Data Sync/Import')},
                    {icon:'✅',text:L('ดูรายงาน','View Reports')},
                  ]
                },
                {
                  num:'2️⃣',
                  role:L('Manager (ฝ่ายจัดซื้อ)','Manager - Limited Control'),
                  desc:L('สร้าง แก้ไข อนุมัติ PO แต่ไม่ลบข้อมูล','Can manage POs but cannot delete'),
                  permissions:[
                    {icon:'✅',text:L('สร้าง/แก้ไข PO','Create/Edit PO')},
                    {icon:'✅',text:L('อนุมัติ PO','Approve PO')},
                    {icon:'✅',text:L('จัดการสินค้า','Manage Products')},
                    {icon:'✅',text:L('จัดการผู้จัดจำหน่าย','Manage Suppliers')},
                    {icon:'✅',text:L('ดูรายงาน','View Reports')},
                    {icon:'❌',text:L('ลบข้อมูล','Delete Data')},
                    {icon:'❌',text:L('ซิงค์ข้อมูล','Data Sync')},
                  ]
                },
                {
                  num:'3️⃣',
                  role:L('Viewer (ผู้ชมอย่างเดียว)','Viewer - Read-Only'),
                  desc:L('ดูข้อมูลเท่านั้น ไม่สามารถแก้ไข','View-only access'),
                  permissions:[
                    {icon:'✅',text:L('ดู PO','View PO')},
                    {icon:'✅',text:L('ดูสินค้า','View Products')},
                    {icon:'✅',text:L('ดูผู้จัดจำหน่าย','View Suppliers')},
                    {icon:'✅',text:L('ดูรายงาน','View Reports')},
                    {icon:'❌',text:L('สร้าง/แก้ไข PO','Create/Edit PO')},
                    {icon:'❌',text:L('ลบข้อมูล','Delete Data')},
                    {icon:'❌',text:L('ซิงค์ข้อมูล','Data Sync')},
                  ]
                },
              ].map((role,i)=>(
                <div key={i} style={{background:'var(--bg2)',borderRadius:12,padding:16,borderLeft:`5px solid var(--acc)`}}>
                  <div style={{fontSize:18,marginBottom:2}}>{role.num}</div>
                  <div style={{fontSize:16,fontWeight:700,color:'var(--acc)',marginBottom:4}}>{role.role}</div>
                  <div style={{fontSize:12,color:'var(--txt3)',marginBottom:12,lineHeight:1.6}}>{role.desc}</div>
                  <div style={{fontSize:12,color:'var(--txt)'}}>
                    {role.permissions.map((perm,j)=>(
                      <div key={j} style={{marginBottom:6,display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{fontSize:14}}>{perm.icon}</span>
                        <span>{perm.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={L('📋 ตารางเปรียบเทียบสิทธิ์','📋 Comparison Table')}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'var(--bg3)',borderBottom:`2px solid var(--border)`}}>
                    <th style={{padding:8,textAlign:'left',fontWeight:700}}>{L('Feature','Feature')}</th>
                    <th style={{padding:8,textAlign:'center',fontWeight:700}}>Admin</th>
                    <th style={{padding:8,textAlign:'center',fontWeight:700}}>Manager</th>
                    <th style={{padding:8,textAlign:'center',fontWeight:700}}>Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {feat:L('ดู PO','View PO'),a:'✅',m:'✅',v:'✅'},
                    {feat:L('สร้าง PO','Create PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('แก้ไข PO','Edit PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('ลบ PO','Delete PO'),a:'✅',m:'❌',v:'❌'},
                    {feat:L('อนุมัติ PO','Approve PO'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('จัดการสินค้า','Manage Products'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('จัดการผู้จัดจำหน่าย','Manage Suppliers'),a:'✅',m:'✅',v:'❌'},
                    {feat:L('ซิงค์ข้อมูล','Data Sync'),a:'✅',m:'❌',v:'❌'},
                    {feat:L('ดูรายงาน','View Reports'),a:'✅',m:'✅',v:'✅'},
                  ].map((row,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid var(--bg3)`}}>
                      <td style={{padding:8}}>{row.feat}</td>
                      <td style={{padding:8,textAlign:'center'}}>{row.a}</td>
                      <td style={{padding:8,textAlign:'center'}}>{row.m}</td>
                      <td style={{padding:8,textAlign:'center'}}>{row.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {isAdmin && (
            <Card title={L('🔧 วิธีตั้งค่า Role (เฉพาะผู้ดูแลระบบ)','🔧 How to Set User Roles (Admin only)')}>
              <Step n={1} th="รัน database/auth.sql ใน Supabase SQL Editor (สร้างตาราง profiles + สิทธิ์)" en="Run database/auth.sql in the Supabase SQL Editor (creates the profiles table + policies)" />
              <Step n={2} th="เข้า Supabase → Authentication → Users → Add user (อีเมล + รหัสผ่าน)" en="Supabase → Authentication → Users → Add user (email + password)" />
              <Step n={3} th="ยกระดับสิทธิ์ด้วย SQL: update profiles set role='admin' where email='...'  (admin / manager / viewer)" en="Promote with SQL: update profiles set role='admin' where email='...'  (admin / manager / viewer)" />
              <Step n={4} th="เปิดบังคับ Login: ตั้ง REQUIRE_LOGIN = true ใน config.js แล้ว deploy" en="Enforce login: set REQUIRE_LOGIN = true in config.js, then deploy" />
              <Step n={5} th="ผู้ใช้ login จะได้สิทธิ์ตาม role ที่กำหนดในตาราง profiles" en="Signed-in users get access based on the role in the profiles table" />
            </Card>
          )}
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
