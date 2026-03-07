import { useState, useRef } from "preact/hooks";

export default function RegisterForm() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const fd = new FormData(formRef.current!);
    const password = fd.get("password") as string;
    const confirmPassword = fd.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setSubmitting(false);
      return;
    }

    const body = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      password,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng ký thất bại");
        setSubmitting(false);
        return;
      }

      // Auto-login after register
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: body.email, password: body.password }),
      });

      if (loginRes.ok) {
        globalThis.location.href = "/";
      } else {
        globalThis.location.href = "/auth/login";
      }
    } catch {
      setError("Không thể kết nối server");
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} class="space-y-6">
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label class="block text-xs tracking-wider uppercase mb-2">Họ và tên</label>
        <input
          type="text"
          name="name"
          required
          class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
          placeholder="Nguyễn Văn A"
        />
      </div>

      <div>
        <label class="block text-xs tracking-wider uppercase mb-2">Email</label>
        <input
          type="email"
          name="email"
          required
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
          class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
          placeholder="Tối thiểu 8 ký tự"
        />
      </div>

      <div>
        <label class="block text-xs tracking-wider uppercase mb-2">Xác nhận mật khẩu</label>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
          placeholder="Nhập lại mật khẩu"
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
        {submitting ? "Đang xử lý..." : "Đăng Ký"}
      </button>

      <p class="text-center text-sm text-brand-gray">
        Đã có tài khoản?{" "}
        <a href="/auth/login" class="text-brand-black underline hover:no-underline">
          Đăng nhập
        </a>
      </p>
    </form>
  );
}
