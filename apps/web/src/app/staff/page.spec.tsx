import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StaffOrdersPage from "./page";
import { saveSession } from "@/utils/auth";
import * as ordersApi from "@/utils/orders-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/utils/orders-api", async () => {
  const actual = await vi.importActual<typeof import("@/utils/orders-api")>(
    "@/utils/orders-api",
  );
  return {
    ...actual,
    getStaffOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
    getMyWalletBalance: vi.fn(() => new Promise(() => {})),
  };
});

const validToken = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.s`;

describe("StaffOrdersPage: màn hình điều phối đơn hàng nhân viên (FR-33, FR-34)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("chưa đăng nhập: hiển thị yêu cầu đăng nhập tài khoản nhân viên", () => {
    render(<StaffOrdersPage />);
    expect(screen.getByTestId("staff-unauthenticated")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Đăng nhập nhân viên/i }),
    ).toHaveAttribute("href", "/login?next=/staff");
  });

  it("tài khoản CUSTOMER truy cập: hiển thị thông báo chặn quyền 403 (FR-17, FR-33)", () => {
    saveSession({
      accessToken: validToken,
      user: {
        id: 2,
        email: "customer@test.local",
        fullName: "Khách Hàng",
        role: "CUSTOMER",
      },
    });

    render(<StaffOrdersPage />);
    expect(screen.getByTestId("staff-forbidden")).toBeInTheDocument();
    expect(screen.getByText(/Không đủ quyền truy cập/i)).toBeInTheDocument();
  });

  it("tài khoản STAFF: hiển thị danh sách đơn, lọc trạng thái và chuyển trạng thái tuần tự (FR-33, FR-34)", async () => {
    saveSession({
      accessToken: validToken,
      user: {
        id: 1,
        email: "staff@brewlite.local",
        fullName: "Nhân viên quầy",
        role: "STAFF",
      },
    });

    const mockOrder: ordersApi.StaffOrder = {
      id: 23,
      userId: 5,
      status: "PAID",
      totalAmount: 45000,
      createdAt: "2026-11-18T08:34:05.000Z",
      user: { fullName: "Trần Minh Trí" },
      items: [
        {
          id: 1,
          productName: "Cà phê sữa đá",
          sizeName: "M",
          toppings: [{ id: 1, name: "Kem cheese", price: 10000 }],
          unitPrice: 45000,
          quantity: 1,
          lineTotal: 45000,
        },
      ],
    };

    vi.mocked(ordersApi.getStaffOrders).mockResolvedValue([mockOrder]);
    vi.mocked(ordersApi.updateOrderStatus).mockResolvedValue({
      ...mockOrder,
      status: "PREPARING",
    });

    render(<StaffOrdersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("staff-order-card-23")).toBeInTheDocument();
    });

    expect(screen.getByText("Đơn #23")).toBeInTheDocument();
    expect(screen.getByText(/Trần Minh Trí/i)).toBeInTheDocument();
    expect(screen.getByTestId("staff-order-status-23")).toHaveTextContent(
      "Chờ pha chế",
    );

    // Nhấn nút chuyển trạng thái PAID -> PREPARING
    vi.mocked(ordersApi.getStaffOrders).mockResolvedValueOnce([
      { ...mockOrder, status: "PREPARING" },
    ]);

    fireEvent.click(screen.getByTestId("staff-advance-btn-23"));

    await waitFor(() => {
      expect(ordersApi.updateOrderStatus).toHaveBeenCalledWith(23, "PREPARING");
    });

    await waitFor(() => {
      expect(screen.getByTestId("staff-order-status-23")).toHaveTextContent(
        "Đang pha chế",
      );
    });
  });
});

