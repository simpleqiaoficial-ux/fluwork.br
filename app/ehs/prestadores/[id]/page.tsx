import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { seedTiposDocumentoEhs } from "@/lib/ehs/tipos-documento"
import { listarTimelineEhs } from "@/lib/ehs/timeline"
import { listarAuditoriaDocumentosPrestadorEhs } from "@/lib/ehs/auditoria"
import { buscarPrestadorEhsPorId } from "@/app/actions/ehs-prestadores"
import { listarDocumentosPrestadorEhs } from "@/app/actions/ehs-documentos"
import { PrestadorDetailTabs } from "@/components/ehs/prestador-detail-tabs"

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase()
}

interface PrestadorEhsDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PrestadorEhsDetailPage({ params }: PrestadorEhsDetailPageProps) {
  const { id } = await params
  await seedTiposDocumentoEhs()

  const prestador = await buscarPrestadorEhsPorId(id)
  if (!prestador) notFound()

  const [documentosPorTipo, timeline, auditoria] = await Promise.all([
    listarDocumentosPrestadorEhs(id),
    listarTimelineEhs(id),
    listarAuditoriaDocumentosPrestadorEhs(id),
  ])

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-6xl">
      <div className="mb-8 flex items-start gap-3">
        <Link href="/ehs/prestadores">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-12 w-12">
          <AvatarImage src={prestador.foto_url || undefined} alt={prestador.nome_completo} />
          <AvatarFallback>{iniciais(prestador.nome_completo)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{prestador.nome_completo}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{[prestador.cnpj, prestador.email].filter(Boolean).join(" · ") || "Sem CNPJ/e-mail cadastrados"}</p>
        </div>
      </div>

      <PrestadorDetailTabs colaboradorId={id} documentosPorTipo={documentosPorTipo} timeline={timeline} auditoria={auditoria} compliance={prestador.compliance} />
    </div>
  )
}
