import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../services/authService';
import { successResponse, errorResponse } from '../utils/responseFormatter';

const authService = new AuthService();

export const authHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;

  try {
    if (path === '/auth/login' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { username, password, storeId } = body;

      if (!username || !password || !storeId) {
        return errorResponse({
          code: 'INVALID_REQUEST',
          message: 'Missing required fields',
          statusCode: 400
        });
      }

      const result = await authService.login(username, password, storeId);
      return successResponse(result);
    }

    if (path === '/auth/refresh' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { token } = body;

      if (!token) {
        return errorResponse({
          code: 'INVALID_REQUEST',
          message: 'Token required',
          statusCode: 400
        });
      }

      const result = await authService.refreshToken(token);
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
