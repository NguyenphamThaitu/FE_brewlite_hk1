import { describe, it, expect } from "vitest";
import { ApiError, describeAuthError } from "./auth-api";

describe("describeAuthError", () => {
  it("401: thông báo chung, không tiết lộ email hay mật khẩu sai (FR-15)", () => {
    const result = describeAuthError(new ApiError(401, ["Email hoặc mật khẩu không đúng"]));
    expect(result.form).toBe("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
    expect(result.fields).toEqual({});
  });

  it("409: gắn lỗi vào ô email (FR-14)", () => {
    const result = describeAuthError(new ApiError(409, ["Email đã được đăng ký"]));
    expect(result.fields.email).toContain("đã được đăng ký");
    expect(result.form).toBeUndefined();
  });

  it("429: báo thử quá nhiều lần (NFR-09)", () => {
    expect(describeAuthError(new ApiError(429, [])).form).toContain("quá nhiều lần");
  });

  it("400: chia lỗi theo từng trường", () => {
    const result = describeAuthError(
      new ApiError(400, ["Email không hợp lệ", "Mật khẩu tối thiểu 6 ký tự", "Vui lòng nhập họ tên"]),
    );
    expect(result.fields.email).toBe("Email không hợp lệ");
    expect(result.fields.password).toBe("Mật khẩu tối thiểu 6 ký tự");
    expect(result.fields.fullName).toBe("Vui lòng nhập họ tên");
    expect(result.form).toBeUndefined();
  });

  it("400: thông báo mặc định của class-validator vẫn được gắn đúng trường", () => {
    const result = describeAuthError(new ApiError(400, ["password must be longer than or equal to 6 characters"]));
    expect(result.fields.password).toBeTruthy();
  });

  it("lỗi mạng (không phải ApiError): báo không kết nối được máy chủ", () => {
    expect(describeAuthError(new TypeError("Failed to fetch")).form).toContain("Không thể kết nối");
  });

  it("5xx: báo máy chủ gặp sự cố", () => {
    expect(describeAuthError(new ApiError(500, [])).form).toContain("sự cố");
  });
});
