import { beforeEach, describe, expect, it } from "vitest";
import { clearSession, getStoredUser, getToken, isSessionActive, saveSession } from "./auth";

const user = { id: 1, email: "a@b.com", fullName: "Nguyễn Văn A", role: "CUSTOMER" as const };

// JWT giả chỉ cần payload có `exp` (giây); chữ ký không được kiểm tra ở client.
const tokenExpiringAt = (expSeconds: number) =>
  `header.${btoa(JSON.stringify({ sub: 1, exp: expSeconds }))}.signature`;
const nowSeconds = () => Math.floor(Date.now() / 1000);

describe("utils/auth: phiên đăng nhập (FR-16, FR-18)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("chưa đăng nhập thì không có phiên", () => {
    expect(getStoredUser()).toBeNull();
    expect(getToken()).toBeNull();
    expect(isSessionActive()).toBe(false);
  });

  it("saveSession lưu token và người dùng, isSessionActive trả true", () => {
    saveSession({ accessToken: "opaque-token", user });

    expect(getToken()).toBe("opaque-token");
    expect(getStoredUser()).toEqual(user);
    expect(isSessionActive()).toBe(true);
  });

  it("token còn hạn thì phiên còn dùng được", () => {
    saveSession({ accessToken: tokenExpiringAt(nowSeconds() + 3600), user });
    expect(isSessionActive()).toBe(true);
  });

  it("token đã hết hạn thì phiên không còn dùng được", () => {
    saveSession({ accessToken: tokenExpiringAt(nowSeconds() - 60), user });
    expect(isSessionActive()).toBe(false);
  });

  it("có token nhưng thiếu thông tin người dùng thì không tính là đã đăng nhập", () => {
    localStorage.setItem("brewlite_token", "opaque-token");
    expect(isSessionActive()).toBe(false);
  });

  it("clearSession (đăng xuất) xóa token và người dùng", () => {
    saveSession({ accessToken: "opaque-token", user });

    clearSession();

    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
    expect(isSessionActive()).toBe(false);
  });
});
