export interface Config {
    privateKey: string;
    init: boolean;
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
    shareCreation: boolean;
    bias: Bias[];
    sellBias: number;
    buyBias: number;
    discordNotifications: boolean;
    status: Status;
    accounts: Accounts[];
    WAVAX: WAVAX;
    tokens: Tokens[];
}
export interface Bias {
    buy: number;
    sell: number;
}
export interface Status {
    epoch: boolean;
}
export interface Accounts {
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
