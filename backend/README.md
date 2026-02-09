# Table Order Service - Backend

Lambda 서버리스 백엔드입니다.

## Lambda Functions

### Auth Function
- **Path**: `functions/auth/`
- **Endpoints**: 
  - `POST /auth/table-login`
  - `POST /auth/refresh`
- **User Story**: US-001

### Menus Function
- **Path**: `functions/menus/`
- **Endpoints**: `GET /menus`
- **User Story**: US-002

### Orders Create Function
- **Path**: `functions/orders-create/`
- **Endpoints**: `POST /orders`
- **User Story**: US-004

### Orders List Function
- **Path**: `functions/orders-list/`
- **Endpoints**: `GET /orders`
- **User Story**: US-005

### WebSocket Functions
- **Connect**: `functions/websocket-connect/`
- **Disconnect**: `functions/websocket-disconnect/`
- **Message**: `functions/websocket-message/`

### Stream Processor Function
- **Path**: `functions/stream-processor/`
- **Trigger**: DynamoDB Streams
- **User Story**: US-006

## 배포 방법

### 개별 Lambda 배포
```bash
cd functions/auth
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
    JWT_REFRESH_EXPIRATION=30d
  }"
```

## 로컬 테스트

AWS SAM Local 사용:
```bash
sam local start-api
```

## 문서

자세한 API 문서는 `aidlc-docs/construction/customer-unit/code/api-documentation.md`를 참조하세요.
