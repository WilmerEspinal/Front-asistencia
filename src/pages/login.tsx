import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { authService, type ApiError } from '../services/auth'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Cambiar título de la pestaña
    document.title = 'Iniciar Sesión - Sistema de Asistencia'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authService.login({ username, password })
      
      if (response.success !== false) {
        // Login exitoso
        navigate('/dashboard')
      } else {
        setError(response.message || 'Credenciales inválidas')
      }
    } catch (error: any) {
      const apiError = error as ApiError
      setError(apiError.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto w-16 h-16 mb-2 flex items-center justify-center">
              <img
                src="https://res.cloudinary.com/dszdc6rh8/image/upload/v1759513438/logo-salca-muni__1_-removebg-preview_dy5oxt.png"
                alt="Logo Municipalidad"
                className="w-full h-full object-contain"
              />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Sistema de Asistencia
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm">
              Municipalidad de Sacahuasi
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Mensaje de error simple */}
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError(null)
                  }}
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
