const AWS = require('aws-sdk');

// Configure AWS SDK
const config = {
  region: process.env.AWS_REGION || 'ap-northeast-2'
};

// Use local DynamoDB if endpoint is specified
if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  config.accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'dummy';
  config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'dummy';
  console.log('🔧 Using DynamoDB Local:', process.env.DYNAMODB_ENDPOINT);
}

const dynamodb = new AWS.DynamoDB.DocumentClient(config);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'TableOrderData';

class DynamoDBClient {
  static async get(pk, sk) {
    const params = {
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    };

    const result = await dynamodb.get(params).promise();
    return result.Item;
  }

  static async put(item) {
    const params = {
      TableName: TABLE_NAME,
      Item: item
    };

    await dynamodb.put(params).promise();
    return item;
  }

  static async query(keyCondition, expressionAttributeValues, indexName = null) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionAttributeValues
    };

    if (indexName) {
      params.IndexName = indexName;
    }

    const result = await dynamodb.query(params).promise();
    return result.Items;
  }

  static async update(pk, sk, updateExpression, expressionAttributeValues) {
    const params = {
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  }

  static async delete(pk, sk) {
    const params = {
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    };

    await dynamodb.delete(params).promise();
  }
}

module.exports = DynamoDBClient;
