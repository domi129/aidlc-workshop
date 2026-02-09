"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableService = void 0;
const aws_sdk_1 = require("aws-sdk");
const uuid_1 = require("uuid");
const dynamodb = new aws_sdk_1.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';
const ORDER_HISTORY_TABLE = process.env.ORDER_HISTORY_TABLE || 'OrderHistory';
const TABLES_TABLE = process.env.TABLES_TABLE || 'Tables';
class TableService {
    async completeSession(tableId, sessionId) {
        // 1. Get all orders for this session
        const ordersParams = {
            TableName: ORDERS_TABLE,
            IndexName: 'tableId-sessionId-index',
            KeyConditionExpression: 'tableId = :tableId AND sessionId = :sessionId',
            ExpressionAttributeValues: {
                ':tableId': tableId,
                ':sessionId': sessionId
            }
        };
        const ordersResult = await dynamodb.query(ordersParams).promise();
        const orders = (ordersResult.Items || []);
        if (orders.length === 0) {
            throw {
                code: 'NO_ORDERS',
                message: 'No orders found for this session',
                statusCode: 404
            };
        }
        // 2. Move orders to OrderHistory
        const now = Date.now();
        for (const order of orders) {
            const historyItem = {
                historyId: (0, uuid_1.v4)(),
                orderId: order.orderId,
                storeId: order.storeId,
                tableId: order.tableId,
                sessionId: order.sessionId,
                orderNumber: order.orderNumber,
                items: order.items,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt,
                completedAt: order.updatedAt,
                archivedAt: now
            };
            await dynamodb.put({
                TableName: ORDER_HISTORY_TABLE,
                Item: historyItem
            }).promise();
            // 3. Delete order from Orders table
            await dynamodb.delete({
                TableName: ORDERS_TABLE,
                Key: { orderId: order.orderId }
            }).promise();
        }
        // 4. Update table with new session
        const newSessionId = (0, uuid_1.v4)();
        await dynamodb.update({
            TableName: TABLES_TABLE,
            Key: { tableId },
            UpdateExpression: 'SET currentSessionId = :newSessionId, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':newSessionId': newSessionId,
                ':updatedAt': now
            }
        }).promise();
    }
    async getOrderHistory(tableId, filters) {
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 20;
        let keyConditionExpression = 'tableId = :tableId';
        const expressionAttributeValues = {
            ':tableId': tableId
        };
        // Add date range filter if provided
        if (filters.startDate && filters.endDate) {
            keyConditionExpression += ' AND archivedAt BETWEEN :startDate AND :endDate';
            expressionAttributeValues[':startDate'] = new Date(filters.startDate).getTime();
            expressionAttributeValues[':endDate'] = new Date(filters.endDate).getTime();
        }
        else if (filters.startDate) {
            keyConditionExpression += ' AND archivedAt >= :startDate';
            expressionAttributeValues[':startDate'] = new Date(filters.startDate).getTime();
        }
        else if (filters.endDate) {
            keyConditionExpression += ' AND archivedAt <= :endDate';
            expressionAttributeValues[':endDate'] = new Date(filters.endDate).getTime();
        }
        const params = {
            TableName: ORDER_HISTORY_TABLE,
            IndexName: 'tableId-archivedAt-index',
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ScanIndexForward: false, // Sort by archivedAt descending
            Limit: pageSize * page // Get all items up to current page
        };
        const result = await dynamodb.query(params).promise();
        const allItems = (result.Items || []);
        // Calculate pagination
        const total = allItems.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const items = allItems.slice(startIndex, endIndex);
        return {
            items,
            total,
            page,
            pageSize
        };
    }
}
exports.TableService = TableService;
