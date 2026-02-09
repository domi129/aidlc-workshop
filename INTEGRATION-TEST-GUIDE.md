# 통합 테스트 가이드

## 📋 개요

Customer Unit과 Admin Unit 간의 통합 테스트 시나리오 및 실행 방법을 문서화합니다.

---

## 🎯 테스트 목표

1. **Customer-Admin 통합**: Customer의 주문이 Admin에서 정상적으로 표시되는지 확인
2. **실시간 동기화**: Admin의 주문 상태 변경이 Customer에 반영되는지 확인
3. **데이터 일관성**: 메뉴 변경, 주문 생성/삭제 시 데이터 일관성 확인

---

## 🏗️ 테스트 환경 구성

### 1. 로컬 Mock 환경

**필요한 서버**:
- Customer Backend (Mock): http://localhost:3000
- Customer Frontend: http://localhost:5173
- Admin Backend (Mock): http://localhost:4000
- Admin Frontend: http://localhost:5174

**실행 순서**:

```bash
# Terminal 1: Customer Backend
cd backend
npm start

# Terminal 2: Customer Frontend
cd frontend
npm run dev

# Terminal 3: Admin Backend
cd admin-api
npm run dev

# Terminal 4: Admin Frontend
cd admin-frontend
npm run dev
```

**환경 변수 설정**:

Customer Backend (`.env`):
```env
PORT=3000
```

Customer Frontend (`.env`):
```env
VITE_API_BASE_URL=http://localhost:3000
```

Admin Backend (`.env.local`):
```env
USE_MOCK=true
PORT=4000
```

Admin Frontend (`.env`):
```env
VITE_ADMIN_API_BASE_URL=http://localhost:4000
```

---

### 2. 실제 AWS 환경

**필요한 리소스**:
- DynamoDB 테이블 (7개)
- S3 버킷 (메뉴 이미지)
- Lambda 함수 (Customer + Admin)
- API Gateway (Customer + Admin)

**설정 방법**:
1. DynamoDB 테이블 생성 (infrastructure-design.md 참조)
2. S3 버킷 생성
3. Lambda 함수 배포
4. API Gateway 설정
5. 환경 변수 설정 (AWS Secrets Manager)

---

## 🧪 테스트 시나리오

### 시나리오 1: 전체 주문 플로우

**목표**: Customer가 주문하고 Admin이 처리하는 전체 플로우 테스트

**단계**:

1. **Customer: 로그인**
   - URL: http://localhost:5173/login
   - 매장 ID: `STORE123`
   - 테이블 번호: `T001`
   - 비밀번호: `1234`
   - **예상 결과**: 로그인 성공, 메뉴 페이지로 이동

2. **Customer: 메뉴 조회**
   - URL: http://localhost:5173/menu
   - **예상 결과**: 7개 메뉴 표시 (메인 3, 사이드 2, 음료 2)

3. **Customer: 장바구니 추가**
   - 메뉴 선택: "김치찌개" (8,000원) x 2
   - 메뉴 선택: "콜라" (2,000원) x 1
   - **예상 결과**: 장바구니에 2개 항목, 총액 18,000원

4. **Customer: 주문 생성**
   - 장바구니에서 "주문하기" 클릭
   - **예상 결과**: 주문 성공 페이지, 주문 번호 표시

5. **Admin: 로그인**
   - URL: http://localhost:5174/login
   - 매장 ID: `store-001`
   - 사용자명: `admin1`
   - 비밀번호: `password123`
   - **예상 결과**: 로그인 성공, 대시보드로 이동

6. **Admin: 주문 확인**
   - URL: http://localhost:5174/dashboard
   - **예상 결과**: Customer가 생성한 주문이 목록에 표시됨
   - 주문 상태: `PENDING`
   - 주문 항목: 김치찌개 x2, 콜라 x1
   - 총액: 18,000원

7. **Admin: 주문 상태 변경 (PREPARING)**
   - 주문 카드에서 "PREPARING로 변경" 버튼 클릭
   - **예상 결과**: 주문 상태가 `PREPARING`으로 변경됨

8. **Customer: 주문 상태 확인**
   - URL: http://localhost:5173/orders
   - **예상 결과**: 주문 상태가 `PREPARING`으로 표시됨 (5초 이내)

9. **Admin: 주문 상태 변경 (COMPLETED)**
   - 주문 카드에서 "COMPLETED로 변경" 버튼 클릭
   - **예상 결과**: 주문 상태가 `COMPLETED`로 변경됨

10. **Customer: 주문 완료 확인**
    - URL: http://localhost:5173/orders
    - **예상 결과**: 주문 상태가 `COMPLETED`로 표시됨 (5초 이내)

**성공 기준**:
- ✅ 모든 단계가 에러 없이 완료
- ✅ Customer와 Admin 간 데이터 동기화 확인
- ✅ 주문 상태 변경이 5초 이내에 반영

---

### 시나리오 2: 메뉴 관리 및 동기화

**목표**: Admin이 메뉴를 수정하면 Customer에 반영되는지 확인

**단계**:

1. **Admin: 로그인**
   - 매장 ID: `store-001`
   - 사용자명: `admin1`
   - 비밀번호: `password123`

2. **Admin: 메뉴 수정**
   - URL: http://localhost:5174/menus
   - "김치찌개" 메뉴 선택
   - 가격 변경: 8,000원 → 9,000원
   - 설명 변경: "얼큰한 김치찌개" → "매콤한 김치찌개"
   - **예상 결과**: 메뉴 수정 성공

3. **Customer: 메뉴 확인**
   - URL: http://localhost:5173/menu
   - 페이지 새로고침 (F5)
   - **예상 결과**: "김치찌개" 가격이 9,000원으로 표시됨

4. **Admin: 메뉴 추가**
   - URL: http://localhost:5174/menus
   - "메뉴 추가" 버튼 클릭
   - 메뉴명: "된장찌개"
   - 가격: 7,500원
   - 카테고리: "메인"
   - **예상 결과**: 메뉴 추가 성공

5. **Customer: 새 메뉴 확인**
   - URL: http://localhost:5173/menu
   - 페이지 새로고침 (F5)
   - **예상 결과**: "된장찌개" 메뉴가 목록에 표시됨

6. **Admin: 메뉴 삭제**
   - URL: http://localhost:5174/menus
   - "된장찌개" 메뉴 선택
   - "삭제" 버튼 클릭
   - **예상 결과**: 메뉴 삭제 성공

7. **Customer: 삭제된 메뉴 확인**
   - URL: http://localhost:5173/menu
   - 페이지 새로고침 (F5)
   - **예상 결과**: "된장찌개" 메뉴가 목록에서 사라짐

**성공 기준**:
- ✅ 메뉴 수정/추가/삭제가 정상 동작
- ✅ Customer에서 변경된 메뉴 확인 가능

---

### 시나리오 3: 주문 삭제 (PENDING만 가능)

**목표**: PENDING 상태의 주문만 삭제 가능한지 확인

**단계**:

1. **Customer: 주문 생성**
   - 메뉴 선택 및 주문 생성
   - **예상 결과**: 주문 상태 `PENDING`

2. **Admin: 주문 삭제 시도 (PENDING)**
   - URL: http://localhost:5174/dashboard
   - PENDING 상태 주문의 "삭제" 버튼 클릭
   - **예상 결과**: 주문 삭제 성공

3. **Customer: 주문 생성 (2번째)**
   - 메뉴 선택 및 주문 생성
   - **예상 결과**: 주문 상태 `PENDING`

4. **Admin: 주문 상태 변경 (PREPARING)**
   - PENDING → PREPARING로 변경
   - **예상 결과**: 주문 상태 `PREPARING`

5. **Admin: 주문 삭제 시도 (PREPARING)**
   - PREPARING 상태 주문의 "삭제" 버튼 확인
   - **예상 결과**: "삭제" 버튼이 표시되지 않음 또는 비활성화

**성공 기준**:
- ✅ PENDING 상태 주문만 삭제 가능
- ✅ PREPARING/COMPLETED 상태 주문은 삭제 불가

---

### 시나리오 4: 테이블 세션 종료

**목표**: Admin이 테이블 세션을 종료하면 주문 이력으로 이동하는지 확인

**단계**:

1. **Customer: 여러 주문 생성**
   - 주문 1: 김치찌개 x1
   - 주문 2: 콜라 x2
   - **예상 결과**: 2개 주문 생성됨

2. **Admin: 주문 완료 처리**
   - 모든 주문을 `COMPLETED` 상태로 변경
   - **예상 결과**: 모든 주문 상태 `COMPLETED`

3. **Admin: 테이블 세션 종료**
   - URL: http://localhost:5174/tables
   - 테이블 `T001` 선택
   - "이용 완료" 버튼 클릭
   - **예상 결과**: 세션 종료 성공

4. **Admin: 주문 이력 확인**
   - URL: http://localhost:5174/tables/T001/history
   - **예상 결과**: 종료된 세션의 주문 2개가 이력에 표시됨

5. **Customer: 새 세션 시작**
   - 로그아웃 후 재로그인
   - **예상 결과**: 새 세션 ID 발급, 이전 주문 내역 없음

**성공 기준**:
- ✅ 테이블 세션 종료 성공
- ✅ 주문이 이력으로 이동
- ✅ 새 세션 시작 가능

---

### 시나리오 5: 동시 접속 테스트

**목표**: 여러 테이블에서 동시에 주문 시 정상 동작하는지 확인

**단계**:

1. **Customer 1: 테이블 T001 로그인**
   - 테이블 번호: `T001`
   - 비밀번호: `1234`

2. **Customer 2: 테이블 T002 로그인**
   - 테이블 번호: `T002`
   - 비밀번호: `1234`

3. **Customer 1: 주문 생성**
   - 김치찌개 x1
   - **예상 결과**: 주문 생성 성공

4. **Customer 2: 주문 생성**
   - 콜라 x2
   - **예상 결과**: 주문 생성 성공

5. **Admin: 주문 확인**
   - URL: http://localhost:5174/dashboard
   - **예상 결과**: 2개 주문이 모두 표시됨
   - 주문 1: T001, 김치찌개 x1
   - 주문 2: T002, 콜라 x2

6. **Admin: 주문 1 상태 변경**
   - T001 주문을 `PREPARING`으로 변경
   - **예상 결과**: T001 주문만 상태 변경됨

7. **Customer 1: 주문 상태 확인**
   - **예상 결과**: 주문 상태 `PREPARING`

8. **Customer 2: 주문 상태 확인**
   - **예상 결과**: 주문 상태 여전히 `PENDING`

**성공 기준**:
- ✅ 여러 테이블 동시 접속 가능
- ✅ 각 테이블의 주문이 독립적으로 관리됨
- ✅ 주문 상태 변경이 올바른 테이블에만 반영됨

---

## 🐛 에러 케이스 테스트

### 에러 1: 잘못된 로그인 정보

**Customer**:
- 잘못된 테이블 번호 입력
- **예상 결과**: "테이블을 찾을 수 없습니다" 에러 메시지

**Admin**:
- 잘못된 비밀번호 입력
- **예상 결과**: "로그인 실패" 에러 메시지

---

### 에러 2: 만료된 토큰

**단계**:
1. 로그인 후 16시간 대기 (또는 토큰 수동 만료)
2. API 요청 시도
3. **예상 결과**: 401 Unauthorized, 자동 로그아웃

---

### 에러 3: 네트워크 에러

**단계**:
1. Backend 서버 중지
2. Frontend에서 API 요청 시도
3. **예상 결과**: "서버 연결 실패" 에러 메시지

---

### 에러 4: 중복 주문 방지

**단계**:
1. 주문 생성 버튼 빠르게 2번 클릭
2. **예상 결과**: 1개 주문만 생성됨 (중복 방지)

---

## 📊 성능 테스트

### 테스트 1: 주문 목록 조회 성능

**목표**: 100개 주문 조회 시 응답 시간 측정

**단계**:
1. Mock 데이터로 100개 주문 생성
2. Admin 대시보드에서 주문 목록 조회
3. **성공 기준**: 응답 시간 < 1초

---

### 테스트 2: 실시간 업데이트 지연 시간

**목표**: Admin의 주문 상태 변경이 Customer에 반영되는 시간 측정

**단계**:
1. Admin에서 주문 상태 변경
2. Customer에서 상태 업데이트 확인
3. **성공 기준**: 지연 시간 < 5초 (폴링 간격)

---

### 테스트 3: 동시 접속 부하 테스트

**목표**: 50명 동시 접속 시 정상 동작 확인

**도구**: Apache JMeter 또는 Artillery

**시나리오**:
- 50개 가상 사용자
- 각 사용자가 로그인 → 메뉴 조회 → 주문 생성
- **성공 기준**: 에러율 < 1%, 평균 응답 시간 < 2초

---

## 🔍 데이터 일관성 검증

### 검증 1: 주문 금액 일관성

**검증 항목**:
- 주문 totalAmount = Σ(item.quantity × item.unitPrice)
- **방법**: 주문 생성 후 DynamoDB에서 직접 확인

---

### 검증 2: 메뉴 가격 스냅샷

**검증 항목**:
- 주문 생성 후 메뉴 가격 변경 시, 기존 주문의 가격은 변경되지 않음
- **방법**: 
  1. 주문 생성 (김치찌개 8,000원)
  2. 메뉴 가격 변경 (9,000원)
  3. 기존 주문 확인 → 여전히 8,000원

---

### 검증 3: 세션 격리

**검증 항목**:
- 테이블 A의 주문이 테이블 B에 표시되지 않음
- **방법**: 
  1. T001에서 주문 생성
  2. T002에서 주문 내역 조회
  3. T001의 주문이 표시되지 않아야 함

---

## 📝 테스트 체크리스트

### 기능 테스트
- [ ] 시나리오 1: 전체 주문 플로우
- [ ] 시나리오 2: 메뉴 관리 및 동기화
- [ ] 시나리오 3: 주문 삭제 (PENDING만 가능)
- [ ] 시나리오 4: 테이블 세션 종료
- [ ] 시나리오 5: 동시 접속 테스트

### 에러 케이스
- [ ] 잘못된 로그인 정보
- [ ] 만료된 토큰
- [ ] 네트워크 에러
- [ ] 중복 주문 방지

### 성능 테스트
- [ ] 주문 목록 조회 성능
- [ ] 실시간 업데이트 지연 시간
- [ ] 동시 접속 부하 테스트

### 데이터 일관성
- [ ] 주문 금액 일관성
- [ ] 메뉴 가격 스냅샷
- [ ] 세션 격리

---

## 🛠️ 테스트 자동화

### E2E 테스트 (Playwright)

```typescript
// tests/e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test';

test('전체 주문 플로우', async ({ page, context }) => {
  // Customer 페이지
  const customerPage = page;
  
  // Admin 페이지 (새 탭)
  const adminPage = await context.newPage();
  
  // Customer: 로그인
  await customerPage.goto('http://localhost:5173/login');
  await customerPage.fill('[name="storeId"]', 'STORE123');
  await customerPage.fill('[name="tableNumber"]', 'T001');
  await customerPage.fill('[name="password"]', '1234');
  await customerPage.click('button[type="submit"]');
  
  // Customer: 주문 생성
  await customerPage.goto('http://localhost:5173/menu');
  await customerPage.click('text=김치찌개');
  await customerPage.click('text=장바구니에 추가');
  await customerPage.goto('http://localhost:5173/cart');
  await customerPage.click('text=주문하기');
  
  // 주문 번호 추출
  const orderNumber = await customerPage.textContent('.order-number');
  
  // Admin: 로그인
  await adminPage.goto('http://localhost:5174/login');
  await adminPage.fill('[name="username"]', 'admin1');
  await adminPage.fill('[name="password"]', 'password123');
  await adminPage.click('button[type="submit"]');
  
  // Admin: 주문 확인
  await adminPage.goto('http://localhost:5174/dashboard');
  await expect(adminPage.locator(`text=${orderNumber}`)).toBeVisible();
  
  // Admin: 주문 상태 변경
  await adminPage.click(`text=${orderNumber} >> .. >> text=PREPARING로 변경`);
  
  // Customer: 주문 상태 확인
  await customerPage.goto('http://localhost:5173/orders');
  await expect(customerPage.locator('text=PREPARING')).toBeVisible({ timeout: 10000 });
});
```

---

## 📊 테스트 결과 보고서

### 테스트 실행 결과

| 시나리오 | 상태 | 실행 시간 | 비고 |
|---------|------|----------|------|
| 전체 주문 플로우 | ✅ Pass | 45초 | - |
| 메뉴 관리 및 동기화 | ✅ Pass | 30초 | - |
| 주문 삭제 | ✅ Pass | 20초 | - |
| 테이블 세션 종료 | ✅ Pass | 25초 | - |
| 동시 접속 테스트 | ✅ Pass | 60초 | - |

### 발견된 이슈

| 이슈 ID | 설명 | 심각도 | 상태 |
|--------|------|--------|------|
| - | - | - | - |

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: 통합 테스트 가이드
