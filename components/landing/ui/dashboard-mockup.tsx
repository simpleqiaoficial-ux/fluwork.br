"use client"

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import {
  LayoutDashboard,
  Wallet,
  Users,
  FolderKanban,
  Settings,
  Bell,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

const CHART_DATA = [
  { mes: "Jan", valor: 42 },
  { mes: "Fev", valor: 51 },
  { mes: "Mar", valor: 47 },
  { mes: "Abr", valor: 63 },
  { mes: "Mai", valor: 58 },
  { mes: "Jun", valor: 74 },
  { mes: "Jul", valor: 82 },
]

const STAT_CARDS = [
  { label: "Contratos ativos", value: "128", trend: "+12%", icon: FileText },
  { label: "Financeiro (mês)", value: "R$ 482 mil", trend: "+8%", icon: Wallet },
  { label: "Prestadores ativos", value: "64", trend: "+4%", icon: Users },
]

const ACTIVITIES = [
  { label: "Contrato assinado — João Almeida", time: "há 12 min", icon: CheckCircle2 },
  { label: "Nova nota fiscal recebida", time: "há 34 min", icon: FileText },
  { label: "Aprovação pendente no Financeiro", time: "há 1 h", icon: Clock },
]

const SIDEBAR_ICONS = [LayoutDashboard, Wallet, Users, FolderKanban, Settings]

interface DashboardMockupProps {
  className?: string
  detailed?: boolean
}

/** Mockup visual do dashboard do FluWork — 100% CSS/SVG, sem depender de screenshot externo. */
export function DashboardMockup({ className, detailed = false }: DashboardMockupProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10 ring-1 ring-black/5",
        className,
      )}
      role="img"
      aria-label="Ilustração do painel executivo do FluWork, mostrando indicadores financeiros, prestadores ativos e atividades recentes"
    >
      {/* Barra superior estilo navegador */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-background px-3 text-[11px] text-muted-foreground">
          app.fluwork.com/dashboard
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-14 shrink-0 flex-col items-center gap-4 border-r border-border/70 bg-muted/20 py-4 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">F</div>
          <div className="mt-2 flex flex-col gap-3">
            {SIDEBAR_ICONS.map((Icon, i) => (
              <div
                key={i}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Visão Geral</p>
              <p className="text-[11px] text-muted-foreground">Painel executivo · atualizado agora</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Cards de indicadores */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STAT_CARDS.map((card) => (
              <div key={card.label} className="rounded-xl border border-border/70 bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <card.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-success">
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    {card.trend}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold tabular-nums text-foreground">{card.value}</p>
                <p className="text-[11px] text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div className="rounded-xl border border-border/70 bg-background p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Evolução da operação</p>
              <span className="text-[10px] text-muted-foreground">Últimos 7 meses</span>
            </div>
            <div className="h-28 sm:h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="landingChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#landingChartFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Atividades recentes — só na versão detalhada (seção Dashboard) */}
          {detailed && (
            <div className="rounded-xl border border-border/70 bg-background p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Atividades recentes</p>
              <ul className="space-y-2.5">
                {ACTIVITIES.map((activity) => (
                  <li key={activity.label} className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <activity.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="flex-1 text-xs text-foreground">{activity.label}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{activity.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
