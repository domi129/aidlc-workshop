# Table Order Service - Customer Unit

테이블 오더 서비스의 고객용 유닛입니다. 고객이 테이블 태블릿을 통해 메뉴를 조회하고 주문할 수 있는 서비스를 제공합니다.

## 프로젝트 개요

**아키텍처**: Serverless (AWS Lambda + API Gateway + DynamoDB)

**주요 기능**:
- 테이블 자동 로그인
- 메뉴 조회 및 필터링
- 장바구니 관리
- 주문 생성
- 주문 내역 조회
- 실시간 주문 상태 업데이트 (WebSocket)

## 기술 스택

### Frontend
- React 18
- Vite (빌드 도구)
- Zustand (상태 관리)
- SWR (데이터 페칭)
- Material-UI (UI 컴포넌트)
- React Router v6

### Backend
- Node.js 18 (Lambda Runtime)
- AWS Lambda (서버리스 함수)
- API Gateway (REST + WebSocket)
- DynamoDB (NoSQL 데이터베이스)
- JWT (인증)

## 프로젝트 구조

```
.
├── frontend/              # React SPA
│   ├── src/
│   │   ├── customer/     # Customer Unit 컴포넌트
│   │   └── shared/       # 공유 컴포넌트
│   └── package.json
│
├── backend/              # Lambda Functions
│   ├── shared/           # 공유 유틸리티
│   └── functions/        # Lambda 함수들
│       ├── auth/
│       ├── menus/
│       ├── orders-create/
│       ├── orders-list/
│       ├── websocket-connect/
│       ├── websocket-disconnect/
│       ├── websocket-message/
│       └── stream-processor/
│
└── aidlc-docs/           # 설계 문서
```

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- AWS CLI 설정 완료
- AWS 계정 및 권한

### Frontend 개발 환경 설정

```bash
cd frontend
npm install
npm run dev
```

Frontend는 `http://localhost:5173`에서 실행됩니다.

### Backend 배포

각 Lambda 함수를 개별적으로 배포합니다:

```bash
cd backend/functions/auth
npm install --production
zip -r function.zip .
aws lambda update-function-code --function-name table-order-auth --zip-file fileb://function.zip
```

자세한 배포 방법은 `backend/README.md`를 참조하세요.

## 환경 변수

### Frontend (.env)

```
VITE_API_BASE_URL=https://your-api-gateway-url
VITE_WS_URL=wss://your-websocket-url
```

### Backend (Lambda 환경 변수)

```
DYNAMODB_TABLE_NAME=table-order-data
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=16h
JWT_REFRESH_EXPIRATION=30d
AWS_REGION=ap-northeast-2
```

## API 문서

API 문서는 `aidlc-docs/construction/customer-unit/code/api-documentation.md`를 참조하세요.

## 배포

### Frontend 배포 (S3 + CloudFront)

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://table-order-frontend/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Backend 배포 (Lambda)

```bash
cd backend
./deploy.sh
```

## 테스트

테스트 실행 방법은 `aidlc-docs/construction/build-and-test/`의 문서를 참조하세요.

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
