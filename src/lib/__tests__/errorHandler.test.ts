import { describe, it, expect } from '@jest/globals';
import {
  createError,
  handleApiError,
  getUserFriendlyMessage,
  isRetryableError,
  formatErrorForDisplay,
} from '../errorHandler';

describe('Error Handler', () => {
  describe('createError', () => {
    it('should create error with all fields', () => {
      const error = createError('Test error', 'TEST_CODE', 400, { detail: 'test' });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ detail: 'test' });
    });

    it('should create error with defaults', () => {
      const error = createError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('handleApiError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Network error');
      const result = handleApiError(error);
      expect(result.message).toBe('Network error');
    });

    it('should handle fetch errors', () => {
      const error = new Error('fetch failed');
      const result = handleApiError(error);
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('kết nối');
    });

    it('should handle API error objects', () => {
      const error = {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      };
      const result = handleApiError(error);
      expect(result.message).toBe('Validation failed');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.statusCode).toBe(400);
    });

    it('should handle unknown errors', () => {
      const error = null;
      const result = handleApiError(error);
      expect(result.message).toContain('lỗi không xác định');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for known error codes', () => {
      const error = createError('', 'NETWORK_ERROR');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('kết nối');
    });

    it('should return original message for unknown codes', () => {
      const error = createError('Custom error message', 'UNKNOWN_CODE');
      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should handle string errors', () => {
      const message = getUserFriendlyMessage('Simple error');
      expect(message).toBe('Simple error');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors by code', () => {
      const error = createError('', 'NETWORK_ERROR');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify retryable errors by status code', () => {
      const error = createError('', undefined, 500);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const error = createError('', 'VALIDATION_ERROR', 400);
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('formatErrorForDisplay', () => {
    it('should format error for display', () => {
      const error = createError('Test error', 'VALIDATION_ERROR', 400);
      const display = formatErrorForDisplay(error);
      expect(display.title).toBeDefined();
      expect(display.message).toBeDefined();
      expect(display.severity).toBeDefined();
      expect(display.canRetry).toBeDefined();
    });

    it('should set correct severity for different status codes', () => {
      const error400 = createError('', '', 400);
      const display400 = formatErrorForDisplay(error400);
      expect(display400.severity).toBe('warning');

      const error404 = createError('', '', 404);
      const display404 = formatErrorForDisplay(error404);
      expect(display404.severity).toBe('info');
    });

    it('should handle string errors', () => {
      const display = formatErrorForDisplay('Simple error');
      expect(display.message).toBe('Simple error');
    });
  });
});

