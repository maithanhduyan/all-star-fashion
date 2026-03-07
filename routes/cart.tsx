import Layout from "../components/Layout.tsx";
import CartView from "../islands/CartView.tsx";

export default function CartPage() {
  return (
    <Layout>
      <div class="max-w-5xl mx-auto px-6 py-16">
        <h1 class="font-display text-3xl md:text-4xl font-light tracking-wide mb-12">
          Giỏ Hàng
        </h1>

        <CartView />
      </div>
    </Layout>
  );
}
