import { describe, it, expect } from '@jest/globals';
import {
  hangHoaSchema,
  phieuNhapSchema,
  phieuXuatSchema,
  loginSchema,
  registerSchema,
  validateWithSchema,
  sanitizeString,
  validatePhoneNumber,
} from '../validation';

describe('Validation Schemas', () => {
  describe('hangHoaSchema', () => {
    it('should validate correct hàng hóa data', () => {
      const validData = {
        MaHH: 'HH01',
        TenHH: 'Sản phẩm test',
        MaLoai: 'LH01',
        DonGia: 100000,
        SoLuongTon: 50,
        DVT: 'Cái',
        MaNCC: 'NCC01',
      };

      const result = hangHoaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        MaHH: 'HH01',
        // Thiếu TenHH
        DonGia: 100000,
      };

      const result = hangHoaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(e => e.path.includes('TenHH'))).toBe(true);
      }
    });

    it('should reject negative DonGia', () => {
      const invalidData = {
        MaHH: 'HH01',
        TenHH: 'Sản phẩm test',
        MaLoai: 'LH01',
        DonGia: -1000, // Giá âm
        SoLuongTon: 50,
        DVT: 'Cái',
        MaNCC: 'NCC01',
      };

      const result = hangHoaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const validData = {
        MaHH: 'HH01',
        TenHH: 'Sản phẩm test',
        MaLoai: 'LH01',
        DonGia: 100000,
        SoLuongTon: 50,
        DVT: 'Cái',
        MaNCC: 'NCC01',
        Barcode: '123456789',
        NgaySanXuat: '2024-01-01',
      };

      const result = hangHoaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('phieuNhapSchema', () => {
    it('should validate correct phiếu nhập data', () => {
      const validData = {
        SoPN: 'PN01',
        NgayNhap: '2024-01-01',
        MaNV: 'NV01',
        MaNCC: 'NCC01',
      };

      const result = phieuNhapSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing SoPN', () => {
      const invalidData = {
        NgayNhap: '2024-01-01',
        MaNV: 'NV01',
      };

      const result = phieuNhapSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('phieuXuatSchema', () => {
    it('should validate correct phiếu xuất data', () => {
      const validData = {
        SoPX: 'PX01',
        NgayXuat: '2024-01-01',
        MaNV: 'NV01',
        MaKH: 'KH01',
      };

      const result = phieuXuatSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        username: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        username: 'not-an-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        username: 'test@example.com',
        password: '12345', // < 6 ký tự
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate correct register data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        confirm: 'password123',
        fullName: 'Nguyễn Văn A',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        confirm: 'different123',
        fullName: 'Nguyễn Văn A',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('validateWithSchema', () => {
  it('should return success with valid data', () => {
    const validData = {
      MaHH: 'HH01',
      TenHH: 'Sản phẩm test',
      MaLoai: 'LH01',
      DonGia: 100000,
      SoLuongTon: 50,
      DVT: 'Cái',
      MaNCC: 'NCC01',
    };

    const result = validateWithSchema(hangHoaSchema, validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should return errors with invalid data', () => {
    const invalidData = {
      MaHH: '',
      TenHH: '',
    };

    const result = validateWithSchema(hangHoaSchema, invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      expect(result.errors.MaHH).toBeDefined();
      expect(result.errors.TenHH).toBeDefined();
    }
  });
});

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeString(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
  });

  it('should remove javascript: protocol', () => {
    const input = 'javascript:alert("xss")';
    const result = sanitizeString(input);
    expect(result).not.toContain('javascript:');
  });

  it('should remove event handlers', () => {
    const input = 'onclick=alert("xss")';
    const result = sanitizeString(input);
    expect(result).not.toContain('onclick=');
  });

  it('should trim whitespace', () => {
    const input = '  hello world  ';
    const result = sanitizeString(input);
    expect(result).toBe('hello world');
  });
});

describe('validatePhoneNumber', () => {
  it('should validate Vietnamese phone numbers', () => {
    expect(validatePhoneNumber('0912345678')).toBe(true);
    expect(validatePhoneNumber('+84912345678')).toBe(true);
    expect(validatePhoneNumber('0987654321')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhoneNumber('1234567890')).toBe(false);
    expect(validatePhoneNumber('012345678')).toBe(false);
    expect(validatePhoneNumber('abc123')).toBe(false);
  });
});

