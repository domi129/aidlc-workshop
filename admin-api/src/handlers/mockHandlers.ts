import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  MockAuthService,
  MockOrderService,
  MockMenuService,
  MockTableService
} from '../mocks/mockServices';
import { successResponse, errorResponse } from '../utils/responseFormatter';
import { verifyAuthMock, checkRoleMock } from '../middleware/mockAuthMiddleware';

const authService = new MockAuthService();
const orderService = new MockOrderService();
const menuService = new MockMenuService();
const tableService = new MockTableService();

// Auth Handler
export const mockAuthHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;

  try {
    if (path === '/auth/login' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { username, password, storeId } = body;
      const result = await authService.login(username, password, storeId);
      return successResponse(result);
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

// Order Handler
export const mockOrderHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters } = event;

  try {
    const admin = await verifyAuthMock(event);

    if (path === '/orders' && httpMethod === 'GET') {
      const orders = await orderService.getOrdersByStore(admin.storeId);
      return successResponse(orders);
    }

    if (path.match(/\/orders\/[^/]+\/status/) && httpMethod === 'PATCH') {
      checkRoleMock(admin, ['Admin', 'Manager']);
      const orderId = pathParameters?.orderId;
      const body = JSON.parse(event.body || '{}');
      const order = await orderService.updateOrderStatus(orderId!, body.status);
      return successResponse(order);
    }

    if (path.match(/\/orders\/[^/]+$/) && httpMethod === 'DELETE') {
      checkRoleMock(admin, ['Admin']);
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

// Menu Handler
export const mockMenuHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters } = event;

  try {
    const admin = await verifyAuthMock(event);

    if (path === '/menus' && httpMethod === 'GET') {
      const menus = await menuService.getMenusByStore(admin.storeId);
      return successResponse(menus);
    }

    if (path === '/menus' && httpMethod === 'POST') {
      checkRoleMock(admin, ['Admin']);
      const body = JSON.parse(event.body || '{}');
      const menu = await menuService.createMenu({ ...body, storeId: admin.storeId });
      return successResponse(menu);
    }

    if (path.match(/\/menus\/[^/]+$/) && httpMethod === 'PUT') {
      checkRoleMock(admin, ['Admin']);
      const menuId = pathParameters?.menuId;
      const body = JSON.parse(event.body || '{}');
      const menu = await menuService.updateMenu(menuId!, body);
      return successResponse(menu);
    }

    if (path.match(/\/menus\/[^/]+$/) && httpMethod === 'DELETE') {
      checkRoleMock(admin, ['Admin']);
      const menuId = pathParameters?.menuId;
      await menuService.deleteMenu(menuId!);
      return successResponse({ success: true });
    }

    if (path === '/menus/upload-url' && httpMethod === 'POST') {
      checkRoleMock(admin, ['Admin']);
      const body = JSON.parse(event.body || '{}');
      const { fileName } = body;
      const result = await menuService.generateUploadUrl(admin.storeId, fileName);
      return successResponse(result);
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

// Table Handler
export const mockTableHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters, queryStringParameters } = event;

  try {
    const admin = await verifyAuthMock(event);

    if (path.match(/\/tables\/[^/]+\/complete/) && httpMethod === 'POST') {
      checkRoleMock(admin, ['Admin', 'Manager']);
      const tableId = pathParameters?.tableId;
      const body = JSON.parse(event.body || '{}');
      const { sessionId } = body;

      const result = await tableService.completeSession(tableId!, sessionId);
      return successResponse(result);
    }

    if (path.match(/\/tables\/[^/]+\/history/) && httpMethod === 'GET') {
      const tableId = pathParameters?.tableId;
      const { startDate, endDate, page, pageSize } = queryStringParameters || {};

      const history = await tableService.getOrderHistory(tableId!, {
        startDate,
        endDate,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20
      });
      return successResponse(history);
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
