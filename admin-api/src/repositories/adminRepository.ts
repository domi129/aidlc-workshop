import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient({ region: process.env.DYNAMODB_REGION });

export class AdminRepository {
  private tableName = 'Admins';

  async findById(adminId: string) {
    const result = await dynamodb.get({
      TableName: this.tableName,
      Key: { adminId }
    }).promise();

    return result.Item;
  }

  async findByStoreAndUsername(storeId: string, username: string) {
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
