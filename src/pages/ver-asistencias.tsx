import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { authService } from "@/services/auth"
import type { AttendanceRecord, AttendanceApiResponse } from "@/types"

export default function VerAsistenciasPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    codigo_empleado: '',
    fecha: '',
    fechaDesde: '',
    fechaHasta: '',
    nombre_completo: ''
  })
  const [useRangeFilter, setUseRangeFilter] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(7)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searching, setSearching] = useState(false)
  const [pendingSearch, setPendingSearch] = useState(false)

  useEffect(() => {
    // Verificar autenticación antes de cargar datos
    if (!authService.isAuthenticated()) {
      navigate('/')
      return
    }

    // Obtener datos del usuario autenticado
    const user = authService.getUser()
    setCurrentUser(user)

    // Cambiar título de la pestaña
    document.title = 'Ver Asistencias - Sistema de Asistencia'
    loadRecords()
  }, [navigate])

  // Separar la carga por cambios de página vs cambios de filtros
  useEffect(() => {
    loadRecords()
  }, [currentPage, itemsPerPage])

  // Debounce solo para filtros de texto (no fechas)
  useEffect(() => {
    // Solo buscar automáticamente para filtros de texto
    const hasTextFilters = filters.codigo_empleado || filters.nombre_completo
    
    if (hasTextFilters) {
      setSearching(true)
      const timeoutId = setTimeout(() => {
        setCurrentPage(1)
        loadRecords()
        setSearching(false)
      }, 300)

      return () => {
        clearTimeout(timeoutId)
        setSearching(false)
      }
    }
  }, [filters.codigo_empleado, filters.nombre_completo])

  // Marcar que hay búsqueda pendiente cuando se selecciona fecha
  useEffect(() => {
    const hasValidDateFilter = filters.fecha || (useRangeFilter && filters.fechaDesde && filters.fechaHasta)
    
    if (hasValidDateFilter) {
      setPendingSearch(true)
    } else {
      setPendingSearch(false)
    }
  }, [filters.fecha, filters.fechaDesde, filters.fechaHasta, useRangeFilter])

  // Función para ejecutar búsqueda pendiente
  function executePendingSearch() {
    if (pendingSearch) {
      setCurrentPage(1)
      loadRecords()
      setPendingSearch(false)
    }
  }

  useEffect(() => {
    applyFilters()
  }, [records])

  async function loadRecords() {
    try {
      setLoading(true)
      setError(null)
      
      // Verificar que tenemos token antes de hacer la petición
      const token = authService.getToken()
      if (!token) {
        navigate('/')
        return
      }
      
      // Construir parámetros de filtro
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })
      
      // Agregar filtros si existen
      if (filters.codigo_empleado) {
        params.append('codigo_empleado', filters.codigo_empleado)
      }
      if (filters.nombre_completo) {
        params.append('nombre_completo', filters.nombre_completo)
      }
      if (useRangeFilter) {
        if (filters.fechaDesde) {
          params.append('fecha_inicio', filters.fechaDesde)
        }
        if (filters.fechaHasta) {
          params.append('fecha_fin', filters.fechaHasta)
        }
      } else if (filters.fecha) {
        params.append('fecha', filters.fecha)
      }
      
      const response = await fetch(`http://localhost:3000/api/asistencias/todas?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.status === 401) {
        // Token expirado o inválido
        authService.logout()
        navigate('/')
        return
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data: AttendanceApiResponse = await response.json()
      
      if (data.success) {
        setRecords(data.data)
        setTotalRecords(data.total)
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
        } else {
          // Calcular páginas si no viene en la respuesta
          setTotalPages(Math.ceil(data.total / itemsPerPage))
        }
      } else {
        throw new Error('Error al cargar las asistencias')
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        // Manejar error de autenticación
        authService.logout()
        navigate('/')
        return
      }
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error loading attendance records:', err)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    // Con paginación del servidor, simplemente asignamos los registros
    // El filtrado se manejará en el servidor cuando se implemente
    setFilteredRecords(records)
  }

  function onChange<K extends keyof typeof filters>(key: K, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }



  function clearFilters() {
    setFilters({ codigo_empleado: '', fecha: '', fechaDesde: '', fechaHasta: '', nombre_completo: '' })
    setUseRangeFilter(false)
    setCurrentPage(1)
  }
  
  // Funciones para rangos rápidos
  function setCurrentMonth() {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setFilters(prev => ({
      ...prev,
      fechaDesde: firstDay.toISOString().split('T')[0],
      fechaHasta: lastDay.toISOString().split('T')[0],
      fecha: ''
    }))
    setUseRangeFilter(true)
    setCurrentPage(1)
  }
  
  function setCurrentWeek() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const firstDay = new Date(now)
    firstDay.setDate(now.getDate() - dayOfWeek)
    const lastDay = new Date(firstDay)
    lastDay.setDate(firstDay.getDate() + 6)
    
    setFilters(prev => ({
      ...prev,
      fechaDesde: firstDay.toISOString().split('T')[0],
      fechaHasta: lastDay.toISOString().split('T')[0],
      fecha: ''
    }))
    setUseRangeFilter(true)
    setCurrentPage(1)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  async function exportToExcel() {
    setExporting(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      // Construir parámetros de consulta basados en los filtros activos (igual que loadRecords)
      const queryParams = new URLSearchParams()
      
      // Agregar filtros si existen
      if (filters.codigo_empleado) {
        queryParams.append('codigo_empleado', filters.codigo_empleado)
      }
      if (filters.nombre_completo) {
        queryParams.append('nombre_completo', filters.nombre_completo)
      }
      if (useRangeFilter) {
        if (filters.fechaDesde) {
          queryParams.append('fecha_inicio', filters.fechaDesde)
        }
        if (filters.fechaHasta) {
          queryParams.append('fecha_fin', filters.fechaHasta)
        }
      } else if (filters.fecha) {
        queryParams.append('fecha', filters.fecha)
      }
      
      // Si no hay filtros específicos, usar el año actual
      if (!filters.codigo_empleado && !filters.nombre_completo && !filters.fecha && !filters.fechaDesde && !filters.fechaHasta) {
        const añoActual = new Date().getFullYear()
        queryParams.append('año', añoActual.toString())
      }

      const queryString = queryParams.toString()
      const url = `http://localhost:3000/api/asistencias/exportar-excel${queryString ? `?${queryString}` : ''}`
      
      // Debug: mostrar la URL que se está usando
      console.log('🔍 Exportando con URL:', url)
      console.log('📋 Filtros activos:', filters)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          authService.logout()
          navigate('/')
          return
        }
        throw new Error('Error al exportar las asistencias')
      }

      // Debug: verificar el tipo de contenido
      const contentType = response.headers.get('content-type')
      console.log('📄 Content-Type:', contentType)
      console.log('📊 Response status:', response.status)
      
      // Obtener el blob del archivo Excel
      const blob = await response.blob()
      console.log('📦 Blob size:', blob.size, 'bytes')
      console.log('📦 Blob type:', blob.type)
      
      // Crear un URL temporal para el archivo
      const downloadUrl = window.URL.createObjectURL(blob)
      
      // Crear un enlace temporal y hacer clic en él para descargar
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Generar nombre del archivo basado en los filtros
      let fileName = 'asistencias'
      
      if (filters.codigo_empleado.trim()) {
        const codigos = filters.codigo_empleado.split(',').map(c => c.trim()).filter(c => c.length > 0)
        if (codigos.length === 1) {
          fileName += `_${codigos[0]}`
        } else if (codigos.length > 1) {
          fileName += `_${codigos.length}empleados`
        }
      }
      
      if (filters.fecha) {
        // Usar la fecha exacta para el nombre del archivo
        fileName += `_${filters.fecha}`
      } else if (!filters.codigo_empleado.trim()) {
        // Si no hay filtros específicos, usar año actual
        const añoActual = new Date().getFullYear()
        fileName += `_${añoActual}`
      }
      
      const now = new Date()
      const timestamp = now.toISOString().split('T')[0] // YYYY-MM-DD
      fileName += `_${timestamp}.xlsx`
      
      link.download = fileName
      
      document.body.appendChild(link)
      link.click()
      
      // Limpiar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
    } catch (error) {
      console.error('Error exportando:', error)
      setError(error instanceof Error ? error.message : 'Error al exportar las asistencias')
    } finally {
      setExporting(false)
    }
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
                <BreadcrumbPage>Ver Asistencias</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Información del usuario autenticado */}
          {currentUser && (
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {currentUser.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden md:inline">
                {currentUser.username} {currentUser.rol_nombre && `(${currentUser.rol_nombre})`}
              </span>
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-2 p-2">
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Cargando asistencias...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-sm">Error al cargar las asistencias</span>
                </div>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                <Button 
                  onClick={loadRecords} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-100 h-8 text-xs"
                >
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && (
            <div className="space-y-2">
              {/* Filtros */}
              <Card>
                <CardContent className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-slate-800">Filtros</h3>
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Código de Empleado</label>
                      <input
                        type="text"
                        value={filters.codigo_empleado}
                        onChange={e => onChange('codigo_empleado', e.target.value)}
                        placeholder="TER003, PLA004..."
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-background text-foreground h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Nombre del Empleado</label>
                      <input
                        type="text"
                        value={filters.nombre_completo}
                        onChange={e => onChange('nombre_completo', e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-background text-foreground h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600">Fecha</label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={setCurrentWeek}
                            className="px-1.5 py-0.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                            title="Esta semana"
                          >
                            Semana
                          </button>
                          <button
                            type="button"
                            onClick={setCurrentMonth}
                            className="px-1.5 py-0.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                            title="Este mes"
                          >
                            Mes
                          </button>
                        </div>
                      </div>
                    
                    {/* Inputs compactos en una sola fila */}
                    <div className="flex gap-1 items-center min-w-0">
                      {/* Fecha única o desde */}
                      <input
                        type="date"
                        value={useRangeFilter ? filters.fechaDesde : filters.fecha}
                        onChange={e => {
                          if (useRangeFilter) {
                            onChange('fechaDesde', e.target.value)
                          } else {
                            onChange('fecha', e.target.value)
                          }
                        }}
                        onBlur={executePendingSearch}
                        className={`px-2 py-1 text-xs border border-slate-200 rounded bg-background text-foreground h-7 min-w-0 ${
                          useRangeFilter ? 'w-24' : 'w-32'
                        }`}
                        placeholder={useRangeFilter ? "Desde" : "Fecha"}
                      />
                      
                      {/* Toggle para rango */}
                      <button
                        type="button"
                        onClick={() => {
                          setUseRangeFilter(!useRangeFilter)
                          if (!useRangeFilter) {
                            // Cambiar a rango: mover fecha única a fechaDesde
                            if (filters.fecha) {
                              setFilters(prev => ({ ...prev, fechaDesde: prev.fecha, fecha: '' }))
                            }
                          } else {
                            // Cambiar a única: mover fechaDesde a fecha
                            if (filters.fechaDesde) {
                              setFilters(prev => ({ ...prev, fecha: prev.fechaDesde, fechaDesde: '', fechaHasta: '' }))
                            } else {
                              setFilters(prev => ({ ...prev, fechaDesde: '', fechaHasta: '' }))
                            }
                          }
                        }}
                        className={`flex-shrink-0 w-8 h-7 text-xs rounded transition-colors flex items-center justify-center ${
                          useRangeFilter
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={useRangeFilter ? "Cambiar a fecha única" : "Cambiar a rango"}
                      >
                        {useRangeFilter ? '↔' : '•'}
                      </button>
                      
                      {/* Fecha hasta - solo visible en modo rango */}
                      {useRangeFilter && (
                        <input
                          type="date"
                          value={filters.fechaHasta}
                          onChange={e => onChange('fechaHasta', e.target.value)}
                          onBlur={executePendingSearch}
                          className="w-24 px-2 py-1 text-xs border border-slate-200 rounded bg-background text-foreground h-7 min-w-0"
                          placeholder="Hasta"
                        />
                      )}
                    </div>
                    
                    {/* Descripción compacta */}
                    {useRangeFilter && (filters.fechaDesde || filters.fechaHasta) && (
                      <div className="text-xs text-slate-400">
                        {filters.fechaDesde && filters.fechaHasta 
                          ? `${filters.fechaDesde.split('-').reverse().join('/')} - ${filters.fechaHasta.split('-').reverse().join('/')}`
                          : filters.fechaDesde 
                            ? `Desde ${filters.fechaDesde.split('-').reverse().join('/')}`
                            : `Hasta ${filters.fechaHasta.split('-').reverse().join('/')}`
                        }
                      </div>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <Button 
                      onClick={clearFilters} 
                      variant="outline" 
                      className="flex-1 h-8 text-xs"
                      disabled={searching}
                    >
                      {searching ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          Buscando...
                        </div>
                      ) : (
                        'Limpiar Filtros'
                      )}
                    </Button>
                    <Button 
                      onClick={exportToExcel} 
                      disabled={exporting}
                      className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                      title={`Exportar ${filters.codigo_empleado.trim() ? `empleado ${filters.codigo_empleado}` : ''}${filters.fecha ? ` del ${formatDate(filters.fecha)}` : ' del año actual'}`}
                    >
                      {exporting ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          Exportando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {filters.codigo_empleado.trim() || filters.fecha ? 'Exportar Filtros' : 'Exportar Todo'}
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de registros */}
            <Card>
              <CardContent className="p-0">
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p className="text-sm font-medium">No se encontraron registros</p>
                    <p className="text-xs">Intenta ajustar los filtros</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Empleado
                          </th>
                          <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Entrada
                            </div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                              Salida Alm
                            </div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              Entrada Alm
                            </div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              Salida
                            </div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredRecords.map((record: AttendanceRecord) => (
                          <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {record.nombre_completo.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 text-sm">{record.nombre_completo}</div>
                                  <div className="text-xs text-slate-500">{record.codigo_empleado}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-slate-600">
                              {formatDate(record.fecha)}
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-mono text-sm font-semibold text-slate-900">
                                {record.hora_entrada || '---'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-mono text-sm font-semibold text-slate-900">
                                {record.hora_salida_almuerzo || '---'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-mono text-sm font-semibold text-slate-900">
                                {record.hora_entrada_almuerzo || '---'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-mono text-sm font-semibold text-slate-900">
                                {record.hora_salida || '---'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {/* Solo mostrar estado de Entrada */}
                              <span 
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  record.validaciones.entrada.color === 'green' 
                                    ? 'bg-green-100 text-green-800' 
                                    : record.validaciones.entrada.color === 'red'
                                    ? 'bg-red-100 text-red-800'
                                    : record.validaciones.entrada.color === 'blue'
                                    ? 'bg-blue-100 text-blue-800'
                                    : record.validaciones.entrada.color === 'yellow'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                title={record.validaciones.entrada.mensaje}
                              >
                                {record.validaciones.entrada.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Paginación */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <div className="text-xs text-slate-500">
                        {totalRecords === 0 ? 'No hay registros' : 
                          `${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalRecords)} de ${totalRecords} registros - Página ${currentPage}${totalPages > 1 ? ` de ${totalPages}` : ''}`
                        }
                      </div>
                      
                      {totalRecords > 0 && (
                        <div className="flex items-center gap-2">
                          {/* Selector de elementos por página */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">Por página:</span>
                            <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                setItemsPerPage(Number(e.target.value))
                                setCurrentPage(1)
                              }}
                              className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-background"
                            >
                              <option value={7}>7</option>
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={20}>20</option>
                              <option value={25}>25</option>
                              <option value={31}>31</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="h-6 w-6 p-0 text-xs border border-slate-200 rounded bg-background hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`h-6 w-6 p-0 text-xs rounded flex items-center justify-center ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-slate-200 bg-background hover:bg-slate-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="h-6 w-6 p-0 text-xs border border-slate-200 rounded bg-background hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SidebarInset>
  </SidebarProvider>
)
}
