// Lưu phiên đăng nhập phía trình duyệt (ADR-004: JWT stateless, đăng xuất = xóa token phía client).
// Cùng phong cách với utils/cart.ts: localStorage + sự kiện tùy chỉnh để các component tự cập nhật.

export type UserRole = "CUSTOMER" | "STAFF";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
}

/** Dữ liệu API trả về cho POST /auth/login và POST /auth/register */
export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

const TOKEN_KEY = "brewlite_token";
const USER_KEY = "brewlite_user";
const AUTH_EVENT = "brewlite_auth_updated";

// useSyncExternalStore yêu cầu getSnapshot trả về CÙNG một tham chiếu khi dữ liệu không đổi,
// nên cache kết quả parse theo chuỗi gốc trong localStorage.
let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw === cachedRaw) return cachedUser;
    cachedRaw = raw;
    cachedUser = raw ? (JSON.parse(raw) as AuthUser) : null;
    return cachedUser;
  } catch {
    cachedRaw = null;
    cachedUser = null;
    return null;
  }
};

/** Token dùng cho header `Authorization: Bearer <token>` khi gọi API cần đăng nhập */
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveSession = (session: AuthSession): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch (error) {
    console.error("Lỗi khi lưu phiên đăng nhập:", error);
  }
};

/** Đăng xuất (FR-16): chỉ cần xóa token phía client. Giỏ hàng được giữ nguyên. */
export const clearSession = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch (error) {
    console.error("Lỗi khi xóa phiên đăng nhập:", error);
  }
};

export const subscribeAuth = (callback: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};
