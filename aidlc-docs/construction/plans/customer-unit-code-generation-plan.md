# Customer Unit - Code Generation Plan

## Plan Overview
Customer Unit의 코드를 Lambda 서버리스 아키텍처로 생성합니다.

**개발 방식**: Standard (일반 방식)

**아키텍처**: 
- Frontend: React SPA (S3 + CloudFront)
- Backend: Lambda Functions (API Gateway)
- Database: DynamoDB (단일 테이블)
- Real-time: WebSocket (API Gateway WebSocket)

---

## Unit Context

### Implemented Stories
Customer Unit은 다음 User Stories를 구현합니다:

1. **US-001**: 테이블 자동 로그인 (8 SP)
2. **US-002**: 메뉴 조회 및 필터링 (5 SP)
3. **US-003**: 장바구니 관리 (5 SP)
4. **US-004**: 주문 생성 (8 SP)
5. **US-005**: 주문 내역 조회 (5 SP)
6. **US-006**: 실시간 주문 상태 업데이트 (8 SP)

**Total**: 39 Story Points

### Dependencies
- DynamoDB 테이블: `table-order-data`
- API Gateway: REST API + WebSocket API
- S3 Buckets: `table-order-frontend`, `table-order-images`
- CloudFront Distribution

### Database Entities
- Store, Table, Menu, Order, Session (단일 테이블 설계)

---

## Project Structure

```
workspace-root/
├── frontend/                    # React SPA
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── customer/           # Customer Unit 컴포넌트
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── stores/
│   │   │   └── hooks/
│   │   ├── shared/             # 공유 컴포넌트
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   └── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── backend/                     # Lambda Functions
│   ├── shared/                  # 공유 유틸리티
│   │   ├── utils/
│   │   ├── middleware/
│   │   └── models/
│   ├── functions/               # Lambda 함수들
│   │   ├── auth/
│   │   │   ├── index.js
│   │   │   ├── package.json
│   │   │   └── .env.example
│   │   ├── menus/
│   │   ├── orders-create/
│   │   ├── orders-list/
│   │   ├── websocket-connect/
│   │   ├── websocket-disconnect/
│   │   ├── websocket-message/
│   │   └── stream-processor/
│   └── README.md
│
├── infrastructure/              # IaC (향후)
│   └── README.md
│
└── README.md                    # 프로젝트 루트 README
```

---

## Code Generation Steps

### Step 1: Project Structure Setup
- [x] 프로젝트 루트 디렉토리 구조 생성
- [x] Frontend 디렉토리 구조 생성
- [x] Backend 디렉토리 구조 생성
- [x] 루트 README.md 생성

### Step 2: Frontend - Package Configuration
- [x] package.json 생성 (React, Vite, Zustand, SWR, MUI)
- [x] vite.config.js 생성
- [x] .env.example 생성
- [x] .gitignore 생성

### Step 3: Frontend - Shared Utilities
- [ ] API Client 생성 (`src/shared/api/apiClient.js`)
- [ ] SWR Fetcher 생성 (`src/shared/api/fetcher.js`)
- [ ] Auth Service 생성 (`src/shared/utils/auth.js`)
- [ ] Toast Service 생성 (`src/shared/utils/toast.js`)
- [ ] Validation Service 생성 (`src/shared/utils/validation.js`)

### Step 4: Frontend - Shared Components
- [ ] Error Boundary 생성 (`src/shared/components/ErrorBoundary.jsx`)
- [ ] Component Error Boundary 생성 (`src/shared/components/ComponentErrorBoundary.jsx`)
- [ ] Loading 컴포넌트 생성 (`src/shared/components/Loading.jsx`)

### Step 5: Frontend - Zustand Store
- [ ] Cart Store 생성 (`src/customer/stores/cartStore.js`)
  - 장바구니 상태 관리
  - LocalStorage 동기화

### Step 6: Frontend - Custom Hooks
- [ ] useMenus Hook 생성 (`src/customer/hooks/useMenus.js`)
- [ ] useOrders Hook 생성 (`src/customer/hooks/useOrders.js`)
- [ ] useWebSocket Hook 생성 (`src/customer/hooks/useWebSocket.js`)

### Step 7: Frontend - Customer Components
- [ ] MenuCard 컴포넌트 생성 (`src/customer/components/MenuCard.jsx`)
- [ ] CartItem 컴포넌트 생성 (`src/customer/components/CartItem.jsx`)
- [ ] OrderItem 컴포넌트 생성 (`src/customer/components/OrderItem.jsx`)
- [ ] CategoryTabs 컴포넌트 생성 (`src/customer/components/CategoryTabs.jsx`)

### Step 8: Frontend - Customer Pages
- [ ] LoginPage 생성 (`src/customer/pages/LoginPage.jsx`)
  - US-001: 테이블 자동 로그인
- [ ] MenuPage 생성 (`src/customer/pages/MenuPage.jsx`)
  - US-002: 메뉴 조회 및 필터링
- [ ] CartPage 생성 (`src/customer/pages/CartPage.jsx`)
  - US-003: 장바구니 관리
- [ ] OrderSuccessPage 생성 (`src/customer/pages/OrderSuccessPage.jsx`)
  - US-004: 주문 생성 (성공 화면)
- [ ] OrderHistoryPage 생성 (`src/customer/pages/OrderHistoryPage.jsx`)
  - US-005: 주문 내역 조회
  - US-006: 실시간 주문 상태 업데이트

### Step 9: Frontend - App Configuration
- [ ] App.jsx 생성 (라우팅 설정)
- [ ] main.jsx 생성 (엔트리 포인트)
- [ ] index.html 생성

### Step 10: Backend - Shared Utilities
- [ ] DynamoDB Client 생성 (`backend/shared/utils/dynamodbClient.js`)
- [ ] JWT Utils 생성 (`backend/shared/utils/jwtUtils.js`)
- [ ] Response Utils 생성 (`backend/shared/utils/responseUtils.js`)
- [ ] Validation Utils 생성 (`backend/shared/utils/validationUtils.js`)

### Step 11: Backend - Shared Models
- [ ] DynamoDB Models 생성 (`backend/shared/models/`)
  - Store Model
  - Table Model
  - Menu Model
  - Order Model
  - Session Model

### Step 12: Backend - Auth Lambda Function
- [ ] Auth Lambda 생성 (`backend/functions/auth/index.js`)
  - POST /auth/table-login (테이블 로그인)
  - POST /auth/refresh (토큰 갱신)
  - US-001 구현
- [ ] Auth Lambda package.json 생성
- [ ] Auth Lambda .env.example 생성

### Step 13: Backend - Menus Lambda Function
- [ ] Menus Lambda 생성 (`backend/functions/menus/index.js`)
  - GET /menus (메뉴 조회)
  - US-002 구현
- [ ] Menus Lambda package.json 생성

### Step 14: Backend - Orders Create Lambda Function
- [ ] Orders Create Lambda 생성 (`backend/functions/orders-create/index.js`)
  - POST /orders (주문 생성)
  - US-004 구현
- [ ] Orders Create Lambda package.json 생성

### Step 15: Backend - Orders List Lambda Function
- [ ] Orders List Lambda 생성 (`backend/functions/orders-list/index.js`)
  - GET /orders (주문 내역 조회)
  - US-005 구현
- [ ] Orders List Lambda package.json 생성

### Step 16: Backend - WebSocket Connect Lambda Function
- [ ] WebSocket Connect Lambda 생성 (`backend/functions/websocket-connect/index.js`)
  - $connect 라우트 처리
  - JWT 검증 및 connectionId 저장
- [ ] WebSocket Connect Lambda package.json 생성

### Step 17: Backend - WebSocket Disconnect Lambda Function
- [ ] WebSocket Disconnect Lambda 생성 (`backend/functions/websocket-disconnect/index.js`)
  - $disconnect 라우트 처리
  - connectionId 삭제
- [ ] WebSocket Disconnect Lambda package.json 생성

### Step 18: Backend - WebSocket Message Lambda Function
- [ ] WebSocket Message Lambda 생성 (`backend/functions/websocket-message/index.js`)
  - $default 라우트 처리
  - Ping/Pong 메시지 처리
- [ ] WebSocket Message Lambda package.json 생성

### Step 19: Backend - Stream Processor Lambda Function
- [ ] Stream Processor Lambda 생성 (`backend/functions/stream-processor/index.js`)
  - DynamoDB Streams 이벤트 처리
  - 주문 상태 변경 시 WebSocket 메시지 전송
  - US-006 구현
- [ ] Stream Processor Lambda package.json 생성

### Step 20: Backend - README
- [ ] Backend README.md 생성
  - Lambda 함수 설명
  - 배포 방법
  - 환경 변수 설정

### Step 21: Documentation - Code Summary
- [ ] Frontend Code Summary 생성 (`aidlc-docs/construction/customer-unit/code/frontend-summary.md`)
- [ ] Backend Code Summary 생성 (`aidlc-docs/construction/customer-unit/code/backend-summary.md`)
- [ ] API Documentation 생성 (`aidlc-docs/construction/customer-unit/code/api-documentation.md`)

### Step 22: Deployment Artifacts
- [ ] Frontend 배포 스크립트 생성 (`frontend/deploy.sh`)
- [ ] Backend 배포 스크립트 생성 (`backend/deploy.sh`)
- [ ] 환경 변수 템플릿 생성

### Step 23: Root Documentation
- [ ] 프로젝트 루트 README.md 업데이트
  - 프로젝트 개요
  - 시작 가이드
  - 배포 가이드

---

## Story Traceability

| Story | Steps | Status |
|-------|-------|--------|
| US-001: 테이블 자동 로그인 | Step 8 (LoginPage), Step 12 (Auth Lambda) | [x] |
| US-002: 메뉴 조회 및 필터링 | Step 8 (MenuPage), Step 13 (Menus Lambda) | [ ] |
| US-003: 장바구니 관리 | Step 5 (Cart Store), Step 8 (CartPage) | [x] |
| US-004: 주문 생성 | Step 8 (OrderSuccessPage), Step 14 (Orders Create Lambda) | [ ] |
| US-005: 주문 내역 조회 | Step 8 (OrderHistoryPage), Step 15 (Orders List Lambda) | [ ] |
| US-006: 실시간 주문 상태 업데이트 | Step 8 (OrderHistoryPage), Step 16-19 (WebSocket Lambdas) | [ ] |

---

## Dependencies and Interfaces

### External Dependencies
- **DynamoDB Table**: `table-order-data` (사전 생성 필요)
- **API Gateway**: REST API + WebSocket API (사전 생성 필요)
- **S3 Buckets**: `table-order-frontend`, `table-order-images` (사전 생성 필요)

### Internal Dependencies
- Frontend → Backend: REST API, WebSocket API
- Backend → DynamoDB: 데이터 읽기/쓰기
- Stream Processor → WebSocket API: 실시간 메시지 전송

---

## Estimated Scope

- **Total Steps**: 23
- **Frontend Files**: ~30개
- **Backend Files**: ~20개
- **Documentation Files**: 3개
- **Configuration Files**: ~10개

---

## Next Steps

1. 이 계획을 검토해주세요.
2. 승인하시면 "승인" 또는 "Approve"라고 답변해주세요.
3. 수정이 필요하면 구체적인 변경 사항을 알려주세요.

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 승인 대기 중
- **개발 방식**: Standard (일반 방식)
