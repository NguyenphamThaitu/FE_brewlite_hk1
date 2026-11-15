import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AboutPage from "./page";

describe("AboutPage (/about)", () => {
  it("renders brand introduction, core values and CTA link", () => {
    render(<AboutPage />);

    // Check heading
    expect(
      screen.getByRole("heading", { name: /Hương vị nguyên bản/i })
    ).toBeInTheDocument();

    // Check core pillars
    expect(screen.getByText("100% Cà Phê Mộc")).toBeInTheDocument();
    expect(screen.getByText("Tùy Biến Theo Gu")).toBeInTheDocument();
    expect(screen.getByText("Giá Chuẩn & Minh Bạch")).toBeInTheDocument();
    expect(screen.getByText("Đặt Món Nhanh Chóng")).toBeInTheDocument();

    // Check SGU academic project card
    expect(screen.getByText(/ĐH Sài Gòn/i)).toBeInTheDocument();

    // Check CTA button linking back to menu
    const menuLinks = screen.getAllByRole("link", { name: /thực đơn/i });
    expect(menuLinks.length).toBeGreaterThan(0);
  });
});
