import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import ApiClient from '../../shared/api/apiClient';
import AuthService from '../../shared/utils/auth';
import ToastService from '../../shared/utils/toast';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    storeId: 'STORE123',
    tableNumber: '',
    tablePassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await ApiClient.post('/auth/table-login', formData);
      
      AuthService.setTokens(response.accessToken, response.refreshToken);
      AuthService.setTableInfo({
        storeId: response.storeId,
        tableId: response.tableId,
        tableNumber: response.tableNumber,
        sessionId: response.sessionId
      });

      ToastService.success('로그인 성공!');
      navigate('/menu');
    } catch (error) {
      ToastService.error(error.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" align="center" gutterBottom>
          테이블 로그인
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          테이블 정보를 입력해주세요
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="매장 ID"
            name="storeId"
            value={formData.storeId}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="테이블 번호"
            name="tableNumber"
            value={formData.tableNumber}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="테이블 비밀번호"
            name="tablePassword"
            type="password"
            value={formData.tablePassword}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default LoginPage;
