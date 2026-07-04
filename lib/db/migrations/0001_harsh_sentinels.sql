CREATE TABLE "contract_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"versao" integer NOT NULL,
	"object_path" text NOT NULL,
	"hash_sha256" text NOT NULL,
	"tamanho_bytes" integer,
	"gerado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_attachments_tipo_check" CHECK ("contract_attachments"."tipo" IN ('rascunho','assinado','anexo'))
);
--> statement-breakpoint
CREATE TABLE "contract_signature_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"signer_id" uuid,
	"tipo_evento" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"token_hash" text,
	"contract_versao" integer,
	"pdf_hash" text,
	"email_snapshot" text,
	"detalhes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_signature_events_tipo_check" CHECK ("contract_signature_events"."tipo_evento" IN ('criado','enviado','reenviado','visualizado','aceite_marcado','assinado','recusado','expirado','cancelado'))
);
--> statement-breakpoint
CREATE TABLE "contract_signers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"colaborador_id" uuid,
	"papel" text DEFAULT 'prestador' NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"cpf_cnpj" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"token_hash" text NOT NULL,
	"token_expira_em" timestamp with time zone NOT NULL,
	"token_usado_em" timestamp with time zone,
	"primeira_visualizacao_em" timestamp with time zone,
	"ip_ultimo_acesso" text,
	"user_agent_ultimo_acesso" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "contract_signers_papel_check" CHECK ("contract_signers"."papel" IN ('prestador')),
	CONSTRAINT "contract_signers_status_check" CHECK ("contract_signers"."status" IN ('pendente','visualizado','assinado','recusado','expirado'))
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"corpo" text NOT NULL,
	"campos_variaveis" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "contract_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"numero" text NOT NULL,
	"prestador_colaborador_id" uuid,
	"prestador_nome" text NOT NULL,
	"prestador_cpf_cnpj" text NOT NULL,
	"prestador_email" text NOT NULL,
	"prestador_endereco" text,
	"tipo_servico" text NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"prazo" text NOT NULL,
	"data_inicio" date NOT NULL,
	"clausulas_adicionais" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"versao_atual" integer DEFAULT 1 NOT NULL,
	"pdf_draft_path" text,
	"pdf_signed_path" text,
	"pdf_hash" text,
	"enviado_em" timestamp with time zone,
	"expira_em" timestamp with time zone,
	"visualizado_em" timestamp with time zone,
	"assinado_em" timestamp with time zone,
	"recusado_em" timestamp with time zone,
	"motivo_recusa" text,
	"cancelado_em" timestamp with time zone,
	"cancelado_por" uuid,
	"criado_por" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "contracts_numero_unique" UNIQUE("numero"),
	CONSTRAINT "contracts_status_check" CHECK ("contracts"."status" IN ('draft','sent','viewed','signed','refused','expired','cancelled')),
	CONSTRAINT "contracts_valor_check" CHECK ("contracts"."valor" > 0)
);
--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" DROP CONSTRAINT "pedidos_pagamento_status_check";--> statement-breakpoint
ALTER TABLE "contract_attachments" ADD CONSTRAINT "contract_attachments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_attachments" ADD CONSTRAINT "contract_attachments_gerado_por_colaboradores_id_fk" FOREIGN KEY ("gerado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signature_events" ADD CONSTRAINT "contract_signature_events_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signature_events" ADD CONSTRAINT "contract_signature_events_signer_id_contract_signers_id_fk" FOREIGN KEY ("signer_id") REFERENCES "public"."contract_signers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signers" ADD CONSTRAINT "contract_signers_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signers" ADD CONSTRAINT "contract_signers_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_template_id_contract_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_prestador_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("prestador_colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_cancelado_por_colaboradores_id_fk" FOREIGN KEY ("cancelado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_criado_por_colaboradores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contract_signers_token_hash_key" ON "contract_signers" USING btree ("token_hash");--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" ADD CONSTRAINT "pedidos_pagamento_status_check" CHECK ("pedidos_pagamento"."status" IN ('pendente_gerente', 'pendente_financeiro', 'aprovado', 'recusado', 'correcao', 'pago', 'aguardando_prorrogacao', 'prorrogacao_negada', 'nota_recebida'));