"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const aws_sdk_1 = require("aws-sdk");
const dynamodb = new aws_sdk_1.DynamoDB.DocumentClient({ region: process.env.DYNAMODB_REGION });
class OrderRepository {
    tableName = 'Orders';
    async findByStore(storeId) {
        const result = await dynamodb.query({
            TableName: this.tableName,
            IndexName: 'storeId-createdAt-index',
            KeyConditionExpression: 'storeId = :storeId',
            ExpressionAttributeValues: { ':storeId': storeId },
            ScanIndexForward: false,
            Limit: 100
        }).promise();
        return result.Items || [];
    }
    async findById(orderId) {
        const result = await dynamodb.get({
            TableName: this.tableName,
            Key: { orderId }
        }).promise();
        return result.Item;
    }
    async updateStatus(orderId, newStatus) {
        const now = Date.now();
        const updateExpression = newStatus === 'COMPLETED'
            ? 'SET #status = :status, updatedAt = :updatedAt, completedAt = :completedAt'
            : 'SET #status = :status, updatedAt = :updatedAt';
        const expressionAttributeValues = {
            ':status': newStatus,
            ':updatedAt': now
        };
        if (newStatus === 'COMPLETED') {
            expressionAttributeValues[':completedAt'] = now;
        }
        const result = await dynamodb.update({
            TableName: this.tableName,
            Key: { orderId },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        }).promise();
        return result.Attributes;
    }
    async delete(orderId) {
        await dynamodb.delete({
            TableName: this.tableName,
            Key: { orderId }
        }).promise();
    }
}
exports.OrderRepository = OrderRepository;
