"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { acceptTerms, declineTerms } from "@/app/actions/terms"
import { CURRENT_TERMS_VERSION } from "@/types/terms"
import { logout } from "@/app/actions/auth"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface TermsAcceptanceModalProps {
  isOpen: boolean
  onAccept?: () => void
  userName?: string
  userId?: string
}

export function TermsAcceptanceModal({ isOpen, onAccept, userName, userId }: TermsAcceptanceModalProps) {
  const router = useRouter()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [hasCheckedTerms, setHasCheckedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false)
      setHasCheckedTerms(false)
      setShowDeclineConfirm(false)
    }
  }, [isOpen])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50
    if (isAtBottom) {
      setHasScrolledToBottom(true)
    }
  }, [])

  const handleAccept = async () => {
    if (!hasCheckedTerms) {
      toast.error("Você precisa marcar que leu e concorda com os termos")
      return
    }

    if (!userId) {
      toast.error("Erro: usuário não identificado")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await acceptTerms(userId)
      if (result.success) {
        toast.success("Termos aceitos com sucesso!")
        onAccept?.()
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao aceitar termos")
      }
    } catch (error) {
      toast.error("Erro ao processar aceite dos termos")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setIsSubmitting(true)
    try {
      if (userId) {
        await declineTerms(userId)
      }
      toast.info("Você será desconectado pois não aceitou os termos de uso")
      await logout()
    } catch (error) {
      toast.error("Erro ao processar recusa")
      setIsSubmitting(false)
    }
  }

  if (showDeclineConfirm) {
    return (
      <Dialog open={isOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <DialogTitle>Recusar termos de uso</DialogTitle>
            </div>
            <DialogDescription className="text-center">
              Ao recusar os termos de uso, você será desconectado do sistema e não poderá acessar o FluWork até aceitar os termos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowDeclineConfirm(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Processando..." : "Confirmar Recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="flex flex-col w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] p-0 gap-0 overflow-hidden [&>button:last-child]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header fixo */}
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="text-center text-lg sm:text-xl">Termos de Uso do FluWork</DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm">
            {userName && <span className="font-medium">{userName}, </span>}
            Por favor, leia atentamente os termos antes de continuar.
            <br />
            <span className="text-xs text-muted-foreground">Versão {CURRENT_TERMS_VERSION}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Área de scroll — ocupa todo o espaço disponível */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-4 py-4 pr-2 text-sm">
            <section>
              <h3 className="mb-2 font-semibold">1. Aceitação dos Termos</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar o sistema FluWork, você concorda em cumprir e estar vinculado a estes
                Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar
                o sistema.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">2. Descrição do Serviço</h3>
              <p className="text-muted-foreground leading-relaxed">
                O FluWork é um sistema de gestão de pagamentos para colaboradores, permitindo o controle
                de pedidos, notas fiscais, aprovações e pagamentos. O sistema é disponibilizado pela empresa
                contratante para uso exclusivo de seus colaboradores autorizados.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">3. Cadastro e Credenciais</h3>
              <p className="text-muted-foreground leading-relaxed">
                Você é responsável por manter a confidencialidade de suas credenciais de acesso (email e senha).
                Qualquer atividade realizada com suas credenciais será de sua responsabilidade. Você deve
                notificar imediatamente a administração em caso de uso não autorizado de sua conta.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">4. Uso Adequado</h3>
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em utilizar o sistema apenas para fins legítimos relacionados às suas atividades
                profissionais. É expressamente proibido:
              </p>
              <ul className="mt-2 list-disc pl-6 text-muted-foreground space-y-1">
                <li>Fornecer informações falsas ou enganosas</li>
                <li>Tentar acessar áreas ou funcionalidades não autorizadas</li>
                <li>Realizar qualquer ação que possa comprometer a segurança do sistema</li>
                <li>Compartilhar suas credenciais de acesso com terceiros</li>
                <li>Utilizar o sistema para atividades ilegais ou não autorizadas</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">5. Privacidade e Dados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados pessoais serão tratados de acordo com a Lei Geral de Proteção de Dados (LGPD).
                Coletamos apenas os dados necessários para a operação do sistema, incluindo:
              </p>
              <ul className="mt-2 list-disc pl-6 text-muted-foreground space-y-1">
                <li>Dados de identificação (nome, email, CPF/CNPJ)</li>
                <li>Dados financeiros (informações bancárias para pagamento)</li>
                <li>Logs de acesso e atividades no sistema</li>
                <li>Informações de dispositivo e IP para fins de segurança</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">6. Propriedade Intelectual</h3>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo do sistema, incluindo mas não limitado a textos, gráficos, logos, ícones,
                imagens e software, é protegido por direitos autorais e outras leis de propriedade intelectual.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">7. Limitação de Responsabilidade</h3>
              <p className="text-muted-foreground leading-relaxed">
                O sistema é fornecido &quot;como está&quot;. Não garantimos que o serviço será ininterrupto ou
                livre de erros. Não nos responsabilizamos por danos indiretos, incidentais ou consequenciais
                decorrentes do uso do sistema.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">8. Modificações dos Termos</h3>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas
                serão comunicadas através do sistema. O uso continuado após as modificações constitui aceitação
                dos novos termos.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">9. Encerramento</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seu acesso ao sistema pode ser suspenso ou encerrado a qualquer momento, com ou sem aviso prévio,
                por violação destes termos ou por determinação da empresa contratante.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">10. Disposições Gerais</h3>
              <p className="text-muted-foreground leading-relaxed">
                Estes termos constituem o acordo integral entre você e o FluWork. A invalidade de qualquer
                disposição não afetará a validade das demais. O não exercício de qualquer direito não implica
                renúncia ao mesmo.
              </p>
            </section>

            <p className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
              Última atualização: Janeiro de 2025 | Versão {CURRENT_TERMS_VERSION}
            </p>
          </div>
        </div>

        {/* Footer fixo — checkbox + botões sempre visíveis */}
        <div className="shrink-0 border-t bg-background px-4 sm:px-6 pb-4 pt-3 space-y-3">
          {!hasScrolledToBottom && (
            <p className="text-center text-xs text-muted-foreground">
              Role até o final para habilitar a opção de aceite
            </p>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="accept-terms"
              checked={hasCheckedTerms}
              onCheckedChange={(checked) => setHasCheckedTerms(checked === true)}
              disabled={!hasScrolledToBottom}
              className="mt-0.5 shrink-0"
            />
            <Label
              htmlFor="accept-terms"
              className={`text-sm leading-relaxed cursor-pointer ${!hasScrolledToBottom ? 'text-muted-foreground' : ''}`}
            >
              Li e concordo com os Termos de Uso do FluWork. Entendo que meus dados serão processados conforme
              descrito acima e que devo utilizar o sistema de forma responsável.
            </Label>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeclineConfirm(true)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Recusar
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!hasCheckedTerms || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Processando..." : "Aceitar Termos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
