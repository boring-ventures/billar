-- AddForeignKey
ALTER TABLE "public"."pos_orders" ADD CONSTRAINT "pos_orders_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
