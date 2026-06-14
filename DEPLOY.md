# Deploy ขึ้น Netlify (ฟรี) — UNIPHARMA

แอปเป็น **static site** (ไม่ต้อง build) โฟลเดอร์ที่ต้อง deploy คือ `unipharma/`

---

## วิธีที่ 1 — ลากวาง (เร็วสุด ไม่ต้องใช้ Git)

1. ไปที่ https://app.netlify.com/drop
2. ลากโฟลเดอร์ **`unipharma`** ทั้งโฟลเดอร์ไปวางในหน้านั้น
3. รอสักครู่ → ได้ลิงก์ใช้งานทันที เช่น `https://random-name.netlify.app`
4. (ทางเลือก) **Site settings → Change site name** เพื่อตั้งชื่อเป็น `unipharma-xxx.netlify.app`

> ทุกครั้งที่แก้ไฟล์ ให้ลากโฟลเดอร์มาวางใหม่เพื่ออัปเดต

## วิธีที่ 2 — เชื่อม GitHub (อัปเดตอัตโนมัติทุกครั้งที่แก้โค้ด) — แนะนำระยะยาว

1. push โปรเจกต์นี้ขึ้น GitHub repo
2. Netlify → **Add new site → Import an existing project** → เลือก repo
3. ตั้งค่า (มีไฟล์ [`netlify.toml`](netlify.toml) กำหนดให้แล้ว):
   - **Publish directory:** `unipharma`
   - **Build command:** เว้นว่าง
4. **Deploy** → จากนี้ทุกครั้งที่ push โค้ด Netlify จะ deploy ใหม่อัตโนมัติ

---

## เชื่อมฐานข้อมูล Supabase ก่อน deploy

ใส่คีย์ใน [`unipharma/config.js`](unipharma/config.js) ให้เรียบร้อยก่อน (ดู [`database/README.md`](database/README.md))
ถ้ายังไม่ใส่ แอปจะ deploy และใช้งานได้ปกติแบบออฟไลน์ (ข้อมูลแยกตามเครื่อง) — เติมคีย์ทีหลังแล้ว deploy ใหม่ได้

## ตรวจสอบหลัง deploy

เปิดเว็บ → กด F12 → แท็บ Console:
- `Supabase cloud sync ENABLED` = เชื่อมฐานข้อมูลสำเร็จ ทุกสาขาเห็นข้อมูลเดียวกัน
- `Running offline (localStorage only)` = ยังไม่ได้ใส่คีย์ Supabase
