import type { Employee, EmpleadosApiResponse, EmployeeRegistrationRequest, EmployeeRegistrationResponse, Role, EmployeeType } from '@/types'
import api from './auth'

export class EmpleadosService {
  static async getEmpleados(): Promise<Employee[]> {
    try {
      console.log('Fetching empleados...') // Debug log
      const token = localStorage.getItem('auth_token')
      console.log('Current token:', token ? 'Present' : 'Missing') // Debug log
      
      const response = await api.get<EmpleadosApiResponse>('/empleados')
      console.log('Empleados response:', response.data) // Debug log
      
      if (!response.data.success) {
        throw new Error('API returned unsuccessful response')
      }
      
      // Transform API data to include computed fields for UI compatibility
      return response.data.empleados.map(empleado => ({
        ...empleado,
        // Map activo (0/1) to estado for UI compatibility
        estado: empleado.activo === 1 ? 'activo' as const : 'inactivo' as const,
        // Add id for backward compatibility
        id: empleado.usuario_id.toString()
      }))
    } catch (error) {
      console.error('Error fetching empleados:', error)
      throw error
    }
  }

  static async updateEmpleadoStatus(usuarioId: number, activo: number): Promise<boolean> {
    try {
      const response = await api.patch(`/empleados/${usuarioId}`, { activo })
      return response.data.success || false
    } catch (error) {
      console.error('Error updating empleado status:', error)
      throw error
    }
  }

  static async deleteEmpleado(usuarioId: number): Promise<boolean> {
    try {
      const response = await api.delete(`/empleados/${usuarioId}`)
      return response.data.success || false
    } catch (error) {
      console.error('Error deleting empleado:', error)
      throw error
    }
  }

  static async registerEmployee(employeeData: EmployeeRegistrationRequest): Promise<EmployeeRegistrationResponse> {
    try {
      console.log('Registering employee:', employeeData) // Debug log
      const response = await api.post<EmployeeRegistrationResponse>('/auth/register', employeeData)
      console.log('Registration response:', response.data) // Debug log
      return response.data
    } catch (error) {
      console.error('Error registering employee:', error)
      throw error
    }
  }

  static async getRoles(): Promise<Role[]> {
    try {
      // Mock roles for now - you can replace this with actual API call
      return [
        { id: 1, nombre: 'Empleado' },
        { id: 2, nombre: 'Administrador' },
      ]
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  }

  static async getEmployeeTypes(): Promise<EmployeeType[]> {
    try {
      // Tipos de empleado con prefijos específicos
      return [
        { 
          id: 'plania', 
          nombre: 'Plania', 
          prefijo: 'PLA', 
          descripcion: 'Personal de Plania Municipal',
          color: 'blue'
        },
        { 
          id: 'tercero', 
          nombre: 'Tercero', 
          prefijo: 'TER', 
          descripcion: 'Personal de Terceros',
          color: 'emerald'
        },
        { 
          id: 'administrativo', 
          nombre: 'Administrativo', 
          prefijo: 'ADM', 
          descripcion: 'Personal Administrativo',
          color: 'purple'
        },
        { 
          id: 'operativo', 
          nombre: 'Operativo', 
          prefijo: 'OPE', 
          descripcion: 'Personal Operativo',
          color: 'orange'
        },
        { 
          id: 'servicios', 
          nombre: 'Servicios', 
          prefijo: 'SER', 
          descripcion: 'Personal de Servicios',
          color: 'teal'
        }
      ]
    } catch (error) {
      console.error('Error fetching employee types:', error)
      throw error
    }
  }

  // Obtiene los IDs de usuarios para calcular cantidad total y el próximo ID (+1)
  static async getUsuariosIds(): Promise<number[]> {
    try {
      const response = await api.get<{ success: boolean; total: number; usuarios: Array<{ id: number }> }>(
        '/empleados/usuarios-ids'
      )
      if (!response.data?.success) {
        throw new Error('Respuesta no exitosa al obtener usuarios-ids')
      }
      return (response.data.usuarios || []).map(u => u.id)
    } catch (error) {
      console.error('Error fetching usuarios ids:', error)
      throw error
    }
  }
}
