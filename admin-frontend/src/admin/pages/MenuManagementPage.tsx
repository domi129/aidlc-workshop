import { useState } from 'react'
import useSWR from 'swr'
import { 
  Box, Grid, Card, CardContent, CardMedia, Typography, 
  Button, Dialog, TextField, Select, MenuItem, FormControl, 
  InputLabel, CircularProgress, Alert, Chip
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { adminApiClient } from '../../shared/api/adminApiClient'
import { useAuthStore } from '../stores/authStore'
import Layout from '../../shared/components/Layout'
import { toast } from 'react-toastify'

const fetcher = (url: string) => 
  adminApiClient.get(url).then(res => res.data)

interface Menu {
  menuId: string
  storeId: string
  menuName: string
  price: number
  description?: string
  category: string
  imageUrl?: string
  displayOrder: number
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export default function MenuManagementPage() {
  const admin = useAuthStore(state => state.admin)
  const [category, setCategory] = useState('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  
  const { data: menus, mutate, isLoading, error } = useSWR<Menu[]>(
    `/menus?storeId=${admin?.storeId}${category !== 'ALL' ? `&category=${category}` : ''}`,
    fetcher
  )

  const handleCreate = () => {
    setEditingMenu(null)
    setDialogOpen(true)
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setDialogOpen(true)
  }

  const handleDelete = async (menuId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await adminApiClient.delete(`/menus/${menuId}`)
      mutate()
      toast.success('메뉴가 삭제되었습니다')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || '삭제 실패')
    }
  }

  const handleSave = async (menuData: any) => {
    try {
      if (editingMenu) {
        await adminApiClient.put(`/menus/${editingMenu.menuId}`, menuData)
        toast.success('메뉴가 수정되었습니다')
      } else {
        await adminApiClient.post('/menus', {
          ...menuData,
          storeId: admin?.storeId
        })
        toast.success('메뉴가 추가되었습니다')
      }
      mutate()
      setDialogOpen(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || '저장 실패')
    }
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      'ALL': '전체',
      'APPETIZER': '애피타이저',
      'MAIN': '메인',
      'DESSERT': '디저트',
      'BEVERAGE': '음료',
      'ALCOHOL': '주류',
      'OTHER': '기타'
    }
    return labels[cat] || cat
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">
          메뉴 목록을 불러오는데 실패했습니다: {error.message}
        </Alert>
      </Layout>
    )
  }

  return (
    <Layout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          메뉴 관리
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
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
          <MenuItem value="OTHER">기타</MenuItem>
        </Select>
      </FormControl>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && menus && menus.length === 0 && (
        <Alert severity="info">
          메뉴가 없습니다. 새 메뉴를 추가해주세요.
        </Alert>
      )}
      
      <Grid container spacing={2}>
        {menus?.map((menu) => (
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="h6">{menu.menuName}</Typography>
                  <Chip 
                    label={getCategoryLabel(menu.category)} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {menu.description || '설명 없음'}
                </Typography>
                
                <Typography variant="h6" color="primary">
                  {menu.price.toLocaleString()}원
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={menu.isAvailable ? '판매중' : '품절'} 
                    size="small"
                    color={menu.isAvailable ? 'success' : 'default'}
                  />
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => handleEdit(menu)}>
                    수정
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(menu.menuId)}>
                    삭제
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <MenuDialog
        open={dialogOpen}
        menu={editingMenu}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Layout>
  )
}

interface MenuDialogProps {
  open: boolean
  menu: Menu | null
  onClose: () => void
  onSave: (data: any) => void
}

function MenuDialog({ open, menu, onClose, onSave }: MenuDialogProps) {
  const [formData, setFormData] = useState({
    menuName: menu?.menuName || '',
    price: menu?.price || 0,
    description: menu?.description || '',
    category: menu?.category || 'MAIN',
    imageUrl: menu?.imageUrl || '',
    displayOrder: menu?.displayOrder || 0,
    isAvailable: menu?.isAvailable ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

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
            <MenuItem value="OTHER">기타</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          label="이미지 URL"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          margin="normal"
          helperText="이미지 URL을 입력하세요 (선택사항)"
        />
        
        <TextField
          fullWidth
          label="노출 순서"
          type="number"
          value={formData.displayOrder}
          onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
          margin="normal"
          helperText="낮은 숫자가 먼저 표시됩니다"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>판매 상태</InputLabel>
          <Select
            value={formData.isAvailable ? 'true' : 'false'}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
            label="판매 상태"
          >
            <MenuItem value="true">판매중</MenuItem>
            <MenuItem value="false">품절</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>취소</Button>
          <Button type="submit" variant="contained">저장</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
