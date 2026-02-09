import { OrderRepository } from '../repositories/orderRepository';

export class OrderService {
  private orderRepo = new OrderRepository();

  async getOrdersByStore(storeId: string) {
    return await this.orderRepo.findByStore(storeId);
  }

  async updateOrderStatus(orderId: string, newStatus: string) {
    // Validate status transition
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw { code: 'NOT_FOUND', message: 'Order not found', statusCode: 404 };
    }

    const validTransitions: Record<string, string[]> = {
      'PENDING': ['PREPARING'],
      'PREPARING': ['COMPLETED'],
      'COMPLETED': []
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw {
        code: 'INVALID_STATE_TRANSITION',
        message: `Cannot transition from ${order.status} to ${newStatus}`,
        statusCode: 400
      };
    }

    return await this.orderRepo.updateStatus(orderId, newStatus);
  }

  async deleteOrder(orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw { code: 'NOT_FOUND', message: 'Order not found', statusCode: 404 };
    }

    if (order.status !== 'PENDING') {
      throw {
        code: 'INVALID_REQUEST',
        message: 'Only PENDING orders can be deleted',
        statusCode: 400
      };
    }

    await this.orderRepo.delete(orderId);
  }
}
