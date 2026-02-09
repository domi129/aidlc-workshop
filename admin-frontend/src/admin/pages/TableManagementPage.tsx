import { useState } from 'react'
import { 
  Box, Typography, TextField, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, CircularProgress
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { adminApiClient } from '../../shared/api/adminApiClient'
import Layout from '../../shared/components/Layout'
import { toast } from 'react-toastify'

interface OrderHistoryItem {
  historyId: string
  orderId: string
  orderNumber: string
  tableId: string
  sessionId: string
  items: Array<{
    menuName: string
    quantity: number
    unitPrice: number
  }>
  totalAmount: number
  status: string
  createdAt: string
  archivedAt: string
}

export default function TableManagementPage() {
  const [tableId, setTableId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [history, setHistory] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCompleteSession = async () => {
    if (!tableId || !sessionId) {
      toast.error('테이블 ID와 세션 ID를 입력해주세요')
      return
    }

    if (!confirm('이 테이블의 세션을 종료하시겠습니까?')) return

    try {
      await adminApiClient.post(`/tables/${tableId}/complete`, {
        sessionId
      })
      toast.success('테이블 세션이 종료되었습니다')
      setTableId('')
      setSessionId('')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || '세션 종료 실패')
    }
  }

  const handleSearchHistory = async () => {
    if (!tableId) {
      toast.error('테이블 ID를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')
    setHistory([])

    try {
      const response = await adminApiClient.get(`/tables/${tableId}/history`)
      // Response has { items, total, page, pageSize } structure
      const historyData = response.data.items || response.data
      setHistory(historyData)
      
      if (historyData.length === 0) {
        toast.info('주문 이력이 없습니다')
      } else {
        toast.success(`${historyData.length}개의 주문 이력을 조회했습니다`)
      }
    } catch (error: any) {
      setError(error.response?.data?.error?.message || '이력 조회 실패')
      toast.error(error.response?.data?.error?.message || '이력 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        테이블 관리
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            테이블 세션 종료
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="테이블 ID"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="예: T001"
              sx={{ flex: 1 }}
            />
            
            <TextField
              label="세션 ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="예: session-uuid"
              sx={{ flex: 1 }}
            />
            
            <Button
              variant="contained"
              onClick={handleCompleteSession}
              sx={{ mt: 1 }}
            >
              세션 종료
            </Button>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            테이블 세션을 종료하면 해당 세션의 모든 주문이 이력으로 이동됩니다.
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            주문 이력 조회
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="테이블 ID"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="예: T001"
              sx={{ flex: 1 }}
            />
            
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearchHistory}
              disabled={loading}
            >
              조회
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && history.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>주문 번호</TableCell>
                    <TableCell>세션 ID</TableCell>
                    <TableCell>주문 항목</TableCell>
                    <TableCell align="right">총액</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>주문 시간</TableCell>
                    <TableCell>이동 시간</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.historyId}>
                      <TableCell>{item.orderNumber}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {item.sessionId.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.items.map((orderItem, idx) => (
                          <Typography key={idx} variant="body2">
                            {orderItem.menuName} x {orderItem.quantity}
                          </Typography>
                        ))}
                      </TableCell>
                      <TableCell align="right">
                        {item.totalAmount.toLocaleString()}원
                      </TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        {new Date(item.archivedAt).toLocaleString('ko-KR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Layout>
  )
}
