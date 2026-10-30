import { describe, expect, it } from 'vitest';
import { CLOUD_TIMEOUT_MESSAGE, describeCloudError } from './cloudError';

describe('describeCloudError', () => {
  it('quá thời gian chờ', () => {
    expect(describeCloudError(new Error(CLOUD_TIMEOUT_MESSAGE))).toBe('Máy chủ dữ liệu không phản hồi (quá thời gian chờ).');
  });

  it('mất mạng (Chrome và Safari)', () => {
    expect(describeCloudError(new TypeError('Failed to fetch'))).toContain('Không kết nối được');
    expect(describeCloudError(new TypeError('Load failed'))).toContain('Không kết nối được');
  });

  it('lỗi PostgREST giữ mã và thông điệp gốc', () => {
    const result = describeCloudError({ code: '57014', message: 'canceling statement due to statement timeout', details: null, hint: null });
    expect(result).toContain('chạy quá lâu');
    expect(result).toContain('mã 57014: canceling statement due to statement timeout');
  });

  it('thiếu quyền, hết phiên, chỉ đọc', () => {
    expect(describeCloudError({ code: '42501', message: 'permission denied for table students' })).toContain('không có quyền');
    expect(describeCloudError({ code: 'PGRST301', message: 'JWT expired' })).toContain('đăng nhập lại');
    expect(describeCloudError({ code: '25006', message: 'cannot execute UPDATE in a read-only transaction' })).toContain('chỉ đọc');
  });

  it('lỗi lạ vẫn có câu chung và chi tiết', () => {
    expect(describeCloudError({ code: 'PGRST204', message: "Could not find the 'x' column" })).toBe(
      "Có lỗi khi làm việc với dữ liệu đám mây. (mã PGRST204: Could not find the 'x' column)"
    );
    expect(describeCloudError(undefined)).toBe('Có lỗi khi làm việc với dữ liệu đám mây.');
  });
});
