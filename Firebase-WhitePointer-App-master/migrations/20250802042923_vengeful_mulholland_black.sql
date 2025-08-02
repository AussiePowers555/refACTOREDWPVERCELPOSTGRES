CREATE TABLE "bike_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"bike_id" text NOT NULL,
	"bike_registration" text,
	"assigned_date" date NOT NULL,
	"returned_date" date,
	"daily_rate" numeric(8, 2) NOT NULL,
	"rate_a" numeric(8, 2) NOT NULL,
	"rate_b" numeric(8, 2) NOT NULL,
	"helmet_rate" numeric(8, 2),
	"apparel_fee" numeric(8, 2),
	"admin_fee" numeric(8, 2),
	"delivery_fee" numeric(8, 2),
	"additional_driver_rate" numeric(8, 2),
	"excess_reduction_rate" numeric(8, 2),
	"total_cost" numeric(10, 2),
	"created_date" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bikes" (
	"id" text PRIMARY KEY NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"registration" text,
	"registration_expires" date,
	"service_center" text,
	"service_center_contact_id" text,
	"delivery_street" text,
	"delivery_suburb" text,
	"delivery_state" text,
	"delivery_postcode" text,
	"last_service_date" date,
	"service_notes" text,
	"status" text DEFAULT 'available' NOT NULL,
	"location" text DEFAULT 'Main Warehouse',
	"daily_rate" numeric(8, 2) DEFAULT '85.00',
	"daily_rate_a" numeric(8, 2),
	"daily_rate_b" numeric(8, 2),
	"image_url" text,
	"image_hint" text,
	"assignment" text DEFAULT '-',
	"assigned_case_id" text,
	"assignment_start_date" date,
	"assignment_end_date" date,
	"year" integer,
	"created_date" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "case_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"source" text NOT NULL,
	"method" text NOT NULL,
	"situation" text NOT NULL,
	"action" text NOT NULL,
	"outcome" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"workspace_id" text,
	"status" text DEFAULT 'New Matter' NOT NULL,
	"naf_data" jsonb NOT NULL,
	"af_data" jsonb NOT NULL,
	"assigned_lawyer_id" text,
	"assigned_rental_company_id" text,
	"assigned_bike" text,
	"financial_summary" jsonb DEFAULT '{"invoiced":0,"reserve":0,"agreed":0,"paid":0}'::jsonb,
	"accident_date" date,
	"accident_time" time,
	"accident_description" text,
	"accident_location" text,
	"accident_diagram" text,
	"created_date" timestamp with time zone DEFAULT now(),
	"modified_date" timestamp with time zone DEFAULT now(),
	"last_updated" text,
	"client_name" text,
	"client_phone" text,
	"client_email" text,
	"client_street_address" text,
	"client_suburb" text,
	"client_state" text,
	"client_postcode" text,
	"client_claim_number" text,
	"client_insurance_company" text,
	"client_insurer" text,
	"client_vehicle_rego" text,
	"at_fault_party_name" text,
	"at_fault_party_phone" text,
	"at_fault_party_email" text,
	"at_fault_party_street_address" text,
	"at_fault_party_suburb" text,
	"at_fault_party_state" text,
	"at_fault_party_postcode" text,
	"at_fault_party_claim_number" text,
	"at_fault_party_insurance_company" text,
	"at_fault_party_insurer" text,
	"at_fault_party_vehicle_rego" text,
	"rental_company" text,
	"lawyer" text,
	"invoiced" numeric(10, 2) DEFAULT '0',
	"reserve" numeric(10, 2) DEFAULT '0',
	"agreed" numeric(10, 2) DEFAULT '0',
	"paid" numeric(10, 2) DEFAULT '0',
	CONSTRAINT "cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "collections_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"collections_company" text NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"assigned_date" date NOT NULL,
	"outstanding_amount" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(5, 2),
	"status" text DEFAULT 'assigned' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_date" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"communication_date" timestamp with time zone NOT NULL,
	"log_type" text NOT NULL,
	"direction" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"subject" text,
	"message" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" date,
	"created_by" text,
	"created_date" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"type" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "digital_signatures" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"signature_token_id" text,
	"signature_data" text NOT NULL,
	"signer_name" text NOT NULL,
	"signer_email" text,
	"terms_accepted" boolean DEFAULT false,
	"signed_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"filename" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"document_type" text,
	"description" text,
	"uploaded_by" text,
	"uploaded_date" timestamp with time zone DEFAULT now(),
	"is_signed" boolean DEFAULT false,
	"signature_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "financial_records" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"record_date" date NOT NULL,
	"description" text NOT NULL,
	"invoiced" numeric(10, 2) NOT NULL,
	"settled" numeric(10, 2) NOT NULL,
	"paid" numeric(10, 2) NOT NULL,
	"outstanding" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_date" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "followup_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"followup_date" date NOT NULL,
	"followup_type" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"assigned_to" text,
	"completed" boolean DEFAULT false,
	"completed_date" timestamp with time zone,
	"created_by" text,
	"created_date" timestamp with time zone DEFAULT now(),
	"modified_date" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "insurance_companies" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"company_name" text NOT NULL,
	"policy_number" text,
	"claim_number" text,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"notes" text,
	"created_date" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rental_agreements" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"signature_id" text,
	"rental_details" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"signed_at" timestamp with time zone,
	"signed_by" text,
	"pdf_url" text,
	"pdf_path" text,
	"pdf_generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signature_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"case_id" text NOT NULL,
	"client_email" text NOT NULL,
	"document_type" text NOT NULL,
	"form_data" jsonb,
	"form_link" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"signed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"jotform_submission_id" text,
	"pdf_url" text,
	"document_url" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "signature_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "signed_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"sha256_hash" text NOT NULL,
	"signed_at" timestamp with time zone NOT NULL,
	"signed_by" text NOT NULL,
	"signature_data" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"encryption_key_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"contact_id" text,
	"first_login" boolean DEFAULT true,
	"remember_login" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_login" timestamp with time zone,
	CONSTRAINT "user_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_id" text NOT NULL,
	"type" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bike_assignments" ADD CONSTRAINT "fk_assignment_case" FOREIGN KEY ("case_number") REFERENCES "public"."cases"("case_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bike_assignments" ADD CONSTRAINT "fk_assignment_bike" FOREIGN KEY ("bike_id") REFERENCES "public"."bikes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bikes" ADD CONSTRAINT "fk_bike_service_center" FOREIGN KEY ("service_center_contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bikes" ADD CONSTRAINT "fk_bike_assigned_case" FOREIGN KEY ("assigned_case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_interactions" ADD CONSTRAINT "fk_interaction_case" FOREIGN KEY ("case_number") REFERENCES "public"."cases"("case_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "fk_case_workspace" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "fk_case_lawyer" FOREIGN KEY ("assigned_lawyer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "fk_case_rental_company" FOREIGN KEY ("assigned_rental_company_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections_clients" ADD CONSTRAINT "fk_collections_case" FOREIGN KEY ("case_number") REFERENCES "public"."cases"("case_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "fk_communication_case" FOREIGN KEY ("case_number") REFERENCES "public"."cases"("case_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_signatures" ADD CONSTRAINT "fk_digital_signature_case" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_signatures" ADD CONSTRAINT "fk_digital_signature_token" FOREIGN KEY ("signature_token_id") REFERENCES "public"."signature_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "fk_document_case" FOREIGN KEY ("case_number") REFERENCES "public"."cases"("case_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "fk_financial_case" FOREIGN KEY ("case_number") REFERENCES "public"."cases"("case_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_notes" ADD CONSTRAINT "fk_followup_case" FOREIGN KEY ("case_number") REFERENCES "public"."cases"("case_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_companies" ADD CONSTRAINT "fk_insurance_case" FOREIGN KEY ("case_number") REFERENCES "public"."cases"("case_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_agreements" ADD CONSTRAINT "fk_rental_agreement_case" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_agreements" ADD CONSTRAINT "fk_rental_agreement_signature" FOREIGN KEY ("signature_id") REFERENCES "public"."digital_signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_tokens" ADD CONSTRAINT "fk_signature_token_case" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_documents" ADD CONSTRAINT "fk_signed_document_case" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "fk_user_contact" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "fk_workspace_contact" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assignments_case_number" ON "bike_assignments" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_assignments_bike_id" ON "bike_assignments" USING btree ("bike_id");--> statement-breakpoint
CREATE INDEX "idx_assignments_assigned_date" ON "bike_assignments" USING btree ("assigned_date");--> statement-breakpoint
CREATE INDEX "idx_bikes_make_model" ON "bikes" USING btree ("make","model");--> statement-breakpoint
CREATE INDEX "idx_bikes_status" ON "bikes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bikes_registration" ON "bikes" USING btree ("registration");--> statement-breakpoint
CREATE INDEX "idx_bikes_assigned_case" ON "bikes" USING btree ("assigned_case_id");--> statement-breakpoint
CREATE INDEX "idx_interactions_case_number" ON "case_interactions" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_interactions_timestamp" ON "case_interactions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_cases_case_number" ON "cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_cases_status" ON "cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cases_modified_date" ON "cases" USING btree ("modified_date");--> statement-breakpoint
CREATE INDEX "idx_cases_workspace" ON "cases" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_cases_naf_data" ON "cases" USING gin ("naf_data");--> statement-breakpoint
CREATE INDEX "idx_cases_af_data" ON "cases" USING gin ("af_data");--> statement-breakpoint
CREATE INDEX "idx_cases_financial" ON "cases" USING gin ("financial_summary");--> statement-breakpoint
CREATE INDEX "idx_cases_status_modified" ON "cases" USING btree ("status","modified_date");--> statement-breakpoint
CREATE INDEX "idx_collections_case_number" ON "collections_clients" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_collections_status" ON "collections_clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_collections_assigned_date" ON "collections_clients" USING btree ("assigned_date");--> statement-breakpoint
CREATE INDEX "idx_collections_active" ON "collections_clients" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_communications_case_number" ON "communication_logs" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_communications_date" ON "communication_logs" USING btree ("communication_date");--> statement-breakpoint
CREATE INDEX "idx_communications_type" ON "communication_logs" USING btree ("log_type");--> statement-breakpoint
CREATE INDEX "idx_communications_priority" ON "communication_logs" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_contacts_name" ON "contacts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_contacts_type" ON "contacts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_contacts_email" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_digital_signatures_case_id" ON "digital_signatures" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_digital_signatures_signed_at" ON "digital_signatures" USING btree ("signed_at");--> statement-breakpoint
CREATE INDEX "idx_documents_case_number" ON "documents" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_documents_uploaded_date" ON "documents" USING btree ("uploaded_date");--> statement-breakpoint
CREATE INDEX "idx_financial_case_number" ON "financial_records" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_financial_record_date" ON "financial_records" USING btree ("record_date");--> statement-breakpoint
CREATE INDEX "idx_followups_case_number" ON "followup_notes" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_followups_date" ON "followup_notes" USING btree ("followup_date");--> statement-breakpoint
CREATE INDEX "idx_followups_completed" ON "followup_notes" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "idx_followups_priority" ON "followup_notes" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_insurance_case_number" ON "insurance_companies" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_insurance_company_name" ON "insurance_companies" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "idx_rental_agreements_case_id" ON "rental_agreements" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_rental_agreements_status" ON "rental_agreements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_signature_tokens_token" ON "signature_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_signature_tokens_case_id" ON "signature_tokens" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_signature_tokens_status" ON "signature_tokens" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_signature_tokens_expires_at" ON "signature_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_signed_documents_case_id" ON "signed_documents" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_signed_documents_type" ON "signed_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_signed_documents_signed_at" ON "signed_documents" USING btree ("signed_at");--> statement-breakpoint
CREATE INDEX "idx_signed_documents_hash" ON "signed_documents" USING btree ("sha256_hash");--> statement-breakpoint
CREATE INDEX "idx_user_accounts_email" ON "user_accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_accounts_role" ON "user_accounts" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_user_accounts_status" ON "user_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_workspaces_name" ON "workspaces" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_workspaces_contact" ON "workspaces" USING btree ("contact_id");