ALTER TABLE "Settings" RENAME TO "settings";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_college_id_account_username_fkey";
--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "Settings_college_id_account_username_fkey";
--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "Settings_pkey";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "last_updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY("account_username","college_id");--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "notification_server" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "notification_server_api_key" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_college_id_account_username_fkey" FOREIGN KEY ("college_id","account_username") REFERENCES "public"."accounts"("college_id","username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_college_id_account_username_fkey" FOREIGN KEY ("college_id","account_username") REFERENCES "public"."accounts"("college_id","username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "notification_server_values_both_or_none" CHECK (("settings"."notification_server" IS NULL AND "settings"."notification_server_api_key" IS NULL) OR ("settings"."notification_server" IS NOT NULL AND "settings"."notification_server_api_key" IS NOT NULL));