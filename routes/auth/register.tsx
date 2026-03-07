import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import Layout from "../../components/Layout.tsx";
import RegisterForm from "../../islands/RegisterForm.tsx";

export const handler: Handlers<unknown, AppState> = {
  GET(req, ctx) {
    // If already logged in, redirect to home
    if (ctx.state.user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }
    return ctx.render();
  },
};

export default function RegisterPage() {
  return (
    <Layout>
      <div class="max-w-md mx-auto px-6 py-20">
        <div class="text-center mb-10">
          <h1 class="font-display text-3xl font-light tracking-wide mb-2">
            Tạo Tài Khoản
          </h1>
          <p class="text-sm text-brand-gray">
            Đăng ký để đặt hàng nhanh hơn
          </p>
        </div>
        <RegisterForm />
      </div>
    </Layout>
  );
}
