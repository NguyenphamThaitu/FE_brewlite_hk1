import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Đăng nhập | BrewLite",
};

export default function LoginPage() {
  // AuthForm đọc ?next= bằng useSearchParams nên cần bọc trong Suspense
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
