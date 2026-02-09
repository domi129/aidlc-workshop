import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Divider
} from '@mui/material';
import { CheckCircle, Restaurant, Receipt } from '@mui/icons-material';

function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          {/* Success Icon */}
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />

          {/* Title */}
          <Typography variant="h4" gutterBottom>
            주문이 완료되었습니다!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            주문이 정상적으로 접수되었습니다
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Order Info */}
          {orderId && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                주문 번호
              </Typography>
              <Typography variant="h6" color="primary">
                {orderId}
              </Typography>
            </Box>
          )}

          <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1, mb: 3 }}>
            <Typography variant="body2" color="info.dark">
              💡 주문 내역은 주문 내역 페이지에서 확인하실 수 있습니다
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Receipt />}
              onClick={() => navigate('/orders')}
            >
              주문 내역 보기
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Restaurant />}
              onClick={() => navigate('/menu')}
            >
              메뉴로 돌아가기
            </Button>
          </Box>

          {countdown > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              {countdown}초 후 자동으로 주문 내역으로 이동합니다
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default OrderSuccessPage;
