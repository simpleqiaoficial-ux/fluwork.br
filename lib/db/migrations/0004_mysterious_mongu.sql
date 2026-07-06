CREATE INDEX "colaboradores_empresa_id_idx" ON "colaboradores" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "contracts_empresa_id_idx" ON "contracts" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "faturas_empresa_id_idx" ON "faturas" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "notas_fiscais_empresa_id_idx" ON "notas_fiscais" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "pedidos_pagamento_empresa_id_idx" ON "pedidos_pagamento" USING btree ("empresa_id");