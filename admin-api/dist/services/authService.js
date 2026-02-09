"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const adminRepository_1 = require("../repositories/adminRepository");
const aws_sdk_1 = require("aws-sdk");
const dynamodb = new aws_sdk_1.DynamoDB.DocumentClient({ region: process.env.DYNAMODB_REGION });
class AuthService {
    adminRepo = new adminRepository_1.AdminRepository();
    async login(username, password, storeId) {
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
        const sessionId = (0, uuid_1.v4)();
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
        const token = jwt.sign({ adminId: admin.adminId, storeId: admin.storeId, sessionId }, process.env.JWT_SECRET, { expiresIn: '16h' });
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
    async refreshToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
            // Check session still valid
            const session = await dynamodb.get({
                TableName: 'AdminSessions',
                Key: { sessionId: decoded.sessionId }
            }).promise();
            if (!session.Item || session.Item.expiresAt < Date.now()) {
                throw { code: 'UNAUTHORIZED', message: 'Session expired', statusCode: 401 };
            }
            // Generate new token
            const newToken = jwt.sign({ adminId: decoded.adminId, storeId: decoded.storeId, sessionId: decoded.sessionId }, process.env.JWT_SECRET, { expiresIn: '16h' });
            const newExpiresAt = Date.now() + 16 * 60 * 60 * 1000;
            // Update session expiry
            await dynamodb.update({
                TableName: 'AdminSessions',
                Key: { sessionId: decoded.sessionId },
                UpdateExpression: 'SET expiresAt = :expiresAt',
                ExpressionAttributeValues: { ':expiresAt': newExpiresAt }
            }).promise();
            return { token: newToken, expiresAt: newExpiresAt };
        }
        catch (error) {
            throw { code: 'UNAUTHORIZED', message: 'Invalid token', statusCode: 401 };
        }
    }
}
exports.AuthService = AuthService;
