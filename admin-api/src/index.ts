import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authHandler } from './handlers/authHandler';
import { orderHandler } from './handlers/orderHandler';
import { tableHandler } from './handlers/tableHandler';
import { menuHandler } from './handlers/menuHandler';
import { handleError } from './utils/errorHandler';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;

    // Route to appropriate handler
    if (path.startsWith('/auth')) {
      return await authHandler(event);
    } else if (path.startsWith('/orders')) {
      return await orderHandler(event);
    } else if (path.startsWith('/tables')) {
      return await tableHandler(event);
    } else if (path.startsWith('/menus')) {
      return await menuHandler(event);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
    };
  } catch (error) {
    return handleError(error);
  }
};
