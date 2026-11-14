CREATE TYPE "public"."station_type" AS ENUM('bar', 'kitchen');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'normal');--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"venue_id" integer NOT NULL,
	"name" text NOT NULL,
	"pin" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_venue_pin_unique" UNIQUE("venue_id","pin")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"venue_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"station" "station_type" NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_price_positive" CHECK ("items"."price" > 0)
);
--> statement-breakpoint
CREATE TABLE "tabs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tabs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"venue_id" integer NOT NULL,
	"opened_by" integer NOT NULL,
	"name" text NOT NULL,
	"people" integer NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "tabs_people_min_one" CHECK ("tabs"."people" >= 1),
	CONSTRAINT "tabs_closed_after_opened" CHECK ("tabs"."closed_at" > "tabs"."opened_at")
);
--> statement-breakpoint
CREATE TABLE "tab_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tab_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tab_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"person" integer,
	"price" integer NOT NULL,
	"sent_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"voided_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	CONSTRAINT "tab_items_price_positive" CHECK ("tab_items"."price" > 0),
	CONSTRAINT "tab_items_void_complete" CHECK (("tab_items"."voided_at" IS NULL) = ("tab_items"."voided_by" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabs" ADD CONSTRAINT "tabs_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabs" ADD CONSTRAINT "tabs_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_items" ADD CONSTRAINT "tab_items_tab_id_tabs_id_fk" FOREIGN KEY ("tab_id") REFERENCES "public"."tabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_items" ADD CONSTRAINT "tab_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_items" ADD CONSTRAINT "tab_items_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tab_items" ADD CONSTRAINT "tab_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;