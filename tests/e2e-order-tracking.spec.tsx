import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderTrackingPage from "@/app/orders/[id]/page";
import { TRACKING_POLL_MS } from "@/components/OrderTracking";
import * as ordersApi from "@/utils/orders-api";
import { saveSession } from "@/utils/auth";

// Tệp test nằm ngoài apps/web nên phải trỏ thẳng tới next/navigation mà component dùng
vi.mock("../apps/web/node_modules/next/navigation.js", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/utils/orders-api", () => ({ getOrderDetail: vi.fn() }));

/**
 * E2E-T31 (FR-31, UC-08): sau khi thanh toán, khách mở /orders/[id]; nhân viên lần lượt đổi
 * PAID → PREPARING → READY → COMPLETED (PATCH /orders/:id/status, FR-34). Mỗi lần đổi, trang của khách
 * phải hiện trạng thái mới trong tối đa 10 giây mà không cần tải lại trang, và ngừng hỏi khi đơn hoàn thành.
 * Trạng thái phía server được mô phỏng bằng biến `serverStatus` mà GET /orders/:id đọc ra.
 */
describe("E2E-T31: theo dõi trạng thái đơn gần thời gian thực", () => {
  let serverStatus = "PAID";

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    saveSession({
      accessToken: "opaque-token",
      user: { id: 1, email: "a@b.com", fullName: "Nguyễn Văn A", role: "CUSTOMER" },
    });
    serverStatus = "PAID";
    vi.mocked(ordersApi.getOrderDetail).mockReset();
    vi.mocked(ordersApi.getOrderDetail).mockImplementation(async (id: number) => ({
      id,
      status: serverStatus,
      totalAmount: 42000,
      createdAt: "2026-11-17T08:00:00.000Z",
      items: [{ id: 1, productName: "Cà phê sữa đá", sizeName: "M", toppings: [], quantity: 1, lineTotal: 42000 }],
      statusHistory: [],
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

  it("nhân viên đổi trạng thái → trang khách tự cập nhật trong ≤ 10 giây, đến Hoàn thành thì dừng", async () => {
    // Trang đọc params (Promise) trong Suspense nên phải chờ act xong mới có nội dung
    await act(async () => {
      render(<OrderTrackingPage params={Promise.resolve({ id: "101" })} />);
    });
    await advance(0);

    expect(ordersApi.getOrderDetail).toHaveBeenCalledWith(101);
    expect(screen.getByTestId("tracking-status")).toHaveTextContent("Đã thanh toán");

    const steps: [string, string][] = [
      ["PREPARING", "Đang pha chế"],
      ["READY", "Sẵn sàng nhận"],
      ["COMPLETED", "Hoàn thành"],
    ];
    for (const [status, label] of steps) {
      serverStatus = status; // nhân viên vừa bấm chuyển trạng thái
      await advance(10000);
      expect(screen.getByTestId("tracking-status")).toHaveTextContent(label);
      if (status === "READY") {
        expect(screen.getByTestId("ready-banner")).toHaveTextContent("Mời bạn ra quầy nhận món");
      }
    }

    // Đơn đã hoàn thành: không gọi API thêm nữa
    const calls = vi.mocked(ordersApi.getOrderDetail).mock.calls.length;
    await advance(TRACKING_POLL_MS * 5);
    expect(ordersApi.getOrderDetail).toHaveBeenCalledTimes(calls);
  });
});
