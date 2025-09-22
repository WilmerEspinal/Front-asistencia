import { useState, useEffect } from 'react'
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
import type { AttendanceRecord } from "@/types"

export default function VerAsistenciasPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [filters, setFilters] = useState({
    codigo_empleado: '',
    fecha: '',
    tipo: ''
  })

  useEffect(() => {
    loadRecords()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [records, filters])

  function loadRecords() {
    const storedRecords = localStorage.getItem('muni-asistencia:registros')
    if (storedRecords) {
      const parsedRecords = JSON.parse(storedRecords)
      setRecords(parsedRecords.sort((a: AttendanceRecord, b: AttendanceRecord) => 
        new Date(b.fecha + ' ' + (b.hora_entrada || b.hora_salida || '')).getTime() - 
        new Date(a.fecha + ' ' + (a.hora_entrada || a.hora_salida || '')).getTime()
      ))
    }
  }

  function applyFilters() {
    let filtered = records

    if (filters.codigo_empleado) {
      filtered = filtered.filter(record => 
        record.codigo_empleado.toLowerCase().includes(filters.codigo_empleado.toLowerCase())
      )
    }

    if (filters.fecha) {
      filtered = filtered.filter(record => record.fecha === filters.fecha)
    }

    if (filters.tipo) {
      filtered = filtered.filter(record => record.tipo === filters.tipo)
    }

    setFilteredRecords(filtered)
  }

  function onChange<K extends keyof typeof filters>(key: K, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({ codigo_empleado: '', fecha: '', tipo: '' })
  }

  function formatTime(time: string) {
    return time ? time.substring(0, 5) : '--:--'
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
                <BreadcrumbPage>Ver Asistencias</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-3 p-3">
          <div className="space-y-3">
            {/* Filtros compactos */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <h3 className="text-sm font-medium text-slate-800">Filtros</h3>
                  <span className="text-xs text-slate-500">Filtrar registros de asistencia</span>
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <FormInput
                    label="Código de Empleado"
                    value={filters.codigo_empleado}
                    onChange={e => onChange('codigo_empleado', e.target.value)}
                    placeholder="EMP2025-001"
                    className="text-sm"
                  />
                  <FormInput
                    label="Fecha"
                    type="date"
                    value={filters.fecha}
                    onChange={e => onChange('fecha', e.target.value)}
                    className="text-sm"
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Tipo</label>
                    <select
                      value={filters.tipo}
                      onChange={e => onChange('tipo', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-background text-foreground"
                    >
                      <option value="">Todos</option>
                      <option value="entrada">Entrada</option>
                      <option value="salida">Salida</option>
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

            {/* Lista de registros compacta */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h3 className="text-sm font-medium text-slate-800">Registros de Asistencia</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {filteredRecords.length} registro(s) encontrado(s)
                  </p>
                </div>
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p className="text-sm">No se encontraron registros de asistencia</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {record.nombre?.charAt(0)}{record.apellido?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-xs">
                              {record.nombre} {record.apellido}
                            </div>
                            <div className="text-xs text-slate-500">
                              {record.codigo_empleado}
                            </div>
                            {record.observaciones && (
                              <div className="text-xs text-slate-500 truncate max-w-40">
                                {record.observaciones}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-xs">
                            {formatDate(record.fecha)}
                          </div>
                          <div className="text-xs text-slate-600">
                            {formatTime(record.hora_entrada || record.hora_salida || '')}
                          </div>
                          <div className={`text-xs px-1.5 py-0.5 rounded-full mt-1 ${
                            record.tipo === 'entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {record.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                          </div>
                        </div>
                      </div>
                    ))}
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
