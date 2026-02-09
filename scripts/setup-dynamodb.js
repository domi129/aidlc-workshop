const AWS = require('aws-sdk');

// Configure AWS SDK for local DynamoDB
AWS.config.update({
  region: 'ap-northeast-2',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy'
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

// Table definition
const tableParams = {
  TableName: 'TableOrderData',
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'storeId', AttributeType: 'S' },
    { AttributeName: 'tableId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'N' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'storeId-index',
      KeySchema: [
        { AttributeName: 'storeId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      IndexName: 'tableId-index',
      KeySchema: [
        { AttributeName: 'tableId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// Initial data
const initialData = [
  // Store
  {
    PK: 'STORE#STORE123',
    SK: 'METADATA',
    storeId: 'STORE123',
    storeName: '테스트 레스토랑',
    createdAt: Date.now()
  },
  // Tables
  {
    PK: 'TABLE#T001',
    SK: 'METADATA',
    tableId: 'T001',
    storeId: 'STORE123',
    tableNumber: 'T001',
    tablePassword: '1234',
    createdAt: Date.now()
  },
  {
    PK: 'TABLE#T002',
    SK: 'METADATA',
    tableId: 'T002',
    storeId: 'STORE123',
    tableNumber: 'T002',
    tablePassword: '1234',
    createdAt: Date.now()
  },
  {
    PK: 'TABLE#T003',
    SK: 'METADATA',
    tableId: 'T003',
    storeId: 'STORE123',
    tableNumber: 'T003',
    tablePassword: '1234',
    createdAt: Date.now()
  },
  // Menus
  {
    PK: 'MENU#menu-001',
    SK: 'METADATA',
    menuId: 'menu-001',
    storeId: 'STORE123',
    menuName: '김치찌개',
    price: 8000,
    description: '얼큰한 김치찌개',
    category: '메인',
    imageUrl: 'https://via.placeholder.com/300x200?text=김치찌개',
    displayOrder: 1,
    isAvailable: true,
    createdAt: Date.now()
  },
  {
    PK: 'MENU#menu-002',
    SK: 'METADATA',
    menuId: 'menu-002',
    storeId: 'STORE123',
    menuName: '된장찌개',
    price: 7000,
    description: '구수한 된장찌개',
    category: '메인',
    imageUrl: 'https://via.placeholder.com/300x200?text=된장찌개',
    displayOrder: 2,
    isAvailable: true,
    createdAt: Date.now()
  },
  {
    PK: 'MENU#menu-003',
    SK: 'METADATA',
    menuId: 'menu-003',
    storeId: 'STORE123',
    menuName: '제육볶음',
    price: 9000,
    description: '매콤한 제육볶음',
    category: '메인',
    imageUrl: 'https://via.placeholder.com/300x200?text=제육볶음',
    displayOrder: 3,
    isAvailable: true,
    createdAt: Date.now()
  },
  {
    PK: 'MENU#menu-004',
    SK: 'METADATA',
    menuId: 'menu-004',
    storeId: 'STORE123',
    menuName: '계란말이',
    price: 5000,
    description: '부드러운 계란말이',
    category: '사이드',
    imageUrl: 'https://via.placeholder.com/300x200?text=계란말이',
    displayOrder: 4,
    isAvailable: true,
    createdAt: Date.now()
  },
  {
    PK: 'MENU#menu-005',
    SK: 'METADATA',
    menuId: 'menu-005',
    storeId: 'STORE123',
    menuName: '김치전',
    price: 6000,
    description: '바삭한 김치전',
    category: '사이드',
    imageUrl: 'https://via.placeholder.com/300x200?text=김치전',
    displayOrder: 5,
    isAvailable: true,
    createdAt: Date.now()
  },
  {
    PK: 'MENU#menu-006',
    SK: 'METADATA',
    menuId: 'menu-006',
    storeId: 'STORE123',
    menuName: '콜라',
    price: 2000,
    description: '시원한 콜라',
    category: '음료',
    imageUrl: 'https://via.placeholder.com/300x200?text=콜라',
    displayOrder: 6,
    isAvailable: true,
    createdAt: Date.now()
  },
  {
    PK: 'MENU#menu-007',
    SK: 'METADATA',
    menuId: 'menu-007',
    storeId: 'STORE123',
    menuName: '사이다',
    price: 2000,
    description: '시원한 사이다',
    category: '음료',
    imageUrl: 'https://via.placeholder.com/300x200?text=사이다',
    displayOrder: 7,
    isAvailable: true,
    createdAt: Date.now()
  },
  // Admin user
  {
    PK: 'ADMIN#admin-001',
    SK: 'METADATA',
    adminId: 'admin-001',
    storeId: 'store-001',
    username: 'admin1',
    // Password: "password123" - in real app, use bcrypt
    passwordHash: '$2b$10$rXK5Z5Z5Z5Z5Z5Z5Z5Z5ZuqK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    role: 'Admin',
    createdAt: Date.now()
  }
];

async function setupDynamoDB() {
  try {
    console.log('🔧 Setting up DynamoDB Local...\n');

    // Check if table exists
    try {
      await dynamodb.describeTable({ TableName: 'TableOrderData' }).promise();
      console.log('⚠️  Table already exists. Deleting...');
      await dynamodb.deleteTable({ TableName: 'TableOrderData' }).promise();
      console.log('✅ Table deleted');
      // Wait for table to be deleted
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      if (err.code !== 'ResourceNotFoundException') {
        throw err;
      }
    }

    // Create table
    console.log('📋 Creating table...');
    await dynamodb.createTable(tableParams).promise();
    console.log('✅ Table created');

    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await dynamodb.waitFor('tableExists', { TableName: 'TableOrderData' }).promise();
    console.log('✅ Table is active');

    // Insert initial data
    console.log('\n📝 Inserting initial data...');
    for (const item of initialData) {
      await docClient.put({
        TableName: 'TableOrderData',
        Item: item
      }).promise();
      console.log(`  ✅ Inserted: ${item.PK}`);
    }

    console.log('\n🎉 DynamoDB setup complete!');
    console.log('\n📊 Initial data summary:');
    console.log('  - 1 Store (STORE123)');
    console.log('  - 3 Tables (T001, T002, T003) - Password: 1234');
    console.log('  - 7 Menus (3 메인, 2 사이드, 2 음료)');
    console.log('  - 1 Admin (admin1) - Password: password123');
    console.log('\n🔗 DynamoDB Local endpoint: http://localhost:8000');

  } catch (error) {
    console.error('❌ Error setting up DynamoDB:', error);
    process.exit(1);
  }
}

setupDynamoDB();
