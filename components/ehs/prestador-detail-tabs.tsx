"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FileText, History, ShieldCheck, LayoutGrid, Loader2, ExternalLink, Upload, XCircle, ChevronDown, ChevronUp, CalendarClock, Plus, CreditCard } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { ComplianceRing } from "@/components/ehs/compliance-ring"
import { DocumentoUploadDialog } from "@/components/ehs/documento-upload-dialog"
import { CarteirinhasList } from "@/components/ehs/carteirinhas-list"
import { calcularSituacaoValidade } from "@/lib/ehs/validade"
import { CATEGORIA_LABELS } from "@/lib/ehs/documento-categorias"
import { situacaoExibicaoIntegracao } from "@/lib/ehs/integracoes"
import { rejeitarDocumentoEhs } from "@/app/actions/ehs-documentos"
import type { ComplianceResultado } from "@/lib/ehs/compliance"

interface TipoDocumentoEhsDTO {
  id: string
  nome: string
  categoria: string
}

interface DocumentoEhsDTO {
  id: string
  versao: number
  url: string
  data_emissao: string | null
  data_validade: string | null
  status: string
  observacoes: string | null
  created_at: string
  responsavel?: { id: string; nome_completo: string } | null
}

interface DocumentoAgrupado {
  tipo: TipoDocumentoEhsDTO
  atual: DocumentoEhsDTO | null
  historico: DocumentoEhsDTO[]
}

interface TimelineEventoDTO {
  id: string
  tipo_evento: string
  descricao: string
  ator_nome: string | null
  created_at: string | Date
}

interface AuditoriaEventoDTO {
  id: string
  acao: string
  campo: string | null
  valor_antigo: string | null
  valor_novo: string | null
  ator_nome: string | null
  created_at: string | Date
}

interface IntegracaoResumoDTO {
  id: string
  status: string
  data_agendada: string
  horario: string | null
  data_validade: string | null
  cliente?: { id: string; nome: string } | null
}

interface CarteirinhaDTO {
  id: string
  titulo: string | null
  url: string
  status: string
  created_at: string | Date
  cliente?: { id: string; nome: string } | null
}

interface PrestadorDetailTabsProps {
  colaboradorId: string
  documentosPorTipo: DocumentoAgrupado[]
  timeline: TimelineEventoDTO[]
  auditoria: AuditoriaEventoDTO[]
  integracoes: IntegracaoResumoDTO[]
  carteirinhas: CarteirinhaDTO[]
  compliance: ComplianceResultado
}

const VALIDADE_VARIANT: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  vigente: "success",
  vence_90: "warning",
  vence_60: "warning",
  vence_30: "warning",
  vence_15: "destructive",
  vence_7: "destructive",
  vencido: "destructive",
  sem_validade: "outline",
}

function formatarData(data?: string | null): string {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

function formatarDataHora(data: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data))
}

const AUDITORIA_LABELS: Record<string, string> = {
  criado: "Documento enviado",
  atualizado: "Documento atualizado",
  excluido: "Documento removido",
}

export function PrestadorDetailTabs({ colaboradorId, documentosPorTipo, timeline, auditoria, integracoes, carteirinhas, compliance }: PrestadorDetailTabsProps) {
  const router = useRouter()
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos")
  const [uploadAberto, setUploadAberto] = useState(false)
  const [tipoParaUpload, setTipoParaUpload] = useState<string | undefined>(undefined)
  const [historicoAberto, setHistoricoAberto] = useState<Record<string, boolean>>({})
  const [rejeitarAlvo, setRejeitarAlvo] = useState<DocumentoEhsDTO | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState("")
  const [rejeitando, setRejeitando] = useState(false)

  const tipos = documentosPorTipo.map((d) => d.tipo)
  const categorias = Array.from(new Set(tipos.map((t) => t.categoria)))
  const documentosFiltrados = categoriaFiltro === "todos" ? documentosPorTipo : documentosPorTipo.filter((d) => d.tipo.categoria === categoriaFiltro)
  const ausentes = documentosPorTipo.filter((d) => !d.atual)

  const abrirUploadPara = (tipoDocumentoId?: string) => {
    setTipoParaUpload(tipoDocumentoId)
    setUploadAberto(true)
  }

  const confirmarRejeicao = async () => {
    if (!rejeitarAlvo) return
    setRejeitando(true)
    try {
      const result = await rejeitarDocumentoEhs(rejeitarAlvo.id, motivoRejeicao)
      if (!result.success) {
        toast.error(result.error || "Erro ao rejeitar documento")
        return
      }
      toast.success("Documento rejeitado")
      setRejeitarAlvo(null)
      setMotivoRejeicao("")
      router.refresh()
    } finally {
      setRejeitando(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resumo" className="gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="sm:col-span-1 flex flex-col items-center justify-center p-6 gap-3">
              <ComplianceRing score={compliance.score} cor={compliance.cor} size={128} />
              <p className="text-sm text-muted-foreground">Compliance Score</p>
            </Card>
            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Resumo de documentos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Válidos</p>
                  <p className="text-xl font-semibold tabular-nums text-success">{compliance.validos}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencidos/Rejeitados</p>
                  <p className="text-xl font-semibold tabular-nums text-destructive">{compliance.vencidos}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Próximos a vencer</p>
                  <p className="text-xl font-semibold tabular-nums text-warning">{compliance.proximosVencer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ausentes</p>
                  <p className="text-xl font-semibold tabular-nums text-muted-foreground">{ausentes.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {ausentes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentos ainda não enviados</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {ausentes.map((d) => (
                  <Button key={d.tipo.id} variant="outline" size="sm" className="gap-1.5" onClick={() => abrirUploadPara(d.tipo.id)}>
                    <Upload className="h-3.5 w-3.5" />
                    {d.tipo.nome}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Carteirinhas Digitais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CarteirinhasList carteirinhas={carteirinhas} mostrarCliente />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant={categoriaFiltro === "todos" ? "default" : "outline"} size="sm" onClick={() => setCategoriaFiltro("todos")}>
                Todos
              </Button>
              {categorias.map((categoria) => (
                <Button key={categoria} variant={categoriaFiltro === categoria ? "default" : "outline"} size="sm" onClick={() => setCategoriaFiltro(categoria)}>
                  {CATEGORIA_LABELS[categoria] || categoria}
                </Button>
              ))}
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => abrirUploadPara(undefined)}>
              <Upload className="h-3.5 w-3.5" />
              Enviar documento
            </Button>
          </div>

          <div className="space-y-3">
            {documentosFiltrados.map(({ tipo, atual, historico }) => {
              const situacao = atual ? calcularSituacaoValidade(atual.data_validade) : null
              return (
                <Card key={tipo.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{tipo.nome}</p>
                        {atual ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Versão {atual.versao} · Emitido em {formatarData(atual.data_emissao)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">Nenhum documento enviado</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {atual && (
                          <>
                            {atual.status === "rejeitado" ? (
                              <Badge variant="destructive">Rejeitado</Badge>
                            ) : (
                              situacao && <Badge variant={VALIDADE_VARIANT[situacao.chave]}>{situacao.chave === "vigente" ? `Válido até ${formatarData(atual.data_validade)}` : situacao.label}</Badge>
                            )}
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <a href={atual.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            {atual.status !== "rejeitado" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setRejeitarAlvo(atual)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => abrirUploadPara(tipo.id)}>
                          <Upload className="h-3.5 w-3.5" />
                          {atual ? "Nova versão" : "Enviar"}
                        </Button>
                        {historico.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => setHistoricoAberto((prev) => ({ ...prev, [tipo.id]: !prev[tipo.id] }))}
                          >
                            {historicoAberto[tipo.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {historico.length} versão(ões) anterior(es)
                          </Button>
                        )}
                      </div>
                    </div>

                    {historicoAberto[tipo.id] && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {historico.map((versao) => (
                          <div key={versao.id} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Versão {versao.versao} · Emitido em {formatarData(versao.data_emissao)} · {versao.status === "rejeitado" ? "Rejeitado" : "Substituído"}
                            </span>
                            <a href={versao.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Ver arquivo
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-3">
          <div className="flex justify-end">
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/ehs/integracoes/nova?prestador=${colaboradorId}`}>
                <Plus className="h-3.5 w-3.5" />
                Nova integração
              </Link>
            </Button>
          </div>
          {integracoes.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nenhuma integração agendada" description="Agende este prestador em um cliente para começar a acompanhar presenças e crachás." className="py-16" />
          ) : (
            <div className="space-y-2">
              {integracoes.map((integracao) => (
                <Link key={integracao.id} href={`/ehs/integracoes/${integracao.id}`}>
                  <Card className="p-3 flex flex-wrap items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{integracao.cliente?.nome || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatarData(integracao.data_agendada)}
                        {integracao.horario ? ` às ${integracao.horario}` : ""}
                      </p>
                    </div>
                    <StatusBadge entity="ehs_integracao" status={situacaoExibicaoIntegracao(integracao)} />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          {timeline.length === 0 ? (
            <EmptyState icon={History} title="Nenhum evento registrado ainda" description="Ações como envio e rejeição de documentos aparecem aqui automaticamente." className="py-16" />
          ) : (
            <div className="space-y-3">
              {timeline.map((evento) => (
                <div key={evento.id} className="flex items-start justify-between gap-3 text-sm border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{evento.descricao}</p>
                    {evento.ator_nome && <p className="text-xs text-muted-foreground mt-0.5">por {evento.ator_nome}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatarDataHora(evento.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="auditoria">
          {auditoria.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="Nenhuma alteração registrada ainda" description="O log técnico de campo-a-campo dos documentos deste prestador aparece aqui." className="py-16" />
          ) : (
            <div className="space-y-3">
              {auditoria.map((evento) => (
                <div key={evento.id} className="flex items-start justify-between gap-3 text-sm border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">
                      {AUDITORIA_LABELS[evento.acao] || evento.acao}
                      {evento.campo && <span className="text-muted-foreground"> · {evento.campo}</span>}
                    </p>
                    {evento.campo && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {evento.valor_antigo || "—"} → {evento.valor_novo || "—"}
                      </p>
                    )}
                    {evento.ator_nome && <p className="text-xs text-muted-foreground mt-0.5">por {evento.ator_nome}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatarDataHora(evento.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DocumentoUploadDialog open={uploadAberto} onOpenChange={setUploadAberto} colaboradorId={colaboradorId} tipos={tipos} tipoDocumentoIdInicial={tipoParaUpload} />

      <Dialog open={!!rejeitarAlvo} onOpenChange={(open) => !open && setRejeitarAlvo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Motivo da rejeição (opcional)" value={motivoRejeicao} onChange={(e) => setMotivoRejeicao(e.target.value)} rows={3} />
            <Button variant="destructive" className="w-full" onClick={confirmarRejeicao} disabled={rejeitando}>
              {rejeitando && <Loader2 className="h-4 w-4 animate-spin" />}
              {rejeitando ? "Rejeitando..." : "Confirmar rejeição"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
