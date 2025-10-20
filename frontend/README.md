# 🎓 Auto Essay Grader - Frontend

## 📊 RINGKASAN ROUTES & PAGES

### 🔓 Public Routes (Guest Only)

1. **`/`** - Landing Page
2. **`/login`** - Login Page
3. **`/register`** - Register Page
4. **`/about`** - About Page

---

### 🔐 Protected Routes (Require Login)

#### 📱 Main Dashboard

5. **`/home`** - Home Dashboard (daftar kelas, search, buat kelas baru)
6. **`/profile`** - User Profile (edit foto, nama, email, password)

#### 📚 Class Management

7. **`/class`** - Class Detail (daftar assignment, deadline info)
8. **`/peserta`** - Class Participants (16 peserta)
9. **`/invite-peserta`** - Invite Participants (share link & code)

#### ✍️ Assignment/Grading

10. **`/penilaian-baru`** - New Assessment (4 states: empty, with questions, with answers, deadline passed)
11. **`/penilaian-baru/ocr`** - Upload Answer PDF (upload file jawaban)
12. **`/penilaian-baru/typing`** - Type Answer Manual (ketik jawaban di textarea)
13. **`/hasil-penilaian`** - Assessment Results (statistik & nilai peserta)

___

#### Image Page

- Klik folder gambar (repo): [UI/UX](./public/page)

---

## 🎯 Icon System

**Library**: `phosphor-react` dengan `weight="bold"`

**Icons Used (30+)**:

- Navigation: `ArrowLeft`, `Books`, `List`, `X`, `DotsThreeVertical`
- User: `Users`, `UserCircle`, `UserPlus`, `Camera`, `SignOut`, `PencilSimple`
- Actions: `MagnifyingGlass`, `Plus`, `Play`, `Copy`, `Check`
- Upload: `UploadSimple`, `CloudArrowUp`
- Time: `Calendar`, `CalendarBlank`, `Clock`
- Theme: `Sun`, `Moon`, `Eye`, `EyeSlash`
- Loading: `CircleNotch`
- Social: `FacebookLogo`, `TwitterLogo`, `LinkedinLogo`, `InstagramLogo`

---

## 📦 Tech Stack

- Next.js 15.5.4
- React 19.1.0
- TypeScript 5
- Tailwind CSS 4
- phosphor-react
- react-hot-toast

---