CREATE TABLE "empresa_modulos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"modulo" text NOT NULL,
	"motivo" text NOT NULL,
	"bloqueado_em" timestamp with time zone DEFAULT now(),
	"bloqueado_por" uuid,
	CONSTRAINT "empresa_modulos_modulo_check" CHECK ("empresa_modulos"."modulo" IN ('financeiro', 'contratos', 'ehs'))
);
--> statement-breakpoint
ALTER TABLE "empresa_modulos" ADD CONSTRAINT "empresa_modulos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empresa_modulos" ADD CONSTRAINT "empresa_modulos_bloqueado_por_colaboradores_id_fk" FOREIGN KEY ("bloqueado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "empresa_modulos_empresa_modulo_key" ON "empresa_modulos" USING btree ("empresa_id","modulo");