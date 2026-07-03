CREATE TYPE "public"."tipo_acesso" AS ENUM('Colaborador', 'Supervisor', 'Gerente', 'Financeiro', 'Adm');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"colaborador_id" uuid,
	"acao" text NOT NULL,
	"tabela" text,
	"registro_id" text,
	"detalhes" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "boletos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_boleto" text NOT NULL,
	"banco" text NOT NULL,
	"agencia" text NOT NULL,
	"conta" text NOT NULL,
	"digito_verificador" text,
	"centro_custo_id" uuid,
	"tipo_boleto" text DEFAULT 'cedente',
	"ativo" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"criado_por" uuid,
	CONSTRAINT "boletos_numero_boleto_unique" UNIQUE("numero_boleto")
);
--> statement-breakpoint
CREATE TABLE "centros_custo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" text NOT NULL,
	"nome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "centros_custo_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
CREATE TABLE "colaboradores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome_completo" text NOT NULL,
	"salario" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"cnpj" text,
	"data_nascimento" date,
	"email" text,
	"user_id" uuid,
	"tipo_acesso" "tipo_acesso" DEFAULT 'Colaborador',
	"senha_hash" text,
	"equipe_id" uuid,
	"historico_reajustes" jsonb DEFAULT '[]'::jsonb,
	"dia_pagamento" integer DEFAULT 1,
	"chave_pix" text,
	"centro_custo_id" uuid,
	"tipo_chave_pix" text,
	"data_aniversario_contrato" date,
	CONSTRAINT "colaboradores_email_unique" UNIQUE("email"),
	CONSTRAINT "colaboradores_dia_pagamento_check" CHECK ("colaboradores"."dia_pagamento" IN (1, 15))
);
--> statement-breakpoint
CREATE TABLE "equipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"supervisor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "equipes_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "faturas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"valor" numeric(15, 2),
	"data_vencimento" date NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"arquivo_pdf_url" text NOT NULL,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "faturas_status_check" CHECK ("faturas"."status" IN ('pendente', 'pago', 'vencido'))
);
--> statement-breakpoint
CREATE TABLE "faturas_colaboradores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fatura_id" uuid NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"visualizado" boolean DEFAULT false,
	"data_visualizacao" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gerentes_equipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gerente_id" uuid NOT NULL,
	"equipe_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "historico_reajustes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"salario_anterior" numeric(10, 2) NOT NULL,
	"salario_novo" numeric(10, 2) NOT NULL,
	"tipo_reajuste" varchar(20) NOT NULL,
	"valor_reajuste" numeric(10, 2) NOT NULL,
	"motivo" text,
	"aplicado_por" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "historico_reajustes_tipo_check" CHECK ("historico_reajustes"."tipo_reajuste" IN ('porcentagem', 'valor'))
);
--> statement-breakpoint
CREATE TABLE "notas_fiscais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid,
	"colaborador_id" uuid,
	"numero_nfse" text NOT NULL,
	"chave_acesso" text,
	"competencia_mes" integer NOT NULL,
	"competencia_ano" integer NOT NULL,
	"valor_servico" numeric(10, 2) NOT NULL,
	"cpf_cnpj_prestador" text NOT NULL,
	"arquivo_xml_url" text NOT NULL,
	"arquivo_pdf_url" text,
	"validacao_identidade" boolean DEFAULT false,
	"validacao_competencia" boolean DEFAULT false,
	"validacao_valor" boolean DEFAULT false,
	"validacao_duplicidade" boolean DEFAULT false,
	"mensagem_validacao" text,
	"status" text DEFAULT 'pendente',
	"aprovado_por" uuid,
	"data_aprovacao" timestamp,
	"observacao_financeiro" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notas_fiscais_pedido_id_unique" UNIQUE("pedido_id"),
	CONSTRAINT "notas_fiscais_competencia_mes_check" CHECK ("notas_fiscais"."competencia_mes" >= 1 AND "notas_fiscais"."competencia_mes" <= 12),
	CONSTRAINT "notas_fiscais_competencia_ano_check" CHECK ("notas_fiscais"."competencia_ano" >= 2020),
	CONSTRAINT "notas_fiscais_valor_servico_check" CHECK ("notas_fiscais"."valor_servico" > 0),
	CONSTRAINT "notas_fiscais_status_check" CHECK ("notas_fiscais"."status" IN ('pendente', 'aprovado', 'rejeitado'))
);
--> statement-breakpoint
CREATE TABLE "pedidos_pagamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"horas_extras" numeric(12, 2) DEFAULT '0',
	"valor_km" numeric(12, 2) DEFAULT '0',
	"valor_total" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'pendente_gerente',
	"aprovado_gerente" boolean DEFAULT false,
	"aprovado_financeiro" boolean DEFAULT false,
	"observacao_gerente" text,
	"observacao_financeiro" text,
	"data_aprovacao_gerente" timestamp,
	"data_aprovacao_financeiro" timestamp,
	"criado_por_colaborador_id" uuid,
	"motivo_horas_extras" text,
	"valor_desconto" numeric(10, 2) DEFAULT '0',
	"motivo_desconto" text,
	"nota_emitida" boolean DEFAULT false,
	"data_emissao_nota" timestamp with time zone,
	"nota_fiscal_url" text,
	"horas_extras_50" numeric(5, 2) DEFAULT '0',
	"horas_extras_100" numeric(5, 2) DEFAULT '0',
	"conducao" numeric(10, 2) DEFAULT '0',
	"data_previsao_pagamento" date,
	"tipo_pedido" text DEFAULT 'completo',
	"valor_plantao" numeric(10, 2) DEFAULT '0',
	"motivo_plantao" text,
	"nota_fiscal_anexada" boolean DEFAULT false,
	"data_limite_anexo_nota" timestamp,
	"salario_base" numeric(10, 2),
	"prorrogacao_solicitada" boolean DEFAULT false,
	"motivo_prorrogacao" text,
	"data_solicitacao_prorrogacao" timestamp with time zone,
	"prorrogacao_aprovada" boolean,
	"observacao_prorrogacao" text,
	"correcao_solicitada_por" text,
	"comissao" numeric DEFAULT '0',
	"motivo_comissao" text,
	"aprovado_por_gerente_id" uuid,
	"aprovado_por_financeiro_id" uuid,
	"data_nota_recebida" timestamp with time zone,
	CONSTRAINT "pedidos_pagamento_status_check" CHECK ("pedidos_pagamento"."status" IN ('pendente_gerente', 'pendente_financeiro', 'aprovado', 'recusado', 'correcao', 'pago', 'aguardando_prorrogacao', 'prorrogacao_negada')),
	CONSTRAINT "pedidos_pagamento_tipo_pedido_check" CHECK ("pedidos_pagamento"."tipo_pedido" IN ('completo', 'reembolso_km'))
);
--> statement-breakpoint
CREATE TABLE "system_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"suspended_reason" text,
	"suspended_at" timestamp with time zone,
	"suspended_by" uuid,
	"reactivated_at" timestamp with time zone,
	"reactivated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_terms_acceptance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"version" varchar(20) NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"accepted_at" timestamp with time zone,
	"ip_address" varchar(45),
	"device_info" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_centro_custo_id_centros_custo_id_fk" FOREIGN KEY ("centro_custo_id") REFERENCES "public"."centros_custo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_criado_por_colaboradores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_centro_custo_id_centros_custo_id_fk" FOREIGN KEY ("centro_custo_id") REFERENCES "public"."centros_custo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_supervisor_id_colaboradores_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."colaboradores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_criado_por_colaboradores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas_colaboradores" ADD CONSTRAINT "faturas_colaboradores_fatura_id_faturas_id_fk" FOREIGN KEY ("fatura_id") REFERENCES "public"."faturas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas_colaboradores" ADD CONSTRAINT "faturas_colaboradores_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gerentes_equipes" ADD CONSTRAINT "gerentes_equipes_gerente_id_colaboradores_id_fk" FOREIGN KEY ("gerente_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gerentes_equipes" ADD CONSTRAINT "gerentes_equipes_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_reajustes" ADD CONSTRAINT "historico_reajustes_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_reajustes" ADD CONSTRAINT "historico_reajustes_aplicado_por_colaboradores_id_fk" FOREIGN KEY ("aplicado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_pedido_id_pedidos_pagamento_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos_pagamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_aprovado_por_colaboradores_id_fk" FOREIGN KEY ("aprovado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" ADD CONSTRAINT "pedidos_pagamento_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" ADD CONSTRAINT "pedidos_pagamento_criado_por_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("criado_por_colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" ADD CONSTRAINT "pedidos_pagamento_aprovado_por_gerente_id_colaboradores_id_fk" FOREIGN KEY ("aprovado_por_gerente_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" ADD CONSTRAINT "pedidos_pagamento_aprovado_por_financeiro_id_colaboradores_id_fk" FOREIGN KEY ("aprovado_por_financeiro_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_status" ADD CONSTRAINT "system_status_suspended_by_colaboradores_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_status" ADD CONSTRAINT "system_status_reactivated_by_colaboradores_id_fk" FOREIGN KEY ("reactivated_by") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_terms_acceptance" ADD CONSTRAINT "user_terms_acceptance_user_id_colaboradores_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "faturas_colaboradores_fatura_colaborador_key" ON "faturas_colaboradores" USING btree ("fatura_id","colaborador_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gerentes_equipes_gerente_equipe_key" ON "gerentes_equipes" USING btree ("gerente_id","equipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notas_fiscais_colaborador_numero_key" ON "notas_fiscais" USING btree ("colaborador_id","numero_nfse");--> statement-breakpoint
CREATE UNIQUE INDEX "system_status_single_row" ON "system_status" USING btree ((true));--> statement-breakpoint
CREATE UNIQUE INDEX "user_terms_acceptance_user_version_key" ON "user_terms_acceptance" USING btree ("user_id","version");