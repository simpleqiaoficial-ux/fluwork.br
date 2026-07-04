"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { FileSignature, Check, ArrowLeft, Send } from "lucide-react"
import { toast } from "sonner"
import { criarContrato, enviarContrato } from "@/app/actions/contratos"
import { montarDadosContrato, type EmpresaParaMontagem } from "@/lib/contracts/montar-dados-contrato"
import { ContratoPreview } from "@/components/contratos/contrato-preview"

type Passo = "template" | "campos" | "preview"

const CAMPOS_INICIAIS = {
  prestador_nome: "",
  prestador_cpf_cnpj: "",
  prestador_email: "",
  prestador_endereco: "",
  tipo_servico: "",
  valor: "",
  prazo: "",
  data_inicio: "",
  clausulas_adicionais: "",
}

interface NovoContratoWizardProps {
  empresa: EmpresaParaMontagem
}

export function NovoContratoWizard({ empresa }: NovoContratoWizardProps) {
  const router = useRouter()
  const [passo, setPasso] = useState<Passo>("template")
  const [campos, setCampos] = useState(CAMPOS_INICIAIS)
  const [enviando, setEnviando] = useState(false)

  const camposValidos =
    campos.prestador_nome.trim() &&
    campos.prestador_cpf_cnpj.trim() &&
    campos.prestador_email.trim() &&
    campos.tipo_servico.trim() &&
    campos.valor &&
    Number(campos.valor) > 0 &&
    campos.prazo.trim() &&
    campos.data_inicio

  const dadosPreview = camposValidos
    ? montarDadosContrato(
        {
          numero: "(gerado ao enviar)",
          prestador_nome: campos.prestador_nome,
          prestador_cpf_cnpj: campos.prestador_cpf_cnpj,
          prestador_email: campos.prestador_email,
          prestador_endereco: campos.prestador_endereco,
          tipo_servico: campos.tipo_servico,
          valor: Number(campos.valor),
          prazo: campos.prazo,
          data_inicio: campos.data_inicio,
          clausulas_adicionais: campos.clausulas_adicionais,
          versao_atual: 1,
        },
        empresa,
      )
    : null

  const handleConfirmarEEnviar = async () => {
    setEnviando(true)
    try {
      const resultCriar = await criarContrato({
        prestador_nome: campos.prestador_nome,
        prestador_cpf_cnpj: campos.prestador_cpf_cnpj,
        prestador_email: campos.prestador_email,
        prestador_endereco: campos.prestador_endereco || undefined,
        tipo_servico: campos.tipo_servico,
        valor: Number(campos.valor),
        prazo: campos.prazo,
        data_inicio: campos.data_inicio,
        clausulas_adicionais: campos.clausulas_adicionais || undefined,
      })

      if (!resultCriar.success || !resultCriar.id) {
        toast.error(resultCriar.error || "Erro ao criar contrato")
        return
      }

      const resultEnviar = await enviarContrato(resultCriar.id)
      if (!resultEnviar.success) {
        toast.error(resultEnviar.error || "Contrato criado, mas houve erro ao enviar")
        router.push(`/contratos/${resultCriar.id}`)
        return
      }

      toast.success("Contrato enviado para assinatura")
      router.push(`/contratos/${resultCriar.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar contrato")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Novo contrato</h1>
        <p className="text-sm text-muted-foreground mt-1">Crie um contrato e envie para assinatura eletrônica</p>
      </div>

      {/* Indicador de passos */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {(["template", "campos", "preview"] as Passo[]).map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                passo === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={passo === p ? "text-foreground font-medium" : ""}>
              {p === "template" ? "Modelo" : p === "campos" ? "Dados" : "Revisão"}
            </span>
            {i < 2 && <span className="mx-1">—</span>}
          </div>
        ))}
      </div>

      {passo === "template" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 rounded-md border border-primary bg-primary/5 p-4">
              <FileSignature className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Prestação de Serviços PJ – Padrão</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Modelo padrão de contrato de prestação de serviços para prestadores PJ, com timbre da empresa.
                </p>
              </div>
              <Check className="h-4 w-4 text-primary shrink-0" />
            </div>
            <Button className="w-full mt-4" onClick={() => setPasso("campos")}>
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {passo === "campos" && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="prestador_nome">Nome completo do prestador</Label>
                <Input
                  id="prestador_nome"
                  placeholder="João da Silva"
                  value={campos.prestador_nome}
                  onChange={(e) => setCampos({ ...campos, prestador_nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prestador_cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="prestador_cpf_cnpj"
                  placeholder="000.000.000-00"
                  value={campos.prestador_cpf_cnpj}
                  onChange={(e) => setCampos({ ...campos, prestador_cpf_cnpj: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prestador_email">E-mail</Label>
                <Input
                  id="prestador_email"
                  type="email"
                  placeholder="joao@exemplo.com"
                  value={campos.prestador_email}
                  onChange={(e) => setCampos({ ...campos, prestador_email: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="prestador_endereco">Endereço</Label>
                <Textarea
                  id="prestador_endereco"
                  placeholder="Rua, número, bairro, cidade/UF"
                  value={campos.prestador_endereco}
                  onChange={(e) => setCampos({ ...campos, prestador_endereco: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_servico">Tipo de serviço</Label>
                <Input
                  id="tipo_servico"
                  placeholder="Ex: Consultoria em TI"
                  value={campos.tipo_servico}
                  onChange={(e) => setCampos({ ...campos, tipo_servico: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={campos.valor}
                  onChange={(e) => setCampos({ ...campos, valor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo</Label>
                <Input
                  id="prazo"
                  placeholder="Ex: 12 meses"
                  value={campos.prazo}
                  onChange={(e) => setCampos({ ...campos, prazo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={campos.data_inicio}
                  onChange={(e) => setCampos({ ...campos, data_inicio: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clausulas_adicionais">Cláusulas adicionais (opcional)</Label>
                <Textarea
                  id="clausulas_adicionais"
                  placeholder="Condições específicas deste contrato..."
                  value={campos.clausulas_adicionais}
                  onChange={(e) => setCampos({ ...campos, clausulas_adicionais: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="gap-2" onClick={() => setPasso("template")}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button className="flex-1" disabled={!camposValidos} onClick={() => setPasso("preview")}>
                Ver prévia do contrato
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {passo === "preview" && dadosPreview && (
        <div className="space-y-4">
          <ContratoPreview dados={dadosPreview} />
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setPasso("campos")} disabled={enviando}>
              <ArrowLeft className="h-4 w-4" />
              Voltar e editar
            </Button>
            <Button className="flex-1 gap-2" onClick={handleConfirmarEEnviar} disabled={enviando}>
              <Send className="h-4 w-4" />
              {enviando ? "Enviando..." : "Confirmar e enviar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
