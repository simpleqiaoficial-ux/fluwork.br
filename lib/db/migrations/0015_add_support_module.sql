CREATE TABLE "support_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"message_id" uuid,
	"enviado_por_id" uuid,
	"object_path" text NOT NULL,
	"nome_original" text NOT NULL,
	"nome_sanitizado" text NOT NULL,
	"content_type" text NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"excluido_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"acao" text NOT NULL,
	"ator_id" uuid,
	"campo" text,
	"valor_antigo" text,
	"valor_novo" text,
	"ip_hash" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_audit_log_acao_check" CHECK ("support_audit_log"."acao" IN ('TICKET_CREATED','TICKET_VIEWED','TICKET_ASSIGNED','STATUS_CHANGED','PRIORITY_CHANGED','MESSAGE_SENT','INTERNAL_NOTE_CREATED','ATTACHMENT_UPLOADED','TICKET_ESCALATED','TICKET_RETURNED','TICKET_RESOLVED','TICKET_CLOSED','TICKET_REOPENED','TICKET_ARCHIVED','DATA_ANONYMIZED','DATA_REMOVED'))
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"autor_id" uuid,
	"tipo" text DEFAULT 'mensagem' NOT NULL,
	"corpo" text NOT NULL,
	"anonimizado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_messages_tipo_check" CHECK ("support_messages"."tipo" IN ('mensagem','nota_interna','evento_sistema'))
);
--> statement-breakpoint
CREATE TABLE "support_retention_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid,
	"dias_para_arquivar" integer,
	"dias_para_excluir_anexos" integer,
	"dias_para_anonimizar_mensagens" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_sequencial" integer GENERATED ALWAYS AS IDENTITY (sequence name "support_tickets_numero_sequencial_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"empresa_id" uuid,
	"criado_por_id" uuid NOT NULL,
	"assumido_por_id" uuid,
	"titulo" text NOT NULL,
	"categoria" text NOT NULL,
	"subcategoria" text,
	"descricao" text NOT NULL,
	"nivel_suporte" text NOT NULL,
	"equipe_responsavel" text NOT NULL,
	"status" text DEFAULT 'novo' NOT NULL,
	"prioridade" text DEFAULT 'media' NOT NULL,
	"related_entity_type" text DEFAULT 'NONE' NOT NULL,
	"related_entity_id" uuid,
	"origem" text DEFAULT 'manual' NOT NULL,
	"contexto_erro" jsonb,
	"first_response_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"reopened_count" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"satisfaction_score" integer,
	"escalation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_categoria_check" CHECK ("support_tickets"."categoria" IN ('pedido_aprovacao','pagamento','nota_fiscal','contrato','cadastro_acesso','duvida_processo','erro_sistema','lentidao_indisponibilidade','seguranca_acesso_indevido','outro_assunto')),
	CONSTRAINT "support_tickets_nivel_suporte_check" CHECK ("support_tickets"."nivel_suporte" IN ('nivel_1','nivel_2')),
	CONSTRAINT "support_tickets_equipe_responsavel_check" CHECK ("support_tickets"."equipe_responsavel" IN ('empresa','fluwork')),
	CONSTRAINT "support_tickets_status_check" CHECK ("support_tickets"."status" IN ('novo','em_triagem','em_atendimento','aguardando_usuario','aguardando_empresa','aguardando_fluwork','resolvido','fechado','reaberto','arquivado')),
	CONSTRAINT "support_tickets_prioridade_check" CHECK ("support_tickets"."prioridade" IN ('baixa','media','alta','critica')),
	CONSTRAINT "support_tickets_related_entity_type_check" CHECK ("support_tickets"."related_entity_type" IN ('PEDIDO','NOTA_FISCAL','CONTRATO','COLABORADOR','NONE')),
	CONSTRAINT "support_tickets_origem_check" CHECK ("support_tickets"."origem" IN ('manual','erro_automatico'))
);
--> statement-breakpoint
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_message_id_support_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."support_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_enviado_por_id_colaboradores_id_fk" FOREIGN KEY ("enviado_por_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_audit_log" ADD CONSTRAINT "support_audit_log_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_audit_log" ADD CONSTRAINT "support_audit_log_ator_id_colaboradores_id_fk" FOREIGN KEY ("ator_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_autor_id_colaboradores_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_retention_config" ADD CONSTRAINT "support_retention_config_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_criado_por_id_colaboradores_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assumido_por_id_colaboradores_id_fk" FOREIGN KEY ("assumido_por_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_attachments_ticket_idx" ON "support_attachments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_audit_log_ticket_created_idx" ON "support_audit_log" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "support_messages_ticket_created_idx" ON "support_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "support_retention_config_empresa_id_key" ON "support_retention_config" USING btree ("empresa_id");--> statement-breakpoint
CREATE UNIQUE INDEX "support_tickets_numero_sequencial_key" ON "support_tickets" USING btree ("numero_sequencial");--> statement-breakpoint
CREATE INDEX "support_tickets_empresa_status_idx" ON "support_tickets" USING btree ("empresa_id","status");--> statement-breakpoint
CREATE INDEX "support_tickets_nivel_status_idx" ON "support_tickets" USING btree ("nivel_suporte","status");--> statement-breakpoint
CREATE INDEX "support_tickets_criado_por_status_idx" ON "support_tickets" USING btree ("criado_por_id","status");--> statement-breakpoint
CREATE INDEX "support_tickets_assumido_por_idx" ON "support_tickets" USING btree ("assumido_por_id");--> statement-breakpoint
CREATE INDEX "support_tickets_related_entity_idx" ON "support_tickets" USING btree ("related_entity_type","related_entity_id");