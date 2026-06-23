# Polymarket Privy Deposit Wallet Demo

A Next.js application demonstrating Polymarket CLOB trading with Privy embedded wallets, Deposit Wallet funding, builder attribution, and server-side builder credential handling.

This demo shows how to:

- Authenticate users with Privy email/social login.
- Provision a non-custodial EOA wallet through Privy's embedded wallets.
- Initialize a Polymarket Deposit Wallet for trading funds.
- Create or derive user CLOB API credentials.
- Store per-user builder credentials on the server.
- Set token approvals for pUSD and outcome tokens.
- Place CLOB orders with builder attribution.
- Let users open their account page, export their Privy embedded wallet, and jump to their Polymarket page.

## Prerequisites

1. Builder API credentials from Polymarket.
   Visit `polymarket.com/settings?tab=builder` and copy the API key, secret, and passphrase.

2. A Polygon RPC URL.

3. A Privy App ID.
   Create an app at [privy.io](https://privy.io/) and copy the App ID.

## Quick Start

Install dependencies:

```bash
pnpm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_POLYGON_RPC_URL=your_polygon_rpc_url
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

POLYMARKET_BUILDER_API_KEY=your_builder_api_key
POLYMARKET_BUILDER_SECRET=your_builder_secret
POLYMARKET_BUILDER_PASSPHRASE=your_builder_passphrase
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Flow

### New User

1. User logs in with Privy.
2. Privy provisions an embedded EOA wallet if the user does not already have one.
3. The app creates or derives CLOB API credentials.
4. The app stores per-user builder credentials on the server.
5. The app initializes a RelayClient with the user's signer and remote builder signing.
6. The app derives and deploys the user's Deposit Wallet if needed.
7. The app sets required pUSD and outcome token approvals.
8. The app initializes an authenticated CLOB client.
9. The user can fund the Deposit Wallet and place orders.

### Returning User

1. User logs in with Privy.
2. The app restores the saved trading session for the connected EOA.
3. The app restores the RelayClient when needed.
4. The app reuses existing CLOB credentials and approvals when still valid.
5. The user can continue trading from the Deposit Wallet.

## Key Implementation Details

### Privy Authentication

Files:

- `providers/WalletProvider.tsx`
- `providers/WalletContext.tsx`

Privy handles login and embedded wallet provisioning. The app wraps the tree in `PrivyProvider`, then exposes the connected EOA signer through `WalletContext`.

```tsx
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
  config={{
    defaultChain: polygon,
    supportedChains: [polygonChainWithRpc()],
    embeddedWallets: {
      ethereum: {
        createOnLogin: "users-without-wallets",
      },
    },
  }}
>
  <WalletContextProvider>{children}</WalletContextProvider>
</PrivyProvider>
```

### Remote Builder Signing

File:

- `app/api/polymarket/sign/route.ts`

Builder credentials stay server-side. The client receives request signatures through the app's API route when initializing Polymarket clients.

For production, prefer a full server proxy for CLOB and relayer calls so builder credentials never need to be returned to the browser.

### Trading Session

Files:

- `hooks/useTradingSession.ts`
- `hooks/useDepositWallet.ts`
- `hooks/useRelayClient.ts`
- `hooks/useTokenApprovals.ts`
- `hooks/useUserApiCredentials.ts`

`useTradingSession` is the orchestration hook. It creates credentials, initializes the relayer, prepares the Deposit Wallet, sets approvals, and stores the resulting session in local storage.

The session contains:

- EOA address
- Deposit Wallet address
- API credential readiness
- approval readiness
- approval schema version

### Deposit Wallet

File:

- `hooks/useDepositWallet.ts`

The Deposit Wallet is the wallet that holds trading funds and executes approval batches through the Polymarket relayer. Users should fund this address with Polygon pUSD.

The signing EOA is used for authentication and signatures. It should not be funded for trading.

### Token Approvals

Files:

- `hooks/useTokenApprovals.ts`
- `utils/approvals.ts`

Before trading, the Deposit Wallet approves the contracts required by Polymarket market types:

- pUSD approvals for exchange and adapter contracts.
- ERC-1155 outcome token approvals for exchange and adapter contracts.

Approvals are checked onchain before being submitted. If all approvals are present for the current approval schema version, initialization skips the approval transaction.

### Authenticated CLOB Client

File:

- `hooks/useClobClient.ts`

Once the trading session is ready, the app creates an authenticated CLOB client using:

- the Privy EOA signer
- user API credentials
- Deposit Wallet funder address
- builder config

This client is used for order placement and cancellation.

### Account Page

File:

- `app/account/page.tsx`

The account page lets connected users:

- review EOA and Deposit Wallet addresses
- open the Polymarket page for the Deposit Wallet
- export their Privy embedded wallet through Privy's secure export modal
- disconnect from the app

The app does not receive, store, or log the exported private key.

## Project Structure

```text
privy-polymarket/
├── app/
│   ├── account/page.tsx                  # Account controls
│   ├── api/                              # Server routes
│   └── page.tsx                          # Main trading workbench
├── components/
│   ├── Header/                           # Header and wallet summary
│   ├── PolygonAssets/                    # Balance and funding UI
│   └── Trading/                          # Market and order UI
├── hooks/
│   ├── useTradingSession.ts              # Session orchestration
│   ├── useDepositWallet.ts               # Deposit Wallet derivation/deployment
│   ├── useRelayClient.ts                 # RelayClient initialization
│   ├── useUserApiCredentials.ts          # CLOB API credentials
│   ├── useTokenApprovals.ts              # Approval checks and batches
│   ├── useClobClient.ts                  # Authenticated CLOB client
│   └── useClobOrder.ts                   # Order placement
├── providers/
│   ├── WalletProvider.tsx                # Privy wallet setup
│   └── TradingProvider.tsx               # Trading context
├── utils/
│   ├── approvals.ts                      # Approval constants and helpers
│   └── session.ts                        # Session persistence
└── constants/
    ├── api.ts                            # API URLs
    └── polymarket.ts                     # Polymarket constants
```

## Environment Variables

```bash
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_POLYGON_FALLBACK_RPC_URLS=https://polygon-rpc.com,https://rpc.ankr.com/polygon
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

POLYMARKET_BUILDER_API_KEY=your_builder_api_key
POLYMARKET_BUILDER_SECRET=your_builder_secret
POLYMARKET_BUILDER_PASSPHRASE=your_builder_passphrase
```

Optional:

```bash
NEXT_PUBLIC_RELAYER_URL=https://relayer-v2.polymarket.com/
NEXT_PUBLIC_CLOB_API_URL=https://clob.polymarket.com
NEXT_PUBLIC_POLYMARKET_WEB_URL=https://polymarket.com
NEXT_PUBLIC_DISABLE_GEOBLOCK_FOR_DEMO=true
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm test
pnpm prisma:generate
pnpm prisma:migrate
```

## Key Dependencies

| Package | Purpose |
| --- | --- |
| `@privy-io/react-auth` | Authentication and embedded wallets |
| `@privy-io/server-auth` | Server-side Privy token verification |
| `@polymarket/clob-client` | CLOB API credentials and order operations |
| `@polymarket/clob-client-v2` | Typed CLOB client usage |
| `@polymarket/builder-relayer-client` | Deposit Wallet deployment and batched transactions |
| `@polymarket/builder-signing-sdk` | Builder credential signing |
| `viem` | EVM clients and RPC calls |
| `ethers` | Signer interop for Polymarket clients |
| `next` | App framework and API routes |
| `prisma` | Trade attempt persistence |

## Troubleshooting

### Privy login does not open

- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is set.
- Check the Privy dashboard for allowed domains.
- If already logged in, avoid clicking login repeatedly; open the account page or disconnect first.

### Deposit Wallet initialization fails

- Verify Polygon RPC connectivity.
- Verify builder credentials are set.
- Check that `/api/polymarket/sign` returns authenticated signatures.
- Confirm the user approves Privy signature prompts.

### Balance is missing

- Initialize the trading session first.
- Fund the Deposit Wallet, not the signing EOA.
- Use Polygon pUSD for orders, or wrap USDC.e to pUSD in the balance panel.

### Order placement fails

- Reinitialize the trading session if approvals are stale.
- Confirm the Deposit Wallet has enough pUSD for the total payment.
- Check server logs with the returned trace ID.

## Resources

- [Polymarket CLOB Client Docs](https://docs.polymarket.com/developers/CLOB/clients)
- [Polymarket Builder Program](https://docs.polymarket.com/developers/builder-program)
- [Polymarket Authentication](https://docs.polymarket.com/developers/CLOB/authentication)
- [Privy Docs](https://docs.privy.io/)
- [Privy Embedded Wallets](https://docs.privy.io/guide/react/wallets/embedded-wallets)
- [viem Documentation](https://viem.sh/)

## License

MIT
