import Layout from "../components/Layout.tsx";
import CheckoutForm from "../islands/CheckoutForm.tsx";

export default function CheckoutPage() {
  return (
    <Layout>
      <div class="max-w-6xl mx-auto px-6 py-16">
        <h1 class="font-display text-3xl md:text-4xl font-light tracking-wide mb-12">
          Thanh Toán
        </h1>
        <CheckoutForm />
      </div>
    </Layout>
  );
}
