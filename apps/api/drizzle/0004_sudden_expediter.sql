CREATE TABLE "shifts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shifts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"venue_id" integer NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_by" integer NOT NULL,
	"starting_cash" integer NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" integer,
	"counted_cash" integer,
	CONSTRAINT "shifts_starting_cash_not_negative" CHECK ("shifts"."starting_cash" >= 0),
	CONSTRAINT "shifts_closed_after_opened" CHECK ("shifts"."closed_at" IS NULL OR "shifts"."closed_at" > "shifts"."opened_at"),
	CONSTRAINT "shifts_counted_cash_not_negative" CHECK ("shifts"."counted_cash" IS NULL OR "shifts"."counted_cash" >= 0),
	CONSTRAINT "shifts_close_complete" CHECK (("shifts"."closed_at" IS NULL) = ("shifts"."closed_by" IS NULL) AND ("shifts"."closed_at" IS NULL) = ("shifts"."counted_cash" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "shift_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_one_open_per_venue" ON "shifts" USING btree ("venue_id") WHERE "shifts"."closed_at" IS NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;