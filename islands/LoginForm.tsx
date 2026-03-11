import { useState } from "preact/hooks";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại");
        setSubmitting(false);
        return;
      }

      // Redirect to home or previous page
      const params = new URLSearchParams(globalThis.location.search);
      const redirect = params.get("redirect") || "/";
      globalThis.location.href = redirect;
    } catch {
      setError("Không thể kết nối server");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label class="block text-xs tracking-wider uppercase mb-2">Email</label>
        <input
          type="email"
          name="email"
          required
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label class="block text-xs tracking-wider uppercase mb-2">Mật khẩu</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        class={`w-full py-4 text-sm tracking-extra-wide uppercase transition-all duration-300 ${
          submitting
            ? "bg-brand-gray text-white cursor-wait"
            : "bg-brand-black text-white hover:opacity-80"
        }`}
      >
        {submitting ? "Đang xử lý..." : "Đăng Nhập"}
      </button>

      <p class="text-center text-sm text-brand-gray">
        Chưa có tài khoản?{" "}
        <a href="/auth/register" class="text-brand-black underline hover:no-underline">
          Đăng ký
        </a>
      </p>
    </form>
  );
}
