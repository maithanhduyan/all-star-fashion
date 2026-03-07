interface HeroProps {
  title: string;
  subtitle?: string;
  image: string;
  cta?: {
    text: string;
    href: string;
  };
  overlay?: boolean;
}

export default function Hero(
  { title, subtitle, image, cta, overlay = true }: HeroProps,
) {
  return (
    <section class="relative h-[85vh] min-h-[600px] overflow-hidden">
      <img
        src={image}
        alt={title}
        class="absolute inset-0 w-full h-full object-cover"
      />
      {overlay && (
        <div class="absolute inset-0 bg-black/30" />
      )}
      <div class="relative h-full flex flex-col items-center justify-center text-center text-white px-6">
        <h2 class="font-display text-4xl md:text-6xl lg:text-7xl font-light tracking-wide mb-4 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p class="text-sm md:text-base tracking-wider max-w-lg mx-auto mb-8 font-light opacity-90">
            {subtitle}
          </p>
        )}
        {cta && (
          <a
            href={cta.href}
            class="inline-block border border-white px-10 py-4 text-sm tracking-extra-wide uppercase hover:bg-white hover:text-brand-black transition-all duration-300"
          >
            {cta.text}
          </a>
        )}
      </div>
    </section>
  );
}
