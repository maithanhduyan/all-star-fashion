import { useEffect, useRef, useState } from "preact/hooks";

const popularSearches = [
  "Áo khoác",
  "Váy đầm",
  "Quần jeans",
  "Áo thun",
  "Phụ kiện",
  "Giày dép",
];

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for global search trigger
  useEffect(() => {
    const handler = () => openModal();
    globalThis.addEventListener("open-search", handler);
    return () => globalThis.removeEventListener("open-search", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openModal();
      }
      if (e.key === "Escape" && open) {
        closeModal();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const openModal = () => {
    setOpen(true);
    setClosing(false);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (query.trim()) {
      globalThis.location.href = `/shop?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const handleQuickSearch = (term: string) => {
    globalThis.location.href = `/shop?q=${encodeURIComponent(term)}`;
  };

  return (
    <>
      {/* Trigger button – always visible in navbar */}
      <button
        onClick={openModal}
        class="hover:text-brand-gray transition-colors duration-300"
        aria-label="Tìm kiếm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Search modal overlay */}
      {open && (
        <div
          class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={(e: Event) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* Backdrop */}
          <div
            class={`absolute inset-0 bg-black/50 ${
              closing ? "animate-toast-out" : "animate-fade-in"
            }`}
          />

          {/* Modal */}
          <div
            class={`relative bg-white w-full max-w-lg rounded-sm shadow-2xl ${
              closing ? "animate-toast-out" : "animate-modal-in"
            }`}
          >
            {/* Search input */}
            <form onSubmit={handleSubmit} class="relative">
              <div class="flex items-center border-b border-brand-light-gray">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 ml-5 text-brand-gray flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  class="flex-1 px-4 py-5 text-sm focus:outline-none bg-transparent"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={closeModal}
                  class="mr-4 px-2 py-1 text-[10px] tracking-wide text-brand-gray border border-brand-light-gray rounded hover:border-brand-black hover:text-brand-black transition-colors"
                >
                  ESC
                </button>
              </div>
            </form>

            {/* Content */}
            <div class="p-6">
              {/* Popular searches */}
              <div>
                <p class="text-xs tracking-wider uppercase text-brand-gray mb-3">
                  Tìm kiếm phổ biến
                </p>
                <div class="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleQuickSearch(term)}
                      class="px-4 py-2 bg-brand-beige/60 text-sm tracking-wide hover:bg-brand-beige transition-colors rounded-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div class="mt-6 pt-5 border-t border-brand-light-gray">
                <p class="text-xs tracking-wider uppercase text-brand-gray mb-3">
                  Truy cập nhanh
                </p>
                <div class="space-y-1">
                  <a
                    href="/shop"
                    class="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-brand-beige/40 transition-colors rounded-sm group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-gray group-hover:text-brand-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span>Tất cả sản phẩm</span>
                  </a>
                  <a
                    href="/shop?category=vay-dam"
                    class="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-brand-beige/40 transition-colors rounded-sm group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-gray group-hover:text-brand-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>Váy Đầm mới nhất</span>
                  </a>
                  <a
                    href="/shop?category=ao-khoac"
                    class="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-brand-beige/40 transition-colors rounded-sm group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-gray group-hover:text-brand-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                    <span>Áo Khoác hot</span>
                  </a>
                </div>
              </div>

              {/* Keyboard hint */}
              <div class="mt-5 pt-4 border-t border-brand-light-gray flex items-center justify-center gap-4 text-[11px] text-brand-gray">
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 border border-brand-light-gray rounded text-[10px]">↵</kbd>
                  để tìm kiếm
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 border border-brand-light-gray rounded text-[10px]">ESC</kbd>
                  để đóng
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
