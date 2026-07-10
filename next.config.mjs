/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Default do Next.js é 1MB por Server Action — abaixo do limite de qualquer um dos nossos
    // uploads reais (foto de perfil até 5MB, nota fiscal/contrato até 10MB). Sem isso, qualquer
    // arquivo acima de 1MB falha no transporte antes mesmo de chegar na validação da action.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
}

export default nextConfig
