import { minutesBefore, readIntSetting } from './order-expiry';

describe('Cấu hình tự hủy đơn quá hạn (FR-22)', () => {
  it('đọc số nguyên hợp lệ từ biến môi trường', () => {
    expect(readIntSetting('30', 15, 1)).toBe(30);
    expect(readIntSetting(' 5 ', 15, 1)).toBe(5);
    expect(readIntSetting('0', 60, 0)).toBe(0); // chu kỳ quét = 0 nghĩa là tắt
  });

  it('trống, sai định dạng hoặc nhỏ hơn mức tối thiểu thì dùng mặc định', () => {
    expect(readIntSetting(undefined, 15, 1)).toBe(15);
    expect(readIntSetting('', 15, 1)).toBe(15);
    expect(readIntSetting('abc', 15, 1)).toBe(15);
    expect(readIntSetting('2.5', 15, 1)).toBe(15);
    expect(readIntSetting('0', 15, 1)).toBe(15); // thời hạn 0 phút sẽ hủy ngay mọi đơn → không chấp nhận
    expect(readIntSetting('-3', 60, 0)).toBe(60);
  });

  it('mốc quá hạn = thời điểm hiện tại lùi lại số phút cấu hình', () => {
    const now = new Date('2026-11-13T10:00:00.000Z');
    expect(minutesBefore(now, 15).toISOString()).toBe('2026-11-13T09:45:00.000Z');
  });
});
