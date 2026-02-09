# 문제 해결 가이드

## 🔧 Service Worker 오류 해결

### 증상
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
workbox Precaching did not find a match for /@react-refresh
```

### 원인
브라우저에 캐시된 이전 Service Worker가 남아있어 발생하는 문제입니다.

### 해결 방법

#### 방법 1: 브라우저 캐시 완전 삭제 (권장)

**Chrome/Edge**:
1. 개발자 도구 열기 (F12)
2. Application 탭 클릭
3. 왼쪽 메뉴에서 "Storage" 클릭
4. "Clear site data" 버튼 클릭
5. 모든 항목 체크 후 "Clear site data" 클릭
6. 페이지 새로고침 (Ctrl+Shift+R)

**또는 간단한 방법**:
1. 개발자 도구 열기 (F12)
2. 새로고침 버튼을 우클릭
3. "Empty Cache and Hard Reload" 선택

#### 방법 2: Service Worker 수동 제거

1. 개발자 도구 열기 (F12)
2. Application 탭 → Service Workers
3. 등록된 모든 Service Worker에서 "Unregister" 클릭
4. 페이지 새로고침 (Ctrl+Shift+R)

#### 방법 3: 시크릿 모드 사용

1. Chrome/Edge에서 시크릿 창 열기 (Ctrl+Shift+N)
2. http://localhost:5173 접속
3. 캐시 없이 깨끗한 상태로 테스트 가능

---

## 🔒 CSP (Content Security Policy) 경고

### 증상
```
Content Security Policy of your site blocks the use of 'eval' in JavaScript
```

### 원인
개발 환경에서 React의 HMR (Hot Module Replacement)이 `eval()`을 사용하기 때문입니다.

### 해결 방법

**이 경고는 개발 환경에서 정상입니다!**

- ✅ 프로덕션 빌드 (`npm run build`)에서는 발생하지 않습니다
- ✅ 애플리케이션 기능에 영향을 주지 않습니다
- ✅ 무시해도 안전합니다

**확인 방법**:
1. http://localhost:5173/test 접속
2. 페이지가 정상적으로 렌더링되는지 확인
3. "테스트 버튼" 클릭하여 동작 확인

---

## 🐛 기타 일반적인 문제

### 1. Backend 서버 연결 오류

**증상**: API 호출 시 "Network Error" 또는 CORS 오류

**해결**:
```powershell
# Backend 서버 상태 확인
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Backend 서버 재시작
cd backend
npm start
```

### 2. Frontend 빌드 오류

**증상**: `npm run dev` 실행 시 오류

**해결**:
```powershell
cd frontend
# node_modules 삭제 후 재설치
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run dev
```

### 3. 로그인 실패

**증상**: "Invalid password" 또는 "Table not found"

**해결**:
- 올바른 테이블 번호 사용: `T001`, `T002`, `T003`
- 올바른 비밀번호 사용: `1234`
- Backend 서버가 실행 중인지 확인
- Backend 콘솔에서 에러 로그 확인

### 4. 포트 충돌

**증상**: "Port 3000 is already in use" 또는 "Port 5173 is already in use"

**해결**:
```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
taskkill /PID <PID> /F
```

### 5. 환경 변수 오류

**증상**: API 호출이 잘못된 URL로 전송됨

**해결**:
```powershell
# frontend/.env 파일 확인
cd frontend
Get-Content .env

# 내용이 다음과 같아야 함:
# VITE_API_BASE_URL=http://localhost:3000
# VITE_WS_URL=ws://localhost:3000
```

환경 변수 변경 후 Frontend 서버 재시작 필요!

---

## 🔍 디버깅 팁

### Backend 로그 확인
Backend 터미널에서 실시간 로그를 확인하세요:
- API 요청/응답
- Mock DynamoDB 작업
- 에러 메시지

### Frontend 개발자 도구
브라우저 개발자 도구 (F12):
- **Console**: JavaScript 에러 및 로그
- **Network**: API 요청/응답 상세 정보
- **Application**: 
  - LocalStorage: 저장된 토큰 확인
  - Service Workers: 등록된 Service Worker 확인
  - Cache Storage: 캐시된 리소스 확인

### API 직접 테스트
PowerShell에서 API를 직접 호출하여 테스트:
```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:3000/health"

# 로그인 테스트
$body = @{
    storeId = "STORE123"
    tableNumber = "T001"
    tablePassword = "1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/table-login" -Method POST -Body $body -ContentType "application/json"
$response | ConvertTo-Json
```

---

## 📞 추가 도움이 필요한 경우

1. Backend 콘솔 로그 전체 복사
2. Frontend 브라우저 콘솔 에러 메시지 복사
3. Network 탭에서 실패한 요청의 상세 정보 확인
4. 위 정보를 바탕으로 문제 분석

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**최종 업데이트**: 2026-02-09
