import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new DynamoDB.DocumentClient();

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';
const ORDER_HISTORY_TABLE = process.env.ORDER_HISTORY_TABLE || 'OrderHistory';
const TABLES_TABLE = process.env.TABLES_TABLE || 'Tables';

export interface Order {
  orderId: string;
  storeId: string;
  tableId: string;
  sessionId: string;
  orderNumber: number;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  menuId: string;
  menuName: string;
  quantity: number;
  price: number;
}

export interface OrderHistory {
  historyId: string;
  orderId: string;
  storeId: string;
  tableId: string;
  sessionId: string;
  orderNumber: number;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: number;
  completedAt: number;
  archivedAt: number;
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export class TableService {
  async completeSession(tableId: string, sessionId: string): Promise<void> {
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
    const orders = (ordersResult.Items || []) as Order[];

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
      const historyItem: OrderHistory = {
        historyId: uuidv4(),
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
    const newSessionId = uuidv4();
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

  async getOrderHistory(
    tableId: string,
    filters: HistoryFilters
  ): Promise<{ items: OrderHistory[]; total: number; page: number; pageSize: number }> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;

    let keyConditionExpression = 'tableId = :tableId';
    const expressionAttributeValues: any = {
      ':tableId': tableId
    };

    // Add date range filter if provided
    if (filters.startDate && filters.endDate) {
      keyConditionExpression += ' AND archivedAt BETWEEN :startDate AND :endDate';
      expressionAttributeValues[':startDate'] = new Date(filters.startDate).getTime();
      expressionAttributeValues[':endDate'] = new Date(filters.endDate).getTime();
    } else if (filters.startDate) {
      keyConditionExpression += ' AND archivedAt >= :startDate';
      expressionAttributeValues[':startDate'] = new Date(filters.startDate).getTime();
    } else if (filters.endDate) {
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
    const allItems = (result.Items || []) as OrderHistory[];

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
