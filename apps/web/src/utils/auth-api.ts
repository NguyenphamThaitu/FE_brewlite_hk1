import type { AuthSession } from "@/utils/auth";
import type { AuthFormValues } from "@/utils/auth-validation";

// NEXT_PUBLIC_API_URL được nhúng lúc build (xem apps/web/Dockerfile và .env.example).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Lỗi HTTP từ API. `messages` lấy từ trường `message` của NestJS (chuỗi hoặc mảng chuỗi). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly messages: string[],
  ) {
    super(messages[0] ?? `HTTP ${status}`);
    this.name = "ApiError";
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // phản hồi không phải JSON – bỏ qua, dùng mã trạng thái để báo lỗi
  }

  if (!res.ok) {
    const raw = (data as { message?: unknown } | null)?.message;
    const messages = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
    throw new ApiError(res.status, messages);
  }
  return data as T;
}

// API dùng ValidationPipe({ forbidNonWhitelisted: true }): chỉ gửi đúng các trường dưới đây.
export const loginRequest = (v: Pick<AuthFormValues, "email" | "password">) =>
  post<AuthSession>("/auth/login", { email: v.email, password: v.password });

export const registerRequest = (v: Pick<AuthFormValues, "fullName" | "email" | "password">) =>
  post<AuthSession>("/auth/register", {
    fullName: v.fullName,
    email: v.email,
    password: v.password,
  });

export type ServerFieldErrors = Partial<Record<"fullName" | "email" | "password", string>>;

export interface DescribedError {
  /** Lỗi gắn với từng ô nhập (FR-14) */
  fields: ServerFieldErrors;
  /** Lỗi chung của cả form */
  form?: string;
}

/** Chuyển lỗi từ API/mạng thành thông báo tiếng Việt dễ hiểu cho người dùng. */
export function describeAuthError(err: unknown): DescribedError {
  if (!(err instanceof ApiError)) {
    return { fields: {}, form: "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng rồi thử lại." };
  }

  switch (err.status) {
    case 401:
      // FR-15: không tiết lộ email hay mật khẩu sai
      return { fields: {}, form: "Email hoặc mật khẩu không đúng. Vui lòng thử lại." };
    case 409:
      return {
        fields: { email: "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác." },
      };
    case 429:
      // NFR-09: giới hạn số lần đăng nhập sai
      return { fields: {}, form: "Bạn đã thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại." };
    case 400: {
      const fields: ServerFieldErrors = {};
      let form: string | undefined;
      for (const message of err.messages) {
        const m = message.toLowerCase();
        if (m.includes("email")) fields.email ??= message;
        else if (m.includes("mật khẩu") || m.includes("password")) fields.password ??= message;
        else if (m.includes("họ tên") || m.includes("fullname")) fields.fullName ??= message;
        else form ??= message;
      }
      if (!form && Object.keys(fields).length === 0) form = "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.";
      return { fields, form };
    }
    default:
      return { fields: {}, form: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút." };
  }
}
