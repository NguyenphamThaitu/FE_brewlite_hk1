import { OrderStatus, Prisma } from '@prisma/client';

/** Lý do đổi trạng thái, lưu kèm mỗi dòng lịch sử (FR-34) */
export type StatusChangeReason =
  | 'ORDER_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'STAFF_UPDATE'
  | 'CUSTOMER_CANCEL'
  | 'AUTO_EXPIRED';

/**
 * Đổi trạng thái đơn và ghi lịch sử trong cùng transaction (FR-34).
 * Khóa dòng Order rồi mới đọc trạng thái, nên hai request đồng thời không cùng đổi được một đơn.
 * Chỉ đổi khi đơn đang ở một trong các trạng thái `from`; trả về trạng thái cũ, hoặc null nếu không đổi.
 * changedById = null khi hệ thống tự đổi (IPN VNPay, tự hủy đơn quá hạn).
 */
export async function changeOrderStatus(
  tx: Prisma.TransactionClient,
  orderId: number,
  from: OrderStatus[],
  to: OrderStatus,
  changedById: number | null,
  reason: StatusChangeReason,
): Promise<OrderStatus | null> {
  const rows = await tx.$queryRaw<{ status: OrderStatus }[]>`SELECT "status" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
  const current = rows[0]?.status;
  if (!current || !from.includes(current)) return null;
  await tx.order.update({ where: { id: orderId }, data: { status: to } });
  await tx.orderStatusHistory.create({ data: { orderId, fromStatus: current, toStatus: to, changedById, reason } });
  return current;
}
