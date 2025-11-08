export type Employee = {
  usuario_id: number
  codigo_empleado: string
  username: string
  fecha_ingreso: string // ISO date
  activo: number // 0 or 1 from API
  rol_id: number | null
  usuario_created_at: string // ISO date
  usuario_updated_at: string // ISO date
  persona_id: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  fecha_nacimiento: string | null // ISO date
  persona_created_at: string // ISO date
  persona_updated_at: string // ISO date
  rol_nombre: string | null
  // Computed fields for UI compatibility
  estado?: 'activo' | 'inactivo' | 'deshabilitado'
  id?: string // For backward compatibility
}

export type AttendanceFormData = Employee

export type AttendanceValidation = {
  estado: 'puntual' | 'tarde' | 'normal' | 'temprano'
  mensaje: string
  color: 'green' | 'yellow' | 'red' | 'blue'
}

export type AttendanceState = {
  completado: string[]
  pendiente: string[]
}

export type AttendanceRecord = {
  id: number
  usuario_id: number
  codigo_empleado: string
  nombre_completo: string
  fecha: string // ISO date
  hora_entrada: string | null
  hora_salida_almuerzo: string | null
  hora_entrada_almuerzo: string | null
  hora_salida: string | null
  estado: AttendanceState
  validaciones: {
    entrada: AttendanceValidation
    salida_almuerzo: AttendanceValidation
    entrada_almuerzo: AttendanceValidation
    salida: AttendanceValidation
  }
  created_at: string
  updated_at: string
}

export type AttendanceFormErrors = {
  codigo_empleado?: string
  tipo?: string
  observaciones?: string
}

export type FormErrors<T> = Partial<Record<keyof T, string>>

export type EmpleadosApiResponse = {
  success: boolean
  total: number
  empleados: Employee[]
}

export type EmployeeRegistrationRequest = {
  nombre: string
  apellido: string
  email: string
  telefono: string
  fecha_nacimiento: string
  codigo_empleado: string
  username: string
  password: string
  fecha_ingreso: string
  rol_id: number
  tipo_empleado?: string
  dni: string
}

export type EmployeeType = {
  id: string
  nombre: string
  prefijo: string
  descripcion: string
  color: string
}

export type EmployeeRegistrationResponse = {
  success: boolean
  message?: string
  data?: {
    usuario_id: number
    persona_id: number
  }
}

export type Role = {
  id: number
  nombre: string
}

export type AttendanceApiResponse = {
  success: boolean
  data: AttendanceRecord[]
  total: number
  message: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}


