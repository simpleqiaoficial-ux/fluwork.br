"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Building2, Users, FileSignature, CheckCircle2, Wallet, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { atualizarEmpresa, atualizarStatusEmpresa, atualizarCredenciaisUsuario } from "@/app/actions/empresas"

interface UsuarioRow {
  id: string
  nome_completo: string
  email: string | null
  tipo_acesso: string | null
}

interface EmpresaDetailProps {
  empresa: any
  stats: {
    total_colaboradores: number
    total_contratos: number
    contratos_assinados: number
    total_pedidos: number
  }
  usuarios: UsuarioRow[]
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "outline" | "destructive" }> = {
  active: { label: "Ativa", variant: "success" },
  inactive: { label: "Inativa", variant: "outline" },
  blocked: { label: "Bloqueada", variant: "destructive" },
}

export function EmpresaDetail({ empresa, stats, usuarios }: EmpresaDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    razao_social: empresa.razao_social || "",
    nome_fantasia: empresa.nome_fantasia || "",
    cnpj: empresa.cnpj || "",
    email: empresa.email || "",
    telefone: empresa.telefone || "",
    endereco: empresa.endereco || "",
  })

  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioRow | null>(null)
  const [credenciais, setCredenciais] = useState({ nome_completo: "", email: "", nova_senha: "" })
  const [salvandoCredenciais, setSalvandoCredenciais] = useState(false)

  const abrirEdicaoCredenciais = (usuario: UsuarioRow) => {
    setUsuarioEditando(usuario)
    setCredenciais({ nome_completo: usuario.nome_completo, email: usuario.email || "", nova_senha: "" })
  }

  const handleSalvarCredenciais = async () => {
    if (!usuarioEditando) return
    setSalvandoCredenciais(true)
    try {
      const result = await atualizarCredenciaisUsuario(usuarioEditando.id, {
        nome_completo: credenciais.nome_completo,
        email: credenciais.email,
        nova_senha: credenciais.nova_senha || undefined,
      })
      if (result.success) {
        toast.success("Credenciais atualizadas")
        setUsuarioEditando(null)
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao atualizar credenciais")
      }
    } finally {
      setSalvandoCredenciais(false)
    }
  }

  const statusConfig = STATUS_CONFIG[empresa.status] || { label: empresa.status, variant: "outline" as const }

  const handleSalvar = async () => {
    setLoading(true)
    try {
      const result = await atualizarEmpresa(empresa.id, form)
      if (result.success) {
        toast.success("Empresa atualizada")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao atualizar")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    setLoading(true)
    try {
      const result = await atualizarStatusEmpresa(empresa.id, status as "active" | "inactive" | "blocked")
      if (result.success) {
        toast.success("Status atualizado")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao atualizar status")
      }
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    { label: "Prestadores/usuários", valor: stats.total_colaboradores, icon: Users },
    { label: "Contratos enviados", valor: stats.total_contratos, icon: FileSignature },
    { label: "Contratos assinados", valor: stats.contratos_assinados, icon: CheckCircle2 },
    { label: "Pedidos de pagamento", valor: stats.total_pedidos, icon: Wallet },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/empresas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />
          Empresas
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{empresa.nome_fantasia || empresa.razao_social}</h1>
              <p className="text-sm text-muted-foreground">{empresa.razao_social} · CNPJ {empresa.cnpj}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <Select value={empresa.status} onValueChange={handleStatusChange} disabled={loading}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-md border p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{card.label}</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums mt-2">{card.valor}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-md border p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados cadastrais</p>
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Razão social</Label>
            <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nome fantasia</Label>
            <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">E-mail</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Telefone</Label>
            <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Endereço</Label>
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </div>
        </div>
        <Button onClick={handleSalvar} disabled={loading} size="sm">
          {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <div className="rounded-md border">
        <div className="p-5 pb-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usuários da empresa</p>
        </div>
        {usuarios.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Nenhum usuário cadastrado nesta empresa.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="w-[60px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome_completo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{usuario.tipo_acesso}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicaoCredenciais(usuario)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!usuarioEditando} onOpenChange={(open) => !open && setUsuarioEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar credenciais</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cred-nome">Nome completo</Label>
              <Input
                id="cred-nome"
                value={credenciais.nome_completo}
                onChange={(e) => setCredenciais({ ...credenciais, nome_completo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-email">E-mail</Label>
              <Input
                id="cred-email"
                type="email"
                value={credenciais.email}
                onChange={(e) => setCredenciais({ ...credenciais, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-senha">Nova senha (opcional)</Label>
              <Input
                id="cred-senha"
                type="password"
                placeholder="Deixe em branco para manter a senha atual"
                value={credenciais.nova_senha}
                onChange={(e) => setCredenciais({ ...credenciais, nova_senha: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuarioEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarCredenciais} disabled={salvandoCredenciais}>
              {salvandoCredenciais ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
