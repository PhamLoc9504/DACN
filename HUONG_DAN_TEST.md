# 🧪 Hướng Dẫn Test

## 📋 Tổng Quan

Dự án đã được setup với **Jest** và **React Testing Library** để test các tính năng đã cải thiện.

---

## 🚀 Chạy Tests

### 1. Chạy tất cả tests
```bash
npm test
```

### 2. Chạy tests ở chế độ watch (tự động chạy lại khi code thay đổi)
```bash
npm run test:watch
```

### 3. Chạy tests với coverage report
```bash
npm run test:coverage
```

### 4. Chạy một test file cụ thể
```bash
npm test validation.test.ts
```

---

## 📁 Cấu Trúc Test Files

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── validation.test.ts      ✅ Test validation schemas
│   │   └── errorHandler.test.ts   ✅ Test error handling
│   ├── validation.ts
│   └── errorHandler.ts
└── components/
    └── __tests__/                  (Có thể thêm sau)
```

---

## ✅ Tests Đã Có

### 1. **Validation Tests** (`validation.test.ts`)
- ✅ Test `hangHoaSchema` - validate hàng hóa
- ✅ Test `phieuNhapSchema` - validate phiếu nhập
- ✅ Test `phieuXuatSchema` - validate phiếu xuất
- ✅ Test `loginSchema` - validate đăng nhập
- ✅ Test `registerSchema` - validate đăng ký
- ✅ Test `validateWithSchema()` - helper function
- ✅ Test `sanitizeString()` - chống XSS
- ✅ Test `validatePhoneNumber()` - validate số điện thoại VN

### 2. **Error Handler Tests** (`errorHandler.test.ts`)
- ✅ Test `createError()` - tạo error object
- ✅ Test `handleApiError()` - xử lý API errors
- ✅ Test `getUserFriendlyMessage()` - thông báo thân thiện
- ✅ Test `isRetryableError()` - kiểm tra lỗi có thể retry
- ✅ Test `formatErrorForDisplay()` - format cho UI

---

## 🧪 Test Manual (Không cần code)

### Test ErrorBoundary

1. **Tạo lỗi React để test ErrorBoundary:**
   - Mở trang bất kỳ
   - Mở DevTools Console
   - Chạy: `throw new Error('Test error')`
   - ErrorBoundary sẽ bắt và hiển thị UI lỗi

2. **Test Error Display Component:**
   - Vào trang `/hang-hoa`
   - Thử tạo hàng hóa với dữ liệu không hợp lệ (thiếu tên, giá âm, etc.)
   - Xem validation errors hiển thị inline

### Test Validation

1. **Test Form Validation:**
   - Vào `/hang-hoa` → Click "Thêm hàng hóa"
   - Thử submit form trống → Xem validation errors
   - Thử nhập giá âm → Xem error message
   - Thử nhập tên quá dài (>255 ký tự) → Xem error

2. **Test API Validation:**
   - Mở DevTools → Network tab
   - Thử POST `/api/hang-hoa` với dữ liệu không hợp lệ
   - Xem response có error code `VALIDATION_ERROR`

### Test Error Handling

1. **Test Network Error:**
   - Tắt internet
   - Thử load dữ liệu → Xem error message thân thiện

2. **Test Duplicate Error:**
   - Tạo hàng hóa với mã đã tồn tại
   - Xem error message "Mã hàng hóa đã tồn tại"

3. **Test Not Found Error:**
   - Thử cập nhật hàng hóa không tồn tại
   - Xem error message "Không tìm thấy"

---

## 📊 Coverage Report

Sau khi chạy `npm run test:coverage`, xem report tại:
```
coverage/
├── lcov-report/
│   └── index.html    ← Mở file này trong browser
```

---

## ➕ Thêm Tests Mới

### Ví dụ: Test Component

```typescript
// src/components/__tests__/ErrorDisplay.test.tsx
import { render, screen } from '@testing-library/react';
import ErrorDisplay from '../ErrorDisplay';
import { formatErrorForDisplay } from '@/lib/errorHandler';

describe('ErrorDisplay', () => {
  it('should render error message', () => {
    const error = formatErrorForDisplay('Test error');
    render(<ErrorDisplay error={error} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```

### Ví dụ: Test API Route

```typescript
// src/app/api/__tests__/hang-hoa.test.ts
import { POST } from '../hang-hoa/route';
import { NextRequest } from 'next/server';

describe('POST /api/hang-hoa', () => {
  it('should validate input', async () => {
    const req = new NextRequest('http://localhost/api/hang-hoa', {
      method: 'POST',
      body: JSON.stringify({}), // Invalid data
    });
    
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module '@testing-library/jest-dom'"
```bash
npm install --save-dev @testing-library/jest-dom
```

### Lỗi: "SyntaxError: Cannot use import statement outside a module"
- Đảm bảo `jest.config.js` đã được setup đúng
- Kiểm tra `jest.setup.js` đã import `@testing-library/jest-dom`

### Tests chạy chậm
- Chỉ chạy tests liên quan: `npm test validation.test.ts`
- Dùng `test:watch` để chạy nhanh hơn

---

## 📝 Best Practices

1. **Test naming:** Mô tả rõ ràng test case
   ```typescript
   it('should reject negative DonGia', () => { ... })
   ```

2. **Arrange-Act-Assert pattern:**
   ```typescript
   // Arrange
   const data = { ... };
   
   // Act
   const result = validate(data);
   
   // Assert
   expect(result.success).toBe(false);
   ```

3. **Test edge cases:**
   - Empty values
   - Null/undefined
   - Boundary values
   - Invalid types

4. **Keep tests simple:**
   - Mỗi test chỉ test một thing
   - Tránh test quá phức tạp

---

## 🎯 Mục Tiêu Coverage

- **Validation:** 90%+ ✅ (Đã đạt)
- **Error Handler:** 85%+ ✅ (Đã đạt)
- **Components:** 70%+ (Cần thêm)
- **API Routes:** 60%+ (Cần thêm)

---

## 📚 Tài Liệu Tham Khảo

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Checklist

- [x] Setup Jest và Testing Library
- [x] Tạo tests cho validation
- [x] Tạo tests cho errorHandler
- [ ] Tạo tests cho components (tùy chọn)
- [ ] Tạo tests cho API routes (tùy chọn)
- [ ] Setup CI/CD với tests (tùy chọn)

