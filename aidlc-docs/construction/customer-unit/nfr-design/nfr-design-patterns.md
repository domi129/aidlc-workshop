# Customer Unit - NFR Design Patterns

## Overview
Customer Unit의 NFR 요구사항을 구현하기 위한 디자인 패턴을 정의합니다.

---

## 1. Resilience Patterns

### 1.1 API 재시도 패턴 (Exponential Backoff)

**목적**: 일시적인 네트워크 오류나 서버 오류 시 자동 재시도

**패턴**: Exponential Backoff with Jitter

**구현**:
```javascript
// utils/apiRetry.js
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const retryableErrors = [500, 502, 503, 504];
  const nonRetryableErrors = [400, 401, 403, 404];
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // 성공 응답
      if (response.ok) {
        return response;
      }
      
      // 재시도 불가능한 에러
      if (nonRetryableErrors.includes(response.status)) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      // 재시도 가능한 에러
      if (retryableErrors.includes(response.status)) {
        if (attempt === maxRetries - 1) {
          throw new Error(`Server error after ${maxRetries} retries`);
        }
        
        // 지수 백오프 대기
        const delay = Math.pow(2, attempt) * 1000; // 1초, 2초, 4초
        await sleep(delay);
        continue;
      }
      
      // 기타 에러
      throw new Error(`Unexpected error: ${response.status}`);
      
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // 네트워크 오류 시 재시도
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**적용 대상**:
- 주문 생성 API (POST /api/orders)
- 메뉴 조회 API (GET /api/menus)
- 주문 내역 조회 API (GET /api/orders)

**재시도 제외 대상**:
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found

### 1.2 네트워크 연결 끊김 재연결 패턴

**목적**: 네트워크 연결 끊김 시 자동 재연결

**패턴**: Exponential Backoff Reconnection

**구현**:
```javascript
// hooks/useNetworkStatus.js
import { useState, useEffect } from 'react';

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setReconnectAttempt(0);
      // 성공 메시지 표시
      showToast('온라인 상태로 전환되었습니다', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      // 오프라인 배너 표시
      showToast('네트워크 연결이 끊겼습니다', 'error');
      
      // 재연결 시도
      startReconnection();
    };

    const startReconnection = () => {
      const delays = [5000, 10000, 20000]; // 5초, 10초, 20초
      
      const attemptReconnect = (attempt) => {
        if (attempt >= delays.length) {
          attempt = delays.length - 1; // 최대 20초 간격 유지
        }
        
        setTimeout(() => {
          if (!navigator.onLine) {
            setReconnectAttempt(attempt + 1);
            attemptReconnect(attempt + 1);
          }
        }, delays[attempt]);
      };
      
      attemptReconnect(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, reconnectAttempt };
}
```

**UI 표시**:
```javascript
// components/NetworkStatusBanner.jsx
function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="network-banner offline">
      <span>⚠️ 오프라인 상태입니다. 재연결 시도 중...</span>
    </div>
  );
}
```

### 1.3 SSE 재연결 패턴

**목적**: SSE 연결 끊김 시 자동 재연결

**패턴**: Fixed Delay Reconnection

**구현**:
```javascript
// hooks/useSSE.js
import { useEffect, useState } from 'react';

function useSSE(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let eventSource;
    let reconnectTimeout;

    const connect = () => {
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
        setError(null);
      };

      eventSource.onerror = () => {
        eventSource.close();
        setError('SSE 연결 오류');
        
        // 3초 후 재연결 시도
        reconnectTimeout = setTimeout(() => {
          console.log('SSE 재연결 시도...');
          connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [url]);

  return { data, error };
}
```

---

## 2. Scalability Patterns

### 2.1 무상태 아키텍처 패턴

**목적**: 수평 확장 가능한 백엔드 설계

**패턴**: Stateless Backend with JWT

**구현 원칙**:
- 서버는 세션 상태를 저장하지 않음
- 모든 인증 정보는 JWT 토큰에 포함
- 요청 간 상태 공유 없음

**JWT 토큰 구조**:
```javascript
// utils/jwt.js
const jwt = require('jsonwebtoken');

function generateAccessToken(payload) {
  return jwt.sign(
    {
      tableId: payload.tableId,
      storeId: payload.storeId,
      sessionId: payload.sessionId,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: '16h' }
  );
}

function generateRefreshToken(payload) {
  return jwt.sign(
    {
      tableId: payload.tableId,
      storeId: payload.storeId,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}
```

**장점**:
- 로드 밸런서를 통한 수평 확장 가능
- 서버 인스턴스 추가/제거 용이
- 세션 스토어 불필요

### 2.2 캐싱 패턴 (SWR)

**목적**: 메뉴 데이터 캐싱으로 API 호출 감소

**패턴**: Stale-While-Revalidate

**구현**:
```javascript
// hooks/useMenus.js
import useSWR from 'swr';

function useMenus(storeId, category) {
  const { data, error, isLoading } = useSWR(
    `/api/menus?storeId=${storeId}&category=${category}`,
    fetcher,
    {
      revalidateOnFocus: false,      // 포커스 시 재검증 안 함
      revalidateOnReconnect: true,   // 재연결 시 재검증
      dedupingInterval: 300000,      // 5분 캐싱
      errorRetryCount: 3,            // 에러 시 3회 재시도
      errorRetryInterval: 1000       // 재시도 간격 1초
    }
  );

  return {
    menus: data,
    isLoading,
    isError: error
  };
}
```

**캐싱 전략**:
- 메뉴 데이터: 5분 캐싱
- 주문 데이터: 캐싱 없음 (실시간 데이터)
- 장바구니: LocalStorage (영구 캐싱)

### 2.3 이미지 Lazy Loading 패턴

**목적**: 초기 페이지 로드 시간 단축

**패턴**: Intersection Observer

**구현**:
```javascript
// components/LazyImage.jsx
import { useState, useEffect, useRef } from 'react';

function LazyImage({ src, alt, placeholder }) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();

  useEffect(() => {
    let observer;
    
    if (imageRef && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { rootMargin: '50px' }
      );
      
      observer.observe(imageRef);
    }
    
    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, src, placeholder]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      onError={(e) => {
        e.target.src = '/images/placeholder.png';
      }}
    />
  );
}
```

---

## 3. Performance Patterns

### 3.1 React 컴포넌트 최적화 패턴

**목적**: 불필요한 리렌더링 방지

**패턴**: Memoization

**구현**:
```javascript
// components/MenuCard.jsx
import React, { memo, useMemo, useCallback } from 'react';

const MenuCard = memo(({ menu, onAddToCart }) => {
  // 계산 비용이 높은 값 메모이제이션
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(menu.price);
  }, [menu.price]);

  // 콜백 함수 메모이제이션
  const handleAddToCart = useCallback(() => {
    onAddToCart(menu);
  }, [menu, onAddToCart]);

  return (
    <div className="menu-card">
      <LazyImage src={menu.imageUrl} alt={menu.menuName} />
      <h3>{menu.menuName}</h3>
      <p>{menu.description}</p>
      <span>{formattedPrice}</span>
      <button onClick={handleAddToCart}>추가</button>
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  return prevProps.menu.menuId === nextProps.menu.menuId &&
         prevProps.menu.price === nextProps.menu.price;
});
```

**적용 대상**:
- MenuCard (메뉴 카드)
- CartItem (장바구니 항목)
- OrderCard (주문 카드)

### 3.2 번들 크기 최적화 (향후 계획)

**목적**: 초기 로드 시간 단축

**패턴**: Code Splitting + Tree Shaking

**향후 구현 계획**:
```javascript
// App.jsx (향후)
import { lazy, Suspense } from 'react';

const MenuPage = lazy(() => import('./pages/MenuPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-history" element={<OrderHistoryPage />} />
      </Routes>
    </Suspense>
  );
}
```

**초기 버전**: Tree Shaking만 적용 (Vite 기본 제공)

### 3.3 API 요청 최적화 (향후 계획)

**목적**: 불필요한 API 요청 감소

**패턴**: Request Debouncing

**향후 구현 계획**:
```javascript
// hooks/useDebounce.js (향후)
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 사용 예시 (향후)
function SearchMenu() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data } = useSWR(
    debouncedSearchTerm ? `/api/menus/search?q=${debouncedSearchTerm}` : null,
    fetcher
  );

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="메뉴 검색..."
    />
  );
}
```

**초기 버전**: SWR 자동 중복 제거 기능만 사용

---

## 4. Security Patterns

### 4.1 JWT 인증 패턴

**목적**: 무상태 인증 및 권한 부여

**패턴**: Bearer Token Authentication

**토큰 저장**:
```javascript
// utils/auth.js
class AuthService {
  static setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
```

**주의사항**:
- LocalStorage는 XSS 공격에 취약
- 프로덕션 환경에서는 HttpOnly Cookie 고려 필요
- 초기 버전에서는 개발 편의를 위해 LocalStorage 사용

### 4.2 CORS 설정 패턴

**목적**: Cross-Origin 요청 허용

**패턴**: Permissive CORS (초기 버전)

**구현**:
```javascript
// backend/app.js
const cors = require('cors');

app.use(cors({
  origin: '*',  // 모든 도메인 허용 (초기 버전)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**주의사항**:
- 모든 도메인 허용은 보안 위험
- CSRF 공격에 취약
- 프로덕션 환경에서는 화이트리스트 권장
- 초기 버전에서는 개발 편의를 위해 모든 도메인 허용

### 4.3 입력 검증 패턴 (프론트엔드)

**목적**: 사용자 입력 검증

**패턴**: Client-Side Validation Only (초기 버전)

**구현**:
```javascript
// utils/validation.js
class Validator {
  static validateOrder(order) {
    if (!order.items || order.items.length === 0) {
      throw new Error('장바구니가 비어있습니다');
    }

    order.items.forEach(item => {
      if (item.quantity < 1 || item.quantity > 99) {
        throw new Error('수량은 1~99 사이여야 합니다');
      }
    });

    if (order.totalAmount <= 0) {
      throw new Error('주문 금액이 올바르지 않습니다');
    }

    return true;
  }
}
```

**주의사항**:
- 프론트엔드만 검증 시 악의적인 API 호출 방어 불가
- 백엔드 검증 추가 권장
- 초기 버전에서는 개발 편의를 위해 프론트엔드만 검증

### 4.4 XSS 방어 패턴

**목적**: Cross-Site Scripting 공격 방어

**패턴**: React Default Escaping

**구현**:
```javascript
// React는 기본적으로 모든 값을 이스케이프
function MenuCard({ menu }) {
  return (
    <div>
      <h3>{menu.menuName}</h3>  {/* 자동 이스케이프 */}
      <p>{menu.description}</p>  {/* 자동 이스케이프 */}
    </div>
  );
}

// HTML 렌더링이 필요한 경우 (사용 금지)
// <div dangerouslySetInnerHTML={{ __html: menu.description }} />
```

**원칙**:
- dangerouslySetInnerHTML 사용 금지
- 모든 사용자 입력은 React가 자동 이스케이프
- HTML 렌더링이 필요한 경우 DOMPurify 사용 (향후)

---

## 5. Error Handling Patterns

### 5.1 전역 에러 처리 패턴

**목적**: 일관된 에러 처리

**패턴**: Centralized Error Handling

**프론트엔드**:
```javascript
// components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 향후: Sentry 등 에러 추적 도구로 전송
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>문제가 발생했습니다</h2>
          <p>페이지를 새로고침해주세요</p>
          <button onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**백엔드**:
```javascript
// middleware/errorMiddleware.js
function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] [ERROR]`, err);

  // 사용자 친화적 메시지 변환
  const statusCode = err.statusCode || 500;
  const message = err.message || '일시적인 오류가 발생했습니다';

  res.status(statusCode).json({
    error: {
      message,
      statusCode
    }
  });
}

module.exports = errorHandler;
```

### 5.2 토스트 알림 패턴

**목적**: 사용자에게 피드백 제공

**패턴**: Toast Notification

**구현**:
```javascript
// utils/toast.js
import { toast } from 'react-toastify';

class ToastService {
  static success(message) {
    toast.success(message, {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false
    });
  }

  static error(message) {
    toast.error(message, {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false
    });
  }

  static info(message) {
    toast.info(message, {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false
    });
  }
}

export default ToastService;
```

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 생성 완료
