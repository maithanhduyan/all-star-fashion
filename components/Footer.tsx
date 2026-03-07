export default function Footer() {
  return (
    <footer class="bg-brand-black text-white">
      {/* Newsletter */}
      <div class="border-b border-white/10">
        <div class="max-w-7xl mx-auto px-6 py-16 text-center">
          <h3 class="font-display text-2xl md:text-3xl mb-3">
            Đăng Ký Nhận Tin
          </h3>
          <p class="text-sm text-white/60 mb-8 max-w-md mx-auto">
            Nhận thông tin về bộ sưu tập mới và ưu đãi đặc biệt từ All Star
            Fashion.
          </p>
          <form class="flex max-w-md mx-auto gap-0">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              class="flex-1 bg-transparent border border-white/30 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-white transition-colors"
            />
            <button
              type="submit"
              class="bg-white text-brand-black px-6 py-3 text-sm tracking-wider uppercase hover:bg-white/90 transition-colors"
            >
              Đăng Ký
            </button>
          </form>
        </div>
      </div>

      {/* Footer links */}
      <div class="max-w-7xl mx-auto px-6 py-16">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <img src="/logo.svg" alt="All Star Fashion" class="h-10 w-auto brightness-0 invert mb-4" />
            <p class="text-sm text-white/60 leading-relaxed">
              Thời trang cao cấp cho người Việt hiện đại. Chất lượng, phong
              cách, và sự tinh tế trong từng sản phẩm.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h5 class="text-sm tracking-wider uppercase mb-6">Cửa Hàng</h5>
            <ul class="space-y-3">
              <li>
                <a
                  href="/shop?category=ao-thun"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Áo Thun
                </a>
              </li>
              <li>
                <a
                  href="/shop?category=vay-dam"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Váy Đầm
                </a>
              </li>
              <li>
                <a
                  href="/shop?category=quan-jeans"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Quần Jeans
                </a>
              </li>
              <li>
                <a
                  href="/shop?category=ao-khoac"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Áo Khoác
                </a>
              </li>
              <li>
                <a
                  href="/shop?category=phu-kien"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Phụ Kiện
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h5 class="text-sm tracking-wider uppercase mb-6">Thông Tin</h5>
            <ul class="space-y-3">
              <li>
                <a
                  href="/about"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Giới Thiệu
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Chính Sách Đổi Trả
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Hướng Dẫn Chọn Size
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Câu Hỏi Thường Gặp
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 class="text-sm tracking-wider uppercase mb-6">Liên Hệ</h5>
            <ul class="space-y-3 text-sm text-white/60">
              <li>Email: support@allstarfashion.com</li>
              <li>Điện thoại: 0123-456-789</li>
              <li>Địa chỉ: 123 Đường Thời Trang, Q.1, TP.HCM</li>
            </ul>
            <div class="flex gap-4 mt-6">
              <a
                href="https://facebook.com/allstarfashion"
                aria-label="Facebook"
                class="text-white/40 hover:text-white transition-colors"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/allstarfashion"
                aria-label="Instagram"
                class="text-white/40 hover:text-white transition-colors"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div class="border-t border-white/10 mt-12 pt-8 text-center text-xs text-white/40">
          <p>&copy; 2026 All Star Fashion. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
