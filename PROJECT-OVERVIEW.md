# Table Order Service - 프로젝트 전체 개요

## 📋 프로젝트 구조

```
aidlc-workshop/
├── frontend/              # Customer Frontend (React + Vite)
├── backend/               # Customer Backend (Node.js + Express, Mock)
├── admin-api/             # Admin Backend (TypeScript + Express)
├── aidlc-docs/            # AIDLC 문서
├── requirements/          # 요구사항 문서
└── infrastructure/        # 인프라 코드 (예정)
```

---

## 🎯 Units 구성

### Customer Unit (완료 ✅)
**목적**: 고객이 테이블에서 메뉴를 주문하는 기능

**구성**:
- **Frontend**: React 18 + Material-UI + Zustand + SWR
- **Backend**: Node.js + Express (로컬 개발용 Mock)
- **실제 배포**: AWS Lambda + API Gateway + DynamoDB

**구현된 User Stories**:
- ✅ US-001: 테이블 자동 로그인
- ✅ US-002: 메뉴 조회 및 필터링
- ✅ US-003: 장바구니 관리
- ✅ US-004: 주문 생성
- ✅ US-005: 주문 내역 조회
- ✅ US-006: 실시간 주문 상태 업데이트

### Admin Unit (Backend 완료 ✅, Frontend 미구현 ⏳)
**목적**: 관리자가 주문, 메뉴, 테이블을 관리하는 기능

**구성**:
- **Backend**: TypeScript + Express (완료)
- **Frontend**: 미구현 (필요)
- **실제 배포**: AWS Lambda + API Gateway + DynamoDB + S3

**구현된 기능** (Backend):
- ✅ 관리자 인증 (JWT)
- ✅ 주문 관리 (조회, 상태 변경, 삭제)
- ✅ 메뉴 관리 (CRUD, 이미지 업로드)
- ✅ 테이블 관리 (세션 종료, 이력 조회)
- ✅ RBAC (Admin, Manager, Viewer)
- ✅ Mock 모드 지원 (로컬 테스트용)

**미구현 기능**:
- ⏳ Admin Frontend (React 기반 관리자 대시보드)
  - 로그인 페이지
  - 주문 관리 대시보드 (실시간 주문 목록, 상태 변경)
  - 메뉴 관리 페이지 (CRUD, 이미지 업로드)
  - 테이블 관리 페이지 (세션 종료, 이력 조회)

---

## 🏗️ 기술 스택

### Customer Unit

| 계층 | 기술 | 용도 |
|------|------|------|
| Frontend | React 18.2 | UI 프레임워크 |
| | Material-UI 5.15 | UI 컴포넌트 |
| | Zustand 4.4 | 상태 관리 (장바구니) |
| | SWR 2.2 | 데이터 페칭 & 캐싱 |
| | Vite 5.0 | 빌드 도구 |
| Backend (Dev) | Node.js 18 + Express | 로컬 개발 서버 |
| Backend (Prod) | AWS Lambda | Serverless 함수 |
| | API Gateway | REST API |
| | DynamoDB | NoSQL 데이터베이스 |
| | WebSocket API | 실시간 통신 |

### Admin Unit

| 계층 | 기술 | 용도 |
|------|------|------|
| Frontend | **미구현** | 관리자 대시보드 |
| Backend | TypeScript 5.3 | 타입 안전성 |
| | Express 5.2 | 로컬 개발 서버 |
| | AWS Lambda | Serverless 함수 |
| | API Gateway | REST API |
| | DynamoDB | NoSQL 데이터베이스 |
| | S3 | 메뉴 이미지 저장 |
| | bcrypt | 비밀번호 해싱 |
| | JWT | 인증 토큰 |

---

## 📊 데이터베이스 설계

### DynamoDB Single Table Design

**테이블명**: `table-order-data`

**Primary Key**:
- PK (Partition Key): String
- SK (Sort Key): String

**GSI (Global Secondary Indexes)**:
- `storeId-index`: storeId (PK) + SK (SK)
- `tableId-index`: tableId (PK) + SK (SK)

**Entity Types**:
```
TABLE#<tableId>     | METADATA          # 테이블 정보
MENU#<menuId>       | METADATA          # 메뉴 정보
ORDER#<orderId>     | METADATA          # 주문 정보
ADMIN#<adminId>     | METADATA          # 관리자 정보
SESSION#<sessionId> | METADATA          # 세션 정보
```

---

## 🚀 로컬 개발 환경

### Customer Unit

**Frontend 실행**:
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

**Backend 실행**:
```bash
cd backend
npm install
npm start
# http://localhost:3000
```

**테스트 계정**:
- 매장 ID: `STORE123`
- 테이블 번호: `T001`, `T002`, `T003`
- 비밀번호: `1234`

### Admin Unit

**Backend 실행** (Mock 모드):
```bash
cd admin-api
npm install
npm run dev
# http://localhost:3000
```

**Mock 모드 설정**:
- `.env.local` 파일에서 `USE_MOCK=true` 설정
- Mock 데이터로 로컬 테스트 가능
- 실제 AWS 리소스 불필요

**Mock 테스트 계정**:
- Username: `admin1`
- Password: `password123` (Mock 모드에서는 아무 비밀번호나 가능)
- StoreId: `store-001`

**실제 AWS 모드**:
- `.env.local` 파일에서 `USE_MOCK=false` 설정
- 실제 AWS DynamoDB, S3 연결 필요
- AWS credentials 설정 필요

---

## 📁 디렉토리 상세

### Frontend (Customer)
```
frontend/
├── src/
│   ├── customer/
│   │   ├── pages/          # LoginPage, MenuPage, CartPage, etc.
│   │   └── stores/         # cartStore.js (Zustand)
│   ├── shared/
│   │   ├── api/            # apiClient, fetcher
│   │   ├── components/     # ErrorBoundary, Loading
│   │   └── utils/          # auth, toast, validation
│   ├── App.jsx             # 라우팅
│   └── main.jsx            # 엔트리 포인트
├── public/
├── package.json
└── vite.config.js
```

### Backend (Customer - Mock)
```
backend/
├── functions/
│   ├── auth/               # 인증 Lambda
│   ├── menus/              # 메뉴 조회 Lambda (미구현)
│   ├── orders-create/      # 주문 생성 Lambda (미구현)
│   ├── orders-list/        # 주문 내역 Lambda (미구현)
│   └── websocket-*/        # WebSocket Lambda (미구현)
├── shared/
│   └── utils/              # DynamoDB, JWT, Response utils
├── local-server.js         # 로컬 개발 서버 (Mock)
└── package.json
```

### Admin API (Backend Only)
```
admin-api/
├── src/
│   ├── handlers/           # API 핸들러
│   │   ├── authHandler.ts
│   │   ├── orderHandler.ts
│   │   ├── menuHandler.ts
│   │   └── tableHandler.ts
│   ├── services/           # 비즈니스 로직
│   ├── repositories/       # 데이터 액세스
│   ├── middleware/         # Auth, RBAC
│   ├── utils/              # 유틸리티
│   └── local-server.ts     # 로컬 개발 서버
├── dist/                   # 빌드 결과
├── package.json
└── tsconfig.json
```

---

## 🔐 인증 & 권한

### Customer Unit
- **인증 방식**: JWT (Access Token + Refresh Token)
- **토큰 저장**: LocalStorage
- **만료 시간**: Access 16시간, Refresh 30일
- **보호 라우트**: PrivateRoute 컴포넌트

### Admin Unit
- **인증 방식**: JWT
- **RBAC 역할**:
  - `Admin`: 모든 권한
  - `Manager`: 주문/메뉴 관리
  - `Viewer`: 조회만 가능
- **비밀번호**: bcrypt 해싱

---

## 🧪 테스트 상태

### Customer Unit
- ✅ 로컬 빌드 성공
- ✅ 로컬 서버 실행 성공
- ✅ 모든 페이지 렌더링 확인
- ✅ API 통신 확인 (Mock)
- ⏳ 단위 테스트 (미작성)
- ⏳ 통합 테스트 (미작성)

### Admin Unit
- ✅ TypeScript 빌드 성공
- ✅ API 엔드포인트 구현 완료
- ✅ Mock 모드 로컬 테스트 가능
- ✅ 로컬 서버 실행 확인 (Mock 모드)
- ⏳ 실제 AWS 리소스 연동 테스트
- ⏳ Frontend 미구현

---

## 📝 문서 현황

### AIDLC 문서 (완료)
- ✅ Inception Phase 문서
- ✅ Customer Unit 설계 문서
- ✅ Admin Unit 설계 문서
- ✅ Build and Test 지침

### 개발 가이드 (완료)
- ✅ `LOCAL-TESTING-GUIDE.md` (Customer)
- ✅ `TROUBLESHOOTING.md`
- ✅ `admin-api/LOCAL_TEST_GUIDE.md` (Admin)
- ✅ `admin-api/README.md`

### API 문서
- ✅ Customer API 문서
- ✅ Admin API 엔드포인트 목록

---

## 🎯 다음 단계

### 우선순위 1: Admin Frontend 구현 ⭐
**목표**: Admin Unit의 Frontend를 구현하여 전체 시스템 완성

**구현 항목**:
1. **Admin 로그인 페이지**
   - JWT 기반 인증
   - 매장 ID, 사용자명, 비밀번호 입력
   - 토큰 저장 및 자동 갱신

2. **주문 관리 대시보드**
   - 실시간 주문 목록 (SWR 또는 SSE)
   - 주문 상태 변경 (PENDING → PREPARING → COMPLETED)
   - 주문 삭제 (PENDING만 가능)
   - 주문 상세 정보 조회

3. **메뉴 관리 페이지**
   - 메뉴 목록 조회 (카테고리별 필터링)
   - 메뉴 생성 (이름, 가격, 설명, 카테고리, 이미지)
   - 메뉴 수정 (모든 필드 수정 가능)
   - 메뉴 삭제
   - 이미지 업로드 (S3 presigned URL 사용)
   - 메뉴 노출 순서 관리

4. **테이블 관리 페이지**
   - 테이블 세션 종료 (이용 완료 처리)
   - 테이블별 주문 이력 조회
   - 테이블 상태 확인 (사용 중/사용 가능)

**기술 스택 (권장)**:
- React 18 + TypeScript
- Material-UI 또는 Ant Design
- SWR 또는 React Query (데이터 페칭)
- Zustand 또는 Context API (상태 관리)
- React Router (라우팅)

**예상 소요 시간**: 2-3일

---

### 우선순위 2: 통합 및 테스트
1. **Customer-Admin 통합 테스트**
   - Customer가 주문 생성 → Admin에서 주문 확인
   - Admin이 주문 상태 변경 → Customer에서 상태 업데이트 확인
   - Admin이 메뉴 수정 → Customer에서 메뉴 변경 확인

2. **실제 AWS 리소스 연동 테스트**
   - DynamoDB 테이블 생성 및 데이터 마이그레이션
   - S3 버킷 생성 및 이미지 업로드 테스트
   - Lambda 함수 배포 및 API Gateway 연동
   - Customer Backend Lambda 함수 구현 (현재 Mock)

3. **E2E 테스트 시나리오**
   - 전체 주문 플로우 테스트
   - 에러 케이스 테스트
   - 성능 테스트

---

### 우선순위 3: 배포
1. **Infrastructure as Code (CDK/Terraform)**
   - DynamoDB 테이블 정의
   - Lambda 함수 정의
   - API Gateway 정의
   - S3 버킷 정의
   - IAM 역할 및 정책 정의

2. **CI/CD 파이프라인**
   - GitHub Actions 또는 AWS CodePipeline
   - 자동 빌드 및 테스트
   - 자동 배포

3. **프로덕션 배포**
   - 환경 변수 설정 (Secrets Manager)
   - 모니터링 및 알림 설정
   - 백업 및 복구 계획

---

## 🚨 주의사항

### Customer Unit
- Mock 서버는 개발용입니다 (실제 데이터 저장 안됨)
- 프로덕션 배포 시 Lambda 함수 구현 필요
- WebSocket 실시간 업데이트는 5초 폴링으로 구현됨

### Admin Unit
- Backend만 구현되어 있음 (Frontend 필요)
- 로컬 테스트 시 실제 AWS 리소스 필요
- S3 이미지 업로드 기능 포함

### 공통
- JWT Secret은 환경 변수로 관리
- DynamoDB 테이블은 수동 생성 필요
- 비용 발생 가능 (AWS 리소스 사용 시)

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**최종 업데이트**: 2026-02-09  
**상태**: Customer Unit 완료, Admin Frontend 필요
