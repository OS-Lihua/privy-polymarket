"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Language = "en" | "zh";

type Dictionary = typeof dictionaries.en;

const dictionaries = {
  en: {
    appTitle: "Polymarket Fee Trader",
    login: "Log in",
    logout: "Disconnect",
    account: "Account",
    backToWorkbench: "Back to workbench",
    language: "Language",
    english: "EN",
    chinese: "中文",
    eoaWallet: "EOA wallet",
    depositWallet: "Deposit Wallet",
    depositWalletPending: "Initialize first",
    copied: "Copied",
    profile: "Polymarket profile",
    profileUnavailable:
      "This Privy EOA does not have a corresponding Polymarket.com profile.",
    accountTitle: "Account and wallet controls",
    accountSubtitle:
      "Review wallet addresses, open the linked Polymarket page, export your embedded wallet, or disconnect from this device.",
    accountNotConnectedTitle: "Log in to manage your account",
    accountNotConnectedBody:
      "Connect your Privy wallet before opening account controls.",
    walletOverview: "Wallet overview",
    polymarketProfileBody:
      "Open the Polymarket page for your Deposit Wallet when it is ready. Before initialization, the signing wallet address is used.",
    openPolymarketProfile: "Open Polymarket",
    privateKeyExportTitle: "Export private key",
    privateKeyExportBody:
      "Privy opens a secure modal for your embedded wallet export. This app never receives, stores, or logs your private key.",
    privateKeyExportWarning:
      "Anyone with this private key can control the wallet. Do not share it, paste it into untrusted sites, or save it in plain text.",
    exportPrivateKey: "Export private key",
    eoaHelp:
      "This wallet signs actions for your Deposit Wallet. Do not fund this address.",
    depositWalletHelp:
      "This wallet is generated during initialization and holds CLOB V2 trading funds. Fund this address with Polygon pUSD.",
    tradingBalance: "Trading Balance",
    loadingBalance: "Loading balance",
    errorLoadingBalance: "Error loading balance",
    depositRechargeAddress: "Deposit Wallet funding address",
    depositWalletAddress: "Deposit Wallet address",
    send: "Send",
    polygonUsdcWarning:
      "Use Polygon pUSD for orders. Wrap USDC.e to pUSD first if needed.",
    availableUsdcE: "Available to wrap",
    wrapToPusd: "Wrap USDC.e to pUSD",
    wrapping: "Wrapping",
    startSessionFirst: "Initialize a trading session first.",
    tradingSession: "Trading Session",
    readyToTrade: "Ready to trade",
    notInitialized: "Not initialized",
    sessionQuestion: "What is a Trading Session?",
    sessionIntro:
      "A trading session prepares your Deposit Wallet, Polymarket credentials, and token approvals.",
    sessionDeploy: "Sign to deploy the Deposit Wallet, if needed",
    sessionCredentials: "Sign to create or derive CLOB API credentials",
    sessionApprovals: "Sign to approve tokens for trading",
    initializeSession: "Initialize trading session",
    initializing: "Initializing",
    sessionActive: "Session active",
    endSession: "End session",
    checkingSession: "Checking trading session",
    settingUpDepositWallet: "Setting up Deposit Wallet",
    gettingCredentials: "Getting user API credentials",
    settingApprovals: "Setting token approvals",
    error: "Error",
    markets: "Markets",
    positions: "Positions",
    orders: "Orders",
    sortedMarkets: "Sorted by volume and liquidity",
    categoryMarkets: "{category} markets",
    initializeBeforeOrder:
      "Initialize your Trading Session before placing a test order.",
    loadingMarkets: "Loading markets",
    errorLoadingMarkets: "Error loading markets",
    noMarkets: "No markets available",
    noMarketsMessage: "No active markets found.",
    trending: "Trending",
    politics: "Politics",
    finance: "Finance",
    crypto: "Crypto",
    sports: "Sports",
    tech: "Tech",
    culture: "Culture",
    geopolitics: "Geopolitics",
    volume24h: "24h Volume",
    liquidity: "Liquidity",
    outcomes: "Outcomes",
    buying: "Buying",
    orderSubmitted: "Order submitted successfully.",
    currentMarketPrice: "Current market price",
    sizeShares: "Size (shares)",
    limitPrice: "Limit price ($)",
    loadingTickSize: "Loading tick size",
    tickSizeRange: "Tick size: ${tickSize} • Range: ${min} - ${max}",
    shares: "Shares",
    price: "Price",
    total: "Total",
    totalPayment: "Total payment (pUSD)",
    getFinalQuote: "Get final quote",
    creatingQuote: "Creating quote",
    processing: "Processing",
    payAndBuy: "Pay {total} and buy with {order}",
    feeStep: "Step 1/2: Pay platform fee",
    orderStep: "Step 2/2: Submit Polymarket order",
    platformFee: "Platform fee",
    orderAmount: "Order amount",
    estimatedShares: "Estimated shares",
    bestAsk: "Best ask",
    maxPrice: "Max price",
    feeRecipient: "Fee recipient",
    tradingWallet: "Deposit Wallet",
    geoblockedTitle: "Trading unavailable in your region",
    geoblockedBody:
      "You can view markets, but cannot place trades or initialize a trading session.",
    detectedRegion: "Detected region",
    tourWalletsTitle: "1. Review the wallets",
    tourWalletsBody:
      "The top-right wallet panel shows the signing wallet and the Deposit Wallet slot. The Deposit Wallet is created during initialization.",
    tourSessionTitle: "2. Initialize trading",
    tourSessionBody:
      "Initialize before funding or trading. This creates the Deposit Wallet, stores Polymarket API credentials, and approves tokens.",
    tourDepositWalletTitle: "1. Fund the Deposit Wallet",
    tourDepositWalletBody:
      "The top-right Deposit Wallet is the address users send Polygon pUSD to. Do not fund the signing wallet.",
    tourDepositTitle: "2. Check balance and token",
    tourDepositBody:
      "This panel shows the pUSD balance. Fund the Deposit Wallet with Polygon pUSD, or wrap USDC.e into pUSD before placing orders.",
    tourOrderTitle: "3. Place an order",
    tourOrderBody:
      "Pick an active market, request a final quote, pay the platform fee, then submit the order.",
    tourNext: "Next",
    tourBack: "Back",
    tourDone: "Done",
    tourSkip: "Skip guide",
    tourRestart: "Show guide",
  },
  zh: {
    appTitle: "Polymarket 手续费交易",
    login: "登录",
    logout: "断开",
    account: "账户",
    backToWorkbench: "返回工作台",
    language: "语言",
    english: "EN",
    chinese: "中文",
    eoaWallet: "签名钱包",
    depositWallet: "交易钱包",
    depositWalletPending: "先初始化",
    copied: "已复制",
    profile: "Polymarket 主页",
    profileUnavailable: "这个 Privy 钱包没有对应的 Polymarket.com 主页。",
    accountTitle: "账户和钱包控制",
    accountSubtitle:
      "查看钱包地址，打开关联的 Polymarket 页面，导出内置钱包，或断开当前设备连接。",
    accountNotConnectedTitle: "登录后管理账户",
    accountNotConnectedBody: "请先连接 Privy 钱包，再打开账户控制。",
    walletOverview: "钱包概览",
    polymarketProfileBody:
      "交易钱包准备好后，会打开交易钱包对应的 Polymarket 页面。未初始化前使用签名钱包地址。",
    openPolymarketProfile: "打开 Polymarket",
    privateKeyExportTitle: "导出私钥",
    privateKeyExportBody:
      "Privy 会打开安全弹窗完成内置钱包导出。本应用不会接收、保存或记录你的私钥。",
    privateKeyExportWarning:
      "任何拿到私钥的人都可以控制这个钱包。不要分享私钥，不要粘贴到不可信网站，也不要明文保存。",
    exportPrivateKey: "导出私钥",
    eoaHelp: "这个钱包只用来签名，不要往这里充值。",
    depositWalletHelp:
      "这个钱包会在初始化时生成，用来存放 CLOB V2 交易资金。充值 Polygon pUSD 到这里。",
    tradingBalance: "交易余额",
    loadingBalance: "正在读取余额",
    errorLoadingBalance: "余额读取失败",
    depositRechargeAddress: "交易钱包充值地址",
    depositWalletAddress: "交易钱包地址",
    send: "发送",
    polygonUsdcWarning:
      "下单使用 Polygon pUSD；如果有 USDC.e，请先包装成 pUSD。",
    availableUsdcE: "可包装余额",
    wrapToPusd: "USDC.e 包装成 pUSD",
    wrapping: "包装中",
    startSessionFirst: "请先初始化交易会话。",
    tradingSession: "交易会话",
    readyToTrade: "可以交易",
    notInitialized: "未初始化",
    sessionQuestion: "什么是交易会话？",
    sessionIntro: "交易会话会准备交易钱包、Polymarket 凭证和代币授权。",
    sessionDeploy: "签名部署交易钱包，如已部署会跳过",
    sessionCredentials: "签名创建或恢复 CLOB API 凭证",
    sessionApprovals: "签名授权交易所使用代币",
    initializeSession: "初始化交易会话",
    initializing: "初始化中",
    sessionActive: "会话已启用",
    endSession: "结束会话",
    checkingSession: "检查交易会话",
    settingUpDepositWallet: "设置交易钱包",
    gettingCredentials: "获取用户 API 凭证",
    settingApprovals: "设置代币授权",
    error: "错误",
    markets: "市场",
    positions: "持仓",
    orders: "订单",
    sortedMarkets: "按成交量和流动性排序",
    categoryMarkets: "{category}市场",
    initializeBeforeOrder: "下测试单前，请先初始化交易会话。",
    loadingMarkets: "正在加载市场",
    errorLoadingMarkets: "市场加载失败",
    noMarkets: "暂无可用市场",
    noMarketsMessage: "没有找到活跃市场。",
    trending: "热门",
    politics: "政治",
    finance: "金融",
    crypto: "加密",
    sports: "体育",
    tech: "科技",
    culture: "文化",
    geopolitics: "地缘政治",
    volume24h: "24h 成交量",
    liquidity: "流动性",
    outcomes: "结果",
    buying: "买入",
    orderSubmitted: "订单已提交。",
    currentMarketPrice: "当前市场价格",
    sizeShares: "数量（份额）",
    limitPrice: "限价 ($)",
    loadingTickSize: "正在加载 tick size",
    tickSizeRange: "Tick size：${tickSize} • 范围：${min} - ${max}",
    shares: "份额",
    price: "价格",
    total: "总计",
    totalPayment: "总支付金额 (pUSD)",
    getFinalQuote: "获取最终报价",
    creatingQuote: "正在报价",
    processing: "处理中",
    payAndBuy: "支付 {total}，用 {order} 买入",
    feeStep: "第 1/2 步：支付平台手续费",
    orderStep: "第 2/2 步：提交 Polymarket 订单",
    platformFee: "平台手续费",
    orderAmount: "下单金额",
    estimatedShares: "预计份额",
    bestAsk: "卖一价",
    maxPrice: "最高成交价",
    feeRecipient: "手续费收款方",
    tradingWallet: "交易钱包",
    geoblockedTitle: "你所在地区暂不可交易",
    geoblockedBody: "你可以查看市场，但不能下单或初始化交易会话。",
    detectedRegion: "检测地区",
    tourWalletsTitle: "1. 先看右上角的钱包",
    tourWalletsBody:
      "右上角会显示签名钱包和交易钱包位置。交易钱包要初始化后才会生成。",
    tourSessionTitle: "2. 初始化交易",
    tourSessionBody:
      "先初始化，再充值和下单。初始化会生成交易钱包、保存 Polymarket API 凭证，并完成代币授权。",
    tourDepositWalletTitle: "1. 给交易钱包充值",
    tourDepositWalletBody:
      "右上角的交易钱包才是用户转账充值的地址。不要充值到签名钱包。",
    tourDepositTitle: "2. 查看余额和充值币种",
    tourDepositBody:
      "这里显示 pUSD 余额。下单前需要向交易钱包充值 Polygon pUSD，或把 USDC.e 包装成 pUSD。",
    tourOrderTitle: "3. 下单",
    tourOrderBody: "选择活跃市场，获取最终报价，支付平台手续费，然后提交订单。",
    tourNext: "下一步",
    tourBack: "上一步",
    tourDone: "完成",
    tourSkip: "跳过引导",
    tourRestart: "查看引导",
  },
} as const;

const I18nContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof Dictionary, values?: Record<string, string>) => string;
} | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh");

  useEffect(() => {
    const saved = window.localStorage.getItem("language");
    if (saved === "en" || saved === "zh") setLanguageState(saved);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("language", nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: keyof Dictionary, values?: Record<string, string>) => {
        let text: string = dictionaries[language][key];
        for (const [name, value] of Object.entries(values || {})) {
          text = text.replace(`{${name}}`, value);
        }
        return text;
      },
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
