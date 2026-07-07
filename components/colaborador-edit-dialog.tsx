"use client"

import type React from "react"
import type { Colaborador, TipoAcesso, CentroCusto } from "@/types/colaborador"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { atualizarColaborador } from "@/app/actions/colaboradores"
import { listarEquipes } from "@/app/actions/equipes"
import { listarCentrosCusto } from "@/app/actions/centros-custo"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ColaboradorEditDialogProps {
  colaborador: Colaborador
  open: boolean
  onOpenChange: (open: boolean) => void
  usuarioLogadoTipoAcesso?: string
}

function montarFormData(colaborador: Colaborador) {
  return {
    nome_completo: colaborador.nome_completo,
    salario: colaborador.salario.toString(),
    cnpj: colaborador.cnpj || "",
    razao_social: colaborador.razao_social || "",
    data_abertura: colaborador.data_abertura || "",
    endereco_cep: colaborador.endereco_cep || "",
    endereco_logradouro: colaborador.endereco_logradouro || "",
    endereco_numero: colaborador.endereco_numero || "",
    endereco_complemento: colaborador.endereco_complemento || "",
    endereco_bairro: colaborador.endereco_bairro || "",
    endereco_cidade: colaborador.endereco_cidade || "",
    endereco_uf: colaborador.endereco_uf || "",
    data_nascimento: colaborador.data_nascimento || "",
    data_aniversario_contrato: colaborador.data_aniversario_contrato || "",
    email: colaborador.email,
    tipo_acesso: colaborador.tipo_acesso as TipoAcesso,
    equipe_id: colaborador.equipe_id || "0",
    dia_pagamento: colaborador.dia_pagamento?.toString() || "1",
    chave_pix: colaborador.chave_pix || "",
    tipo_chave_pix: colaborador.tipo_chave_pix || "",
    centro_custo_id: colaborador.centro_custo_id || "0",
    senha: "",
  }
}

export function ColaboradorEditDialog({ colaborador, open, onOpenChange, usuarioLogadoTipoAcesso }: ColaboradorEditDialogProps) {
  const isAdm = usuarioLogadoTipoAcesso === "Adm"
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [equipes, setEquipes] = useState<Array<{ id: string; nome: string }>>([])
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([])
  const [formData, setFormData] = useState(() => montarFormData(colaborador))

  useEffect(() => {
    if (open) {
      Promise.all([listarEquipes(), listarCentrosCusto()]).then(([eqs, ccs]) => {
        setEquipes(eqs)
        setCentrosCusto(ccs)
      })
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setFormData(montarFormData(colaborador))
    }
  }, [open, colaborador])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData: any = {
        nome_completo: formData.nome_completo,
        salario: Number.parseFloat(formData.salario),
        cnpj: formData.cnpj,
        razao_social: formData.razao_social || null,
        data_abertura: formData.data_abertura || null,
        endereco_cep: formData.endereco_cep || null,
        endereco_logradouro: formData.endereco_logradouro || null,
        endereco_numero: formData.endereco_numero || null,
        endereco_complemento: formData.endereco_complemento || null,
        endereco_bairro: formData.endereco_bairro || null,
        endereco_cidade: formData.endereco_cidade || null,
        endereco_uf: formData.endereco_uf || null,
        data_nascimento: formData.data_nascimento || null,
        data_aniversario_contrato: formData.data_aniversario_contrato || null,
        email: formData.email,
        tipo_acesso: formData.tipo_acesso,
        equipe_id: formData.equipe_id === "0" ? null : formData.equipe_id,
        dia_pagamento: Number.parseInt(formData.dia_pagamento),
        chave_pix: formData.chave_pix || null,
        tipo_chave_pix: formData.tipo_chave_pix || null,
        centro_custo_id: formData.centro_custo_id === "0" ? null : formData.centro_custo_id,
      }

      if (formData.senha) {
        updateData.senha = formData.senha
      }

      await atualizarColaborador(colaborador.id, updateData)

      toast.success("Prestador atualizado!")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao atualizar prestador"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Prestador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Empresa */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Empresa</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_cnpj">CNPJ</Label>
                <Input
                  id="edit_cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_data_abertura">Data de Abertura</Label>
                <Input
                  id="edit_data_abertura"
                  type="date"
                  value={formData.data_abertura}
                  onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit_razao_social">Razão Social</Label>
                <Input
                  id="edit_razao_social"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_endereco_cep">CEP</Label>
                <Input
                  id="edit_endereco_cep"
                  value={formData.endereco_cep}
                  onChange={(e) => setFormData({ ...formData, endereco_cep: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_endereco_uf">UF</Label>
                <Input
                  id="edit_endereco_uf"
                  maxLength={2}
                  value={formData.endereco_uf}
                  onChange={(e) => setFormData({ ...formData, endereco_uf: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit_endereco_logradouro">Logradouro</Label>
                <Input
                  id="edit_endereco_logradouro"
                  value={formData.endereco_logradouro}
                  onChange={(e) => setFormData({ ...formData, endereco_logradouro: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_endereco_numero">Número</Label>
                <Input
                  id="edit_endereco_numero"
                  value={formData.endereco_numero}
                  onChange={(e) => setFormData({ ...formData, endereco_numero: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_endereco_bairro">Bairro</Label>
                <Input
                  id="edit_endereco_bairro"
                  value={formData.endereco_bairro}
                  onChange={(e) => setFormData({ ...formData, endereco_bairro: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit_endereco_cidade">Cidade</Label>
                <Input
                  id="edit_endereco_cidade"
                  value={formData.endereco_cidade}
                  onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Pessoa física (opcional) */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground">Pessoa física (opcional)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_nome_completo">Nome Completo</Label>
                <Input
                  id="edit_nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_data_nascimento">Data de Nascimento</Label>
                <Input
                  id="edit_data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Acesso e contrato */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground">Acesso e contrato</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_email">E-mail</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_senha">Nova Senha (opcional)</Label>
                <Input
                  id="edit_senha"
                  type="password"
                  placeholder="Deixe em branco para manter"
                  minLength={6}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_data_aniversario_contrato">Aniversário Contrato</Label>
                <Input
                  id="edit_data_aniversario_contrato"
                  type="date"
                  value={formData.data_aniversario_contrato}
                  onChange={(e) => setFormData({ ...formData, data_aniversario_contrato: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_tipo_acesso">Perfil de Acesso</Label>
                <Select
                  value={formData.tipo_acesso}
                  onValueChange={(value) => setFormData({ ...formData, tipo_acesso: value as TipoAcesso })}
                >
                  <SelectTrigger id="edit_tipo_acesso">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colaborador">Prestador</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    {isAdm && <SelectItem value="Adm">Administrador</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_equipe">Equipe</Label>
                <Select
                  value={formData.equipe_id}
                  onValueChange={(value) => setFormData({ ...formData, equipe_id: value })}
                >
                  <SelectTrigger id="edit_equipe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem equipe</SelectItem>
                    {equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_dia_pagamento">Dia de Pagamento</Label>
                <Select
                  value={formData.dia_pagamento}
                  onValueChange={(value) => setFormData({ ...formData, dia_pagamento: value })}
                >
                  <SelectTrigger id="edit_dia_pagamento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Dia 1</SelectItem>
                    <SelectItem value="15">Dia 15</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_salario">Valor Contratual Base (R$)</Label>
                <Input
                  id="edit_salario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salario}
                  onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                  required
                />
              </div>

              {/* Centro de Custo */}
              <div className="space-y-2">
                <Label htmlFor="edit_centro_custo">Centro de Custo</Label>
                <Select
                  value={formData.centro_custo_id}
                  onValueChange={(value) => setFormData({ ...formData, centro_custo_id: value })}
                >
                  <SelectTrigger id="edit_centro_custo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem centro de custo</SelectItem>
                    {centrosCusto.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.numero} - {cc.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PIX */}
              <div className="space-y-2">
                <Label htmlFor="edit_tipo_chave_pix">Tipo Chave PIX</Label>
                <Select
                  value={formData.tipo_chave_pix || "none"}
                  onValueChange={(value) => setFormData({ ...formData, tipo_chave_pix: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="edit_tipo_chave_pix">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem PIX</SelectItem>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo_chave_pix && (
                <div className="space-y-2">
                  <Label htmlFor="edit_chave_pix">Chave PIX</Label>
                  <Input
                    id="edit_chave_pix"
                    placeholder="Informe a chave PIX"
                    value={formData.chave_pix}
                    onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
