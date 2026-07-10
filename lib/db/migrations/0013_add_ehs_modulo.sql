ALTER TYPE "public"."tipo_acesso" ADD VALUE 'EHS';--> statement-breakpoint
CREATE TABLE "ehs_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"tabela" text NOT NULL,
	"registro_id" uuid NOT NULL,
	"campo" text,
	"valor_antigo" text,
	"valor_novo" text,
	"acao" text NOT NULL,
	"ator_id" uuid,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ehs_auditoria_acao_check" CHECK ("ehs_auditoria"."acao" IN ('criado','atualizado','excluido'))
);
--> statement-breakpoint
CREATE TABLE "ehs_cliente_responsaveis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cargo" text,
	"telefone" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ehs_clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"razao_social" text,
	"cnpj" text,
	"endereco_cep" text,
	"endereco_logradouro" text,
	"endereco_numero" text,
	"endereco_complemento" text,
	"endereco_bairro" text,
	"endereco_cidade" text,
	"endereco_uf" text,
	"observacoes" text,
	"status" text DEFAULT 'ativo' NOT NULL,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ehs_clientes_status_check" CHECK ("ehs_clientes"."status" IN ('ativo','inativo'))
);
--> statement-breakpoint
CREATE TABLE "ehs_documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"tipo_documento_id" uuid NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"object_path" text NOT NULL,
	"hash_sha256" text,
	"tamanho_bytes" integer,
	"data_emissao" date,
	"data_validade" date,
	"status" text DEFAULT 'valido' NOT NULL,
	"observacoes" text,
	"responsavel_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ehs_documentos_status_check" CHECK ("ehs_documentos"."status" IN ('valido','vencido','substituido','rejeitado'))
);
--> statement-breakpoint
CREATE TABLE "ehs_integracoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"status" text DEFAULT 'agendado' NOT NULL,
	"data_agendada" date,
	"horario" text,
	"endereco_local" text,
	"cidade" text,
	"sala" text,
	"local" text,
	"responsavel_id" uuid,
	"telefone" text,
	"observacoes" text,
	"tempo_estimado_minutos" integer,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"data_realizada" date,
	"data_validade" date,
	"object_path" text,
	"confirmado_em" timestamp with time zone,
	"lembrete_7d_enviado_em" timestamp with time zone,
	"lembrete_1d_enviado_em" timestamp with time zone,
	"lembrete_2h_enviado_em" timestamp with time zone,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ehs_integracoes_status_check" CHECK ("ehs_integracoes"."status" IN ('agendado','confirmado','compareceu','nao_compareceu','reagendado','cancelado','concluido','vencido'))
);
--> statement-breakpoint
CREATE TABLE "ehs_papel_permissoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"papel" text NOT NULL,
	"permissao_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ehs_permissoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurso" text NOT NULL,
	"acao" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ehs_timeline_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"tipo_evento" text NOT NULL,
	"descricao" text NOT NULL,
	"ator_id" uuid,
	"detalhes" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ehs_tipos_documento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"categoria" text DEFAULT 'documento' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ehs_tipos_documento_nome_unique" UNIQUE("nome"),
	CONSTRAINT "ehs_tipos_documento_categoria_check" CHECK ("ehs_tipos_documento"."categoria" IN ('aso','nr','certificado','curso','treinamento','exame','epi','documento'))
);
--> statement-breakpoint
ALTER TABLE "ehs_auditoria" ADD CONSTRAINT "ehs_auditoria_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_auditoria" ADD CONSTRAINT "ehs_auditoria_ator_id_colaboradores_id_fk" FOREIGN KEY ("ator_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_cliente_responsaveis" ADD CONSTRAINT "ehs_cliente_responsaveis_cliente_id_ehs_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."ehs_clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_clientes" ADD CONSTRAINT "ehs_clientes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_clientes" ADD CONSTRAINT "ehs_clientes_criado_por_colaboradores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_documentos" ADD CONSTRAINT "ehs_documentos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_documentos" ADD CONSTRAINT "ehs_documentos_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_documentos" ADD CONSTRAINT "ehs_documentos_tipo_documento_id_ehs_tipos_documento_id_fk" FOREIGN KEY ("tipo_documento_id") REFERENCES "public"."ehs_tipos_documento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_documentos" ADD CONSTRAINT "ehs_documentos_responsavel_id_colaboradores_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_integracoes" ADD CONSTRAINT "ehs_integracoes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_integracoes" ADD CONSTRAINT "ehs_integracoes_cliente_id_ehs_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."ehs_clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_integracoes" ADD CONSTRAINT "ehs_integracoes_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_integracoes" ADD CONSTRAINT "ehs_integracoes_responsavel_id_colaboradores_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_integracoes" ADD CONSTRAINT "ehs_integracoes_criado_por_colaboradores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_papel_permissoes" ADD CONSTRAINT "ehs_papel_permissoes_permissao_id_ehs_permissoes_id_fk" FOREIGN KEY ("permissao_id") REFERENCES "public"."ehs_permissoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_timeline_eventos" ADD CONSTRAINT "ehs_timeline_eventos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_timeline_eventos" ADD CONSTRAINT "ehs_timeline_eventos_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_timeline_eventos" ADD CONSTRAINT "ehs_timeline_eventos_ator_id_colaboradores_id_fk" FOREIGN KEY ("ator_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ehs_papel_permissoes_papel_permissao_idx" ON "ehs_papel_permissoes" USING btree ("papel","permissao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ehs_permissoes_recurso_acao_idx" ON "ehs_permissoes" USING btree ("recurso","acao");