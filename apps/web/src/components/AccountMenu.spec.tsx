import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import AccountMenu from "./AccountMenu";
import { getStoredUser, getToken, saveSession } from "@/utils/auth";

const user = { id: 1, email: "a@b.com", fullName: "Nguyễn Văn A", role: "CUSTOMER" as const };

describe("AccountMenu: nút Tài khoản (đăng nhập / đăng ký / đăng xuất)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("khách chưa đăng nhập: menu có Đăng nhập và Đăng ký, không có Đăng xuất", () => {
    render(<AccountMenu />);

    expect(screen.queryByTestId("account-menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("account-button"));

    expect(screen.getByRole("menuitem", { name: /Đăng nhập/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("menuitem", { name: /Đăng ký/i })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("menuitem", { name: /Đăng xuất/i })).not.toBeInTheDocument();
  });

  it("đã đăng nhập: hiện tên người dùng và nút Đăng xuất", () => {
    saveSession({ accessToken: "opaque-token", user });
    render(<AccountMenu />);

    const button = screen.getByRole("button", { name: "Tài khoản của Nguyễn Văn A" });
    fireEvent.click(button);

    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Đăng xuất/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Đăng nhập/i })).not.toBeInTheDocument();
  });

  it("bấm Đăng xuất: xóa phiên và quay về trạng thái khách", () => {
    saveSession({ accessToken: "opaque-token", user });
    render(<AccountMenu />);

    fireEvent.click(screen.getByTestId("account-button"));
    fireEvent.click(screen.getByRole("menuitem", { name: /Đăng xuất/i }));

    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
    expect(screen.queryByTestId("account-menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tài khoản" })).toBeInTheDocument();
  });

  it("nhấn Esc thì đóng menu", () => {
    render(<AccountMenu />);

    fireEvent.click(screen.getByTestId("account-button"));
    expect(screen.getByTestId("account-menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("account-menu")).not.toBeInTheDocument();
  });

  it("phiên đã hết hạn thì tự đăng xuất, không hiện tên cũ", async () => {
    const expired = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }))}.s`;
    saveSession({ accessToken: expired, user });

    render(<AccountMenu />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Tài khoản" })).toBeInTheDocument();
    });
    expect(getToken()).toBeNull();
  });
});
