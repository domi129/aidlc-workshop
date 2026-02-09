# Customer Unit - Tech Stack Decisions

## Overview
Customer Unit 개발에 사용할 기술 스택과 선택 근거를 정의합니다.

---

## 1. Frontend Tech Stack

### 1.1 Core Framework

**선택**: React 18+

**선택 근거**:
- 컴포넌트 기반 재사용성
- 풍부한 생태계 및 커뮤니티
- 단방향 데이터 흐름으로 상태 관리 용이
- 팀의 React 경험

**대안 고려**:
- Vue.js: 학습 곡선이 낮지만 생태계가 작음
- Angular: 엔터프라이즈급이지만 무겁고 복잡함

### 1.2 Language

**선택**: JavaScript (ES6+)

**선택 근거**:
- 빠른 개발 속도
- 타입 시스템 없이도 충분한 프로젝트 규모
- 팀의 JavaScript 경험

**향후 고려**:
- TypeScript 도입 (타입 안정성 향상)

### 1.3 State Management

**선택**: Zustand

**선택 근거**:
- 경량 (번들 크기 작음)
- 간단한 API (Redux보다 학습 곡선 낮음)
- React Hooks 기반
- 보일러플레이트 코드 최소화

**사용 예시**:
```javascript
// cartStore.js
import create from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  totalAmount: 0,
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    totalAmount: state.totalAmount + item.price * item.quantity
  })),
  removeItem: (menuId) => set((state) => ({
    items: state.items.filter(item => item.menuId !== menuId),
    totalAmount: state.items
      .filter(item => item.menuId !== menuId)
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
  })),
  clearCart: () => set({ items: [], totalAmount: 0 })
}));
```

**대안 고려**:
- Redux: 강력하지만 보일러플레이트 많음
- React Context API: 간단하지만 성능 이슈 가능

### 1.4 API Communication

**선택**: SWR (stale-while-revalidate)

**선택 근거**:
- 간단하고 빠름
- 자동 캐싱 및 재검증
- 자동 재시도 및 에러 처리
- React Hooks 기반

**사용 예시**:
```javascript
import useSWR from 'swr';

function MenuList({ storeId, category }) {
  const { data, error, isLoading } = useSWR(
    `/api/menus?storeId=${storeId}&category=${category}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000 // 5분 캐싱
    }
  );

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  return <MenuCards menus={data} />;
}
```

**대안 고려**:
- React Query: 더 강력하지만 복잡함
- Axios: 기본적이지만 캐싱 및 재시도 수동 구현 필요

### 1.5 UI Component Library

**선택**: Material-UI (MUI)

**선택 근거**:
- 풍부한 컴포넌트 (Button, Card, Modal, TextField 등)
- 반응형 디자인 지원
- 커스터마이징 용이
- 접근성 고려된 컴포넌트

**사용 컴포넌트**:
- Button, Card, TextField, Modal, Snackbar
- Grid, Container (레이아웃)
- CircularProgress (로딩)

**대안 고려**:
- Ant Design: 엔터프라이즈급이지만 디자인이 고정적
- Tailwind CSS: 유틸리티 우선이지만 컴포넌트 직접 구현 필요

### 1.6 Routing

**선택**: React Router v6

**선택 근거**:
- React 표준 라우팅 라이브러리
- 선언적 라우팅
- 중첩 라우팅 지원

**라우트 구조**:
```javascript
<Routes>
  <Route path="/" element={<MenuPage />} />
  <Route path="/cart" element={<CartPage />} />
  <Route path="/order-history" element={<OrderHistoryPage />} />
  <Route path="/order-success" element={<OrderSuccessPage />} />
</Routes>
```

### 1.7 Build Tool

**선택**: Vite

**선택 근거**:
- 빠른 개발 서버 시작
- 빠른 HMR (Hot Module Replacement)
- 최적화된 프로덕션 빌드
- ES 모듈 기반

**대안 고려**:
- Create React App: 설정이 간단하지만 느림
- Webpack: 강력하지만 설정 복잡

---

## 2. Backend Tech Stack

### 2.1 Runtime

**선택**: Node.js 18 LTS

**선택 근거**:
- JavaScript 생태계 활용
- 비동기 I/O 처리에 적합
- 풍부한 npm 패키지
- 팀의 Node.js 경험

### 2.2 Framework

**선택**: Express.js 4.x

**선택 근거**:
- 경량 및 유연함
- 미들웨어 기반 아키텍처
- 풍부한 생태계
- 간단한 API

**프로젝트 구조**:
```
backend/
├── controllers/
│   ├── authController.js
│   ├── menuController.js
│   └── orderController.js
├── services/
│   ├── authService.js
│   ├── menuService.js
│   └── orderService.js
├── repositories/
│   ├── tableRepository.js
│   ├── menuRepository.js
│   └── orderRepository.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── loggerMiddleware.js
├── models/
│   └── (DynamoDB 스키마 정의)
├── utils/
│   └── helpers.js
├── app.js
└── server.js
```

**대안 고려**:
- Fastify: 더 빠르지만 생태계가 작음
- NestJS: TypeScript 기반이지만 복잡함

### 2.3 Language

**선택**: JavaScript (ES6+)

**선택 근거**:
- 프론트엔드와 동일 언어 (코드 공유 가능)
- 빠른 개발 속도
- 팀의 JavaScript 경험

**향후 고려**:
- TypeScript 도입 (타입 안정성 향상)

### 2.4 Logging

**선택**: console.log (초기 버전)

**선택 근거**:
- 간단하고 빠른 구현
- CloudWatch Logs와 자동 통합
- 초기 버전 단순화

**로그 형식**:
```javascript
console.log(`[${new Date().toISOString()}] [INFO] [${controllerName}] ${message}`);
console.error(`[${new Date().toISOString()}] [ERROR] [${controllerName}] ${error.message}`);
```

**향후 계획**:
- Winston 또는 Pino 도입
- 구조화된 로깅 (JSON 형식)
- 로그 레벨 구분 (ERROR, WARN, INFO, DEBUG)

### 2.5 Input Validation

**선택**: express-validator

**선택 근거**:
- Express 미들웨어로 통합 용이
- 체이닝 API로 간결한 검증
- 풍부한 검증 규칙

**사용 예시**:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/api/orders',
  body('storeId').notEmpty().isUUID(),
  body('tableId').notEmpty().isUUID(),
  body('items').isArray({ min: 1 }),
  body('items.*.menuId').notEmpty().isUUID(),
  body('items.*.quantity').isInt({ min: 1, max: 99 }),
  body('totalAmount').isInt({ min: 1 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // 주문 생성 로직
  }
);
```

**대안 고려**:
- Joi: 스키마 기반이지만 별도 라이브러리
- Yup: 간단하지만 Express 통합 수동

### 2.6 Authentication

**선택**: jsonwebtoken (JWT)

**선택 근거**:
- 무상태(stateless) 인증
- 확장성 우수
- 표준 라이브러리

**토큰 구조**:
```javascript
// Access Token (16시간)
{
  "tableId": "table-001",
  "storeId": "store-001",
  "sessionId": "session-001",
  "type": "access",
  "exp": 1707484800
}

// Refresh Token (30일)
{
  "tableId": "table-001",
  "storeId": "store-001",
  "type": "refresh",
  "exp": 1710076800
}
```

### 2.7 Password Hashing

**선택**: bcrypt

**선택 근거**:
- 업계 표준
- Salt 자동 생성
- 느린 해싱 (무차별 대입 공격 방어)

**사용 예시**:
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 10;

// 비밀번호 해싱
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// 비밀번호 검증
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

### 2.8 Environment Variables

**선택**: dotenv

**선택 근거**:
- 간단한 .env 파일 관리
- 표준 라이브러리
- 환경별 설정 분리 용이

**사용 예시**:
```javascript
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  awsRegion: process.env.AWS_REGION
};
```

---

## 3. Database Tech Stack

### 3.1 Primary Database

**선택**: AWS DynamoDB

**선택 근거**:
- 서버리스 (관리 부담 없음)
- 자동 확장
- 낮은 지연시간 (< 10ms)
- AWS 생태계 통합

**테이블 설계**:
- Store (매장)
- Table (테이블)
- Menu (메뉴)
- Order (주문)
- OrderHistory (주문 이력)

### 3.2 DynamoDB Client

**선택**: AWS SDK v2

**선택 근거**:
- 기존 프로젝트와의 호환성
- 팀의 v2 경험
- 안정적인 버전

**사용 예시**:
```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION
});

// 아이템 조회
const result = await dynamodb.get({
  TableName: 'table-order-menus',
  Key: { menuId: 'menu-001' }
}).promise();

// 아이템 생성
await dynamodb.put({
  TableName: 'table-order-orders',
  Item: {
    orderId: 'order-001',
    storeId: 'store-001',
    tableId: 'table-001',
    items: [...],
    totalAmount: 15000,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
}).promise();
```

**향후 고려**:
- AWS SDK v3로 마이그레이션 (모듈화, 성능 향상)

### 3.3 Data Modeling

**파티션 키 전략**:
- Store: storeId (PK)
- Table: tableId (PK)
- Menu: menuId (PK)
- Order: orderId (PK)

**글로벌 보조 인덱스 (GSI)**:
- storeId-index: 매장별 데이터 조회
- sessionId-index: 세션별 주문 조회
- tableId-sessionId-index: 테이블 세션별 주문 조회

---

## 4. Real-time Communication

### 4.1 Technology

**선택**: Server-Sent Events (SSE)

**선택 근거**:
- 단방향 실시간 통신에 적합 (서버 → 클라이언트)
- WebSocket보다 간단한 구현
- HTTP 기반으로 방화벽 이슈 적음
- 자동 재연결 지원

**사용 시나리오**:
- 관리자가 주문 상태 변경 시 고객 화면 업데이트

**구현 예시**:
```javascript
// Backend (Express)
app.get('/api/orders/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 주문 상태 변경 시 이벤트 발송
  orderEmitter.on('statusChanged', sendEvent);

  req.on('close', () => {
    orderEmitter.off('statusChanged', sendEvent);
  });
});

// Frontend (React)
useEffect(() => {
  const eventSource = new EventSource('/api/orders/stream');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateOrderStatus(data.orderId, data.status);
  };

  eventSource.onerror = () => {
    eventSource.close();
    // 재연결 로직
  };

  return () => eventSource.close();
}, []);
```

**대안 고려**:
- WebSocket: 양방향 통신이지만 복잡함
- Polling: 간단하지만 비효율적

---

## 5. API Documentation

### 5.1 Tool

**선택**: Swagger/OpenAPI

**선택 근거**:
- 업계 표준
- 자동 문서 생성
- 인터랙티브 API 테스트 도구
- 코드 주석에서 생성 가능

**구현**:
```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Table Order Service API',
      version: '1.0.0',
      description: 'Customer Unit API Documentation'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://api.example.com', description: 'Production' }
    ]
  },
  apis: ['./controllers/*.js']
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

**API 주석 예시**:
```javascript
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: 주문 생성
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeId:
 *                 type: string
 *               tableId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: 주문 생성 성공
 *       400:
 *         description: 잘못된 요청
 */
```

---

## 6. Development Tools

### 6.1 Code Quality

**ESLint**: JavaScript 린팅
**Prettier**: 코드 포맷팅

**설정**:
```json
// .eslintrc.json
{
  "extends": ["airbnb", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 6.2 Version Control

**Git**: 버전 관리
**GitHub/GitLab**: 코드 호스팅

**브랜치 전략**:
- main: 프로덕션 브랜치
- develop: 개발 브랜치
- feature/*: 기능 브랜치
- hotfix/*: 긴급 수정 브랜치

### 6.3 Package Manager

**선택**: npm

**선택 근거**:
- Node.js 기본 패키지 매니저
- 팀의 npm 경험

**대안 고려**:
- yarn: 더 빠르지만 추가 설치 필요
- pnpm: 디스크 공간 절약이지만 호환성 이슈 가능

---

## 7. Deployment Tech Stack

### 7.1 Compute

**선택**: AWS EC2 또는 ECS

**EC2 장점**:
- 간단한 설정
- 직접 제어 가능

**ECS 장점**:
- 컨테이너 기반
- 자동 확장 용이
- 관리 부담 적음

**권장**: 초기에는 EC2, 확장 시 ECS로 마이그레이션

### 7.2 Storage

**선택**: AWS S3

**용도**:
- 프론트엔드 정적 파일 호스팅
- 빌드 아티팩트 저장

### 7.3 CDN

**선택**: AWS CloudFront

**용도**:
- 정적 파일 캐싱 및 분산
- HTTPS 지원
- 지연 시간 감소

### 7.4 DNS

**선택**: AWS Route 53

**용도**:
- 도메인 관리
- DNS 라우팅

### 7.5 Monitoring

**선택**: AWS CloudWatch (향후)

**용도**:
- 로그 수집
- 메트릭 모니터링
- 알람 설정

---

## 8. Tech Stack Summary

### 8.1 Frontend Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 18+ |
| Language | JavaScript | ES6+ |
| State Management | Zustand | Latest |
| API Communication | SWR | Latest |
| UI Library | Material-UI | Latest |
| Routing | React Router | v6 |
| Build Tool | Vite | Latest |

### 8.2 Backend Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | 18 LTS |
| Framework | Express.js | 4.x |
| Language | JavaScript | ES6+ |
| Logging | console.log | Built-in |
| Validation | express-validator | Latest |
| Authentication | jsonwebtoken | Latest |
| Password Hashing | bcrypt | Latest |
| Environment | dotenv | Latest |

### 8.3 Database Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Database | AWS DynamoDB | - |
| Client | AWS SDK v2 | Latest |

### 8.4 Infrastructure Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Compute | AWS EC2/ECS | - |
| Storage | AWS S3 | - |
| CDN | AWS CloudFront | - |
| DNS | AWS Route 53 | - |
| Monitoring | AWS CloudWatch | - |

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 생성 완료
