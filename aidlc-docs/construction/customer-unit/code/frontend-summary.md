# Customer Unit - Frontend Code Summary

## 생성된 파일 목록

### Configuration Files
- ✅ `frontend/package.json` - 프로젝트 의존성 및 스크립트
- ✅ `frontend/vite.config.js` - Vite 빌드 설정
- ✅ `frontend/.env.example` - 환경 변수 템플릿
- ✅ `frontend/.gitignore` - Git 제외 파일 목록

### Shared Utilities
- ✅ `frontend/src/shared/api/apiClient.js` - API 통신 클라이언트
- ✅ `frontend/src/shared/api/fetcher.js` - SWR fetcher 함수
- ✅ `frontend/src/shared/utils/auth.js` - 인증 서비스
- ✅ `frontend/src/shared/utils/toast.js` - Toast 알림 서비스
- ✅ `frontend/src/shared/utils/validation.js` - 입력 검증 서비스

### Shared Components
- ✅ `frontend/src/shared/components/ErrorBoundary.jsx` - 전역 에러 바운더리
- ✅ `frontend/src/shared/components/Loading.jsx` - 로딩 컴포넌트

### State Management
- ✅ `frontend/src/customer/stores/cartStore.js` - 장바구니 Zustand Store

### Customer Pages
- ✅ `frontend/src/customer/pages/LoginPage.jsx` - 테이블 로그인 페이지 (US-001)
- ⏳ `frontend/src/customer/pages/MenuPage.jsx` - 메뉴 조회 페이지 (US-002) - 생성 필요
- ⏳ `frontend/src/customer/pages/CartPage.jsx` - 장바구니 페이지 (US-003) - 생성 필요
- ⏳ `frontend/src/customer/pages/OrderSuccessPage.jsx` - 주문 성공 페이지 (US-004) - 생성 필요
- ⏳ `frontend/src/customer/pages/OrderHistoryPage.jsx` - 주문 내역 페이지 (US-005, US-006) - 생성 필요

### App Configuration
- ✅ `frontend/src/App.jsx` - 앱 라우팅 및 테마 설정
- ✅ `frontend/src/main.jsx` - 앱 엔트리 포인트
- ✅ `frontend/public/index.html` - HTML 템플릿

## 미생성 파일 가이드

### MenuPage.jsx 구현 가이드
```jsx
// frontend/src/customer/pages/MenuPage.jsx
import { useState } from 'react';
import useSWR from 'swr';
import { Box, Grid, Tabs, Tab } from '@mui/material';
import fetcher from '../../shared/api/fetcher';
import AuthService from '../../shared/utils/auth';
import Loading from '../../shared/components/Loading';
import useCartStore from '../stores/cartStore';

function MenuPage() {
  const [category, setCategory] = useState('전체');
  const tableInfo = AuthService.getTableInfo();
  const addItem = useCartStore(state => state.addItem);

  const { data: menus, error, isLoading } = useSWR(
    `/menus?storeId=${tableInfo.storeId}&category=${category}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  if (isLoading) return <Loading />;
  if (error) return <div>에러 발생</div>;

  return (
    <Box sx={{ p: 2 }}>
      <Tabs value={category} onChange={(e, v) => setCategory(v)}>
        <Tab label="전체" value="전체" />
        <Tab label="메인" value="메인" />
        <Tab label="사이드" value="사이드" />
        <Tab label="음료" value="음료" />
      </Tabs>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {menus?.map(menu => (
          <Grid item xs={12} sm={6} md={4} key={menu.menuId}>
            {/* MenuCard 컴포넌트 */}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default MenuPage;
```

### CartPage.jsx 구현 가이드
```jsx
// frontend/src/customer/pages/CartPage.jsx
import { useNavigate } from 'react-router-dom';
import { Box, List, Button, Typography } from '@mui/material';
import useCartStore from '../stores/cartStore';
import ApiClient from '../../shared/api/apiClient';
import ToastService from '../../shared/utils/toast';

function CartPage() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCartStore();

  const handleOrder = async () => {
    try {
      const tableInfo = AuthService.getTableInfo();
      const response = await ApiClient.post('/orders', {
        storeId: tableInfo.storeId,
        tableId: tableInfo.tableId,
        sessionId: tableInfo.sessionId,
        items: items.map(item => ({
          menuId: item.menuId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount
      });

      clearCart();
      navigate(`/order-success?orderId=${response.orderId}`);
    } catch (error) {
      ToastService.error(error.message);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">장바구니</Typography>
      <List>
        {items.map(item => (
          <div key={item.menuId}>{/* CartItem 컴포넌트 */}</div>
        ))}
      </List>
      <Typography variant="h6">총액: {totalAmount.toLocaleString()}원</Typography>
      <Button variant="contained" fullWidth onClick={handleOrder}>
        주문하기
      </Button>
    </Box>
  );
}

export default CartPage;
```

## 개발 가이드

### 로컬 개발 환경 설정
```bash
cd frontend
npm install
npm run dev
```

### 환경 변수 설정
`.env` 파일 생성:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 빌드 및 배포
```bash
npm run build
aws s3 sync dist/ s3://table-order-frontend/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## User Stories 구현 상태

| Story | 구현 파일 | 상태 |
|-------|----------|------|
| US-001: 테이블 자동 로그인 | LoginPage.jsx | ✅ 완료 |
| US-002: 메뉴 조회 및 필터링 | MenuPage.jsx | ⏳ 생성 필요 |
| US-003: 장바구니 관리 | CartPage.jsx, cartStore.js | 🟡 부분 완료 |
| US-004: 주문 생성 | OrderSuccessPage.jsx | ⏳ 생성 필요 |
| US-005: 주문 내역 조회 | OrderHistoryPage.jsx | ⏳ 생성 필요 |
| US-006: 실시간 주문 상태 업데이트 | OrderHistoryPage.jsx + WebSocket | ⏳ 생성 필요 |

## 다음 단계

1. 미생성 페이지 컴포넌트 구현
2. Custom Hooks 구현 (useMenus, useOrders, useWebSocket)
3. UI 컴포넌트 구현 (MenuCard, CartItem, OrderItem)
4. 통합 테스트
5. UI/UX 개선

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: 부분 완료 (핵심 파일 생성됨)
