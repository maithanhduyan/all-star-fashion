// islands/AccountProfile.tsx — Profile edit, password change, address management
import { useSignal } from "@preact/signals";

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  isDefault: boolean;
}

interface Props {
  user: { name: string; email: string; phone: string | null; role: string };
  addresses: Address[];
}

export default function AccountProfile({ user, addresses: initialAddresses }: Props) {
  // Profile state
  const name = useSignal(user.name);
  const phone = useSignal(user.phone || "");
  const profileMsg = useSignal("");
  const profileErr = useSignal("");
  const profileLoading = useSignal(false);

  // Password state
  const currentPassword = useSignal("");
  const newPassword = useSignal("");
  const confirmPassword = useSignal("");
  const passwordMsg = useSignal("");
  const passwordErr = useSignal("");
  const passwordLoading = useSignal(false);

  // Address state
  const addresses = useSignal<Address[]>(initialAddresses);
  const showAddressForm = useSignal(false);
  const editingAddress = useSignal<Address | null>(null);
  const addressMsg = useSignal("");
  const addressErr = useSignal("");

  // Address form fields
  const addrLabel = useSignal("Nhà");
  const addrRecipient = useSignal("");
  const addrPhone = useSignal("");
  const addrAddress = useSignal("");
  const addrDistrict = useSignal("");
  const addrCity = useSignal("");
  const addrIsDefault = useSignal(false);

  async function handleProfileSave(e: Event) {
    e.preventDefault();
    profileErr.value = "";
    profileMsg.value = "";
    profileLoading.value = true;
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value,
          phone: phone.value || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật");
      profileMsg.value = "Đã cập nhật thông tin thành công";
    } catch (err) {
      profileErr.value = (err as Error).message;
    } finally {
      profileLoading.value = false;
    }
  }

  async function handlePasswordChange(e: Event) {
    e.preventDefault();
    passwordErr.value = "";
    passwordMsg.value = "";

    if (newPassword.value !== confirmPassword.value) {
      passwordErr.value = "Mật khẩu xác nhận không khớp";
      return;
    }
    if (newPassword.value.length < 8) {
      passwordErr.value = "Mật khẩu mới tối thiểu 8 ký tự";
      return;
    }

    passwordLoading.value = true;
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi đổi mật khẩu");
      passwordMsg.value = "Đã đổi mật khẩu thành công";
      currentPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
    } catch (err) {
      passwordErr.value = (err as Error).message;
    } finally {
      passwordLoading.value = false;
    }
  }

  function resetAddressForm() {
    addrLabel.value = "Nhà";
    addrRecipient.value = "";
    addrPhone.value = "";
    addrAddress.value = "";
    addrDistrict.value = "";
    addrCity.value = "";
    addrIsDefault.value = false;
    editingAddress.value = null;
  }

  function startEditAddress(addr: Address) {
    editingAddress.value = addr;
    addrLabel.value = addr.label;
    addrRecipient.value = addr.recipientName;
    addrPhone.value = addr.phone;
    addrAddress.value = addr.address;
    addrDistrict.value = addr.district;
    addrCity.value = addr.city;
    addrIsDefault.value = addr.isDefault;
    showAddressForm.value = true;
  }

  async function handleAddressSave(e: Event) {
    e.preventDefault();
    addressErr.value = "";
    addressMsg.value = "";

    const payload = {
      label: addrLabel.value,
      recipientName: addrRecipient.value,
      phone: addrPhone.value,
      address: addrAddress.value,
      district: addrDistrict.value,
      city: addrCity.value,
      isDefault: addrIsDefault.value,
    };

    try {
      let res: Response;
      if (editingAddress.value) {
        res = await fetch(`/api/account/addresses/${editingAddress.value.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu địa chỉ");

      // Reload addresses
      const listRes = await fetch("/api/account/addresses");
      const listData = await listRes.json();
      addresses.value = listData.addresses;

      addressMsg.value = editingAddress.value ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ mới";
      showAddressForm.value = false;
      resetAddressForm();
    } catch (err) {
      addressErr.value = (err as Error).message;
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi xóa địa chỉ");
      }
      addresses.value = addresses.value.filter((a) => a.id !== id);
      addressMsg.value = "Đã xóa địa chỉ";
    } catch (err) {
      addressErr.value = (err as Error).message;
    }
  }

  return (
    <div class="grid gap-6">
      {/* Profile card */}
      <div class="border border-brand-light-gray p-6">
        <h2 class="text-sm tracking-wider uppercase mb-4">Thông Tin Cá Nhân</h2>
        <form onSubmit={handleProfileSave} class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-brand-gray mb-1">Họ tên</label>
              <input
                type="text"
                value={name.value}
                onInput={(e) => name.value = (e.target as HTMLInputElement).value}
                class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
              />
            </div>
            <div>
              <label class="block text-xs text-brand-gray mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                class="w-full border border-brand-light-gray px-3 py-2 text-sm bg-gray-50 text-brand-gray"
              />
            </div>
            <div>
              <label class="block text-xs text-brand-gray mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={phone.value}
                onInput={(e) => phone.value = (e.target as HTMLInputElement).value}
                placeholder="0912345678"
                class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
              />
            </div>
            <div>
              <label class="block text-xs text-brand-gray mb-1">Loại tài khoản</label>
              <input
                type="text"
                value={user.role}
                disabled
                class="w-full border border-brand-light-gray px-3 py-2 text-sm bg-gray-50 text-brand-gray capitalize"
              />
            </div>
          </div>
          {profileErr.value && <p class="text-xs text-red-600">{profileErr.value}</p>}
          {profileMsg.value && <p class="text-xs text-green-600">{profileMsg.value}</p>}
          <button
            type="submit"
            disabled={profileLoading.value}
            class="bg-brand-black text-white px-6 py-2 text-sm tracking-wider uppercase hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {profileLoading.value ? "Đang lưu..." : "Lưu Thông Tin"}
          </button>
        </form>
      </div>

      {/* Password change */}
      <div class="border border-brand-light-gray p-6">
        <h2 class="text-sm tracking-wider uppercase mb-4">Đổi Mật Khẩu</h2>
        <form onSubmit={handlePasswordChange} class="space-y-4 max-w-md">
          <div>
            <label class="block text-xs text-brand-gray mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPassword.value}
              onInput={(e) => currentPassword.value = (e.target as HTMLInputElement).value}
              class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
              required
            />
          </div>
          <div>
            <label class="block text-xs text-brand-gray mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword.value}
              onInput={(e) => newPassword.value = (e.target as HTMLInputElement).value}
              class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
              required
              minLength={8}
            />
          </div>
          <div>
            <label class="block text-xs text-brand-gray mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword.value}
              onInput={(e) => confirmPassword.value = (e.target as HTMLInputElement).value}
              class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
              required
              minLength={8}
            />
          </div>
          {passwordErr.value && <p class="text-xs text-red-600">{passwordErr.value}</p>}
          {passwordMsg.value && <p class="text-xs text-green-600">{passwordMsg.value}</p>}
          <button
            type="submit"
            disabled={passwordLoading.value}
            class="bg-brand-black text-white px-6 py-2 text-sm tracking-wider uppercase hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {passwordLoading.value ? "Đang xử lý..." : "Đổi Mật Khẩu"}
          </button>
        </form>
      </div>

      {/* Address management */}
      <div class="border border-brand-light-gray p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm tracking-wider uppercase">Địa Chỉ Giao Hàng</h2>
          <button
            onClick={() => {
              resetAddressForm();
              showAddressForm.value = !showAddressForm.value;
            }}
            class="text-xs text-brand-black underline hover:no-underline"
          >
            {showAddressForm.value ? "Hủy" : "+ Thêm Địa Chỉ"}
          </button>
        </div>

        {addressMsg.value && <p class="text-xs text-green-600 mb-3">{addressMsg.value}</p>}
        {addressErr.value && <p class="text-xs text-red-600 mb-3">{addressErr.value}</p>}

        {/* Address form */}
        {showAddressForm.value && (
          <form onSubmit={handleAddressSave} class="border border-dashed border-brand-light-gray p-4 mb-4 space-y-3">
            <h3 class="text-xs tracking-wider uppercase text-brand-gray">
              {editingAddress.value ? "Chỉnh Sửa Địa Chỉ" : "Thêm Địa Chỉ Mới"}
            </h3>
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-brand-gray mb-1">Nhãn</label>
                <select
                  value={addrLabel.value}
                  onChange={(e) => addrLabel.value = (e.target as HTMLSelectElement).value}
                  class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
                >
                  <option value="Nhà">Nhà</option>
                  <option value="Công ty">Công ty</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-brand-gray mb-1">Tên người nhận</label>
                <input
                  type="text"
                  value={addrRecipient.value}
                  onInput={(e) => addrRecipient.value = (e.target as HTMLInputElement).value}
                  class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
                  required
                />
              </div>
              <div>
                <label class="block text-xs text-brand-gray mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={addrPhone.value}
                  onInput={(e) => addrPhone.value = (e.target as HTMLInputElement).value}
                  placeholder="0912345678"
                  class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
                  required
                />
              </div>
              <div>
                <label class="block text-xs text-brand-gray mb-1">Thành phố</label>
                <input
                  type="text"
                  value={addrCity.value}
                  onInput={(e) => addrCity.value = (e.target as HTMLInputElement).value}
                  class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
                  required
                />
              </div>
              <div>
                <label class="block text-xs text-brand-gray mb-1">Quận/Huyện</label>
                <input
                  type="text"
                  value={addrDistrict.value}
                  onInput={(e) => addrDistrict.value = (e.target as HTMLInputElement).value}
                  class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
                  required
                />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs text-brand-gray mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={addrAddress.value}
                  onInput={(e) => addrAddress.value = (e.target as HTMLInputElement).value}
                  placeholder="Số nhà, tên đường..."
                  class="w-full border border-brand-light-gray px-3 py-2 text-sm focus:outline-none focus:border-brand-black"
                  required
                />
              </div>
            </div>
            <label class="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={addrIsDefault.value}
                onChange={(e) => addrIsDefault.value = (e.target as HTMLInputElement).checked}
              />
              Đặt làm địa chỉ mặc định
            </label>
            <button
              type="submit"
              class="bg-brand-black text-white px-6 py-2 text-sm tracking-wider uppercase hover:bg-opacity-90 transition-colors"
            >
              {editingAddress.value ? "Cập Nhật" : "Thêm Địa Chỉ"}
            </button>
          </form>
        )}

        {/* Address list */}
        {addresses.value.length === 0 ? (
          <p class="text-xs text-brand-gray py-4">Bạn chưa có địa chỉ giao hàng nào</p>
        ) : (
          <div class="space-y-3">
            {addresses.value.map((addr) => (
              <div key={addr.id} class="border border-brand-light-gray p-4 relative">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-medium">{addr.recipientName}</span>
                      <span class="text-xs text-brand-gray">| {addr.phone}</span>
                      {addr.isDefault && (
                        <span class="text-xs bg-brand-black text-white px-2 py-0.5">Mặc định</span>
                      )}
                    </div>
                    <p class="text-xs text-brand-gray">
                      {addr.address}, {addr.district}, {addr.city}
                    </p>
                    <span class="text-xs text-brand-gray italic">{addr.label}</span>
                  </div>
                  <div class="flex gap-2 text-xs">
                    <button
                      onClick={() => startEditAddress(addr)}
                      class="text-blue-600 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      class="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div class="grid sm:grid-cols-2 gap-4">
        <a
          href="/account/orders"
          class="border border-brand-light-gray p-6 hover:border-brand-black transition-colors group"
        >
          <h3 class="text-sm tracking-wider uppercase mb-2 group-hover:underline">Đơn Hàng</h3>
          <p class="text-xs text-brand-gray">Xem lịch sử đặt hàng</p>
        </a>
        <a
          href="/shop"
          class="border border-brand-light-gray p-6 hover:border-brand-black transition-colors group"
        >
          <h3 class="text-sm tracking-wider uppercase mb-2 group-hover:underline">Mua Sắm</h3>
          <p class="text-xs text-brand-gray">Khám phá sản phẩm mới</p>
        </a>
      </div>
    </div>
  );
}
