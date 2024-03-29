export interface Config {
    privateKey: string;
    bot: boolean;
    apiPort: number;
    reboot: boolean;
    newETF: boolean;
    discordToken: string;
    exposureAddress: string;
    exposureFactoryAddress: string;
    routerAddress: string;
    USDCAddress: string;
    APIURL: string;
    discordNotifications: boolean;
    accounts: TradingAccounts[];
    WAVAX: WAVAX;
    tokens: Tokens[];
    baskets: {[key: string]: any}
}
export interface Bias {
    buy: number;
    sell: number;
}
export interface TradingAccounts {
    publicKey: string;
    privateKey: string;
}
export interface WAVAX {
    name: string;
    token: string;
    quote: string;
    pairAddress: string;
    tokenAddress: string;
    quoteAddress: string;
}
export interface Status {
    epoch: boolean;
}
export interface Tokens {
    name: string;
    token: string;
    quote: string;
    pairAddress: string;
    tokenAddress: string;
    quoteAddress: string;
}
export interface ExposureToTrade {
    name: string
    amountToTrade: number
    toTradeUSD: number
    currentPrice: number
    estimatedNewPrice: number
}
