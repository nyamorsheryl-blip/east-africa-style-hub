
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.returns TO authenticated;
GRANT ALL ON public.returns TO service_role;

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own returns" ON public.returns
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers view returns for their items" ON public.returns
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Buyers create returns for their order items" ON public.returns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers update returns for their items" ON public.returns
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

CREATE TRIGGER returns_set_updated_at BEFORE UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX returns_seller_idx ON public.returns(seller_id, created_at DESC);
CREATE INDEX returns_buyer_idx ON public.returns(buyer_id, created_at DESC);
