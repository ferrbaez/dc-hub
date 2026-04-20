-- ICS database DDL
-- Full schema reference. Claude Code: consult this when you need exact column names, types, or constraints.
-- Source of truth — do not modify unless the upstream schema changes.

-- DROP SCHEMA public;
CREATE SCHEMA public AUTHORIZATION dcd_admin;
-- DROP TYPE public."modulation_status";
CREATE TYPE public."modulation_status" AS ENUM (
	'open',
	'progress',
	'complete');
-- DROP SEQUENCE public.blockchain_details_id_seq;
CREATE SEQUENCE public.blockchain_details_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.blockchain_histories_id_seq;
CREATE SEQUENCE public.blockchain_histories_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.container_histories_v2_id_seq;
CREATE SEQUENCE public.container_histories_v2_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.containers_details_id_seq;
CREATE SEQUENCE public.containers_details_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.containers_id_seq;
CREATE SEQUENCE public.containers_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.coolings_id_seq;
CREATE SEQUENCE public.coolings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.customer_details_id_seq;
CREATE SEQUENCE public.customer_details_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.customer_histories_id_seq;
CREATE SEQUENCE public.customer_histories_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.customers_id_seq;
CREATE SEQUENCE public.customers_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.modulation_containers_id_seq;
CREATE SEQUENCE public.modulation_containers_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.modulations_id_seq;
CREATE SEQUENCE public.modulations_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.pools_id_seq;
CREATE SEQUENCE public.pools_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.project_details_id_seq;
CREATE SEQUENCE public.project_details_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.project_histories_id_seq;
CREATE SEQUENCE public.project_histories_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.projects_id_seq;
CREATE SEQUENCE public.projects_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.roles_id_seq;
CREATE SEQUENCE public.roles_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.settings_id_seq;
CREATE SEQUENCE public.settings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.ticket_details_id_seq;
CREATE SEQUENCE public.ticket_details_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.ticket_statuses_id_seq;
CREATE SEQUENCE public.ticket_statuses_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.transformers_id_seq;
CREATE SEQUENCE public.transformers_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.users_id_seq;
CREATE SEQUENCE public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;-- public.blockchain_details definition
-- Drop table
-- DROP TABLE public.blockchain_details;
CREATE TABLE public.blockchain_details (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"timestamp" timestamptz NOT NULL,
	btc_price numeric NULL,
	difficulty numeric NULL,
	hashprice numeric NULL,
	block_subsidy numeric NULL,
	avg_fees numeric NULL,
	CONSTRAINT blockchain_details_pkey PRIMARY KEY (id),
	CONSTRAINT uni_blockchain_details_timestamp UNIQUE ("timestamp")
);
CREATE INDEX idx_blockchain_details_deleted_at ON public.blockchain_details USING btree (deleted_at);
-- public.blockchain_histories definition
-- Drop table
-- DROP TABLE public.blockchain_histories;
CREATE TABLE public.blockchain_histories (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"timestamp" timestamptz NOT NULL,
	btc_price numeric NULL,
	difficulty numeric NULL,
	hashprice numeric NULL,
	block_subsidy numeric NULL,
	avg_fees numeric NULL,
	CONSTRAINT blockchain_histories_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_blockchain_histories_deleted_at ON public.blockchain_histories USING btree (deleted_at);
CREATE INDEX idx_blockchain_histories_timestamp ON public.blockchain_histories USING btree ("timestamp");
-- public.coolings definition
-- Drop table
-- DROP TABLE public.coolings;
CREATE TABLE public.coolings (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"type" text NOT NULL,
	brand text NOT NULL,
	model_name text NOT NULL,
	manufacturer text NOT NULL,
	water_required bool NOT NULL,
	CONSTRAINT coolings_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_coolings_deleted_at ON public.coolings USING btree (deleted_at);
-- public.customers definition
-- Drop table
-- DROP TABLE public.customers;
CREATE TABLE public.customers (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"name" text NOT NULL,
	id_foreman int8 NULL,
	CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_customers_deleted_at ON public.customers USING btree (deleted_at);
-- public.projects definition
-- Drop table
-- DROP TABLE public.projects;
CREATE TABLE public.projects (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"name" text NULL,
	target_consumption numeric NULL,
	CONSTRAINT projects_pkey PRIMARY KEY (id),
	CONSTRAINT uni_projects_name UNIQUE (name)
);
CREATE INDEX idx_projects_deleted_at ON public.projects USING btree (deleted_at);
-- public.roles definition
-- Drop table
-- DROP TABLE public.roles;
CREATE TABLE public.roles (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	description text NULL,
	token_lifespan_days int8 NULL,
	CONSTRAINT roles_pkey PRIMARY KEY (id),
	CONSTRAINT uni_roles_description UNIQUE (description)
);
CREATE INDEX idx_roles_deleted_at ON public.roles USING btree (deleted_at);
-- public.settings definition
-- Drop table
-- DROP TABLE public.settings;
CREATE TABLE public.settings (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"key" text NULL,
	value text NULL,
	CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX settings_key_key ON public.settings USING btree (key);
-- public.ticket_statuses definition
-- Drop table
-- DROP TABLE public.ticket_statuses;
CREATE TABLE public.ticket_statuses (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	description text NOT NULL,
	CONSTRAINT ticket_statuses_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_ticket_statuses_deleted_at ON public.ticket_statuses USING btree (deleted_at);
-- public.transformers definition
-- Drop table
-- DROP TABLE public.transformers;
CREATE TABLE public.transformers (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"name" text NULL,
	sn text NULL,
	manufacturer text NULL,
	energization_date timestamptz NULL,
	warranty_expiration timestamptz NULL,
	warranty_status bool NULL,
	mva numeric NULL,
	CONSTRAINT transformers_pkey PRIMARY KEY (id),
	CONSTRAINT uni_transformers_name UNIQUE (name),
	CONSTRAINT uni_transformers_sn UNIQUE (sn)
);
CREATE INDEX idx_transformers_deleted_at ON public.transformers USING btree (deleted_at);
-- public.containers definition
-- Drop table
-- DROP TABLE public.containers;
CREATE TABLE public.containers (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"name" varchar(255) NOT NULL,
	sn varchar(255) NOT NULL,
	brand varchar(255) NULL,
	model_name varchar(255) NULL,
	customer_id int8 NULL,
	cooling_id int8 NULL,
	status timestamptz NULL,
	transformer_id int8 NULL,
	project_id int8 NULL,
	CONSTRAINT containers_pkey PRIMARY KEY (id),
	CONSTRAINT uni_containers_name UNIQUE (name),
	CONSTRAINT fk_containers_cooling FOREIGN KEY (cooling_id) REFERENCES public.coolings(id),
	CONSTRAINT fk_containers_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id),
	CONSTRAINT fk_containers_project FOREIGN KEY (project_id) REFERENCES public.projects(id),
	CONSTRAINT fk_containers_transformer FOREIGN KEY (transformer_id) REFERENCES public.transformers(id)
);
CREATE INDEX idx_containers_deleted_at ON public.containers USING btree (deleted_at);
-- public.containers_details definition
-- Drop table
-- DROP TABLE public.containers_details;
CREATE TABLE public.containers_details (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	container_id int8 NULL,
	hashrate_nominal numeric NULL,
	hashrate_total numeric NULL,
	total_miners int8 NULL,
	miners_online int8 NULL,
	miners_hashing int8 NULL,
	miners_offline int8 NULL,
	miners_sleeping int8 NULL,
	miners_failing int8 NULL,
	theoretical_consumption numeric NULL,
	active_power numeric NULL,
	energy numeric NULL,
	total_miners_real int8 NULL,
	CONSTRAINT containers_details_pkey PRIMARY KEY (id),
	CONSTRAINT uni_containers_details_container_id UNIQUE (container_id),
	CONSTRAINT fk_containers_details_container FOREIGN KEY (container_id) REFERENCES public.containers(id)
);
CREATE INDEX idx_containers_details_deleted_at ON public.containers_details USING btree (deleted_at);
-- public.customer_details definition
-- Drop table
-- DROP TABLE public.customer_details;
CREATE TABLE public.customer_details (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	customer_id int8 NULL,
	hashrate_nominal numeric NULL,
	hashrate_total numeric NULL,
	total_miners int8 NULL,
	miners_online int8 NULL,
	miners_hashing int8 NULL,
	miners_offline int8 NULL,
	miners_sleeping int8 NULL,
	miners_failing int8 NULL,
	theoretical_consumption numeric NULL,
	active_power numeric NULL,
	energy numeric NULL,
	total_miners_real int8 NULL,
	CONSTRAINT customer_details_pkey PRIMARY KEY (id),
	CONSTRAINT fk_customer_details_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE INDEX idx_customer_details_deleted_at ON public.customer_details USING btree (deleted_at);
-- public.customer_histories definition
-- Drop table
-- DROP TABLE public.customer_histories;
CREATE TABLE public.customer_histories (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	hashrate_nominal numeric NULL,
	hashrate_total numeric NULL,
	total_miners int2 NULL,
	miners_online int2 NULL,
	miners_hashing int2 NULL,
	miners_offline int2 NULL,
	miners_sleeping int2 NULL,
	miners_failing int2 NULL,
	theoretical_consumption numeric NULL,
	customer_id int8 NULL,
	active_power numeric NULL,
	energy numeric NULL,
	total_miners_real int2 NULL,
	CONSTRAINT customer_histories_pkey PRIMARY KEY (id),
	CONSTRAINT fk_customer_histories_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE INDEX idx_customer_histories_customer_id ON public.customer_histories USING btree (customer_id);
CREATE INDEX idx_customer_histories_deleted_at ON public.customer_histories USING btree (deleted_at);
-- public.pools definition
-- Drop table
-- DROP TABLE public.pools;
CREATE TABLE public.pools (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"timestamp" timestamptz NOT NULL,
	hashrate numeric NULL,
	revenue numeric NULL,
	pool text NULL,
	project_id int8 NULL,
	CONSTRAINT pools_pkey PRIMARY KEY (id),
	CONSTRAINT fk_pools_project FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE INDEX idx_pools_deleted_at ON public.pools USING btree (deleted_at);
CREATE INDEX idx_pools_project_id ON public.pools USING btree (project_id);
CREATE INDEX idx_pools_timestamp ON public.pools USING btree ("timestamp");
-- public.project_details definition
-- Drop table
-- DROP TABLE public.project_details;
CREATE TABLE public.project_details (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	hashrate_nominal numeric NULL,
	theoretical_consumption numeric NULL,
	hashrate_total numeric NULL,
	total_miners int2 NULL,
	miners_online int2 NULL,
	miners_hashing int2 NULL,
	miners_offline int2 NULL,
	miners_sleeping int2 NULL,
	miners_failing int2 NULL,
	project_id int8 NULL,
	active_power numeric NULL,
	energy numeric NULL,
	total_miners_real int2 NULL,
	CONSTRAINT project_details_pkey PRIMARY KEY (id),
	CONSTRAINT uni_project_details_project_id UNIQUE (project_id),
	CONSTRAINT fk_project_details_project FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE INDEX idx_project_details_deleted_at ON public.project_details USING btree (deleted_at);
-- public.project_histories definition
-- Drop table
-- DROP TABLE public.project_histories;
CREATE TABLE public.project_histories (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	hashrate_nominal numeric NULL,
	hashrate_total numeric NULL,
	total_miners int2 NULL,
	miners_online int2 NULL,
	miners_hashing int2 NULL,
	miners_offline int2 NULL,
	miners_sleeping int2 NULL,
	miners_failing int2 NULL,
	theoretical_consumption numeric NULL,
	project_id int8 NULL,
	active_power numeric NULL,
	energy numeric NULL,
	total_miners_real int2 NULL,
	CONSTRAINT project_histories_pkey PRIMARY KEY (id),
	CONSTRAINT fk_project_histories_project FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE INDEX idx_project_histories_deleted_at ON public.project_histories USING btree (deleted_at);
CREATE INDEX idx_project_histories_project_id ON public.project_histories USING btree (project_id);
-- public.users definition
-- Drop table
-- DROP TABLE public.users;
CREATE TABLE public.users (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	"user" text NULL,
	email text NULL,
	"password" text NULL,
	role_id int8 NULL,
	CONSTRAINT uni_users_email UNIQUE (email),
	CONSTRAINT uni_users_user UNIQUE ("user"),
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);
-- public.container_histories definition
-- Drop table
-- DROP TABLE public.container_histories;
CREATE TABLE public.container_histories (
	id int8 DEFAULT nextval('container_histories_v2_id_seq'::regclass) NOT NULL,
	created_at timestamptz NOT NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	container_id int8 NULL,
	hashrate_nominal numeric NULL,
	hashrate_total numeric NULL,
	total_miners int8 NULL,
	miners_online int8 NULL,
	miners_hashing int8 NULL,
	miners_offline int8 NULL,
	miners_sleeping int8 NULL,
	miners_failing int8 NULL,
	theoretical_consumption int8 NULL,
	active_power numeric NULL,
	energy numeric NULL,
	total_miners_real int8 NULL,
	CONSTRAINT container_histories_v2_pkey PRIMARY KEY (id, created_at),
	CONSTRAINT fk_container_histories_container FOREIGN KEY (container_id) REFERENCES public.containers(id)
)
PARTITION BY RANGE (created_at);
CREATE INDEX idx_container_histories_deleted_at ON ONLY public.container_histories USING btree (deleted_at);
-- public.container_histories_2025_07 definition
CREATE TABLE public.container_histories_2025_07 PARTITION OF public.container_histories  FOR VALUES FROM ('2025-07-01 01:00:00-03') TO ('2025-08-01 01:00:00-03');
CREATE INDEX container_histories_2025_07_container_id_idx ON public.container_histories_2025_07 USING btree (container_id);
CREATE INDEX container_histories_2025_07_created_at_idx ON public.container_histories_2025_07 USING btree (created_at);
CREATE INDEX container_histories_2025_07_deleted_at_idx ON public.container_histories_2025_07 USING btree (deleted_at);
-- public.container_histories_2025_08 definition
CREATE TABLE public.container_histories_2025_08 PARTITION OF public.container_histories  FOR VALUES FROM ('2025-08-01 01:00:00-03') TO ('2025-09-01 01:00:00-03');
CREATE INDEX container_histories_2025_08_container_id_idx ON public.container_histories_2025_08 USING btree (container_id);
CREATE INDEX container_histories_2025_08_created_at_idx ON public.container_histories_2025_08 USING btree (created_at);
CREATE INDEX container_histories_2025_08_deleted_at_idx ON public.container_histories_2025_08 USING btree (deleted_at);
-- public.container_histories_2025_09 definition
CREATE TABLE public.container_histories_2025_09 PARTITION OF public.container_histories  FOR VALUES FROM ('2025-09-01 01:00:00-03') TO ('2025-10-01 01:00:00-03');
CREATE INDEX container_histories_2025_09_container_id_idx ON public.container_histories_2025_09 USING btree (container_id);
CREATE INDEX container_histories_2025_09_created_at_idx ON public.container_histories_2025_09 USING btree (created_at);
CREATE INDEX container_histories_2025_09_deleted_at_idx ON public.container_histories_2025_09 USING btree (deleted_at);
-- public.container_histories_2025_10 definition
CREATE TABLE public.container_histories_2025_10 PARTITION OF public.container_histories  FOR VALUES FROM ('2025-10-01 01:00:00-03') TO ('2025-11-01 00:00:00-03');
CREATE INDEX container_histories_2025_10_container_id_idx ON public.container_histories_2025_10 USING btree (container_id);
CREATE INDEX container_histories_2025_10_created_at_idx ON public.container_histories_2025_10 USING btree (created_at);
CREATE INDEX container_histories_2025_10_deleted_at_idx ON public.container_histories_2025_10 USING btree (deleted_at);
-- public.container_histories_2025_11 definition
CREATE TABLE public.container_histories_2025_11 PARTITION OF public.container_histories  FOR VALUES FROM ('2025-11-01 00:00:00-03') TO ('2025-12-01 00:00:00-03');
CREATE INDEX container_histories_2025_11_container_id_idx ON public.container_histories_2025_11 USING btree (container_id);
CREATE INDEX container_histories_2025_11_created_at_idx ON public.container_histories_2025_11 USING btree (created_at);
CREATE INDEX container_histories_2025_11_deleted_at_idx ON public.container_histories_2025_11 USING btree (deleted_at);
-- public.container_histories_2025_12 definition
CREATE TABLE public.container_histories_2025_12 PARTITION OF public.container_histories  FOR VALUES FROM ('2025-12-01 00:00:00-03') TO ('2026-01-01 00:00:00-03');
CREATE INDEX container_histories_2025_12_container_id_idx ON public.container_histories_2025_12 USING btree (container_id);
CREATE INDEX container_histories_2025_12_created_at_idx ON public.container_histories_2025_12 USING btree (created_at);
CREATE INDEX container_histories_2025_12_deleted_at_idx ON public.container_histories_2025_12 USING btree (deleted_at);
-- public.container_histories_2026_01 definition
CREATE TABLE public.container_histories_2026_01 PARTITION OF public.container_histories  FOR VALUES FROM ('2026-01-01 00:00:00-03') TO ('2026-02-01 00:00:00-03');
CREATE INDEX container_histories_2026_01_container_id_idx ON public.container_histories_2026_01 USING btree (container_id);
CREATE INDEX container_histories_2026_01_created_at_idx ON public.container_histories_2026_01 USING btree (created_at);
CREATE INDEX container_histories_2026_01_deleted_at_idx ON public.container_histories_2026_01 USING btree (deleted_at);
-- public.container_histories_2026_02 definition
CREATE TABLE public.container_histories_2026_02 PARTITION OF public.container_histories  FOR VALUES FROM ('2026-02-01 00:00:00-03') TO ('2026-03-01 00:00:00-03');
CREATE INDEX container_histories_2026_02_deleted_at_idx ON public.container_histories_2026_02 USING btree (deleted_at);
-- public.container_histories_2026_03 definition
CREATE TABLE public.container_histories_2026_03 PARTITION OF public.container_histories  FOR VALUES FROM ('2026-03-01 00:00:00-03') TO ('2026-04-01 00:00:00-03');
CREATE INDEX container_histories_2026_03_deleted_at_idx ON public.container_histories_2026_03 USING btree (deleted_at);
-- public.container_histories_2026_04 definition
CREATE TABLE public.container_histories_2026_04 PARTITION OF public.container_histories  FOR VALUES FROM ('2026-04-01 00:00:00-03') TO ('2026-05-01 00:00:00-03');
CREATE INDEX container_histories_2026_04_deleted_at_idx ON public.container_histories_2026_04 USING btree (deleted_at);
-- public.modulations definition
-- Drop table
-- DROP TABLE public.modulations;
CREATE TABLE public.modulations (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	project_id int8 NULL,
	user_id int8 NULL,
	responsible text NULL,
	start_date timestamptz NULL,
	end_date timestamptz NULL,
	status public."modulation_status" NOT NULL,
	duration int8 NULL,
	power_before numeric NULL,
	power_during numeric NULL,
	power_lost numeric NULL,
	energy_lost_k_wh numeric NULL,
	reason text NULL,
	detailed_report text NULL,
	notified bool NULL,
	updated_by int8 NULL,
	CONSTRAINT modulations_pkey PRIMARY KEY (id),
	CONSTRAINT fk_modulations_project FOREIGN KEY (project_id) REFERENCES public.projects(id),
	CONSTRAINT fk_modulations_updated_by_user FOREIGN KEY (updated_by) REFERENCES public.users(id),
	CONSTRAINT fk_modulations_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE INDEX idx_modulations_deleted_at ON public.modulations USING btree (deleted_at);
-- public.ticket_details definition
-- Drop table
-- DROP TABLE public.ticket_details;
CREATE TABLE public.ticket_details (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	quantity int2 NULL,
	ticket_status_id int8 NULL,
	container_history_id int8 NULL,
	container_id int8 NULL,
	container_history_created_at timestamptz NULL,
	CONSTRAINT ticket_details_pkey PRIMARY KEY (id),
	CONSTRAINT fk_ticket_details_container FOREIGN KEY (container_id) REFERENCES public.containers(id),
	CONSTRAINT fk_ticket_details_container_history FOREIGN KEY (container_history_id,container_history_created_at) REFERENCES public.container_histories(id,created_at),
	CONSTRAINT fk_ticket_details_ticket_status FOREIGN KEY (ticket_status_id) REFERENCES public.ticket_statuses(id)
);
CREATE INDEX idx_ticket_details_deleted_at ON public.ticket_details USING btree (deleted_at);
-- public.modulation_containers definition
-- Drop table
-- DROP TABLE public.modulation_containers;
CREATE TABLE public.modulation_containers (
	id bigserial NOT NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	modulation_id int8 NULL,
	container_id int8 NULL,
	CONSTRAINT modulation_containers_pkey PRIMARY KEY (id),
	CONSTRAINT fk_modulation_containers_container FOREIGN KEY (container_id) REFERENCES public.containers(id) ON DELETE CASCADE,
	CONSTRAINT fk_modulations_modulation_containers FOREIGN KEY (modulation_id) REFERENCES public.modulations(id)
);
CREATE INDEX idx_modulation_containers_deleted_at ON public.modulation_containers USING btree (deleted_at);