import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { EmployeeRegistrationRequest, FormErrors, Role, EmployeeType } from '../types'
import { FormInput } from './ui/form-input'
import { Button } from './ui/button'
import { EmpleadosService } from '../services/empleados'

const INITIAL_DATA: EmployeeRegistrationRequest = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  codigo_empleado: '',
  username: '',
  password: '',
  fecha_ingreso: '',
  rol_id: 1,
  tipo_empleado: '',
  dni: ''
}

function validate(data: EmployeeRegistrationRequest): FormErrors<EmployeeRegistrationRequest> {
  const errors: FormErrors<EmployeeRegistrationRequest> = {}
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  const codigoRegex = /^[A-Z]{3}[0-9]{3,6}$/
  const telefonoRegex = /^\d{9}$/

  // VALIDACIÓN ESTRICTA: TODOS LOS CAMPOS SON OBLIGATORIOS
  if (!data.nombre?.trim()) errors.nombre = 'El nombre es requerido'
  if (!data.apellido?.trim()) errors.apellido = 'El apellido es requerido'
  if (!data.email?.trim()) {
    errors.email = 'El email es requerido'
  } else if (!emailRegex.test(data.email)) {
    errors.email = 'Email inválido'
  }
  
  // Teléfono ahora es obligatorio
  if (!data.telefono?.trim()) {
    errors.telefono = 'El teléfono es requerido'
  } else if (data.telefono.length !== 9) {
    errors.telefono = 'El teléfono debe tener 9 dígitos'
  } else if (!telefonoRegex.test(data.telefono)) {
    errors.telefono = 'El teléfono debe contener solo números'
  }
  
  if (!data.fecha_nacimiento) {
    errors.fecha_nacimiento = 'Fecha de nacimiento requerida'
  }
  
  if (!data.tipo_empleado) {
    errors.tipo_empleado = 'Seleccione un tipo de empleado'
  }
  
  // Código de empleado obligatorio
  if (!data.codigo_empleado?.trim()) {
    errors.codigo_empleado = 'Código de empleado requerido'
  } else if (data.codigo_empleado === 'Generando...') {
    errors.codigo_empleado = 'Espere a que se genere el código'
  } else if (!codigoRegex.test(data.codigo_empleado)) {
    console.log('Validation failed for code:', data.codigo_empleado)
    console.log('Regex test result:', codigoRegex.test(data.codigo_empleado))
    console.log('Code length:', data.codigo_empleado.length)
    console.log('Code characters:', data.codigo_empleado.split(''))
    errors.codigo_empleado = 'Formato: PLA003 (3 letras + 3-6 números)'
  }
  
  if (!data.username?.trim()) {
    errors.username = 'El usuario es requerido'
  } else if (!usernameRegex.test(data.username)) {
    errors.username = 'Usuario: 3-20 caracteres alfanuméricos'
  }
  
  if (!data.password?.trim()) {
    errors.password = 'La contraseña es requerida'
  } else if (data.password.length < 6) {
    errors.password = 'Mínimo 6 caracteres'
  }
  
  if (!data.fecha_ingreso) {
    errors.fecha_ingreso = 'Fecha de ingreso requerida'
  }
  
  if (!data.rol_id || data.rol_id === 0) {
    errors.rol_id = 'Seleccione un rol'
  }
  
  // DNI obligatorio
  if (!data.dni?.trim()) {
    errors.dni = 'El DNI es requerido'
  } else if (data.dni.length !== 8) {
    errors.dni = 'El DNI debe tener 8 dígitos'
  } else if (!/^\d{8}$/.test(data.dni)) {
    errors.dni = 'El DNI debe contener solo números'
  }

  return errors
}

// Tipos de empleado definidos directamente en el frontend
const EMPLOYEE_TYPES: EmployeeType[] = [
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
  }
]

export function EmployeeRegistrationForm() {
  const [data, setData] = useState<EmployeeRegistrationRequest>(INITIAL_DATA)
  const [errors, setErrors] = useState<FormErrors<EmployeeRegistrationRequest>>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [employeeCounts, setEmployeeCounts] = useState<{[key: string]: number}>({})
  const [totalUsuarios, setTotalUsuarios] = useState<number>(0)
  const [nextUsuarioId, setNextUsuarioId] = useState<number>(0)
  const [dni, setDni] = useState<string>('')
  const [isLoadingReniec, setIsLoadingReniec] = useState<boolean>(false)

  useEffect(() => {
    loadRoles()
    loadEmployeeCounts()
  }, [])

  const loadEmployeeCounts = async () => {
    try {
      const existingEmployees = await EmpleadosService.getEmpleados()
      // Obtener IDs de usuarios desde /empleados/usuarios-ids
      const usuariosIds = await EmpleadosService.getUsuariosIds()
      
      // Extraer TODOS los números de secuencia para encontrar el máximo
      const allSequences: number[] = []
      
      existingEmployees.forEach(emp => {
        if (emp.codigo_empleado) {
          const match = emp.codigo_empleado.match(/(\d+)$/)
          if (match) {
            const number = parseInt(match[1], 10)
            if (!isNaN(number)) {
              allSequences.push(number)
            }
          }
        }
      })
      
      const maxSequence = allSequences.length > 0 ? Math.max(...allSequences) : 0
      const totalEmployees = existingEmployees.length

      // Calcular total y próximo ID desde la API de usuarios-ids
      const maxUserId = usuariosIds.length > 0 ? Math.max(...usuariosIds) : 0
      const nextId = maxUserId + 1
      setTotalUsuarios(usuariosIds.length)
      setNextUsuarioId(nextId)
      
      // Crear conteos para mostrar en el dropdown
      const counts: {[key: string]: number} = {}
      EMPLOYEE_TYPES.forEach(type => {
        const count = existingEmployees.filter(emp => 
          emp.codigo_empleado && emp.codigo_empleado.startsWith(type.prefijo)
        ).length
        counts[type.id] = count
      })
      
      setEmployeeCounts(counts)
      console.log('Employee counts loaded:', counts)
      console.log('Total employees:', totalEmployees)
      console.log('Max sequence found:', maxSequence)
      console.log('Next sequence will be:', maxSequence + 1)
      console.log('Usuarios IDs:', usuariosIds)
      console.log('Total usuarios:', usuariosIds.length)
      console.log('Next usuario ID:', nextId)
    
    } catch (error) {
      console.error('Error loading employee counts:', error)
    }
  }

  const loadRoles = async () => {
    try {
      const rolesData = await EmpleadosService.getRoles()
      setRoles(rolesData)
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const searchReniec = async (dniNumber: string) => {
    if (!dniNumber || dniNumber.length !== 8) return
    
    setIsLoadingReniec(true)
    let response: Response | null = null
    
    try {
      const token = localStorage.getItem('auth_token')
      response = await fetch(`http://localhost:3000/api/reniec/${dniNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        if (response.status === 401) {
          setMessage({
            type: 'error',
            text: 'No autorizado. Verifique que esté logueado correctamente.'
          })
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        // Autocompletar los campos con los datos de RENIEC
        setData(prev => ({
          ...prev,
          nombre: result.data.first_name || '',
          apellido: `${result.data.first_last_name || ''} ${result.data.second_last_name || ''}`.trim(),
          dni: result.data.document_number || dniNumber
        }))
        
        // No mostrar popup de éxito, solo autocompletar silenciosamente
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'No se encontraron datos para este DNI'
        })
      }
    } catch (error: any) {
      console.error('Error searching RENIEC:', error)
      
      setMessage({
        type: 'error',
        text: 'Error al consultar RENIEC. Verifique la conexión.'
      })
    } finally {
      setIsLoadingReniec(false)
    }
  }


  const generateEmployeeCode = async (tipoEmpleado: string): Promise<string> => {
    const employeeType = EMPLOYEE_TYPES.find(type => type.id === tipoEmpleado)
    if (!employeeType) return ''
    
    try {
      console.log('Generating code for:', tipoEmpleado, 'with prefix:', employeeType.prefijo)

      // Preferir el próximo ID desde /empleados/usuarios-ids
      let nextId = nextUsuarioId
      if (!nextId || nextId <= 0) {
        const usuariosIds = await EmpleadosService.getUsuariosIds()
        const maxUserId = usuariosIds.length > 0 ? Math.max(...usuariosIds) : 0
        nextId = maxUserId + 1
      }

      // Usar directamente el próximo ID (sin mínimo 5)
      const sequence = nextId

      // Generar el código con el siguiente número (3 dígitos)
      const paddedSequence = sequence.toString().padStart(3, '0')
      const generatedCode = `${employeeType.prefijo}${paddedSequence}`
      
      console.log('Generated code:', generatedCode)
      console.log('Generated code length:', generatedCode.length)
      console.log('Generated code characters:', generatedCode.split(''))
      console.log('Regex test for generated code:', /^[A-Z]{3}[0-9]{3,6}$/.test(generatedCode))
      return generatedCode
      
    } catch (error) {
      console.error('Error generating employee code:', error)
      // Fallback: usar próximo ID si hay error
      return `${employeeType.prefijo}${nextUsuarioId.toString().padStart(3, '0')}`
    }
  }

  async function onChange<K extends keyof EmployeeRegistrationRequest>(key: K, value: string | number) {
    setData(prev => {
      const newData = { ...prev, [key]: value }
      
      // Si se cambia el tipo de empleado, generar automáticamente el código
      if (key === 'tipo_empleado' && typeof value === 'string') {
        // Generar código de forma asíncrona
        generateEmployeeCode(value).then(newCode => {
          setData(prevData => ({ ...prevData, codigo_empleado: newCode }))
        })
        // Mientras tanto, mostrar un placeholder
        newData.codigo_empleado = 'Generando...'
      }
      
      return newData
    })
    
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setMessage(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationErrors = validate(data)
    setErrors(validationErrors)
    
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await EmpleadosService.registerEmployee(data)
      
      // Considerar exitoso si tiene success: true O si tiene un usuario en la respuesta
      if (response.success || response.data?.usuario_id || (response as any).usuario) {
        setMessage({ 
          type: 'success', 
          text: response.message || 'Empleado registrado exitosamente' 
        })
        setData(INITIAL_DATA)
        // Recargar conteos después del registro exitoso
        loadEmployeeCounts()
      } else {
        setMessage({ 
          type: 'error', 
          text: response.message || 'Error al registrar empleado' 
        })
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Verificar si el error contiene un mensaje de éxito
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión'
      console.log('Error message received:', errorMessage) // Debug para ver el mensaje exacto
      
      // Si el mensaje indica éxito (usuario registrado), tratarlo como éxito
      if (errorMessage.toLowerCase().includes('usuario registrado') || 
          errorMessage.toLowerCase().includes('registrado con rol') ||
          errorMessage.toLowerCase().includes('empleado registrado') ||
          errorMessage.toLowerCase().includes('creado') ||
          errorMessage.toLowerCase().includes('exitoso')) {
        setMessage({ 
          type: 'success', 
          text: errorMessage
        })
        setData(INITIAL_DATA)
        // Recargar conteos después del registro exitoso
        loadEmployeeCounts()
      } else {
        setMessage({ 
          type: 'error', 
          text: errorMessage
        })
      }
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header compacto */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">
          Registro de Empleado
        </h1>
        <p className="text-slate-500 text-xs">
          Complete la información del nuevo empleado
        </p>
      </div>

      {/* Form con diseño mejorado */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-base font-medium text-slate-800">Información Personal</h3>
            </div>
            
            {/* Campo DNI compacto */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <label className="text-sm font-medium text-blue-800 mb-2 block">🆔 DNI * (Búsqueda RENIEC)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setDni(value)
                    onChange('dni', value)
                  }}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
                  maxLength={8}
                />
                <button
                  type="button"
                  onClick={() => searchReniec(dni)}
                  disabled={dni.length !== 8 || isLoadingReniec}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    dni.length === 8 && !isLoadingReniec
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLoadingReniec ? '🔍' : 'Buscar'}
                </button>
              </div>
              {errors.dni && (
                <p className="text-xs text-red-600 mt-1">{errors.dni}</p>
              )}
            </div>
            
            {/* Grid de 3 columnas para mejor aprovechamiento del espacio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormInput
                label="👤 Nombre *"
                value={data.nombre}
                onChange={e => onChange('nombre', e.target.value)}
                error={errors.nombre}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
              
              <FormInput
                label="👥 Apellido *"
                value={data.apellido}
                onChange={e => onChange('apellido', e.target.value)}
                error={errors.apellido}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">🎂 Fecha Nacimiento *</label>
                <input
                  type="date"
                  value={data.fecha_nacimiento}
                  onChange={e => onChange('fecha_nacimiento', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 transition-colors text-sm ${
                    errors.fecha_nacimiento 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  style={{ colorScheme: 'light' }}
                />
                {errors.fecha_nacimiento && (
                  <p className="text-xs text-red-600">{errors.fecha_nacimiento}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormInput
                label="📧 Email *"
                type="email"
                value={data.email}
                onChange={e => onChange('email', e.target.value)}
                error={errors.email}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
              
              <FormInput
                label="📱 Teléfono *"
                type="tel"
                value={data.telefono}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                  onChange('telefono', value)
                }}
                error={errors.telefono}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
            </div>
            
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <label className="text-sm font-medium text-emerald-800 mb-2 block">🏢 Tipo de Empleado *</label>
              <select
                value={data.tipo_empleado || ''}
                onChange={e => onChange('tipo_empleado', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 transition-colors text-sm ${
                  errors.tipo_empleado 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              >
                <option value="">Seleccionar tipo</option>
                {EMPLOYEE_TYPES.map(type => {
                  const count = employeeCounts[type.id] || 0
                  return (
                    <option key={type.id} value={type.id}>
                      {type.nombre} ({count} registros)
                    </option>
                  )
                })}
              </select>
              {errors.tipo_empleado && (
                <p className="text-xs text-red-600 mt-1">{errors.tipo_empleado}</p>
              )}
              
              {/* Indicador inline del tipo seleccionado */}
              {data.tipo_empleado && (
                <div className="mt-2 flex items-center gap-2">
                  {(() => {
                    const selectedType = EMPLOYEE_TYPES.find(type => type.id === data.tipo_empleado)
                    if (!selectedType) return null
                    
                    const colorClasses = {
                      blue: 'bg-blue-100 text-blue-800',
                      emerald: 'bg-emerald-100 text-emerald-800',
                      purple: 'bg-purple-100 text-purple-800',
                      orange: 'bg-orange-100 text-orange-800',
                      teal: 'bg-teal-100 text-teal-800'
                    }
                    
                    return (
                      <>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${colorClasses[selectedType.color as keyof typeof colorClasses]}`}>
                          {selectedType.prefijo}
                        </div>
                        <span className="text-xs text-slate-600">{selectedType.nombre}</span>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <h3 className="text-base font-medium text-slate-800">💼 Información Laboral</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Código de Empleado</label>
              <div className="relative">
                <input
                  type="text"
                  value={data.codigo_empleado}
                  readOnly
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-600 font-mono ${
                    errors.codigo_empleado 
                      ? 'border-red-300' 
                      : data.codigo_empleado === 'Generando...'
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-slate-300'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    data.codigo_empleado === 'Generando...'
                      ? 'text-yellow-700 bg-yellow-200'
                      : 'text-slate-500 bg-slate-200'
                  }`}>
                    {data.codigo_empleado === 'Generando...' ? 'Generando...' : 'Auto-generado'}
                  </span>
                </div>
              </div>
              {errors.codigo_empleado && (
                <p className="text-sm text-red-600">{errors.codigo_empleado}</p>
              )}
              {data.tipo_empleado && data.codigo_empleado !== 'Generando...' && (
                <p className="text-xs text-emerald-600">
                  ✓ Código generado automáticamente (siguiente disponible)
                </p>
              )}
              {data.codigo_empleado === 'Generando...' && (
                <p className="text-xs text-yellow-600">
                  ⏳ Consultando empleados existentes...
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormInput
                label="👤 Usuario *"
                value={data.username}
                onChange={e => onChange('username', e.target.value.toLowerCase())}
                error={errors.username}
                className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm"
              />
              
              <FormInput
                label="🔒 Contraseña *"
                type="password"
                value={data.password}
                onChange={e => onChange('password', e.target.value)}
                error={errors.password}
                className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm"
              />
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">📅 Fecha Ingreso *</label>
                <input
                  type="date"
                  value={data.fecha_ingreso}
                  onChange={e => onChange('fecha_ingreso', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 transition-colors text-sm ${
                    errors.fecha_ingreso 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                  style={{ colorScheme: 'light' }}
                />
                {errors.fecha_ingreso && (
                  <p className="text-xs text-red-600">{errors.fecha_ingreso}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">🛡️ Rol *</label>
              <select
                value={data.rol_id}
                onChange={e => onChange('rol_id', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 transition-colors text-sm ${
                  errors.rol_id 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              >
                <option value={0}>Seleccionar rol</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.nombre}
                  </option>
                ))}
              </select>
              {errors.rol_id && (
                <p className="text-xs text-red-600">{errors.rol_id}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions compactas */}
        <div className="flex justify-center mt-4 pt-3 border-t border-slate-200">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full max-w-md bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium py-2 px-6 rounded-md transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? '⏳ Registrando...' : '✅ Registrar Empleado'}
          </Button>
        </div>

        {/* Message Popup */}
        {message && (
          <div className="fixed inset-0  flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg shadow-xl border-2 p-6 max-w-md w-full mx-4 ${
              message.type === 'success' 
                ? 'border-blue-200' 
                : 'border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                    message.type === 'success' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {message.type === 'success' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${
                      message.type === 'success' ? 'text-blue-800' : 'text-red-800'
                    }`}>
                      {message.type === 'success' ? '¡Éxito!' : 'Error'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      message.type === 'success' ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {message.text}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMessage(null)}
                  className={`ml-4 p-1 rounded-full hover:bg-gray-100 transition-colors ${
                    message.type === 'success' ? 'text-blue-400 hover:text-blue-600' : 'text-red-400 hover:text-red-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setMessage(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    message.type === 'success' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default EmployeeRegistrationForm

