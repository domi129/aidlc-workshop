import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material'
import { adminApiClient } from '../../shared/api/adminApiClient'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const [storeId, setStoreId] = useState('STORE123')
  const [username, setUsername] = useState('admin1')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await adminApiClient.post('/auth/login', {
        storeId,
        username,
        password
      })

      const { token, admin, expiresAt } = response.data
      
      // Store auth info
      setAuth(token, admin, expiresAt)
      
      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '로그인 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: 'grey.100'
    }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h4" gutterBottom align="center">
          관리자 로그인
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Table Order Service Admin
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
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" display="block">
            <strong>Mock 모드 테스트 계정:</strong>
          </Typography>
          <Typography variant="caption" display="block">
            매장 ID: store-001
          </Typography>
          <Typography variant="caption" display="block">
            사용자명: admin1
          </Typography>
          <Typography variant="caption" display="block">
            비밀번호: password123 (아무 비밀번호나 가능)
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
