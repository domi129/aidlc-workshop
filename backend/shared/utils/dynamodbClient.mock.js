const bcrypt = require('bcryptjs');

// Mock in-memory database
const mockDatabase = {
  tables: [
    {
      PK: 'TABLE#T001',
      SK: 'METADATA',
      storeId: 'STORE123',
      tableNumber: 'T001',
      tablePassword: bcrypt.hashSync('1234', 10), // Default password: 1234
      isActive: true,
      sessionId: null,
      sessionStartedAt: null
    },
    {
      PK: 'TABLE#T002',
      SK: 'METADATA',
      storeId: 'STORE123',
      tableNumber: 'T002',
      tablePassword: bcrypt.hashSync('1234', 10),
      isActive: true,
      sessionId: null,
      sessionStartedAt: null
    },
    {
      PK: 'TABLE#T003',
      SK: 'METADATA',
      storeId: 'STORE123',
      tableNumber: 'T003',
      tablePassword: bcrypt.hashSync('1234', 10),
      isActive: true,
      sessionId: null,
      sessionStartedAt: null
    }
  ]
};

class DynamoDBClientMock {
  async get(pk, sk) {
    console.log(`[Mock DynamoDB] GET: PK=${pk}, SK=${sk}`);
    const item = mockDatabase.tables.find(t => t.PK === pk && t.SK === sk);
    return item || null;
  }

  async put(item) {
    console.log(`[Mock DynamoDB] PUT:`, item);
    const index = mockDatabase.tables.findIndex(t => t.PK === item.PK && t.SK === item.SK);
    if (index >= 0) {
      mockDatabase.tables[index] = { ...mockDatabase.tables[index], ...item };
    } else {
      mockDatabase.tables.push(item);
    }
    return item;
  }

  async update(pk, sk, updateExpression, expressionAttributeValues) {
    console.log(`[Mock DynamoDB] UPDATE: PK=${pk}, SK=${sk}`);
    const item = mockDatabase.tables.find(t => t.PK === pk && t.SK === sk);
    if (!item) {
      throw new Error('Item not found');
    }

    // Simple update logic for sessionId and sessionStartedAt
    if (expressionAttributeValues[':sessionId']) {
      item.sessionId = expressionAttributeValues[':sessionId'];
    }
    if (expressionAttributeValues[':startedAt']) {
      item.sessionStartedAt = expressionAttributeValues[':startedAt'];
    }

    return item;
  }

  async query(keyConditionExpression, expressionAttributeValues, indexName) {
    console.log(`[Mock DynamoDB] QUERY: ${keyConditionExpression}, Index: ${indexName}`);
    
    if (indexName === 'storeId-index') {
      const storeId = expressionAttributeValues[':storeId'];
      return mockDatabase.tables.filter(t => t.storeId === storeId);
    }

    return [];
  }

  async delete(pk, sk) {
    console.log(`[Mock DynamoDB] DELETE: PK=${pk}, SK=${sk}`);
    const index = mockDatabase.tables.findIndex(t => t.PK === pk && t.SK === sk);
    if (index >= 0) {
      mockDatabase.tables.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = new DynamoDBClientMock();
