import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AdminRepository } from '../repositories/adminRepository';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient({ region: process.env.DYNAMODB_REGION });

export class AuthService {
  private adminRepo = new AdminRepository();

  async login(username: string, password: string, storeId: string) {
    // Find admin
    const admin = await this.adminRepo.findByStoreAndUsername(storeId, username);
    if (!admin) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials', statusCode: 401 };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials', statusCode: 401 };
    }

    // Create session
    const sessionId = uuidv4();
    const expiresAt = Date.now() + 16 * 60 * 60 * 1000; // 16 hours

    await dynamodb.put({
      TableName: 'AdminSessions',
      Item: {
        sessionId,
        adminId: admin.adminId,
        storeId: admin.storeId,
        expiresAt,
        createdAt: Date.now()
      }
    }).promise();

    // Generate JWT
    const token = jwt.sign(
      { adminId: admin.adminId, storeId: admin.storeId, sessionId },
      process.env.JWT_SECRET!,
      { expiresIn: '16h' }
    );

    return {
      token,
      admin: {
        adminId: admin.adminId,
        username: admin.username,
        storeId: admin.storeId,
        role: admin.role
      },
      expiresAt
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true });
      
      // Check session still valid
      const session = await dynamodb.get({
        TableName: 'AdminSessions',
        Key: { sessionId: decoded.sessionId }
      }).promise();

      if (!session.Item || session.Item.expiresAt < Date.now()) {
        throw { code: 'UNAUTHORIZED', message: 'Session expired', statusCode: 401 };
      }

      // Generate new token
      const newToken = jwt.sign(
        { adminId: decoded.adminId, storeId: decoded.storeId, sessionId: decoded.sessionId },
        process.env.JWT_SECRET!,
        { expiresIn: '16h' }
      );

      const newExpiresAt = Date.now() + 16 * 60 * 60 * 1000;

      // Update session expiry
      await dynamodb.update({
        TableName: 'AdminSessions',
        Key: { sessionId: decoded.sessionId },
        UpdateExpression: 'SET expiresAt = :expiresAt',
        ExpressionAttributeValues: { ':expiresAt': newExpiresAt }
      }).promise();

      return { token: newToken, expiresAt: newExpiresAt };
    } catch (error) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid token', statusCode: 401 };
    }
  }
}
