CREATE TABLE "focus_nfe_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nota_fiscal_id" uuid,
	"colaborador_id" uuid,
	"tipo_evento" text NOT NULL,
	"status_http" integer,
	"payload" jsonb,
	"mensagem" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "focus_nfe_eventos_tipo_evento_check" CHECK ("focus_nfe_eventos"."tipo_evento" IN ('cadastro_empresa_focus', 'emissao_solicitada', 'consulta_status', 'webhook_recebido', 'erro'))
);
--> statement-breakpoint
ALTER TABLE "notas_fiscais" ALTER COLUMN "numero_nfse" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ALTER COLUMN "arquivo_xml_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD COLUMN "codigo_municipio_ibge" text;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD COLUMN "inscricao_municipal" text;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD COLUMN "regime_tributario" text;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD COLUMN "focus_status_cadastro" text DEFAULT 'nao_cadastrado';--> statement-breakpoint
ALTER TABLE "colaboradores" ADD COLUMN "focus_cadastrado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD COLUMN "focus_motivo_erro_cadastro" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "endereco_cep" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "endereco_logradouro" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "endereco_numero" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "endereco_complemento" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "endereco_bairro" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "endereco_cidade" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "endereco_uf" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "codigo_municipio_ibge" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "codigo_servico_padrao" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "discriminacao_servico_padrao" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "aliquota_iss_padrao" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "iss_retido_padrao" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "link_emissao_manual" text;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD COLUMN "origem" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD COLUMN "focus_ref" text;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD COLUMN "focus_status" text;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD COLUMN "focus_motivo_erro" text;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD COLUMN "focus_numero_rps" text;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD COLUMN "focus_serie_rps" text;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD COLUMN "focus_raw_response" jsonb;--> statement-breakpoint
ALTER TABLE "focus_nfe_eventos" ADD CONSTRAINT "focus_nfe_eventos_nota_fiscal_id_notas_fiscais_id_fk" FOREIGN KEY ("nota_fiscal_id") REFERENCES "public"."notas_fiscais"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_nfe_eventos" ADD CONSTRAINT "focus_nfe_eventos_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "focus_nfe_eventos_nota_fiscal_id_idx" ON "focus_nfe_eventos" USING btree ("nota_fiscal_id");--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_focus_ref_unique" UNIQUE("focus_ref");--> statement-breakpoint
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_regime_tributario_check" CHECK ("colaboradores"."regime_tributario" IS NULL OR "colaboradores"."regime_tributario" IN ('simples_nacional', 'simples_nacional_excesso', 'regime_normal'));--> statement-breakpoint
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_focus_status_cadastro_check" CHECK ("colaboradores"."focus_status_cadastro" IN ('nao_cadastrado', 'cadastrado', 'erro'));--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_origem_check" CHECK ("notas_fiscais"."origem" IN ('manual', 'focus_nfe'));--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_focus_status_check" CHECK ("notas_fiscais"."focus_status" IS NULL OR "notas_fiscais"."focus_status" IN ('processando_autorizacao', 'autorizado', 'erro_autorizacao', 'cancelado'));