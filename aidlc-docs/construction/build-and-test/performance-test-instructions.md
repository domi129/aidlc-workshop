# Performance Test Instructions - Customer Unit

## 개요

Customer Unit의 성능, 부하, 스트레스 테스트 지침입니다.

---

## 1. 성능 테스트 목표

### 1.1 응답 시간 목표

| 엔드포인트 | 평균 응답 시간 | 95 백분위수 | 99 백분위수 |
|-----------|--------------|------------|------------|
| POST /auth/table-login | < 500ms | < 800ms | < 1000ms |
| GET /menus | < 300ms | < 500ms | < 700ms |
| POST /orders | < 800ms | < 1200ms | < 1500ms |
| GET /orders | < 400ms | < 600ms | < 800ms |
| WebSocket 연결 | < 1000ms | < 1500ms | < 2000ms |

### 1.2 처리량 목표

- **동시 사용자**: 100명
- **초당 요청 수 (RPS)**: 50 requests/sec
- **주문 생성**: 10 orders/sec
- **WebSocket 연결**: 100 concurrent connections

### 1.3 리소스 사용률 목표

- **Lambda 메모리**: < 256MB
- **Lambda 실행 시간**: < 3초
- **DynamoDB 읽기 용량**: < 5 RCU per request
- **DynamoDB 쓰기 용량**: < 5 WCU per request

---

## 2. 부하 테스트 (Load Testing)

### 2.1 Artillery 설치 및 설정

```bash
npm install -g artillery
```

### 2.2 Artillery 시나리오 작성

`tests/performance/load-test.yml`:

```yaml
config:
  target: "https://your-api-gateway-url.execute-api.ap-northeast-2.amazonaws.com/prod"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
    - duration: 120
      arrivalRate: 50
      name: "Peak load"
  processor: "./processor.js"
  variables:
    storeId: "STORE123"
  plugins:
    expect: {}

scenarios:
  - name: "Customer Journey"
    weight: 70
    flow:
      # 1. 테이블 로그인
      - post:
          url: "/auth/table-login"
          json:
            qrCode: "{{ storeId }}_TABLE{{ $randomNumber(1, 50) }}_SESSION{{ $randomString(8) }}"
          capture:
            - json: "$.accessToken"
              as: "accessToken"
            - json: "$.tableInfo.tableId"
              as: "tableId"
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: accessToken

      # 2. 메뉴 조회
      - get:
          url: "/menus?storeId={{ storeId }}&category=전체"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          capture:
            - json: "$[0].menuId"
              as: "menuId"
            - json: "$[0].price"
              as: "menuPrice"
          expect:
            - statusCode: 200
            - contentType: json

      # 3. 메뉴 필터링 (카테고리별)
      - get:
          url: "/menus?storeId={{ storeId }}&category=메인"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          expect:
            - statusCode: 200

      # 4. 주문 생성
      - post:
          url: "/orders"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          json:
            storeId: "{{ storeId }}"
            tableId: "{{ tableId }}"
            sessionId: "SESSION{{ $randomString(8) }}"
            items:
              - menuId: "{{ menuId }}"
                quantity: 2
                price: "{{ menuPrice }}"
            totalAmount: "{{ menuPrice * 2 }}"
          capture:
            - json: "$.orderId"
              as: "orderId"
          expect:
            - statusCode: 201
            - hasProperty: orderId

      # 5. 주문 내역 조회
      - get:
          url: "/orders?tableId={{ tableId }}"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          expect:
            - statusCode: 200
            - contentType: json

  - name: "Menu Browsing Only"
    weight: 30
    flow:
      # 로그인
      - post:
          url: "/auth/table-login"
          json:
            qrCode: "{{ storeId }}_TABLE{{ $randomNumber(1, 50) }}_SESSION{{ $randomString(8) }}"
          capture:
            - json: "$.accessToken"
              as: "accessToken"

      # 메뉴 조회 (여러 카테고리)
      - loop:
          - get:
              url: "/menus?storeId={{ storeId }}&category={{ $randomItem(['전체', '메인', '사이드', '음료']) }}"
              headers:
                Authorization: "Bearer {{ accessToken }}"
        count: 5
```

`tests/performance/processor.js`:

```javascript
module.exports = {
  $randomNumber: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  $randomString: function(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  $randomItem: function(items) {
    return items[Math.floor(Math.random() * items.length)];
  }
};
```

### 2.3 부하 테스트 실행

```bash
# 기본 실행
artillery run tests/performance/load-test.yml

# 리포트 생성
artillery run --output report.json tests/performance/load-test.yml
artillery report report.json

# 실시간 모니터링
artillery run --output report.json tests/performance/load-test.yml | tee artillery.log
```

### 2.4 예상 결과

```
Summary report @ 14:30:00(+0900)
  Scenarios launched:  4800
  Scenarios completed: 4800
  Requests completed:  24000
  Mean response/sec: 50.2
  Response time (msec):
    min: 85
    max: 1250
    median: 320
    p95: 580
    p99: 850
  Scenario counts:
    Customer Journey: 3360 (70%)
    Menu Browsing Only: 1440 (30%)
  Codes:
    200: 19200
    201: 4800
```

---

## 3. 스트레스 테스트 (Stress Testing)

### 3.1 스트레스 테스트 시나리오

`tests/performance/stress-test.yml`:

```yaml
config:
  target: "https://your-api-gateway-url.execute-api.ap-northeast-2.amazonaws.com/prod"
  phases:
    # 점진적 부하 증가
    - duration: 60
      arrivalRate: 10
      name: "Stage 1"
    - duration: 60
      arrivalRate: 50
      name: "Stage 2"
    - duration: 60
      arrivalRate: 100
      name: "Stage 3"
    - duration: 60
      arrivalRate: 200
      name: "Stage 4 - Breaking point"
    - duration: 60
      arrivalRate: 500
      name: "Stage 5 - Extreme load"
  processor: "./processor.js"

scenarios:
  - name: "High Load Order Creation"
    flow:
      - post:
          url: "/auth/table-login"
          json:
            qrCode: "STORE123_TABLE{{ $randomNumber(1, 100) }}_SESSION{{ $randomString(8) }}"
          capture:
            - json: "$.accessToken"
              as: "accessToken"
            - json: "$.tableInfo.tableId"
              as: "tableId"

      - post:
          url: "/orders"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          json:
            storeId: "STORE123"
            tableId: "{{ tableId }}"
            sessionId: "SESSION{{ $randomString(8) }}"
            items:
              - menuId: "MENU001"
                quantity: 1
                price: 8000
            totalAmount: 8000
```

### 3.2 스트레스 테스트 실행

```bash
artillery run tests/performance/stress-test.yml --output stress-report.json
artillery report stress-report.json
```

---

## 4. WebSocket 성능 테스트

### 4.1 WebSocket 부하 테스트

`tests/performance/websocket-test.js`:

```javascript
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

const WS_URL = 'wss://your-websocket-url.execute-api.ap-northeast-2.amazonaws.com/prod';
const NUM_CONNECTIONS = 100;
const TEST_DURATION = 60000; // 60 seconds

async function testWebSocket() {
  const connections = [];
  const metrics = {
    connectionTimes: [],
    messageTimes: [],
    errors: 0,
    messagesReceived: 0
  };

  console.log(`Starting WebSocket test with ${NUM_CONNECTIONS} connections...`);

  // Create connections
  for (let i = 0; i < NUM_CONNECTIONS; i++) {
    const startTime = performance.now();
    
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      const connectionTime = performance.now() - startTime;
      metrics.connectionTimes.push(connectionTime);
      
      // Send ping message
      ws.send(JSON.stringify({ action: 'ping' }));
    });

    ws.on('message', (data) => {
      const messageTime = performance.now();
      metrics.messagesReceived++;
      
      const message = JSON.parse(data);
      if (message.action === 'pong') {
        metrics.messageTimes.push(messageTime);
      }
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error: ${error.message}`);
      metrics.errors++;
    });

    connections.push(ws);

    // Delay between connections
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Wait for test duration
  await new Promise(resolve => setTimeout(resolve, TEST_DURATION));

  // Close all connections
  connections.forEach(ws => ws.close());

  // Calculate metrics
  const avgConnectionTime = metrics.connectionTimes.reduce((a, b) => a + b, 0) / metrics.connectionTimes.length;
  const p95ConnectionTime = metrics.connectionTimes.sort((a, b) => a - b)[Math.floor(metrics.connectionTimes.length * 0.95)];

  console.log('\n=== WebSocket Performance Test Results ===');
  console.log(`Total Connections: ${NUM_CONNECTIONS}`);
  console.log(`Successful Connections: ${metrics.connectionTimes.length}`);
  console.log(`Failed Connections: ${metrics.errors}`);
  console.log(`Average Connection Time: ${avgConnectionTime.toFixed(2)}ms`);
  console.log(`P95 Connection Time: ${p95ConnectionTime.toFixed(2)}ms`);
  console.log(`Messages Received: ${metrics.messagesReceived}`);
  console.log(`Messages per Connection: ${(metrics.messagesReceived / NUM_CONNECTIONS).toFixed(2)}`);
}

testWebSocket().catch(console.error);
```

### 4.2 WebSocket 테스트 실행

```bash
node tests/performance/websocket-test.js
```

### 4.3 예상 결과

```
Starting WebSocket test with 100 connections...

=== WebSocket Performance Test Results ===
Total Connections: 100
Successful Connections: 100
Failed Connections: 0
Average Connection Time: 850.25ms
P95 Connection Time: 1250.50ms
Messages Received: 500
Messages per Connection: 5.00
```

---

## 5. Frontend 성능 테스트

### 5.1 Lighthouse CI 설정

`.lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:5173/",
        "http://localhost:5173/menu",
        "http://localhost:5173/cart",
        "http://localhost:5173/orders"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 3000}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 5.2 Lighthouse 테스트 실행

```bash
# Lighthouse CI 설치
npm install -g @lhci/cli

# 테스트 실행
lhci autorun

# 또는 개별 페이지 테스트
lighthouse http://localhost:5173 --view
```

### 5.3 예상 결과

```
Lighthouse CI Results:

┌─────────────────────────┬───────┬───────┬───────┬───────┐
│ URL                     │ Perf  │ A11y  │ Best  │ SEO   │
├─────────────────────────┼───────┼───────┼───────┼───────┤
│ /                       │ 95    │ 98    │ 95    │ 100   │
│ /menu                   │ 92    │ 97    │ 93    │ 100   │
│ /cart                   │ 94    │ 98    │ 95    │ 100   │
│ /orders                 │ 91    │ 97    │ 94    │ 100   │
└─────────────────────────┴───────┴───────┴───────┴───────┘

Performance Metrics:
- First Contentful Paint: 1.2s
- Largest Contentful Paint: 2.1s
- Total Blocking Time: 180ms
- Cumulative Layout Shift: 0.05
- Speed Index: 2.3s
```

---

## 6. AWS Lambda 성능 모니터링

### 6.1 CloudWatch 메트릭 확인

```bash
# Lambda 함수 메트릭 조회
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=table-order-auth \
  --start-time 2026-02-09T00:00:00Z \
  --end-time 2026-02-09T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum

# Lambda 동시 실행 수 조회
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name ConcurrentExecutions \
  --dimensions Name=FunctionName,Value=table-order-auth \
  --start-time 2026-02-09T00:00:00Z \
  --end-time 2026-02-09T23:59:59Z \
  --period 300 \
  --statistics Maximum

# Lambda 에러율 조회
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=table-order-auth \
  --start-time 2026-02-09T00:00:00Z \
  --end-time 2026-02-09T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### 6.2 X-Ray 트레이싱

Lambda 함수에 X-Ray 활성화:

```bash
aws lambda update-function-configuration \
  --function-name table-order-auth \
  --tracing-config Mode=Active
```

X-Ray 콘솔에서 확인:
- 서비스 맵
- 트레이스 분석
- 응답 시간 분포
- 에러 분석

---

## 7. DynamoDB 성능 모니터링

### 7.1 DynamoDB 메트릭 확인

```bash
# 읽기 용량 사용률
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=table-order-data \
  --start-time 2026-02-09T00:00:00Z \
  --end-time 2026-02-09T23:59:59Z \
  --period 300 \
  --statistics Sum

# 쓰기 용량 사용률
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=table-order-data \
  --start-time 2026-02-09T00:00:00Z \
  --end-time 2026-02-09T23:59:59Z \
  --period 300 \
  --statistics Sum

# 쓰로틀링 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=table-order-data \
  --start-time 2026-02-09T00:00:00Z \
  --end-time 2026-02-09T23:59:59Z \
  --period 300 \
  --statistics Sum
```

---

## 8. 성능 테스트 체크리스트

### 부하 테스트
- [ ] 목표 RPS 달성 (50 req/sec)
- [ ] 평균 응답 시간 목표 달성
- [ ] P95/P99 응답 시간 목표 달성
- [ ] 에러율 1% 미만

### 스트레스 테스트
- [ ] Breaking point 확인
- [ ] 시스템 복구 확인
- [ ] 에러 핸들링 검증

### WebSocket 테스트
- [ ] 100개 동시 연결 성공
- [ ] 평균 연결 시간 1초 이내
- [ ] 메시지 전송/수신 정상

### Frontend 성능
- [ ] Lighthouse 성능 점수 90 이상
- [ ] FCP 2초 이내
- [ ] LCP 3초 이내
- [ ] CLS 0.1 이하

### AWS 리소스
- [ ] Lambda 실행 시간 3초 이내
- [ ] Lambda 메모리 사용률 80% 이하
- [ ] DynamoDB 쓰로틀링 없음
- [ ] API Gateway 에러율 1% 미만

---

## 9. 성능 최적화 권장사항

### Frontend
- React.memo() 사용으로 불필요한 리렌더링 방지
- 이미지 최적화 (WebP, lazy loading)
- Code splitting (React.lazy, Suspense)
- Service Worker 캐싱

### Backend
- Lambda 함수 메모리 최적화
- DynamoDB 쿼리 최적화 (GSI 활용)
- API Gateway 캐싱 활성화
- CloudFront CDN 활용

### Database
- DynamoDB Auto Scaling 설정
- 적절한 파티션 키 설계
- GSI 최적화
- TTL 설정으로 오래된 데이터 자동 삭제

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: 완료
