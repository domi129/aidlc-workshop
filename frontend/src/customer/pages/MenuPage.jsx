import { useState } from 'react';
import useSWR from 'swr';
import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Typography, 
  Button,
  IconButton,
  Badge,
  AppBar,
  Toolbar,
  Fab,
  Chip
} from '@mui/material';
import { ShoppingCart, Add, History, Restaurant } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import fetcher from '../../shared/api/fetcher';
import AuthService from '../../shared/utils/auth';
import ToastService from '../../shared/utils/toast';
import Loading from '../../shared/components/Loading';
import useCartStore from '../stores/cartStore';

// 메뉴별 이미지 매핑 (Apple Emoji PNG)
const menuImages = {
  '김치찌개': 'https://em-content.zobj.net/source/apple/391/pot-of-food_1f372.png',
  '된장찌개': 'https://em-content.zobj.net/source/apple/391/steaming-bowl_1f35c.png',
  '제육볶음': 'https://em-content.zobj.net/source/apple/391/cut-of-meat_1f969.png',
  '계란말이': 'https://em-content.zobj.net/source/apple/391/cooking_1f373.png',
  '김치전': 'https://em-content.zobj.net/source/apple/391/pancakes_1f95e.png',
  '콜라': 'https://em-content.zobj.net/source/apple/391/cup-with-straw_1f964.png',
  '사이다': 'https://em-content.zobj.net/source/apple/391/beverage-box_1f9c3.png'
};

// 카테고리별 이모지
const categoryEmojis = {
  '전체': '🍽️',
  '메인': '🍲',
  '사이드': '🥗',
  '음료': '🥤'
};

function MenuPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('전체');
  const tableInfo = AuthService.getTableInfo();
  const { items, addItem } = useCartStore();

  const { data: menus, error, isLoading } = useSWR(
    `/menus?storeId=${tableInfo?.storeId || 'STORE123'}&category=${category}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const handleCategoryChange = (event, newValue) => {
    setCategory(newValue);
  };

  const handleAddToCart = (menu) => {
    addItem({
      menuId: menu.menuId,
      menuName: menu.menuName,
      price: menu.price,
      quantity: 1
    });
    ToastService.success(`${menu.menuName}이(가) 장바구니에 추가되었습니다`);
  };

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleGoToHistory = () => {
    navigate('/orders');
  };

  if (isLoading) return <Loading message="메뉴를 불러오는 중..." />;
  if (error) return <Typography color="error">메뉴를 불러오는데 실패했습니다</Typography>;

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <Restaurant sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            메뉴판
          </Typography>
          <Chip 
            label={`테이블 ${tableInfo?.tableNumber || 'Unknown'}`}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 600,
              mr: 2
            }}
          />
          <IconButton color="inherit" onClick={handleGoToHistory}>
            <History />
          </IconButton>
          <IconButton color="inherit" onClick={handleGoToCart}>
            <Badge badgeContent={cartItemCount} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        {/* Category Tabs */}
        <Box sx={{ 
          borderBottom: 2, 
          borderColor: 'divider', 
          mb: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 1
        }}>
          <Tabs 
            value={category} 
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem'
              }
            }}
          >
            <Tab label={`${categoryEmojis['전체']} 전체`} value="전체" />
            <Tab label={`${categoryEmojis['메인']} 메인`} value="메인" />
            <Tab label={`${categoryEmojis['사이드']} 사이드`} value="사이드" />
            <Tab label={`${categoryEmojis['음료']} 음료`} value="음료" />
          </Tabs>
        </Box>

        {/* Menu Grid */}
        <Grid container spacing={3}>
          {menus && menus.length > 0 ? (
            menus.map((menu) => (
              <Grid item xs={12} sm={6} md={4} key={menu.menuId}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      height: 200,
                      objectFit: 'contain',
                      bgcolor: 'grey.50',
                      p: 3
                    }}
                    image={menuImages[menu.menuName] || 'https://em-content.zobj.net/source/apple/391/fork-and-knife-with-plate_1f37d-fe0f.png'}
                    alt={menu.menuName}
                  />
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 600, mb: 0 }}>
                        {menu.menuName}
                      </Typography>
                      <Chip 
                        label={menu.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {menu.description}
                    </Typography>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                      {menu.price.toLocaleString()}원
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<Add />}
                      onClick={() => handleAddToCart(menu)}
                      disabled={!menu.isAvailable}
                      sx={{
                        fontWeight: 600,
                        py: 1.5,
                        background: menu.isAvailable 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : undefined
                      }}
                    >
                      {menu.isAvailable ? '장바구니 담기' : '품절'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Restaurant sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  메뉴가 없습니다
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Floating Action Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
      >
        {/* Order History Button */}
        <Fab 
          color="secondary" 
          aria-label="order-history"
          onClick={handleGoToHistory}
          sx={{ boxShadow: 4 }}
        >
          <History />
        </Fab>

        {/* Cart Button */}
        {cartItemCount > 0 && (
          <Fab 
            color="primary" 
            aria-label="cart"
            onClick={handleGoToCart}
            sx={{ 
              boxShadow: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <Badge badgeContent={cartItemCount} color="error">
              <ShoppingCart />
            </Badge>
          </Fab>
        )}
      </Box>
    </Box>
  );
}

export default MenuPage;
