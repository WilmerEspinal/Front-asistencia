import { useState } from 'react'
import type { FormEvent } from 'react'
import type { AttendanceFormData, Employee, FormErrors } from '../types'
import { FormInput } from './ui/form-input'
import { Button } from './ui/button'

const SAMPLE_DATA: Employee = {
  id: '',
  nombre: 'Wilmer',
  apellido: 'Espinal Villanueva',
  email: 'wespinavi@gmail.com',
  telefono: '987654321',
  fecha_nacimiento: '2000-05-15',
  codigo_empleado: 'EMP2025-001',
  username: 'wilmerE',
  password: 'MiPasswordSeguro123',
  fecha_ingreso: '2025-09-18',
  estado: 'activo',
  fecha_creacion: '',
  fecha_actualizacion: ''
}

function validate(data: AttendanceFormData): FormErrors<AttendanceFormData> {
  const errors: FormErrors<AttendanceFormData> = {}
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^[0-9]{7,15}$/
  if (!data.nombre?.trim()) errors.nombre = 'Requerido'
  if (!data.apellido?.trim()) errors.apellido = 'Requerido'
  if (!emailRegex.test(data.email)) errors.email = 'Email inválido'
  if (!phoneRegex.test(data.telefono)) errors.telefono = 'Teléfono inválido'
  if (!data.fecha_nacimiento) errors.fecha_nacimiento = 'Requerido'
  if (!data.codigo_empleado?.trim()) errors.codigo_empleado = 'Requerido'
  if (!data.username?.trim()) errors.username = 'Requerido'
  if (!data.password || data.password.length < 8)
    errors.password = 'Mínimo 8 caracteres'
  if (!data.fecha_ingreso) errors.fecha_ingreso = 'Requerido'
  return errors
}

export function AttendanceForm() {
  const [data, setData] = useState<AttendanceFormData>(SAMPLE_DATA)
  const [errors, setErrors] = useState<FormErrors<AttendanceFormData>>({})
  const [saved, setSaved] = useState<string | null>(null)


  function onChange<K extends keyof AttendanceFormData>(key: K, value: string) {
    setData(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const v = validate(data)
    setErrors(v)
    if (Object.keys(v).length > 0) return

    const now = new Date().toISOString()
    const employee: Employee = {
      ...data,
      id: `emp_${Date.now()}`,
      estado: 'activo',
      fecha_creacion: now,
      fecha_actualizacion: now
    }

    // Obtener empleados existentes
    const existingEmployees = JSON.parse(localStorage.getItem('muni-asistencia:empleados') || '[]')
    
    // Verificar si el código de empleado ya existe
    const codeExists = existingEmployees.some((emp: Employee) => emp.codigo_empleado === employee.codigo_empleado)
    if (codeExists) {
      setErrors({ codigo_empleado: 'Este código de empleado ya existe' })
      return
    }

    // Agregar nuevo empleado
    existingEmployees.push(employee)
    localStorage.setItem('muni-asistencia:empleados', JSON.stringify(existingEmployees))
    
    setSaved('Empleado registrado correctamente')
    setTimeout(() => setSaved(null), 3000)
    
    // Limpiar formulario
    setData(SAMPLE_DATA)
  }

  return (
    <form onSubmit={handleSubmit} className="card grid gap-6 p-6 sm:p-8 w-full max-w-2xl">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold">Registro de Empleado</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Sistema de control de asistencia — Municipalidad
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          label="Nombre"
          value={data.nombre}
          onChange={e => onChange('nombre', e.target.value)}
          error={errors.nombre}
          placeholder="Wilmer"
        />
        <FormInput
          label="Apellido"
          value={data.apellido}
          onChange={e => onChange('apellido', e.target.value)}
          error={errors.apellido}
          placeholder="Espinal Villanueva"
        />
        <FormInput
          label="Email"
          type="email"
          value={data.email}
          onChange={e => onChange('email', e.target.value)}
          error={errors.email}
          placeholder="correo@ejemplo.com"
        />
        <FormInput
          label="Teléfono"
          inputMode="numeric"
          value={data.telefono}
          onChange={e => onChange('telefono', e.target.value)}
          error={errors.telefono}
          placeholder="987654321"
        />
        <FormInput
          label="Fecha de nacimiento"
          type="date"
          value={data.fecha_nacimiento}
          onChange={e => onChange('fecha_nacimiento', e.target.value)}
          error={errors.fecha_nacimiento}
        />
        <FormInput
          label="Código de empleado"
          value={data.codigo_empleado}
          onChange={e => onChange('codigo_empleado', e.target.value)}
          error={errors.codigo_empleado}
          placeholder="EMP2025-001"
        />
        <FormInput
          label="Usuario"
          value={data.username}
          onChange={e => onChange('username', e.target.value)}
          error={errors.username}
          placeholder="wilmerE"
        />
        <FormInput
          label="Contraseña"
          type="password"
          value={data.password}
          onChange={e => onChange('password', e.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />
        <FormInput
          label="Fecha de ingreso"
          type="date"
          value={data.fecha_ingreso}
          onChange={e => onChange('fecha_ingreso', e.target.value)}
          error={errors.fecha_ingreso}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="submit" block>
          Guardar registro
        </Button>
        <Button
          type="button"
          className="bg-transparent text-[var(--color-text)] border border-cyan-400/30 hover:border-cyan-300/60"
          onClick={() => setData(SAMPLE_DATA)}
        >
          Rellenar ejemplo
        </Button>
      </div>

      {saved ? (
        <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-emerald-200">
          {saved}
        </div>
      ) : null}
    </form>
  )
}

export default AttendanceForm


