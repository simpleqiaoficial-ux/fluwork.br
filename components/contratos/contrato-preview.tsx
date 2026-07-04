import type { DadosContrato } from "@/lib/contracts/montar-dados-contrato"

interface ContratoPreviewProps {
  dados: DadosContrato
}

export function ContratoPreview({ dados }: ContratoPreviewProps) {
  return (
    <div className="rounded-md border bg-card">
      <div className="border-b px-6 py-5 text-center">
        {dados.empresa.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dados.empresa.logoUrl} alt={dados.empresa.nomeFantasia || dados.empresa.razaoSocial} className="h-10 mx-auto mb-2 object-contain" />
        )}
        <p className="text-sm font-semibold tracking-tight">{dados.empresa.nomeFantasia || dados.empresa.razaoSocial}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {dados.empresa.razaoSocial} · CNPJ {dados.empresa.cnpj}
        </p>
        <h2 className="text-base font-semibold mt-4">Contrato de Prestação de Serviços</h2>
        <p className="text-xs text-muted-foreground mt-1">Nº {dados.numero} · Versão {dados.versaoAtual}</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Prestador: </span><span className="font-medium">{dados.prestador.nome}</span></p>
          <p><span className="text-muted-foreground">CPF/CNPJ: </span><span className="font-medium">{dados.prestador.cpfCnpj}</span></p>
          <p><span className="text-muted-foreground">E-mail: </span><span className="font-medium">{dados.prestador.email}</span></p>
          <p><span className="text-muted-foreground">Endereço: </span><span className="font-medium">{dados.prestador.endereco}</span></p>
          <p><span className="text-muted-foreground">Tipo de serviço: </span><span className="font-medium">{dados.tipoServico}</span></p>
          <p><span className="text-muted-foreground">Valor: </span><span className="font-medium">{dados.valorFormatado}</span></p>
          <p><span className="text-muted-foreground">Prazo: </span><span className="font-medium">{dados.prazo}</span></p>
          <p><span className="text-muted-foreground">Início: </span><span className="font-medium">{dados.dataInicioFormatada}</span></p>
        </div>

        <div className="border-t pt-4 space-y-3">
          {dados.clausulas.map((clausula, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">{clausula}</p>
          ))}
          {dados.clausulasAdicionais && (
            <p className="text-sm leading-relaxed text-foreground/90">
              <span className="font-medium">CLÁUSULA ADICIONAL: </span>
              {dados.clausulasAdicionais}
            </p>
          )}
        </div>

        {dados.assinatura && (
          <div className="border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Assinatura eletrônica
            </p>
            <div className="rounded-md bg-primary/5 px-4 py-3 text-sm space-y-1">
              <p>Assinado eletronicamente por <span className="font-medium">{dados.assinatura.nome}</span> ({dados.assinatura.cpfCnpj})</p>
              <p className="text-muted-foreground">E-mail: {dados.assinatura.email}</p>
              <p className="text-muted-foreground">Data/hora: {dados.assinatura.dataHoraFormatada} · IP: {dados.assinatura.ip}</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t px-6 py-3 text-center text-[11px] text-muted-foreground">
        {dados.empresa.rodapeContrato || (
          <>
            {dados.empresa.nomeFantasia || dados.empresa.razaoSocial}
            {dados.empresa.email && ` · ${dados.empresa.email}`} · Contrato nº {dados.numero}
          </>
        )}
      </div>
    </div>
  )
}
