import { Box, Typography, Button } from '@mui/material';

function TestPage() {
  const handleClick = () => {
    alert('버튼이 정상 작동합니다!');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: 2,
        p: 2
      }}
    >
      <Typography variant="h3" color="primary">
        🎉 Frontend가 정상 작동 중입니다!
      </Typography>
      
      <Typography variant="h5" color="text.secondary">
        Table Order Service - 로컬 테스트
      </Typography>

      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
        <Button variant="contained" size="large" onClick={handleClick}>
          테스트 버튼
        </Button>
        <Button variant="outlined" size="large" href="/login">
          로그인 페이지로 이동
        </Button>
      </Box>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          📋 테스트 정보
        </Typography>
        <Typography variant="body2" component="div">
          • Backend: http://localhost:3000<br/>
          • Frontend: http://localhost:5173<br/>
          • 테이블 번호: T001, T002, T003<br/>
          • 비밀번호: 1234<br/>
          • 매장 ID: STORE123
        </Typography>
      </Box>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 2, maxWidth: 600 }}>
        <Typography variant="body2" color="info.dark">
          💡 CSP 경고는 개발 환경에서 정상입니다. React의 HMR(Hot Module Replacement)이 eval()을 사용하기 때문입니다.
          프로덕션 빌드에서는 발생하지 않습니다.
        </Typography>
      </Box>
    </Box>
  );
}

export default TestPage;
