import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderService } from '../services/orderService';
import { successResponse, errorResponse } from '../utils/responseFormatter';
import { verifyAuth } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/rbacMiddleware';

const orderService = new OrderService();

export const orderHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters } = event;

  try {
    // Verify authentication
    const admin = await verifyAuth(event);

    if (path === '/orders' && httpMethod === 'GET') {
      const orders = await orderService.getOrdersByStore(admin.storeId);
      return successResponse(orders);
    }

    if (path.match(/\/orders\/[^/]+\/status/) && httpMethod === 'PATCH') {
      checkRole(admin, ['Admin', 'Manager']);
      const orderId = pathParameters?.orderId;
      const body = JSON.parse(event.body || '{}');
      const { status } = body;

      const order = await orderService.updateOrderStatus(orderId!, status);
      return successResponse(order);
    }

    if (path.match(/\/orders\/[^/]+$/) && httpMethod === 'DELETE') {
      checkRole(admin, ['Admin']);
      const orderId = pathParameters?.orderId;

      await orderService.deleteOrder(orderId!);
      return successResponse({ success: true });
    }

    return errorResponse({
      code: 'NOT_FOUND',
      message: 'Route not found',
      statusCode: 404
    });
  } catch (error) {
    return errorResponse(error);
  }
};
