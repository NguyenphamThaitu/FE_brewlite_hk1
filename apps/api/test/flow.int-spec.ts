import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { sign } from '../src/payments/vnpay';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost:5433/brewlite_test';
process.env.JWT_SECRET = 'test-secret';
process.env.VNPAY_TMN_CODE = 'TESTTMN';
process.env.VNPAY_HASH_SECRET = 'TESTSECRET';
const SECRET = 'TESTSECRET';

describe('BrewLite API – luồng end-to-end (PostgreSQL thật)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    // DB sạch → áp toàn bộ migration (prisma migrate reset) → seed
    if (!process.env.TEST_SKIP_MIGRATE) execSync('npx prisma migrate reset --force --skip-generate --skip-seed', { stdio: 'inherit' });
    const { AppModule } = await import('../src/app.module');
    const { setupApp } = await import('../src/setup-app');
    const { seed } = await import('../src/prisma/seed');
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = setupApp(mod.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    await seed(prisma);
  });
  afterAll(async () => { await app.close(); });

  const register = async (email: string) => {
    const r = await http().post('/auth/register').send({ email, password: 'secret123', fullName: 'Khách ' + email }).expect(201);
    return r.body.accessToken as string;
  };
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const stockOf = async (name: string) => Number((await prisma.$queryRawUnsafe<any[]>('SELECT quantity FROM "Ingredient" WHERE name=$1', name))[0].quantity);
  const setStock = (name: string, q: number) => prisma.$executeRawUnsafe('UPDATE "Ingredient" SET quantity=$2 WHERE name=$1', name, q);
  const vnp = (txnRef: string, amount: number, code = '00', extra: any = {}) => {
    const p: any = { vnp_Amount: amount * 100, vnp_ResponseCode: code, vnp_TransactionStatus: code, vnp_TransactionNo: '14000001', vnp_TxnRef: txnRef, ...extra };
    return { ...p, vnp_SecureHash: sign(p, SECRET) };
  };
  // Giỏ hàng nằm ở frontend: test giả lập bằng một mảng trong bộ nhớ, rồi gửi cả mảng khi đặt đơn
  const carts = new Map<string, any[]>();
  const fillCart = (t: string, body: any = { productId: 4, sizeId: 2, toppingIds: [1, 3], quantity: 2 }) => {
    carts.set(t, [...(carts.get(t) ?? []), body]);
  };
  const placeOrder = (t: string, items: any[] = carts.get(t) ?? []) => http().post('/orders').set(auth(t)).send({ items });
  // Mỗi lượt bấm "Thanh toán" frontend sinh một Idempotency-Key mới
  const key = () => ({ 'Idempotency-Key': randomUUID() });
  const pay = async (t: string, orderId: number) => (await http().post('/payments/vnpay').set(auth(t)).set(key()).send({ orderId }).expect(200)).body;
  const txnRefOf = async (orderId: number) => (await prisma.payment.findFirstOrThrow({ where: { orderId }, orderBy: { id: 'desc' } })).txnRef;

  it('GET /health', async () => {
    const r = await http().get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', db: 'up' });
  });

  describe('Sản phẩm', () => {
    it('danh sách món', async () => {
      const r = await http().get('/products').expect(200);
      expect(r.body).toHaveLength(5);
      expect(r.body[0]).toMatchObject({ name: 'Cà phê sữa đá', basePrice: 29000, available: true });
    });
    it('chi tiết món có size và topping', async () => {
      const r = await http().get('/products/4').expect(200);
      expect(r.body.sizes.map((s: any) => s.name)).toEqual(['S', 'M', 'L']);
      expect(r.body.toppings).toHaveLength(3);
    });
    it('404 khi không có / 400 khi id sai', async () => {
      await http().get('/products/999').expect(404);
      await http().get('/products/abc').expect(400);
    });
  });

  describe('Đăng ký / đăng nhập / JWT', () => {
    it('validate dữ liệu đăng ký', async () => {
      await http().post('/auth/register').send({ email: 'sai', password: '1', fullName: '' }).expect(400);
      await http().post('/auth/register').send({ email: 'a@b.vn', password: 'secret123', fullName: 'A', role: 'STAFF' }).expect(400); // không cho tự đặt role
    });
    it('đăng ký, trùng email, đăng nhập, /me', async () => {
      const token = await register('an@test.vn');
      await http().post('/auth/register').send({ email: 'AN@test.vn', password: 'secret123', fullName: 'X' }).expect(409);
      await http().post('/auth/login').send({ email: 'an@test.vn', password: 'sai-mat-khau' }).expect(401);
      const login = await http().post('/auth/login').send({ email: 'an@test.vn', password: 'secret123' }).expect(200);
      expect(login.body.accessToken).toBeTruthy();
      expect((await http().get('/auth/me').set(auth(token)).expect(200)).body).toMatchObject({ email: 'an@test.vn', role: 'CUSTOMER' });
    });
    it('chưa đăng nhập / token sai bị chặn', async () => {
      await http().post('/orders').send({ items: [] }).expect(401);
      await http().get('/orders').set(auth('token-gia')).expect(401);
    });
  });

  describe('Validate danh sách món gửi từ frontend', () => {
    it('giỏ rỗng / thiếu items → 400', async () => {
      const t = await register('empty@test.vn');
      await placeOrder(t, []).expect(400);
      await http().post('/orders').set(auth(t)).send({}).expect(400);
    });
    it('số lượng, size, topping, món không hợp lệ', async () => {
      const t = await register('itemv@test.vn');
      await placeOrder(t, [{ productId: 1, sizeId: 1, quantity: 0 }]).expect(400);
      await placeOrder(t, [{ productId: 1, sizeId: 1, quantity: 21 }]).expect(400);
      await placeOrder(t, [{ productId: 1, sizeId: 99, quantity: 1 }]).expect(400);
      await placeOrder(t, [{ productId: 1, sizeId: 1, toppingIds: [99], quantity: 1 }]).expect(400);
      await placeOrder(t, [{ productId: 1, sizeId: 1, toppingIds: [1, 1], quantity: 1 }]).expect(400);
      await placeOrder(t, [{ productId: 99, sizeId: 1, quantity: 1 }]).expect(404);
    });
    it('không tin giá từ client: gửi kèm giá bị từ chối', async () => {
      const t = await register('price@test.vn');
      await placeOrder(t, [{ productId: 1, sizeId: 1, quantity: 1, unitPrice: 1 }]).expect(400);
      await http().post('/orders').set(auth(t)).send({ items: [{ productId: 1, sizeId: 1, quantity: 1 }], totalAmount: 1 }).expect(400);
    });
    it('món đã ngừng bán → 400, kho không đổi', async () => {
      const t = await register('inactive@test.vn');
      await prisma.product.update({ where: { id: 3 }, data: { isActive: false } });
      const before = await stockOf('Cà phê hạt');
      await placeOrder(t, [{ productId: 1, sizeId: 1, quantity: 1 }, { productId: 3, sizeId: 1, quantity: 1 }]).expect(400);
      expect(await stockOf('Cà phê hạt')).toBe(before);
      await prisma.product.update({ where: { id: 3 }, data: { isActive: true } });
    });
  });

  describe('Đặt đơn + tồn kho theo nguyên liệu', () => {
    it('đặt đơn: tính giá phía server, trừ đúng nguyên liệu theo công thức × size, trạng thái chờ thanh toán', async () => {
      const t = await register('order@test.vn');
      await fillCart(t); // 2 ly Trà sữa trân châu size M (×1.25) + trân châu + kem cheese
      const before = { tea: await stockOf('Trà đen'), milk: await stockOf('Sữa tươi'), sugar: await stockOf('Đường'), pearl: await stockOf('Trân châu'), cheese: await stockOf('Kem cheese') };
      const r = await placeOrder(t).expect(201);
      expect(r.body).toMatchObject({ status: 'PENDING_PAYMENT', totalAmount: 116000 });
      expect(r.body.items[0]).toMatchObject({ productName: 'Trà sữa trân châu', sizeName: 'M', quantity: 2, lineTotal: 116000 });
      expect(await stockOf('Trà đen')).toBe(before.tea - 10 * 1.25 * 2);
      expect(await stockOf('Sữa tươi')).toBe(before.milk - 150 * 1.25 * 2);
      expect(await stockOf('Đường')).toBe(before.sugar - 20 * 1.25 * 2);
      expect(await stockOf('Trân châu')).toBe(before.pearl - 40 * 2);
      expect(await stockOf('Kem cheese')).toBe(before.cheese - 35 * 2);
    });

    it('nhiều dòng trong một đơn: tổng tiền = tổng các dòng, lưu đúng từng dòng', async () => {
      const t = await register('multi@test.vn');
      // 2 × Trà sữa trân châu M + 2 topping = 116k ; 1 × Cà phê sữa đá S = 29k
      const r = await placeOrder(t, [{ productId: 4, sizeId: 2, toppingIds: [1, 3], quantity: 2 }, { productId: 1, sizeId: 1, quantity: 1 }]).expect(201);
      expect(r.body.totalAmount).toBe(145000);
      expect(r.body.items).toHaveLength(2);
      expect(r.body.items.map((i: any) => i.lineTotal)).toEqual([116000, 29000]);
    });

    it('hết nguyên liệu → 409, kho không đổi', async () => {
      const t = await register('oos@test.vn');
      await fillCart(t, { productId: 5, sizeId: 3, quantity: 2 }); // Matcha latte size L: matcha 8×1.5×2 = 24g
      await setStock('Bột matcha', 20);
      const r = await placeOrder(t).expect(409);
      expect(r.body.message).toContain('Bột matcha');
      expect(r.body.shortages[0]).toMatchObject({ need: 24, available: 20 });
      expect(await stockOf('Bột matcha')).toBe(20);
      await setStock('Bột matcha', 1500);
    });

    it('hết nguyên liệu → menu báo món hết, size lớn báo hết trước size nhỏ', async () => {
      await setStock('Bột matcha', 10); // đủ size S (8g) nhưng không đủ L (12g)
      const d = (await http().get('/products/5')).body;
      expect(d.available).toBe(true);
      expect(d.sizes.map((s: any) => s.available)).toEqual([true, true, false]); // M = 10g đủ
      await setStock('Bột matcha', 5);
      expect((await http().get('/products')).body.find((p: any) => p.id === 5).available).toBe(false);
      await setStock('Bột matcha', 1500);
    });

    it('topping hết nguyên liệu cũng chặn đơn', async () => {
      const t = await register('topoos@test.vn');
      await fillCart(t, { productId: 1, sizeId: 1, toppingIds: [3], quantity: 1 });
      await setStock('Kem cheese', 10);
      await placeOrder(t).expect(409);
      await setStock('Kem cheese', 2500);
    });

    it('đồng thời: chỉ đủ nguyên liệu cho 1 đơn → đúng 1 đơn thành công', async () => {
      const [t1, t2] = [await register('race1@test.vn'), await register('race2@test.vn')];
      await fillCart(t1, { productId: 5, sizeId: 1, quantity: 1 });
      await fillCart(t2, { productId: 5, sizeId: 1, quantity: 1 });
      await setStock('Bột matcha', 8); // đúng 1 ly
      const res = await Promise.all([placeOrder(t1), placeOrder(t2)]);
      expect(res.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await stockOf('Bột matcha')).toBe(0);
      await setStock('Bột matcha', 1500);
    });
  });

  describe('Thanh toán VNPay', () => {
    const newOrder = async (email: string) => {
      const t = await register(email);
      await fillCart(t, { productId: 1, sizeId: 1, quantity: 2 }); // 58.000đ
      const o = (await placeOrder(t).expect(201)).body;
      return { t, orderId: o.id as number, total: o.totalAmount as number };
    };

    it('tạo link thanh toán có chữ ký, gọi lại không tạo giao dịch trùng (idempotent)', async () => {
      const { t, orderId, total } = await newOrder('pay1@test.vn');
      const a = await pay(t, orderId);
      const b = await pay(t, orderId);
      expect(a.paymentId).toBe(b.paymentId);
      expect(a.paymentUrl).toContain('vnp_Amount=' + total * 100);
      expect(a.paymentUrl).toContain('vnp_SecureHash=');
      expect(await prisma.payment.count({ where: { orderId } })).toBe(1);
    });

    it('không thanh toán đơn của người khác', async () => {
      const { orderId } = await newOrder('pay2@test.vn');
      const other = await register('pay2x@test.vn');
      await http().post('/payments/vnpay').set(auth(other)).set(key()).send({ orderId }).expect(404);
    });

    it('IPN thành công → đơn PAID; gọi lại không xử lý lần 2', async () => {
      const { t, orderId, total } = await newOrder('pay3@test.vn');
      await pay(t, orderId);
      const ref = await txnRefOf(orderId);
      expect((await http().get('/payments/vnpay/ipn').query(vnp(ref, total)).expect(200)).body).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect((await http().get(`/orders/${orderId}`).set(auth(t))).body.status).toBe('PAID');
      expect((await http().get('/payments/vnpay/ipn').query(vnp(ref, total)).expect(200)).body.RspCode).toBe('02');
      await http().post('/payments/vnpay').set(auth(t)).set(key()).send({ orderId }).expect(409); // đã thanh toán
      const ret = await http().get('/payments/vnpay/return').query(vnp(ref, total)).expect(200);
      expect(ret.body).toMatchObject({ success: true, orderId });
    });

    it('chữ ký sai / số tiền sai / giao dịch lạ bị từ chối, đơn không đổi', async () => {
      const { t, orderId, total } = await newOrder('pay4@test.vn');
      await pay(t, orderId);
      const ref = await txnRefOf(orderId);
      const forged = { ...vnp(ref, total), vnp_Amount: 100 };
      expect((await http().get('/payments/vnpay/ipn').query(forged)).body.RspCode).toBe('97');
      expect((await http().get('/payments/vnpay/ipn').query(vnp(ref, total + 1))).body.RspCode).toBe('04');
      expect((await http().get('/payments/vnpay/ipn').query(vnp('khongtontai', total))).body.RspCode).toBe('01');
      expect((await http().get(`/orders/${orderId}`).set(auth(t))).body.status).toBe('PENDING_PAYMENT');
    });

    it('thanh toán thất bại → đơn PAYMENT_FAILED, giữ kho để thanh toán lại', async () => {
      const { t, orderId, total } = await newOrder('pay5@test.vn');
      const coffeeAfterOrder = await stockOf('Cà phê hạt');
      await pay(t, orderId);
      const ref = await txnRefOf(orderId);
      await http().get('/payments/vnpay/ipn').query(vnp(ref, total, '24')).expect(200); // 24 = khách hủy giao dịch
      expect((await http().get(`/orders/${orderId}`).set(auth(t))).body.status).toBe('PAYMENT_FAILED');
      expect(await stockOf('Cà phê hạt')).toBe(coffeeAfterOrder); // chưa hoàn kho: đơn vẫn chờ thanh toán lại
      // gọi IPN thất bại lần nữa không xử lý lần 2
      expect((await http().get('/payments/vnpay/ipn').query(vnp(ref, total, '24')).expect(200)).body.RspCode).toBe('02');
      const ret = await http().get('/payments/vnpay/return').query(vnp(ref, total, '24')).expect(200);
      expect(ret.body).toMatchObject({ success: false, orderId, message: 'Thanh toán thất bại, bạn có thể thanh toán lại hoặc hủy đơn' });
    });

    it('khách hủy đơn chưa thanh toán → hoàn kho; không hủy được đơn đã thanh toán', async () => {
      const { t, orderId } = await newOrder('pay6@test.vn');
      const s = await stockOf('Cà phê hạt');
      expect((await http().post(`/orders/${orderId}/cancel`).set(auth(t)).expect(201)).body.status).toBe('CANCELLED');
      expect(await stockOf('Cà phê hạt')).toBe(s + 36);
      await http().post(`/orders/${orderId}/cancel`).set(auth(t)).expect(409);

      const paid = await newOrder('pay7@test.vn');
      await pay(paid.t, paid.orderId);
      await http().get('/payments/vnpay/ipn').query(vnp(await txnRefOf(paid.orderId), paid.total)).expect(200);
      await http().post(`/orders/${paid.orderId}/cancel`).set(auth(paid.t)).expect(409);
    });

    it('thanh toán lại sau PAYMENT_FAILED: tạo giao dịch mới, thành công → PAID, kho không bị trừ thêm', async () => {
      const { t, orderId, total } = await newOrder('retry1@test.vn');
      const coffeeAfterOrder = await stockOf('Cà phê hạt');
      const first = await pay(t, orderId);
      await http().get('/payments/vnpay/ipn').query(vnp(await txnRefOf(orderId), total, '51')).expect(200); // 51 = không đủ số dư
      expect((await http().get(`/orders/${orderId}`).set(auth(t))).body.status).toBe('PAYMENT_FAILED');

      const second = await pay(t, orderId); // key mới cho lượt thanh toán lại
      expect(second.paymentId).not.toBe(first.paymentId);
      expect(second.paymentUrl).toContain('vnp_SecureHash=');
      await http().get('/payments/vnpay/ipn').query(vnp(await txnRefOf(orderId), total)).expect(200);
      expect((await http().get(`/orders/${orderId}`).set(auth(t))).body.status).toBe('PAID');
      expect(await prisma.payment.count({ where: { orderId } })).toBe(2);
      expect(await prisma.payment.count({ where: { orderId, status: 'SUCCESS' } })).toBe(1);
      expect(await stockOf('Cà phê hạt')).toBe(coffeeAfterOrder);
    });

    it('khách hủy đơn PAYMENT_FAILED → CANCELLED, hoàn kho đúng 1 lần', async () => {
      const { t, orderId, total } = await newOrder('retry2@test.vn');
      const coffeeAfterOrder = await stockOf('Cà phê hạt');
      await pay(t, orderId);
      await http().get('/payments/vnpay/ipn').query(vnp(await txnRefOf(orderId), total, '24')).expect(200);
      expect((await http().post(`/orders/${orderId}/cancel`).set(auth(t)).expect(201)).body.status).toBe('CANCELLED');
      expect(await stockOf('Cà phê hạt')).toBe(coffeeAfterOrder + 18 * 2);
      await http().post(`/orders/${orderId}/cancel`).set(auth(t)).expect(409);
      expect(await stockOf('Cà phê hạt')).toBe(coffeeAfterOrder + 18 * 2);
      await http().post('/payments/vnpay').set(auth(t)).set(key()).send({ orderId }).expect(409); // đơn đã hủy
    });

    it('Idempotency-Key: thiếu hoặc sai định dạng → 400, không tạo giao dịch', async () => {
      const { t, orderId } = await newOrder('idem1@test.vn');
      const r = await http().post('/payments/vnpay').set(auth(t)).send({ orderId }).expect(400);
      expect(r.body.message).toBe('Thiếu header Idempotency-Key');
      await http().post('/payments/vnpay').set(auth(t)).set('Idempotency-Key', 'ngan').send({ orderId }).expect(400);
      expect(await prisma.payment.count({ where: { orderId } })).toBe(0);
    });

    it('Idempotency-Key: gửi lại cùng key trả đúng giao dịch cũ; dùng cho đơn khác hoặc người khác → 409', async () => {
      const a = await newOrder('idem2@test.vn');
      const k = key();
      const first = (await http().post('/payments/vnpay').set(auth(a.t)).set(k).send({ orderId: a.orderId }).expect(200)).body;
      const again = (await http().post('/payments/vnpay').set(auth(a.t)).set(k).send({ orderId: a.orderId }).expect(200)).body;
      expect(again).toMatchObject({ paymentId: first.paymentId, orderId: a.orderId, paymentStatus: 'PENDING' });
      expect(await prisma.payment.count({ where: { orderId: a.orderId } })).toBe(1);

      const t2 = await placeOrder(a.t, [{ productId: 1, sizeId: 1, quantity: 1 }]).expect(201);
      await http().post('/payments/vnpay').set(auth(a.t)).set(k).send({ orderId: t2.body.id }).expect(409); // cùng key, đơn khác
      const other = await register('idem2x@test.vn');
      await http().post('/payments/vnpay').set(auth(other)).set(k).send({ orderId: a.orderId }).expect(409); // cùng key, người khác
    });

    it('Idempotency-Key: gửi lại key của giao dịch đã thất bại → trả kết quả cũ, không mở link mới', async () => {
      const { t, orderId, total } = await newOrder('idem3@test.vn');
      const k = key();
      await http().post('/payments/vnpay').set(auth(t)).set(k).send({ orderId }).expect(200);
      await http().get('/payments/vnpay/ipn').query(vnp(await txnRefOf(orderId), total, '24')).expect(200);
      const replay = (await http().post('/payments/vnpay').set(auth(t)).set(k).send({ orderId }).expect(200)).body;
      expect(replay.paymentStatus).toBe('FAILED');
      expect(replay.paymentUrl).toBeUndefined();
      expect(await prisma.payment.count({ where: { orderId } })).toBe(1);
    });

    it('đồng thời: 5 request cùng key, hoặc 2 request khác key → chỉ 1 giao dịch', async () => {
      const a = await newOrder('idem4@test.vn');
      const k = key();
      const same = await Promise.all(Array.from({ length: 5 }, () => http().post('/payments/vnpay').set(auth(a.t)).set(k).send({ orderId: a.orderId })));
      expect(same.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
      expect(new Set(same.map((r) => r.body.paymentId)).size).toBe(1);
      expect(await prisma.payment.count({ where: { orderId: a.orderId } })).toBe(1);

      const b = await newOrder('idem5@test.vn');
      const diff = await Promise.all([1, 2].map(() => http().post('/payments/vnpay').set(auth(b.t)).set(key()).send({ orderId: b.orderId })));
      expect(diff.map((r) => r.status)).toEqual([200, 200]);
      expect(diff[0].body.paymentId).toBe(diff[1].body.paymentId);
      expect(await prisma.payment.count({ where: { orderId: b.orderId } })).toBe(1);
    });
  });

  describe('GET /orders/me – lịch sử đơn của tôi', () => {
    it('cần đăng nhập; chưa có đơn → mảng rỗng', async () => {
      await http().get('/orders/me').expect(401);
      const t = await register('me0@test.vn');
      expect((await http().get('/orders/me').set(auth(t)).expect(200)).body).toEqual([]);
    });

    it('chỉ trả đơn của chính mình, mới nhất trước, kèm danh sách món', async () => {
      const t = await register('me1@test.vn');
      const o1 = (await placeOrder(t, [{ productId: 1, sizeId: 1, quantity: 1 }]).expect(201)).body;
      const o2 = (await placeOrder(t, [{ productId: 2, sizeId: 2, quantity: 2 }]).expect(201)).body;
      const other = await register('me2@test.vn');
      await placeOrder(other, [{ productId: 1, sizeId: 1, quantity: 1 }]).expect(201);

      const mine = (await http().get('/orders/me').set(auth(t)).expect(200)).body;
      expect(mine.map((o: any) => o.id)).toEqual([o2.id, o1.id]);
      expect(mine[0].items[0]).toMatchObject({ productName: 'Bạc xỉu', sizeName: 'M', quantity: 2 });
      expect(mine[0].ingredientUsage).toBeUndefined(); // không lộ dữ liệu nội bộ
      expect((await http().get('/orders/me').set(auth(other)).expect(200)).body).toHaveLength(1);

      const staff = (await http().post('/auth/login').send({ email: 'staff@brewlite.local', password: 'Staff@123' }).expect(200)).body.accessToken;
      expect((await http().get('/orders/me').set(auth(staff)).expect(200)).body).toEqual([]); // nhân viên: chỉ đơn của chính mình
    });
  });

  describe('Trạng thái & lịch sử đơn', () => {
    it('nhân viên đẩy trạng thái đúng thứ tự, khách không được, lịch sử đúng chủ', async () => {
      const t = await register('hist@test.vn');
      await fillCart(t, { productId: 2, sizeId: 1, quantity: 1 });
      const order = (await placeOrder(t).expect(201)).body;
      await pay(t, order.id);
      await http().get('/payments/vnpay/ipn').query(vnp(await txnRefOf(order.id), order.totalAmount)).expect(200);

      const staff = (await http().post('/auth/login').send({ email: 'staff@brewlite.local', password: 'Staff@123' }).expect(200)).body.accessToken;
      await http().patch(`/orders/${order.id}/status`).set(auth(t)).send({ status: 'PREPARING' }).expect(403); // khách
      await http().patch(`/orders/${order.id}/status`).set(auth(staff)).send({ status: 'READY' }).expect(400); // nhảy bước
      await http().patch(`/orders/${order.id}/status`).set(auth(staff)).send({ status: 'XYZ' }).expect(400);
      for (const s of ['PREPARING', 'READY', 'COMPLETED'])
        expect((await http().patch(`/orders/${order.id}/status`).set(auth(staff)).send({ status: s }).expect(200)).body.status).toBe(s);
      await http().patch(`/orders/${order.id}/status`).set(auth(staff)).send({ status: 'COMPLETED' }).expect(400);

      const mine = (await http().get('/orders').set(auth(t)).expect(200)).body;
      expect(mine).toHaveLength(1);
      expect(mine[0]).toMatchObject({ id: order.id, status: 'COMPLETED' });
      const stranger = await register('stranger@test.vn');
      await http().get(`/orders/${order.id}`).set(auth(stranger)).expect(403);
      expect((await http().get('/orders').set(auth(stranger))).body).toHaveLength(0);
      expect((await http().get('/orders').set(auth(staff))).body.length).toBeGreaterThan(1); // nhân viên thấy tất cả
      await http().get('/orders/99999').set(auth(t)).expect(404);
    });
  });
});
