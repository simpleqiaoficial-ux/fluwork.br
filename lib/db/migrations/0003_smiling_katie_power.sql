CREATE TABLE "contract_amendments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"versao" integer NOT NULL,
	"descricao" text,
	"campos_alterados" jsonb DEFAULT '{}'::jsonb,
	"novo_valor" numeric(12, 2),
	"nova_data_termino" date,
	"novas_clausulas" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"enviado_em" timestamp with time zone,
	"visualizado_em" timestamp with time zone,
	"assinado_em" timestamp with time zone,
	"recusado_em" timestamp with time zone,
	"motivo_recusa" text,
	"cancelado_em" timestamp with time zone,
	"pdf_path" text,
	"criado_por" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "contract_amendments_tipo_check" CHECK ("contract_amendments"."tipo" IN ('aditivo_salarial','aditivo_clausulas','renovacao','outro')),
	CONSTRAINT "contract_amendments_status_check" CHECK ("contract_amendments"."status" IN ('draft','sent','viewed','signed','refused','expired','cancelled'))
);
--> statement-breakpoint
ALTER TABLE "contract_signature_events" DROP CONSTRAINT "contract_signature_events_tipo_check";--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_status_check";--> statement-breakpoint
ALTER TABLE "contract_signature_events" ADD COLUMN "amendment_id" uuid;--> statement-breakpoint
ALTER TABLE "contract_signature_events" ADD COLUMN "ator_colaborador_id" uuid;--> statement-breakpoint
ALTER TABLE "contract_signers" ADD COLUMN "amendment_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "equipe_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "data_termino" date;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "renovacao_automatica" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "tipo_renovacao" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "periodo_renovacao_meses" integer;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "data_ultima_renovacao" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_criado_por_colaboradores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signature_events" ADD CONSTRAINT "contract_signature_events_amendment_id_contract_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "public"."contract_amendments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signature_events" ADD CONSTRAINT "contract_signature_events_ator_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("ator_colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signers" ADD CONSTRAINT "contract_signers_amendment_id_contract_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "public"."contract_amendments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signature_events" ADD CONSTRAINT "contract_signature_events_tipo_check" CHECK ("contract_signature_events"."tipo_evento" IN ('criado','enviado','reenviado','visualizado','aceite_marcado','assinado','recusado','expirado','cancelado','vigencia_iniciada','aditivo_criado','aditivo_enviado','aditivo_assinado','aditivo_recusado','renovado','encerrado','arquivado','senha_definida'));--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tipo_renovacao_check" CHECK ("contracts"."tipo_renovacao" IS NULL OR "contracts"."tipo_renovacao" IN ('automatica','mediante_aviso','sem_renovacao'));--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_status_check" CHECK ("contracts"."status" IN ('draft','sent','viewed','signed','refused','expired','cancelled','archived'));