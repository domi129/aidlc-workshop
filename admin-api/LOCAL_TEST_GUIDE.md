# 로컬 테스트 가이드

## 🚀 로컬 서버 실행

### 1. 환경 변수 설정
`.env.local` 파일을 확인하고 필요한 경우 수정하세요.

**중요**: 실제 AWS 리소스(DynamoDB, S3)가 필요합니다. 로컬 DynamoDB를 사용하려면 별도 설정이 필요합니다.

### 2. 서버 시작

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 일반 실행
npm run start:local
```

서버가 `http://localhost:3000`에서 실행됩니다.

---

## 📋 API 테스트

### Health Check
```bash
curl http://localhost:3000/health
```

### 1. 로그인 테스트

**주의**: 실제 DynamoDB에 Admin 데이터가 있어야 합니다.

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "password": "password123",
    "storeId": "store-001"
  }'
```

**성공 응답**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "adminId": "uuid",
    "username": "admin1",
    "storeId": "store-001"
  },
  "expiresAt": "2026-02-10T05:55:41Z"
}
```

토큰을 저장하세요:
```bash
export TOKEN="your-token-here"
```

### 2. 주문 조회

```bash
curl -X GET http://localhost:3000/orders \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 주문 상태 변경

```bash
curl -X PATCH http://localhost:3000/orders/order-123/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'
```

### 4. 메뉴 조회

```bash
curl -X GET http://localhost:3000/menus \
  -H "Authorization: Bearer $TOKEN"
```

### 5. 메뉴 생성

```bash
curl -X POST http://localhost:3000/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "김치찌개",
    "price": 8000,
    "description": "얼큰한 김치찌개",
    "category": "MAIN"
  }'
```

### 6. 테이블 세션 종료

```bash
curl -X POST http://localhost:3000/tables/table-123/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-456"}'
```

### 7. 주문 이력 조회

```bash
curl -X GET "http://localhost:3000/tables/table-123/history?page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 로컬 DynamoDB 설정 (선택사항)

실제 AWS 리소스 대신 로컬 DynamoDB를 사용하려면:

### 1. DynamoDB Local 설치

```bash
# Docker 사용
docker run -p 8000:8000 amazon/dynamodb-local

# 또는 Java 버전 다운로드
# https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
```

### 2. 환경 변수 수정

`.env.local`에 추가:
```
AWS_ENDPOINT=http://localhost:8000
```

### 3. 테이블 생성

```bash
# Admins 테이블
aws dynamodb create-table \
  --table-name Admins \
  --attribute-definitions \
    AttributeName=adminId,AttributeType=S \
  --key-schema \
    AttributeName=adminId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000

# 나머지 테이블도 동일하게 생성...
```

### 4. 테스트 데이터 삽입

```bash
# Admin 사용자 생성 (비밀번호는 bcrypt로 해시)
aws dynamodb put-item \
  --table-name Admins \
  --item '{
    "adminId": {"S": "admin-001"},
    "storeId": {"S": "store-001"},
    "username": {"S": "admin1"},
    "passwordHash": {"S": "$2b$10$..."},
    "role": {"S": "Admin"},
    "createdAt": {"N": "1707494400000"}
  }' \
  --endpoint-url http://localhost:8000
```

---

## 🐛 문제 해결

### 1. "Cannot find module" 에러
```bash
npm install
npm run build
```

### 2. DynamoDB 연결 에러
- AWS credentials 확인
- `.env.local`의 테이블 이름 확인
- AWS 리전 확인

### 3. JWT 에러
- `.env.local`의 `JWT_SECRET` 확인
- 토큰 만료 여부 확인

### 4. 권한 에러 (403 Forbidden)
- Admin role 확인
- RBAC 설정 확인

---

## 📝 참고사항

1. **실제 AWS 리소스 필요**: 이 로컬 서버는 실제 AWS DynamoDB와 S3에 연결됩니다.
2. **보안**: `.env.local` 파일은 절대 Git에 커밋하지 마세요.
3. **비용**: AWS 리소스 사용 시 비용이 발생할 수 있습니다.
4. **Mock 데이터**: 완전한 로컬 테스트를 위해서는 DynamoDB Local과 Mock 데이터가 필요합니다.

---

## 🎯 다음 단계

1. 로컬 서버 실행 확인
2. Health check 테스트
3. 각 API 엔드포인트 테스트
4. 에러 케이스 테스트
5. 통합 테스트 시나리오 실행
