import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { authService } from '../services/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: number // rol_id requerido para acceder
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated()
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  // Si se especifica un rol requerido, verificar que el usuario lo tenga
  if (requiredRole !== undefined) {
    const hasRequiredRole = authService.hasRole(requiredRole)
    if (!hasRequiredRole) {
      // Redirigir a una página de acceso denegado o al dashboard
      return <Navigate to="/dashboard" replace />
    }
  }
  
  return <>{children}</>
}

