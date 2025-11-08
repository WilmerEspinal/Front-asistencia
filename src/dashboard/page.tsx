import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AttendanceRecord } from "@/types"
import { EmpleadosService } from "@/services/empleados"

export default function Page() {
  const [stats, setStats] = useState({
    totalRegistros: 0,
    entradasHoy: 0,
    salidasHoy: 0,
    empleadosRegistrados: 0
  })

  useEffect(() => {
    // Cambiar título de la pestaña
    document.title = 'Dashboard - Sistema de Asistencia'
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Obtener estadísticas desde la API de asistencias con paginación
      const response = await fetch('http://localhost:3000/api/asistencias/todas?page=1&limit=7', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error fetching attendance data')
      }

      const apiData = await response.json()
      const records: AttendanceRecord[] = apiData.data || []
      const today = new Date().toISOString().split('T')[0]
      
      // Filtrar registros de hoy
      const recordsToday = records.filter(r => r.fecha === today)
      
      // Contar entradas (registros que tienen hora_entrada)
      const entradasHoy = recordsToday.filter(r => r.hora_entrada !== null).length
      
      // Contar salidas (registros que tienen hora_salida)
      const salidasHoy = recordsToday.filter(r => r.hora_salida !== null).length

      // Obtener total de usuarios desde la API
      const usuariosIds = await EmpleadosService.getUsuariosIds()
      const totalUsuarios = usuariosIds.length
      
      setStats({
        totalRegistros: records.length,
        entradasHoy,
        salidasHoy,
        empleadosRegistrados: totalUsuarios
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Fallback: usar datos básicos sin estadísticas específicas
      try {
        const usuariosIds = await EmpleadosService.getUsuariosIds()
        setStats({
          totalRegistros: 0,
          entradasHoy: 0,
          salidasHoy: 0,
          empleadosRegistrados: usuariosIds.length
        })
      } catch (fallbackError) {
        console.error('Error loading fallback stats:', fallbackError)
        setStats({
          totalRegistros: 0,
          entradasHoy: 0,
          salidasHoy: 0,
          empleadosRegistrados: 0
        })
      }
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
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-5 p-5">
          <div className="space-y-5">
            {/* Header compacto y elegante */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Control de Asistencia</h1>
                  <p className="text-slate-300 text-sm">
                    Sistema Municipal de Gestión
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-300">Activo</span>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/5 rounded-full"></div>
              <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-white/3 rounded-full"></div>
            </div>

            {/* Estadísticas compactas y elegantes */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-slate-200/50 shadow-sm bg-white hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Registros</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalRegistros}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-emerald-200/50 shadow-sm bg-white hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Entradas Hoy</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.entradasHoy}</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-blue-200/50 shadow-sm bg-white hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Salidas Hoy</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{stats.salidasHoy}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-purple-200/50 shadow-sm bg-white hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Usuarios</p>
                      <p className="text-2xl font-bold text-purple-700 mt-1">{stats.empleadosRegistrados}</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones rápidas rediseñadas */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border border-slate-200/50 shadow-sm bg-white hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Ver Asistencias</h3>
                      <p className="text-xs text-slate-500">Consultar registros</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                    <Link to="/ver-asistencias">
                      Abrir
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border border-slate-200/50 shadow-sm bg-white hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Nuevo Empleado</h3>
                      <p className="text-xs text-slate-500">Registrar usuario</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link to="/registrar-empleado">
                      Registrar
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border border-slate-200/50 shadow-sm bg-white hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Lista Empleados</h3>
                      <p className="text-xs text-slate-500">Gestionar usuarios</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50">
                    <Link to="/empleados">
                      Ver Lista
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Información del sistema compacta */}
            <Card className="border border-slate-200/50 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 text-sm">Estado del Sistema</h3>
                  <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Operativo
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-500 mb-1">Última actualización</p>
                    <p className="font-medium text-slate-700">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Versión del sistema</p>
                    <p className="font-medium text-slate-700">v1.0.0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
