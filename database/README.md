# คู่มือเชื่อมฐานข้อมูล Supabase (ฟรี) — UNIPHARMA

ระบบนี้ใช้ **Supabase (PostgreSQL)** เป็นฐานข้อมูลกลางที่ทุกสาขาเห็นข้อมูลชุดเดียวกัน
และใช้ **Google Sheets / Excel** สำหรับนำเข้าข้อมูลก้อนใหญ่ (ยา 10,258 รายการ, ผู้จัดจำหน่าย 410 ราย)

> ก่อนเชื่อม Supabase แอปก็ทำงานได้ปกติแบบออฟไลน์ (เก็บใน localStorage ของแต่ละเครื่อง)
> เมื่อเชื่อมแล้ว ข้อมูลจะแชร์สดข้ามสาขา

---

## ขั้นตอนที่ 1 — สร้างโปรเจกต์ Supabase (ฟรี ไม่ต้องใช้บัตร)

1. ไปที่ https://supabase.com → **Sign up** (ใช้ Google/GitHub ได้)
2. **New project** → ตั้งชื่อ เช่น `unipharma` → ตั้งรหัสผ่านฐานข้อมูล → เลือก Region **Southeast Asia (Singapore)** → Create
3. รอสักครู่ให้โปรเจกต์พร้อม

## ขั้นตอนที่ 2 — สร้างตาราง (รันสคริปต์ครั้งเดียว)

1. ในโปรเจกต์ → เมนูซ้าย **SQL Editor** → **New query**
2. เปิดไฟล์ [`schema.sql`](schema.sql) ในโฟลเดอร์นี้ → คัดลอกทั้งหมด → วาง → กด **Run**
3. ถ้าขึ้น "Success" แปลว่าตารางถูกสร้างครบแล้ว (drugs, suppliers, purchase_orders ฯลฯ)

## ขั้นตอนที่ 3 — เอาคีย์มาใส่ในแอป

1. เมนูซ้าย **Project Settings → API**
2. คัดลอก 2 ค่า:
   - **Project URL** เช่น `https://abcdxyz.supabase.co`
   - **anon public** key (ขึ้นต้น `eyJ...`)
3. เปิดไฟล์ [`../unipharma/config.js`](../unipharma/config.js) แล้วใส่ค่า:
   ```js
   window.UNI_CONFIG = {
     SUPABASE_URL: "https://abcdxyz.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi...",
   };
   ```
4. บันทึก แล้ว deploy ใหม่ (ดู [`../DEPLOY.md`](../DEPLOY.md))

> เปิดหน้าเว็บแล้วกด F12 → Console ถ้าเห็น `[UNI_DB] Supabase cloud sync ENABLED.` = เชื่อมสำเร็จ

## ขั้นตอนที่ 4 — นำเข้าข้อมูลจริง

มี 2 วิธี เลือกอย่างใดอย่างหนึ่ง:

### วิธี A — ผ่านหน้า "ซิงค์ข้อมูล" ในแอป (แนะนำ)
1. เตรียมข้อมูลใน Google Sheet หรือ Excel ตามหัวคอลัมน์ในโฟลเดอร์ [`templates/`](templates/)
   - [`drugs_template.csv`](templates/drugs_template.csv) — ฐานข้อมูลยา
   - [`suppliers_template.csv`](templates/suppliers_template.csv) — ผู้จัดจำหน่าย
2. ในแอป → เมนู **🔄 ซิงค์ข้อมูล** → เลือก Google Sheets หรือ Upload ไฟล์ → จับคู่คอลัมน์ → Import
3. ระบบจะบันทึกขึ้น Supabase ให้อัตโนมัติ (เมื่อเชื่อม Supabase แล้ว)

### วิธี B — Import CSV ตรงใน Supabase
- Supabase → **Table Editor** → เลือกตาราง `drugs` → **Insert → Import data from CSV**
- (วิธีนี้ใส่เฉพาะคอลัมน์แบน ส่วนคอลัมน์ `data` jsonb แนะนำให้ใช้วิธี A แทน เพื่อให้ได้กำไร/หน่วยบรรจุครบ)

---

## โครงสร้างตารางโดยย่อ

| ตาราง | เก็บอะไร |
|------|---------|
| `drugs` | ยาแต่ละรายการ (รหัส, ชื่อ TH/EN, หมวด, ต้นทุน/ราคาขาย, สต็อก 3 สาขา, หน่วยบรรจุ) |
| `suppliers` | ผู้จัดจำหน่าย (ติดต่อ, เครดิต, โปรโมชั่น, รายการยาที่ขาย) |
| `purchase_orders` | ใบสั่งซื้อทั้งหมด (รายการ, ยอดรวม, VAT, สถานะ) |
| `stock_movements` | การเคลื่อนไหวสต็อก (รับเข้า/จ่ายออก) |
| `sync_history` | ประวัติการนำเข้าข้อมูลแต่ละครั้ง |
| `branches`, `categories` | ข้อมูลอ้างอิง (สาขา/หมวดหมู่) |

## ความปลอดภัย (สำคัญ)

ตอนนี้ระบบ **ไม่มีหน้า Login** — คีย์ `anon` เปิดให้อ่าน/เขียนได้ (เหมาะกับใช้ภายในที่ไม่เผยแพร่ลิงก์)
ถ้าต้องการล็อกให้เฉพาะคนมีบัญชี: เปิด **Supabase Auth** แล้วแก้นโยบายใน `schema.sql`
จาก `using (true)` เป็น `using (auth.role() = 'authenticated')` — แจ้งผมได้ เดี๋ยวช่วยทำให้
