# Admin Frontend 구현 가이드

## 📋 개요

이 문서는 Admin Unit의 Frontend를 구현하기 위한 상세 가이드입니다.

---

## 🎯 구현 목표

Admin Backend API를 사용하여 관리자가 주문, 메뉴, 테이블을 관리할 수 있는 웹 대시보드를 구현합니다.

---

## 🏗️ 프로젝트 구조

```
admin-frontend/
├── public/
│   └── index.html
├── src/
│   ├── admin/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx          # 로그인 페이지
│   │   │   ├── DashboardPage.tsx      # 대시보드 (주문 관리)
│   │   │   ├── MenuManagementPage.tsx # 메뉴 관리
│   │   │   └── TableManagementPage.tsx # 테이블 관리
│   │   ├── components/
│   │   │   ├── OrderCard.tsx          # 주문 카드
│   │   │   ├── MenuForm.tsx           # 메뉴 폼
│   │   │   └── TableCard.tsx          # 테이블 카드
│   │   └── stores/
│   │       └── authStore.ts           # 인증 상태 관리
│   ├── shared/
│   │   ├── api/
│   │   │   └── adminApiClient.ts      # Admin API 클라이언트
│   │   ├── components/
│   │   │   ├── Layout.tsx             # 레이아웃
│   │   │   ├── Sidebar.tsx            # 사이드바
│   │   │   └── Header.tsx             # 헤더
│   │   └── utils/
│   │       ├── auth.ts                # 인증 유틸리티
│   │       └── constants.ts           # 상수
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📦 기술 스택

### Core
- **React**: 18.2+
- **TypeScript**: 5.0+
- **Vite**: 5.0+ (빌드 도구)

### UI Framework
- **Material-UI (MUI)**: 5.15+ (권장)
  - 풍부한 컴포넌트
  - 반응형 디자인
  - 테마 커스터마이징

### State Management
- **Zustand**: 4.4+ (간단한 상태 관리)
- **SWR**: 2.2+ (데이터 페칭 및 캐싱)

### Routing
- **React Router**: 6.20+

### HTTP Client
- **Axios**: 1.6+ (API 통신)

---

## 🚀 시작하기

### 1. 프로젝트 생성

```bash
npm create vite@latest admin-frontend -- --template react-ts
cd admin-frontend
npm install
```

### 2. 의존성 설치

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install react-router-dom zustand swr axios
npm install react-toastify
```

### 3. 환경 변수 설정

`.env` 파일 생성:
```env
VITE_ADMIN_API_BASE_URL=http://localhost:3000
```

---

## 📄 주요 페이지 구현

### 1. LoginPage.tsx

**기능**:
- 매장 ID, 사용자명, 비밀번호 입력
- JWT 토큰 발급 및 저장
- 로그인 실패 시 에러 메시지 표시

**API**:
- `POST /auth/login`

**구현 예시**:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { adminApiClient } from '../../shared/api/adminApiClient';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [storeId, setStoreId] = useState('store-001');
  const [username, setUsername] = useState('admin1');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await adminApiClient.post('/auth/login', {
        storeId,
        username,
        password
      });

      const { token, admin, expiresAt } = response.data;
      
      // Store auth info
      setAuth(token, admin, expiresAt);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '로그인 실패');
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: 'grey.100'
    }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h4" gutterBottom>
          관리자 로그인
        </Typography>
        
        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="매장 ID"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="사용자명"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
          >
            로그인
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
```

---

### 2. DashboardPage.tsx (주문 관리)

**기능**:
- 실시간 주문 목록 조회 (5초 자동 갱신)
- 주문 상태 변경 (PENDING → PREPARING → COMPLETED)
- 주문 삭제 (PENDING만 가능)
- 주문 상세 정보 표시

**API**:
- `GET /orders?storeId={storeId}`
- `PATCH /orders/{orderId}/status`
- `DELETE /orders/{orderId}`

**구현 예시**:
```tsx
import { useState } from 'react';
import useSWR from 'swr';
import { 
  Box, Grid, Card, CardContent, Typography, 
  Button, Chip, IconButton 
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { adminApiClient } from '../../shared/api/adminApiClient';
import { useAuthStore } from '../stores/authStore';
import Layout from '../../shared/components/Layout';

const fetcher = (url: string) => 
  adminApiClient.get(url).then(res => res.data);

export default function DashboardPage() {
  const admin = useAuthStore(state => state.admin);
  
  const { data: orders, error, mutate } = useSWR(
    `/orders?storeId=${admin?.storeId}`,
    fetcher,
    { refreshInterval: 5000 } // 5초마다 자동 갱신
  );

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminApiClient.patch(`/orders/${orderId}/status`, {
        status: newStatus
      });
      mutate(); // 데이터 갱신
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await adminApiClient.delete(`/orders/${orderId}`);
      mutate(); // 데이터 갱신
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PREPARING': return 'info';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  const getNextStatus = (status: string) => {
    switch (status) {
      case 'PENDING': return 'PREPARING';
      case 'PREPARING': return 'COMPLETED';
      default: return null;
    }
  };

  if (error) return <div>에러 발생</div>;
  if (!orders) return <div>로딩 중...</div>;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          주문 관리
        </Typography>
        
        <Grid container spacing={2}>
          {orders.map((order: any) => (
            <Grid item xs={12} md={6} lg={4} key={order.orderId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      주문 #{order.orderNumber}
                    </Typography>
                    <Chip 
                      label={order.status} 
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    테이블: {order.tableId}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    항목:
                  </Typography>
                  {order.items.map((item: any, idx: number) => (
                    <Typography key={idx} variant="body2" color="text.secondary">
                      - {item.menuName} x {item.quantity}
                    </Typography>
                  ))}
                  
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    총액: {order.totalAmount.toLocaleString()}원
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    {getNextStatus(order.status) && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleStatusChange(order.orderId, getNextStatus(order.status)!)}
                      >
                        {getNextStatus(order.status)}로 변경
                      </Button>
                    )}
                    
                    {order.status === 'PENDING' && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(order.orderId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
}
```

---

### 3. MenuManagementPage.tsx

**기능**:
- 메뉴 목록 조회 (카테고리별 필터링)
- 메뉴 생성 (이름, 가격, 설명, 카테고리, 이미지)
- 메뉴 수정
- 메뉴 삭제
- 이미지 업로드 (S3 presigned URL)

**API**:
- `GET /menus?storeId={storeId}&category={category}`
- `POST /menus`
- `PUT /menus/{menuId}`
- `DELETE /menus/{menuId}`
- `POST /menus/upload-url`

**구현 예시**:
```tsx
import { useState } from 'react';
import useSWR from 'swr';
import { 
  Box, Grid, Card, CardContent, CardMedia, Typography, 
  Button, Dialog, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { adminApiClient } from '../../shared/api/adminApiClient';
import { useAuthStore } from '../stores/authStore';
import Layout from '../../shared/components/Layout';

const fetcher = (url: string) => 
  adminApiClient.get(url).then(res => res.data);

export default function MenuManagementPage() {
  const admin = useAuthStore(state => state.admin);
  const [category, setCategory] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  
  const { data: menus, mutate } = useSWR(
    `/menus?storeId=${admin?.storeId}${category !== 'ALL' ? `&category=${category}` : ''}`,
    fetcher
  );

  const handleCreate = () => {
    setEditingMenu(null);
    setDialogOpen(true);
  };

  const handleEdit = (menu: any) => {
    setEditingMenu(menu);
    setDialogOpen(true);
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await adminApiClient.delete(`/menus/${menuId}`);
      mutate();
    } catch (error) {
      console.error('Failed to delete menu:', error);
    }
  };

  const handleSave = async (menuData: any) => {
    try {
      if (editingMenu) {
        await adminApiClient.put(`/menus/${editingMenu.menuId}`, menuData);
      } else {
        await adminApiClient.post('/menus', {
          ...menuData,
          storeId: admin?.storeId
        });
      }
      mutate();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save menu:', error);
    }
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">
            메뉴 관리
          </Typography>
          <Button variant="contained" onClick={handleCreate}>
            메뉴 추가
          </Button>
        </Box>
        
        <FormControl sx={{ mb: 3, minWidth: 200 }}>
          <InputLabel>카테고리</InputLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            label="카테고리"
          >
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="APPETIZER">애피타이저</MenuItem>
            <MenuItem value="MAIN">메인</MenuItem>
            <MenuItem value="DESSERT">디저트</MenuItem>
            <MenuItem value="BEVERAGE">음료</MenuItem>
            <MenuItem value="ALCOHOL">주류</MenuItem>
          </Select>
        </FormControl>
        
        <Grid container spacing={2}>
          {menus?.map((menu: any) => (
            <Grid item xs={12} sm={6} md={4} key={menu.menuId}>
              <Card>
                {menu.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={menu.imageUrl}
                    alt={menu.menuName}
                  />
                )}
                <CardContent>
                  <Typography variant="h6">{menu.menuName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {menu.description}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {menu.price.toLocaleString()}원
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => handleEdit(menu)}>
                      수정
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(menu.menuId)}>
                      삭제
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Menu Dialog (생성/수정) */}
        <MenuDialog
          open={dialogOpen}
          menu={editingMenu}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      </Box>
    </Layout>
  );
}

// MenuDialog 컴포넌트는 별도 파일로 분리 권장
function MenuDialog({ open, menu, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    menuName: menu?.menuName || '',
    price: menu?.price || 0,
    description: menu?.description || '',
    category: menu?.category || 'MAIN',
    imageUrl: menu?.imageUrl || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {menu ? '메뉴 수정' : '메뉴 추가'}
        </Typography>
        
        <TextField
          fullWidth
          label="메뉴명"
          value={formData.menuName}
          onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
          margin="normal"
          required
        />
        
        <TextField
          fullWidth
          label="가격"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          margin="normal"
          required
        />
        
        <TextField
          fullWidth
          label="설명"
          multiline
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          margin="normal"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>카테고리</InputLabel>
          <Select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            label="카테고리"
          >
            <MenuItem value="APPETIZER">애피타이저</MenuItem>
            <MenuItem value="MAIN">메인</MenuItem>
            <MenuItem value="DESSERT">디저트</MenuItem>
            <MenuItem value="BEVERAGE">음료</MenuItem>
            <MenuItem value="ALCOHOL">주류</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>취소</Button>
          <Button type="submit" variant="contained">저장</Button>
        </Box>
      </Box>
    </Dialog>
  );
}
```

---

### 4. TableManagementPage.tsx

**기능**:
- 테이블 세션 종료 (이용 완료 처리)
- 테이블별 주문 이력 조회

**API**:
- `POST /tables/{tableId}/complete`
- `GET /tables/{tableId}/history`

---

## 🔐 인증 관리

### authStore.ts (Zustand)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  adminId: string;
  username: string;
  storeId: string;
  role: string;
}

interface AuthState {
  token: string | null;
  admin: Admin | null;
  expiresAt: string | null;
  setAuth: (token: string, admin: Admin, expiresAt: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      expiresAt: null,
      
      setAuth: (token, admin, expiresAt) => {
        set({ token, admin, expiresAt });
      },
      
      clearAuth: () => {
        set({ token: null, admin: null, expiresAt: null });
      },
      
      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return new Date(expiresAt) > new Date();
      }
    }),
    {
      name: 'admin-auth-storage'
    }
  )
);
```

---

## 🌐 API 클라이언트

### adminApiClient.ts

```typescript
import axios from 'axios';
import { useAuthStore } from '../admin/stores/authStore';

const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add JWT token
adminApiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 Unauthorized
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { adminApiClient };
```

---

## 🎨 레이아웃

### Layout.tsx

```tsx
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <Header />
        <Box component="main">
          {children}
        </Box>
      </Box>
    </Box>
  );
}
```

---

## 🧪 테스트

### 로컬 테스트 순서

1. **Admin Backend 실행** (Mock 모드):
```bash
cd admin-api
npm run dev
```

2. **Admin Frontend 실행**:
```bash
cd admin-frontend
npm run dev
```

3. **로그인 테스트**:
- URL: http://localhost:5173/login
- StoreId: `store-001`
- Username: `admin1`
- Password: `password123` (Mock 모드에서는 아무 비밀번호나 가능)

4. **기능 테스트**:
- 주문 목록 조회
- 주문 상태 변경
- 메뉴 CRUD
- 테이블 관리

---

## 📝 체크리스트

### 필수 구현
- [ ] 로그인 페이지
- [ ] 주문 관리 대시보드
- [ ] 메뉴 관리 페이지
- [ ] 테이블 관리 페이지
- [ ] 레이아웃 (Sidebar, Header)
- [ ] 인증 상태 관리 (Zustand)
- [ ] API 클라이언트 (Axios)
- [ ] 라우팅 (React Router)

### 선택 구현
- [ ] 이미지 업로드 (S3 presigned URL)
- [ ] 실시간 주문 알림 (SSE)
- [ ] 통계 대시보드
- [ ] 관리자 계정 관리
- [ ] RBAC 권한 체크

---

## 🚀 배포

### 빌드

```bash
npm run build
```

### S3 + CloudFront 배포

```bash
aws s3 sync dist/ s3://admin-frontend-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: Admin Frontend 구현 가이드
