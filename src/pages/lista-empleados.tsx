import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form-input"
import type { Employee } from "@/types"
import { EmpleadosService } from "@/services/empleados"
import { authService } from "@/services/auth"

export default function ListaEmpleadosPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    nombre: '',
    codigo_empleado: '',
    estado: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    applyFilters()
    setCurrentPage(1) // Reset to first page when filters change
  }, [employees, filters])

  // Calculate pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

  async function loadEmployees() {
    try {
      setLoading(true)
      setError(null)
      
      // Debug authentication status
      authService.debugAuthStatus()
      
      const empleados = await EmpleadosService.getEmpleados()
      setEmployees(empleados.sort((a: Employee, b: Employee) => 
        a.nombre.localeCompare(b.nombre)
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar empleados')
      console.error('Error loading employees:', err)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = employees

    if (filters.nombre) {
      filtered = filtered.filter(emp => 
        `${emp.nombre} ${emp.apellido}`.toLowerCase().includes(filters.nombre.toLowerCase())
      )
    }

    if (filters.codigo_empleado) {
      filtered = filtered.filter(emp => 
        emp.codigo_empleado.toLowerCase().includes(filters.codigo_empleado.toLowerCase())
      )
    }

    if (filters.estado) {
      filtered = filtered.filter(emp => emp.estado === filters.estado)
    }

    setFilteredEmployees(filtered)
  }

  function onChange<K extends keyof typeof filters>(key: K, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({ nombre: '', codigo_empleado: '', estado: '' })
  }

  async function handleStatusChange(employee: Employee, newStatus: 'activo' | 'inactivo' | 'deshabilitado') {
    try {
      // Map estado to activo (0/1) for API
      const activo = newStatus === 'activo' ? 1 : 0
      
      const success = await EmpleadosService.updateEmpleadoStatus(employee.usuario_id, activo)
      
      if (success) {
        // Update local state
        const updatedEmployee = {
          ...employee,
          activo,
          estado: newStatus,
          usuario_updated_at: new Date().toISOString()
        }

        const updatedEmployees = employees.map(emp => 
          emp.usuario_id === employee.usuario_id ? updatedEmployee : emp
        )

        setEmployees(updatedEmployees)
      } else {
        throw new Error('No se pudo actualizar el estado del empleado')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
      console.error('Error updating employee status:', err)
    }
  }

  async function handleDeleteEmployee(employee: Employee) {
    if (confirm(`¿Estás seguro de que quieres eliminar permanentemente a ${employee.nombre} ${employee.apellido}?`)) {
      try {
        const success = await EmpleadosService.deleteEmpleado(employee.usuario_id)
        
        if (success) {
          const updatedEmployees = employees.filter(emp => emp.usuario_id !== employee.usuario_id)
          setEmployees(updatedEmployees)
        } else {
          throw new Error('No se pudo eliminar el empleado')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar empleado')
        console.error('Error deleting employee:', err)
      }
    }
  }

  function getStatusBadge(status: string) {
    const statusConfig = {
      activo: { color: 'bg-green-100 text-green-800', text: 'Activo' },
      inactivo: { color: 'bg-yellow-100 text-yellow-800', text: 'Inactivo' },
      deshabilitado: { color: 'bg-red-100 text-red-800', text: 'Deshabilitado' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.activo
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Lista de Empleados</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-3 p-3">
          <div className="space-y-3">
            {/* Header compacto */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Lista de Empleados</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona los empleados del sistema
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={loadEmployees} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Cargando...' : 'Actualizar'}
                </Button>
                <Button asChild size="sm" className="bg-slate-800 hover:bg-slate-900 text-white">
                  <Link to="/registrar-empleado">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nuevo Empleado
                  </Link>
                </Button>
              </div>
            </div>

            {/* Filtros compactos */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <h3 className="text-sm font-medium text-slate-800">Filtros</h3>
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <FormInput
                    label="Nombre"
                    value={filters.nombre}
                    onChange={e => onChange('nombre', e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="text-sm"
                  />
                  <FormInput
                    label="Código de Empleado"
                    value={filters.codigo_empleado}
                    onChange={e => onChange('codigo_empleado', e.target.value)}
                    placeholder="EMP2025-001"
                    className="text-sm"
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Estado</label>
                    <select
                      value={filters.estado}
                      onChange={e => onChange('estado', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-background text-foreground"
                    >
                      <option value="">Todos</option>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="deshabilitado">Deshabilitado</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={clearFilters} variant="outline" size="sm" className="w-full text-xs">
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setError(null)}
                      className="ml-auto text-red-600 border-red-200 hover:bg-red-100"
                    >
                      Cerrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de empleados compacta */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 className="text-sm font-medium text-slate-800">Empleados</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {loading ? 'Cargando...' : `${filteredEmployees.length} empleado(s)${totalPages > 1 ? ` - Página ${currentPage}/${totalPages}` : ''}`}
                  </p>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Cargando empleados...</p>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p>No se encontraron empleados</p>
                    <p className="text-sm">Registra el primer empleado para comenzar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs text-slate-500">
                          <th className="pb-1 font-medium">Empleado</th>
                          <th className="pb-1 font-medium">Código</th>
                          <th className="pb-1 font-medium">Contacto</th>
                          <th className="pb-1 font-medium">Fecha Nac.</th>
                          <th className="pb-1 font-medium">Rol</th>
                          <th className="pb-1 font-medium">Estado</th>
                          <th className="pb-1 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {currentEmployees.map((employee) => (
                          <tr
                            key={employee.usuario_id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {employee.nombre.charAt(0)}{employee.apellido.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-xs">
                                    {employee.nombre} {employee.apellido}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    @{employee.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2">
                              <span className="font-mono text-xs font-medium">
                                {employee.codigo_empleado}
                              </span>
                            </td>
                            <td className="py-2">
                              <div className="text-xs">
                                <div>{employee.email}</div>
                                {employee.telefono && (
                                  <div className="text-xs text-slate-500">{employee.telefono}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-2">
                              <div className="text-xs">
                                {employee.fecha_nacimiento ? formatDate(employee.fecha_nacimiento) : 'N/A'}
                              </div>
                            </td>
                            <td className="py-2">
                              <div className="text-xs">
                                {employee.rol_nombre || 'Sin rol'}
                              </div>
                            </td>
                            <td className="py-2">
                              {getStatusBadge(employee.estado || (employee.activo === 1 ? 'activo' : 'inactivo'))}
                            </td>
                            <td className="py-2">
                              <div className="flex gap-1">
                                {(employee.estado || (employee.activo === 1 ? 'activo' : 'inactivo')) === 'activo' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(employee, 'inactivo')}
                                    className="h-6 px-1.5 text-xs text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                  >
                                    Desactivar
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(employee, 'activo')}
                                    className="h-6 px-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    Activar
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteEmployee(employee)}
                                  className="h-6 w-6 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Pagination compacta */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <div className="text-xs text-slate-500">
                          {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} de {filteredEmployees.length}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="h-6 w-6 p-0"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </Button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="h-6 w-6 p-0 text-xs"
                            >
                              {page}
                            </Button>
                          ))}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="h-6 w-6 p-0"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
