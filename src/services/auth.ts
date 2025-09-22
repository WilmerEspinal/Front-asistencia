import axios from 'axios'

// Configuración base de axios
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Tipos para la autenticación
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token?: string
  user?: {
    id: string
    username: string
    email?: string
    role?: string
    rol_id?: number
    rol_nombre?: string
  }
  message?: string
  success?: boolean
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Servicio de autenticación
export const authService = {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials)
      
      console.log('Login response:', response.data) // Debug log
      
      // Guardar token si existe
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
        console.log('Token saved:', response.data.token) // Debug log
      }
      
      // Guardar datos del usuario si existen
      if (response.data.user) {
        localStorage.setItem('user_data', JSON.stringify(response.data.user))
        console.log('User data saved:', response.data.user) // Debug log
      }
      
      return response.data
    } catch (error: any) {
      console.error('Login error:', error) // Debug log
      throw this.handleError(error)
    }
  },

  // Logout
  logout(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  },

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token')
    return !!token
  },

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('auth_token')
  },

  // Obtener datos del usuario
  getUser(): any | null {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  },

  // Verificar si el usuario tiene un rol específico
  hasRole(requiredRoleId: number): boolean {
    const user = this.getUser()
    return user && user.rol_id === requiredRoleId
  },

  // Verificar si el usuario es admin (rol_id: 2)
  isAdmin(): boolean {
    return this.hasRole(2)
  },

  // Debug method to check current auth status
  debugAuthStatus(): void {
    const token = this.getToken()
    const user = this.getUser()
    console.log('=== AUTH DEBUG ===')
    console.log('Token:', token ? 'Present' : 'Missing')
    console.log('User data:', user)
    console.log('Is authenticated:', this.isAuthenticated())
    console.log('Is admin:', this.isAdmin())
    console.log('==================')
  },

  // Manejo de errores
  handleError(error: any): ApiError {
    if (error.response) {
      // Error de respuesta del servidor
      return {
        message: error.response.data?.message || 'Error del servidor',
        status: error.response.status,
        code: error.response.data?.code
      }
    } else if (error.request) {
      // Error de red
      return {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR'
      }
    } else {
      // Error de configuración
      return {
        message: 'Error inesperado',
        code: 'UNKNOWN_ERROR'
      }
    }
  }
}

export default api

