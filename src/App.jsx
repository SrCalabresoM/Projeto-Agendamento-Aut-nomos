import { useState } from 'react'
import { BrowserRouter, Link } from 'react-router-dom'
import './App.css'
import AppRoutes from './routes/AppRoutes.jsx'
import { AuthContextProvider } from './shared/useAuth.jsx'
import { useAuth } from './shared/useAuth.jsx'


function AppContent() {
  const { user, perfil } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50 md:px-12">
        <div className="flex gap-4 md:gap-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            Home
          </Link>
          <span className="text-gray-300">|</span>
          <Link 
            to={user ? "/perfil" : "/cadastro"} 
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {user ? perfil?.nome || "Perfil" : "Cadastro"}
          </Link>
          <span className="text-gray-300">|</span>
          <Link 
            to="/criar"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Criar
          </Link>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8">
        <AppRoutes />
      </main>
    </div>
  );

}

function App() {
  return (
    <BrowserRouter>
      <AuthContextProvider>
          <AppContent />
      </AuthContextProvider>
    </BrowserRouter>
  );
}

export default App