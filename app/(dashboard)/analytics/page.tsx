'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, AlertCircle, Zap, TrendingUp, Activity } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// ── Tipos ─────────────────────────────────────────────────────
type AnalyticsData = {
  tasksByStatus: { status: string; _count: number }[]
  tasksByPriority: { priority: string; _count: number }[]
  automationPerformance: { status: string; _count: number }[]
  avgLeadTimeHours: number
  totalCompleted: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10B981',
  MEDIUM: '#3B82F6',
  HIGH: '#F59E0B',
  URGENT: '#EF4444',
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Error al cargar analíticas')
      const json = (await res.json()) as { data: AnalyticsData }
      return json.data
    },
  })

  if (isLoading)
    return (
      <div className="animate-pulse p-8 text-gray-500">Cargando métricas de rendimiento...</div>
    )
  if (error || !data) return <div className="p-8 text-red-500">Error al cargar el dashboard.</div>

  const statusData = data.tasksByStatus.map((s) => ({ name: s.status, total: s._count }))
  const priorityData = data.tasksByPriority.map((p) => ({ name: p.priority, value: p._count }))
  const automationData = data.automationPerformance.map((a) => ({
    name: a.status,
    total: a._count,
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Rendimiento</h1>
        <p className="text-muted-foreground">
          Monitorea la eficiencia de tu equipo y flujos de trabajo.
        </p>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tareas Completadas"
          value={data.totalCompleted.toString()}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          description="Total histórico del equipo"
        />
        <KpiCard
          title="Lead Time Promedio"
          value={`${data.avgLeadTimeHours}h`}
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          description="Tiempo medio de resolución"
        />
        <KpiCard
          title="Tasa de Automatización"
          value={`${automationData.find((a) => a.name === 'SUCCESS')?.total || 0}`}
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
          description="Ejecuciones exitosas"
        />
        <KpiCard
          title="Estado Actual"
          value="Saludable"
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          description="Basado en deadlines recientes"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* ── Gráfico: Tareas por Estado ───────────────────────── */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5" /> Distribución por Estado
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Gráfico: Prioridades (Donut) ─────────────────────── */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5" /> Prioridades
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Gráfico: Automatizaciones ───────────────────────── */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-3">
          <h3 className="mb-6 text-lg font-semibold">Estado de Automatizaciones</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={automationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {automationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'SUCCESS'
                          ? '#10B981'
                          : entry.name === 'FAILED'
                            ? '#EF4444'
                            : '#6B7280'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon,
  description,
}: {
  title: string
  value: string
  icon: React.ReactNode
  description: string
}) {
  return (
    <div className="space-y-2 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
