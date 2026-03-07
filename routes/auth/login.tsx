import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import Layout from "../../components/Layout.tsx";
import LoginForm from "../../islands/LoginForm.tsx";

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

export default function LoginPage() {
  return (
    <Layout>
      <div class="max-w-md mx-auto px-6 py-20">
        <div class="text-center mb-10">
          <h1 class="font-display text-3xl font-light tracking-wide mb-2">
            Đăng Nhập
          </h1>
          <p class="text-sm text-brand-gray">
            Chào mừng bạn trở lại
          </p>
        </div>
        <LoginForm />
      </div>
    </Layout>
  );
}
