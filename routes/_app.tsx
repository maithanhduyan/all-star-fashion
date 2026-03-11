import { type PageProps } from "$fresh/server.ts";
import type { AppState } from "./_middleware.ts";

export default function App({ Component, state, url }: PageProps<unknown, AppState>) {
  const user = state?.user ?? null;
  const origin = url.protocol === "http:" && url.hostname !== "localhost"
    ? `https://${url.host}`
    : url.origin;
  return (
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>All Star Fashion - Thời Trang Cao Cấp</title>
        <meta
          name="description"
          content="All Star Fashion - Website chuyên bán quần áo thời trang nam nữ cao cấp, đa dạng mẫu mã, chất lượng hàng đầu."
        />
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.svg" />
        {/* Open Graph / SEO */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="All Star Fashion - Thời Trang Cao Cấp" />
        <meta property="og:description" content="Thời trang cao cấp cho người Việt hiện đại. Chất lượng, phong cách, và sự tinh tế trong từng sản phẩm." />
        <meta property="og:image" content={`${origin}/images/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${origin}/`} />
        <meta property="og:site_name" content="All Star Fashion" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="All Star Fashion - Thời Trang Cao Cấp" />
        <meta name="twitter:description" content="Thời trang cao cấp cho người Việt hiện đại." />
        <meta name="twitter:image" content={`${origin}/images/og-image.png`} />
        <meta name="theme-color" content="#111111" />
        <meta name="view-transition" content="same-origin" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="font-sans text-brand-black bg-brand-white antialiased">
        {/* Pass user info as a data attribute for islands to read */}
        <script
          id="__user"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(user ? { name: user.name, email: user.email, role: user.role } : null),
          }}
        />
        <Component />
      </body>
    </html>
  );
}
