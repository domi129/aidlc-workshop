# Application Design Plan

## Plan Overview

이 계획은 테이블오더 서비스의 Application Design을 수행하기 위한 단계별 실행 체크리스트입니다.

---

## Design Context Analysis

**기능 영역**:
1. **인증 및 세션 관리**: 고객 자동 로그인, 관리자 로그인, JWT 토큰 관리
2. **메뉴 관리**: 메뉴 CRUD, 카테고리 관리, 이미지 URL 관리
3. **주문 관리**: 주문 생성, 상태 변경, 주문 조회, 주문 삭제
4. **장바구니 관리**: 클라이언트 측 장바구니 (LocalStorage)
5. **테이블 관리**: 테이블 세션 관리, 이용 완료 처리
6. **실시간 통신**: Server-Sent Events를 통한 주문 업데이트

**주요 사용자**:
- Customer: 메뉴 조회, 장바구니, 주문 생성/조회
- Manager: 주문 모니터링, 테이블 관리, 메뉴 관리

---

## Design Questions

다음 질문들에 답변하여 Application Design 방향을 결정해주세요.

### Question 1: Component Organization
프론트엔드 컴포넌트를 어떻게 구성하시겠습니까?

A) Feature 기반 (메뉴, 주문, 장바구니 등 기능별 폴더)
B) Layer 기반 (components, containers, pages 등 계층별 폴더)
C) Domain 기반 (customer, admin 등 도메인별 폴더)
D) 혼합 (도메인으로 먼저 나누고, 각 도메인 내에서 Feature 기반)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 2: Service Layer Pattern
백엔드 서비스 레이어를 어떻게 구성하시겠습니까?

A) Controller → Service → Repository 패턴
B) Controller → Use Case → Repository 패턴
C) Controller → Domain Service → Repository 패턴
D) 단순 Controller → Repository (서비스 레이어 없음)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 3: State Management (Frontend)
프론트엔드 상태 관리는 어떻게 하시겠습니까?

A) React Context API
B) Redux
C) Zustand
D) MobX
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 4: API Communication Pattern
프론트엔드와 백엔드 간 통신 패턴은?

A) Axios 직접 호출
B) API Client 클래스 (Singleton)
C) React Query / SWR
D) Custom Hooks + Fetch
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 5: Error Handling Strategy
에러 처리 전략은 어떻게 하시겠습니까?

A) Try-Catch + 로컬 에러 처리
B) Global Error Boundary (React) + Middleware (Express)
C) Error Handler Service (중앙 집중식)
D) 혼합 (Global + Local)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 6: Authentication Flow
인증 플로우는 어떻게 구현하시겠습니까?

A) JWT 토큰을 LocalStorage에 저장, 매 요청마다 Header에 포함
B) JWT 토큰을 Cookie에 저장, HttpOnly 설정
C) JWT 토큰을 SessionStorage에 저장
D) 혼합 (고객용은 LocalStorage, 관리자용은 Cookie)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 7: Real-time Communication (SSE)
Server-Sent Events 구현 방식은?

A) Native EventSource API
B) Custom SSE Client 클래스
C) 라이브러리 사용 (예: eventsource-polyfill)
D) WebSocket으로 변경
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Application Design Execution Steps

사용자 답변을 기반으로 다음 단계를 실행합니다:

### Phase 1: Component Identification
- [x] 프론트엔드 컴포넌트 식별 (고객용, 관리자용)
- [x] 백엔드 컴포넌트 식별 (Controller, Service, Repository)
- [x] 공통 컴포넌트 식별 (Shared utilities, types)
- [x] 각 컴포넌트의 책임 정의
- [x] `aidlc-docs/inception/application-design/components.md` 생성

### Phase 2: Component Methods Definition
- [x] 각 컴포넌트의 주요 메서드 식별
- [x] 메서드 시그니처 정의 (입력/출력 타입)
- [x] 메서드의 고수준 목적 정의
- [x] `aidlc-docs/inception/application-design/component-methods.md` 생성
- [x] Note: 상세 비즈니스 로직은 Functional Design에서 정의

### Phase 3: Service Layer Design
- [x] 서비스 레이어 구조 정의 (답변 기반)
- [x] 각 서비스의 책임 정의
- [x] 서비스 간 상호작용 패턴 정의
- [x] 오케스트레이션 로직 식별
- [x] `aidlc-docs/inception/application-design/services.md` 생성

### Phase 4: Component Dependencies
- [x] 컴포넌트 간 의존성 매트릭스 생성
- [x] 통신 패턴 정의 (API 호출, 이벤트, 상태 공유)
- [x] 데이터 흐름 다이어그램 생성
- [x] 순환 의존성 검증
- [x] `aidlc-docs/inception/application-design/component-dependency.md` 생성

### Phase 5: Design Validation
- [x] 모든 User Stories가 컴포넌트에 매핑되는지 확인
- [x] 컴포넌트 책임이 명확하고 중복되지 않는지 확인
- [x] 의존성이 단방향이고 관리 가능한지 확인
- [x] 설계 완전성 검증

---

## Completion Criteria

다음 조건이 모두 충족되면 Application Design이 완료됩니다:

- [x] 모든 질문에 답변 완료
- [x] 모든 실행 단계 체크박스 [x] 완료
- [x] components.md 파일 생성 완료
- [x] component-methods.md 파일 생성 완료
- [x] services.md 파일 생성 완료
- [x] component-dependency.md 파일 생성 완료
- [x] 설계 검증 완료
- [ ] 사용자 승인 완료

---

## 답변 완료 후

모든 질문에 답변하신 후, "완료했습니다" 또는 "done"이라고 말씀해주세요.
