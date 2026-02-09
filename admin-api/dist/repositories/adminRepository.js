"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const aws_sdk_1 = require("aws-sdk");
const dynamodb = new aws_sdk_1.DynamoDB.DocumentClient({ region: process.env.DYNAMODB_REGION });
class AdminRepository {
    tableName = 'Admins';
    async findById(adminId) {
        const result = await dynamodb.get({
            TableName: this.tableName,
            Key: { adminId }
        }).promise();
        return result.Item;
    }
    async findByStoreAndUsername(storeId, username) {
        const result = await dynamodb.query({
            TableName: this.tableName,
            IndexName: 'storeId-username-index',
            KeyConditionExpression: 'storeId = :storeId AND username = :username',
            ExpressionAttributeValues: {
                ':storeId': storeId,
                ':username': username
            }
        }).promise();
        return result.Items?.[0];
    }
}
exports.AdminRepository = AdminRepository;
