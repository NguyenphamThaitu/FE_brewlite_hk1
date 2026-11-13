"use client";

import { FormEvent, ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Coffee, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { getStoredUser, saveSession, subscribeAuth } from "@/utils/auth";
import { describeAuthError, loginRequest, registerRequest } from "@/utils/auth-api";
import {
  AuthFormErrors,
  AuthFormValues,
  MIN_PASSWORD_LENGTH,
  safeNextPath,
  validateLogin,
  validateRegister,
} from "@/utils/auth-validation";

type Mode = "login" | "register";

const FIELD_ORDER: (keyof AuthFormValues)[] = ["fullName", "email", "password", "confirm"];

// Giao diện lấy cảm hứng từ Highlands Coffee: đỏ đậm #a6192e + nền kem ấm #FAF8F5

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: "text" | "email" | "password";
  error?: string;
  hint?: string;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
}

function Field({
  id, label, value, onChange, icon, type = "text", error, hint, autoComplete, placeholder, disabled,
}: FieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-neutral-800">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-xl border bg-white pl-11 ${isPassword ? "pr-12" : "pr-4"} text-base text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-[#a6192e] focus:ring-4 focus:ring-[#a6192e]/15 disabled:bg-neutral-100 ${error ? "border-red-500" : "border-neutral-300"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={visible}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500 transition hover:text-[#a6192e]"
          >
            {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const params = useSearchParams();

  // ?next=/duong-dan: quay lại sau khi đăng nhập (FR-18). ?reason=checkout: hiện lời nhắn khi đặt đơn.
  const next = safeNextPath(params.get("next"));
  const fromCheckout = params.get("reason") === "checkout";
  const query = params.toString();
  const suffix = query ? `?${query}` : "";

  const user = useSyncExternalStore(subscribeAuth, getStoredUser, () => null);

  const [values, setValues] = useState<AuthFormValues>({
    fullName: "", email: "", password: "", confirm: "",
  });
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Đã có phiên (vừa đăng nhập/đăng ký xong, hoặc mở trang khi đã đăng nhập) → chuyển đi
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const setValue = (key: keyof AuthFormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const focusFirstInvalid = (found: AuthFormErrors) => {
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) document.getElementById(`${mode}-${first}`)?.focus();
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const clean: AuthFormValues = {
      ...values,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
    };
    const found = isRegister ? validateRegister(clean) : validateLogin(clean);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found);
      return;
    }

    setSubmitting(true);
    try {
      const session = isRegister
        ? await registerRequest(clean)
        : await loginRequest(clean);
      saveSession(session); // useEffect phía trên sẽ chuyển trang
    } catch (err) {
      const { fields, form } = describeAuthError(err);
      setErrors(fields);
      setFormError(form ?? "");
      setSubmitting(false);
      focusFirstInvalid(fields);
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-xl px-4 py-2.5 text-center transition ${
      active ? "bg-[#a6192e] text-white shadow-sm" : "text-neutral-600 hover:text-[#a6192e]"
    }`;

  return (
    <div lang="vi" className="min-h-screen bg-[#FAF8F5] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Khung thương hiệu */}
      <aside className="bg-gradient-to-br from-[#b81d33] to-[#7d1020] px-6 py-6 text-white lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-16">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="BrewLite – về trang chủ">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <Coffee className="h-6 w-6" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight">BrewLite</span>
        </Link>

        <div className="hidden lg:block">
          <h2 className="mt-12 text-4xl font-extrabold leading-tight">
            Cà phê đậm vị,
            <br />
            đặt món thật nhanh.
          </h2>
          <ul className="mt-8 space-y-4 text-base text-white/90">
            {[
              "Đặt món và thanh toán không cần tiền mặt",
              "Theo dõi trạng thái đơn hàng của bạn",
              "Giỏ hàng luôn được giữ nguyên khi đăng nhập",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/20">
                  <Check className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-start justify-center px-4 py-8 sm:px-8 lg:items-center">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl shadow-red-900/5 sm:p-8">
          <nav
            aria-label="Chọn đăng nhập hoặc đăng ký"
            className="grid grid-cols-2 gap-1 rounded-2xl bg-[#FAF8F5] p-1 text-sm font-bold"
          >
            <Link href={`/login${suffix}`} aria-current={!isRegister ? "page" : undefined} className={tabClass(!isRegister)}>
              Đăng nhập
            </Link>
            <Link href={`/register${suffix}`} aria-current={isRegister ? "page" : undefined} className={tabClass(isRegister)}>
              Đăng ký
            </Link>
          </nav>

          <h1 className="mt-6 text-2xl font-extrabold text-neutral-900">
            {isRegister ? "Tạo tài khoản BrewLite" : "Chào mừng bạn trở lại"}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {isRegister
              ? "Chỉ mất chưa đầy một phút để bắt đầu đặt món."
              : "Đăng nhập để đặt món và theo dõi đơn hàng."}
          </p>

          {fromCheckout && (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              Bạn cần đăng nhập để đặt đơn. Giỏ hàng của bạn vẫn được giữ nguyên.
            </div>
          )}

          {formError && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            {isRegister && (
              <Field
                id="register-fullName"
                label="Họ và tên"
                value={values.fullName}
                onChange={setValue("fullName")}
                icon={<User className="h-5 w-5" />}
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                error={errors.fullName}
                disabled={submitting}
              />
            )}

            <Field
              id={`${mode}-email`}
              label="Email"
              type="email"
              value={values.email}
              onChange={setValue("email")}
              icon={<Mail className="h-5 w-5" />}
              autoComplete="email"
              placeholder="ten@email.com"
              error={errors.email}
              disabled={submitting}
            />

            <Field
              id={`${mode}-password`}
              label="Mật khẩu"
              type="password"
              value={values.password}
              onChange={setValue("password")}
              icon={<Lock className="h-5 w-5" />}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? `Ít nhất ${MIN_PASSWORD_LENGTH} ký tự` : "Nhập mật khẩu"}
              hint={isRegister ? `Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.` : undefined}
              error={errors.password}
              disabled={submitting}
            />

            {isRegister && (
              <Field
                id="register-confirm"
                label="Nhập lại mật khẩu"
                type="password"
                value={values.confirm}
                onChange={setValue("confirm")}
                icon={<Lock className="h-5 w-5" />}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                error={errors.confirm}
                disabled={submitting}
              />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a6192e] text-base font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#861424] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a6192e]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              )}
              {submitting
                ? isRegister ? "Đang tạo tài khoản..." : "Đang đăng nhập..."
                : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-600">
            {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <Link
              href={isRegister ? `/login${suffix}` : `/register${suffix}`}
              className="font-bold text-[#a6192e] hover:underline"
            >
              {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
            </Link>
          </p>

          <p className="mt-3 text-center text-sm">
            <Link href="/" className="text-neutral-500 hover:text-[#a6192e] hover:underline">
              ← Tiếp tục xem thực đơn
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
