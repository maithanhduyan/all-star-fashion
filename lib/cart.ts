// Cart utilities using localStorage for persistence

export interface CartItemData {
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
}

const CART_KEY = "allstar_cart";

function isBrowser(): boolean {
  return typeof globalThis.localStorage !== "undefined";
}

export function getCart(): CartItemData[] {
  if (!isBrowser()) return [];
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItemData[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: Omit<CartItemData, "quantity"> & { quantity?: number }): CartItemData[] {
  const cart = getCart();
  const existing = cart.find(
    (c) => c.productId === item.productId && c.size === item.size && c.color === item.color,
  );

  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 });
  }

  saveCart(cart);
  return cart;
}

export function updateQuantity(productId: string, size: string, color: string, quantity: number): CartItemData[] {
  const cart = getCart();
  const index = cart.findIndex(
    (c) => c.productId === productId && c.size === size && c.color === color,
  );

  if (index !== -1) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: string, size: string, color: string): CartItemData[] {
  const cart = getCart().filter(
    (c) => !(c.productId === productId && c.size === size && c.color === color),
  );
  saveCart(cart);
  return cart;
}

export function clearCart(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(cart: CartItemData[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount(cart: CartItemData[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}
