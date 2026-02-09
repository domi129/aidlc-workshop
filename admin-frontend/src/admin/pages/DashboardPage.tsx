import useSWR from 'swr'
import { 
  Box, Grid, Card, CardContent, Typography, 
  Button, Chip, IconButton, CircularProgress, Alert
} from '@mui/material'
import { Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { adminApiClient } from '../../shared/api/adminApiClient'
import { useAuthStore } from '../stores/authStore'
import Layout from '../../shared/components/Layout'
import { toast } from 'react-toastify'

const fetcher = (url: string) => 
  adminApiClient.get(url).then(res => res.data)

interface OrderItem {
  menuId: string
  menuName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface Order {
  orderId: string
  orderNumber: string
  storeId: string
  tableId: string
  sessionId: string
  items: OrderItem[]
  totalAmount: number
  status: 'PENDING' | 'PREPARING' | 'COMPLETED'
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const admin = useAuthStore(state => state.admin)
  
  const { data: orders, error, mutate, isLoading } = useSWR<Order[]>(
    `/orders?storeId=${admin?.storeId}`,
    fetcher,
    { refreshInterval: 5000 } // 5초마다 자동 갱신
  )

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminApiClient.patch(`/orders/${orderId}/status`, {
        status: newStatus
      })
      mutate() // 데이터 갱신
      toast.success('주문 상태가 변경되었습니다')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || '상태 변경 실패')
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await adminApiClient.delete(`/orders/${orderId}`)
      mutate() // 데이터 갱신
      toast.success('주문이 삭제되었습니다')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || '삭제 실패')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning'
      case 'PREPARING': return 'info'
      case 'COMPLETED': return 'success'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return '대기중'
      case 'PREPARING': return '준비중'
      case 'COMPLETED': return '완료'
      default: return status
    }
  }

  const getNextStatus = (status: string) => {
    switch (status) {
      case 'PENDING': return 'PREPARING'
      case 'PREPARING': return 'COMPLETED'
      default: return null
    }
  }

  const getNextStatusLabel = (status: string) => {
    const next = getNextStatus(status)
    return next ? getStatusLabel(next) : null
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">
          주문 목록을 불러오는데 실패했습니다: {error.message}
        </Alert>
      </Layout>
    )
  }

  return (
    <Layout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          주문 관리
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => mutate()}
        >
          새로고침
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && orders && orders.length === 0 && (
        <Alert severity="info">
          현재 주문이 없습니다.
        </Alert>
      )}

      <Grid container spacing={2}>
        {orders?.map((order) => (
          <Grid item xs={12} md={6} lg={4} key={order.orderId}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    주문 #{order.orderNumber}
                  </Typography>
                  <Chip 
                    label={getStatusLabel(order.status)} 
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  테이블: {order.tableId}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  주문 시간: {new Date(order.createdAt).toLocaleString('ko-KR')}
                </Typography>
                
                <Typography variant="body2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  주문 항목:
                </Typography>
                {order.items.map((item, idx) => (
                  <Typography key={idx} variant="body2" color="text.secondary">
                    • {item.menuName} x {item.quantity} {item.unitPrice ? `(${item.unitPrice.toLocaleString()}원)` : ''}
                  </Typography>
                ))}
                
                <Typography variant="h6" sx={{ mt: 2 }}>
                  총액: {order.totalAmount.toLocaleString()}원
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                  {getNextStatus(order.status) && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleStatusChange(order.orderId, getNextStatus(order.status)!)}
                    >
                      {getNextStatusLabel(order.status)}로 변경
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
    </Layout>
  )
}
