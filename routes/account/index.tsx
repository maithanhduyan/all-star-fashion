import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import Layout from "../../components/Layout.tsx";

interface AccountData {
  name: string;
  email: string;
  role: string;
}

export const handler: Handlers<AccountData, AppState> = {
  GET(_req, ctx) {
    const user = ctx.state.user!;
    return ctx.render({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  },
};

export default function AccountPage({ data }: PageProps<AccountData>) {
  return (
    <Layout>
      <div class="max-w-3xl mx-auto px-6 py-16">
        <h1 class="font-display text-3xl font-light tracking-wide mb-10">
          Tài Khoản
        </h1>

        <div class="grid gap-6">
          {/* Profile card */}
          <div class="border border-brand-light-gray p-6">
            <h2 class="text-sm tracking-wider uppercase mb-4">Thông Tin Cá Nhân</h2>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-brand-gray">Họ tên</span>
                <span>{data.name}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-gray">Email</span>
                <span>{data.email}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-gray">Loại tài khoản</span>
                <span class="capitalize">{data.role}</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div class="grid sm:grid-cols-2 gap-4">
            <a
              href="/account/orders"
              class="border border-brand-light-gray p-6 hover:border-brand-black transition-colors group"
            >
              <h3 class="text-sm tracking-wider uppercase mb-2 group-hover:underline">Đơn Hàng</h3>
              <p class="text-xs text-brand-gray">Xem lịch sử đặt hàng</p>
            </a>
            <a
              href="/shop"
              class="border border-brand-light-gray p-6 hover:border-brand-black transition-colors group"
            >
              <h3 class="text-sm tracking-wider uppercase mb-2 group-hover:underline">Mua Sắm</h3>
              <p class="text-xs text-brand-gray">Khám phá sản phẩm mới</p>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
