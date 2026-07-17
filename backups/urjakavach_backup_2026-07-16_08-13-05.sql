--
-- PostgreSQL database dump
--

\restrict eTT192CfbOncKxHGyJbMg8XwbTQPWbjq2JGZhfhg5Ti8WD0NJxYPx2oQA4OtsLc

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: urjakavach
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO urjakavach;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: urjakavach
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ais_snapshots; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.ais_snapshots (
    id integer NOT NULL,
    captured_at timestamp with time zone DEFAULT now() NOT NULL,
    bounding_box text NOT NULL,
    vessel_count integer NOT NULL,
    raw_payload_path text
);


ALTER TABLE public.ais_snapshots OWNER TO urjakavach;

--
-- Name: ais_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: urjakavach
--

CREATE SEQUENCE public.ais_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ais_snapshots_id_seq OWNER TO urjakavach;

--
-- Name: ais_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: urjakavach
--

ALTER SEQUENCE public.ais_snapshots_id_seq OWNED BY public.ais_snapshots.id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO urjakavach;

--
-- Name: edges; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.edges (
    id text NOT NULL,
    from_node_id text NOT NULL,
    to_node_id text NOT NULL,
    edge_type text NOT NULL,
    capacity_value double precision,
    source_note text NOT NULL
);


ALTER TABLE public.edges OWNER TO urjakavach;

--
-- Name: gdelt_articles; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.gdelt_articles (
    id integer NOT NULL,
    corridor text NOT NULL,
    query text NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    seendate text,
    domain text,
    language text,
    source_country text,
    is_synthetic boolean DEFAULT false NOT NULL
);


ALTER TABLE public.gdelt_articles OWNER TO urjakavach;

--
-- Name: gdelt_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: urjakavach
--

CREATE SEQUENCE public.gdelt_articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gdelt_articles_id_seq OWNER TO urjakavach;

--
-- Name: gdelt_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: urjakavach
--

ALTER SEQUENCE public.gdelt_articles_id_seq OWNED BY public.gdelt_articles.id;


--
-- Name: geopolitical_alerts; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.geopolitical_alerts (
    id integer NOT NULL,
    corridor text NOT NULL,
    alert_type text NOT NULL,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    value double precision NOT NULL,
    threshold double precision NOT NULL,
    description text NOT NULL,
    raw_payload jsonb
);


ALTER TABLE public.geopolitical_alerts OWNER TO urjakavach;

--
-- Name: geopolitical_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: urjakavach
--

CREATE SEQUENCE public.geopolitical_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.geopolitical_alerts_id_seq OWNER TO urjakavach;

--
-- Name: geopolitical_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: urjakavach
--

ALTER SEQUENCE public.geopolitical_alerts_id_seq OWNED BY public.geopolitical_alerts.id;


--
-- Name: nodes; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.nodes (
    id text NOT NULL,
    node_type text NOT NULL,
    name text NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    capacity_value double precision,
    capacity_unit text,
    source_note text NOT NULL
);


ALTER TABLE public.nodes OWNER TO urjakavach;

--
-- Name: price_points; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.price_points (
    id integer NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    source text NOT NULL,
    series text NOT NULL,
    period text NOT NULL,
    value double precision,
    units text
);


ALTER TABLE public.price_points OWNER TO urjakavach;

--
-- Name: price_points_id_seq; Type: SEQUENCE; Schema: public; Owner: urjakavach
--

CREATE SEQUENCE public.price_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.price_points_id_seq OWNER TO urjakavach;

--
-- Name: price_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: urjakavach
--

ALTER SEQUENCE public.price_points_id_seq OWNED BY public.price_points.id;


--
-- Name: risk_scores; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.risk_scores (
    id integer NOT NULL,
    corridor text NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL,
    score double precision NOT NULL,
    component_gdelt_volume double precision,
    component_price_volatility double precision,
    component_ais_deviation double precision,
    component_sanctions_flag double precision,
    weights_used jsonb NOT NULL,
    component_gdelt_stale boolean DEFAULT false NOT NULL,
    component_price_stale boolean DEFAULT false NOT NULL,
    component_ais_stale boolean DEFAULT false NOT NULL,
    component_sanctions_stale boolean DEFAULT false NOT NULL
);


ALTER TABLE public.risk_scores OWNER TO urjakavach;

--
-- Name: risk_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: urjakavach
--

CREATE SEQUENCE public.risk_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.risk_scores_id_seq OWNER TO urjakavach;

--
-- Name: risk_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: urjakavach
--

ALTER SEQUENCE public.risk_scores_id_seq OWNED BY public.risk_scores.id;


--
-- Name: scenario_runs; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.scenario_runs (
    id integer NOT NULL,
    scenario_id text NOT NULL,
    capacity_available_pct double precision NOT NULL,
    run_at timestamp with time zone DEFAULT now() NOT NULL,
    projected_import_volume_change_pct double precision,
    projected_spr_days_cover double precision,
    narrative_text text
);


ALTER TABLE public.scenario_runs OWNER TO urjakavach;

--
-- Name: scenario_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: urjakavach
--

CREATE SEQUENCE public.scenario_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scenario_runs_id_seq OWNER TO urjakavach;

--
-- Name: scenario_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: urjakavach
--

ALTER SEQUENCE public.scenario_runs_id_seq OWNED BY public.scenario_runs.id;


--
-- Name: scenarios; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.scenarios (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    ground_truth_source text NOT NULL
);


ALTER TABLE public.scenarios OWNER TO urjakavach;

--
-- Name: security_audit_logs; Type: TABLE; Schema: public; Owner: urjakavach
--

CREATE TABLE public.security_audit_logs (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    operator_id text DEFAULT 'IND-2026-OPS'::text NOT NULL,
    action_source text NOT NULL,
    action_type text NOT NULL,
    payload jsonb NOT NULL
);


ALTER TABLE public.security_audit_logs OWNER TO urjakavach;

--
-- Name: security_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: urjakavach
--

CREATE SEQUENCE public.security_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_audit_logs_id_seq OWNER TO urjakavach;

--
-- Name: security_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: urjakavach
--

ALTER SEQUENCE public.security_audit_logs_id_seq OWNED BY public.security_audit_logs.id;


--
-- Name: ais_snapshots id; Type: DEFAULT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.ais_snapshots ALTER COLUMN id SET DEFAULT nextval('public.ais_snapshots_id_seq'::regclass);


--
-- Name: gdelt_articles id; Type: DEFAULT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.gdelt_articles ALTER COLUMN id SET DEFAULT nextval('public.gdelt_articles_id_seq'::regclass);


--
-- Name: geopolitical_alerts id; Type: DEFAULT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.geopolitical_alerts ALTER COLUMN id SET DEFAULT nextval('public.geopolitical_alerts_id_seq'::regclass);


--
-- Name: price_points id; Type: DEFAULT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.price_points ALTER COLUMN id SET DEFAULT nextval('public.price_points_id_seq'::regclass);


--
-- Name: risk_scores id; Type: DEFAULT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.risk_scores ALTER COLUMN id SET DEFAULT nextval('public.risk_scores_id_seq'::regclass);


--
-- Name: scenario_runs id; Type: DEFAULT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.scenario_runs ALTER COLUMN id SET DEFAULT nextval('public.scenario_runs_id_seq'::regclass);


--
-- Name: security_audit_logs id; Type: DEFAULT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.security_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.security_audit_logs_id_seq'::regclass);


--
-- Data for Name: ais_snapshots; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.ais_snapshots (id, captured_at, bounding_box, vessel_count, raw_payload_path) FROM stdin;
19	2026-07-15 17:38:46.356171+00	hormuz	38	\N
20	2026-07-15 17:38:46.356171+00	jamnagar_vadinar	12	\N
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.alembic_version (version_num) FROM stdin;
79173f97e961
\.


--
-- Data for Name: edges; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.edges (id, from_node_id, to_node_id, edge_type, capacity_value, source_note) FROM stdin;
edge_hormuz_jamnagar_sikka	corridor_hormuz	port_jamnagar_sikka	shipping_corridor	\N	FINAL_ALIGNED_DOSSIER Part 3.3; west-coast Gulf-route exposure.
edge_hormuz_vadinar	corridor_hormuz	port_vadinar	shipping_corridor	\N	FINAL_ALIGNED_DOSSIER Part 3.3; west-coast Gulf-route exposure.
edge_hormuz_new_mangalore	corridor_hormuz	port_new_mangalore	shipping_corridor	\N	FINAL_ALIGNED_DOSSIER Part 3.3; west-coast Gulf-route exposure.
edge_jamnagar_sikka_reliance	port_jamnagar_sikka	refinery_reliance_jamnagar	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_vadinar_nayara	port_vadinar	refinery_nayara_vadinar	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_new_mangalore_mrpl	port_new_mangalore	refinery_mrpl_mangalore	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_new_mangalore_spr_mangaluru	port_new_mangalore	spr_mangaluru	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.1-3.3.
edge_new_mangalore_spr_padur	port_new_mangalore	spr_padur	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.1-3.3.
edge_visakhapatnam_hpcl	port_visakhapatnam	refinery_hpcl_visakhapatnam	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_visakhapatnam_spr	port_visakhapatnam	spr_visakhapatnam	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.1-3.3.
edge_paradip_pipeline	port_paradip	pipeline_vizag_vijayawada	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.3-3.4.
edge_kochi_bpcl	port_kochi	refinery_bpcl_kochi	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_mumbai_bpcl	port_mumbai_jnpt	refinery_bpcl_mumbai	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_mumbai_hpcl	port_mumbai_jnpt	refinery_hpcl_mumbai	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_chennai_cpcl	port_chennai_ennore	refinery_cpcl_manali	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_haldia_iocl	port_haldia	refinery_iocl_haldia	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.2-3.3.
edge_salaya_mathura_refinery	pipeline_salaya_mathura	refinery_iocl_mathura	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.4.
edge_kandla_bhatinda_panipat	pipeline_kandla_bhatinda	refinery_iocl_panipat	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.4.
edge_mumbai_pipeline_hpcl	pipeline_mumbai_manmad_delhi	refinery_hpcl_mumbai	pipeline	\N	FINAL_ALIGNED_DOSSIER Part 3.4.
\.


--
-- Data for Name: gdelt_articles; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.gdelt_articles (id, corridor, query, fetched_at, title, url, seendate, domain, language, source_country, is_synthetic) FROM stdin;
\.


--
-- Data for Name: geopolitical_alerts; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.geopolitical_alerts (id, corridor, alert_type, triggered_at, value, threshold, description, raw_payload) FROM stdin;
\.


--
-- Data for Name: nodes; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.nodes (id, node_type, name, lat, lon, capacity_value, capacity_unit, source_note) FROM stdin;
spr_visakhapatnam	spr	ISPRL Visakhapatnam SPR	17.69	83.22	1.33	MMT	FINAL_ALIGNED_DOSSIER Part 3.1; capacity verified in Part 0.
spr_mangaluru	spr	ISPRL Mangaluru SPR	12.91	74.86	1.5	MMT	FINAL_ALIGNED_DOSSIER Part 3.1; capacity verified in Part 0.
spr_padur	spr	ISPRL Padur SPR	13.08	74.78	2.5	MMT	FINAL_ALIGNED_DOSSIER Part 3.1; capacity verified in Part 0.
spr_chandikhole_planned	spr	Planned Chandikhole SPR	20.74	86.1	\N	MMT	FINAL_ALIGNED_DOSSIER Part 3.1; planned Phase II addition, not operational.
spr_padur_expansion_planned	spr	Planned Padur SPR Expansion	13.08	74.78	\N	MMT	FINAL_ALIGNED_DOSSIER Part 3.1; planned Phase II expansion, not operational.
refinery_iocl_panipat	refinery	IOCL Panipat Refinery	29.39	76.97	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_iocl_mathura	refinery	IOCL Mathura Refinery	27.49	77.68	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_iocl_koyali	refinery	IOCL Koyali Refinery	22.39	73.12	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_iocl_barauni	refinery	IOCL Barauni Refinery	25.44	86.13	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_iocl_haldia	refinery	IOCL Haldia Refinery	22.03	88.06	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_iocl_guwahati	refinery	IOCL Guwahati Refinery	26.17	91.66	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_iocl_digboi	refinery	IOCL Digboi Refinery	27.39	95.62	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_iocl_bongaigaon	refinery	IOCL Bongaigaon Refinery	26.47	90.56	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_reliance_jamnagar	refinery	Reliance Jamnagar Refinery Complex	22.35	69.66	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; single largest refining complex by capacity.
refinery_bpcl_mumbai	refinery	BPCL Mumbai Refinery	19.02	72.9	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_bpcl_kochi	refinery	BPCL Kochi Refinery	9.96	76.36	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_bpcl_bina	refinery	BPCL Bina Refinery	24.17	78.2	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_hpcl_mumbai	refinery	HPCL Mumbai Refinery	19.01	72.89	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_hpcl_visakhapatnam	refinery	HPCL Visakhapatnam Refinery	17.69	83.24	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_nayara_vadinar	refinery	Nayara Energy Vadinar Refinery	22.42	69.71	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_cpcl_manali	refinery	CPCL Manali Refinery	13.16	80.27	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
refinery_mrpl_mangalore	refinery	MRPL Mangalore Refinery	12.98	74.87	\N	MMT/year	FINAL_ALIGNED_DOSSIER Part 3.2; capacity to be sourced from PPAC/latest annual reports.
port_jamnagar_sikka	port	Jamnagar / Sikka Crude Port	22.43	69.84	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
port_vadinar	port	Vadinar Port	22.48	69.69	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
port_paradip	port	Paradip Port	20.27	86.67	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
port_visakhapatnam	port	Visakhapatnam Port	17.69	83.29	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
port_kochi	port	Kochi Port	9.97	76.26	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
port_mumbai_jnpt	port	Mumbai / JNPT Port Cluster	18.95	72.95	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
port_chennai_ennore	port	Chennai / Ennore Port Cluster	13.2	80.32	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
port_new_mangalore	port	New Mangalore Port	12.93	74.82	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
port_haldia	port	Haldia Port	22.03	88.08	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.3; major crude-receiving port.
pipeline_salaya_mathura	pipeline_segment	Salaya-Mathura Crude Pipeline	24.37	75.88	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.4; named pipeline example.
pipeline_kandla_bhatinda	pipeline_segment	Kandla-Bhatinda Pipeline	27.3	73.75	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.4; named pipeline example.
pipeline_vizag_vijayawada	pipeline_segment	Vizag-Vijayawada Pipeline	16.55	81.4	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.4; named pipeline example.
pipeline_mumbai_manmad_delhi	pipeline_segment	Mumbai-Manmad-Delhi Product Pipeline	21.5	75.7	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.4; named pipeline example.
pipeline_hbj_gas	pipeline_segment	Hazira-Bijaipur-Jagdishpur Gas Pipeline	23.45	76.9	\N	\N	FINAL_ALIGNED_DOSSIER Part 3.4; named pipeline example.
corridor_hormuz	pipeline_segment	Strait of Hormuz Shipping Corridor	26.57	56.25	\N	\N	FINAL_ALIGNED_DOSSIER Parts 1, 3, and 4.1; AIS bounding-box corridor for Tier 1.
\.


--
-- Data for Name: price_points; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.price_points (id, fetched_at, source, series, period, value, units) FROM stdin;
36	2026-07-15 17:19:58.762713+00	EIA	RBRTE	2026-07-02	68.53	$/BBL
37	2026-07-15 17:19:58.762713+00	EIA	RBRTE	2026-07-01	69.24	$/BBL
38	2026-07-15 17:19:58.762713+00	EIA	RBRTE	2026-06-30	70.46	$/BBL
39	2026-07-15 17:19:58.762713+00	EIA	RBRTE	2026-06-29	71.59	$/BBL
40	2026-07-15 17:19:58.762713+00	EIA	RBRTE	2026-06-26	70.16	$/BBL
41	2026-07-15 19:11:21.59329+00	EIA	RBRTE	2026-07-13	81.62	$/BBL
33	2026-07-15 15:04:58.092259+00	EIA	RBRTE	2026-07-10	74.34	$/BBL
43	2026-07-15 19:11:21.59329+00	EIA	RBRTE	2026-07-09	74.46	$/BBL
44	2026-07-15 19:11:21.59329+00	EIA	RBRTE	2026-07-08	76.5	$/BBL
45	2026-07-15 19:11:21.59329+00	EIA	RBRTE	2026-07-07	71.78	$/BBL
34	2026-07-15 17:19:58.762713+00	EIA	RBRTE	2026-07-06	69.56	$/BBL
35	2026-07-15 17:19:58.762713+00	EIA	RBRTE	2026-07-03	68.68	$/BBL
\.


--
-- Data for Name: risk_scores; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.risk_scores (id, corridor, computed_at, score, component_gdelt_volume, component_price_volatility, component_ais_deviation, component_sanctions_flag, weights_used, component_gdelt_stale, component_price_stale, component_ais_stale, component_sanctions_stale) FROM stdin;
85	hormuz	2026-07-15 17:14:58.116078+00	14.7	0.42000000000000004	0	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	f	f
86	hormuz	2026-07-15 17:14:58.142961+00	14.7	0.42000000000000004	0	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	t	t
87	hormuz	2026-07-15 17:24:49.97583+00	20.062614913176706	0.42000000000000004	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	t
88	non_hormuz_west_africa	2026-07-15 17:24:49.998636+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	t
89	non_hormuz_americas	2026-07-15 17:24:50.005693+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	t
90	non_hormuz_russia	2026-07-15 17:24:50.016392+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	t
91	hormuz	2026-07-15 17:34:49.972785+00	20.062614913176706	0.42000000000000004	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	t	t
92	non_hormuz_west_africa	2026-07-15 17:34:49.987814+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	t	t
93	non_hormuz_americas	2026-07-15 17:34:50.000842+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	t	t
94	non_hormuz_russia	2026-07-15 17:34:50.008889+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	t	t
95	hormuz	2026-07-15 18:32:19.811961+00	20.062614913176706	0.42000000000000004	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	t
96	non_hormuz_west_africa	2026-07-15 18:32:19.835571+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	t
97	non_hormuz_americas	2026-07-15 18:32:19.842127+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	t
98	non_hormuz_russia	2026-07-15 18:32:19.849075+00	19.362614913176706	0.4	0.21450459652706827	0	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	t
99	hormuz	2026-07-15 19:11:32.360011+00	61.432026143790864	0.42000000000000004	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
100	non_hormuz_west_africa	2026-07-15 19:11:32.382374+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
101	non_hormuz_americas	2026-07-15 19:11:32.389964+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
102	non_hormuz_russia	2026-07-15 19:11:32.396922+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
103	hormuz	2026-07-15 19:12:21.200145+00	61.432026143790864	0.42000000000000004	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
104	non_hormuz_west_africa	2026-07-15 19:12:21.220799+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
105	non_hormuz_americas	2026-07-15 19:12:21.227551+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
106	non_hormuz_russia	2026-07-15 19:12:21.234452+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
107	hormuz	2026-07-15 19:13:02.724693+00	63.532026143790866	0.48	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	f	f	f	f
108	non_hormuz_west_africa	2026-07-15 19:13:02.743833+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
109	non_hormuz_americas	2026-07-15 19:13:02.751723+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
110	non_hormuz_russia	2026-07-15 19:13:02.758819+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	f	f	f
111	hormuz	2026-07-16 02:33:02.748155+00	63.532026143790866	0.48	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	t	f
112	non_hormuz_west_africa	2026-07-16 02:33:02.783811+00	62.13202614379087	0.44000000000000006	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	t	f
113	non_hormuz_americas	2026-07-16 02:33:02.799333+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	t	f
114	non_hormuz_russia	2026-07-16 02:33:02.811545+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	t	f
115	hormuz	2026-07-16 02:41:46.805876+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	f	t
116	non_hormuz_west_africa	2026-07-16 02:41:46.848902+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	f	t
117	non_hormuz_americas	2026-07-16 02:41:46.862217+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	f	t
118	non_hormuz_russia	2026-07-16 02:41:46.886385+00	60.73202614379086	0.4	0.6692810457516346	1	0	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}	t	t	f	t
\.


--
-- Data for Name: scenario_runs; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.scenario_runs (id, scenario_id, capacity_available_pct, run_at, projected_import_volume_change_pct, projected_spr_days_cover, narrative_text) FROM stdin;
1	hormuz_partial_closure	50	2026-07-15 15:42:03.755341+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
3	hormuz_partial_closure	50	2026-07-15 15:42:04.010279+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
5	hormuz_partial_closure	50	2026-07-15 15:42:04.01036+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
6	hormuz_partial_closure	50	2026-07-15 15:42:04.010393+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
7	hormuz_partial_closure	50	2026-07-15 15:42:04.01051+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
2	hormuz_partial_closure	50	2026-07-15 15:42:04.006627+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
8	hormuz_partial_closure	50	2026-07-15 15:42:04.010522+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
9	hormuz_partial_closure	50	2026-07-15 15:42:04.010543+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
10	hormuz_partial_closure	50	2026-07-15 15:42:04.010503+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
4	hormuz_partial_closure	50	2026-07-15 15:42:04.010336+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
11	hormuz_partial_closure	50	2026-07-15 17:41:14.633422+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
12	hormuz_partial_closure	50	2026-07-15 17:43:08.037955+00	-16.428571428571427	4.571428571428572	Under a hormuz_partial_closure scenario with 50% capacity available, India's crude imports are projected to drop by 16.4%. Strategic reserves (SPR) days of cover will deplete to 4.6 days over a 30-day window.
13	hormuz_partial_closure	100	2026-07-15 18:25:07.866319+00	-0	9.5	Under a hormuz_partial_closure scenario with 100% capacity available, India's crude imports are projected to drop by 0.0%. Strategic reserves (SPR) days of cover will deplete to 9.5 days over a 30-day window.
14	hormuz_partial_closure	100	2026-07-15 19:08:23.379708+00	-0	9.5	Under a hormuz_partial_closure scenario with 100% capacity available, India's crude imports are projected to drop by 0.0%. Strategic reserves (SPR) days of cover will deplete to 9.5 days over a 30-day window.
\.


--
-- Data for Name: scenarios; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.scenarios (id, name, description, ground_truth_source) FROM stdin;
hormuz_partial_closure	Hormuz partial closure	Capacity-available slider scenario for Strait of Hormuz disruption.	FINAL_ALIGNED_DOSSIER sections 1-2, as referenced by Execution Plan.
\.


--
-- Data for Name: security_audit_logs; Type: TABLE DATA; Schema: public; Owner: urjakavach
--

COPY public.security_audit_logs (id, "timestamp", operator_id, action_source, action_type, payload) FROM stdin;
1	2026-07-15 14:16:40.335203+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
2	2026-07-15 14:16:59.055442+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
3	2026-07-15 14:17:17.793725+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
4	2026-07-15 14:17:46.685153+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
5	2026-07-15 15:29:42.010377+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
7	2026-07-15 15:42:04.04+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
8	2026-07-15 15:42:04.040043+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
9	2026-07-15 15:42:04.039959+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
6	2026-07-15 15:42:04.040092+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
10	2026-07-15 15:42:04.040068+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
11	2026-07-15 15:42:04.040964+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
12	2026-07-15 15:42:04.040116+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
13	2026-07-15 15:42:04.042295+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
14	2026-07-15 15:42:04.04711+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
15	2026-07-15 15:42:04.047086+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
16	2026-07-15 15:42:10.927486+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
17	2026-07-15 15:42:10.92871+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
18	2026-07-15 15:42:10.928766+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
19	2026-07-15 15:42:10.928689+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
20	2026-07-15 15:42:10.930555+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
21	2026-07-15 15:42:11.069854+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
22	2026-07-15 15:42:11.070254+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
23	2026-07-15 15:42:11.070328+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
24	2026-07-15 15:42:11.070323+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
25	2026-07-15 15:42:11.070181+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.25, "ais_deviation": 0.25, "sanctions_flag": 0.25, "price_volatility": 0.25}
34	2026-07-15 16:44:10.944415+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
36	2026-07-15 17:07:49.5674+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
38	2026-07-15 17:08:23.851564+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
40	2026-07-15 17:14:58.019097+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 105.0, "use_diversification": true, "days_cover_remaining": 87.3}
41	2026-07-15 17:15:10.636388+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
42	2026-07-15 17:39:02.334856+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
44	2026-07-15 17:41:14.648183+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
45	2026-07-15 17:41:20.073746+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 314.4}
46	2026-07-15 17:43:08.051934+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0, "projected_spr_days_cover": 4.571428571428572, "projected_import_volume_change_pct": -16.428571428571427}
47	2026-07-15 17:43:19.625097+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 314.4}
48	2026-07-15 17:56:22.662031+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 21.2}
49	2026-07-15 17:56:22.686475+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 314.4}
50	2026-07-15 17:56:22.701952+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 293.2}
51	2026-07-15 17:56:22.717577+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 0.0}
52	2026-07-15 17:59:20.082606+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 21.2}
53	2026-07-15 17:59:20.097212+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 314.4}
54	2026-07-15 17:59:20.109747+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 293.2}
55	2026-07-15 17:59:20.122463+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 0.0}
57	2026-07-15 17:59:37.913492+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 21.2}
58	2026-07-15 17:59:37.926814+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 314.4}
59	2026-07-15 17:59:37.940642+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 293.2}
60	2026-07-15 17:59:37.955678+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 0.0}
62	2026-07-15 17:59:42.073564+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 21.2}
63	2026-07-15 17:59:42.089725+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 314.4}
64	2026-07-15 17:59:42.102878+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 293.2}
65	2026-07-15 17:59:42.115218+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 0.0}
66	2026-07-15 17:59:49.491458+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 21.2}
67	2026-07-15 17:59:49.503523+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": true, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 314.4}
68	2026-07-15 17:59:49.516565+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": true, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 293.2}
69	2026-07-15 17:59:49.528897+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": false, "shortfall_pct": 40.0, "use_diversification": true, "days_cover_remaining": 0.0}
71	2026-07-15 18:23:27.298847+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
72	2026-07-15 18:25:07.876331+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 100.0, "projected_spr_days_cover": 9.5, "projected_import_volume_change_pct": 0.0}
73	2026-07-15 18:25:53.373999+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 30.0, "use_diversification": true, "days_cover_remaining": 35.4}
74	2026-07-15 18:25:53.373676+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 30.0, "use_diversification": true, "days_cover_remaining": 35.4}
75	2026-07-15 18:27:31.395768+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
77	2026-07-15 19:07:13.919197+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
78	2026-07-15 19:07:37.747027+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 30.0, "use_diversification": true, "days_cover_remaining": 35.4}
79	2026-07-15 19:07:37.770285+00	IND-2026-OPS	reserve_calculation	RUN_RESERVE_CALC	{"use_omc": false, "use_isprl": true, "shortfall_pct": 30.0, "use_diversification": true, "days_cover_remaining": 35.4}
80	2026-07-15 19:08:23.390522+00	IND-2026-OPS	scenario_run	RUN_SIMULATION	{"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 100.0, "projected_spr_days_cover": 9.5, "projected_import_volume_change_pct": 0.0}
81	2026-07-15 19:08:50.896628+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
82	2026-07-15 19:09:51.758892+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
83	2026-07-15 19:10:51.756511+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
84	2026-07-15 19:11:51.762085+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
85	2026-07-15 19:12:51.758872+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
87	2026-07-15 19:13:51.748416+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
88	2026-07-15 19:14:51.744055+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
89	2026-07-15 19:16:09.522435+00	IND-2026-OPS	dashboard_weight_adjustment	UPDATE_WEIGHTS	{"gdelt_volume": 0.35, "ais_deviation": 0.3, "sanctions_flag": 0.1, "price_volatility": 0.25}
\.


--
-- Name: ais_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: urjakavach
--

SELECT pg_catalog.setval('public.ais_snapshots_id_seq', 20, true);


--
-- Name: gdelt_articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: urjakavach
--

SELECT pg_catalog.setval('public.gdelt_articles_id_seq', 126, true);


--
-- Name: geopolitical_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: urjakavach
--

SELECT pg_catalog.setval('public.geopolitical_alerts_id_seq', 42, true);


--
-- Name: price_points_id_seq; Type: SEQUENCE SET; Schema: public; Owner: urjakavach
--

SELECT pg_catalog.setval('public.price_points_id_seq', 68, true);


--
-- Name: risk_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: urjakavach
--

SELECT pg_catalog.setval('public.risk_scores_id_seq', 118, true);


--
-- Name: scenario_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: urjakavach
--

SELECT pg_catalog.setval('public.scenario_runs_id_seq', 14, true);


--
-- Name: security_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: urjakavach
--

SELECT pg_catalog.setval('public.security_audit_logs_id_seq', 89, true);


--
-- Name: ais_snapshots ais_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.ais_snapshots
    ADD CONSTRAINT ais_snapshots_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: edges edges_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.edges
    ADD CONSTRAINT edges_pkey PRIMARY KEY (id);


--
-- Name: gdelt_articles gdelt_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.gdelt_articles
    ADD CONSTRAINT gdelt_articles_pkey PRIMARY KEY (id);


--
-- Name: geopolitical_alerts geopolitical_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.geopolitical_alerts
    ADD CONSTRAINT geopolitical_alerts_pkey PRIMARY KEY (id);


--
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);


--
-- Name: price_points price_points_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.price_points
    ADD CONSTRAINT price_points_pkey PRIMARY KEY (id);


--
-- Name: risk_scores risk_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.risk_scores
    ADD CONSTRAINT risk_scores_pkey PRIMARY KEY (id);


--
-- Name: scenario_runs scenario_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.scenario_runs
    ADD CONSTRAINT scenario_runs_pkey PRIMARY KEY (id);


--
-- Name: scenarios scenarios_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.scenarios
    ADD CONSTRAINT scenarios_pkey PRIMARY KEY (id);


--
-- Name: security_audit_logs security_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.security_audit_logs
    ADD CONSTRAINT security_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: gdelt_articles uq_gdelt_articles_url; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.gdelt_articles
    ADD CONSTRAINT uq_gdelt_articles_url UNIQUE (url);


--
-- Name: price_points uq_price_points_series_period; Type: CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.price_points
    ADD CONSTRAINT uq_price_points_series_period UNIQUE (series, period);


--
-- Name: ix_ais_snapshots_bounding_box; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_ais_snapshots_bounding_box ON public.ais_snapshots USING btree (bounding_box);


--
-- Name: ix_ais_snapshots_bounding_box_captured_at; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_ais_snapshots_bounding_box_captured_at ON public.ais_snapshots USING btree (bounding_box, captured_at);


--
-- Name: ix_gdelt_articles_corridor; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_gdelt_articles_corridor ON public.gdelt_articles USING btree (corridor);


--
-- Name: ix_gdelt_articles_corridor_fetched_at; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_gdelt_articles_corridor_fetched_at ON public.gdelt_articles USING btree (corridor, fetched_at);


--
-- Name: ix_geopolitical_alerts_corridor; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_geopolitical_alerts_corridor ON public.geopolitical_alerts USING btree (corridor);


--
-- Name: ix_geopolitical_alerts_corridor_triggered_at; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_geopolitical_alerts_corridor_triggered_at ON public.geopolitical_alerts USING btree (corridor, triggered_at);


--
-- Name: ix_price_points_series_period; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_price_points_series_period ON public.price_points USING btree (series, period);


--
-- Name: ix_risk_scores_corridor; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_risk_scores_corridor ON public.risk_scores USING btree (corridor);


--
-- Name: ix_risk_scores_corridor_computed_at; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_risk_scores_corridor_computed_at ON public.risk_scores USING btree (corridor, computed_at);


--
-- Name: ix_scenario_runs_scenario_id; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_scenario_runs_scenario_id ON public.scenario_runs USING btree (scenario_id);


--
-- Name: ix_scenario_runs_scenario_id_run_at; Type: INDEX; Schema: public; Owner: urjakavach
--

CREATE INDEX ix_scenario_runs_scenario_id_run_at ON public.scenario_runs USING btree (scenario_id, run_at);


--
-- Name: edges edges_from_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.edges
    ADD CONSTRAINT edges_from_node_id_fkey FOREIGN KEY (from_node_id) REFERENCES public.nodes(id);


--
-- Name: edges edges_to_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.edges
    ADD CONSTRAINT edges_to_node_id_fkey FOREIGN KEY (to_node_id) REFERENCES public.nodes(id);


--
-- Name: scenario_runs scenario_runs_scenario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: urjakavach
--

ALTER TABLE ONLY public.scenario_runs
    ADD CONSTRAINT scenario_runs_scenario_id_fkey FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: urjakavach
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict eTT192CfbOncKxHGyJbMg8XwbTQPWbjq2JGZhfhg5Ti8WD0NJxYPx2oQA4OtsLc

