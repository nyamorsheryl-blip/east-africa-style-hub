-- MaeLove schema snapshot, rebuilt from the live database on 2026-11-24.
-- Structure only (no customer data). Function privileges appear as '-- ACL' comments.

CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'admin');

CREATE TABLE public.addresses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  label text DEFAULT 'Home'::text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  city text NOT NULL,
  county text,
  notes text,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.boutiques (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  country text DEFAULT 'Kenya'::text NOT NULL,
  city text,
  verified boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  seller_type text DEFAULT 'retail'::text NOT NULL,
  verified_at timestamp with time zone,
  suspended_at timestamp with time zone,
  seller_agreement_accepted_at timestamp with time zone,
  seller_agreement_version text
);

CREATE TABLE public.cart_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  size text DEFAULT ''::text NOT NULL,
  color text DEFAULT ''::text NOT NULL
);

CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  emoji text,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.commission_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  commission_bps integer NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.commission_promotions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  rate_bps integer NOT NULL,
  applies_to text NOT NULL,
  category_id uuid,
  boutique_id uuid,
  new_seller_days integer,
  starts_at timestamp with time zone DEFAULT now() NOT NULL,
  ends_at timestamp with time zone,
  active boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.commission_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  boutique_id uuid,
  seller_id uuid NOT NULL,
  category_id uuid,
  promotion_id uuid,
  rate_bps integer NOT NULL,
  gross_cents bigint NOT NULL,
  commission_cents bigint NOT NULL,
  seller_net_cents bigint NOT NULL,
  refunded_gross_cents bigint DEFAULT 0 NOT NULL,
  currency text DEFAULT 'KES'::text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  finalized_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.conversations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  boutique_id uuid,
  last_message_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.coupons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  code text NOT NULL,
  discount_type text NOT NULL,
  discount_value integer NOT NULL,
  max_uses integer,
  used_count integer DEFAULT 0 NOT NULL,
  expires_at timestamp with time zone,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.currencies (
  code text NOT NULL,
  name text NOT NULL,
  symbol text,
  active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 100 NOT NULL
);

CREATE TABLE public.delivery_agents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  vehicle_type text,
  phone text,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.delivery_options (
  id text NOT NULL,
  label text NOT NULL,
  description text,
  fee_cents integer NOT NULL,
  currency text DEFAULT 'USD'::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.exchange_rates (
  currency_code text NOT NULL,
  rate_per_usd numeric(24,8) NOT NULL,
  source text DEFAULT 'manual'::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.ledger_entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  idempotency_key text NOT NULL,
  entry_type text NOT NULL,
  account text NOT NULL,
  amount_cents bigint NOT NULL,
  currency text DEFAULT 'KES'::text NOT NULL,
  order_id uuid,
  order_item_id uuid,
  commission_record_id uuid,
  payout_id uuid,
  boutique_id uuid,
  seller_id uuid,
  note text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  kind text DEFAULT 'text'::text NOT NULL,
  body text,
  image_url text,
  voice_url text,
  voice_seconds integer,
  product_id uuid,
  order_id uuid,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  related_order_id uuid,
  read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  email_status text,
  emailed_at timestamp with time zone
);

CREATE TABLE public.order_delivery_codes (
  order_id uuid NOT NULL,
  code text NOT NULL,
  used_at timestamp with time zone,
  used_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.order_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  title text NOT NULL,
  unit_price_cents integer NOT NULL,
  quantity integer NOT NULL,
  image_url text,
  size text DEFAULT ''::text NOT NULL,
  color text DEFAULT ''::text NOT NULL
);

CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  buyer_id uuid NOT NULL,
  total_cents integer DEFAULT 0 NOT NULL,
  currency text DEFAULT 'USD'::text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  shipping_address jsonb,
  created_at timestamp with time zone DEFAULT now(),
  tracking_number text,
  carrier text,
  status_updated_at timestamp with time zone DEFAULT now() NOT NULL,
  delivery_agent_id uuid,
  delivery_status text,
  payment_status text DEFAULT 'unpaid'::text NOT NULL,
  coupon_code text,
  discount_cents integer DEFAULT 0 NOT NULL,
  subtotal_cents integer DEFAULT 0 NOT NULL,
  delivery_fee_cents integer DEFAULT 0 NOT NULL,
  delivery_option text
);

CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  phone text NOT NULL,
  method text DEFAULT 'mpesa'::text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  merchant_request_id text,
  checkout_request_id text,
  mpesa_receipt_number text,
  result_desc text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  mpesa_amount_kes integer
);

CREATE TABLE public.payouts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  boutique_id uuid,
  recipient_phone text NOT NULL,
  amount_kes integer NOT NULL,
  reason text,
  status text DEFAULT 'pending'::text NOT NULL,
  initiated_by uuid,
  conversation_id text,
  originator_conversation_id text,
  transaction_id text,
  result_code integer,
  result_desc text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.platform_settings (
  key text NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  boutique_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  category text DEFAULT 'Women'::text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  sale_price_cents integer,
  currency text DEFAULT 'USD'::text NOT NULL,
  images text[] DEFAULT '{}'::text[] NOT NULL,
  sizes text[] DEFAULT '{}'::text[] NOT NULL,
  colors text[] DEFAULT '{}'::text[] NOT NULL,
  materials text,
  stock integer DEFAULT 0 NOT NULL,
  published boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_front text,
  image_back text,
  image_side text,
  image_flatlay text,
  avg_rating numeric(2,1) DEFAULT 0 NOT NULL,
  review_count integer DEFAULT 0 NOT NULL,
  condition text DEFAULT 'new'::text NOT NULL,
  commission_category_id uuid,
  video_url text
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  username text,
  avatar_url text,
  role text DEFAULT 'shopper'::text NOT NULL,
  country text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  notification_prefs jsonb DEFAULT '{"promotions": true, "order_updates": true}'::jsonb NOT NULL,
  deletion_requested_at timestamp with time zone,
  is_seller boolean DEFAULT false NOT NULL,
  is_delivery boolean DEFAULT false NOT NULL,
  preferred_currency text,
  suspended_at timestamp with time zone,
  suspended_reason text
);

CREATE TABLE public.returns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_item_id uuid NOT NULL,
  order_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'requested'::text NOT NULL,
  resolution_note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  order_item_id uuid,
  rating integer NOT NULL,
  title text,
  body text,
  verified_purchase boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.rider_earnings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  currency text DEFAULT 'KES'::text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  payout_ref text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  paid_at timestamp with time zone
);

CREATE TABLE public.support_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  from_staff boolean DEFAULT false NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.wishlist (
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.boutiques ADD CONSTRAINT boutiques_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.boutiques ADD CONSTRAINT boutiques_seller_type_check CHECK ((seller_type = ANY (ARRAY['thrift'::text, 'wholesale'::text, 'retail'::text])));

ALTER TABLE ONLY public.boutiques ADD CONSTRAINT boutiques_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0));

ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_user_id_product_id_key UNIQUE (user_id, product_id);

ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.commission_categories ADD CONSTRAINT commission_categories_commission_bps_check CHECK (((commission_bps >= 0) AND (commission_bps <= 10000)));

ALTER TABLE ONLY public.commission_categories ADD CONSTRAINT commission_categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.commission_categories ADD CONSTRAINT commission_categories_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_applies_to_check CHECK ((applies_to = ANY (ARRAY['all_sellers'::text, 'new_sellers'::text, 'category'::text, 'boutique'::text])));

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_check CHECK (((applies_to <> 'category'::text) OR (category_id IS NOT NULL)));

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_check1 CHECK (((applies_to <> 'boutique'::text) OR (boutique_id IS NOT NULL)));

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_check2 CHECK (((applies_to <> 'new_sellers'::text) OR (new_seller_days IS NOT NULL)));

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_new_seller_days_check CHECK (((new_seller_days IS NULL) OR (new_seller_days > 0)));

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_rate_bps_check CHECK (((rate_bps >= 0) AND (rate_bps <= 10000)));

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_check CHECK (((seller_net_cents + commission_cents) = gross_cents));

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_commission_cents_check CHECK ((commission_cents >= 0));

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_currency_check CHECK ((currency = 'KES'::text));

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_gross_cents_check CHECK ((gross_cents >= 0));

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_order_item_id_key UNIQUE (order_item_id);

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_refunded_gross_cents_check CHECK ((refunded_gross_cents >= 0));

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'finalized'::text, 'reversed'::text, 'partially_reversed'::text, 'void'::text])));

ALTER TABLE ONLY public.conversations ADD CONSTRAINT conversations_buyer_id_seller_id_key UNIQUE (buyer_id, seller_id);

ALTER TABLE ONLY public.conversations ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])));

ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_discount_value_check CHECK ((discount_value > 0));

ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_max_uses_check CHECK (((max_uses IS NULL) OR (max_uses > 0)));

ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.currencies ADD CONSTRAINT currencies_code_check CHECK ((code ~ '^[A-Z]{3}$'::text));

ALTER TABLE ONLY public.currencies ADD CONSTRAINT currencies_pkey PRIMARY KEY (code);

ALTER TABLE ONLY public.delivery_agents ADD CONSTRAINT delivery_agents_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.delivery_agents ADD CONSTRAINT delivery_agents_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.delivery_options ADD CONSTRAINT delivery_options_fee_cents_check CHECK ((fee_cents >= 0));

ALTER TABLE ONLY public.delivery_options ADD CONSTRAINT delivery_options_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.exchange_rates ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (currency_code);

ALTER TABLE ONLY public.exchange_rates ADD CONSTRAINT exchange_rates_rate_per_usd_check CHECK ((rate_per_usd > (0)::numeric));

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_account_check CHECK ((account = ANY (ARRAY['seller_payable'::text, 'seller_payout'::text, 'platform_commission'::text, 'delivery_payable'::text, 'processing_fee'::text, 'customer_refund'::text])));

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_currency_check CHECK ((currency = 'KES'::text));

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_idempotency_key_key UNIQUE (idempotency_key);

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_kind_check CHECK ((kind = ANY (ARRAY['text'::text, 'image'::text, 'voice'::text, 'product'::text, 'order'::text])));

ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_delivery_codes ADD CONSTRAINT order_delivery_codes_code_key UNIQUE (code);

ALTER TABLE ONLY public.order_delivery_codes ADD CONSTRAINT order_delivery_codes_pkey PRIMARY KEY (order_id);

ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_quantity_check CHECK ((quantity > 0));

ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'paid'::text, 'failed'::text])));

ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_amount_cents_check CHECK ((amount_cents >= 0));

ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_checkout_request_id_key UNIQUE (checkout_request_id);

ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])));

ALTER TABLE ONLY public.payouts ADD CONSTRAINT payouts_amount_kes_check CHECK ((amount_kes > 0));

ALTER TABLE ONLY public.payouts ADD CONSTRAINT payouts_originator_conversation_id_key UNIQUE (originator_conversation_id);

ALTER TABLE ONLY public.payouts ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payouts ADD CONSTRAINT payouts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])));

ALTER TABLE ONLY public.platform_settings ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.products ADD CONSTRAINT products_condition_check CHECK ((condition = ANY (ARRAY['new'::text, 'pre-loved'::text, 'vintage'::text])));

ALTER TABLE ONLY public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products ADD CONSTRAINT products_price_cents_check CHECK ((price_cents >= 0));

ALTER TABLE ONLY public.products ADD CONSTRAINT products_sale_price_cents_check CHECK (((sale_price_cents IS NULL) OR (sale_price_cents >= 0)));

ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);

ALTER TABLE ONLY public.returns ADD CONSTRAINT returns_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_product_id_user_id_key UNIQUE (product_id, user_id);

ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

ALTER TABLE ONLY public.rider_earnings ADD CONSTRAINT rider_earnings_amount_cents_check CHECK ((amount_cents >= 0));

ALTER TABLE ONLY public.rider_earnings ADD CONSTRAINT rider_earnings_order_id_key UNIQUE (order_id);

ALTER TABLE ONLY public.rider_earnings ADD CONSTRAINT rider_earnings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rider_earnings ADD CONSTRAINT rider_earnings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])));

ALTER TABLE ONLY public.support_messages ADD CONSTRAINT support_messages_body_check CHECK (((char_length(btrim(body)) >= 1) AND (char_length(btrim(body)) <= 2000)));

ALTER TABLE ONLY public.support_messages ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_pkey PRIMARY KEY (user_id, product_id);

ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.audit_log ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.boutiques ADD CONSTRAINT boutiques_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.commission_promotions ADD CONSTRAINT commission_promotions_category_id_fkey FOREIGN KEY (category_id) REFERENCES commission_categories(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES boutiques(id);

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_category_id_fkey FOREIGN KEY (category_id) REFERENCES commission_categories(id);

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES order_items(id);

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES commission_promotions(id);

ALTER TABLE ONLY public.commission_records ADD CONSTRAINT commission_records_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.conversations ADD CONSTRAINT conversations_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.conversations ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.conversations ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.delivery_agents ADD CONSTRAINT delivery_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.delivery_options ADD CONSTRAINT delivery_options_currency_fkey FOREIGN KEY (currency) REFERENCES currencies(code);

ALTER TABLE ONLY public.exchange_rates ADD CONSTRAINT exchange_rates_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES currencies(code);

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES boutiques(id);

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_commission_record_id_fkey FOREIGN KEY (commission_record_id) REFERENCES commission_records(id);

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES order_items(id);

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_payout_id_fkey FOREIGN KEY (payout_id) REFERENCES payouts(id);

ALTER TABLE ONLY public.ledger_entries ADD CONSTRAINT ledger_entries_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_related_order_id_fkey FOREIGN KEY (related_order_id) REFERENCES orders(id);

ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_delivery_codes ADD CONSTRAINT order_delivery_codes_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_delivery_agent_id_fkey FOREIGN KEY (delivery_agent_id) REFERENCES delivery_agents(id);

ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.payouts ADD CONSTRAINT payouts_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.payouts ADD CONSTRAINT payouts_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.products ADD CONSTRAINT products_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.products ADD CONSTRAINT products_commission_category_id_fkey FOREIGN KEY (commission_category_id) REFERENCES commission_categories(id);

ALTER TABLE ONLY public.products ADD CONSTRAINT products_currency_fkey FOREIGN KEY (currency) REFERENCES currencies(code);

ALTER TABLE ONLY public.products ADD CONSTRAINT products_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_preferred_currency_fkey FOREIGN KEY (preferred_currency) REFERENCES currencies(code);

ALTER TABLE ONLY public.returns ADD CONSTRAINT returns_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.returns ADD CONSTRAINT returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.returns ADD CONSTRAINT returns_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.returns ADD CONSTRAINT returns_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rider_earnings ADD CONSTRAINT rider_earnings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES delivery_agents(id);

ALTER TABLE ONLY public.rider_earnings ADD CONSTRAINT rider_earnings_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.support_messages ADD CONSTRAINT support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.support_messages ADD CONSTRAINT support_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX addresses_user_idx ON public.addresses USING btree (user_id);

CREATE INDEX boutiques_seller_type_idx ON public.boutiques USING btree (seller_type);

CREATE UNIQUE INDEX cart_items_user_product_variant_key ON public.cart_items USING btree (user_id, product_id, size, color);

CREATE INDEX commission_records_order_idx ON public.commission_records USING btree (order_id);

CREATE INDEX commission_records_seller_idx ON public.commission_records USING btree (seller_id);

CREATE INDEX conversations_buyer_idx ON public.conversations USING btree (buyer_id);

CREATE INDEX conversations_seller_idx ON public.conversations USING btree (seller_id);

CREATE UNIQUE INDEX coupons_seller_code_idx ON public.coupons USING btree (seller_id, upper(code));

CREATE INDEX idx_cart_items_user ON public.cart_items USING btree (user_id);

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);

CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer_id);

CREATE INDEX idx_products_boutique ON public.products USING btree (boutique_id);

CREATE INDEX idx_products_category ON public.products USING btree (category);

CREATE INDEX idx_products_owner ON public.products USING btree (owner_id);

CREATE INDEX idx_products_published ON public.products USING btree (published);

CREATE INDEX idx_returns_buyer ON public.returns USING btree (buyer_id, created_at DESC);

CREATE INDEX idx_returns_seller ON public.returns USING btree (seller_id, created_at DESC);

CREATE INDEX ledger_entries_order_idx ON public.ledger_entries USING btree (order_id);

CREATE INDEX ledger_entries_seller_idx ON public.ledger_entries USING btree (seller_id, account);

CREATE INDEX messages_conversation_idx ON public.messages USING btree (conversation_id, created_at);

CREATE INDEX payments_checkout_request_id_idx ON public.payments USING btree (checkout_request_id);

CREATE UNIQUE INDEX payments_mpesa_receipt_unique ON public.payments USING btree (mpesa_receipt_number) WHERE (mpesa_receipt_number IS NOT NULL);

CREATE INDEX payments_order_id_idx ON public.payments USING btree (order_id);

CREATE INDEX payouts_boutique_idx ON public.payouts USING btree (boutique_id);

CREATE INDEX payouts_status_idx ON public.payouts USING btree (status);

CREATE INDEX products_condition_idx ON public.products USING btree (condition);

CREATE INDEX reviews_product_id_idx ON public.reviews USING btree (product_id);

CREATE INDEX reviews_user_id_idx ON public.reviews USING btree (user_id);

CREATE INDEX rider_earnings_agent_idx ON public.rider_earnings USING btree (agent_id, created_at DESC);

CREATE INDEX support_messages_thread_idx ON public.support_messages USING btree (user_id, created_at);

CREATE OR REPLACE FUNCTION public.addresses_single_default()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.is_default then
    update public.addresses set is_default = false
     where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_set_suspension(p_user uuid, p_suspend boolean, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admins only';
  end if;
  if p_user = auth.uid() then raise exception 'You cannot suspend yourself'; end if;
  update public.profiles
     set suspended_at = case when p_suspend then now() else null end,
         suspended_reason = case when p_suspend then nullif(btrim(coalesce(p_reason, '')), '') else null end
   where id = p_user;
  update public.boutiques
     set suspended_at = case when p_suspend then now() else null end
   where owner_id = p_user;
  if p_suspend then
    update public.products set published = false where owner_id = p_user and published;
  end if;
  insert into public.audit_log (actor_id, action, target_table, target_id, details)
  values (auth.uid(), case when p_suspend then 'suspend_user' else 'reactivate_user' end,
          'profiles', p_user::text, jsonb_build_object('reason', nullif(btrim(coalesce(p_reason, '')), '')));
end $function$
;

CREATE OR REPLACE FUNCTION public.auto_assign_delivery_agent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  agent_id uuid;
begin
  if new.status = 'shipped' and old.status is distinct from new.status and new.delivery_agent_id is null then
    select id into agent_id from delivery_agents where active = true order by random() limit 1;
    if agent_id is not null then
      new.delivery_agent_id := agent_id;
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.block_suspended_buyer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if exists (select 1 from public.profiles where id = new.buyer_id and suspended_at is not null) then
    raise exception 'Your account is suspended. Please contact support.';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.block_suspended_seller_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.published and exists (
    select 1 from public.boutiques b where b.owner_id = new.owner_id and b.suspended_at is not null
  ) then
    raise exception 'Your boutique is suspended. Please contact support.';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.buyer_owns_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from orders
    where id = p_order_id and buyer_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_delivery(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_agent uuid;
  v_code public.order_delivery_codes%rowtype;
  v_order public.orders%rowtype;
  v_fee int;
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  select id into v_agent from public.delivery_agents where user_id = auth.uid() and active = true;
  if v_agent is null then raise exception 'Only active delivery partners can confirm deliveries'; end if;

  select * into v_code from public.order_delivery_codes
   where code = upper(regexp_replace(coalesce(p_code, ''), '^MLV:', '', 'i')) and used_at is null
   for update;
  if not found then raise exception 'Invalid or already used code'; end if;

  select * into v_order from public.orders where id = v_code.order_id for update;
  if v_order.delivery_agent_id is distinct from v_agent then raise exception 'This order is not assigned to you'; end if;
  if v_order.payment_status is distinct from 'paid' then raise exception 'This order has not been paid'; end if;
  if v_order.delivery_status = 'delivered' then raise exception 'This order is already delivered'; end if;

  perform set_config('maelove.qr_confirm', 'on', true);
  update public.orders set delivery_status = 'delivered' where id = v_order.id;
  update public.order_delivery_codes set used_at = now(), used_by = auth.uid() where order_id = v_order.id;

  v_fee := coalesce(v_order.delivery_fee_cents, 0);
  insert into public.rider_earnings (order_id, agent_id, amount_cents, currency)
  values (v_order.id, v_agent, v_fee, coalesce(v_order.currency, 'KES'))
  on conflict (order_id) do nothing;

  return jsonb_build_object('order_id', v_order.id, 'earned_cents', v_fee, 'currency', coalesce(v_order.currency, 'KES'));
end $function$
;

CREATE OR REPLACE FUNCTION public.convert_cents(p_amount_cents bigint, p_from text, p_to text)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when p_from = p_to then p_amount_cents
    else round(
      p_amount_cents::numeric
      * (select rate_per_usd from public.exchange_rates where currency_code = p_to)
      / (select rate_per_usd from public.exchange_rates where currency_code = p_from)
    )::bigint
  end
$function$
;

CREATE OR REPLACE FUNCTION public.create_delivery_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.order_delivery_codes (order_id, code)
  values (new.id, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)))
  on conflict do nothing;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.decrement_product_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update products
  set stock = greatest(0, stock - NEW.quantity)
  where id = NEW.product_id;
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.effective_commission(p_boutique_id uuid, p_category_id uuid, p_at timestamp with time zone DEFAULT now())
 RETURNS TABLE(rate_bps integer, base_rate_bps integer, promotion_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with base as (
    select coalesce(
      (select commission_bps from public.commission_categories where id = p_category_id),
      (select commission_bps from public.commission_categories where slug = 'other')
    ) as bps
  ),
  promo as (
    select pr.id, pr.rate_bps
    from public.commission_promotions pr
    left join public.boutiques b on b.id = p_boutique_id
    where pr.active
      and pr.starts_at <= p_at
      and (pr.ends_at is null or pr.ends_at > p_at)
      and (
        pr.applies_to = 'all_sellers'
        or (pr.applies_to = 'category' and pr.category_id = p_category_id)
        or (pr.applies_to = 'boutique' and pr.boutique_id = p_boutique_id)
        or (pr.applies_to = 'new_sellers' and b.created_at is not null
            and p_at < b.created_at + make_interval(days => pr.new_seller_days))
      )
    order by pr.rate_bps asc, pr.created_at asc
    limit 1
  )
  select
    least((select bps from base), coalesce((select rate_bps from promo), (select bps from base)))::integer,
    (select bps from base)::integer,
    case when (select rate_bps from promo) < (select bps from base)
         then (select id from promo) end
$function$
;

CREATE OR REPLACE FUNCTION public.guard_delivery_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.delivery_status = 'delivered' and old.delivery_status is distinct from 'delivered'
     and coalesce(current_setting('maelove.qr_confirm', true), '') <> 'on'
     and auth.uid() is not null
     and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Deliveries are confirmed by scanning the customer''s QR code';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_suspension_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_changed boolean;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then return new; end if;
  if tg_table_name = 'profiles' then
    if tg_op = 'INSERT' then
      v_changed := new.suspended_at is not null or new.suspended_reason is not null;
    else
      v_changed := new.suspended_at is distinct from old.suspended_at
                or new.suspended_reason is distinct from old.suspended_reason;
    end if;
  else
    if tg_op = 'INSERT' then
      v_changed := new.suspended_at is not null;
    else
      v_changed := new.suspended_at is distinct from old.suspended_at;
    end if;
  end if;
  if v_changed then raise exception 'Not allowed'; end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guess_commission_category(p_category text)
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select id from public.commission_categories
  where slug = case
    when p_category ilike '%women%' then 'womens-clothing'
    when p_category ilike '%men%' then 'mens-clothing'
    when p_category ilike '%shoe%' or p_category ilike '%footwear%' or p_category ilike '%sneaker%' then 'shoes-footwear'
    when p_category ilike '%bag%' or p_category ilike '%accessor%' or p_category ilike '%jewel%' then 'bags-accessories'
    when p_category ilike '%beauty%' or p_category ilike '%cosmetic%' or p_category ilike '%skin%' then 'beauty-personal-care'
    when p_category ilike '%electronic%' or p_category ilike '%gadget%' then 'electronics-gadgets'
    when p_category ilike '%home%' or p_category ilike '%decor%' or p_category ilike '%living%' then 'home-living'
    when p_category ilike '%food%' or p_category ilike '%snack%' then 'food-snacks'
    when p_category ilike '%book%' or p_category ilike '%stationery%' then 'books-stationery'
    when p_category ilike '%handmade%' or p_category ilike '%craft%' then 'handmade-crafts'
    when p_category ilike '%sport%' or p_category ilike '%fitness%' then 'sports-fitness'
    else null end
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  account_type text;
  v_name text;
  v_username text;
begin
  account_type := coalesce(new.raw_user_meta_data->>'account_type', 'shopper');
  if account_type not in ('shopper', 'seller', 'both') then
    account_type := 'shopper';
  end if;

  v_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name');
  v_username := nullif(new.raw_user_meta_data->>'username', '');

  -- Google sign-ins have no username: derive one from the email, plus a short unique suffix
  if v_username is null then
    v_username := lower(regexp_replace(split_part(coalesce(new.email, 'user'), '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    if length(v_username) < 3 then
      v_username := 'user';
    end if;
    v_username := left(v_username, 20) || substr(md5(new.id::text), 1, 4);
  end if;

  insert into public.profiles (id, full_name, username, role)
  values (new.id, v_name, v_username, account_type)
  on conflict (id) do update set
    role = excluded.role,
    updated_at = now();

  if account_type = 'seller' then
    insert into public.user_roles (user_id, role) values (new.id, 'seller')
    on conflict (user_id, role) do nothing;
  elsif account_type = 'both' then
    insert into public.user_roles (user_id, role) values (new.id, 'buyer')
    on conflict (user_id, role) do nothing;
    insert into public.user_roles (user_id, role) values (new.id, 'seller')
    on conflict (user_id, role) do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'buyer')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT EXISTS (
SELECT 1 FROM public.user_roles
WHERE user_id = _user_id AND role = _role
);
$function$
;

CREATE OR REPLACE FUNCTION public.log_commission_rate_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.commission_bps is distinct from old.commission_bps then
    insert into public.audit_log (actor_id, action, target_table, target_id, details)
    values (auth.uid(), 'update_commission_rate', 'commission_categories', new.id::text,
            jsonb_build_object('slug', new.slug, 'old_bps', old.commission_bps, 'new_bps', new.commission_bps));
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  c conversations%rowtype;
  v_recipient uuid;
  v_sender_name text;
  v_preview text;
begin
  select * into c from conversations where id = new.conversation_id;
  if not found then
    return new;
  end if;

  if new.sender_id = c.buyer_id then
    v_recipient := c.seller_id;
    select coalesce(nullif(full_name, ''), nullif(username, ''), 'A customer')
      into v_sender_name from profiles where id = c.buyer_id;
  else
    v_recipient := c.buyer_id;
    select name into v_sender_name from boutiques where id = c.boutique_id;
  end if;

  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  v_preview := left(
    case new.kind
      when 'image' then 'Sent a photo'
      when 'voice' then 'Sent a voice message'
      when 'product' then 'Shared a product'
      when 'order' then 'Shared an order'
      else coalesce(nullif(new.body, ''), 'New message')
    end, 140);

  insert into notifications (user_id, type, title, body)
  values (v_recipient, 'message', 'New message from ' || coalesce(v_sender_name, 'MaeLove'), v_preview);

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_summary text;
  v_total text;
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    select string_agg(quantity || ' x ' || title, ', ' order by title)
      into v_summary from order_items where order_id = new.id;
    v_total := coalesce(new.currency, 'KES') || ' ' || to_char(new.total_cents / 100.0, 'FM999,999,990.00');

    insert into notifications (user_id, type, title, body, related_order_id)
    values (
      new.buyer_id,
      'order_confirmed',
      'Order confirmed - #' || upper(left(new.id::text, 8)),
      coalesce(v_summary, 'Your items') || '. Total ' || v_total || '. We will let you know when it ships.',
      new.id
    );

    insert into notifications (user_id, type, title, body, related_order_id)
    select oi.seller_id, 'new_order', 'New order received',
           'You have a new paid order for ' || string_agg(oi.title, ', ' order by oi.title),
           new.id
    from order_items oi
    where oi.order_id = new.id and oi.seller_id is not null
    group by oi.seller_id;
  elsif new.status is distinct from old.status then
    insert into notifications (user_id, type, title, body, related_order_id)
    values (
      new.buyer_id,
      'order_status',
      'Order ' || new.status,
      'Your order is now ' || new.status,
      new.id
    );
  end if;

  if new.status is distinct from old.status and new.delivery_agent_id is not null then
    insert into notifications (user_id, type, title, body, related_order_id)
    select da.user_id, 'delivery_assigned', 'Order status update',
           'Order ' || new.id || ' is now ' || new.status, new.id
    from delivery_agents da where da.id = new.delivery_agent_id;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_return_resolved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected', 'refunded') then
    insert into notifications (user_id, type, title, body, related_order_id)
    values (
      new.buyer_id,
      'return_resolved',
      'Return ' || new.status,
      coalesce(new.resolution_note, 'Your return has been ' || new.status),
      new.order_id
    );
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_return_submitted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into notifications (user_id, type, title, body, related_order_id)
  values (
    new.seller_id,
    'return_submitted',
    'Return requested',
    'A buyer requested a return: ' || new.reason,
    new.order_id
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_seller_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into notifications (user_id, type, title, body, related_order_id)
  values (
    new.seller_id,
    'new_order',
    'New order received',
    'You have a new order for ' || new.title,
    new.order_id
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.order_is_paid(p_order_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select payment_status = 'paid' from orders where id = p_order_id), false);
$function$
;

CREATE OR REPLACE FUNCTION public.place_order(p_items jsonb, p_delivery_option text, p_coupon_code text, p_shipping jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_buyer uuid := auth.uid();
  v_order_id uuid;
  v_opt public.delivery_options%rowtype;
  v_req record;
  v_prod public.products%rowtype;
  v_unit bigint;
  v_image text;
  v_subtotal bigint := 0;
  v_discount bigint := 0;
  v_fee bigint := 0;
  v_total bigint;
  v_sellers uuid[];
  v_cpn record;
  v_seller_sub bigint;
  v_d bigint;
  v_disc jsonb := '{}'::jsonb;
  v_code text := nullif(btrim(coalesce(p_coupon_code, '')), '');
  v_applied_code text := null;
  v_seller uuid;
  v_item record;
  v_n integer;
  v_i integer;
  v_remaining bigint;
  v_alloc bigint;
  v_gross bigint;
  v_q record;
begin
  if v_buyer is null then raise exception 'Please sign in to place an order'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'Too many items in one order'; end if;
  if p_shipping is null or jsonb_typeof(p_shipping) <> 'object' then
    raise exception 'Delivery details are required';
  end if;

  select * into v_opt from public.delivery_options where id = p_delivery_option and active;
  if not found then raise exception 'Please choose a delivery option'; end if;

  insert into public.orders (buyer_id, currency, shipping_address)
  values (v_buyer, 'KES', p_shipping)
  returning id into v_order_id;

  -- Items: prices come from the products table, never from the browser
  for v_req in
    select (e ->> 'product_id')::uuid as product_id, sum((e ->> 'quantity')::integer) as qty
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    if v_req.qty is null or v_req.qty < 1 or v_req.qty > 99 then
      raise exception 'Invalid quantity';
    end if;
    select * into v_prod from public.products where id = v_req.product_id and published;
    if not found then raise exception 'An item in your bag is no longer available'; end if;
    if v_prod.stock < v_req.qty then
      raise exception '% only has % left in stock', v_prod.title, v_prod.stock;
    end if;

    v_unit := public.convert_cents(coalesce(v_prod.sale_price_cents, v_prod.price_cents), v_prod.currency, 'KES');
    if v_unit is null or v_unit <= 0 then
      raise exception 'Prices are temporarily unavailable, please try again';
    end if;

    v_image := coalesce(v_prod.images[1], v_prod.image_front);
    insert into public.order_items (order_id, product_id, seller_id, title, unit_price_cents, quantity, image_url)
    values (v_order_id, v_prod.id, v_prod.owner_id, v_prod.title, v_unit, v_req.qty, v_image);
    v_subtotal := v_subtotal + v_unit * v_req.qty;
  end loop;

  -- Coupons: validated and redeemed here, discount per seller
  if v_code is not null then
    select array_agg(distinct seller_id) into v_sellers from public.order_items where order_id = v_order_id;
    for v_cpn in select * from public.validate_coupon(v_code, v_sellers) loop
      select coalesce(sum(unit_price_cents::bigint * quantity), 0) into v_seller_sub
      from public.order_items where order_id = v_order_id and seller_id = v_cpn.seller_id;

      if v_cpn.discount_type = 'percentage' then
        v_d := least(v_seller_sub, round(v_seller_sub * v_cpn.discount_value / 100.0));
      else
        -- fixed coupon amounts are stored in USD cents
        v_d := least(v_seller_sub, coalesce(public.convert_cents(v_cpn.discount_value, 'USD', 'KES'), 0));
      end if;

      if v_d > 0 and public.redeem_coupon(v_cpn.coupon_id) then
        v_discount := v_discount + v_d;
        v_disc := v_disc || jsonb_build_object(v_cpn.seller_id::text, v_d);
        v_applied_code := v_code;
      end if;
    end loop;
  end if;

  -- Commission records (pending until the order is completed)
  for v_seller in select distinct seller_id from public.order_items where order_id = v_order_id loop
    select coalesce(sum(unit_price_cents::bigint * quantity), 0), count(*)
      into v_seller_sub, v_n
    from public.order_items where order_id = v_order_id and seller_id = v_seller;

    v_d := coalesce((v_disc ->> v_seller::text)::bigint, 0);
    v_remaining := v_d;
    v_i := 0;

    for v_item in
      select oi.id, oi.unit_price_cents::bigint * oi.quantity as line,
             p.boutique_id, p.commission_category_id
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = v_order_id and oi.seller_id = v_seller
      order by oi.id
    loop
      v_i := v_i + 1;
      if v_i = v_n then
        v_alloc := v_remaining;
      elsif v_seller_sub > 0 then
        v_alloc := round(v_item.line::numeric * v_d / v_seller_sub);
      else
        v_alloc := 0;
      end if;
      v_remaining := v_remaining - v_alloc;
      v_gross := greatest(v_item.line - v_alloc, 0);

      select * into v_q
      from public.quote_commission(v_gross, v_item.boutique_id, v_item.commission_category_id, now());

      insert into public.commission_records (
        order_id, order_item_id, boutique_id, seller_id, category_id, promotion_id,
        rate_bps, gross_cents, commission_cents, seller_net_cents, status
      ) values (
        v_order_id, v_item.id, v_item.boutique_id, v_seller, v_item.commission_category_id, v_q.promotion_id,
        v_q.rate_bps, v_gross, v_q.commission_cents, v_q.seller_net_cents, 'pending'
      );
    end loop;
  end loop;

  -- Delivery fee is separate from product prices and from commission
  v_fee := coalesce(public.convert_cents(v_opt.fee_cents, v_opt.currency, 'KES'), 0);
  v_total := greatest(v_subtotal - v_discount, 0) + v_fee;

  update public.orders
  set total_cents = v_total,
      subtotal_cents = v_subtotal,
      discount_cents = v_discount,
      delivery_fee_cents = v_fee,
      delivery_option = v_opt.id,
      coupon_code = v_applied_code
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'currency', 'KES',
    'subtotal_cents', v_subtotal,
    'discount_cents', v_discount,
    'delivery_fee_cents', v_fee,
    'total_cents', v_total
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_ledger_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception 'ledger_entries is append-only: corrections must be new entries';
end $function$
;

CREATE OR REPLACE FUNCTION public.process_order_commissions(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order orders%rowtype;
  v_kes numeric;
  v_from numeric;
  v_fx numeric;
  v_coupon_seller uuid;
  v_base bigint;
begin
  select * into v_order from orders where id = p_order_id;
  if not found then
    return;
  end if;

  if v_order.status in ('cancelled', 'failed') then
    update commission_records set status = 'void'
    where order_id = p_order_id and status = 'pending';
    return;
  end if;

  if exists (select 1 from order_items where order_id = p_order_id)
     and not exists (select 1 from commission_records where order_id = p_order_id) then
    select rate_per_usd into v_kes from exchange_rates where currency_code = 'KES';
    select rate_per_usd into v_from from exchange_rates
      where currency_code = coalesce(v_order.currency, 'USD');
    if v_kes is null or v_from is null or v_from = 0 then
      raise warning 'process_order_commissions: missing FX rate, using fallback 130 KES per USD';
      v_fx := 130;
    else
      v_fx := v_kes / v_from;
    end if;

    if v_order.coupon_code is not null and v_order.discount_cents > 0 then
      select c.seller_id into v_coupon_seller
      from coupons c
      where upper(c.code) = upper(v_order.coupon_code)
        and c.seller_id in (select seller_id from order_items where order_id = p_order_id)
      limit 1;
    end if;

    select coalesce(sum(oi.unit_price_cents::bigint * oi.quantity), 0) into v_base
    from order_items oi
    where oi.order_id = p_order_id
      and (v_coupon_seller is null or oi.seller_id = v_coupon_seller);

    with lines as (
      select oi.id as item_id, oi.order_id, oi.seller_id, p.boutique_id, p.commission_category_id,
             oi.unit_price_cents::bigint * oi.quantity as line,
             (v_coupon_seller is null or oi.seller_id = v_coupon_seller) as eligible
      from order_items oi
      join products p on p.id = oi.product_id
      where oi.order_id = p_order_id
    ),
    net as (
      select l.*,
             greatest(0, l.line - case
               when l.eligible and v_base > 0 and v_order.discount_cents > 0
               then round(v_order.discount_cents::numeric * l.line / v_base)::bigint
               else 0 end) as net_amt
      from lines l
    )
    insert into commission_records
      (order_id, order_item_id, boutique_id, seller_id, category_id, promotion_id,
       rate_bps, gross_cents, commission_cents, seller_net_cents)
    select n.order_id, n.item_id, n.boutique_id, n.seller_id, n.commission_category_id,
           q.promotion_id, q.rate_bps, g.gross, q.commission_cents, q.seller_net_cents
    from net n
    cross join lateral (select round(n.net_amt::numeric * v_fx)::bigint as gross) g
    cross join lateral quote_commission(g.gross, n.boutique_id, n.commission_category_id, now()) q
    on conflict (order_item_id) do nothing;
  end if;

  if v_order.status in ('delivered', 'completed') and v_order.payment_status = 'paid' then
    with fin as (
      update commission_records
         set status = 'finalized', finalized_at = now()
       where order_id = p_order_id and status = 'pending'
      returning *
    )
    insert into ledger_entries
      (idempotency_key, entry_type, account, amount_cents, order_id, order_item_id,
       commission_record_id, boutique_id, seller_id, note)
    select 'finalize:' || id || ':seller_payable', 'sale_finalized', 'seller_payable',
           seller_net_cents, order_id, order_item_id, id, boutique_id, seller_id,
           'Seller earnings after commission'
      from fin
    union all
    select 'finalize:' || id || ':platform_commission', 'sale_finalized', 'platform_commission',
           commission_cents, order_id, order_item_id, id, boutique_id, seller_id,
           'Platform commission'
      from fin
    on conflict (idempotency_key) do nothing;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.quote_commission(p_gross_cents bigint, p_boutique_id uuid, p_category_id uuid, p_at timestamp with time zone DEFAULT now())
 RETURNS TABLE(rate_bps integer, base_rate_bps integer, promotion_id uuid, commission_cents bigint, seller_net_cents bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select e.rate_bps, e.base_rate_bps, e.promotion_id,
         ((p_gross_cents * e.rate_bps + 5000) / 10000)::bigint,
         p_gross_cents - ((p_gross_cents * e.rate_bps + 5000) / 10000)::bigint
  from public.effective_commission(p_boutique_id, p_category_id, p_at) e
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_coupon(p_coupon_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_updated integer;
begin
  update public.coupons
  set used_count = used_count + 1, updated_at = now()
  where id = p_coupon_id
    and active
    and (expires_at is null or expires_at > now())
    and (max_uses is null or used_count < max_uses);
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_product_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  target_product_id uuid;
begin
  target_product_id := coalesce(new.product_id, old.product_id);

  update public.products p
  set avg_rating = coalesce((
        select round(avg(r.rating)::numeric, 1)
        from public.reviews r
        where r.product_id = target_product_id
      ), 0),
      review_count = (
        select count(*) from public.reviews r where r.product_id = target_product_id
      )
  where p.id = target_product_id;

  return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reverse_commission_for_return()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r commission_records%rowtype;
begin
  -- Reverse on approval, or on refund if approval was skipped. Records that are
  -- already reversed are skipped below, so this can never count twice.
  if new.status not in ('approved', 'refunded') or old.status is not distinct from new.status then
    return new;
  end if;

  select * into r from commission_records where order_item_id = new.order_item_id for update;
  if not found or r.status not in ('pending', 'finalized') then
    return new;
  end if;

  update commission_records
     set status = 'reversed', refunded_gross_cents = r.gross_cents
   where id = r.id;

  if r.status = 'finalized' then
    insert into ledger_entries
      (idempotency_key, entry_type, account, amount_cents, order_id, order_item_id,
       commission_record_id, boutique_id, seller_id, note)
    values
      ('return:' || new.id || ':seller_payable', 'return_reversal', 'seller_payable',
       -r.seller_net_cents, r.order_id, r.order_item_id, r.id, r.boutique_id, r.seller_id,
       'Return processed: seller earnings reversed'),
      ('return:' || new.id || ':platform_commission', 'return_reversal', 'platform_commission',
       -r.commission_cents, r.order_id, r.order_item_id, r.id, r.boutique_id, r.seller_id,
       'Return processed: commission reversed'),
      ('return:' || new.id || ':customer_refund', 'return_reversal', 'customer_refund',
       r.gross_cents, r.order_id, r.order_item_id, r.id, r.boutique_id, r.seller_id,
       'Return processed: amount to refund customer')
    on conflict (idempotency_key) do nothing;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.seller_has_item_in_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from order_items
    where order_id = p_order_id and seller_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.set_review_verified_purchase()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  matched_order_item_id uuid;
begin
  select oi.id into matched_order_item_id
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.product_id = new.product_id
    and o.buyer_id = new.user_id
  order by o.created_at desc
  limit 1;

  new.verified_purchase := matched_order_item_id is not null;
  new.order_item_id := matched_order_item_id;
  new.updated_at := now();

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.support_messages_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not new.from_staff and (
    select count(*) from public.support_messages
     where user_id = new.user_id and not from_staff and created_at > now() - interval '1 minute'
  ) >= 10 then
    raise exception 'Please slow down and try again in a minute';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.sync_delivery_status_to_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.delivery_status = 'delivered' and old.delivery_status is distinct from new.delivery_status then
    new.status := 'delivered';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_process_order_commissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.process_order_commissions(new.id);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_products_default_commission_category()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.commission_category_id is null then
    new.commission_category_id := public.guess_commission_category(new.category);
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_seller_ids uuid[])
 RETURNS TABLE(seller_id uuid, coupon_id uuid, discount_type text, discount_value integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select c.seller_id, c.id, c.discount_type, c.discount_value
  from public.coupons c
  where upper(c.code) = upper(p_code)
    and c.seller_id = any (p_seller_ids)
    and c.active
    and (c.expires_at is null or c.expires_at > now())
    and (c.max_uses is null or c.used_count < c.max_uses);
$function$
;

-- ACL addresses_single_default(): {postgres=X/postgres,service_role=X/postgres}

-- ACL admin_set_suspension(p_user uuid, p_suspend boolean, p_reason text): {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL auto_assign_delivery_agent(): {postgres=X/postgres,service_role=X/postgres}

-- ACL block_suspended_buyer(): {postgres=X/postgres,service_role=X/postgres}

-- ACL block_suspended_seller_publish(): {postgres=X/postgres,service_role=X/postgres}

-- ACL buyer_owns_order(p_order_id uuid): {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL confirm_delivery(p_code text): {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL convert_cents(p_amount_cents bigint, p_from text, p_to text): {postgres=X/postgres,service_role=X/postgres}

-- ACL create_delivery_code(): {postgres=X/postgres,service_role=X/postgres}

-- ACL decrement_product_stock(): {postgres=X/postgres,service_role=X/postgres}

-- ACL effective_commission(p_boutique_id uuid, p_category_id uuid, p_at timestamp with time zone): {postgres=X/postgres,service_role=X/postgres}

-- ACL guard_delivery_confirmation(): {postgres=X/postgres,service_role=X/postgres}

-- ACL guard_suspension_columns(): {postgres=X/postgres,service_role=X/postgres}

-- ACL guess_commission_category(p_category text): {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL handle_new_user(): {postgres=X/postgres,service_role=X/postgres}

-- ACL has_role(_user_id uuid, _role app_role): {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}

-- ACL log_commission_rate_change(): {postgres=X/postgres,service_role=X/postgres}

-- ACL notify_on_new_message(): {postgres=X/postgres,service_role=X/postgres}

-- ACL notify_order_status_change(): {postgres=X/postgres,service_role=X/postgres}

-- ACL notify_return_resolved(): {postgres=X/postgres,service_role=X/postgres}

-- ACL notify_return_submitted(): {postgres=X/postgres,service_role=X/postgres}

-- ACL notify_seller_new_order(): {postgres=X/postgres,service_role=X/postgres}

-- ACL order_is_paid(p_order_id uuid): {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL place_order(p_items jsonb, p_delivery_option text, p_coupon_code text, p_shipping jsonb): {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL prevent_ledger_mutation(): {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL process_order_commissions(p_order_id uuid): {postgres=X/postgres,service_role=X/postgres}

-- ACL quote_commission(p_gross_cents bigint, p_boutique_id uuid, p_category_id uuid, p_at timestamp with time zone): {postgres=X/postgres,service_role=X/postgres}

-- ACL redeem_coupon(p_coupon_id uuid): {postgres=X/postgres,service_role=X/postgres}

-- ACL refresh_product_rating(): {postgres=X/postgres,service_role=X/postgres}

-- ACL reverse_commission_for_return(): {postgres=X/postgres,service_role=X/postgres}

-- ACL seller_has_item_in_order(p_order_id uuid): {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL set_review_verified_purchase(): {postgres=X/postgres,service_role=X/postgres}

-- ACL set_updated_at(): {postgres=X/postgres,service_role=X/postgres}

-- ACL support_messages_rate_limit(): {postgres=X/postgres,service_role=X/postgres}

-- ACL sync_delivery_status_to_order_status(): {postgres=X/postgres,service_role=X/postgres}

-- ACL touch_conversation_on_message(): {postgres=X/postgres,service_role=X/postgres}

-- ACL trg_process_order_commissions(): {postgres=X/postgres,service_role=X/postgres}

-- ACL trg_products_default_commission_category(): {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}

-- ACL validate_coupon(p_code text, p_seller_ids uuid[]): {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.commission_categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.commission_promotions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_delivery_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rider_earnings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users add own addresses" ON public.addresses AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users delete own addresses" ON public.addresses AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Users update own addresses" ON public.addresses AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users view own addresses" ON public.addresses AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Admins read audit log" ON public.audit_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write audit log" ON public.audit_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update boutiques" ON public.boutiques AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Boutiques public read" ON public.boutiques AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Owner can delete boutique" ON public.boutiques AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = owner_id));

CREATE POLICY "Owner can insert boutique" ON public.boutiques AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "Owner can update boutique" ON public.boutiques AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "Users can add items to their own cart" ON public.cart_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can delete from their own cart" ON public.cart_items AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Users can update their own cart" ON public.cart_items AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own cart" ON public.cart_items AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Anyone can view categories" ON public.categories AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Only admins can create categories" ON public.categories AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));

CREATE POLICY "Only admins can delete categories" ON public.categories AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));

CREATE POLICY "Only admins can update categories" ON public.categories AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));

CREATE POLICY "Admins manage commission categories" ON public.commission_categories AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Read commission categories" ON public.commission_categories AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage promotions" ON public.commission_promotions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Signed-in users read promotions" ON public.commission_promotions AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins read commission records" ON public.commission_records AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers read own commission records" ON public.commission_records AS PERMISSIVE FOR SELECT TO public USING ((seller_id = auth.uid()));

CREATE POLICY "Buyer or seller can start a conversation" ON public.conversations AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));

CREATE POLICY "Participants view their conversations" ON public.conversations AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));

CREATE POLICY "Sellers manage their own coupons" ON public.coupons AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = seller_id)) WITH CHECK ((auth.uid() = seller_id));

CREATE POLICY "Admins manage currencies" ON public.currencies AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read currencies" ON public.currencies AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Delivery agents can insert own record" ON public.delivery_agents AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Delivery agents can update own record" ON public.delivery_agents AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));

CREATE POLICY "Delivery agents can view own record" ON public.delivery_agents AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));

CREATE POLICY "Admins manage delivery options" ON public.delivery_options AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read delivery options" ON public.delivery_options AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage exchange rates" ON public.exchange_rates AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read exchange rates" ON public.exchange_rates AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Admins read ledger" ON public.ledger_entries AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers read own ledger" ON public.ledger_entries AS PERMISSIVE FOR SELECT TO public USING (((seller_id = auth.uid()) AND (account = ANY (ARRAY['seller_payable'::text, 'seller_payout'::text]))));

CREATE POLICY "Participants mark messages read" ON public.messages AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid()))))));

CREATE POLICY "Participants send messages in their conversations" ON public.messages AS PERMISSIVE FOR INSERT TO public WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid())))))));

CREATE POLICY "Participants view messages in their conversations" ON public.messages AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid()))))));

CREATE POLICY "Users can mark own notifications read" ON public.notifications AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));

CREATE POLICY "Users can view own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));

CREATE POLICY "Buyers view their delivery code" ON public.order_delivery_codes AS PERMISSIVE FOR SELECT TO authenticated USING (buyer_owns_order(order_id));

CREATE POLICY "Admins view all order items" ON public.order_items AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyer can create own order items" ON public.order_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (buyer_owns_order(order_id));

CREATE POLICY "Order items readable by buyer or seller" ON public.order_items AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = seller_id) OR buyer_owns_order(order_id)));

CREATE POLICY "Admins view all orders" ON public.orders AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyer create order" ON public.orders AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = buyer_id));

CREATE POLICY "Buyer read own orders" ON public.orders AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = buyer_id));

CREATE POLICY "Delivery agents can update assigned orders" ON public.orders AS PERMISSIVE FOR UPDATE TO public USING ((delivery_agent_id IN ( SELECT delivery_agents.id
   FROM delivery_agents
  WHERE (delivery_agents.user_id = auth.uid()))));

CREATE POLICY "Delivery agents can view assigned orders" ON public.orders AS PERMISSIVE FOR SELECT TO public USING ((delivery_agent_id IN ( SELECT delivery_agents.id
   FROM delivery_agents
  WHERE (delivery_agents.user_id = auth.uid()))));

CREATE POLICY "Seller update order status for own items" ON public.orders AS PERMISSIVE FOR UPDATE TO authenticated USING (seller_has_item_in_order(id)) WITH CHECK (seller_has_item_in_order(id));

CREATE POLICY "Admins view all payments" ON public.payments AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyer read own payments" ON public.payments AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = buyer_id));

CREATE POLICY "Admins can view all payouts" ON public.payouts AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view their boutique payouts" ON public.payouts AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM boutiques b
  WHERE ((b.id = payouts.boutique_id) AND (b.owner_id = auth.uid())))));

CREATE POLICY "Admins manage platform settings" ON public.platform_settings AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins moderate products" ON public.products AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view all products" ON public.products AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner can delete product" ON public.products AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = owner_id));

CREATE POLICY "Owner can insert product" ON public.products AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "Owner can update product" ON public.products AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "Published products public read" ON public.products AS PERMISSIVE FOR SELECT TO anon, authenticated USING (((published = true) OR (auth.uid() = owner_id)));

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "Admins update returns" ON public.returns AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view all returns" ON public.returns AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyers can create returns" ON public.returns AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = buyer_id));

CREATE POLICY "Buyers can view own returns" ON public.returns AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = buyer_id));

CREATE POLICY "Sellers can update returns" ON public.returns AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = seller_id)) WITH CHECK ((auth.uid() = seller_id));

CREATE POLICY "Sellers can view returns for their items" ON public.returns AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = seller_id));

CREATE POLICY reviews_delete_own ON public.reviews AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY reviews_insert_own_verified ON public.reviews AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM (order_items oi
     JOIN orders o ON ((o.id = oi.order_id)))
  WHERE ((oi.product_id = reviews.product_id) AND (o.buyer_id = auth.uid()))))));

CREATE POLICY reviews_select_all ON public.reviews AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY reviews_update_own ON public.reviews AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Admins update rider earnings" ON public.rider_earnings AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view all rider earnings" ON public.rider_earnings AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Riders view own earnings" ON public.rider_earnings AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM delivery_agents da
  WHERE ((da.id = rider_earnings.agent_id) AND (da.user_id = auth.uid())))));

CREATE POLICY "Customers read own support thread" ON public.support_messages AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Customers write to own support thread" ON public.support_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (sender_id = auth.uid()) AND (from_staff = false)));

CREATE POLICY "Staff read all support threads" ON public.support_messages AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff reply in support threads" ON public.support_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) AND (sender_id = auth.uid()) AND (from_staff = true)));

CREATE POLICY "Admins manage roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own roles" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert own roles" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Users read own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Own wishlist delete" ON public.wishlist AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Own wishlist insert" ON public.wishlist AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Own wishlist read" ON public.wishlist AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Participants read chat attachments" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING (((bucket_id = 'chat-attachments'::text) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE (((c.id)::text = (storage.foldername(objects.name))[1]) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid())))))));

CREATE POLICY "Participants upload chat attachments" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'chat-attachments'::text) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE (((c.id)::text = (storage.foldername(objects.name))[1]) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid())))))));

CREATE POLICY "Product images public read" ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((bucket_id = 'product-images'::text));

CREATE POLICY "Product videos public read" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'product-videos'::text));

CREATE POLICY "Profile images public read" ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((bucket_id = 'profile-images'::text));

CREATE POLICY "Seller logos public read" ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((bucket_id = 'seller-logos'::text));

CREATE POLICY "Sellers delete own logo" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'seller-logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Sellers delete own product images" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'product-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Sellers delete own product videos" ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'product-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Sellers update own logo" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'seller-logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Sellers update own product images" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'product-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Sellers update own product videos" ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'product-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Sellers upload own logo" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'seller-logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Sellers upload own product images" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'product-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Sellers upload own product videos" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'product-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users delete own profile image" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users update own profile image" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users upload own profile image" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE TRIGGER addresses_single_default BEFORE INSERT OR UPDATE OF is_default ON public.addresses FOR EACH ROW EXECUTE FUNCTION addresses_single_default();

CREATE TRIGGER block_suspended_buyer BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION block_suspended_buyer();

CREATE TRIGGER block_suspended_seller_publish BEFORE INSERT OR UPDATE OF published ON public.products FOR EACH ROW EXECUTE FUNCTION block_suspended_seller_publish();

CREATE TRIGGER commission_categories_audit AFTER UPDATE ON public.commission_categories FOR EACH ROW EXECUTE FUNCTION log_commission_rate_change();

CREATE TRIGGER commission_categories_updated_at BEFORE UPDATE ON public.commission_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER commission_promotions_updated_at BEFORE UPDATE ON public.commission_promotions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER commission_records_updated_at BEFORE UPDATE ON public.commission_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER create_delivery_code AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION create_delivery_code();

CREATE TRIGGER delivery_options_updated_at BEFORE UPDATE ON public.delivery_options FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER guard_boutiques_suspension BEFORE INSERT OR UPDATE ON public.boutiques FOR EACH ROW EXECUTE FUNCTION guard_suspension_columns();

CREATE TRIGGER guard_delivery_confirmation BEFORE UPDATE OF delivery_status ON public.orders FOR EACH ROW EXECUTE FUNCTION guard_delivery_confirmation();

CREATE TRIGGER guard_profiles_suspension BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION guard_suspension_columns();

CREATE TRIGGER ledger_entries_no_update BEFORE DELETE OR UPDATE ON public.ledger_entries FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER messages_touch_conversation AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION touch_conversation_on_message();

CREATE TRIGGER notify_email_on_notification AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://qxaymlnoqmpixlbuzyla.supabase.co/functions/v1/send-notification-email', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE TRIGGER payouts_set_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER reviews_refresh_product_rating AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION refresh_product_rating();

CREATE TRIGGER reviews_set_verified_purchase BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION set_review_verified_purchase();

CREATE TRIGGER support_messages_rate_limit BEFORE INSERT ON public.support_messages FOR EACH ROW EXECUTE FUNCTION support_messages_rate_limit();

CREATE TRIGGER trg_auto_assign_delivery BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION auto_assign_delivery_agent();

CREATE TRIGGER trg_boutiques_updated BEFORE UPDATE ON public.boutiques FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cart_items_updated BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_decrement_stock AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION decrement_product_stock();

CREATE TRIGGER trg_notify_on_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION notify_on_new_message();

CREATE TRIGGER trg_notify_order_status AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();

CREATE TRIGGER trg_notify_return_resolved AFTER UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION notify_return_resolved();

CREATE TRIGGER trg_notify_return_submitted AFTER INSERT ON public.returns FOR EACH ROW EXECUTE FUNCTION notify_return_submitted();

CREATE TRIGGER trg_orders_commissions AFTER INSERT OR UPDATE OF payment_status, status ON public.orders FOR EACH ROW EXECUTE FUNCTION trg_process_order_commissions();

CREATE TRIGGER trg_products_commission_category BEFORE INSERT OR UPDATE OF category ON public.products FOR EACH ROW EXECUTE FUNCTION trg_products_default_commission_category();

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_returns_reverse_commission AFTER UPDATE OF status ON public.returns FOR EACH ROW EXECUTE FUNCTION reverse_commission_for_return();

CREATE TRIGGER trg_returns_updated BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sync_delivery_status BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION sync_delivery_status_to_order_status();

INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', 'f') ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', 't') ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('product-videos', 'product-videos', 't') ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', 't') ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', 't') ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('seller-logos', 'seller-logos', 't') ON CONFLICT (id) DO NOTHING;