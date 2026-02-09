# Admin Unit - NFR Design Clarification Questions

답변 내용을 분석한 결과, 다음과 같은 모순이 발견되어 명확화가 필요합니다.

---

## Contradiction 1: SSE Connection Management vs Lambda Architecture

**발견된 모순**:
- Question 3에서 "B) DynamoDB connection registry" 선택
- Question 11에서 "A) Single Lambda" 선택
- Question 12에서 "A) Lambda function URL" 선택

**문제점**:
Lambda Function URL은 stateless하며, SSE 연결은 특정 Lambda 인스턴스에 바인딩됩니다. DynamoDB에 연결 정보를 저장하더라도, 다른 Lambda 인스턴스에서 해당 연결에 접근할 수 없습니다. SSE는 지속적인 HTTP 연결이 필요하므로, 연결 관리는 Lambda 인스턴스 메모리 내에서만 가능합니다.

**Lambda Function URL의 제약**:
- 각 SSE 연결은 특정 Lambda 인스턴스에 바인딩됨
- Lambda 인스턴스 간 연결 공유 불가
- DynamoDB에 저장된 연결 정보는 실제 연결 객체가 아님

### Clarification Question 1
SSE 연결 관리 방식을 다시 선택해주세요:

A) In-memory map (Lambda 메모리 내) - 각 Lambda 인스턴스가 자신의 연결만 관리, 이벤트는 모든 인스턴스에 브로드캐스트
B) DynamoDB + SNS/SQS - DynamoDB에 연결 메타데이터 저장, SNS/SQS로 이벤트 브로드캐스트
C) API Gateway WebSocket - WebSocket API로 변경하여 연결 관리
D) Other (please describe after [Answer]: tag below)

[Answer]: 추천받음

---

**답변 완료 후 "완료" 또는 "done"이라고 알려주세요.**
