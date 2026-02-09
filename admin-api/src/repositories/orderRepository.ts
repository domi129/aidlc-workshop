import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient({ region: process.env.DYNAMODB_REGION });

export class OrderRepository {
  private tableName = 'Orders';

  async findByStore(storeId: string) {
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

  async findById(orderId: string) {
    const result = await dynamodb.get({
      TableName: this.tableName,
      Key: { orderId }
    }).promise();

    return result.Item;
  }

  async updateStatus(orderId: string, newStatus: string) {
    const now = Date.now();
    const updateExpression = newStatus === 'COMPLETED'
      ? 'SET #status = :status, updatedAt = :updatedAt, completedAt = :completedAt'
      : 'SET #status = :status, updatedAt = :updatedAt';

    const expressionAttributeValues: any = {
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

  async delete(orderId: string) {
    await dynamodb.delete({
      TableName: this.tableName,
      Key: { orderId }
    }).promise();
  }
}
