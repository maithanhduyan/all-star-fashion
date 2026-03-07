-- ============================================
-- ALL STAR FASHION — Demo data cho môi trường thực tế
-- Chạy SAU khi đã seed categories, products, admin, carriers
-- ============================================

-- ── Biến product IDs (lấy từ slug) ──
-- Sử dụng subquery thay vì biến vì PostgreSQL không có biến session

-- ============================================
-- 1. DEMO CUSTOMER USERS (mật khẩu: User@12345)
-- ============================================
INSERT INTO users (id, email, password_hash, name, phone, role) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'nguyenvana@gmail.com',   '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Nguyễn Văn An',     '0901234001', 'customer'),
  ('a0000001-0000-0000-0000-000000000002', 'tranthib@gmail.com',     '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Trần Thị Bích',     '0912345002', 'customer'),
  ('a0000001-0000-0000-0000-000000000003', 'leminhhung@gmail.com',   '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Lê Minh Hùng',      '0933456003', 'customer'),
  ('a0000001-0000-0000-0000-000000000004', 'phamthimai@yahoo.com',   '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Phạm Thị Mai',      '0944567004', 'customer'),
  ('a0000001-0000-0000-0000-000000000005', 'hoangducan@outlook.com', '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Hoàng Đức An',      '0955678005', 'customer'),
  ('a0000001-0000-0000-0000-000000000006', 'vothilanh@gmail.com',    '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Võ Thị Lan Anh',    '0966789006', 'customer'),
  ('a0000001-0000-0000-0000-000000000007', 'dangquoctuan@gmail.com', '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Đặng Quốc Tuấn',    '0977890007', 'customer'),
  ('a0000001-0000-0000-0000-000000000008', 'buithihuong@gmail.com',  '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Bùi Thị Hương',     '0988901008', 'customer'),
  ('a0000001-0000-0000-0000-000000000009', 'dothanhson@gmail.com',   '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Đỗ Thanh Sơn',      '0999012009', 'customer'),
  ('a0000001-0000-0000-0000-000000000010', 'ngothithu@gmail.com',    '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Ngô Thị Thu',       '0900123010', 'customer'),
  ('a0000001-0000-0000-0000-000000000011', 'truongvankhanh@gmail.com','$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Trương Văn Khánh',  '0911234011', 'customer'),
  ('a0000001-0000-0000-0000-000000000012', 'lythimy@gmail.com',      '$2a$10$pUF9sXPuyuxRtATzXmpt.eroCDtKfnUIQuYyjfbIUQ.O94a7uA52u', 'Lý Thị Mỹ',        '0922345012', 'customer')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. DEMO ORDERS — Đa dạng trạng thái, nhiều ngày khác nhau
-- ============================================

-- ── Order 2: PENDING (Chờ xác nhận) — vừa đặt ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000002',
  'AS-202603-0002',
  'a0000001-0000-0000-0000-000000000001',
  'Nguyễn Văn An', 'nguyenvana@gmail.com', '0901234001',
  '123 Nguyễn Huệ, Phường Bến Nghé', 'Hồ Chí Minh', 'Quận 1',
  'Giao giờ hành chính', 'cod', 'pending', 'unpaid',
  2470000, 0, 0, 2470000,
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000002', (SELECT id FROM products WHERE slug='minimal-white-tee'), 'Minimal White Tee', '/images/products/minimal-white-tee/1.jpg', 590000, 'M', 'Trắng', 2),
  ('b0000001-0000-0000-0000-000000000002', (SELECT id FROM products WHERE slug='slim-fit-dark-jeans'), 'Slim Fit Dark Jeans', '/images/products/slim-fit-dark-jeans/1.jpg', 1290000, '32', 'Dark Wash', 1);

INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000002', 'order_created', NULL, 'pending', 'Đơn hàng mới từ website', 'Hệ thống', NOW() - INTERVAL '2 hours');

-- ── Order 3: PENDING — đặt bằng bank_transfer ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000003',
  'AS-202603-0003',
  'a0000001-0000-0000-0000-000000000002',
  'Trần Thị Bích', 'tranthib@gmail.com', '0912345002',
  '456 Lê Lợi, Phường Bến Thành', 'Hồ Chí Minh', 'Quận 1',
  'Gọi trước khi giao', 'bank_transfer', 'pending', 'unpaid',
  1890000, 0, 0, 1890000,
  NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000003', (SELECT id FROM products WHERE slug='silk-wrap-dress'), 'Silk Wrap Dress', '/images/products/silk-wrap-dress/1.jpg', 1890000, 'S', 'Đỏ Đô', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000003', 'order_created', NULL, 'pending', 'Đơn hàng mới từ website', 'Hệ thống', NOW() - INTERVAL '1 hour');

-- ── Order 4: CONFIRMED (Đã xác nhận) — chuẩn bị giao ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000004',
  'AS-202603-0004',
  'a0000001-0000-0000-0000-000000000003',
  'Lê Minh Hùng', 'leminhhung@gmail.com', '0933456003',
  '78 Trần Hưng Đạo, Phường Phạm Ngũ Lão', 'Hồ Chí Minh', 'Quận 1',
  '', 'cod', 'confirmed', 'unpaid',
  4280000, 0, 0, 4280000,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000004', (SELECT id FROM products WHERE slug='oversized-wool-coat'), 'Oversized Wool Coat', '/images/products/oversized-wool-coat/1.jpg', 2990000, 'L', 'Be', 1),
  ('b0000001-0000-0000-0000-000000000004', (SELECT id FROM products WHERE slug='slim-fit-dark-jeans'), 'Slim Fit Dark Jeans', '/images/products/slim-fit-dark-jeans/1.jpg', 1290000, '30', 'Black', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000004', 'order_created', NULL, 'pending', 'Đơn hàng mới từ website', 'Hệ thống', NOW() - INTERVAL '1 day'),
  ('b0000001-0000-0000-0000-000000000004', 'status_confirmed', 'pending', 'confirmed', 'Đã xác nhận đơn hàng', 'Admin', NOW() - INTERVAL '20 hours');

-- ── Order 5: SHIPPING (Đang giao) — GHN ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000005',
  'AS-202603-0005',
  'a0000001-0000-0000-0000-000000000004',
  'Phạm Thị Mai', 'phamthimai@yahoo.com', '0944567004',
  '234 Hai Bà Trưng, Phường Tân Định', 'Hồ Chí Minh', 'Quận 1',
  'Giao sau 17h', 'cod', 'shipping', 'unpaid',
  1690000, 0, 0, 1690000,
  (SELECT id FROM shipping_carriers WHERE code='ghn'), 'GHN987654321',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000005', (SELECT id FROM products WHERE slug='cashmere-knit-sweater'), 'Cashmere Knit Sweater', '/images/products/cashmere-knit-sweater/1.jpg', 1690000, 'M', 'Cream', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000005', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '2 days'),
  ('b0000001-0000-0000-0000-000000000005', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '1 day 18 hours'),
  ('b0000001-0000-0000-0000-000000000005', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: Giao Hàng Nhanh (GHN987654321)', 'Admin', NOW() - INTERVAL '6 hours'),
  ('b0000001-0000-0000-0000-000000000005', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '6 hours');

-- ── Order 6: SHIPPING — J&T Express, nhiều sản phẩm ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000006',
  'AS-202603-0006',
  'a0000001-0000-0000-0000-000000000005',
  'Hoàng Đức An', 'hoangducan@outlook.com', '0955678005',
  '15 Phan Chu Trinh, Hoàn Kiếm', 'Hà Nội', 'Quận Hoàn Kiếm',
  '', 'momo', 'shipping', 'paid',
  3470000, 0, 0, 3470000,
  (SELECT id FROM shipping_carriers WHERE code='jt'), 'JT820261234567',
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 hours'
);
UPDATE orders SET paid_at = NOW() - INTERVAL '3 days' WHERE id = 'b0000001-0000-0000-0000-000000000006';
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000006', (SELECT id FROM products WHERE slug='cashmere-knit-sweater'), 'Cashmere Knit Sweater', '/images/products/cashmere-knit-sweater/1.jpg', 1690000, 'L', 'Đen', 1),
  ('b0000001-0000-0000-0000-000000000006', (SELECT id FROM products WHERE slug='minimal-sneakers'), 'Minimal Sneakers', '/images/products/minimal-sneakers/1.jpg', 1790000, '42', 'Trắng', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000006', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '3 days'),
  ('b0000001-0000-0000-0000-000000000006', 'payment_received', NULL, NULL, 'Thanh toán qua MoMo', 'Hệ thống', NOW() - INTERVAL '3 days'),
  ('b0000001-0000-0000-0000-000000000006', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '2 days 16 hours'),
  ('b0000001-0000-0000-0000-000000000006', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: J&T Express (JT820261234567)', 'Admin', NOW() - INTERVAL '12 hours'),
  ('b0000001-0000-0000-0000-000000000006', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '12 hours');

-- ── Order 7: DELIVERED (Đã giao, chưa thanh toán COD) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, delivered_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000007',
  'AS-202603-0007',
  'a0000001-0000-0000-0000-000000000006',
  'Võ Thị Lan Anh', 'vothilanh@gmail.com', '0966789006',
  '89 Nguyễn Thái Học, Phường Cầu Ông Lãnh', 'Hồ Chí Minh', 'Quận 1',
  '', 'cod', 'delivered', 'unpaid',
  990000, 30000, 0, 1020000,
  (SELECT id FROM shipping_carriers WHERE code='ghtk'), 'GHTK_S26789456',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '8 hours'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000007', (SELECT id FROM products WHERE slug='pleated-midi-skirt'), 'Pleated Midi Skirt', '/images/products/pleated-midi-skirt/1.jpg', 990000, 'M', 'Đen', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000007', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '4 days'),
  ('b0000001-0000-0000-0000-000000000007', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '3 days 18 hours'),
  ('b0000001-0000-0000-0000-000000000007', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: Giao Hàng Tiết Kiệm (GHTK_S26789456)', 'Admin', NOW() - INTERVAL '2 days'),
  ('b0000001-0000-0000-0000-000000000007', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '2 days'),
  ('b0000001-0000-0000-0000-000000000007', 'status_delivered', 'shipping', 'delivered', 'Đã giao thành công', 'Hệ thống', NOW() - INTERVAL '8 hours');

-- ── Order 8: COMPLETED + INVOICE (Hoàn thành, đã TT COD) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, delivered_at, paid_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000008',
  'AS-202603-0008',
  'a0000001-0000-0000-0000-000000000007',
  'Đặng Quốc Tuấn', 'dangquoctuan@gmail.com', '0977890007',
  '56 Điện Biên Phủ, Phường Đa Kao', 'Hồ Chí Minh', 'Quận 1',
  '', 'cod', 'completed', 'paid',
  2990000, 0, 0, 2990000,
  (SELECT id FROM shipping_carriers WHERE code='vtp'), 'VTP260301234',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000008', (SELECT id FROM products WHERE slug='oversized-wool-coat'), 'Oversized Wool Coat', '/images/products/oversized-wool-coat/1.jpg', 2990000, 'M', 'Đen', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000008', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '7 days'),
  ('b0000001-0000-0000-0000-000000000008', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '6 days 18 hours'),
  ('b0000001-0000-0000-0000-000000000008', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: Viettel Post (VTP260301234)', 'Admin', NOW() - INTERVAL '6 days'),
  ('b0000001-0000-0000-0000-000000000008', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '6 days'),
  ('b0000001-0000-0000-0000-000000000008', 'status_delivered', 'shipping', 'delivered', 'Giao thành công', 'Hệ thống', NOW() - INTERVAL '3 days'),
  ('b0000001-0000-0000-0000-000000000008', 'payment_received', NULL, NULL, 'Thanh toán COD khi nhận hàng', 'Hệ thống', NOW() - INTERVAL '3 days'),
  ('b0000001-0000-0000-0000-000000000008', 'status_completed', 'delivered', 'completed', 'Hoàn thành đơn hàng', 'Hệ thống', NOW() - INTERVAL '3 days');

-- Invoice cho Order 8
INSERT INTO invoices (id, invoice_number, order_id, customer_name, customer_email, customer_phone, customer_address, subtotal, shipping_fee, discount, tax, total, payment_method, payment_status, issued_at, paid_at)
VALUES (
  'c0000001-0000-0000-0000-000000000008',
  'INV2026030002',
  'b0000001-0000-0000-0000-000000000008',
  'Đặng Quốc Tuấn', 'dangquoctuan@gmail.com', '0977890007',
  '56 Điện Biên Phủ, Phường Đa Kao, Quận 1, Hồ Chí Minh',
  2990000, 0, 0, 0, 2990000, 'cod', 'paid',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
);
INSERT INTO invoice_items (invoice_id, product_name, product_image, size, color, quantity, unit_price, total_price) VALUES
  ('c0000001-0000-0000-0000-000000000008', 'Oversized Wool Coat', '/images/products/oversized-wool-coat/1.jpg', 'M', 'Đen', 1, 2990000, 2990000);

-- ── Order 9: COMPLETED + INVOICE (bank_transfer, đã TT trước) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, delivered_at, paid_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000009',
  'AS-202603-0009',
  'a0000001-0000-0000-0000-000000000008',
  'Bùi Thị Hương', 'buithihuong@gmail.com', '0988901008',
  '102 Cách Mạng Tháng 8, Phường 7', 'Hồ Chí Minh', 'Quận 3',
  'Bọc kỹ giúp mình', 'bank_transfer', 'completed', 'paid',
  3180000, 0, 0, 3180000,
  (SELECT id FROM shipping_carriers WHERE code='ghn'), 'GHN112233445',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000009', (SELECT id FROM products WHERE slug='leather-crossbody-bag'), 'Leather Crossbody Bag', '/images/products/leather-crossbody-bag/1.jpg', 1490000, 'One Size', 'Nâu', 1),
  ('b0000001-0000-0000-0000-000000000009', (SELECT id FROM products WHERE slug='cashmere-knit-sweater'), 'Cashmere Knit Sweater', '/images/products/cashmere-knit-sweater/1.jpg', 1690000, 'S', 'Cream', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000009', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '8 days'),
  ('b0000001-0000-0000-0000-000000000009', 'payment_received', NULL, NULL, 'Chuyển khoản ngân hàng', 'Admin', NOW() - INTERVAL '6 days'),
  ('b0000001-0000-0000-0000-000000000009', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận + đã nhận TT', 'Admin', NOW() - INTERVAL '6 days'),
  ('b0000001-0000-0000-0000-000000000009', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: Giao Hàng Nhanh (GHN112233445)', 'Admin', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000009', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000009', 'status_delivered', 'shipping', 'delivered', 'Giao thành công', 'Hệ thống', NOW() - INTERVAL '2 days'),
  ('b0000001-0000-0000-0000-000000000009', 'status_completed', 'delivered', 'completed', 'Hoàn thành', 'Hệ thống', NOW() - INTERVAL '2 days');

INSERT INTO invoices (id, invoice_number, order_id, customer_name, customer_email, customer_phone, customer_address, subtotal, shipping_fee, discount, tax, total, payment_method, payment_status, issued_at, paid_at)
VALUES (
  'c0000001-0000-0000-0000-000000000009',
  'INV2026030003',
  'b0000001-0000-0000-0000-000000000009',
  'Bùi Thị Hương', 'buithihuong@gmail.com', '0988901008',
  '102 Cách Mạng Tháng 8, Phường 7, Quận 3, Hồ Chí Minh',
  3180000, 0, 0, 0, 3180000, 'bank_transfer', 'paid',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 days'
);
INSERT INTO invoice_items (invoice_id, product_name, product_image, size, color, quantity, unit_price, total_price) VALUES
  ('c0000001-0000-0000-0000-000000000009', 'Leather Crossbody Bag', '/images/products/leather-crossbody-bag/1.jpg', 'One Size', 'Nâu', 1, 1490000, 1490000),
  ('c0000001-0000-0000-0000-000000000009', 'Cashmere Knit Sweater', '/images/products/cashmere-knit-sweater/1.jpg', 'S', 'Cream', 1, 1690000, 1690000);

-- ── Order 10: COMPLETED (momo, Đà Nẵng) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, delivered_at, paid_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000010',
  'AS-202603-0010',
  'a0000001-0000-0000-0000-000000000009',
  'Đỗ Thanh Sơn', 'dothanhson@gmail.com', '0999012009',
  '45 Bạch Đằng, Thạch Thang', 'Đà Nẵng', 'Quận Hải Châu',
  '', 'momo', 'completed', 'paid',
  1790000, 0, 0, 1790000,
  (SELECT id FROM shipping_carriers WHERE code='best'), 'BEST260312345',
  NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000010', (SELECT id FROM products WHERE slug='minimal-sneakers'), 'Minimal Sneakers', '/images/products/minimal-sneakers/1.jpg', 1790000, '43', 'Đen', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000010', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '10 days'),
  ('b0000001-0000-0000-0000-000000000010', 'payment_received', NULL, NULL, 'Thanh toán MoMo', 'Hệ thống', NOW() - INTERVAL '10 days'),
  ('b0000001-0000-0000-0000-000000000010', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '9 days'),
  ('b0000001-0000-0000-0000-000000000010', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: BEST Express (BEST260312345)', 'Admin', NOW() - INTERVAL '8 days'),
  ('b0000001-0000-0000-0000-000000000010', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '8 days'),
  ('b0000001-0000-0000-0000-000000000010', 'status_delivered', 'shipping', 'delivered', 'Giao thành công', 'Hệ thống', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000010', 'status_completed', 'delivered', 'completed', 'Hoàn thành', 'Hệ thống', NOW() - INTERVAL '5 days');

INSERT INTO invoices (id, invoice_number, order_id, customer_name, customer_email, customer_phone, customer_address, subtotal, shipping_fee, discount, tax, total, payment_method, payment_status, issued_at, paid_at)
VALUES (
  'c0000001-0000-0000-0000-000000000010',
  'INV2026030004',
  'b0000001-0000-0000-0000-000000000010',
  'Đỗ Thanh Sơn', 'dothanhson@gmail.com', '0999012009',
  '45 Bạch Đằng, Thạch Thang, Quận Hải Châu, Đà Nẵng',
  1790000, 0, 0, 0, 1790000, 'momo', 'paid',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'
);
INSERT INTO invoice_items (invoice_id, product_name, product_image, size, color, quantity, unit_price, total_price) VALUES
  ('c0000001-0000-0000-0000-000000000010', 'Minimal Sneakers', '/images/products/minimal-sneakers/1.jpg', '43', 'Đen', 1, 1790000, 1790000);

-- ── Order 11: CANCELLED (Khách hủy) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  cancelled_at, cancel_reason, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000011',
  'AS-202603-0011',
  'a0000001-0000-0000-0000-000000000010',
  'Ngô Thị Thu', 'ngothithu@gmail.com', '0900123010',
  '67 Lý Thường Kiệt, Phường 6', 'Hồ Chí Minh', 'Quận 10',
  '', 'cod', 'cancelled', 'unpaid',
  590000, 30000, 0, 620000,
  NOW() - INTERVAL '5 days', 'Khách đổi ý, không muốn mua nữa',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000011', (SELECT id FROM products WHERE slug='minimal-white-tee'), 'Minimal White Tee', '/images/products/minimal-white-tee/1.jpg', 590000, 'L', 'Đen', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000011', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '6 days'),
  ('b0000001-0000-0000-0000-000000000011', 'status_cancelled', 'pending', 'cancelled', 'Khách đổi ý, không muốn mua nữa', 'Admin', NOW() - INTERVAL '5 days');

-- ── Order 12: CANCELLED (Admin hủy vì hết hàng) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  cancelled_at, cancel_reason, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000012',
  'AS-202603-0012',
  'a0000001-0000-0000-0000-000000000011',
  'Trương Văn Khánh', 'truongvankhanh@gmail.com', '0911234011',
  '23 Nguyễn Trãi, Phường Bến Thành', 'Hồ Chí Minh', 'Quận 1',
  '', 'vnpay', 'cancelled', 'refunded',
  1890000, 0, 0, 1890000,
  NOW() - INTERVAL '4 days', 'Hết hàng size S, đã hoàn tiền cho khách',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'
);
UPDATE orders SET paid_at = NOW() - INTERVAL '5 days' WHERE id = 'b0000001-0000-0000-0000-000000000012';
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000012', (SELECT id FROM products WHERE slug='silk-wrap-dress'), 'Silk Wrap Dress', '/images/products/silk-wrap-dress/1.jpg', 1890000, 'XS', 'Đen', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000012', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000012', 'payment_received', NULL, NULL, 'Thanh toán VNPay', 'Hệ thống', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000012', 'status_cancelled', 'pending', 'cancelled', 'Hết hàng size S, đã hoàn tiền cho khách', 'Admin', NOW() - INTERVAL '4 days');

-- ── Order 13: RETURNING (Đang trả hàng) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, delivered_at, paid_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000013',
  'AS-202603-0013',
  'a0000001-0000-0000-0000-000000000012',
  'Lý Thị Mỹ', 'lythimy@gmail.com', '0922345012',
  '189 Nguyễn Thị Minh Khai, Phường Phạm Ngũ Lão', 'Hồ Chí Minh', 'Quận 1',
  '', 'cod', 'returning', 'paid',
  1290000, 0, 0, 1290000,
  (SELECT id FROM shipping_carriers WHERE code='ghn'), 'GHN556677889',
  NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000013', (SELECT id FROM products WHERE slug='slim-fit-dark-jeans'), 'Slim Fit Dark Jeans', '/images/products/slim-fit-dark-jeans/1.jpg', 1290000, '34', 'Dark Wash', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000013', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '10 days'),
  ('b0000001-0000-0000-0000-000000000013', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '9 days'),
  ('b0000001-0000-0000-0000-000000000013', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: Giao Hàng Nhanh', 'Admin', NOW() - INTERVAL '8 days'),
  ('b0000001-0000-0000-0000-000000000013', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '8 days'),
  ('b0000001-0000-0000-0000-000000000013', 'status_delivered', 'shipping', 'delivered', 'Giao thành công', 'Hệ thống', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000013', 'payment_received', NULL, NULL, 'COD khi nhận', 'Hệ thống', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000013', 'return_requested', NULL, NULL, 'Yêu cầu trả hàng: Sai size, quần bị rộng', 'Lý Thị Mỹ', NOW() - INTERVAL '3 days'),
  ('b0000001-0000-0000-0000-000000000013', 'return_approved', NULL, NULL, 'Duyệt trả hàng', 'Admin', NOW() - INTERVAL '2 days'),
  ('b0000001-0000-0000-0000-000000000013', 'status_returning', 'delivered', 'returning', 'Đang xử lý trả hàng', 'Admin', NOW() - INTERVAL '2 days');

INSERT INTO order_returns (id, order_id, return_number, reason, status, refund_amount, refund_method, admin_note, requested_at, approved_at)
VALUES (
  'd0000001-0000-0000-0000-000000000013',
  'b0000001-0000-0000-0000-000000000013',
  'RET2026030001',
  'Sai size, quần bị rộng so với mô tả. Muốn đổi size 32 hoặc hoàn tiền.',
  'approved', 1290000, 'bank_transfer',
  'Đã xác nhận lỗi size, chấp nhận trả hàng hoàn tiền',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'
);

-- ── Order 14: RETURNED (Đã trả hàng hoàn tất) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, delivered_at, paid_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000014',
  'AS-202603-0014',
  'a0000001-0000-0000-0000-000000000001',
  'Nguyễn Văn An', 'nguyenvana@gmail.com', '0901234001',
  '123 Nguyễn Huệ, Phường Bến Nghé', 'Hồ Chí Minh', 'Quận 1',
  '', 'bank_transfer', 'returned', 'refunded',
  1490000, 0, 0, 1490000,
  (SELECT id FROM shipping_carriers WHERE code='ghtk'), 'GHTK_S26112233',
  NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '16 days',
  NOW() - INTERVAL '18 days', NOW() - INTERVAL '8 days'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000014', (SELECT id FROM products WHERE slug='leather-crossbody-bag'), 'Leather Crossbody Bag', '/images/products/leather-crossbody-bag/1.jpg', 1490000, 'One Size', 'Đen', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000014', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '18 days'),
  ('b0000001-0000-0000-0000-000000000014', 'payment_received', NULL, NULL, 'CK ngân hàng', 'Admin', NOW() - INTERVAL '16 days'),
  ('b0000001-0000-0000-0000-000000000014', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '16 days'),
  ('b0000001-0000-0000-0000-000000000014', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '15 days'),
  ('b0000001-0000-0000-0000-000000000014', 'status_delivered', 'shipping', 'delivered', 'Giao thành công', 'Hệ thống', NOW() - INTERVAL '12 days'),
  ('b0000001-0000-0000-0000-000000000014', 'return_requested', NULL, NULL, 'Yêu cầu trả hàng: Sản phẩm lỗi (da bị tróc)', 'Nguyễn Văn An', NOW() - INTERVAL '10 days'),
  ('b0000001-0000-0000-0000-000000000014', 'return_approved', NULL, NULL, 'Duyệt trả hàng + hoàn tiền', 'Admin', NOW() - INTERVAL '9 days'),
  ('b0000001-0000-0000-0000-000000000014', 'status_returning', 'delivered', 'returning', 'Đang trả hàng', 'Admin', NOW() - INTERVAL '9 days'),
  ('b0000001-0000-0000-0000-000000000014', 'return_completed', NULL, NULL, 'Đã nhận hàng trả, hoàn tiền', 'Admin', NOW() - INTERVAL '8 days'),
  ('b0000001-0000-0000-0000-000000000014', 'status_returned', 'returning', 'returned', 'Hoàn tất trả hàng', 'Admin', NOW() - INTERVAL '8 days');

INSERT INTO order_returns (id, order_id, return_number, reason, status, refund_amount, refund_method, admin_note, requested_at, approved_at, completed_at)
VALUES (
  'd0000001-0000-0000-0000-000000000014',
  'b0000001-0000-0000-0000-000000000014',
  'RET2026030002',
  'Sản phẩm lỗi: da bị tróc ở góc túi sau 2 ngày sử dụng',
  'completed', 1490000, 'bank_transfer',
  'Xác nhận lỗi sản phẩm, hoàn 100% qua chuyển khoản',
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'
);

INSERT INTO invoices (id, invoice_number, order_id, customer_name, customer_email, customer_phone, customer_address, subtotal, shipping_fee, discount, tax, total, payment_method, payment_status, issued_at, paid_at)
VALUES (
  'c0000001-0000-0000-0000-000000000014',
  'INV2026030005',
  'b0000001-0000-0000-0000-000000000014',
  'Nguyễn Văn An', 'nguyenvana@gmail.com', '0901234001',
  '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, Hồ Chí Minh',
  1490000, 0, 0, 0, 1490000, 'bank_transfer', 'refunded',
  NOW() - INTERVAL '12 days', NOW() - INTERVAL '16 days'
);
INSERT INTO invoice_items (invoice_id, product_name, product_image, size, color, quantity, unit_price, total_price) VALUES
  ('c0000001-0000-0000-0000-000000000014', 'Leather Crossbody Bag', '/images/products/leather-crossbody-bag/1.jpg', 'One Size', 'Đen', 1, 1490000, 1490000);

-- ── Order 15: COMPLETED (nhiều SP, Hà Nội, vnpay) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, delivered_at, paid_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000015',
  'AS-202603-0015',
  'a0000001-0000-0000-0000-000000000005',
  'Hoàng Đức An', 'hoangducan@outlook.com', '0955678005',
  '15 Phan Chu Trinh, Hoàn Kiếm', 'Hà Nội', 'Quận Hoàn Kiếm',
  'Giao cuối tuần', 'vnpay', 'completed', 'paid',
  5870000, 0, 0, 5870000,
  (SELECT id FROM shipping_carriers WHERE code='vtp'), 'VTP260398765',
  NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days', NOW() - INTERVAL '9 days'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000015', (SELECT id FROM products WHERE slug='oversized-wool-coat'), 'Oversized Wool Coat', '/images/products/oversized-wool-coat/1.jpg', 2990000, 'XL', 'Xám', 1),
  ('b0000001-0000-0000-0000-000000000015', (SELECT id FROM products WHERE slug='silk-wrap-dress'), 'Silk Wrap Dress', '/images/products/silk-wrap-dress/1.jpg', 1890000, 'M', 'Đỏ Đô', 1),
  ('b0000001-0000-0000-0000-000000000015', (SELECT id FROM products WHERE slug='pleated-midi-skirt'), 'Pleated Midi Skirt', '/images/products/pleated-midi-skirt/1.jpg', 990000, 'S', 'Be', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000015', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '14 days'),
  ('b0000001-0000-0000-0000-000000000015', 'payment_received', NULL, NULL, 'Thanh toán VNPay', 'Hệ thống', NOW() - INTERVAL '14 days'),
  ('b0000001-0000-0000-0000-000000000015', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '13 days'),
  ('b0000001-0000-0000-0000-000000000015', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: Viettel Post', 'Admin', NOW() - INTERVAL '12 days'),
  ('b0000001-0000-0000-0000-000000000015', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '12 days'),
  ('b0000001-0000-0000-0000-000000000015', 'status_delivered', 'shipping', 'delivered', 'Giao thành công', 'Hệ thống', NOW() - INTERVAL '9 days'),
  ('b0000001-0000-0000-0000-000000000015', 'status_completed', 'delivered', 'completed', 'Hoàn thành', 'Hệ thống', NOW() - INTERVAL '9 days');

INSERT INTO invoices (id, invoice_number, order_id, customer_name, customer_email, customer_phone, customer_address, subtotal, shipping_fee, discount, tax, total, payment_method, payment_status, issued_at, paid_at)
VALUES (
  'c0000001-0000-0000-0000-000000000015',
  'INV2026030006',
  'b0000001-0000-0000-0000-000000000015',
  'Hoàng Đức An', 'hoangducan@outlook.com', '0955678005',
  '15 Phan Chu Trinh, Hoàn Kiếm, Hà Nội',
  5870000, 0, 0, 0, 5870000, 'vnpay', 'paid',
  NOW() - INTERVAL '9 days', NOW() - INTERVAL '14 days'
);
INSERT INTO invoice_items (invoice_id, product_name, product_image, size, color, quantity, unit_price, total_price) VALUES
  ('c0000001-0000-0000-0000-000000000015', 'Oversized Wool Coat', '/images/products/oversized-wool-coat/1.jpg', 'XL', 'Xám', 1, 2990000, 2990000),
  ('c0000001-0000-0000-0000-000000000015', 'Silk Wrap Dress', '/images/products/silk-wrap-dress/1.jpg', 'M', 'Đỏ Đô', 1, 1890000, 1890000),
  ('c0000001-0000-0000-0000-000000000015', 'Pleated Midi Skirt', '/images/products/pleated-midi-skirt/1.jpg', 'S', 'Be', 1, 990000, 990000);

-- ── Order 16: DELIVERED + PAID (chờ hoàn thành, Hải Phòng) ──
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, city, district, note, payment_method, status, payment_status, subtotal, shipping_fee, discount, total,
  carrier_id, tracking_number, shipped_at, delivered_at, paid_at, created_at, updated_at)
VALUES (
  'b0000001-0000-0000-0000-000000000016',
  'AS-202603-0016',
  'a0000001-0000-0000-0000-000000000003',
  'Lê Minh Hùng', 'leminhhung@gmail.com', '0933456003',
  '88 Lạch Tray, Ngô Quyền', 'Hải Phòng', 'Quận Ngô Quyền',
  '', 'cod', 'delivered', 'paid',
  590000, 30000, 0, 620000,
  (SELECT id FROM shipping_carriers WHERE code='ghn'), 'GHN443322110',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'
);
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity) VALUES
  ('b0000001-0000-0000-0000-000000000016', (SELECT id FROM products WHERE slug='minimal-white-tee'), 'Minimal White Tee', '/images/products/minimal-white-tee/1.jpg', 590000, 'XL', 'Trắng', 1);
INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_name, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000016', 'order_created', NULL, 'pending', 'Đơn hàng mới', 'Hệ thống', NOW() - INTERVAL '5 days'),
  ('b0000001-0000-0000-0000-000000000016', 'status_confirmed', 'pending', 'confirmed', 'Xác nhận', 'Admin', NOW() - INTERVAL '4 days'),
  ('b0000001-0000-0000-0000-000000000016', 'carrier_assigned', NULL, NULL, 'Gán ĐVVC: Giao Hàng Nhanh', 'Admin', NOW() - INTERVAL '3 days'),
  ('b0000001-0000-0000-0000-000000000016', 'status_shipping', 'confirmed', 'shipping', 'Đã gửi hàng', 'Admin', NOW() - INTERVAL '3 days'),
  ('b0000001-0000-0000-0000-000000000016', 'status_delivered', 'shipping', 'delivered', 'Giao thành công', 'Hệ thống', NOW() - INTERVAL '1 day'),
  ('b0000001-0000-0000-0000-000000000016', 'payment_received', NULL, NULL, 'COD khi nhận hàng', 'Hệ thống', NOW() - INTERVAL '1 day');

-- ============================================
-- 3. PRODUCT REVIEWS (từ khách đã mua)
-- ============================================
INSERT INTO reviews (product_id, user_id, rating, comment, created_at) VALUES
  ((SELECT id FROM products WHERE slug='oversized-wool-coat'), 'a0000001-0000-0000-0000-000000000007', 5, 'Áo khoác đẹp lắm, chất liệu len mềm mại, giữ ấm tốt. Đúng form oversize. Ship nhanh, đóng gói cẩn thận!', NOW() - INTERVAL '2 days'),
  ((SELECT id FROM products WHERE slug='oversized-wool-coat'), 'a0000001-0000-0000-0000-000000000005', 4, 'Áo đẹp, nhưng hơi nặng. Mùa đông mặc rất ấm. Giao hàng đúng hẹn.', NOW() - INTERVAL '8 days'),
  ((SELECT id FROM products WHERE slug='minimal-white-tee'), 'a0000001-0000-0000-0000-000000000001', 5, 'Áo thun cotton thật sự mềm mại, mặc rất thoải mái. Form đúng size. Sẽ mua thêm màu đen.', NOW() - INTERVAL '3 days'),
  ((SELECT id FROM products WHERE slug='minimal-white-tee'), 'a0000001-0000-0000-0000-000000000003', 4, 'Chất vải tốt, nhưng sau vài lần giặt hơi co một chút. Nên mua lớn hơn 1 size.', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM products WHERE slug='silk-wrap-dress'), 'a0000001-0000-0000-0000-000000000002', 5, 'Váy lụa tuyệt vời! Mặc đi event ai cũng khen. Chất lụa mát, rũ đẹp. 10 điểm!', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM products WHERE slug='silk-wrap-dress'), 'a0000001-0000-0000-0000-000000000005', 5, 'Đỏ đô rất sang trọng, mặc đi tiệc hoàn hảo. Đóng gói rất kỹ, đáng tiền!', NOW() - INTERVAL '8 days'),
  ((SELECT id FROM products WHERE slug='slim-fit-dark-jeans'), 'a0000001-0000-0000-0000-000000000003', 4, 'Jeans đẹp, denim dày dặn. Slim fit vừa vặn, không quá ôm. Wash đậm rất dễ phối đồ.', NOW() - INTERVAL '4 days'),
  ((SELECT id FROM products WHERE slug='cashmere-knit-sweater'), 'a0000001-0000-0000-0000-000000000004', 5, 'Áo len cashmere siêu mềm, mặc cả ngày không bị ngứa. Relaxed fit thoải mái. Rất thích màu Cream!', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM products WHERE slug='cashmere-knit-sweater'), 'a0000001-0000-0000-0000-000000000008', 4, 'Chất liệu tốt, mềm mịn. Nhưng giá hơi cao so với thị trường. Nhìn chung hài lòng.', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM products WHERE slug='pleated-midi-skirt'), 'a0000001-0000-0000-0000-000000000006', 4, 'Chân váy xếp ly đẹp, phom chữ A tôn dáng. Chất polyester không nhăn. Phối áo sơ mi rất sang.', NOW() - INTERVAL '7 days'),
  ((SELECT id FROM products WHERE slug='leather-crossbody-bag'), 'a0000001-0000-0000-0000-000000000008', 5, 'Túi da thật rất đẹp, thiết kế đơn giản nhưng sang. Ngăn chứa vừa đủ cho điện thoại, ví, son.', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM products WHERE slug='minimal-sneakers'), 'a0000001-0000-0000-0000-000000000009', 5, 'Giày sneaker trắng cực đẹp, da thật mềm, đế êm. Phong cách clean phối gì cũng hợp. Rất đáng mua!', NOW() - INTERVAL '4 days'),
  ((SELECT id FROM products WHERE slug='minimal-sneakers'), 'a0000001-0000-0000-0000-000000000005', 4, 'Giày đẹp, chất lượng tốt. Cần break-in một chút ban đầu. Sau vài ngày mang rất thoải mái.', NOW() - INTERVAL '6 days')
ON CONFLICT (product_id, user_id) DO NOTHING;

-- ============================================
-- DONE — Summary
-- ============================================
-- 12 customers + 1 admin
-- 15 orders total (bao gồm order #0001 đã có):
--   2 pending, 1 confirmed, 2 shipping, 2 delivered, 4 completed, 2 cancelled, 1 returning, 1 returned
-- 5 invoices (cho orders completed + returned)
-- 1 return đang xử lý, 1 return hoàn tất
-- 13 reviews trên 8 sản phẩm
-- Payment methods: cod, bank_transfer, momo, vnpay
-- Carriers: GHN, GHTK, J&T, Viettel Post, BEST
-- Cities: HCM, Hà Nội, Đà Nẵng, Hải Phòng
