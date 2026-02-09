# 로컬 테스트 가이드

## 🚀 서버 실행 상태

### ✅ Backend Server
- **URL**: http://localhost:3000
- **상태**: 실행 중
- **Mock Database**: 활성화됨

### ✅ Frontend Server
- **URL**: http://localhost:5173
- **상태**: 실행 중
- **API 연결**: http://localhost:3000

---

## 📋 테스트 시나리오

### 1. 테이블 로그인 테스트 (US-001)

**브라우저에서 접속**:
```
http://localhost:5173
```

**테스트 계정**:
- 테이블 번호: `T001`, `T002`, `T003`
- 비밀번호: `1234` (모든 테이블 공통)
- 매장 ID: `STORE123`

**테스트 절차**:
1. 브라우저에서 http://localhost:5173 접속
2. 테이블 번호 입력: `T001`
3. 비밀번호 입력: `1234`
4. 로그인 버튼 클릭
5. ✅ 성공 시: 메뉴 페이지로 이동 (현재는 LoginPage만 구현됨)

**API 직접 테스트** (PowerShell):
```powershell
# 테이블 로그인
$body = @{
    storeId = "STORE123"
    tableNumber = "T001"
    tablePassword = "1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/table-login" -Method POST -Body $body -ContentType "application/json"
```

**예상 응답**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tableId": "T001",
  "storeId": "STORE123",
  "tableNumber": "T001",
  "sessionId": "session-1234567890"
}
```

---

### 2. 메뉴 조회 테스트 (US-002)

**API 테스트** (PowerShell):
```powershell
# 전체 메뉴 조회
Invoke-RestMethod -Uri "http://localhost:3000/menus?storeId=STORE123&category=전체" -Method GET

# 카테고리별 조회
Invoke-RestMethod -Uri "http://localhost:3000/menus?storeId=STORE123&category=메인" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/menus?storeId=STORE123&category=사이드" -Method GET
Invoke-RestMethod -Uri "http://localhost:3000/menus?storeId=STORE123&category=음료" -Method GET
```

**Mock 메뉴 데이터**:
- 김치찌개 (메인) - 8,000원
- 된장찌개 (메인) - 7,000원
- 제육볶음 (메인) - 9,000원
- 계란말이 (사이드) - 5,000원
- 김치전 (사이드) - 6,000원
- 콜라 (음료) - 2,000원
- 사이다 (음료) - 2,000원

---

### 3. 주문 생성 테스트 (US-004)

**API 테스트** (PowerShell):
```powershell
# 주문 생성
$orderBody = @{
    storeId = "STORE123"
    tableId = "T001"
    sessionId = "session-1234567890"
    items = @(
        @{
            menuId = "MENU001"
            quantity = 2
            price = 8000
        }
    )
    totalAmount = 16000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method POST -Body $orderBody -ContentType "application/json"
```

**예상 응답**:
```json
{
  "orderId": "ORDER-1234567890",
  "orderNumber": "20260209-123",
  "createdAt": "2026-02-09T15:00:00.000Z"
}
```

---

### 4. 주문 내역 조회 테스트 (US-005)

**API 테스트** (PowerShell):
```powershell
# 주문 내역 조회
Invoke-RestMethod -Uri "http://localhost:3000/orders?tableId=T001" -Method GET
```

---

## 🔍 디버깅 및 로그 확인

### Backend 로그 확인
Backend 서버 콘솔에서 실시간 로그를 확인할 수 있습니다:
- API 요청/응답
- Mock DynamoDB 작업
- 에러 메시지

### Frontend 개발자 도구
브라우저 개발자 도구 (F12)에서:
- **Console**: JavaScript 에러 및 로그
- **Network**: API 요청/응답 확인
- **Application**: LocalStorage에 저장된 토큰 확인

---

## 🛠️ 서버 관리

### 서버 중지
현재 실행 중인 프로세스를 중지하려면 터미널에서 `Ctrl+C`를 누르세요.

### 서버 재시작

**Backend**:
```powershell
cd backend
npm start
```

**Frontend**:
```powershell
cd frontend
npm run dev
```

---

## 📊 현재 구현 상태

### ✅ 완료된 기능
- Backend 로컬 서버 (Express)
- Mock DynamoDB (3개 테이블 데이터)
- 테이블 로그인 API
- 토큰 갱신 API
- 메뉴 조회 API (Mock 데이터)
- 주문 생성 API (Mock)
- 주문 내역 API (Mock)
- Frontend 빌드 및 개발 서버
- LoginPage 컴포넌트
- 공통 유틸리티 (auth, validation, toast)
- 장바구니 Store (Zustand)

### ⏳ 미구현 기능
- MenuPage (메뉴 조회 화면)
- CartPage (장바구니 화면)
- OrderSuccessPage (주문 성공 화면)
- OrderHistoryPage (주문 내역 화면)
- WebSocket 실시간 업데이트
- 나머지 Lambda 함수들

---

## 🎯 다음 단계

1. **MenuPage 구현**: 메뉴 목록 및 카테고리 필터링
2. **CartPage 구현**: 장바구니 관리 및 주문하기
3. **OrderSuccessPage 구현**: 주문 완료 화면
4. **OrderHistoryPage 구현**: 주문 내역 및 상태 확인
5. **WebSocket 구현**: 실시간 주문 상태 업데이트

---

## 🐛 문제 해결

### Backend 서버가 시작되지 않는 경우
```powershell
cd backend
npm install
npm start
```

### Frontend 서버가 시작되지 않는 경우
```powershell
cd frontend
npm install
npm run dev
```

### API 연결 오류
1. Backend 서버가 실행 중인지 확인: http://localhost:3000/health
2. Frontend .env 파일 확인: `VITE_API_BASE_URL=http://localhost:3000`
3. CORS 오류 시: Backend에서 CORS가 활성화되어 있는지 확인

### 로그인 실패
- 테이블 번호: `T001`, `T002`, `T003` 중 하나 사용
- 비밀번호: `1234` (모든 테이블 공통)
- 매장 ID는 자동으로 `STORE123` 사용

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: 로컬 테스트 환경 구축 완료
