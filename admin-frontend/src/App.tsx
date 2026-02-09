import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './admin/pages/LoginPage'
import DashboardPage from './admin/pages/DashboardPage'
import MenuManagementPage from './admin/pages/MenuManagementPage'
import TableManagementPage from './admin/pages/TableManagementPage'
import PrivateRoute from './shared/components/PrivateRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/menus"
        element={
          <PrivateRoute>
            <MenuManagementPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/tables"
        element={
          <PrivateRoute>
            <TableManagementPage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
