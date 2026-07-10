ALTER TABLE "colaboradores" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "colaboradores" ADD COLUMN "reset_token_expira_em" timestamp with time zone;