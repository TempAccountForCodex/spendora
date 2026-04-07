CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY DEFAULT (auth.user_id()) NOT NULL,
	"currency" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "profiles" ("user_id", "currency", "created_at", "updated_at")
SELECT "id", coalesce("currency", ''), "createdAt", "updatedAt"
FROM "user"
ON CONFLICT ("user_id") DO UPDATE
SET
	"currency" = excluded."currency",
	"updated_at" = now();
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "user_id" SET DEFAULT (auth.user_id());--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "user_id" SET DEFAULT (auth.user_id());--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "categories" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "transactions" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "profiles" TO "authenticated";--> statement-breakpoint
CREATE INDEX "profiles_currency_idx" ON "profiles" USING btree ("currency");--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "categories"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "categories" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "categories"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "categories" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "categories"."user_id")) WITH CHECK ((select auth.user_id() = "categories"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "categories" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "categories"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "transactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "transactions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "transactions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "transactions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "transactions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "transactions"."user_id")) WITH CHECK ((select auth.user_id() = "transactions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "transactions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "transactions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "profiles"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "profiles"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "profiles"."user_id")) WITH CHECK ((select auth.user_id() = "profiles"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "profiles"."user_id"));
