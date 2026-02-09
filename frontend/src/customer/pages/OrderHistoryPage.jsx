import useSWR from 'swr';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  Paper,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { ArrowBack, Restaurant } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import fetcher from '../../shared/api/fetcher';
import AuthService from '../../shared/utils/auth';
import Loading from '../../shared/components/Loading';

const statusColors = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
  completed: 'default',
  cancelled: 'error'
};

const statusLabels = {
  pending: '대기중',
  confirmed: '접수완료',
  preparing: '조리중',
  ready: '준비완료',
  completed: '완료',
  cancelled: '취소됨'
};

function OrderHistoryPage() {
  const navigate = useNavigate();
  const tableInfo = AuthService.getTableInfo();

  const { data: orders, error, isLoading } = useSWR(
    `/orders?tableId=${tableInfo?.tableId || 'T001'}`,
    fetcher,
    { refreshInterval: 5000 } // 5초마다 자동 갱신
  );

  if (isLoading) return <Loading message="주문 내역을 불러오는 중..." />;
  if (error) return <Typography color="error">주문 내역을 불러오는데 실패했습니다</Typography>;

  return (
    <Box>
      {/* Header */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/menu')}>
            <ArrowBack />
          </IconButton>
          <Restaurant sx={{ ml: 1, mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            주문 내역
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
        {orders && orders.length > 0 ? (
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {orders.map((order) => (
              <Card 
                key={order.orderId} 
                elevation={3}
                sx={{
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent>
                  {/* Order Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        주문 번호
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        #{order.orderNumber}
                      </Typography>
                    </Box>
                    <Chip
                      label={statusLabels[order.status] || order.status}
                      color={statusColors[order.status] || 'default'}
                      size="medium"
                      sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Order Items */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
                      주문 항목
                    </Typography>
                    {order.items && order.items.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          py: 1,
                          px: 2,
                          bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent',
                          borderRadius: 1
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.menuName} <Typography component="span" color="text.secondary">x {item.quantity}</Typography>
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {((item.unitPrice || item.price || 0) * item.quantity).toLocaleString()}원
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Order Summary */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      주문 시간: {new Date(order.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        총 금액
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                        {order.totalAmount.toLocaleString()}원
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Restaurant sx={{ fontSize: 100, color: 'text.secondary', mb: 3, opacity: 0.5 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              주문 내역이 없습니다
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              메뉴를 주문해보세요
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/menu')}
              sx={{
                fontWeight: 600,
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              메뉴 보러가기
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default OrderHistoryPage;
