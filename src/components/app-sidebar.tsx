import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { authService } from "@/services/auth"

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      items: [
        {
          title: "Panel Principal",
          url: "/dashboard",
          isActive: true,
        },
      ],
    },
    {
      title: "Gestión de Empleados",
      url: "#",
      items: [
        {
          title: "Registrar Empleado",
          url: "/registrar-empleado",
        },
        {
          title: "Lista de Empleados",
          url: "/empleados",
        },
      ],
    },
    {
      title: "Reportes y Consultas",
      url: "#",
      items: [
        {
          title: "Ver Asistencias",
          url: "/ver-asistencias",
        },
        {
          title: "Reportes",
          url: "/reportes",
        },
      ],
    },
    {
      title: "Configuración",
      url: "#",
      items: [
        {
          title: "Horarios",
          url: "/horarios",
        },
        {
          title: "Permisos",
          url: "/permisos",
        },
        {
          title: "Configuración General",
          url: "/configuracion",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    authService.logout()
    navigate('/')
  }
  
  const user = authService.getUser()
  const isAdmin = authService.isAdmin()
  
  // Filter navigation items based on user role
  const filteredNavMain = data.navMain.filter(group => {
    if (group.title === "Gestión de Empleados" && !isAdmin) {
      return false // Hide employee management for non-admin users
    }
    return true
  })

  // Iconos para cada sección
  const getIcon = (title: string) => {
    switch (title) {
      case "Panel Principal":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
          </svg>
        )
      case "Registrar Empleado":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      case "Lista de Empleados":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        )
      case "Ver Asistencias":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
      case "Reportes":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
    }
  }
  
  return (
    <Sidebar {...props} className="border-r border-slate-200 bg-slate-50/30 [&_*]:scrollbar-hide">
      <SidebarHeader className="border-b border-slate-200 bg-white p-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2m0 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-xs leading-none">Sistema Municipal</h2>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Control de Asistencia</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent 
        className="p-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none'
        }}
      >
        {filteredNavMain.map((item) => (
          <SidebarGroup key={item.title} className="">
            <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0 px-1 py-0">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {item.items.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === subItem.url}
                      className={`
                        flex items-center gap-1.5 px-1 py-0.5 rounded text-sm transition-all duration-200
                        ${location.pathname === subItem.url 
                          ? 'bg-slate-800 text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                        }
                      `}
                    >
                      <Link to={subItem.url} className="flex items-center gap-1.5 w-full">
                        {getIcon(subItem.title)}
                        <span className="font-medium">{subItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-200 bg-white p-2">
        <div className="space-y-1.5">
          {user && (
            <div className="bg-slate-50 rounded p-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-xs truncate leading-none">{user.username}</p>
                  {user.rol_nombre && (
                    <p className="text-xs text-slate-500 leading-none mt-0.5">{user.rol_nombre}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors h-7 text-xs"
          >
            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
