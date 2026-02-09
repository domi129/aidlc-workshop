import { APIGatewayProxyEvent } from 'aws-lambda';
import { MockAuthService } from '../mocks/mockServices';

const mockAuthService = new MockAuthService();

export async function verifyAuthMock(event: APIGatewayProxyEvent) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader) {
    throw {
      code: 'UNAUTHORIZED',
      message: 'No authorization header',
      statusCode: 401
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const admin = await mockAuthService.verifyToken(token);

  return admin;
}

export function checkRoleMock(admin: any, allowedRoles: string[]) {
  if (!allowedRoles.includes(admin.role)) {
    throw {
      code: 'FORBIDDEN',
      message: 'Insufficient permissions',
      statusCode: 403
    };
  }
}
