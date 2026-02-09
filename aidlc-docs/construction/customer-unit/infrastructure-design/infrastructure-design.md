# Customer Unit - Infrastructure Design

## Overview
Customer Unit의 논리적 컴포넌트를 AWS 서버리스 인프라 서비스에 매핑합니다.

---

## 1. Architecture Overview

### 1.1 Architecture Pattern

**선택**: Serverless Architecture (Lambda + API Gateway + DynamoDB)

**아키텍처 다이어그램**:
```
[고객 브라우저]
    ↓ HTTPS
[CloudFront] ← S3 (프론트엔드 정적 파일)
    ↓
[React SPA]
    ↓ HTTPS/WSS
[API Gateway]
    ├─ REST API (주문 생성, 메뉴 조회 등)
    │   ↓
    │  [Lambda Functions]
    │       ↓
    │  [DynamoDB (단일 테이블)]
    │
    └─ WebSocket API (실시간 주문 상태 업데이트)
        ↓
       [Lambda Functions]
           ↓
       [DynamoDB Streams]
```

**주요 특징**:
- 완전 서버리스 (서버 관리 불필요)
- 자동 확장 (트래픽에 따라 자동 조정)
- 사용량 기반 과금 (비용 효율적)
- 고가용성 (Multi-AZ 자동 배포)

---

## 2. Compute Infrastructure

### 2.1 Frontend Hosting

**서비스**: AWS S3 + CloudFront

**구성**:
- **S3 Bucket**: `table-order-frontend`
  - 용도: React 빌드 파일 호스팅 (HTML, CSS, JS, 이미지)
  - 설정: Static Website Hosting 활성화
  - 권한: Public Read 허용 (CloudFront를 통해서만 접근)

- **CloudFront Distribution**:
  - Origin: S3 Bucket
  - Default Root Object: `index.html`
  - Error Pages: 404 → `/index.html` (SPA 라우팅 지원)
  - Cache Behavior: 
    - HTML: No Cache (항상 최신 버전)
    - JS/CSS: 1년 캐싱 (파일명에 해시 포함)
    - 이미지: 1주일 캐싱
  - HTTPS: ACM 인증서 사용

**배포 프로세스**:
1. `npm run build` (Vite 빌드)
2. `aws s3 sync dist/ s3://table-order-frontend/`
3. `aws cloudfront create-invalidation` (캐시 무효화)

### 2.2 Backend Compute

**서비스**: AWS Lambda

**Lambda Functions**:

| Function Name | Trigger | Runtime | Memory | Timeout | Description |
|--------------|---------|---------|--------|---------|-------------|
| `table-order-auth` | API Gateway | Node.js 18 | 256MB | 10s | 테이블 로그인, 토큰 갱신 |
| `table-order-menus` | API Gateway | Node.js 18 | 256MB | 10s | 메뉴 조회, 카테고리 필터링 |
| `table-order-orders-create` | API Gateway | Node.js 18 | 512MB | 15s | 주문 생성 |
| `table-order-orders-list` | API Gateway | Node.js 18 | 256MB | 10s | 주문 내역 조회 |
| `table-order-websocket-connect` | API Gateway WS | Node.js 18 | 128MB | 5s | WebSocket 연결 |
| `table-order-websocket-disconnect` | API Gateway WS | Node.js 18 | 128MB | 5s | WebSocket 연결 해제 |
| `table-order-websocket-message` | API Gateway WS | Node.js 18 | 128MB | 5s | WebSocket 메시지 처리 |
| `table-order-stream-processor` | DynamoDB Streams | Node.js 18 | 256MB | 10s | 주문 상태 변경 이벤트 처리 |

**Lambda 설정**:
- **Environment Variables**: 
  - `DYNAMODB_TABLE_NAME`: `table-order-data`
  - `JWT_SECRET`: (Secrets Manager에서 로드)
  - `JWT_ACCESS_EXPIRATION`: `16h`
  - `JWT_REFRESH_EXPIRATION`: `30d`
  
- **IAM Role**: `table-order-lambda-role`
  - DynamoDB: Read/Write 권한
  - CloudWatch Logs: Write 권한
  - API Gateway: WebSocket 메시지 전송 권한

- **VPC**: Default VPC 사용 (VPC 내부 배포 불필요)

**Auto Scaling**:
- Lambda는 자동으로 확장 (동시 실행 수 제한 없음)
- Reserved Concurrency: 설정 안 함 (초기 버전)

---

## 3. Storage Infrastructure

### 3.1 Primary Database

**서비스**: AWS DynamoDB

**테이블 설계**: Single Table Design

**테이블 이름**: `table-order-data`

**키 구조**:
- **Partition Key (PK)**: `string` - 엔티티 타입 + ID
- **Sort Key (SK)**: `string` - 메타데이터 또는 관계 정보

**엔티티별 키 패턴**:

| Entity | PK | SK | Attributes |
|--------|----|----|------------|
| Store | `STORE#<storeId>` | `METADATA` | storeName, address, phone, createdAt |
| Table | `TABLE#<tableId>` | `METADATA` | storeId, tableNumber, tablePassword, sessionId, sessionStartedAt |
| Menu | `MENU#<menuId>` | `METADATA` | storeId, menuName, price, description, imageUrl, category, isAvailable |
| Order | `ORDER#<orderId>` | `METADATA` | storeId, tableId, sessionId, items, totalAmount, status, createdAt |
| Session | `SESSION#<sessionId>` | `METADATA` | tableId, storeId, startedAt, endedAt, totalOrders, totalAmount |

**Global Secondary Indexes (GSI)**:

1. **GSI-1: storeId-index**
   - Partition Key: `storeId`
   - Sort Key: `createdAt`
   - 용도: 매장별 데이터 조회 (메뉴, 주문 등)

2. **GSI-2: sessionId-index**
   - Partition Key: `sessionId`
   - Sort Key: `createdAt`
   - 용도: 세션별 주문 조회

3. **GSI-3: tableId-sessionId-index**
   - Partition Key: `tableId`
   - Sort Key: `sessionId`
   - 용도: 테이블별 세션 조회

**용량 모드**: On-Demand
- 자동 확장
- 사용량 기반 과금
- 초기 버전에 적합

**DynamoDB Streams**:
- 활성화: Yes
- Stream View Type: `NEW_AND_OLD_IMAGES`
- 용도: 주문 상태 변경 이벤트를 Lambda로 전송 (WebSocket 알림)

**백업 전략**:
- 초기 버전: 백업 없음
- 향후 계획: DynamoDB PITR (Point-in-Time Recovery) 활성화

### 3.2 Static File Storage

**서비스**: AWS S3

**버킷 구조**:

1. **Frontend Bucket**: `table-order-frontend`
   - 용도: React 빌드 파일
   - 권한: CloudFront OAI (Origin Access Identity)만 접근 가능
   - Versioning: 비활성화

2. **Images Bucket**: `table-order-images`
   - 용도: 메뉴 이미지 저장
   - 권한: Public Read
   - Lifecycle Policy: 90일 후 Glacier로 이동 (선택사항)

**S3 설정**:
- **Encryption**: AES-256 (기본 암호화)
- **CORS**: 
  ```json
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
  ```

---

## 4. Networking Infrastructure

### 4.1 API Gateway

**서비스**: AWS API Gateway

**API 구성**:

1. **REST API**: `table-order-api`
   - Endpoint Type: Regional
   - Stage: `prod`
   - Base URL: `https://<api-id>.execute-api.ap-northeast-2.amazonaws.com/prod`

**REST API 엔드포인트**:

| Method | Path | Lambda Function | Auth |
|--------|------|-----------------|------|
| POST | `/auth/table-login` | `table-order-auth` | None |
| POST | `/auth/refresh` | `table-order-auth` | None |
| GET | `/menus` | `table-order-menus` | JWT |
| POST | `/orders` | `table-order-orders-create` | JWT |
| GET | `/orders` | `table-order-orders-list` | JWT |

**API Gateway 설정**:
- **Throttling**: 
  - Rate Limit: 1000 requests/second
  - Burst Limit: 2000 requests
- **CORS**: 
  - Allowed Origins: `*`
  - Allowed Methods: `GET, POST, PUT, DELETE, OPTIONS`
  - Allowed Headers: `Content-Type, Authorization`
- **Request Validation**: 
  - Body 검증 활성화
  - Query String 검증 활성화

2. **WebSocket API**: `table-order-websocket`
   - Endpoint Type: Regional
   - Stage: `prod`
   - WebSocket URL: `wss://<api-id>.execute-api.ap-northeast-2.amazonaws.com/prod`

**WebSocket Routes**:

| Route | Lambda Function | Description |
|-------|-----------------|-------------|
| `$connect` | `table-order-websocket-connect` | 연결 시 인증 및 connectionId 저장 |
| `$disconnect` | `table-order-websocket-disconnect` | 연결 해제 시 connectionId 삭제 |
| `$default` | `table-order-websocket-message` | 메시지 처리 (ping/pong) |

**WebSocket 연결 관리**:
- **Connection Table**: DynamoDB에 connectionId 저장
  - PK: `CONNECTION#<connectionId>`
  - SK: `METADATA`
  - Attributes: `tableId`, `sessionId`, `connectedAt`
- **TTL**: 2시간 (자동 삭제)

### 4.2 CDN

**서비스**: AWS CloudFront

**Distribution 구성**:

1. **Frontend Distribution**:
   - Origin: S3 Bucket (`table-order-frontend`)
   - Alternate Domain Names (CNAMEs): 없음 (초기 버전)
   - SSL Certificate: CloudFront Default Certificate
   - Price Class: Use All Edge Locations
   - Default Root Object: `index.html`
   - Error Pages:
     - 404 → `/index.html` (200 응답)
     - 403 → `/index.html` (200 응답)

**Cache Behavior**:
- **HTML Files** (`*.html`):
  - TTL: 0 (No Cache)
  - Cache-Control: `no-cache, no-store, must-revalidate`
  
- **JS/CSS Files** (`*.js`, `*.css`):
  - TTL: 31536000 (1년)
  - Cache-Control: `public, max-age=31536000, immutable`
  
- **Images** (`*.png`, `*.jpg`, `*.svg`):
  - TTL: 604800 (1주일)
  - Cache-Control: `public, max-age=604800`

### 4.3 DNS

**서비스**: 없음 (초기 버전)

**접근 방식**:
- CloudFront Distribution URL 직접 사용
- 예: `https://d1234567890abc.cloudfront.net`

**향후 계획**:
- Route 53으로 커스텀 도메인 설정
- 예: `https://order.example.com`

### 4.4 HTTPS/SSL

**서비스**: AWS Certificate Manager (ACM)

**인증서**:
- CloudFront Default Certificate 사용 (초기 버전)
- 향후: ACM에서 커스텀 도메인 인증서 발급

---

## 5. Real-time Communication

### 5.1 WebSocket Architecture

**구현 방식**: API Gateway WebSocket + Lambda + DynamoDB Streams

**데이터 흐름**:

```
[관리자] 주문 상태 변경
    ↓
[DynamoDB] Order 업데이트
    ↓
[DynamoDB Streams] 변경 이벤트 발생
    ↓
[Lambda: stream-processor] 이벤트 처리
    ↓
[DynamoDB] connectionId 조회 (해당 테이블의 연결)
    ↓
[API Gateway WebSocket] 메시지 전송
    ↓
[고객 브라우저] 실시간 업데이트
```

**WebSocket 메시지 형식**:

```json
// 서버 → 클라이언트 (주문 상태 변경)
{
  "action": "orderStatusChanged",
  "data": {
    "orderId": "order-001",
    "status": "preparing",
    "updatedAt": "2026-02-09T13:25:00Z"
  }
}

// 클라이언트 → 서버 (Ping)
{
  "action": "ping"
}

// 서버 → 클라이언트 (Pong)
{
  "action": "pong",
  "timestamp": "2026-02-09T13:25:00Z"
}
```

**연결 관리**:
- **연결 시**: JWT 토큰 검증 → connectionId 저장
- **연결 해제 시**: connectionId 삭제
- **Keep-Alive**: 클라이언트가 60초마다 ping 전송

**재연결 전략**:
- 연결 끊김 감지 시 3초 후 재연결 시도
- 최대 5회 재시도 (지수 백오프: 3s, 6s, 12s, 24s, 48s)

---

## 6. Security Infrastructure

### 6.1 VPC Configuration

**VPC**: Default VPC 사용

**이유**:
- Lambda는 VPC 외부에서 실행 (인터넷 접근 필요)
- DynamoDB는 VPC 외부 서비스 (VPC Endpoint 불필요)
- 초기 버전 단순화

**향후 계획**:
- Custom VPC 생성 (Public/Private Subnet 분리)
- Lambda를 Private Subnet에 배치
- VPC Endpoint로 DynamoDB 접근

### 6.2 Security Groups

**적용 대상**: 없음 (Lambda는 VPC 외부)

**향후 계획**:
- Lambda를 VPC 내부로 이동 시 보안 그룹 설정
- 최소 권한 원칙 (필요한 포트만 오픈)

### 6.3 IAM Roles and Policies

**Lambda Execution Role**: `table-order-lambda-role`

**Policies**:

1. **DynamoDB Access**:
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
        "arn:aws:dynamodb:ap-northeast-2:*:table/table-order-data",
        "arn:aws:dynamodb:ap-northeast-2:*:table/table-order-data/index/*"
      ]
    }
  ]
}
```

2. **CloudWatch Logs**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-northeast-2:*:log-group:/aws/lambda/table-order-*"
    }
  ]
}
```

3. **API Gateway WebSocket**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections"
      ],
      "Resource": "arn:aws:execute-api:ap-northeast-2:*:*/prod/POST/@connections/*"
    }
  ]
}
```

**S3 Bucket Policy** (Frontend):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity <OAI-ID>"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::table-order-frontend/*"
    }
  ]
}
```

### 6.4 Authentication and Authorization

**JWT 토큰**:
- Access Token: 16시간
- Refresh Token: 30일
- 저장 위치: LocalStorage (클라이언트)

**API Gateway Authorizer**:
- Type: Lambda Authorizer
- Token Source: `Authorization` 헤더
- Lambda Function: `table-order-auth` (JWT 검증)

**WebSocket 인증**:
- 연결 시 Query String으로 JWT 토큰 전달
- `$connect` 라우트에서 토큰 검증

---

## 7. Monitoring and Logging

### 7.1 CloudWatch Logs

**로그 그룹**: 초기 버전에서는 제외

**향후 계획**:
- Lambda 로그 그룹: `/aws/lambda/table-order-*`
- API Gateway 로그 그룹: `/aws/apigateway/table-order-api`
- 로그 보관 기간: 7일

### 7.2 CloudWatch Metrics

**메트릭**: 초기 버전에서는 제외

**향후 계획**:
- Lambda Invocations, Duration, Errors
- API Gateway 4XXError, 5XXError, Latency
- DynamoDB ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits

### 7.3 CloudWatch Alarms

**알람**: 초기 버전에서는 제외

**향후 계획**:
- Lambda Error Rate > 5%
- API Gateway 5XXError > 10 (5분 동안)
- DynamoDB Throttled Requests > 0

### 7.4 Dashboard

**대시보드**: 없음 (초기 버전)

**향후 계획**:
- CloudWatch Dashboard 생성
- 주요 메트릭 시각화 (API 응답 시간, 에러율, Lambda 실행 시간)

---

## 8. Deployment Architecture

### 8.1 Environment Strategy

**환경**: 단일 환경 (프로덕션만)

**이유**:
- 초기 버전 단순화
- 개발 환경은 로컬에서 실행

**향후 계획**:
- 개발 환경 추가 (별도 AWS 계정 또는 리전)
- 스테이징 환경 추가 (프로덕션 유사 환경)

### 8.2 CI/CD Pipeline

**배포 방식**: 수동 배포 (초기 버전)

**배포 절차**:

**Frontend**:
1. `npm run build` (로컬)
2. `aws s3 sync dist/ s3://table-order-frontend/`
3. `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`

**Backend (Lambda)**:
1. `npm install --production` (로컬)
2. `zip -r function.zip .` (Lambda 패키지)
3. `aws lambda update-function-code --function-name <name> --zip-file fileb://function.zip`

**향후 계획**:
- GitHub Actions 또는 AWS CodePipeline 도입
- 자동 빌드 및 배포
- 테스트 자동화

### 8.3 Deployment Strategy

**전략**: 단순 배포 (다운타임 허용)

**이유**:
- 초기 버전 단순화
- Lambda는 자동으로 새 버전 배포

**향후 계획**:
- Lambda Alias + Weighted Routing (Canary Deployment)
- API Gateway Stage 활용 (Blue-Green Deployment)

### 8.4 Configuration Management

**방식**: .env 파일 (수동 관리)

**환경 변수**:
```
# Lambda Environment Variables
DYNAMODB_TABLE_NAME=table-order-data
JWT_SECRET=<secret>
JWT_ACCESS_EXPIRATION=16h
JWT_REFRESH_EXPIRATION=30d
AWS_REGION=ap-northeast-2
```

**향후 계획**:
- AWS Systems Manager Parameter Store
- AWS Secrets Manager (민감 정보)

---

## 9. Cost Optimization

### 9.1 Cost Estimation

**월간 예상 비용** (10개 매장, 500개 테이블 기준):

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 1M requests, 256MB, 5s avg | $5 |
| API Gateway | 1M requests | $3.50 |
| DynamoDB | On-Demand, 10GB storage | $15 |
| S3 | 10GB storage, 100GB transfer | $3 |
| CloudFront | 100GB transfer | $8.50 |
| **Total** | | **$35/month** |

**비용 최적화 전략**: 초기 버전에서는 제외

**향후 계획**:
- Lambda Reserved Concurrency (예측 가능한 트래픽)
- DynamoDB Provisioned Capacity (일정한 트래픽)
- S3 Lifecycle Policy (오래된 파일 Glacier 이동)

### 9.2 Cost Monitoring

**모니터링**: 없음 (초기 버전)

**향후 계획**:
- AWS Cost Explorer 활용
- AWS Budgets 설정 (월 $50 초과 시 알림)

---

## 10. Disaster Recovery

### 10.1 Backup Strategy

**백업**: 없음 (초기 버전)

**향후 계획**:
- DynamoDB Point-in-Time Recovery (PITR) 활성화
- S3 Versioning 활성화
- Lambda 코드 버전 관리 (Git)

### 10.2 Recovery Time Objective (RTO)

**목표**: 4시간 이내

**복구 절차**:
1. 장애 감지 (CloudWatch Alarms)
2. 원인 분석 (CloudWatch Logs)
3. Lambda 함수 롤백 (이전 버전 배포)
4. DynamoDB 복원 (PITR 사용)
5. 서비스 재개

### 10.3 High Availability

**가용성**: 99.5% 목표

**구현**:
- Lambda: Multi-AZ 자동 배포
- DynamoDB: Multi-AZ 자동 복제
- API Gateway: Multi-AZ 자동 배포
- CloudFront: 글로벌 엣지 로케이션

---

## 11. Infrastructure as Code (IaC)

### 11.1 IaC Tool

**도구**: 없음 (초기 버전, 수동 설정)

**향후 계획**:
- AWS SAM (Serverless Application Model)
- AWS CDK (Cloud Development Kit)
- Terraform

### 11.2 IaC 구조 예시 (SAM)

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  # DynamoDB Table
  TableOrderData:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: table-order-data
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES

  # Lambda Function
  AuthFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: table-order-auth
      Runtime: nodejs18.x
      Handler: index.handler
      CodeUri: ./functions/auth
      MemorySize: 256
      Timeout: 10
      Environment:
        Variables:
          DYNAMODB_TABLE_NAME: !Ref TableOrderData
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref TableOrderData

  # API Gateway
  TableOrderApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: table-order-api
      StageName: prod
      Cors:
        AllowOrigin: "'*'"
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,Authorization'"
```

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 생성 완료
- **아키텍처**: Serverless (Lambda + API Gateway + DynamoDB)
