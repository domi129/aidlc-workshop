import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MenuService } from '../services/menuService';
import { successResponse, errorResponse } from '../utils/responseFormatter';
import { verifyAuth } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/rbacMiddleware';

const menuService = new MenuService();

export const menuHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters } = event;

  try {
    const admin = await verifyAuth(event);

    if (path === '/menus' && httpMethod === 'GET') {
      const menus = await menuService.getMenusByStore(admin.storeId);
      return successResponse(menus);
    }

    if (path === '/menus' && httpMethod === 'POST') {
      checkRole(admin, ['Admin']);
      const body = JSON.parse(event.body || '{}');
      const menu = await menuService.createMenu({ ...body, storeId: admin.storeId });
      return successResponse(menu);
    }

    if (path.match(/\/menus\/[^/]+$/) && httpMethod === 'PUT') {
      checkRole(admin, ['Admin']);
      const menuId = pathParameters?.menuId;
      const body = JSON.parse(event.body || '{}');
      const menu = await menuService.updateMenu(menuId!, body);
      return successResponse(menu);
    }

    if (path.match(/\/menus\/[^/]+$/) && httpMethod === 'DELETE') {
      checkRole(admin, ['Admin']);
      const menuId = pathParameters?.menuId;
      await menuService.deleteMenu(menuId!);
      return successResponse({ success: true });
    }

    if (path === '/menus/upload-url' && httpMethod === 'POST') {
      checkRole(admin, ['Admin']);
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
