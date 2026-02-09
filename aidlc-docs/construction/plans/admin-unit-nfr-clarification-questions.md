# Admin Unit - NFR Requirements Clarification Questions

답변 내용을 분석한 결과, 다음과 같은 모순이 발견되어 명확화가 필요합니다.

---

## Contradiction 1: Availability Target vs Failover Strategy

**발견된 모순**:
- Question 8에서 "D) Best effort (목표 없음)" 선택
- Question 10에서 "A) Automatic failover (자동 장애 조치)" 선택

**문제점**:
가용성 목표가 없는 MVP 프로젝트에서 자동 장애 조치를 구현하는 것은 일반적으로 불필요한 복잡도를 추가합니다. 자동 장애 조치는 높은 가용성 목표(99.9% 이상)를 달성하기 위한 메커니즘이며, 구현 및 유지보수 비용이 높습니다.

### Clarification Question 1
가용성 및 장애 조치 전략을 다시 선택해주세요:

A) Best effort 가용성 + No failover (MVP 단순화, AWS 관리형 서비스의 기본 가용성에 의존)
B) Best effort 가용성 + Manual failover (장애 시 수동 복구)
C) 99% 가용성 + Automatic failover (자동 장애 조치 구현)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

**답변 완료 후 "완료" 또는 "done"이라고 알려주세요.**
