import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Admin {
  adminId: string
  username: string
  storeId: string
  role: string
}

interface AuthState {
  token: string | null
  admin: Admin | null
  expiresAt: string | null
  setAuth: (token: string, admin: Admin, expiresAt: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      expiresAt: null,
      
      setAuth: (token, admin, expiresAt) => {
        set({ token, admin, expiresAt })
      },
      
      clearAuth: () => {
        set({ token: null, admin: null, expiresAt: null })
      },
      
      isAuthenticated: () => {
        const { token, expiresAt } = get()
        if (!token || !expiresAt) return false
        return new Date(expiresAt) > new Date()
      }
    }),
    {
      name: 'admin-auth-storage'
    }
  )
)
