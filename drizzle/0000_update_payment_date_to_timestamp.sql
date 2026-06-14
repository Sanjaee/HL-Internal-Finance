CREATE TYPE "public"."bonus_ledger_type" AS ENUM('EARNED', 'CONSUMED');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('LM', 'BR');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PIUTANG', 'LUNAS');--> statement-breakpoint
CREATE TABLE "bonus_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"bonus_count" integer NOT NULL,
	"threshold_amount" numeric(18, 2) NOT NULL,
	"consumed_amount" numeric(18, 2) NOT NULL,
	"remaining_amount" numeric(18, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_bonus_ledgers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"transaction_id" uuid,
	"ledger_type" "bonus_ledger_type" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"notes" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_discount_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discount_group_id" uuid NOT NULL,
	"sequence_no" integer NOT NULL,
	"discount_percent" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_discount_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"product_type" "product_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_code" varchar(30),
	"name" varchar(200) NOT NULL,
	"bonus_threshold" numeric(18, 2) NOT NULL,
	"accumulated_bonus_omzet" numeric(18, 2) DEFAULT '0',
	"granted_bonus_count" integer DEFAULT 0,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "customers_customer_code_unique" UNIQUE("customer_code")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_code" varchar(30),
	"name" varchar(200) NOT NULL,
	"product_type" "product_type" NOT NULL,
	"cost_price" numeric(18, 2) NOT NULL,
	"base_price" numeric(18, 2) NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "products_product_code_unique" UNIQUE("product_code")
);
--> statement-breakpoint
CREATE TABLE "transaction_item_discount_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_item_id" uuid NOT NULL,
	"sequence_no" integer NOT NULL,
	"discount_percent" numeric(5, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name_snapshot" varchar(200),
	"product_type" "product_type",
	"quantity" integer NOT NULL,
	"base_price" numeric(18, 2),
	"cost_price" numeric(18, 2),
	"discount_percentage_effective" numeric(8, 4),
	"discounted_unit_price" numeric(18, 2),
	"line_omzet" numeric(18, 2),
	"line_profit" numeric(18, 2),
	"is_bonus_item" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bon_number" varchar(100) NOT NULL,
	"customer_id" uuid NOT NULL,
	"transaction_date" date NOT NULL,
	"payment_date" timestamp,
	"description" text,
	"shipping_cost" numeric(18, 2) DEFAULT '0',
	"is_bonus_transaction" boolean DEFAULT false,
	"status" "transaction_status" DEFAULT 'PIUTANG',
	"subtotal_omzet" numeric(18, 2) DEFAULT '0',
	"total_amount" numeric(18, 2) DEFAULT '0',
	"total_profit" numeric(18, 2) DEFAULT '0',
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "transactions_bon_number_unique" UNIQUE("bon_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "bonus_redemptions" ADD CONSTRAINT "bonus_redemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_redemptions" ADD CONSTRAINT "bonus_redemptions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_bonus_ledgers" ADD CONSTRAINT "customer_bonus_ledgers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_bonus_ledgers" ADD CONSTRAINT "customer_bonus_ledgers_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_discount_details" ADD CONSTRAINT "customer_discount_details_discount_group_id_customer_discount_groups_id_fk" FOREIGN KEY ("discount_group_id") REFERENCES "public"."customer_discount_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_discount_groups" ADD CONSTRAINT "customer_discount_groups_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_item_discount_snapshots" ADD CONSTRAINT "transaction_item_discount_snapshots_transaction_item_id_transaction_items_id_fk" FOREIGN KEY ("transaction_item_id") REFERENCES "public"."transaction_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bonus_redemptions_customer_id_idx" ON "bonus_redemptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "bonus_redemptions_transaction_id_idx" ON "bonus_redemptions" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "customer_bonus_ledgers_customer_id_idx" ON "customer_bonus_ledgers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_bonus_ledgers_transaction_id_idx" ON "customer_bonus_ledgers" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "customer_discount_details_group_id_idx" ON "customer_discount_details" USING btree ("discount_group_id");--> statement-breakpoint
CREATE INDEX "customer_discount_groups_customer_id_idx" ON "customer_discount_groups" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_code_idx" ON "customers" USING btree ("customer_code");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_code_idx" ON "products" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX "products_type_idx" ON "products" USING btree ("product_type");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ti_discount_snapshots_item_id_idx" ON "transaction_item_discount_snapshots" USING btree ("transaction_item_id");--> statement-breakpoint
CREATE INDEX "transaction_items_transaction_id_idx" ON "transaction_items" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_items_product_id_idx" ON "transaction_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_bon_number_idx" ON "transactions" USING btree ("bon_number");--> statement-breakpoint
CREATE INDEX "transactions_customer_id_idx" ON "transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");