import { describe, it, expect } from "vitest";
import { safeNextPath, validateLogin, validateRegister } from "./auth-validation";

const validRegister = {
  fullName: "Nguyễn Văn A",
  email: "a@example.com",
  password: "matkhau123",
  confirm: "matkhau123",
};

describe("validateLogin", () => {
  it("không có lỗi khi email và mật khẩu hợp lệ", () => {
    expect(validateLogin({ email: "a@example.com", password: "x" })).toEqual({});
  });

  it("báo lỗi khi để trống", () => {
    const errors = validateLogin({ email: "  ", password: "" });
    expect(errors.email).toBe("Vui lòng nhập email.");
    expect(errors.password).toBe("Vui lòng nhập mật khẩu.");
  });

  it("báo lỗi khi email sai định dạng", () => {
    expect(validateLogin({ email: "abc", password: "x" }).email).toContain("chưa đúng định dạng");
  });
});

describe("validateRegister", () => {
  it("không có lỗi khi dữ liệu hợp lệ", () => {
    expect(validateRegister(validRegister)).toEqual({});
  });

  it("yêu cầu họ tên", () => {
    expect(validateRegister({ ...validRegister, fullName: "   " }).fullName).toBe(
      "Vui lòng nhập họ và tên.",
    );
  });

  it("mật khẩu dưới 8 ký tự bị từ chối (FR-14)", () => {
    const errors = validateRegister({ ...validRegister, password: "1234567", confirm: "1234567" });
    expect(errors.password).toBe("Mật khẩu cần ít nhất 8 ký tự.");
  });

  it("mật khẩu dài hơn 72 ký tự bị từ chối (giới hạn bcrypt)", () => {
    const long = "a".repeat(73);
    expect(validateRegister({ ...validRegister, password: long, confirm: long }).password).toBe(
      "Mật khẩu tối đa 72 ký tự.",
    );
  });

  it("mật khẩu nhập lại phải khớp", () => {
    expect(validateRegister({ ...validRegister, confirm: "khac" }).confirm).toBe(
      "Mật khẩu nhập lại chưa khớp.",
    );
  });
});

describe("safeNextPath", () => {
  it("giữ nguyên đường dẫn nội bộ", () => {
    expect(safeNextPath("/")).toBe("/");
    expect(safeNextPath("/orders?id=1")).toBe("/orders?id=1");
  });

  it("dùng đường dẫn mặc định khi thiếu giá trị", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined, "/menu")).toBe("/menu");
  });

  it("chặn chuyển hướng ra ngoài website", () => {
    expect(safeNextPath("https://trang-la.com")).toBe("/");
    expect(safeNextPath("//trang-la.com")).toBe("/");
    expect(safeNextPath("/\\trang-la.com")).toBe("/");
  });

  it("không quay lại trang đăng nhập/đăng ký", () => {
    expect(safeNextPath("/login")).toBe("/");
    expect(safeNextPath("/register?next=/")).toBe("/");
  });
});
