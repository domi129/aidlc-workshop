import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TableService } from '../services/tableService';
import { successResponse, errorResponse } from '../utils/responseFormatter';
import { verifyAuth } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/rbacMiddleware';

const tableService = new TableService();

export const tableHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters, queryStringParameters } = event;

  try {
    const admin = await verifyAuth(event);

    if (path.match(/\/tables\/[^/]+\/complete/) && httpMethod === 'POST') {
      checkRole(admin, ['Admin', 'Manager']);
      const tableId = pathParameters?.tableId;
      const body = JSON.parse(event.body || '{}');
      const { sessionId } = body;

      await tableService.completeSession(tableId!, sessionId);
      return successResponse({ success: true });
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
