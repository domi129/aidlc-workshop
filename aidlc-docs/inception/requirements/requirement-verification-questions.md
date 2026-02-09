# 요구사항 검증 질문

테이블오더 서비스 요구사항을 명확히 하기 위한 질문입니다. 각 질문에 대해 [Answer]: 태그 뒤에 선택한 옵션의 문자를 입력해주세요.

---

## Question 1
어떤 기술 스택을 사용하여 개발하시겠습니까?

A) Node.js + Express + React
B) Python + FastAPI + React
C) Java + Spring Boot + React
D) .NET + ASP.NET Core + React
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
데이터베이스는 어떤 것을 사용하시겠습니까?

A) PostgreSQL (관계형)
B) MySQL (관계형)
C) MongoDB (NoSQL 문서형)
D) DynamoDB (NoSQL 키-값)
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 3
배포 환경은 어디입니까?

A) AWS (EC2, RDS, S3 등)
B) Azure
C) Google Cloud Platform
D) 로컬 서버 (On-premises)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
실시간 주문 모니터링을 위한 통신 방식은?

A) Server-Sent Events (SSE)
B) WebSocket
C) Polling (주기적 API 호출)
D) Long Polling
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
고객용 인터페이스의 디바이스 타겟은?

A) 태블릿 전용 (iPad, Galaxy Tab 등)
B) 모바일 전용 (스마트폰)
C) 데스크톱 브라우저
D) 반응형 (모든 디바이스)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 6
관리자용 인터페이스의 디바이스 타겟은?

A) 데스크톱 브라우저 전용
B) 태블릿 전용
C) 모바일 전용
D) 반응형 (모든 디바이스)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
메뉴 이미지는 어떻게 관리하시겠습니까?

A) 클라우드 스토리지 (S3, Azure Blob 등)
B) 로컬 서버 파일 시스템
C) 외부 URL 링크만 저장
D) 이미지 없이 텍스트만
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 8
인증 방식은 어떻게 구현하시겠습니까?

A) JWT (JSON Web Token)
B) Session + Cookie
C) OAuth 2.0
D) Basic Authentication
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
프로젝트 구조는 어떻게 하시겠습니까?

A) Monorepo (프론트엔드 + 백엔드 하나의 저장소)
B) 별도 저장소 (프론트엔드, 백엔드 분리)
C) 백엔드만 구현 (프론트엔드는 별도)
D) 프론트엔드만 구현 (백엔드는 별도)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10
테스트 전략은 어떻게 하시겠습니까?

A) 단위 테스트 + 통합 테스트 (Jest, Pytest 등)
B) E2E 테스트 포함 (Cypress, Playwright 등)
C) 수동 테스트만
D) 테스트 코드 없이 개발
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 11
API 문서화는 어떻게 하시겠습니까?

A) OpenAPI/Swagger
B) Postman Collection
C) 별도 문서 (Markdown, Notion 등)
D) 문서화 불필요
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 12
에러 처리 및 로깅 전략은?

A) 구조화된 로깅 + 중앙 집중식 로그 관리 (CloudWatch, ELK 등)
B) 파일 기반 로깅
C) 콘솔 로깅만
D) 최소한의 에러 처리
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 13
개발 우선순위는 어떻게 하시겠습니까?

A) 고객용 기능 우선 (메뉴 조회, 주문)
B) 관리자용 기능 우선 (주문 모니터링, 메뉴 관리)
C) 백엔드 API 우선 구현
D) 전체 동시 개발
E) Other (please describe after [Answer]: tag below)

[Answer]: D, 고객용과 관리자용 따로 기능 개발

---

## Question 14
매장 초기 데이터는 어떻게 생성하시겠습니까?

A) 시드 데이터 스크립트 (자동 생성)
B) 관리자 UI를 통한 수동 입력
C) 데이터 마이그레이션 스크립트
D) 샘플 데이터 제공
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 답변 완료 후

모든 질문에 답변하신 후, "완료했습니다" 또는 "done"이라고 말씀해주세요.
