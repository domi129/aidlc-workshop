import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './shared/components/ErrorBoundary';
import LoginPage from './customer/pages/LoginPage';
import MenuPage from './customer/pages/MenuPage';
import CartPage from './customer/pages/CartPage';
import OrderSuccessPage from './customer/pages/OrderSuccessPage';
import OrderHistoryPage from './customer/pages/OrderHistoryPage';
import TestPage from './TestPage';
import AuthService from './shared/utils/auth';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children }) {
  return AuthService.isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/test" element={<TestPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/menu" 
              element={
                <PrivateRoute>
                  <MenuPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/cart" 
              element={
                <PrivateRoute>
                  <CartPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/order-success" 
              element={
                <PrivateRoute>
                  <OrderSuccessPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <PrivateRoute>
                  <OrderHistoryPage />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer position="top-center" autoClose={2000} />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
