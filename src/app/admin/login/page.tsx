import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-xl items-center px-5 py-20">
      <LoginForm />
    </section>
  );
}
