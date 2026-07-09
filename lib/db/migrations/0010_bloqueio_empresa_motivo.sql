ALTER TABLE "empresas" ADD COLUMN "bloqueado_motivo" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "bloqueado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "bloqueado_por" uuid;--> statement-breakpoint
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_bloqueado_por_colaboradores_id_fk" FOREIGN KEY ("bloqueado_por") REFERENCES "public"."colaboradores"("id") ON DELETE no action ON UPDATE no action;