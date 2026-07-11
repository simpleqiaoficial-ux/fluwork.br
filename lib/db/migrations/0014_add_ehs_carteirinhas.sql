CREATE TABLE "ehs_carteirinhas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"titulo" text,
	"object_path" text NOT NULL,
	"status" text DEFAULT 'ativa' NOT NULL,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ehs_carteirinhas_status_check" CHECK ("ehs_carteirinhas"."status" IN ('ativa','inativa'))
);
--> statement-breakpoint
ALTER TABLE "ehs_carteirinhas" ADD CONSTRAINT "ehs_carteirinhas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_carteirinhas" ADD CONSTRAINT "ehs_carteirinhas_cliente_id_ehs_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."ehs_clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_carteirinhas" ADD CONSTRAINT "ehs_carteirinhas_colaborador_id_colaboradores_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaboradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehs_carteirinhas" ADD CONSTRAINT "ehs_carteirinhas_criado_por_colaboradores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;