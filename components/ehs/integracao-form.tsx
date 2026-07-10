"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { criarIntegracaoEhs, type IntegracaoEhsInput } from "@/app/actions/ehs-integracoes"

interface ClienteOpcao {
  id: string
  nome: string
}

interface PrestadorOpcao {
  id: string
  nome_completo: string
  foto_url: string | null
}

interface IntegracaoFormProps {
  clientes: ClienteOpcao[]
  prestadores: PrestadorOpcao[]
  clienteIdInicial?: string
  colaboradorIdInicial?: string
}

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

export function IntegracaoForm({ clientes, prestadores, clienteIdInicial, colaboradorIdInicial }: IntegracaoFormProps) {
  const router = useRouter()
  const [clienteId, setClienteId] = useState(clienteIdInicial || "")
  const [colaboradorId, setColaboradorId] = useState(colaboradorIdInicial || "")
  const [clientePopoverAberto, setClientePopoverAberto] = useState(false)
  const [prestadorPopoverAberto, setPrestadorPopoverAberto] = useState(false)
  const [dataAgendada, setDataAgendada] = useState("")
  const [horario, setHorario] = useState("")
  const [enderecoLocal, setEnderecoLocal] = useState("")
  const [cidade, setCidade] = useState("")
  const [sala, setSala] = useState("")
  const [local, setLocal] = useState("")
  const [telefone, setTelefone] = useState("")
  const [tempoEstimado, setTempoEstimado] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [salvando, setSalvando] = useState(false)

  const clienteSelecionado = clientes.find((c) => c.id === clienteId)
  const prestadorSelecionado = prestadores.find((p) => p.id === colaboradorId)

  const handleSalvar = async () => {
    if (!clienteId || !colaboradorId) {
      toast.error("Selecione o cliente e o prestador")
      return
    }
    if (!dataAgendada) {
      toast.error("Informe a data do agendamento")
      return
    }
    setSalvando(true)
    try {
      const payload: IntegracaoEhsInput = {
        cliente_id: clienteId,
        colaborador_id: colaboradorId,
        data_agendada: dataAgendada,
        horario: horario || null,
        endereco_local: enderecoLocal || null,
        cidade: cidade || null,
        sala: sala || null,
        local: local || null,
        telefone: telefone || null,
        observacoes: observacoes || null,
        tempo_estimado_minutos: tempoEstimado ? Number(tempoEstimado) : null,
      }
      const result = await criarIntegracaoEhs(payload)
      if (!result.success || !result.id) {
        toast.error(("error" in result && result.error) || "Erro ao agendar integração")
        return
      }
      toast.success("Integração agendada")
      router.push(`/ehs/integracoes/${result.id}`)
      router.refresh()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente e prestador</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Popover open={clientePopoverAberto} onOpenChange={setClientePopoverAberto}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal" disabled={!!clienteIdInicial}>
                  {clienteSelecionado ? clienteSelecionado.nome : <span className="text-muted-foreground">Selecione o cliente</span>}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    {clientes.map((c) => (
                      <CommandItem key={c.id} value={c.nome} onSelect={() => { setClienteId(c.id); setClientePopoverAberto(false) }}>
                        {c.nome}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Prestador</Label>
            <Popover open={prestadorPopoverAberto} onOpenChange={setPrestadorPopoverAberto}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal" disabled={!!colaboradorIdInicial}>
                  {prestadorSelecionado ? (
                    <span className="flex items-center gap-2 truncate">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={prestadorSelecionado.foto_url || undefined} />
                        <AvatarFallback className="text-[9px]">{iniciais(prestadorSelecionado.nome_completo)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{prestadorSelecionado.nome_completo}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Selecione o prestador</span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar prestador..." />
                  <CommandList>
                    <CommandEmpty>Nenhum prestador encontrado.</CommandEmpty>
                    {prestadores.map((p) => (
                      <CommandItem key={p.id} value={p.nome_completo} onSelect={() => { setColaboradorId(p.id); setPrestadorPopoverAberto(false) }} className="gap-2">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={p.foto_url || undefined} />
                          <AvatarFallback className="text-[10px]">{iniciais(p.nome_completo)}</AvatarFallback>
                        </Avatar>
                        {p.nome_completo}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agendamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="integracao-data">Data</Label>
            <Input id="integracao-data" type="date" value={dataAgendada} onChange={(e) => setDataAgendada(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="integracao-horario">Horário</Label>
            <Input id="integracao-horario" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="integracao-endereco">Endereço</Label>
            <Input id="integracao-endereco" value={enderecoLocal} onChange={(e) => setEnderecoLocal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="integracao-cidade">Cidade</Label>
            <Input id="integracao-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="integracao-sala">Sala</Label>
            <Input id="integracao-sala" value={sala} onChange={(e) => setSala(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="integracao-local">Local/setor</Label>
            <Input id="integracao-local" value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="integracao-telefone">Telefone de contato</Label>
            <Input id="integracao-telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="integracao-tempo">Tempo estimado (minutos)</Label>
            <Input id="integracao-tempo" type="number" min={0} value={tempoEstimado} onChange={(e) => setTempoEstimado(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="integracao-observacoes">Observações</Label>
            <Textarea id="integracao-observacoes" rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={salvando}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
          {salvando ? "Agendando..." : "Agendar integração"}
        </Button>
      </div>
    </div>
  )
}
