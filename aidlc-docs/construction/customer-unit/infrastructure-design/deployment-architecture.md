# Customer Unit - Deployment Architecture

## Overview
Customer Unit의 배포 아키텍처와 운영 전략을 정의합니다.

---

## 1. Deployment Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    CloudFront (Global)                      │ │
│  │  - Frontend Distribution (S3 Origin)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  S3 Bucket (ap-northeast-2)                 │ │
│  │  - table-order-frontend (React SPA)                         │ │
│  │  - table-order-images (Menu Images)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              API Gateway (ap-northeast-2)                   │ │
│  │  ┌──────────────────┐  ┌──────────────────┐               │ │
│  │  │   REST API       │  │  WebSocket API   │               │ │
│  │  │  /auth/*         │  │  $connect        │               │ │
│  │  │  /menus          │  │  $disconnect     │               │ │
│  │  │  /orders         │  │  $default        │               │ │
│  │  └──────────────────┘  └──────────────────┘               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Lambda Functions (ap-northeast-2)              │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │ │
│  │  │ auth         │ │ menus        │ │ orders       │      │ │
│  │  │ (256MB, 10s) │ │ (256MB, 10s) │ │ (512MB, 15s) │      │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘      │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │ │
│  │  │ ws-connect   │ │ ws-disconnect│ │ ws-message   │      │ │
│  │  │ (128MB, 5s)  │ │ (128MB, 5s)  │ │ (128MB, 5s)  │      │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘      │ │
│  │  ┌──────────────┐                                          │ │
│  │  │ stream-proc  │                                          │ │
│  │  │ (256MB, 10s) │                                          │ │
│  │  └──────────────┘                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            DynamoDB (ap-northeast-2)                        │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  table-order-data (Single Table)                     │ │ │
│  │  │  - On-Demand Capacity                                │ │ │
│  │  │  - DynamoDB Streams Enabled                          │ │ │
│  │  │  - GSI: storeId-index, sessionId-index               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              CloudWatch (ap-northeast-2)                    │ │
│  │  - Lambda Logs: /aws/lambda/table-order-*                  │ │
│  │  - Metrics: Lambda, API Gateway, DynamoDB                   │ │
│  │  - Alarms: (향후 추가)                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Deployment Environments

### 2.1 Environment Strategy

**현재**: 단일 환경 (프로덕션)

**환경 구성**:

| Environment | AWS Account | Region | Purpose |
|-------------|-------------|--------|---------|
| Production | Main Account | ap-northeast-2 | 실제 서비스 |

**향후 계획**:

| Environment | AWS Account | Region | Purpose |
|-------------|-------------|--------|---------|
| Development | Main Account | ap-northeast-2 | 개발 및 테스트 |
| Production | Main Account | ap-northeast-2 | 실제 서비스 |

### 2.2 Environment Isolation

**리소스 명명 규칙**:
- Production: `table-order-<resource>`
- Development: `table-order-dev-<resource>` (향후)

**예시**:
- Lambda: `table-order-auth` (prod), `table-order-dev-auth` (dev)
- DynamoDB: `table-order-data` (prod), `table-order-dev-data` (dev)
- S3: `table-order-frontend` (prod), `table-order-dev-frontend` (dev)

---

## 3. Deployment Process

### 3.1 Frontend Deployment

**빌드 및 배포 절차**:

```bash
# 1. 로컬 빌드
cd frontend
npm install
npm run build

# 2. S3 업로드
aws s3 sync dist/ s3://table-order-frontend/ --delete

# 3. CloudFront 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# 4. 배포 확인
curl https://d1234567890abc.cloudfront.net
```

**배포 시간**: 약 5분
- 빌드: 1분
- S3 업로드: 1분
- CloudFront 무효화: 3분

**롤백 절차**:
```bash
# 이전 버전 복원 (S3 Versioning 활성화 시)
aws s3 sync s3://table-order-frontend-backup/ s3://table-order-frontend/ --delete
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

### 3.2 Backend Deployment (Lambda)

**빌드 및 배포 절차**:

```bash
# 1. 의존성 설치
cd backend/functions/auth
npm install --production

# 2. Lambda 패키지 생성
zip -r function.zip . -x "*.git*" -x "node_modules/aws-sdk/*"

# 3. Lambda 함수 업데이트
aws lambda update-function-code \
  --function-name table-order-auth \
  --zip-file fileb://function.zip

# 4. 배포 확인
aws lambda invoke \
  --function-name table-order-auth \
  --payload '{"test": true}' \
  response.json
```

**배포 시간**: 약 2분 (함수당)
- 패키지 생성: 30초
- 업로드 및 배포: 1분 30초

**롤백 절차**:
```bash
# 이전 버전으로 롤백
aws lambda update-function-code \
  --function-name table-order-auth \
  --s3-bucket table-order-lambda-versions \
  --s3-key auth/v1.0.0.zip
```

### 3.3 Infrastructure Deployment

**DynamoDB 테이블 생성**:

```bash
# 테이블 생성
aws dynamodb create-table \
  --table-name table-order-data \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES

# GSI 생성
aws dynamodb update-table \
  --table-name table-order-data \
  --attribute-definitions \
    AttributeName=storeId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --global-secondary-index-updates \
    '[{
      "Create": {
        "IndexName": "storeId-index",
        "KeySchema": [
          {"AttributeName": "storeId", "KeyType": "HASH"},
          {"AttributeName": "createdAt", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      }
    }]'
```

**API Gateway 생성**:

```bash
# REST API 생성
aws apigateway create-rest-api \
  --name table-order-api \
  --endpoint-configuration types=REGIONAL

# WebSocket API 생성
aws apigatewayv2 create-api \
  --name table-order-websocket \
  --protocol-type WEBSOCKET \
  --route-selection-expression '$request.body.action'
```

---

## 4. CI/CD Pipeline (향후 계획)

### 4.1 GitHub Actions Workflow

**Frontend CI/CD**:

```yaml
# .github/workflows/frontend-deploy.yml
name: Frontend Deploy

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        run: |
          cd frontend
          npm run build
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://table-order-frontend/ --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ap-northeast-2
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

**Backend CI/CD**:

```yaml
# .github/workflows/backend-deploy.yml
name: Backend Deploy

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        function: [auth, menus, orders-create, orders-list]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend/functions/${{ matrix.function }}
          npm ci --production
      
      - name: Package Lambda
        run: |
          cd backend/functions/${{ matrix.function }}
          zip -r function.zip . -x "*.git*"
      
      - name: Deploy to Lambda
        run: |
          aws lambda update-function-code \
            --function-name table-order-${{ matrix.function }} \
            --zip-file fileb://backend/functions/${{ matrix.function }}/function.zip
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ap-northeast-2
```

### 4.2 AWS CodePipeline (대안)

**Pipeline 구조**:

```
Source (GitHub) 
  → Build (CodeBuild) 
  → Deploy (CodeDeploy/Lambda)
```

**CodeBuild buildspec.yml**:

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
  
  pre_build:
    commands:
      - echo Installing dependencies...
      - cd backend/functions/auth
      - npm ci --production
  
  build:
    commands:
      - echo Building Lambda package...
      - zip -r function.zip . -x "*.git*"
  
  post_build:
    commands:
      - echo Deploying to Lambda...
      - aws lambda update-function-code --function-name table-order-auth --zip-file fileb://function.zip

artifacts:
  files:
    - function.zip
```

---

## 5. Deployment Strategies

### 5.1 Current Strategy: Simple Deployment

**방식**: 단순 배포 (다운타임 허용)

**절차**:
1. 새 코드 배포
2. Lambda 함수 자동 업데이트
3. 즉시 새 버전 적용

**장점**:
- 간단한 구현
- 빠른 배포

**단점**:
- 짧은 다운타임 발생 가능 (Lambda Cold Start)
- 롤백 수동

### 5.2 Future Strategy: Canary Deployment

**방식**: Lambda Alias + Weighted Routing

**절차**:
1. 새 Lambda 버전 배포 (v2)
2. Alias 생성: `prod` → 90% v1, 10% v2
3. 모니터링 (에러율, 응답 시간)
4. 점진적 트래픽 증가: 50% v2 → 100% v2
5. v1 제거

**구현 예시**:

```bash
# 1. 새 버전 배포
aws lambda publish-version --function-name table-order-auth

# 2. Alias 업데이트 (Canary 10%)
aws lambda update-alias \
  --function-name table-order-auth \
  --name prod \
  --routing-config AdditionalVersionWeights={"2"=0.1}

# 3. 모니터링 후 트래픽 증가 (50%)
aws lambda update-alias \
  --function-name table-order-auth \
  --name prod \
  --routing-config AdditionalVersionWeights={"2"=0.5}

# 4. 완전 전환 (100%)
aws lambda update-alias \
  --function-name table-order-auth \
  --name prod \
  --function-version 2
```

### 5.3 Future Strategy: Blue-Green Deployment

**방식**: API Gateway Stage 활용

**절차**:
1. 새 Lambda 버전 배포 (Green)
2. 새 API Gateway Stage 생성 (`prod-green`)
3. Green 환경 테스트
4. DNS 또는 CloudFront Origin 전환
5. Blue 환경 제거

---

## 6. Configuration Management

### 6.1 Environment Variables

**Lambda 환경 변수**:

```json
{
  "DYNAMODB_TABLE_NAME": "table-order-data",
  "JWT_SECRET": "<secret>",
  "JWT_ACCESS_EXPIRATION": "16h",
  "JWT_REFRESH_EXPIRATION": "30d",
  "AWS_REGION": "ap-northeast-2",
  "NODE_ENV": "production"
}
```

**설정 방법**:

```bash
# Lambda 환경 변수 업데이트
aws lambda update-function-configuration \
  --function-name table-order-auth \
  --environment Variables="{
    DYNAMODB_TABLE_NAME=table-order-data,
    JWT_SECRET=<secret>,
    JWT_ACCESS_EXPIRATION=16h,
    JWT_REFRESH_EXPIRATION=30d,
    AWS_REGION=ap-northeast-2,
    NODE_ENV=production
  }"
```

### 6.2 Secrets Management (향후 계획)

**AWS Secrets Manager**:

```bash
# Secret 생성
aws secretsmanager create-secret \
  --name table-order/jwt-secret \
  --secret-string '{"JWT_SECRET":"<secret>"}'

# Lambda에서 Secret 조회
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret() {
  const data = await secretsManager.getSecretValue({
    SecretId: 'table-order/jwt-secret'
  }).promise();
  
  return JSON.parse(data.SecretString);
}
```

### 6.3 Parameter Store (향후 계획)

**AWS Systems Manager Parameter Store**:

```bash
# Parameter 생성
aws ssm put-parameter \
  --name /table-order/dynamodb-table-name \
  --value table-order-data \
  --type String

# Lambda에서 Parameter 조회
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();

async function getParameter(name) {
  const data = await ssm.getParameter({
    Name: name,
    WithDecryption: true
  }).promise();
  
  return data.Parameter.Value;
}
```

---

## 7. Monitoring and Alerting

### 7.1 CloudWatch Logs

**로그 그룹**: (향후 추가)
- `/aws/lambda/table-order-auth`
- `/aws/lambda/table-order-menus`
- `/aws/lambda/table-order-orders-create`
- `/aws/lambda/table-order-orders-list`
- `/aws/lambda/table-order-websocket-connect`
- `/aws/lambda/table-order-websocket-disconnect`
- `/aws/lambda/table-order-websocket-message`
- `/aws/lambda/table-order-stream-processor`

**로그 보관 기간**: 7일

### 7.2 CloudWatch Metrics

**주요 메트릭**: (향후 추가)
- Lambda Invocations, Duration, Errors, Throttles
- API Gateway 4XXError, 5XXError, Count, Latency
- DynamoDB ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits, UserErrors

### 7.3 CloudWatch Alarms

**알람 설정**: (향후 추가)

```bash
# Lambda Error Rate 알람
aws cloudwatch put-metric-alarm \
  --alarm-name table-order-lambda-error-rate \
  --alarm-description "Lambda error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# API Gateway 5XX Error 알람
aws cloudwatch put-metric-alarm \
  --alarm-name table-order-api-5xx-errors \
  --alarm-description "API Gateway 5XX errors > 10 in 5 minutes" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

---

## 8. Disaster Recovery

### 8.1 Backup Strategy

**현재**: 백업 없음

**향후 계획**:

**DynamoDB PITR**:
```bash
# Point-in-Time Recovery 활성화
aws dynamodb update-continuous-backups \
  --table-name table-order-data \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

**S3 Versioning**:
```bash
# S3 Versioning 활성화
aws s3api put-bucket-versioning \
  --bucket table-order-frontend \
  --versioning-configuration Status=Enabled
```

**Lambda 버전 관리**:
```bash
# Lambda 버전 발행
aws lambda publish-version \
  --function-name table-order-auth \
  --description "v1.0.0"
```

### 8.2 Recovery Procedures

**DynamoDB 복원**:
```bash
# PITR로 복원
aws dynamodb restore-table-to-point-in-time \
  --source-table-name table-order-data \
  --target-table-name table-order-data-restored \
  --restore-date-time 2026-02-09T12:00:00Z
```

**Lambda 롤백**:
```bash
# 이전 버전으로 롤백
aws lambda update-alias \
  --function-name table-order-auth \
  --name prod \
  --function-version 1
```

**S3 복원**:
```bash
# 이전 버전 복원
aws s3api list-object-versions \
  --bucket table-order-frontend \
  --prefix index.html

aws s3api copy-object \
  --bucket table-order-frontend \
  --copy-source table-order-frontend/index.html?versionId=<version-id> \
  --key index.html
```

---

## 9. Security Best Practices

### 9.1 IAM Least Privilege

**Lambda Execution Role**:
- DynamoDB: 특정 테이블만 접근
- CloudWatch Logs: 특정 로그 그룹만 쓰기
- API Gateway: 특정 WebSocket API만 메시지 전송

### 9.2 Secrets Rotation

**향후 계획**:
- JWT Secret 정기 교체 (6개월마다)
- AWS Secrets Manager 자동 교체 활성화

### 9.3 Network Security

**API Gateway**:
- Throttling 설정 (1000 req/s)
- API Key 또는 Lambda Authorizer 사용

**CloudFront**:
- AWS WAF 통합 (향후)
- DDoS 방어 (AWS Shield Standard 자동 활성화)

---

## 10. Cost Management

### 10.1 Cost Allocation Tags

**태그 전략**:
```json
{
  "Project": "table-order",
  "Environment": "production",
  "Component": "customer-unit",
  "ManagedBy": "manual"
}
```

**적용 예시**:
```bash
# Lambda 함수 태그
aws lambda tag-resource \
  --resource arn:aws:lambda:ap-northeast-2:123456789012:function:table-order-auth \
  --tags Project=table-order,Environment=production,Component=customer-unit

# DynamoDB 테이블 태그
aws dynamodb tag-resource \
  --resource-arn arn:aws:dynamodb:ap-northeast-2:123456789012:table/table-order-data \
  --tags Key=Project,Value=table-order Key=Environment,Value=production
```

### 10.2 Cost Optimization

**Lambda**:
- 메모리 최적화 (AWS Lambda Power Tuning 사용)
- 불필요한 로그 제거

**DynamoDB**:
- On-Demand → Provisioned (트래픽 예측 가능 시)
- TTL 활성화 (오래된 데이터 자동 삭제)

**S3**:
- Lifecycle Policy (90일 후 Glacier 이동)
- Intelligent-Tiering (자동 계층 이동)

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 생성 완료
- **배포 방식**: 수동 배포 (초기 버전)
