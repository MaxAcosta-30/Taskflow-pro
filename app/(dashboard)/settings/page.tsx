import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Users, 
  Palette 
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Configuracion</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Gestiona las preferencias de tu cuenta, equipo y notificaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        {/* Navegacion Lateral de Settings */}
        <aside className="space-y-1">
          <nav className="flex flex-col space-y-1">
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              <User size={18} />
              Perfil
            </button>
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Users size={18} />
              Equipo
            </button>
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Bell size={18} />
              Notificaciones
            </button>
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Palette size={18} />
              Apariencia
            </button>
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Lock size={18} />
              Seguridad
            </button>
          </nav>
        </aside>

        {/* Contenido Principal */}
        <div className="space-y-6">
          {/* Seccion de Perfil */}
          <section className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Informacion Personal</h2>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Cambiar foto de perfil
                </button>
              </div>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Max Power"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo Electronico</label>
                  <input 
                    type="email" 
                    placeholder="admin@taskflow.pro"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Zona Horaria</label>
                <select className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
                  <option>America/Mexico_City (GMT-6)</option>
                  <option>UTC</option>
                  <option>Europe/Madrid (GMT+1)</option>
                </select>
              </div>

              <div className="pt-4">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </section>

          {/* Seccion de Plan de Equipo */}
          <section className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Plan y Facturacion</h2>
            <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Plan Pro</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Facturacion mensual activa</p>
              </div>
              <button className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded text-blue-700 dark:text-blue-300">
                Gestionar Plan
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
