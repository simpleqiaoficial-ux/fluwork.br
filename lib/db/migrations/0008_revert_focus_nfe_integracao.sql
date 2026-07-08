ALTER TABLE "focus_nfe_eventos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "focus_nfe_eventos" CASCADE;--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP CONSTRAINT "notas_fiscais_focus_ref_unique";--> statement-breakpoint
ALTER TABLE "colaboradores" DROP CONSTRAINT "colaboradores_regime_tributario_check";--> statement-breakpoint
ALTER TABLE "colaboradores" DROP CONSTRAINT "colaboradores_focus_status_cadastro_check";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP CONSTRAINT "notas_fiscais_origem_check";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP CONSTRAINT "notas_fiscais_focus_status_check";--> statement-breakpoint
ALTER TABLE "colaboradores" DROP COLUMN "codigo_municipio_ibge";--> statement-breakpoint
ALTER TABLE "colaboradores" DROP COLUMN "inscricao_municipal";--> statement-breakpoint
ALTER TABLE "colaboradores" DROP COLUMN "regime_tributario";--> statement-breakpoint
ALTER TABLE "colaboradores" DROP COLUMN "focus_status_cadastro";--> statement-breakpoint
ALTER TABLE "colaboradores" DROP COLUMN "focus_cadastrado_em";--> statement-breakpoint
ALTER TABLE "colaboradores" DROP COLUMN "focus_motivo_erro_cadastro";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "endereco_cep";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "endereco_logradouro";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "endereco_numero";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "endereco_complemento";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "endereco_bairro";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "endereco_cidade";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "endereco_uf";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "codigo_municipio_ibge";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "codigo_servico_padrao";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "discriminacao_servico_padrao";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "aliquota_iss_padrao";--> statement-breakpoint
ALTER TABLE "empresas" DROP COLUMN "iss_retido_padrao";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP COLUMN "origem";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP COLUMN "focus_ref";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP COLUMN "focus_status";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP COLUMN "focus_motivo_erro";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP COLUMN "focus_numero_rps";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP COLUMN "focus_serie_rps";--> statement-breakpoint
ALTER TABLE "notas_fiscais" DROP COLUMN "focus_raw_response";