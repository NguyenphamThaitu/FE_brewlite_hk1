import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderTracking, { TRACKING_POLL_MS } from "./OrderTracking";
import { getOrderDetail, OrderDetail } from "@/utils/orders-api";
import { saveSession } from "@/utils/auth";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/utils/orders-api", () => ({ getOrderDetail: vi.fn() }));

const order = (status: string, history: string[] = []): OrderDetail => ({
  id: 7,
  status,
  totalAmount: 35000,
  createdAt: "2026-11-17T08:00:00.000Z",
  items: [{ id: 1, productName: "Cà phê sữa đá", sizeName: "M", toppings: [], quantity: 1, lineTotal: 35000 }],
  statusHistory: history.map((toStatus, i) => ({
    fromStatus: null,
    toStatus,
    reason: "STAFF_UPDATE",
    changedAt: `2026-11-17T08:0${i}:00.000Z`,
  })),
});

/** Cho các promise đang chờ chạy xong rồi tua thời gian (dùng fake timer nên không dùng waitFor) */
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

describe("OrderTracking: trang theo dõi đơn (FR-31)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getOrderDetail).mockReset();
    localStorage.clear();
    saveSession({
      accessToken: "opaque-token",
      user: { id: 1, email: "a@b.com", fullName: "Nguyễn Văn A", role: "CUSTOMER" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("chu kỳ hỏi lại không quá 10 giây", () => {
    expect(TRACKING_POLL_MS).toBeLessThanOrEqual(10000);
  });

  it("hiện các bước, đánh dấu bước hiện tại và giờ đổi trạng thái", async () => {
    vi.mocked(getOrderDetail).mockResolvedValue(order("PREPARING", ["PENDING_PAYMENT", "PAID", "PREPARING"]));
    render(<OrderTracking orderId={7} />);
    await advance(0);

    expect(getOrderDetail).toHaveBeenCalledWith(7);
    expect(screen.getByTestId("tracking-status")).toHaveTextContent("Đang pha chế");
    expect(screen.getByTestId("track-step-PREPARING")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("track-step-PAID")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Nhân viên đang pha món")).toBeInTheDocument();
    expect(screen.getByTestId("tracking-poll-note")).toBeInTheDocument();
    expect(screen.queryByTestId("ready-banner")).not.toBeInTheDocument();
  });

  it("nhân viên đổi sang READY: trang tự cập nhật và mời khách ra quầy", async () => {
    vi.mocked(getOrderDetail)
      .mockResolvedValueOnce(order("PREPARING"))
      .mockResolvedValueOnce(order("READY"));
    render(<OrderTracking orderId={7} />);
    await advance(0);
    expect(screen.queryByTestId("ready-banner")).not.toBeInTheDocument();

    await advance(TRACKING_POLL_MS);

    expect(getOrderDetail).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("ready-banner")).toHaveTextContent("Mời bạn ra quầy nhận món");
    expect(screen.getByTestId("track-step-READY")).toHaveAttribute("aria-current", "step");
  });

  it("đơn đã hoàn thành thì ngừng hỏi lại", async () => {
    vi.mocked(getOrderDetail).mockResolvedValue(order("COMPLETED"));
    render(<OrderTracking orderId={7} />);
    await advance(0);
    await advance(TRACKING_POLL_MS * 3);

    expect(getOrderDetail).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("tracking-status")).toHaveTextContent("Hoàn thành");
    expect(screen.queryByTestId("tracking-poll-note")).not.toBeInTheDocument();
  });

  it("mất kết nối giữa chừng: giữ trạng thái cũ, báo lỗi và thử lại", async () => {
    vi.mocked(getOrderDetail)
      .mockResolvedValueOnce(order("PAID"))
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValueOnce(order("PREPARING"));
    render(<OrderTracking orderId={7} />);
    await advance(0);

    await advance(TRACKING_POLL_MS);
    expect(screen.getByTestId("tracking-error")).toHaveTextContent("Đang thử lại");
    expect(screen.getByTestId("tracking-status")).toHaveTextContent("Đã thanh toán");

    await advance(TRACKING_POLL_MS);
    expect(screen.queryByTestId("tracking-error")).not.toBeInTheDocument();
    expect(screen.getByTestId("tracking-status")).toHaveTextContent("Đang pha chế");
  });

  it("không xem được đơn (đơn của người khác): báo lỗi và không hỏi lại", async () => {
    vi.mocked(getOrderDetail).mockRejectedValue(new Error("Đây không phải đơn hàng của bạn"));
    render(<OrderTracking orderId={7} />);
    await advance(0);
    await advance(TRACKING_POLL_MS * 2);

    expect(screen.getByTestId("tracking-error")).toHaveTextContent("Đây không phải đơn hàng của bạn");
    expect(getOrderDetail).toHaveBeenCalledTimes(1);
  });

  it("chưa đăng nhập: yêu cầu đăng nhập, không gọi API", async () => {
    localStorage.clear();
    render(<OrderTracking orderId={7} />);
    await advance(0);

    expect(screen.getByTestId("tracking-error")).toHaveTextContent("Vui lòng đăng nhập");
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login");
    expect(getOrderDetail).not.toHaveBeenCalled();
  });

  it("mã đơn không hợp lệ: báo lỗi, không gọi API", async () => {
    render(<OrderTracking orderId={Number("abc")} />);
    await advance(0);

    expect(screen.getByText("Mã đơn hàng không hợp lệ.")).toBeInTheDocument();
    expect(getOrderDetail).not.toHaveBeenCalled();
  });
});
