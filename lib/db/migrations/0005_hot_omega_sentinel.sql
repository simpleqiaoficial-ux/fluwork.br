CREATE INDEX "audit_log_empresa_id_idx" ON "audit_log" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");