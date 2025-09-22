import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/login'
import DashboardPage from './dashboard/page'
import VerAsistenciasPage from './pages/ver-asistencias'
import RegistrarEmpleadoPage from './pages/registrar-empleado'
import ListaEmpleadosPage from './pages/lista-empleados'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/ver-asistencias" element={
          <ProtectedRoute>
            <VerAsistenciasPage />
          </ProtectedRoute>
        } />
        <Route path="/registrar-empleado" element={
          <ProtectedRoute requiredRole={2}>
            <RegistrarEmpleadoPage />
          </ProtectedRoute>
        } />
        <Route path="/empleados" element={
          <ProtectedRoute requiredRole={2}>
            <ListaEmpleadosPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
