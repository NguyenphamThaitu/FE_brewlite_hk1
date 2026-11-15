import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Đăng ký | BrewLite",
};

export default function RegisterPage() {
  // AuthForm đọc ?next= bằng useSearchParams nên cần bọc trong Suspense
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
