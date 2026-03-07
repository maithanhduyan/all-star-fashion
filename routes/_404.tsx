import Layout from "../components/Layout.tsx";

export default function NotFoundPage() {
  return (
    <Layout>
      <div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 class="font-display text-6xl md:text-8xl font-light tracking-wide mb-4">
          404
        </h1>
        <p class="text-lg font-light tracking-wide mb-2">
          Trang Không Tìm Thấy
        </p>
        <p class="text-sm text-brand-gray mb-8 max-w-md">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di
          chuyển.
        </p>
        <a
          href="/"
          class="inline-block bg-brand-black text-white px-8 py-4 text-sm tracking-extra-wide uppercase hover:opacity-80 transition-opacity"
        >
          Về Trang Chủ
        </a>
      </div>
    </Layout>
  );
}
