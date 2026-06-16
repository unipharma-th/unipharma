# สิทธิ์การเข้าถึง (Roles & Permissions)

## 3 บทบาท

### 1️⃣ Admin (ผู้ดูแลระบบ) | Admin

**สิทธิ์:**
- ✅ ดูข้อมูล (Read)
- ✅ สร้าง/แก้ไข (Create/Edit) - PO, สินค้า, ผู้จัดจำหน่าย
- ✅ ลบข้อมูล (Delete)
- ✅ อนุมัติ PO (Approve)
- ✅ ซิงค์ข้อมูล (Data Sync) - **Admin only**

**ใช้ได้:** ทุกหน้าและทุก feature

---

### 2️⃣ Manager (ฝ่ายจัดซื้อ) | Purchasing Manager

**สิทธิ์:**
- ✅ ดูข้อมูล (Read)
- ✅ สร้าง/แก้ไข (Create/Edit) - PO, สินค้า, ผู้จัดจำหน่าย
- ✅ อนุมัติ PO (Approve)
- ❌ ลบข้อมูล (Delete)
- ❌ ซิงค์ข้อมูล (Data Sync)

**ไม่ได้:** ลบข้อมูล, ซิงค์ข้อมูล

---

### 3️⃣ Viewer (ดูอย่างเดียว) | View-only

**สิทธิ์:**
- ✅ ดูข้อมูล (Read only)
- ❌ สร้าง/แก้ไข (Create/Edit)
- ❌ ลบข้อมูล (Delete)
- ❌ อนุมัติ (Approve)
- ❌ ซิงค์ข้อมูล (Data Sync)

**ใช้ได้เฉพาะ:** ดูข้อมูลเท่านั้น

---

## ตารางเปรียบเทียบ | Comparison Table

| ฟีเจอร์ / Feature | Admin | Manager | Viewer |
|---|---|---|---|
| ดูข้อมูล / Read | ✅ | ✅ | ✅ |
| สร้าง PO / Create PO | ✅ | ✅ | ❌ |
| แก้ไข PO / Edit PO | ✅ | ✅ | ❌ |
| อนุมัติ PO / Approve PO | ✅ | ✅ | ❌ |
| เพิ่มสินค้า / Add Product | ✅ | ✅ | ❌ |
| แก้ไขสินค้า / Edit Product | ✅ | ✅ | ❌ |
| ลบสินค้า / Delete Product | ✅ | ❌ | ❌ |
| เพิ่มผู้จัดจำหน่าย / Add Supplier | ✅ | ✅ | ❌ |
| แก้ไขผู้จัดจำหน่าย / Edit Supplier | ✅ | ✅ | ❌ |
| ลบผู้จัดจำหน่าย / Delete Supplier | ✅ | ❌ | ❌ |
| ดูรายงาน / View Reports | ✅ | ✅ | ✅ |
| ซิงค์ข้อมูล / Data Sync | ✅ | ❌ | ❌ |

---

## หมายเหตุ | Notes

- **เมื่อปิดการบังคับใช้ login** (REQUIRE_LOGIN = false): ผู้ใช้ทั้งหมดจะมีสิทธิ์ Admin (ทดสอบระบบ)
- **When login is not enforced** (REQUIRE_LOGIN = false): All users have Admin privileges (system testing mode)

- **เมื่อเปิดการบังคับใช้ login** (REQUIRE_LOGIN = true): สิทธิ์ขึ้นอยู่กับ role ของผู้ใช้ที่ logged in
- **When login is enforced** (REQUIRE_LOGIN = true): Permissions depend on the logged-in user's role

---

## การตั้ง Role | Setting User Roles

**สำหรับผู้ดูแลระบบ / For Administrators:**

1. เข้าระบบ Supabase dashboard
2. ไปที่ Database → Tables → `auth.users` หรือ `user_roles` table
3. ตั้ง role ของผู้ใช้เป็น: `admin`, `manager`, หรือ `viewer`
4. Save changes

---

**ตั้ง Roles in Supabase Dashboard:**

1. Open Supabase dashboard
2. Go to Database → Tables → `auth.users` or `user_roles` table
3. Set user role to: `admin`, `manager`, or `viewer`
4. Save changes
