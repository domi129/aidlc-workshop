# Build Instructions - Customer Unit

## 개요

Customer Unit의 Frontend와 Backend를 빌드하고 배포하기 위한 상세 지침입니다.

---

## 1. Frontend 빌드

### 1.1 사전 요구사항

- Node.js 18.x 이상
- npm 9.x 이상
- AWS CLI (배포용)

### 1.2 의존성 설치

```bash
cd frontend
npm install
```

**예상 결과**: `node_modules/` 디렉토리 생성 및 모든 의존성 설치 완료

### 1.3 환경 변수 설정

`.env` 파일 생성:

```bash
# Development
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.ap-northeast-2.amazonaws.com/prod
VITE_WS_URL=wss://your-websocket-url.execute-api.ap-northeast-2.amazonaws.com/prod

# Production
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://ws.yourdomain.com
```

### 1.4 로컬 개발 서버 실행

```bash
npm run dev
```

**예상 결과**:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

브라우저에서 `http://localhost:5173` 접속하여 앱 확인

### 1.5 프로덕션 빌드

```bash
npm run build
```

**예상 결과**:
- `dist/` 디렉토리 생성
- 최적화된 정적 파일 생성 (HTML, CSS, JS)
- 빌드 성공 메시지 출력

**빌드 산출물**:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── favicon.ico
```

### 1.6 빌드 검증

```bash
npm run preview
```

**예상 결과**: 프로덕션 빌드를 로컬에서 미리보기 (http://localhost:4173)

### 1.7 S3 배포

```bash
# S3 버킷 생성 (최초 1회)
aws s3 mb s3://table-order-frontend --region ap-northeast-2

# 정적 웹사이트 호스팅 설정
aws s3 website s3://table-order-frontend \
  --index-document index.html \
  --error-document index.html

# 빌드 파일 업로드
aws s3 sync dist/ s3://table-order-frontend/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# index.html은 캐시 없이 업로드
aws s3 cp dist/index.html s3://table-order-frontend/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

# 버킷 정책 설정 (공개 읽기)
aws s3api put-bucket-policy \
  --bucket table-order-frontend \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::table-order-frontend/*"
    }]
  }'
```

### 1.8 CloudFront 배포 (선택사항)

```bash
# CloudFront 무효화 (캐시 갱신)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 2. Backend 빌드

### 2.1 사전 요구사항

- Node.js 18.x 이상
- AWS CLI
- AWS SAM CLI (선택사항 - IaC 배포용)

### 2.2 Lambda 함수별 빌드

각 Lambda 함수는 독립적으로 빌드 및 배포됩니다.

#### 2.2.1 Auth Lambda 빌드

```bash
cd backend/functions/auth
npm install --production

# 배포 패키지 생성
zip -r function.zip . -x "*.git*" -x "node_modules/aws-sdk/*"
```

**예상 결과**: `function.zip` 파일 생성 (약 1-2MB)

#### 2.2.2 기타 Lambda 함수 빌드

동일한 방식으로 각 Lambda 함수 빌드:

```bash
# Menus Lambda
cd backend/functions/menus
npm install --production
zip -r function.zip .

# Orders Create Lambda
cd backend/functions/orders-create
npm install --production
zip -r function.zip .

# Orders List Lambda
cd backend/functions/orders-list
npm install --production
zip -r function.zip .

# WebSocket Connect Lambda
cd backend/functions/websocket-connect
npm install --production
zip -r function.zip .

# WebSocket Disconnect Lambda
cd backend/functions/websocket-disconnect
npm install --production
zip -r function.zip .

# WebSocket Message Lambda
cd backend/functions/websocket-message
npm install --production
zip -r function.zip .

# Stream Processor Lambda
cd backend/functions/stream-processor
npm install --production
zip -r function.zip .
```

### 2.3 Lambda 함수 배포

#### 2.3.1 Lambda 함수 생성 (최초 1회)

```bash
# Auth Lambda 생성
aws lambda create-function \
  --function-name table-order-auth \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://backend/functions/auth/function.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{
    DYNAMODB_TABLE_NAME=table-order-data,
    JWT_SECRET=your-secret-key-change-in-production,
    JWT_ACCESS_EXPIRATION=16h,
    JWT_REFRESH_EXPIRATION=30d,
    AWS_REGION=ap-northeast-2
  }"
```

동일한 방식으로 다른 Lambda 함수들도 생성합니다.

#### 2.3.2 Lambda 함수 업데이트 (코드 변경 시)

```bash
# Auth Lambda 업데이트
aws lambda update-function-code \
  --function-name table-order-auth \
  --zip-file fileb://backend/functions/auth/function.zip

# 환경 변수 업데이트 (필요 시)
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

### 2.4 API Gateway 설정

#### 2.4.1 REST API 생성

```bash
# REST API 생성
aws apigateway create-rest-api \
  --name table-order-api \
  --description "Table Order REST API" \
  --endpoint-configuration types=REGIONAL

# 리소스 및 메서드 생성 (예: /auth/table-login)
# ... (상세 설정은 Infrastructure 문서 참조)
```

#### 2.4.2 WebSocket API 생성

```bash
# WebSocket API 생성
aws apigatewayv2 create-api \
  --name table-order-websocket \
  --protocol-type WEBSOCKET \
  --route-selection-expression '$request.body.action'

# 라우트 생성 ($connect, $disconnect, $default)
# ... (상세 설정은 Infrastructure 문서 참조)
```

### 2.5 DynamoDB 테이블 생성

```bash
# DynamoDB 테이블 생성
aws dynamodb create-table \
  --table-name table-order-data \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=storeId,AttributeType=S \
    AttributeName=tableId,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "storeId-index",
        "KeySchema": [
          {"AttributeName": "storeId", "KeyType": "HASH"},
          {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        }
      },
      {
        "IndexName": "tableId-index",
        "KeySchema": [
          {"AttributeName": "tableId", "KeyType": "HASH"},
          {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        }
      }
    ]' \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --stream-specification \
    StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES
```

### 2.6 DynamoDB Streams 연결

```bash
# Stream ARN 확인
aws dynamodb describe-table \
  --table-name table-order-data \
  --query 'Table.LatestStreamArn'

# Stream Processor Lambda에 이벤트 소스 매핑
aws lambda create-event-source-mapping \
  --function-name table-order-stream-processor \
  --event-source-arn arn:aws:dynamodb:ap-northeast-2:YOUR_ACCOUNT_ID:table/table-order-data/stream/STREAM_ID \
  --starting-position LATEST \
  --batch-size 10
```

---

## 3. 빌드 자동화 (CI/CD)

### 3.1 GitHub Actions 예시

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://table-order-frontend/ --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Deploy Lambda Functions
        run: |
          cd backend/functions/auth
          npm ci --production
          zip -r function.zip .
          aws lambda update-function-code \
            --function-name table-order-auth \
            --zip-file fileb://function.zip
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## 4. 빌드 검증 체크리스트

### Frontend
- [ ] `npm install` 성공
- [ ] `npm run build` 성공
- [ ] `dist/` 디렉토리 생성 확인
- [ ] `npm run preview`로 로컬 테스트 성공
- [ ] S3 업로드 성공
- [ ] 브라우저에서 접속 확인

### Backend
- [ ] 각 Lambda 함수 `npm install` 성공
- [ ] 각 Lambda 함수 `function.zip` 생성 확인
- [ ] Lambda 함수 배포 성공
- [ ] API Gateway 엔드포인트 생성 확인
- [ ] DynamoDB 테이블 생성 확인
- [ ] Lambda 함수 로그 확인 (CloudWatch)

---

## 5. 트러블슈팅

### Frontend 빌드 실패

**문제**: `npm run build` 실패
**해결**:
```bash
# 캐시 삭제 후 재시도
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Lambda 배포 실패

**문제**: Lambda 함수 업데이트 실패
**해결**:
```bash
# IAM 권한 확인
aws iam get-role --role-name lambda-execution-role

# Lambda 함수 로그 확인
aws logs tail /aws/lambda/table-order-auth --follow
```

### S3 업로드 실패

**문제**: S3 업로드 권한 오류
**해결**:
```bash
# AWS CLI 자격 증명 확인
aws sts get-caller-identity

# S3 버킷 정책 확인
aws s3api get-bucket-policy --bucket table-order-frontend
```

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: 완료
