# Privy Polymarket Fee Trading MVP Plan

## Goal

Build an MVP where users log in with Privy, trade Polymarket markets through the app, and pay a transparent platform fee. The app remains non-custodial: user trading funds stay in the user's Polymarket trading wallet, while the app coordinates quote creation, fee collection, order submission, records, and refunds.

## Confirmed MVP Decisions

- Wallet model: Privy email/Google embedded wallet as signer, current Safe proxy flow as trading wallet.
- Polymarket signature type: `GNOSIS_SAFE` / `signatureType = 2`.
- Custody model: non-custodial. User funds stay in the user's Safe trading wallet.
- Fee model: inclusive fee. User enters total payment, e.g. `$100`; platform fee is `$1`; Polymarket order amount is `$99`.
- Fee timing: collect fee before submitting the Polymarket order.
- Fee source: user Safe address, not EOA.
- Fee token: Polygon USDC.e, `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`.
- Fee recipient: one fixed platform fee wallet for MVP.
- Fee rate: backend-controlled, default `1%` / `100 bps`.
- Minimum total payment: `$2.00`.
- Order scope: market buy only.
- Order type: FOK market buy. No partial fills for MVP.
- Limit orders: hidden/disabled.
- Sell orders: hidden/disabled.
- Markets: continue using current market list and `clobTokenIds`; pass `negRisk` correctly; no advanced negative-risk operations.
- Slippage: fixed `2%`, not user-configurable for MVP.
- Quote validity: 10 seconds before attempt creation.
- Quote source of truth: backend final quote. Frontend can show market previews, but cannot decide final fee/order amount/worst price.
- Order execution: frontend submits Polymarket order using the user's `ClobClient`; backend does not store user CLOB API credentials.
- Fee/order atomicity: non-atomic two-step flow.
- User signatures: real mode uses two confirmations: fee transfer, then Polymarket order.
- Refund model: if fee is collected but order submission fails, refund fee to user Safe.
- Refund wallet: same platform wallet for MVP testing; split collection/refund wallets later.
- Refund confirmation: 1 Polygon confirmation for MVP.
- Fee verification confirmation: 1 Polygon confirmation for MVP.
- Unknown order state: enter manual review, not automatic refund.
- Admin handling: use `pnpm` admin scripts first; no full admin UI in MVP.
- Database: Postgres + Prisma.
- Data model: start with one primary `TradeAttempt` table.
- User identity: Privy user id as primary app user identifier; store EOA and Safe redundantly.
- API auth: Privy access token/JWT on user APIs.
- Safe ownership: backend verifies EOA belongs to Privy user, then derives Safe and compares.
- Balance check: backend checks Safe USDC balance >= total payment before creating attempt.
- Geoblock: production keeps geoblock; demo/local can disable with an explicit config flag.
- Trading setup: user must complete current Trading Session before ordering.
- Builder signing: continue current remote builder signing. Builder secrets stay server-side.
- Backend placement: MVP APIs and builder signer can live in the same Next.js app.

## Non-Goals

- No custody of user principal funds.
- No external Polymarket account import.
- No Deposit Wallet / `POLY_1271` migration in MVP.
- No limit orders.
- No sell orders.
- No partial-fill FAK orders.
- No custom slippage UI.
- No promo/fee discount UI.
- No full admin dashboard.
- No advanced negative-risk split/merge/arbitrage flows.
- No fiat onramp or bridge flow.

## User Flow

1. User logs in with Privy email/Google.
2. User sets up trading wallet manually if needed:
   - derive/deploy Safe;
   - create/derive CLOB API credentials;
   - set Polymarket token approvals;
   - initialize relayer and CLOB client.
3. User sends Polygon USDC.e to the Safe trading wallet.
4. User selects a market outcome.
5. User enters total payment in USDC.
6. Frontend may show an estimate using live market data.
7. User requests final quote.
8. Backend creates final quote:
   - validates market/token;
   - fetches best ask;
   - fetches tick size and `negRisk`;
   - computes fee and order amount;
   - computes worst price with 2% slippage, rounded to tick size;
   - returns a 10-second quote.
9. User confirms quote.
10. Backend creates a `TradeAttempt` from the quote if no active attempt exists.
11. Frontend asks user to sign fee transfer from Safe to platform fee wallet.
12. Frontend submits fee transaction hash to backend.
13. Backend verifies Polygon USDC.e `Transfer` log.
14. After fee is verified, frontend submits Polymarket FOK market buy using locked quote parameters.
15. Frontend sends order response/error to backend as client-observed data.
16. Frontend shows immediate order result.
17. Backend records final state:
   - order filled/success: fee retained;
   - clear failure: refund pending;
   - unclear: manual review.

## Fee Calculation

All amounts must be calculated on the backend using integer micro-USDC.

```text
total_amount_micros = user input * 1_000_000
fee_amount_micros = floor(total_amount_micros * fee_bps / 10_000)
order_amount_micros = total_amount_micros - fee_amount_micros
```

Example:

```text
total = 100_000_000  // $100.00
fee_bps = 100        // 1%
fee = 1_000_000      // $1.00
order = 99_000_000   // $99.00
```

For `$2.00`:

```text
total = 2_000_000
fee = 20_000
order = 1_980_000
```

## Quote Rules

Backend quote generation is the source of truth.

Quote fields:

```text
quote_id
privy_user_id
eoa_address
safe_address
market_id
token_id
outcome
neg_risk
tick_size
best_ask
slippage_bps = 200
worst_price
total_amount_usdc_micros
fee_rate_bps
fee_amount_usdc_micros
order_amount_usdc_micros
estimated_shares
expires_at
```

Rules:

- Frontend can fetch Polymarket data for previews.
- Final quote must be created by backend.
- Attempt must be created before quote expires.
- Once attempt is created, quote parameters are locked.
- Quote expiry does not cancel an in-progress fee transfer or order attempt.

## State Machine

Suggested `TradeAttempt.status` values:

```text
created
fee_pending
fee_submitted
fee_verified
fee_failed
fee_verification_timeout
order_pending
order_result_submitted
order_filled
order_failed_refund_pending
refund_pending
refund_submitted
refund_paid
refund_failed_manual_required
order_unknown_review
cancelled
failed
```

Cancellation:

- User can cancel only before fee is submitted.
- After fee is submitted, the system must resolve to order success, refund, or review.

Active attempt rule:

- One active attempt per Privy user/Safe for MVP.
- New attempts allowed only after terminal states such as `order_filled`, `refund_paid`, `cancelled`, or `failed`.

## Backend APIs

Suggested routes:

```text
POST /api/quotes
POST /api/trade-attempts
GET  /api/trade-attempts/active
POST /api/trade-attempts/:id/cancel
POST /api/trade-attempts/:id/fee-tx
POST /api/trade-attempts/:id/order-result
POST /api/polymarket/sign
```

Authentication:

- `/api/quotes` and `/api/trade-attempts/*` require Privy access token/JWT.
- Backend extracts `privy_user_id` from verified token.
- Backend verifies submitted EOA belongs to the Privy user.
- Backend derives Safe from EOA and compares with submitted Safe.

Builder signing:

- `/api/polymarket/sign` signs only builder headers.
- Builder secrets stay server-side.
- Do not sign user orders.

## TradeAttempt Schema

Initial Prisma model can start as one table with JSON snapshots.

```prisma
model TradeAttempt {
  id                         String   @id @default(cuid())
  privyUserId                String
  eoaAddress                 String
  safeAddress                String

  marketId                   String?
  tokenId                    String
  outcome                    String?
  negRisk                    Boolean

  totalAmountUsdcMicros      BigInt
  feeRateBps                 Int
  feeAmountUsdcMicros        BigInt
  orderAmountUsdcMicros      BigInt
  slippageBps                Int
  bestAsk                    Decimal?
  worstPrice                 Decimal
  tickSize                   Decimal
  estimatedShares            Decimal?

  status                     String

  feeWallet                  String
  feeTxHash                  String?
  feeCollectedAt             DateTime?
  feeRetainedAt              DateTime?

  polymarketOrderId          String?
  clientOrderResponseJson    Json?
  clientOrderErrorJson       Json?
  clientReportedStatus       String?
  clientReportedAt           DateTime?

  refundTxHash               String?
  refundedAt                 DateTime?

  quoteSnapshotJson          Json
  errorMessage               String?

  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt

  @@index([privyUserId, status])
  @@index([safeAddress])
  @@index([feeTxHash])
  @@index([polymarketOrderId])
}
```

## Fee Verification

Backend verifies fee transfer before allowing order submission.

Required checks:

```text
tx receipt status == success
token contract == Polygon USDC.e
Transfer.from == user safe address
Transfer.to == platform fee wallet
Transfer.value == expected fee amount
confirmations >= 1 for MVP
```

Do not trust frontend-submitted fee amounts or recipient addresses.

## Order Submission

Frontend must use locked quote parameters:

```text
tokenID = quote.token_id
amount = quote.order_amount_usdc
side = BUY
price = quote.worst_price
negRisk = quote.neg_risk
orderType = FOK
```

Frontend sends the raw Polymarket response/error to backend for audit/debugging. Backend must treat it as client-observed data, not as sole proof for automatic refund.

## Refund Rules

Refund to user Safe address.

Automatic refund only when backend can independently determine that the order was not submitted/successful enough for the product promise.

Conservative rule:

- Clear failure: refund.
- Unclear order state: `order_unknown_review`.
- Do not automatically refund based only on a client-reported failure.

Refund verification:

```text
refund tx receipt success
USDC.e Transfer.from == platform fee wallet
USDC.e Transfer.to == user safe
Transfer.value == fee amount
confirmations >= 1
```

## Admin Scripts

Use `pnpm`, not `npm`.

Suggested scripts:

```text
pnpm admin:list-review
pnpm admin:list-refunds
pnpm admin:refund <attemptId>
pnpm admin:mark-filled <attemptId>
pnpm admin:mark-failed <attemptId>
```

Admin scripts should:

- load server env;
- query attempts by status;
- verify onchain txs where relevant;
- submit refund from platform wallet;
- write every action to the database.

## Environment Variables

```text
DATABASE_URL=
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=
POLYGON_RPC_URL=

PLATFORM_FEE_WALLET=
PLATFORM_FEE_PRIVATE_KEY=
PLATFORM_FEE_BPS=100
MIN_TOTAL_USDC_MICROS=2000000

REMOTE_SIGNING_URL=
POLY_BUILDER_API_KEY=
POLY_BUILDER_SECRET=
POLY_BUILDER_PASSPHRASE=

NEXT_PUBLIC_DISABLE_GEOBLOCK_FOR_DEMO=false
```

For MVP testing, `PLATFORM_FEE_WALLET` and `PLATFORM_FEE_PRIVATE_KEY` may refer to the same wallet. Keep only small balances there.

## UI Changes

- Replace shares input with `Total payment (USDC)`.
- Remove/hide limit order toggle.
- Remove/hide sell button.
- Show quote confirmation:
  - total payment;
  - platform fee;
  - order amount;
  - estimated shares;
  - best ask;
  - max price with slippage;
  - market/outcome;
  - trading wallet Safe address;
  - fee recipient.
- Button copy should be explicit:
  - `Confirm $99 order + $1 fee`
  - or `Pay $100 and buy with $99`
- Show two-step progress:
  - `Step 1/2: Pay platform fee`
  - `Step 2/2: Submit Polymarket order`
- Show Safe trading wallet address as recharge address.
- Warn users to send only Polygon USDC.e to the Safe address.
- If user has an active attempt, restore it and show continue/review/refund status.

## Implementation Order

1. Add Prisma/Postgres setup and `TradeAttempt` model.
2. Add backend env/config for fee wallet, fee bps, min amount.
3. Add Privy token verification helper.
4. Add Safe derivation/ownership verification helper.
5. Add backend quote creation endpoint.
6. Add active attempt endpoint and one-active-attempt enforcement.
7. Add fee tx submission and verification endpoint.
8. Add frontend order modal changes for total payment and quote confirmation.
9. Add Safe fee transfer using existing relayer client.
10. Add fee-gated FOK market buy using locked quote parameters.
11. Add order result submission endpoint.
12. Add refund/admin scripts.
13. Add active attempt recovery UI.
14. Add geoblock demo flag while keeping production geoblock enabled.
15. Add focused tests for fee math, state transitions, and tx log verification.

## Risks

- Non-atomic fee + order flow can create refund/review cases.
- FOK can fail often in thin markets.
- `$2.00` minimum may still hit Polymarket minimum order constraints.
- Same wallet for fee collection and refunds is acceptable for testing but should be split before serious production use.
- Backend order confirmation without user CLOB API credentials may be incomplete; ambiguous cases require manual review.
- Closing the browser between fee and order requires robust active attempt recovery.
- Disabling geoblock outside demo environments increases legal/compliance risk.
