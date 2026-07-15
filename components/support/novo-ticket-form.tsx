"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, FileUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { criarTicket } from "@/app/actions/support-tickets"
import { anexarArquivoTicket } from "@/app/actions/support-attachments"
import { CATEGORIAS_SUPORTE } from "@/lib/support/categorias"

interface ContextoErro {
  message: string
  digest: string | null
  pathname: string | null
}

export function NovoTicketForm({ contextoErroInicial }: { contextoErroInicial?: ContextoErro }) {
  const router = useRouter()
  const [categoria, setCategoria] = useState("")
  const [subcategoria, setSubcategoria] = useState("")
  const [titulo, setTitulo] = useState(contextoErroInicial ? "Erro ao acessar a plataforma" : "")
  const [descricao, setDescricao] = useState(
    contextoErroInicial
      ? `Encontrei um erro na tela ${contextoErroInicial.pathname || ""}.\n\nDetalhes técnicos: ${contextoErroInicial.message}`
      : "",
  )
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)

  const categoriaSelecionada = CATEGORIAS_SUPORTE.find((c) => c.valor === categoria)

  const handleEnviar = async () => {
    if (!categoria) {
      toast.error("Selecione uma categoria")
      return
    }
    if (!titulo.trim()) {
      toast.error("Informe um título")
      return
    }
    if (!descricao.trim()) {
      toast.error("Descreva o problema")
      return
    }

    setEnviando(true)
    try {
      const result = await criarTicket({
        titulo,
        categoria,
        subcategoria: subcategoria || null,
        descricao,
        origem: contextoErroInicial ? "erro_automatico" : "manual",
        contextoErro: contextoErroInicial,
      })
      if (!result.success || !result.ticketId) {
        toast.error(result.error || "Erro ao abrir chamado")
        return
      }

      if (arquivo) {
        const formData = new FormData()
        formData.append("file", arquivo)
        const resultadoAnexo = await anexarArquivoTicket(result.ticketId, formData)
        if (!resultadoAnexo.success) {
          toast.error(resultadoAnexo.error || "Chamado aberto, mas o anexo não pôde ser enviado")
        }
      }

      toast.success(`Chamado ${result.numero} aberto`)
      if (result.duplicadoAviso) {
        toast.message('Você já tem um chamado parecido em aberto — dá uma olhada em "Meus chamados".')
      }
      router.push(`/suporte/${result.ticketId}`)
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      {contextoErroInicial && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
          <p>Pré-preenchemos este chamado com os detalhes técnicos do erro que você encontrou. Pode editar à vontade antes de enviar.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sobre o que é o seu chamado?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={categoria}
              onValueChange={(v) => {
                setCategoria(v)
                setSubcategoria("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_SUPORTE.map((c) => (
                  <SelectItem key={c.valor} value={c.valor}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {categoriaSelecionada && categoriaSelecionada.subcategoriasSugeridas.length > 0 && (
            <div className="space-y-2">
              <Label>Mais especificamente (opcional)</Label>
              <Select value={subcategoria} onValueChange={setSubcategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione se alguma se encaixa" />
                </SelectTrigger>
                <SelectContent>
                  {categoriaSelecionada.subcategoriasSugeridas.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ticket-titulo">Título</Label>
            <Input id="ticket-titulo" placeholder="Resuma o problema em poucas palavras" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-descricao">Descrição</Label>
            <Textarea
              id="ticket-descricao"
              rows={6}
              placeholder="Descreva com detalhes o que está acontecendo"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Anexo (opcional)</Label>
            <label className="flex items-center gap-3 p-4 rounded-lg border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
              <FileUp className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{arquivo ? arquivo.name : "Clique para selecionar o arquivo"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG ou PNG · máximo 10MB</p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setArquivo(file)
                  e.target.value = ""
                }}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={enviando}>
          Cancelar
        </Button>
        <Button onClick={handleEnviar} disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          {enviando ? "Enviando..." : "Abrir chamado"}
        </Button>
      </div>
    </div>
  )
}
