-- Create stores/branches table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stores"
ON public.stores FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage stores"
ON public.stores FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create cash registers table
CREATE TABLE public.cash_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id),
  name TEXT NOT NULL,
  opened_by UUID REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cash registers"
ON public.cash_registers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create cash registers"
ON public.cash_registers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own cash registers"
ON public.cash_registers FOR UPDATE
USING (auth.uid() = opened_by OR has_role(auth.uid(), 'admin'::app_role));

-- Create sales commissions table
CREATE TABLE public.sales_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson_id UUID REFERENCES auth.users(id) NOT NULL,
  sale_id UUID REFERENCES public.sales(id),
  commission_percentage NUMERIC DEFAULT 5,
  commission_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commissions"
ON public.sales_commissions FOR SELECT
USING (auth.uid() = salesperson_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can manage commissions"
ON public.sales_commissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('meeting', 'task', 'reminder', 'other')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees JSONB,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
ON public.calendar_events FOR SELECT
USING (auth.uid() = created_by OR auth.uid()::text = ANY(SELECT jsonb_array_elements_text(attendees)));

CREATE POLICY "Users can create events"
ON public.calendar_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own events"
ON public.calendar_events FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
ON public.calendar_events FOR DELETE
USING (auth.uid() = created_by);

-- Create user invitations table for team management
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role app_role NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations"
ON public.user_invitations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add store_id to existing tables for multi-store support
ALTER TABLE public.products ADD COLUMN store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.sales ADD COLUMN store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.cash_registers ADD COLUMN current_cash_amount NUMERIC DEFAULT 0;

-- Create triggers for updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_commissions_updated_at
BEFORE UPDATE ON public.sales_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();