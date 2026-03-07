import { useState, useEffect, useRef } from "preact/hooks";

interface User {
  name: string;
  email: string;
  role: string;
}

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const el = document.getElementById("__user");
      if (el?.textContent) {
        const data = JSON.parse(el.textContent);
        if (data) setUser(data);
      }
    } catch { /* not logged in */ }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    globalThis.location.href = "/";
  };

  // Not logged in — show login link
  if (!user) {
    return (
      <a
        href="/auth/login"
        class="hover:text-brand-gray transition-colors duration-300"
        title="Đăng nhập"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </a>
    );
  }

  // Logged in — show dropdown
  return (
    <div ref={menuRef} class="relative">
      <button
        onClick={() => setOpen(!open)}
        class="flex items-center gap-1.5 hover:text-brand-gray transition-colors duration-300"
        title={user.name}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <span class="hidden md:inline text-xs tracking-wide max-w-[80px] truncate">
          {user.name}
        </span>
      </button>

      {open && (
        <div class="absolute right-0 top-full mt-2 w-52 bg-white border border-brand-light-gray shadow-lg z-50">
          <div class="px-4 py-3 border-b border-brand-light-gray">
            <p class="text-sm font-medium truncate">{user.name}</p>
            <p class="text-xs text-brand-gray truncate">{user.email}</p>
          </div>
          <div class="py-1">
            <a
              href="/account"
              class="block px-4 py-2 text-sm hover:bg-brand-beige transition-colors"
            >
              Tài khoản
            </a>
            <a
              href="/account/orders"
              class="block px-4 py-2 text-sm hover:bg-brand-beige transition-colors"
            >
              Đơn hàng
            </a>
            {user.role === "admin" && (
              <a
                href="/admin"
                class="block px-4 py-2 text-sm hover:bg-brand-beige transition-colors text-blue-700"
              >
                Quản trị
              </a>
            )}
          </div>
          <div class="border-t border-brand-light-gray py-1">
            <button
              onClick={handleLogout}
              class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
