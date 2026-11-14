// Kiểm tra dữ liệu ở frontend (NFR-06). Quy tắc khớp với DTO của API (apps/api/src/auth/auth.dto.ts):
// email hợp lệ, mật khẩu tối đa 72 ký tự (giới hạn của bcrypt), họ tên 1–100 ký tự.
// Mật khẩu tối thiểu 8 ký tự theo FR-14 (DTO chỉ yêu cầu 6, nên 8 luôn hợp lệ với API).

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_NAME_LENGTH = 100;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthFormValues {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
}

export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

function checkEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "Vui lòng nhập email.";
  if (!EMAIL_RE.test(value)) return "Email chưa đúng định dạng (ví dụ: ten@email.com).";
  return undefined;
}

export function validateLogin(
  v: Pick<AuthFormValues, "email" | "password">,
): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const emailError = checkEmail(v.email);
  if (emailError) errors.email = emailError;
  // Khi đăng nhập chỉ cần có mật khẩu; độ dài do máy chủ kiểm tra.
  if (!v.password) errors.password = "Vui lòng nhập mật khẩu.";
  return errors;
}

export function validateRegister(v: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const name = v.fullName.trim();
  if (!name) errors.fullName = "Vui lòng nhập họ và tên.";
  else if (name.length > MAX_NAME_LENGTH) errors.fullName = `Họ và tên tối đa ${MAX_NAME_LENGTH} ký tự.`;

  const emailError = checkEmail(v.email);
  if (emailError) errors.email = emailError;

  if (!v.password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (v.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  else if (v.password.length > MAX_PASSWORD_LENGTH)
    errors.password = `Mật khẩu tối đa ${MAX_PASSWORD_LENGTH} ký tự.`;

  if (!v.confirm) errors.confirm = "Vui lòng nhập lại mật khẩu.";
  else if (v.confirm !== v.password) errors.confirm = "Mật khẩu nhập lại chưa khớp.";

  return errors;
}

/**
 * Chỉ cho phép quay lại đường dẫn nội bộ của chính website (tránh open redirect,
 * ví dụ ?next=https://trang-la.com hoặc ?next=//trang-la.com). Không quay lại trang đăng nhập/đăng ký.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/^\/(login|register)(\/|\?|#|$)/.test(next)) return fallback;
  return next;
}
