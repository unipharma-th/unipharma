# UNIPHARMA — Purchasing Management System

ระบบจัดการการสั่งซื้อสำหรับร้านขายยา UNIPHARMA (3 สาขา: ประตูน้ำ PTN, รามคำแหง RAM, เชียงใหม่ CNX)

**เว็บใช้งานจริง:** https://unipharma-purchasing.netlify.app

## โครงสร้าง

| โฟลเดอร์/ไฟล์ | คืออะไร |
|---|---|
| `unipharma/` | ตัวเว็บแอป (static site — React ผ่าน CDN + Babel, ไม่ต้อง build) |
| `unipharma/config.js` | คีย์เชื่อม Supabase (ว่าง = ทำงานออฟไลน์) |
| `unipharma/db.js` | ตัวเชื่อมฐานข้อมูลคลาวด์ (Supabase) |
| `database/schema.sql` | สคริปต์สร้างตารางใน Supabase |
| `database/README.md` | คู่มือตั้งค่าฐานข้อมูล |
| `database/templates/` | เทมเพลต CSV สำหรับนำเข้าข้อมูล |
| `DEPLOY.md` | คู่มือ deploy ขึ้น Netlify |
| `netlify.toml` | ค่าตั้ง deploy (publish dir = `unipharma/`) |

## ฟีเจอร์หลัก
ภาพรวม (Dashboard) · ฐานข้อมูลยา · การสั่งซื้อ + ใบ PO (A4) · ผู้จัดจำหน่าย · เปรียบเทียบราคา · ติดตามสินค้า · รายงาน · คู่มือ · ซิงค์ข้อมูล (Google Sheets/Excel) — รองรับ 2 ภาษา (ไทย/อังกฤษ) และ Dark/Light mode

## สถาปัตยกรรม
- **Frontend:** static site บน **Netlify**
- **Database:** **Supabase** (PostgreSQL) — แชร์ข้อมูลสดข้ามสาขา
- **นำเข้าข้อมูลก้อนใหญ่:** Google Sheets / Excel ผ่านหน้า Data Sync

## รันในเครื่อง (local)
ต้องเปิดผ่าน http server (ไม่ใช่ file://) เพราะ Babel ต้อง fetch ไฟล์ .jsx
```bash
cd unipharma
python -m http.server 8000
# เปิด http://localhost:8000
```
