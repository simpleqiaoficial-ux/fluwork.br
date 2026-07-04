ALTER TYPE "public"."tipo_acesso" ADD VALUE 'SuperAdmin';--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"razao_social" text NOT NULL,
	"nome_fantasia" text,
	"cnpj" text NOT NULL,
	"email" text,
	"telefone" text,
	"endereco" text,
	"logo_url" text,
	"papel_timbrado_url" text,
	"rodape_contrato" text,
	"representante_nome" text,
	"representante_documento" text,
	"representante_cargo" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "empresas_cnpj_unique" UNIQUE("cnpj"),
	CONSTRAINT "empresas_status_check" CHECK ("empresas"."status" IN ('active', 'inactive', 'blocked'))
);
--> statement-breakpoint
ALTER TABLE "boletos" DROP CONSTRAINT "boletos_numero_boleto_unique";--> statement-breakpoint
ALTER TABLE "centros_custo" DROP CONSTRAINT "centros_custo_numero_unique";--> statement-breakpoint
ALTER TABLE "contract_templates" DROP CONSTRAINT "contract_templates_slug_unique";--> statement-breakpoint
ALTER TABLE "equipes" DROP CONSTRAINT "equipes_nome_unique";--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "boletos" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "centros_custo" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "contract_templates" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "equipes" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "gerentes_equipes" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "historico_reajustes" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint
ALTER TABLE "user_terms_acceptance" ADD COLUMN "empresa_id" uuid;--> statement-breakpoint

-- Empresa padrão (backfill): os dados legais atuais do FluWork viram a "empresa cliente
-- placeholder" à qual todo dado já existente fica vinculado — editável depois pelo
-- EMPRESA_ADMIN real dessa empresa (ver plano da migração multi-tenant).
INSERT INTO "empresas" ("id", "razao_social", "nome_fantasia", "cnpj", "email", "telefone", "endereco", "status")
VALUES (
	'a0123b80-6288-4eaf-9398-2df7b905864f',
	'FELIPE NOGUEIRA SILVA SERVICOS COMERCIO E LOCACAO',
	'KAFERRI TEC SERVICOS',
	'26.344.386/0001-42',
	'simpleqia.oficial@gmail.com',
	'(11) 91486-0806',
	'Osasco/SP',
	'active'
);
--> statement-breakpoint

UPDATE "audit_log" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "boletos" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "centros_custo" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "colaboradores" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL AND "tipo_acesso" != 'SuperAdmin';--> statement-breakpoint
UPDATE "contract_templates" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "contracts" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "equipes" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "faturas" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "gerentes_equipes" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "historico_reajustes" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "notas_fiscais" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "pedidos_pagamento" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint
UPDATE "user_terms_acceptance" SET "empresa_id" = 'a0123b80-6288-4eaf-9398-2df7b905864f' WHERE "empresa_id" IS NULL;--> statement-breakpoint

-- Torna obrigatório agora que todo mundo está preenchido (exceto colaboradores — nullable pra
-- permitir SuperAdmin; contract_templates — nullable pra permitir modelo global; audit_log —
-- nullable pra permitir evento de nível plataforma no futuro).
ALTER TABLE "boletos" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "centros_custo" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "equipes" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "faturas" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "gerentes_equipes" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "historico_reajustes" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_terms_acceptance" ALTER COLUMN "empresa_id" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centros_custo" ADD CONSTRAINT "centros_custo_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gerentes_equipes" ADD CONSTRAINT "gerentes_equipes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_reajustes" ADD CONSTRAINT "historico_reajustes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_pagamento" ADD CONSTRAINT "pedidos_pagamento_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_terms_acceptance" ADD CONSTRAINT "user_terms_acceptance_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "boletos_empresa_numero_key" ON "boletos" USING btree ("empresa_id","numero_boleto");--> statement-breakpoint
CREATE UNIQUE INDEX "centros_custo_empresa_numero_key" ON "centros_custo" USING btree ("empresa_id","numero");--> statement-breakpoint
CREATE UNIQUE INDEX "contract_templates_empresa_slug_key" ON "contract_templates" USING btree ("empresa_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "equipes_empresa_nome_key" ON "equipes" USING btree ("empresa_id","nome");--> statement-breakpoint
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_empresa_id_check" CHECK (("colaboradores"."tipo_acesso" = 'SuperAdmin') = ("colaboradores"."empresa_id" IS NULL));
