-- Fix 1: Restrict profiles table to own profile + admins
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Fix 2: Restrict customer PII access to authorized roles only
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;

CREATE POLICY "Authorized roles can view customers" 
ON customers FOR SELECT 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'user')
);

CREATE POLICY "Authorized roles can create customers" 
ON customers FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'user')
);

CREATE POLICY "Authorized roles can update customers" 
ON customers FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'user')
);

-- Fix 3: Restrict suppliers to managers and admins
DROP POLICY IF EXISTS "Authenticated users can create suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;

CREATE POLICY "Managers and admins can create suppliers" 
ON suppliers FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers and admins can update suppliers" 
ON suppliers FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Fix 4: Restrict purchase orders to managers and admins
DROP POLICY IF EXISTS "Authenticated users can create purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase orders" ON purchase_orders;

CREATE POLICY "Managers and admins can create purchase orders" 
ON purchase_orders FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers and admins can update purchase orders" 
ON purchase_orders FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Fix 5: Restrict accounts payable/receivable to managers and admins
DROP POLICY IF EXISTS "Authenticated users can create accounts payable" ON accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can update accounts payable" ON accounts_payable;

CREATE POLICY "Managers and admins can create accounts payable" 
ON accounts_payable FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers and admins can update accounts payable" 
ON accounts_payable FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Authenticated users can create accounts receivable" ON accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can update accounts receivable" ON accounts_receivable;

CREATE POLICY "Managers and admins can create accounts receivable" 
ON accounts_receivable FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers and admins can update accounts receivable" 
ON accounts_receivable FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Fix 6: Add DELETE policies for data management
CREATE POLICY "Admins can delete customers" 
ON customers FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and managers can delete suppliers" 
ON suppliers FOR DELETE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can delete products" 
ON products FOR DELETE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete purchase orders" 
ON purchase_orders FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete accounts payable" 
ON accounts_payable FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete accounts receivable" 
ON accounts_receivable FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete transactions" 
ON transactions FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sales" 
ON sales FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sale items" 
ON sale_items FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete purchase order items" 
ON purchase_order_items FOR DELETE 
USING (has_role(auth.uid(), 'admin'));