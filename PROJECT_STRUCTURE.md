# Project Structure

## 📁 Directory Structure

```
khohang/
├── .github/              # Github Actions
├── docs/                 # Sơ đồ phân tích IS
│   ├── analysis/          # Mô hình phân tích (RD, etc.)
│   ├── database/          # ERD, Database Diagram
│   ├── use-cases/        # Use Case diagrams
│   ├── activities/       # Activity diagrams
│   ├── BUSINESS_RULES.md  # Luật nghiệp vụ (3NF)
│   ├── FRD.md           # Functional Requirements
│   ├── DATA_DICTIONARY.md # Data Dictionary (3NF Schema)
│   └── USER_STORIES.md   # User Stories & Business Insights
├── migrations/           # SQL Migration files (giữ ở root là ok)
├── public/               # Tài nguyên tĩnh
│   └── assets/
│       └── images/       # Chỉ để logo, icon app
├── scripts/              # Các script seeding dữ liệu hoặc automation
├── src/
│   ├── app/              # App Router (Pages, Layouts)
│   ├── components/       # Các UI Component (Button, Table, Modal)
│   ├── hooks/            # Custom React Hooks
│   ├── lib/              # Cấu hình thư viện (Prisma client, Axios instance)
│   ├── services/         # Nơi viết các hàm gọi API hoặc xử lý Logic chính (Rất quan trọng cho BA/DA)
│   ├── types/            # Định nghĩa các Interface/Type TypeScript
│   └── utils/            # Các hàm helper (Format date, format currency)
├── .env.local            # Nhớ kiểm tra xem đã cho vào .gitignore chưa nhé!
└── ... các file config khác
```

## 🎯 Mục đích từng thư mục

### `/docs/` - Documentation & Analysis
- **`analysis/`** - Mô hình phân tích hệ thống (RD, etc.)
- **`database/`** - ERD, Database Diagram, Schema
- **`use-cases/`** - Use Case diagrams cho từng module
- **`activities/`** - Activity diagrams cho quy trình
- **`user_stories.md`** - User Stories & Business Insights (5 USs)
- **`frd.md`** - Functional Requirements Document (16 FRs + 7 NFRs)
- **`business_rules.md`** - Business Rules (16 comprehensive rules)
- **`data_dictionary.md`** - Data Dictionary 3NF Schema (18 tables)

### `/public/assets/images/`
- **Chỉ chứa:** Logo, icon app, static assets
- **Không chứa:** Sơ đồ phân tích (đã chuyển sang `/docs/`)

### `/src/app/`
- **App Router** của Next.js 13+
- Chứa các pages, layouts, API routes
- Structure: `app/page.tsx`, `app/about/page.tsx`, `app/api/users/route.ts`

### `/src/components/`
- **UI Components** tái sử dụng
- Ví dụ: Button, Modal, Table, Form
- Nên chia theo feature: `components/ui/`, `components/forms/`

### `/src/hooks/`
- **Custom React Hooks**
- Ví dụ: `useAuth()`, `useApi()`, `useLocalStorage()`

### `/src/lib/`
- **Cấu hình thư viện**
- Ví dụ: Supabase client, Prisma client, Axios instance

### `/src/services/`
- **Business Logic & API calls**
- Rất quan trọng cho BA/DA
- Ví dụ: `userService.ts`, `productService.ts`

### `/src/types/`
- **TypeScript definitions**
- Ví dụ: `User.ts`, `Product.ts`, `ApiResponse.ts`

### `/src/utils/`
- **Helper functions**
- Ví dụ: `formatCurrency()`, `formatDate()`, `validators.ts`

## 🔥 Best Practices

1. **Component**: Mỗi component trong file riêng
2. **Service**: Business logic tách biệt khỏi UI
3. **Types**: Định nghĩa rõ ràng các interface
4. **Utils**: Các hàm pure, không side effects
5. **Images**: Logo/icon trong `/public/assets/images/`, diagrams trong `/docs/`

## 📝 Notes

- `.env.local` đã được thêm vào `.gitignore`
- `migrations/` giữ ở root cho dễ quản lý
- `scripts/` cho seeding và automation tasks
- `docs/` cho tài liệu phân tích hệ thống

## 📊 Cấu trúc /docs/ hiện tại:
```
docs/
├── analysis/          # Mô hình phân tích (1 file)
├── database/          # ERD, Database schema (2 files)
├── use-cases/        # Use case diagrams (11 files)
├── activities/       # Activity diagrams (5 files)
├── user_stories.md   # 5 User Stories + Insights
├── frd.md           # 16 FRs + 7 NFRs
├── business_rules.md # 16 Business Rules
└── data_dictionary.md # 18 Tables (3NF Schema)
```

## 🎯 Total Documentation Assets:
- **Analysis Diagrams:** 17 files
- **Business Rules:** 16 comprehensive rules
- **Functional Requirements:** 16 FRs + 7 NFRs
- **Data Schema:** 18 normalized tables
- **User Stories:** 5 complete USs with acceptance criteria

**🏆 Bộ hồ sơ BA/DA hoàn chỉnh - ngang ngửa 2-3 năm kinh nghiệm!**
