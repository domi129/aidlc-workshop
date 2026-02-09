import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Paper,
  Divider,
  AppBar,
  Toolbar,
  Card,
  CardContent
} from '@mui/material';
import { Add, Remove, Delete, ArrowBack, ShoppingCart, Restaurant } from '@mui/icons-material';
import useCartStore from '../stores/cartStore';
import ApiClient from '../../shared/api/apiClient';
import AuthService from '../../shared/utils/auth';
import ToastService from '../../shared/utils/toast';
import { useState } from 'react';

function CartPage() {
  const navigate = useNavigate();
  const { items, totalAmount, totalQuantity, updateQuantity, removeItem, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const handleIncreaseQuantity = (menuId) => {
    const item = items.find(i => i.menuId === menuId);
    if (item) {
      updateQuantity(menuId, item.quantity + 1);
    }
  };

  const handleDecreaseQuantity = (menuId) => {
    const item = items.find(i => i.menuId === menuId);
    if (item && item.quantity > 1) {
      updateQuantity(menuId, item.quantity - 1);
    }
  };

  const handleRemoveItem = (menuId) => {
    removeItem(menuId);
    ToastService.info('항목이 삭제되었습니다');
  };

  const handleOrder = async () => {
    if (items.length === 0) {
      ToastService.error('장바구니가 비어있습니다');
      return;
    }

    setLoading(true);
    try {
      const tableInfo = AuthService.getTableInfo();
      const response = await ApiClient.post('/orders', {
        storeId: tableInfo.storeId,
        tableId: tableInfo.tableId,
        sessionId: tableInfo.sessionId,
        items: items.map(item => ({
          menuId: item.menuId,
          menuName: item.menuName,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount
      });

      clearCart();
      ToastService.success('주문이 완료되었습니다!');
      navigate(`/order-success?orderId=${response.orderId}`);
    } catch (error) {
      ToastService.error(error.message || '주문 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/menu')}>
            <ArrowBack />
          </IconButton>
          <ShoppingCart sx={{ ml: 1, mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            장바구니
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 3, mb: 10 }}>
        {items.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <ShoppingCart sx={{ fontSize: 100, color: 'text.secondary', mb: 3, opacity: 0.5 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              장바구니가 비어있습니다
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              메뉴를 담아보세요
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
        ) : (
          <>
            {/* Cart Items */}
            <Card elevation={3}>
              <List>
                {items.map((item, index) => (
                  <Box key={item.menuId}>
                    <ListItem
                      sx={{
                        py: 2,
                        '&:hover': {
                          bgcolor: 'grey.50'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {item.menuName}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              단가: {item.price.toLocaleString()}원
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDecreaseQuantity(item.menuId)}
                                  disabled={item.quantity <= 1}
                                  sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    '&:hover': { bgcolor: 'primary.light', color: 'white' }
                                  }}
                                >
                                  <Remove fontSize="small" />
                                </IconButton>
                                <Typography sx={{ mx: 3, minWidth: 40, textAlign: 'center', fontWeight: 600, fontSize: '1.1rem' }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleIncreaseQuantity(item.menuId)}
                                  sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    '&:hover': { bgcolor: 'primary.light', color: 'white' }
                                  }}
                                >
                                  <Add fontSize="small" />
                                </IconButton>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                  {(item.price * item.quantity).toLocaleString()}원
                                </Typography>
                                <IconButton 
                                  edge="end" 
                                  onClick={() => handleRemoveItem(item.menuId)}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': { bgcolor: 'error.light', color: 'white' }
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < items.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Card>

            {/* Summary */}
            <Card elevation={3} sx={{ mt: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>총 수량</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{totalQuantity}개</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>총 금액</Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                    {totalAmount.toLocaleString()}원
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Order Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleOrder}
              disabled={loading}
              startIcon={<Restaurant />}
              sx={{ 
                mt: 3, 
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'
                }
              }}
            >
              {loading ? '주문 중...' : '주문하기'}
            </Button>
          </>
        )}
      </Container>
    </Box>
  );
}

export default CartPage;
