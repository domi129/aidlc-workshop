# Admin Unit - Infrastructure Design

## Overview
Admin Unit의 AWS 인프라 리소스 구성을 정의합니다.

---

## 1. Lambda Functions

### 1.1 Admin API Lambda

**Function Configuration**:
```yaml
FunctionName: table-order-admin-api
Runtime: nodejs18.x
Handler: dist/index.handler
MemorySize: 256
Timeout: 30
Architecture: x86_64
```

**Environment Variables**:
```yaml
JWT_SECRET: ${SSM:/table-order/jwt-secret}
DYNAMODB_REGION: ap-northeast-2
S3_BUCKET: table-order-menu-images-${AWS::AccountId}
S3_REGION: ap-northeast-2
NODE_ENV: production
```

**IAM Role Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-northeast-2:*:table/Stores",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Admins",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Admins/index/*",
        "arn:aws:dynamodb:ap-northeast-2:*:table/AdminSessions",
        "arn:aws:dynamodb:ap-northeast-2:*:table/AdminSessions/index/*",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Tables",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Tables/index/*",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Orders",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Orders/index/*",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Menus",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Menus/index/*",
        "arn:aws:dynamodb:ap-northeast-2:*:table/OrderHistory",
        "arn:aws:dynamodb:ap-northeast-2:*:table/OrderHistory/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::table-order-menu-images-${AWS::AccountId}/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-northeast-2:*:log-group:/aws/lambda/table-order-admin-api:*"
    }
  ]
}
```

---

### 1.2 SSE Lambda

**Function Configuration**:
```yaml
FunctionName: table-order-admin-sse
Runtime: nodejs18.x
Handler: dist/index.handler
MemorySize: 256
Timeout: 900
Architecture: x86_64
InvokeMode: RESPONSE_STREAM
```

**Function URL Configuration**:
```yaml
AuthType: AWS_IAM
Cors:
  AllowOrigins: ['*']
  AllowMethods: ['GET']
  AllowHeaders: ['Authorization', 'Content-Type']
  MaxAge: 300
```

**Environment Variables**:
```yaml
JWT_SECRET: ${SSM:/table-order/jwt-secret}
DYNAMODB_REGION: ap-northeast-2
NODE_ENV: production
```

**IAM Role Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-northeast-2:*:table/Orders",
        "arn:aws:dynamodb:ap-northeast-2:*:table/Orders/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-northeast-2:*:log-group:/aws/lambda/table-order-admin-sse:*"
    }
  ]
}
```

---

## 2. API Gateway

### 2.1 REST API Configuration

**API Configuration**:
```yaml
Name: table-order-admin-api
EndpointType: REGIONAL
Protocol: HTTPS
```

**Stage Configuration**:
```yaml
StageName: prod
ThrottlingBurstLimit: 5000
ThrottlingRateLimit: 10000
```

**CORS Configuration**:
```yaml
AllowOrigins: ['*']
AllowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
AllowHeaders: ['Authorization', 'Content-Type']
```

---

### 2.2 Lambda Authorizer

**Authorizer Configuration**:
```yaml
Name: jwt-authorizer
Type: TOKEN
IdentitySource: method.request.header.Authorization
AuthorizerResultTtlInSeconds: 300
```

**Authorizer Lambda**:
```typescript
export const handler = async (event: any) => {
  const token = event.authorizationToken.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return {
      principalId: decoded.adminId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: event.methodArn
        }]
      },
      context: {
        adminId: decoded.adminId,
        storeId: decoded.storeId,
        sessionId: decoded.sessionId
      }
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
};
```

---

### 2.3 API Routes

**Route Definitions**:
```yaml
/auth/login:
  POST:
    Integration: Lambda (table-order-admin-api)
    Authorization: NONE

/auth/refresh:
  POST:
    Integration: Lambda (table-order-admin-api)
    Authorization: NONE

/orders:
  GET:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer

/orders/{orderId}/status:
  PATCH:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer

/orders/{orderId}:
  DELETE:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer

/tables/{tableId}/complete:
  POST:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer

/tables/{tableId}/history:
  GET:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer

/menus:
  GET:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer
  POST:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer

/menus/{menuId}:
  PUT:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer
  DELETE:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer

/menus/upload-url:
  POST:
    Integration: Lambda (table-order-admin-api)
    Authorization: jwt-authorizer
```

---

## 3. DynamoDB Tables

### 3.1 Stores Table

```yaml
TableName: Stores
BillingMode: PAY_PER_REQUEST
AttributeDefinitions:
  - AttributeName: storeId
    AttributeType: S
KeySchema:
  - AttributeName: storeId
    KeyType: HASH
PointInTimeRecoveryEnabled: false
SSEEnabled: true
SSEType: KMS (AWS managed)
```

---

### 3.2 Admins Table

```yaml
TableName: Admins
BillingMode: PAY_PER_REQUEST
AttributeDefinitions:
  - AttributeName: adminId
    AttributeType: S
  - AttributeName: storeId
    AttributeType: S
  - AttributeName: username
    AttributeType: S
KeySchema:
  - AttributeName: adminId
    KeyType: HASH
GlobalSecondaryIndexes:
  - IndexName: storeId-username-index
    KeySchema:
      - AttributeName: storeId
        KeyType: HASH
      - AttributeName: username
        KeyType: RANGE
    Projection:
      ProjectionType: ALL
PointInTimeRecoveryEnabled: false
SSEEnabled: true
```

---

### 3.3 AdminSessions Table

```yaml
TableName: AdminSessions
BillingMode: PAY_PER_REQUEST
AttributeDefinitions:
  - AttributeName: sessionId
    AttributeType: S
  - AttributeName: adminId
    AttributeType: S
KeySchema:
  - AttributeName: sessionId
    KeyType: HASH
GlobalSecondaryIndexes:
  - IndexName: adminId-index
    KeySchema:
      - AttributeName: adminId
        KeyType: HASH
    Projection:
      ProjectionType: ALL
TimeToLiveSpecification:
  Enabled: true
  AttributeName: expiresAt
PointInTimeRecoveryEnabled: false
SSEEnabled: true
```

---

### 3.4 Tables Table

```yaml
TableName: Tables
BillingMode: PAY_PER_REQUEST
AttributeDefinitions:
  - AttributeName: tableId
    AttributeType: S
  - AttributeName: storeId
    AttributeType: S
  - AttributeName: tableNumber
    AttributeType: S
KeySchema:
  - AttributeName: tableId
    KeyType: HASH
GlobalSecondaryIndexes:
  - IndexName: storeId-tableNumber-index
    KeySchema:
      - AttributeName: storeId
        KeyType: HASH
      - AttributeName: tableNumber
        KeyType: RANGE
    Projection:
      ProjectionType: ALL
PointInTimeRecoveryEnabled: false
SSEEnabled: true
```

---

### 3.5 Orders Table

```yaml
TableName: Orders
BillingMode: PAY_PER_REQUEST
AttributeDefinitions:
  - AttributeName: orderId
    AttributeType: S
  - AttributeName: storeId
    AttributeType: S
  - AttributeName: createdAt
    AttributeType: N
  - AttributeName: tableId
    AttributeType: S
  - AttributeName: sessionId
    AttributeType: S
KeySchema:
  - AttributeName: orderId
    KeyType: HASH
GlobalSecondaryIndexes:
  - IndexName: storeId-createdAt-index
    KeySchema:
      - AttributeName: storeId
        KeyType: HASH
      - AttributeName: createdAt
        KeyType: RANGE
    Projection:
      ProjectionType: ALL
  - IndexName: tableId-sessionId-index
    KeySchema:
      - AttributeName: tableId
        KeyType: HASH
      - AttributeName: sessionId
        KeyType: RANGE
    Projection:
      ProjectionType: ALL
PointInTimeRecoveryEnabled: false
SSEEnabled: true
```

---

### 3.6 Menus Table

```yaml
TableName: Menus
BillingMode: PAY_PER_REQUEST
AttributeDefinitions:
  - AttributeName: menuId
    AttributeType: S
  - AttributeName: storeId
    AttributeType: S
  - AttributeName: category
    AttributeType: S
KeySchema:
  - AttributeName: menuId
    KeyType: HASH
GlobalSecondaryIndexes:
  - IndexName: storeId-category-index
    KeySchema:
      - AttributeName: storeId
        KeyType: HASH
      - AttributeName: category
        KeyType: RANGE
    Projection:
      ProjectionType: ALL
PointInTimeRecoveryEnabled: false
SSEEnabled: true
```

---

### 3.7 OrderHistory Table

```yaml
TableName: OrderHistory
BillingMode: PAY_PER_REQUEST
AttributeDefinitions:
  - AttributeName: historyId
    AttributeType: S
  - AttributeName: tableId
    AttributeType: S
  - AttributeName: archivedAt
    AttributeType: N
KeySchema:
  - AttributeName: historyId
    KeyType: HASH
GlobalSecondaryIndexes:
  - IndexName: tableId-archivedAt-index
    KeySchema:
      - AttributeName: tableId
        KeyType: HASH
      - AttributeName: archivedAt
        KeyType: RANGE
    Projection:
      ProjectionType: ALL
TimeToLiveSpecification:
  Enabled: true
  AttributeName: expiresAt
PointInTimeRecoveryEnabled: false
SSEEnabled: true
```

---

## 4. S3 Bucket

### 4.1 Bucket Configuration

```yaml
BucketName: table-order-menu-images-${AWS::AccountId}
Region: ap-northeast-2
Versioning: Disabled
PublicAccessBlock:
  BlockPublicAcls: true
  BlockPublicPolicy: true
  IgnorePublicAcls: true
  RestrictPublicBuckets: true
Encryption:
  SSEAlgorithm: AES256
LifecycleConfiguration: None
```

### 4.2 CORS Configuration

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 4.3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowLambdaAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${AWS::AccountId}:role/table-order-admin-api-role"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::table-order-menu-images-${AWS::AccountId}/*"
    }
  ]
}
```

---

## 5. CloudWatch

### 5.1 Log Groups

**Admin API Lambda Logs**:
```yaml
LogGroupName: /aws/lambda/table-order-admin-api
RetentionInDays: 30
```

**SSE Lambda Logs**:
```yaml
LogGroupName: /aws/lambda/table-order-admin-sse
RetentionInDays: 30
```

---

## 6. Systems Manager Parameter Store

### 6.1 Parameters

**JWT Secret**:
```yaml
Name: /table-order/jwt-secret
Type: SecureString
Value: <generated-secret>
Description: JWT signing secret for admin authentication
```

---

## 7. Resource Summary

| Resource Type | Resource Name | Purpose |
|---------------|---------------|---------|
| Lambda | table-order-admin-api | Admin API 처리 |
| Lambda | table-order-admin-sse | SSE 스트리밍 |
| Lambda | jwt-authorizer | JWT 검증 |
| API Gateway | table-order-admin-api | REST API |
| DynamoDB | Stores | 매장 정보 |
| DynamoDB | Admins | 관리자 정보 |
| DynamoDB | AdminSessions | 관리자 세션 |
| DynamoDB | Tables | 테이블 정보 |
| DynamoDB | Orders | 주문 정보 |
| DynamoDB | Menus | 메뉴 정보 |
| DynamoDB | OrderHistory | 주문 이력 |
| S3 | table-order-menu-images | 메뉴 이미지 |
| CloudWatch | Log Groups (2) | Lambda 로그 |
| SSM | Parameter (1) | JWT Secret |

**Total Resources**: 17

---

## 8. Deployment Checklist

- [ ] Create S3 bucket for menu images
- [ ] Create DynamoDB tables (7 tables)
- [ ] Create SSM parameter for JWT secret
- [ ] Create IAM roles for Lambda functions
- [ ] Deploy Admin API Lambda
- [ ] Deploy SSE Lambda
- [ ] Create Lambda Function URL for SSE
- [ ] Deploy JWT Authorizer Lambda
- [ ] Create API Gateway REST API
- [ ] Configure API Gateway routes
- [ ] Configure API Gateway authorizer
- [ ] Deploy API Gateway stage
- [ ] Test API endpoints
- [ ] Test SSE connection

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Infrastructure Design 정의 완료
