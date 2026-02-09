import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { AdminRepository } from '../repositories/adminRepository';

const adminRepo = new AdminRepository();

export async function verifyAuth(event: APIGatewayProxyEvent): Promise<any> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw { code: 'UNAUTHORIZED', message: 'No authorization header', statusCode: 401 };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    
    // Get admin details
    const admin = await adminRepo.findById(decoded.adminId);
    if (!admin) {
      throw { code: 'UNAUTHORIZED', message: 'Admin not found', statusCode: 401 };
    }

    return admin;
  } catch (error) {
    throw { code: 'UNAUTHORIZED', message: 'Invalid token', statusCode: 401 };
  }
}
