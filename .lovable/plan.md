## Add "Delete listing" action to My Listings

Currently sellers can only toggle a listing active/inactive. There's no way to permanently remove it. I'll add a Delete action.

### UI changes (`src/pages/MyListings.tsx`)
- Add a **Delete** button to the actions row of each listing card (next to View / Edit / Boost / Active toggle), styled in destructive red with a `Trash2` icon.
- Clicking it opens a confirmation `AlertDialog` ("Delete listing? This action cannot be undone.") with Cancel / Delete buttons.
- On confirm, run a `deleteMutation` that calls `supabase.from("listings").delete().eq("id", id)`, then invalidates `myListings` and shows a success toast.
- Block deletion (and show a clear toast) when the listing has an open sale — i.e. it appears in `pendingSales` with status `pending_transfer` or `transfer_confirmed`. Sellers should resolve those first.

### i18n (`src/i18n/translations.ts`)
- Add new keys in EN + IT: `myListingsDelete`, `deleteListingTitle`, `deleteListingDesc`, `deleteListingConfirm`, `deleteListingCancel`, `deleteListingSuccess`, `deleteListingBlockedSale`.

### Database / RLS
- No migration needed. The existing policy "Sellers can delete their own listings" already permits this via `seller_id` → `profiles` → `auth.uid()`.

### Out of scope
- No soft-delete column or archive view — delete is permanent (the existing inactive toggle already covers "hide without deleting").
- No cascade cleanup of `favorites` / `cart_items` / `listing_views` rows; those reference `listing_id` without FKs and will simply orphan (consistent with current behavior).
