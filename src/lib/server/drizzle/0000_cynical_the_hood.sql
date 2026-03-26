-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."DeviceType" AS ENUM('LAPTOP', 'MOBILE', 'UNKNOWN');--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"base_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"device_type" "DeviceType" NOT NULL,
	"device_info" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"account_username" text NOT NULL,
	"college_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Settings" (
	"account_username" text NOT NULL,
	"college_id" integer NOT NULL,
	"attendance_percent_min" integer DEFAULT 75 NOT NULL,
	"attendance_percent_max" integer DEFAULT 90 NOT NULL,
	"expand_attendance_subjects" text DEFAULT 'critical' NOT NULL,
	"invalid_attendance_marker" text DEFAULT 'double-hyphen' NOT NULL,
	"show_attendance_bar_by_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "Settings_pkey" PRIMARY KEY("account_username","college_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"college_id" integer NOT NULL,
	"username" text NOT NULL,
	"batch_id" integer NOT NULL,
	"course_name" text NOT NULL,
	"image_url" text NOT NULL,
	"last_updated_at" timestamp(3) NOT NULL,
	"profile_name" text NOT NULL,
	"reg_no" text NOT NULL,
	"roll_no" text NOT NULL,
	"semester_id" integer NOT NULL,
	"semester_name" text NOT NULL,
	"student_id" integer NOT NULL,
	CONSTRAINT "accounts_pkey" PRIMARY KEY("college_id","username")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_college_id_account_username_fkey" FOREIGN KEY ("account_username","college_id") REFERENCES "public"."accounts"("college_id","username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_college_id_account_username_fkey" FOREIGN KEY ("account_username","college_id") REFERENCES "public"."accounts"("college_id","username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE cascade;
*/