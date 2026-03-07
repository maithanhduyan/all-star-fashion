import Layout from "../components/Layout.tsx";

export default function AboutPage() {
  return (
    <Layout>
      {/* Hero */}
      <section class="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=800&fit=crop"
          alt="All Star Fashion Store"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/40" />
        <div class="relative h-full flex flex-col items-center justify-center text-center text-white px-6">
          <h1 class="font-display text-4xl md:text-5xl font-light tracking-wide mb-4">
            Về Chúng Tôi
          </h1>
          <p class="text-sm tracking-wider max-w-lg opacity-90">
            Câu chuyện đằng sau thương hiệu All Star Fashion
          </p>
        </div>
      </section>

      {/* Story */}
      <section class="max-w-3xl mx-auto px-6 py-20 text-center reveal">
        <h2 class="font-display text-3xl font-light tracking-wide mb-8">
          Câu Chuyện Của Chúng Tôi
        </h2>
        <p class="text-sm text-brand-gray leading-relaxed mb-6">
          All Star Fashion được thành lập với sứ mệnh mang đến cho người Việt
          những sản phẩm thời trang cao cấp với thiết kế tối giản, chất lượng
          vượt trội và giá cả hợp lý. Chúng tôi tin rằng phong cách không cần
          phải đánh đổi bằng sự thoải mái.
        </p>
        <p class="text-sm text-brand-gray leading-relaxed mb-6">
          Mỗi sản phẩm đều được tuyển chọn kỹ lưỡng về chất liệu và thiết kế,
          lấy cảm hứng từ xu hướng thời trang quốc tế nhưng phù hợp với gu
          thẩm mỹ và khí hậu Việt Nam.
        </p>
        <p class="text-sm text-brand-gray leading-relaxed">
          Từ những chiếc áo thun basic đến những bộ suit lịch lãm, All Star
          Fashion cam kết đồng hành cùng bạn trong hành trình định nghĩa phong
          cách riêng của mình.
        </p>
      </section>

      {/* Values */}
      <section class="bg-brand-beige">
        <div class="max-w-5xl mx-auto px-6 py-20">
          <h2 class="font-display text-3xl font-light tracking-wide text-center mb-12">
            Giá Trị Cốt Lõi
          </h2>
          <div class="grid md:grid-cols-3 gap-12 reveal-stagger">
            <div class="text-center reveal">
              <h3 class="text-sm tracking-wider uppercase mb-4">Chất Lượng</h3>
              <p class="text-sm text-brand-gray leading-relaxed">
                Chúng tôi chỉ sử dụng những chất liệu tốt nhất, được kiểm
                định nghiêm ngặt để đảm bảo độ bền và sự thoải mái cho người
                mặc.
              </p>
            </div>
            <div class="text-center reveal">
              <h3 class="text-sm tracking-wider uppercase mb-4">
                Thiết Kế Tối Giản
              </h3>
              <p class="text-sm text-brand-gray leading-relaxed">
                Less is more. Những thiết kế clean, timeless giúp bạn tự tin
                trong mọi hoàn cảnh mà không bao giờ lỗi thời.
              </p>
            </div>
            <div class="text-center reveal">
              <h3 class="text-sm tracking-wider uppercase mb-4">Bền Vững</h3>
              <p class="text-sm text-brand-gray leading-relaxed">
                Chúng tôi hướng đến thời trang bền vững, giảm thiểu tác động
                môi trường trong mọi khâu từ sản xuất đến đóng gói.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section class="max-w-3xl mx-auto px-6 py-20 text-center reveal">
        <h2 class="font-display text-3xl font-light tracking-wide mb-8">
          Liên Hệ
        </h2>
        <div class="grid md:grid-cols-3 gap-8 text-sm text-brand-gray">
          <div>
            <h4 class="text-brand-black tracking-wider uppercase mb-2">
              Email
            </h4>
            <p>support@allstarfashion.com</p>
          </div>
          <div>
            <h4 class="text-brand-black tracking-wider uppercase mb-2">
              Điện Thoại
            </h4>
            <p>0123-456-789</p>
          </div>
          <div>
            <h4 class="text-brand-black tracking-wider uppercase mb-2">
              Địa Chỉ
            </h4>
            <p>123 Đường Thời Trang, Q.1, TP.HCM</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
