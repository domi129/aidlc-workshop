# Customer Unit - Infrastructure Design Plan

## Plan Overview
Customer Unit의 논리적 컴포넌트를 실제 AWS 인프라 서비스에 매핑합니다.

---

## Execution Steps

### Step 1: Compute Infrastructure 설계
- [x] 프론트엔드 호스팅 인프라 선택
- [x] 백엔드 컴퓨팅 인프라 선택
- [x] Auto Scaling 전략 설계

### Step 2: Storage Infrastructure 설계
- [x] DynamoDB 테이블 설계
- [x] S3 버킷 구조 설계
- [x] 백업 전략 설계

### Step 3: Networking Infrastructure 설계
- [x] API Gateway 또는 Load Balancer 선택
- [x] CDN 설정
- [x] DNS 설정

### Step 4: Monitoring Infrastructure 설계
- [x] CloudWatch 로그 그룹 설계
- [x] CloudWatch 메트릭 및 알람 설계
- [x] 대시보드 설계

### Step 5: Deployment Architecture 설계
- [x] 환경 분리 전략 (Dev/Staging/Prod)
- [x] CI/CD 파이프라인 설계
- [x] 배포 전략 선택

---

## Infrastructure Design Questions

다음 질문들에 답변해주시면 더 정확한 Infrastructure Design을 생성할 수 있습니다.

### 1. Compute Infrastructure

**Q1-1**: 프론트엔드 호스팅 방식은 무엇인가요?
- A) S3 + CloudFront (정적 호스팅)
- B) EC2 + Nginx
- C) Amplify Hosting
- D) 기타 (설명 필요)

[Answer]: A

**Q1-2**: 백엔드 컴퓨팅 인프라는 무엇인가요?
- A) EC2 (단일 인스턴스)
- B) EC2 + Auto Scaling Group
- C) ECS Fargate (컨테이너)
- D) Lambda (서버리스)

[Answer]: D

**Q1-3**: 백엔드 인스턴스 타입은 무엇인가요?
- A) t3.micro (1 vCPU, 1GB RAM) - 개발/테스트용
- B) t3.small (2 vCPU, 2GB RAM) - 소규모 프로덕션
- C) t3.medium (2 vCPU, 4GB RAM) - 중규모 프로덕션
- D) 기타 (설명 필요)

[Answer]: D, 람다 사용

**Q1-4**: Auto Scaling 전략은 무엇인가요?
- A) 초기 버전에서는 제외 (수동 확장)
- B) CPU 사용률 기반 (70% 이상 시 확장)
- C) 요청 수 기반 (분당 1000건 이상 시 확장)
- D) 기타 (설명 필요)

[Answer]: D, 람다 사용

### 2. Storage Infrastructure

**Q2-1**: DynamoDB 테이블 수는 몇 개인가요?
- A) 단일 테이블 (모든 엔티티 통합)
- B) 엔티티별 테이블 (Store, Table, Menu, Order, OrderHistory)
- C) 도메인별 테이블 (Customer, Admin)
- D) 기타 (설명 필요)

[Answer]: A

**Q2-2**: DynamoDB 용량 모드는 무엇인가요?
- A) On-Demand (자동 확장, 비용 높음)
- B) Provisioned (수동 설정, 비용 낮음)
- C) Provisioned + Auto Scaling
- D) 기타 (설명 필요)

[Answer]: A

**Q2-3**: S3 버킷 구조는 어떻게 하시겠습니까?
- A) 단일 버킷 (프론트엔드 + 이미지)
- B) 용도별 버킷 (프론트엔드용, 이미지용)
- C) 환경별 버킷 (dev, staging, prod)
- D) 기타 (설명 필요)

[Answer]: B

**Q2-4**: 백업 전략은 무엇인가요?
- A) DynamoDB Point-in-Time Recovery (PITR)
- B) DynamoDB On-Demand Backup (수동)
- C) AWS Backup (자동 스케줄)
- D) 백업 없음

[Answer]: D

### 3. Networking Infrastructure

**Q3-1**: API 엔드포인트 구조는 무엇인가요?
- A) EC2 Public IP 직접 노출
- B) Application Load Balancer (ALB)
- C) API Gateway + Lambda
- D) 기타 (설명 필요)

[Answer]: C

**Q3-2**: HTTPS 인증서는 어떻게 관리하시겠습니까?
- A) AWS Certificate Manager (ACM) - 무료
- B) Let's Encrypt - 무료
- C) 상용 인증서 구매
- D) HTTP만 사용 (HTTPS 없음)

[Answer]: A

**Q3-3**: CloudFront 배포 전략은 무엇인가요?
- A) 프론트엔드만 CloudFront 사용
- B) 프론트엔드 + API 모두 CloudFront 사용
- C) CloudFront 사용 안 함
- D) 기타 (설명 필요)

[Answer]: B

**Q3-4**: 도메인 관리는 어떻게 하시겠습니까?
- A) Route 53 (AWS DNS)
- B) 외부 DNS 서비스 (Cloudflare, GoDaddy 등)
- C) 도메인 없음 (IP 주소 사용)
- D) 기타 (설명 필요)

[Answer]: C

### 4. Monitoring Infrastructure

**Q4-1**: CloudWatch Logs 그룹 구조는 무엇인가요?
- A) 단일 로그 그룹 (모든 로그 통합)
- B) 서비스별 로그 그룹 (frontend, backend)
- C) 환경별 로그 그룹 (dev, staging, prod)
- D) 초기 버전에서는 제외

[Answer]: D

**Q4-2**: CloudWatch 알람 설정은 무엇인가요?
- A) CPU 사용률 > 80%
- B) 에러율 > 5%
- C) API 응답 시간 > 2초
- D) 초기 버전에서는 제외

[Answer]: D

**Q4-3**: 대시보드 구성은 무엇인가요?
- A) CloudWatch Dashboard (API 응답 시간, 에러율, CPU/메모리)
- B) Grafana (커스텀 대시보드)
- C) 대시보드 없음
- D) 기타 (설명 필요)

[Answer]: C

### 5. Deployment Architecture

**Q5-1**: 환경 분리 전략은 무엇인가요?
- A) 단일 환경 (프로덕션만)
- B) 2개 환경 (개발, 프로덕션)
- C) 3개 환경 (개발, 스테이징, 프로덕션)
- D) 기타 (설명 필요)

[Answer]: A

**Q5-2**: CI/CD 파이프라인은 무엇인가요?
- A) GitHub Actions
- B) AWS CodePipeline + CodeBuild + CodeDeploy
- C) Jenkins
- D) 수동 배포 (초기 버전)

[Answer]: D

**Q5-3**: 배포 전략은 무엇인가요?
- A) Blue-Green Deployment
- B) Rolling Update
- C) Canary Deployment
- D) 단순 배포 (다운타임 허용)

[Answer]: D

**Q5-4**: 환경별 설정 관리는 어떻게 하시겠습니까?
- A) .env 파일 (수동 관리)
- B) AWS Systems Manager Parameter Store
- C) AWS Secrets Manager
- D) 기타 (설명 필요)

[Answer]: A

### 6. Security Infrastructure

**Q6-1**: VPC 구성은 어떻게 하시겠습니까?
- A) Default VPC 사용
- B) Custom VPC (Public/Private Subnet 분리)
- C) VPC 없음 (Public 인스턴스만)
- D) 기타 (설명 필요)

[Answer]: A

**Q6-2**: 보안 그룹 구성은 무엇인가요?
- A) 단일 보안 그룹 (모든 포트 오픈)
- B) 계층별 보안 그룹 (ALB, EC2, DynamoDB)
- C) 최소 권한 보안 그룹 (필요한 포트만 오픈)
- D) 기타 (설명 필요)

[Answer]: C

**Q6-3**: IAM 역할 구성은 무엇인가요?
- A) EC2 인스턴스 역할 (DynamoDB 접근 권한)
- B) 서비스별 역할 (최소 권한 원칙)
- C) 관리자 역할만 사용
- D) 기타 (설명 필요)

[Answer]: D, 람다 사용, DynamoDB 접근 권한은 필요

### 7. Cost Optimization

**Q7-1**: 비용 최적화 전략은 무엇인가요?
- A) Reserved Instances (1년 약정)
- B) Savings Plans
- C) Spot Instances (개발 환경)
- D) 초기 버전에서는 제외 (On-Demand만 사용)

[Answer]: D

**Q7-2**: 비용 모니터링은 어떻게 하시겠습니까?
- A) AWS Cost Explorer
- B) AWS Budgets (예산 알람)
- C) 비용 모니터링 없음
- D) 기타 (설명 필요)

[Answer]: C

---

## Next Steps

1. 위 질문들에 대한 답변을 [Answer]: 태그 아래에 작성해주세요.
2. 답변 완료 후 "완료했습니다" 또는 "답변 완료"라고 알려주세요.
3. 답변을 검토하고 추가 질문이 필요한 경우 clarification questions 파일을 생성합니다.
4. 모든 질문이 해결되면 Infrastructure Design 아티팩트를 생성합니다.

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 질문 대기 중
