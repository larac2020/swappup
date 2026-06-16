
## Goal

Once a purchase is finalized, the listing must no longer be purchasable by anyone else, but it must remain fully visible (with expandable details) to the buyer in their Purchases and to the seller in their sold transactions.

## Current state

- **Stripe webhook** (`stripe-purchase-webhook`) and **reconcile-purchase** decrement `ticket_count` and set `is_active = newCount > 0`. So a listing with stock >1 stays active and re-purchasable after a sale.
- **DB trigger `before_purchase_insert`** only blocks new purchases when `is_active=false` OR `ticket_count < quantity`. Until the webhook fires, a second checkout can be created.
- **Buyer view** (`Purchases.tsx`): joins `purchases → listings(*)` by id, expandable card with full trip details. Works regardless of `is_active`.
- **Seller view** (`TransactionHistory.tsx`): uses `get_seller_purchases` RPC + fetches `listings` by id; opens `SaleDetailsDialog`. Works regardless of `is_active`.
- **Listings RLS**: public read policy currently allows anyone to read active listings; sellers/buyers can read their own via id-based join. Need to confirm the buyer can still read the listing after it goes inactive (it's joined via the purchase row).

## Changes

### 1. Always deactivate the listing on successful sale
In `supabase/functions/stripe-purchase-webhook/index.ts` and `supabase/functions/reconcile-purchase/index.ts`, when finalizing a purchase update the listing to:
```ts
ticket_count: 0,
is_active: false,
```
regardless of previous stock. (A flight ticket listing represents one bookable seat; once sold, no one else can buy.)

### 2. Block double-purchase during the pending window
Tighten `before_purchase_insert` (DB trigger) to also reject when an existing non-refunded purchase already exists for the listing:
```sql
IF EXISTS (
  SELECT 1 FROM public.purchases
  WHERE listing_id = NEW.listing_id
    AND status IN ('pending','pending_transfer','transfer_confirmed','completed')
) THEN
  RAISE EXCEPTION 'LISTING_UNAVAILABLE: This listing already has an active purchase';
END IF;
```
This prevents a race where two buyers reach Stripe Checkout before the webhook fires. Refunded/canceled purchases do not block.

### 3. Ensure buyer can still read the listing after deactivation
Verify the `listings` SELECT policy allows the buyer to read their purchased listing even when `is_active=false`. If the current policy is `is_active = true`-gated only, add a policy:
```sql
CREATE POLICY "Buyers can read their purchased listings"
ON public.listings FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.purchases pu
  JOIN public.profiles pr ON pr.id = pu.buyer_id
  WHERE pu.listing_id = listings.id AND pr.user_id = auth.uid()
));
```
Seller already has a policy on their own listings, so no change needed there. (Will confirm exact existing policies before writing the migration.)

### 4. No UI changes required
Both Purchases (buyer) and TransactionHistory + SaleDetailsDialog (seller) already render full trip details from the joined listing row. Once #3 guarantees read access, both parties continue to see and expand details after deactivation.

## Out of scope

- The `/listing/:id` public detail page — sold listings should 404 / redirect for non-participants; participants navigate through their account history instead.
- Refund flow (already re-activates via `cancel-escrow` / refund handler — will leave as is).
