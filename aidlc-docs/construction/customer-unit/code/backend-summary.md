# Customer Unit - Backend Code Summary

## 생성된 파일 목록

### Shared Utilities
- ✅ `backend/shared/utils/dynamodbClient.js` - DynamoDB 클라이언트
- ✅ `backend/shared/utils/jwtUtils.js` - JWT 토큰 유틸리티
- ✅ `backend/shared/utils/responseUtils.js` - HTTP 응답 유틸리티

### Lambda Functions
- ✅ `backend/functions/auth/index.js` - 인증 Lambda (US-001)
- ✅ `backend/functions/auth/package.json` - Auth Lambda 의존성
- ⏳ `backend/functions/menus/index.js` - 메뉴 조회 Lambda (US-002) - 생성 필요
- ⏳ `backend/functions/orders-create/index.js` - 주문 생성 Lambda (US-004) - 생성 필요
- ⏳ `backend/functions/orders-list/index.js` - 주문 내역 Lambda (US-005) - 생성 필요
- ⏳ `backend/functions/websocket-connect/index.js` - WebSocket 연결 Lambda - 생성 필요
- ⏳ `backend/functions/websocket-disconnect/index.js` - WebSocket 연결 해제 Lambda - 생성 필요
- ⏳ `backend/functions/websocket-message/index.js` - WebSocket 메시지 Lambda - 생성 필요
- ⏳ `backend/functions/stream-processor/index.js` - DynamoDB Streams Lambda (US-006) - 생성 필요

## 미생성 Lambda 함수 가이드

### Menus Lambda 구현 가이드
```javascript
// backend/functions/menus/index.js
const DynamoDBClient = require('../../shared/utils/dynamodbClient');
const ResponseUtils = require('../../shared/utils/responseUtils');

exports.handler = async (event) => {
  try {
    const { storeId, category } = event.queryStringParameters || {};

    if (!storeId) {
      return ResponseUtils.error('Missing storeId', 400);
    }

    // Query menus by storeId
    let menus = await DynamoDBClient.query(
      'storeId = :storeId',
      { ':storeId': storeId },
      'storeId-index'
    );

    // Filter by PK starting with MENU#
    menus = menus.filter(item => item.PK.startsWith('MENU#'));

    // Filter by category if provided
    if (category && category !== '전체') {
      menus = menus.filter(menu => menu.category === category);
    }

    // Filter only available menus
    menus = menus.filter(menu => menu.isAvailable);

    // Sort by displayOrder
    menus.sort((a, b) => a.displayOrder - b.displayOrder);

    return ResponseUtils.success(menus);
  } catch (error) {
    console.error('Error:', error);
    return ResponseUtils.error(error.message, 500);
  }
};
```

### Orders Create Lambda 구현 가이드
```javascript
// backend/functions/orders-create/index.js
const DynamoDBClient = require('../../shared/utils/dynamodbClient');
const ResponseUtils = require('../../shared/utils/responseUtils');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { storeId, tableId, sessionId, items, totalAmount } = body;

    // Validate request
    if (!storeId || !tableId || !sessionId || !items || items.length === 0) {
      return ResponseUtils.error('Missing required fields', 400);
    }

    // Verify menu prices
    for (const item of items) {
      const menu = await DynamoDBClient.get(`MENU#${item.menuId}`, 'METADATA');
      if (!menu) {
        return ResponseUtils.error(`Menu ${item.menuId} not found`, 404);
      }
      if (!menu.isAvailable) {
        return ResponseUtils.error(`Menu ${menu.menuName} is not available`, 400);
      }
      if (menu.price !== item.price) {
        return ResponseUtils.error('Price mismatch', 400);
      }
    }

    // Generate order ID and number
    const orderId = uuidv4();
    const orderNumber = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-3)}`;

    // Create order
    const order = {
      PK: `ORDER#${orderId}`,
      SK: 'METADATA',
      orderId,
      orderNumber,
      storeId,
      tableId,
      sessionId,
      items: items.map(item => ({
        menuId: item.menuId,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await DynamoDBClient.put(order);

    return ResponseUtils.success({
      orderId,
      orderNumber,
      createdAt: order.createdAt
    }, 201);
  } catch (error) {
    console.error('Error:', error);
    return ResponseUtils.error(error.message, 500);
  }
};
```

### Stream Processor Lambda 구현 가이드
```javascript
// backend/functions/stream-processor/index.js
const AWS = require('aws-sdk');
const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

exports.handler = async (event) => {
  console.log('Stream event:', JSON.stringify(event));

  for (const record of event.Records) {
    if (record.eventName === 'MODIFY') {
      const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      const oldImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);

      // Check if order status changed
      if (newImage.PK.startsWith('ORDER#') && newImage.status !== oldImage.status) {
        await notifyOrderStatusChange(newImage);
      }
    }
  }

  return { statusCode: 200 };
};

async function notifyOrderStatusChange(order) {
  // Get connections for this table
  const connections = await getConnectionsByTableId(order.tableId);

  const message = JSON.stringify({
    action: 'orderStatusChanged',
    data: {
      orderId: order.orderId,
      status: order.status,
      updatedAt: order.updatedAt
    }
  });

  // Send message to all connections
  for (const connection of connections) {
    try {
      await apigatewaymanagementapi.postToConnection({
        ConnectionId: connection.connectionId,
        Data: message
      }).promise();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }
}
```

## Lambda 배포 가이드

### 개별 Lambda 배포
```bash
cd backend/functions/auth
npm install --production
zip -r function.zip .
aws lambda update-function-code \
  --function-name table-order-auth \
  --zip-file fileb://function.zip
```

### 환경 변수 설정
```bash
aws lambda update-function-configuration \
  --function-name table-order-auth \
  --environment Variables="{
    DYNAMODB_TABLE_NAME=table-order-data,
    JWT_SECRET=your-secret-key,
    JWT_ACCESS_EXPIRATION=16h,
    JWT_REFRESH_EXPIRATION=30d,
    AWS_REGION=ap-northeast-2
  }"
```

### IAM Role 설정
Lambda 실행 역할에 다음 권한 필요:
- DynamoDB: GetItem, PutItem, UpdateItem, Query
- CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents
- API Gateway: ManageConnections (WebSocket용)

## API 엔드포인트

### REST API
- `POST /auth/table-login` - 테이블 로그인
- `POST /auth/refresh` - 토큰 갱신
- `GET /menus` - 메뉴 조회
- `POST /orders` - 주문 생성
- `GET /orders` - 주문 내역 조회

### WebSocket API
- `$connect` - WebSocket 연결
- `$disconnect` - WebSocket 연결 해제
- `$default` - 메시지 처리 (ping/pong)

## User Stories 구현 상태

| Story | Lambda Function | 상태 |
|-------|----------------|------|
| US-001: 테이블 자동 로그인 | auth | ✅ 완료 |
| US-002: 메뉴 조회 및 필터링 | menus | ⏳ 생성 필요 |
| US-004: 주문 생성 | orders-create | ⏳ 생성 필요 |
| US-005: 주문 내역 조회 | orders-list | ⏳ 생성 필요 |
| US-006: 실시간 주문 상태 업데이트 | websocket-*, stream-processor | ⏳ 생성 필요 |

## 다음 단계

1. 미생성 Lambda 함수 구현
2. API Gateway 설정
3. DynamoDB 테이블 생성 및 GSI 설정
4. Lambda 함수 배포 및 테스트
5. WebSocket API 설정 및 테스트

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: 부분 완료 (핵심 파일 생성됨)
