Here's the `DATADICTIONARY.md` file based on the provided Prisma schema, formatted in both Thai and English as per your request:

---

# Data Dictionary (EN & TH)

## ตารางผู้ใช้ (User Table)

| ชื่อฟิลด์ (TH)    | ชื่อฟิลด์ (EN) | คำอธิบาย (TH)                                                    | Description                                       |
|--------------------|-----------------|-------------------------------------------------------------------|---------------------------------------------------|
| ไอดี               | id              | ไอดีเฉพาะสำหรับผู้ใช้แต่ละคน                                     | Unique identifier for each user                   |
| ชื่อผู้ใช้         | username        | ชื่อผู้ใช้ (ต้องไม่ซ้ำกัน)                                       | Unique username of the user                       |
| ชื่อจริง           | firstName       | ชื่อจริงของผู้ใช้ (เลือกใส่หรือไม่ก็ได้)                         | User's first name (optional)                      |
| นามสกุล           | lastName        | นามสกุลของผู้ใช้ (เลือกใส่หรือไม่ก็ได้)                          | User's last name (optional)                       |
| รูปภาพ             | image           | URL ของรูปโปรไฟล์ของผู้ใช้ (เลือกใส่หรือไม่ก็ได้)                 | URL of the user's profile image (optional)        |
| อีเมล              | email           | ที่อยู่อีเมลของผู้ใช้ (ต้องไม่ซ้ำกัน)                             | User's email address (unique)                     |
| วันที่สร้าง        | createdAt       | วันที่ที่สร้างผู้ใช้                                              | Date when the user was created                    |
| วันที่ลบ           | deletedAt       | วันที่ที่ลบผู้ใช้ (สำหรับการลบแบบซ่อน)                           | Date when the user was soft-deleted (optional)    |
| บัญชี              | accounts        | บัญชีที่เชื่อมโยงกับผู้ใช้                                       | Linked accounts for external providers            |
| บทบาทผู้ใช้        | userRoles       | บทบาทของผู้ใช้ในระบบ                                             | User roles associated with this user              |
| บริการของผู้ใช้    | userServices    | บริการที่ผู้ใช้สามารถเข้าถึงได้                                   | Services accessible by the user                   |
| Refresh Tokens     | refreshTokens   | Token ที่ใช้สำหรับการรีเฟรชของผู้ใช้                              | Refresh tokens for the user                       |
| บันทึกกิจกรรม      | auditLogs       | บันทึกกิจกรรมการใช้งานของผู้ใช้                                  | User activity logs (e.g., login, token usage)     |

---

## ตารางบัญชี (Account Table)

| ชื่อฟิลด์ (TH)       | ชื่อฟิลด์ (EN)        | คำอธิบาย (TH)                                             | Description                                  |
|----------------------|-----------------------|------------------------------------------------------------|----------------------------------------------|
| ไอดี                 | id                    | ไอดีเฉพาะสำหรับบัญชีแต่ละอัน                              | Unique identifier for each account           |
| ผู้ให้บริการ         | provider              | ชื่อของผู้ให้บริการภายนอก                                  | Name of the external provider                |
| ไอดีบัญชีผู้ให้บริการ | providerAccountId     | ไอดีเฉพาะของบัญชีผู้ให้บริการ                              | Unique identifier from the external provider |
| ไอดีผู้ใช้           | userId                | ไอดีของผู้ใช้ที่เชื่อมโยงกับบัญชี                          | ID of the user linked to this account        |
| วันที่ลบ             | deletedAt             | วันที่ที่ลบบัญชี (สำหรับการลบแบบซ่อน)                     | Date when the account was soft-deleted (optional) |

---

## ตารางบทบาท (Role Table)

| ชื่อฟิลด์ (TH)    | ชื่อฟิลด์ (EN) | คำอธิบาย (TH)                                   | Description                                 |
|--------------------|-----------------|--------------------------------------------------|---------------------------------------------|
| ไอดี               | id              | ไอดีเฉพาะสำหรับบทบาทแต่ละอัน                    | Unique identifier for each role             |
| ชื่อบทบาท         | name            | ชื่อของบทบาท (ต้องไม่ซ้ำกัน)                    | Unique name of the role                     |
| คำอธิบาย          | description     | คำอธิบายของบทบาท (เลือกใส่หรือไม่ก็ได้)         | Description of the role (optional)          |
| วันที่ลบ           | deletedAt       | วันที่ที่ลบบทบาท (สำหรับการลบแบบซ่อน)           | Date when the role was soft-deleted         |
| สิทธิ์ของบทบาท     | permissions     | สิทธิ์ที่เชื่อมโยงกับบทบาท                       | Permissions associated with the role        |

---

## ตารางสิทธิ์ (Permission Table)

| ชื่อฟิลด์ (TH)    | ชื่อฟิลด์ (EN)   | คำอธิบาย (TH)                                          | Description                                  |
|--------------------|------------------|---------------------------------------------------------|----------------------------------------------|
| ไอดี               | id               | ไอดีเฉพาะสำหรับสิทธิ์แต่ละอัน                          | Unique identifier for each permission        |
| ชื่อสิทธิ์         | name             | ชื่อของสิทธิ์ (ต้องไม่ซ้ำกัน)                          | Unique name of the permission                |
| คำอธิบาย          | description      | คำอธิบายของสิทธิ์ (เลือกใส่หรือไม่ก็ได้)               | Description of the permission (optional)     |
| วันที่ลบ           | deletedAt        | วันที่ที่ลบสิทธิ์ (สำหรับการลบแบบซ่อน)                 | Date when the permission was soft-deleted    |

---

## ตารางความสัมพันธ์บทบาท-สิทธิ์ (RolePermission Table)

| ชื่อฟิลด์ (TH)    | ชื่อฟิลด์ (EN)   | คำอธิบาย (TH)                                           | Description                                  |
|--------------------|------------------|----------------------------------------------------------|----------------------------------------------|
| ไอดี               | id               | ไอดีเฉพาะสำหรับความสัมพันธ์บทบาท-สิทธิ์                 | Unique identifier for each role-permission relationship |
| ไอดีบทบาท         | roleId           | ไอดีของบทบาท                                             | ID of the role                               |
| ไอดีสิทธิ์         | permissionId     | ไอดีของสิทธิ์                                           | ID of the permission                         |
| วันที่ลบ           | deletedAt        | วันที่ที่ลบความสัมพันธ์บทบาท-สิทธิ์ (สำหรับการลบแบบซ่อน) | Date when the role-permission was soft-deleted |

---

## ตารางบริการ (Service Table)

| ชื่อฟิลด์ (TH)    | ชื่อฟิลด์ (EN)   | คำอธิบาย (TH)                                           | Description                                  |
|--------------------|------------------|----------------------------------------------------------|----------------------------------------------|
| ไอดี               | id               | ไอดีเฉพาะสำหรับบริการแต่ละอัน                           | Unique identifier for each service           |
| ชื่อบริการ         | name             | ชื่อของบริการ (ต้องไม่ซ้ำกัน)                            | Unique name of the service                   |
| คำอธิบาย          | description      | คำอธิบายของบริการ (เลือกใส่หรือไม่ก็ได้)                | Description of the service (optional)        |
| สาธารณะ           | public           | บริการนี้เป็นแบบสาธารณะหรือไม่                           | Is the service public                        |
| วันที่ลบ           | deletedAt        | วันที่ที่ลบบริการ (สำหรับการลบแบบซ่อน)                  | Date when the service was soft-deleted       |

---

## ตาราง API Key ของบริการ (ServiceApiKey Table)

| ชื่อฟิลด์ (TH)    | ชื่อฟิลด์ (EN)   | คำอธิบาย (TH)                                           | Description                                  |
|--------------------|------------------|----------------------------------------------------------|----------------------------------------------|
| ไอดี               | id               | ไอดีเฉพาะสำหรับ API Key แต่ละอัน                         | Unique identifier for each API Key           |
| ไอดีบริการ         | serviceId        | ไอดีของบริการที่เชื่อมโยงกับ API Key                     | ID of the associated service                 |
| คีย์ API           | apiKey           | คีย์ API เฉพาะ                                           | Unique API Key                               |
| วันที่สร้าง        | createdAt        | วันที่ที่สร้าง API Key                                    | Date when the API Key was created            |
| วันที่หมดอายุ      | expiresAt        | วันที่ที่คีย์ API หมดอายุ (เลือกใส่หรือไม่ก็ได้)         | Expiration date of the API Key (optional)    |

---

## ตารางบันทึกกิจกรรมผู้ใช้ (AuditLog Table)

| ชื่อฟิลด์ (TH)    | ชื่อฟิลด์ (EN)   | คำอธิบาย (TH)                                           | Description                                  |
|--------------------|------------------|----------------------------------------------------------|----------------------------------------------|
| ไอดี               | id               | ไอดีเฉพาะสำหรับบันทึกกิจกรรม                             | Unique identifier for each audit log         |
| ไอดีผู้ใช้         | userId           | ไอดีของผู้ใช้ที่ทำกิจกรรม                                | ID of the user who performed the action      |
| กิจกรรม           | action           | ประเภทของกิจกรรม (เช่น "LOGIN", "LOGOUT")               | Type of action (e.g., "LOGIN", "LOGOUT")     |
| เวลาทำกิจกรรม      | timestamp        | เวลาที่ทำกิจกรรม                                        | Timestamp of the activity                    |
| ที่อยู่ IP         | ipAddress        | ที่อยู่ IP ของผู้ใช้ (เลือกใส่หรือไม่ก็ได้)              | IP address of the user (optional)            |
| ข้อมูลอุปกรณ์     | userAgent        | ข้อมูลของอุปกรณ์ที่ใช้ (เลือกใส่หรือไม่ก็ได้)           | User agent information (optional)            |
| วันที่ลบ           | deletedAt        | วันที่ที่ลบกิจกรรม (สำหรับการลบแบบซ่อน)                 | Date when the log entry was soft-deleted     |

