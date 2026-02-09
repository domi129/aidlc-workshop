# Customer Unit - Infrastructure Design Clarification Questions

## Overview
Infrastructure Design 답변 검토 중 발견된 모호하거나 충돌하는 부분에 대한 추가 질문입니다.

---

## Clarification Questions

### CQ1: 백엔드 아키텍처 변경 (중요)

**문제점**: 
- **이전 결정** (NFR Requirements, Tech Stack Decisions):
  - Backend: Node.js + Express.js
  - Compute: EC2 (단일 인스턴스 또는 Auto Scaling)
  - SSE (Server-Sent Events) 사용
  
- **현재 답변** (Infrastructure Design):
  - Q1-2: Lambda (서버리스)
  - Q3-1: API Gateway + Lambda

**충돌 사항**:
1. **Express.js vs Lambda**: Express.js는 전통적인 서버 프레임워크이며, Lambda는 서버리스 함수입니다
2. **SSE 지원**: Lambda는 SSE (Server-Sent Events)를 직접 지원하지 않습니다 (API Gateway는 최대 30초 타임아웃)
3. **기술 스택 일관성**: 이전 단계에서 Express.js 기반으로 모든 설계가 완료되었습니다

**CQ1-1**: 백엔드 아키텍처를 Lambda로 변경하시겠습니까?

**옵션**:
- A) **Lambda로 변경** - 전체 아키텍처 재설계 필요
  - 장점: 서버리스, 자동 확장, 비용 효율적
  - 단점: SSE 불가능 (WebSocket 또는 Polling으로 대체 필요), Express.js 코드 전면 수정 필요
  - 영향: Functional Design, NFR Design, Tech Stack 전면 재검토 필요
  
- B) **Express.js + EC2 유지** - 기존 설계 유지
  - 장점: 이전 설계와 일관성, SSE 지원, Express.js 미들웨어 활용
  - 단점: 서버 관리 필요, 수동 확장
  - 영향: 없음 (기존 설계 그대로 진행)
  
- C) **하이브리드 아키텍처** - 일부만 Lambda 사용
  - 예: 주문 생성 API만 Lambda, 실시간 업데이트는 EC2 + SSE
  - 장점: 장점 결합
  - 단점: 복잡도 증가
  - 영향: 아키텍처 복잡도 증가, 추가 설계 필요

[Answer]: A

---

### CQ2: 실시간 주문 상태 업데이트 구현 방식

**문제점**:
- **이전 결정**: SSE (Server-Sent Events) 사용
- **Lambda 제약**: API Gateway + Lambda는 SSE를 지원하지 않음 (최대 30초 타임아웃)

**CQ2-1**: Lambda를 선택하는 경우, 실시간 업데이트를 어떻게 구현하시겠습니까?

**옵션**:
- A) **WebSocket (API Gateway WebSocket)** - 양방향 실시간 통신
  - 장점: 진정한 실시간, Lambda 지원
  - 단점: 복잡한 구현, 연결 관리 필요
  
- B) **Polling (주기적 API 호출)** - 클라이언트가 주기적으로 상태 확인
  - 장점: 간단한 구현
  - 단점: 실시간성 낮음 (5~10초 지연), 불필요한 API 호출 증가
  
- C) **DynamoDB Streams + Lambda + WebSocket** - 이벤트 기반
  - 장점: 효율적, 진정한 실시간
  - 단점: 복잡한 아키텍처
  
- D) **SSE 유지 (EC2 선택 시)** - 기존 설계 유지
  - 장점: 간단, 단방향 통신에 적합
  - 단점: EC2 필요

[Answer]: A

---

### CQ3: DynamoDB 단일 테이블 설계

**문제점**:
- **답변**: Q2-1에서 "A) 단일 테이블 (모든 엔티티 통합)" 선택
- **이전 설계**: Domain Entities에서 Store, Table, Menu, Order, OrderHistory 등 별도 엔티티 정의

**CQ3-1**: 단일 테이블 설계를 선택한 이유는 무엇인가요?

**옵션**:
- A) **단일 테이블 설계 (Single Table Design)** - DynamoDB 베스트 프랙티스
  - 장점: 쿼리 효율성, 비용 절감, 트랜잭션 지원
  - 단점: 복잡한 설계, 학습 곡선
  - 파티션 키 예시: `PK: STORE#store-001`, `SK: TABLE#table-001`
  
- B) **엔티티별 테이블** - 전통적인 관계형 DB 방식
  - 장점: 간단한 설계, 이해하기 쉬움
  - 단점: 여러 테이블 조인 불가, 비용 증가 가능
  - 테이블 예시: `table-order-stores`, `table-order-tables`, `table-order-menus`, `table-order-orders`

**CQ3-2**: 단일 테이블 설계를 선택하는 경우, 파티션 키/정렬 키 전략은 무엇인가요?

**옵션**:
- A) **엔티티 타입 기반**
  - PK: `ENTITY_TYPE#ID` (예: `STORE#store-001`, `TABLE#table-001`)
  - SK: `METADATA` 또는 관계 정보
  
- B) **계층 구조 기반**
  - PK: `STORE#store-001`
  - SK: `TABLE#table-001`, `MENU#menu-001`, `ORDER#order-001`
  
- C) **기타** (설명 필요)

[Answer]: A

---

### CQ4: 백업 전략 없음

**문제점**:
- **답변**: Q2-4에서 "D) 백업 없음" 선택
- **NFR Requirements**: 백업 주기 1일 1회, 최근 7일 보관

**CQ4-1**: 백업 전략을 제외하는 이유는 무엇인가요?

**옵션**:
- A) **초기 버전 제외, 추후 추가** - 개발 속도 우선
  - 위험: 데이터 손실 시 복구 불가
  
- B) **DynamoDB PITR 활성화** - 최소한의 백업
  - 장점: 자동 백업, 35일 보관
  - 단점: 추가 비용 (약 20% 증가)
  
- C) **AWS Backup 사용** - NFR Requirements 준수
  - 장점: 자동 스케줄, 정책 기반 관리
  - 단점: 설정 필요, 추가 비용

[Answer]: A

---

### CQ5: CloudFront 배포 전략

**문제점**:
- **답변**: Q3-3에서 "B) 프론트엔드 + API 모두 CloudFront 사용" 선택
- **Lambda + API Gateway**: API Gateway는 이미 글로벌 엣지 로케이션 지원

**CQ5-1**: API도 CloudFront를 통해 배포하는 이유는 무엇인가요?

**옵션**:
- A) **API Gateway만 사용** - 추가 CloudFront 불필요
  - 장점: 간단한 구조, API Gateway 자체 캐싱 지원
  - 단점: 없음
  
- B) **CloudFront + API Gateway** - 추가 캐싱 레이어
  - 장점: 추가 캐싱, 커스텀 도메인 통합
  - 단점: 복잡도 증가, 추가 비용
  
- C) **프론트엔드만 CloudFront** - 일반적인 패턴
  - 장점: 정적 파일 캐싱, 간단한 구조
  - 단점: 없음

[Answer]: A

---

## Next Steps

1. 위 clarification questions에 대한 답변을 [Answer]: 태그 아래에 작성해주세요.
2. 답변 완료 후 "완료했습니다" 또는 "답변 완료"라고 알려주세요.
3. 답변을 최종 검토하고 Infrastructure Design 아티팩트를 생성합니다.

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 답변 대기 중
