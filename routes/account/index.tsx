import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import Layout from "../../components/Layout.tsx";
import { getUserAddresses } from "../../lib/services/auth.service.ts";
import type { UserAddress } from "../../lib/services/auth.service.ts";
import AccountProfile from "../../islands/AccountProfile.tsx";

interface AccountData {
  name: string;
  email: string;
  phone: string | null;
  role: string;
  addresses: UserAddress[];
}

export const handler: Handlers<AccountData, AppState> = {
  async GET(_req, ctx) {
    const user = ctx.state.user!;
    const addresses = await getUserAddresses(user.id);
    return ctx.render({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses,
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
        <AccountProfile
          user={{ name: data.name, email: data.email, phone: data.phone, role: data.role }}
          addresses={data.addresses}
        />
      </div>
    </Layout>
  );
}
