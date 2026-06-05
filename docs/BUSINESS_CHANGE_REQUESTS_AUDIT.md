# Business Change Requests Audit

Source reviewed:
- `api-documentation.md`
- `FRONTEND_API_CONTRACT_AUDIT.md`
- Current frontend code under `src/features`

Backend source code is not present in this workspace. Backend changes below are proposals based on the documented API contract only.

| Request | Current state | Backend needed? | Frontend needed? | Files affected | Implementation status | Notes |
|---|---|---:|---:|---|---|---|
| 1. Orders pickup/fulfillment type | `fulfillment_type` exists on create/update/order responses. Order create already has `pickup_from_merchant` and `from_warehouse`. | No for selection; Yes for reserving stock during order creation if that must happen in the same create request. | Yes | `OrderForm.tsx`, `OrderDetailsPage.tsx` | Partially implemented frontend | Order details now shows Pickup Type. Reservation UI is only shown for `from_warehouse`. Order creation displays guidance that reservation happens after creation because `POST /orders` does not accept reservation fields. |
| 2. Order details stock reservation cleanup | Stock reservations were always shown in order details. | No | Yes | `OrderDetailsPage.tsx` | Implemented frontend | Reservation card/actions are now only rendered when `fulfillment_type = from_warehouse`. |
| 3. Order filters | Docs do not define order list filters. Current frontend uses local search/status. | Yes | Yes after backend docs exist | Proposed: order index controller/service query filtering; docs update for `date_from`, `date_to`, `merchant_id` or `search`, `delivery_governorate_id`, `delivery_area_id`. | Proposed backend | Do not pass undocumented params from frontend until backend contract is updated. Area dropdown filtering is already implemented in order form. |
| 4. Shipment filters + print | Shipment filters exist for date range, assigned driver, governorate, area; no documented delivery-date filter. | Yes for delivery-date-specific print filter if different from documented `date_from/date_to`. | Yes | `ShipmentsListPage.tsx` | Implemented frontend where contract exists | Shipment list already passes documented filters. Added print action using real currently filtered shipment data. No fake data. |
| 5. Shipment number in order details | Order response docs do not include shipment relation/number. | Yes | Defensive frontend display | `OrderDetailsPage.tsx`, `order.types.ts` | Proposed backend, defensive frontend implemented | Frontend displays and links `shipment` / `shipment_number` if backend includes it. Backend should add relation to `GET /orders/{order}` and optionally order list. |
| 6. Order locking after shipment creation | Docs do not mention `shipment_created` order status or lock rules. | Yes | Defensive frontend display | `OrderDetailsPage.tsx` | Proposed backend, defensive frontend implemented | Frontend hides edit/delete and shows reason if `status = shipment_created`. Backend must enforce no edit/delete after shipment creation and set status. |
| 7. Driver expected cash / cash closure | Docs say expected cash is calculated by `GET /drivers/{driver}/cash-expected`, but cash closure create still requires manual `expected_amount`. | Yes | Yes after backend contract changes | Proposed: cash closure service calculates expected amount by driver/date, prevents duplicates, refreshes existing closure. | Proposed backend | Frontend should make expected amount read-only once backend supports driver/date closure creation without manual `expected_amount`. Current docs still require `expected_amount`, so frontend cannot remove it without breaking contract. |
| 8. Merchant finance available balance | Merchant finance summary has `remaining_balance`; no `available_balance` field documented. | Maybe | Yes | `MerchantDetailsPage.tsx` | Existing behavior acceptable | Treat `remaining_balance` as the available balance label unless backend adds separate `available_balance`. Frontend already shows “Remaining Balance”; recommended label change to “Available Balance” if business confirms equivalence. |
| 9. Warehouse return from shipment | Existing API creates warehouse returns via `/warehouse-returns`; no shipment-scoped return action or shipment status `returned_to_warehouse` documented. | Yes | Yes after backend contract exists | Proposed: transaction service creates return, updates shipment/order/stock, validates allowed statuses. | Proposed backend | Frontend modal should be added after backend exposes/clarifies endpoint/status. Existing generic warehouse return form remains unchanged. |
| 10. Dynamic barcode generation | Warehouse product barcode is optional in frontend type; docs example includes barcode but does not state generation behavior. | Yes | Minor | `WarehouseForms.tsx` | Proposed backend | Frontend already allows blank barcode. Backend should generate unique barcode if blank and docs should state uniqueness and response behavior. |

## Backend Proposals

These require backend code that is not present in this workspace:

1. Add documented order filters to `GET /api/orders`:
   - `date_from`
   - `date_to`
   - `merchant_id`
   - `search` across merchant/customer/order fields, or a clearly documented `merchant_name`
   - `delivery_governorate_id`
   - `delivery_area_id`

2. Add shipment relation to order responses:
   - `shipment: { id, shipment_number } | null`
   - or `shipment_id` and `shipment_number`

3. Add order lock rules after shipment creation:
   - Set order status to `shipment_created`
   - Reject update/delete for orders with shipment

4. Redesign driver cash closure creation:
   - Request should accept `driver_id`, closure date, `received_amount`, `status`, `notes`
   - Backend calculates `expected_amount`
   - Backend calculates `difference_amount`
   - Unique driver/date closure or refresh existing closure

5. Add shipment return-to-warehouse transaction:
   - Validate shipment status
   - Create `warehouse_return`
   - Update stock by condition
   - Update shipment/order status according to final documented status set

6. Add barcode generation:
   - Generate unique barcode when `barcode` is empty on warehouse product create
   - Return generated barcode in existing product response

## Frontend Implemented In This Pass

- Order delete permission/action for order list and details.
- Fulfillment type shown in order details.
- Warehouse reservation card hidden unless `fulfillment_type = from_warehouse`.
- Defensive shipment link display in order details if backend returns shipment fields.
- Defensive order lock UI if backend returns `status = shipment_created`.
- Shipment print action for real filtered shipment data.
- Structured defensive finance report UI for report endpoints without documented response schemas.
