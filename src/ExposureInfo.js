"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExposureInfo = void 0;
const util_1 = require("./util");
const discordbot_1 = require("./discordbot");
const PairABI = require("../abi/pair.json");
const ERC20ABI = require("../abi/erc20.json");
const RouterABI = require("../abi/router.json");
class ExposureInfo {
    constructor(e) {
        this.e = e;
    }
    getPrice(tokenAddress, pairAddress, divide, wavaxPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let pair = new this.e.Web3.eth.Contract(PairABI, pairAddress);
                let reserves = yield pair.methods.getReserves().call();
                let token0 = yield pair.methods.token0().call();
                if (!reserves._reserve1 || !reserves._reserve0 || !token0) {
                    reject(0);
                    return 0;
                }
                let price = reserves._reserve1 / reserves._reserve0;
                if (token0 == tokenAddress) {
                    price = reserves._reserve0 / reserves._reserve1;
                }
                if (!divide)
                    resolve(price);
                if (wavaxPrice)
                    resolve(wavaxPrice / price);
            }));
        });
    }
    getSupply(tokenAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let token = new this.e.Web3.eth.Contract(ERC20ABI, tokenAddress);
                try {
                    let mcap = yield token.methods.totalSupply().call();
                    resolve(Number(BigInt(mcap) / BigInt(10 ** 18)));
                }
                catch (_a) {
                    reject(0);
                }
            }));
        });
    }
    getExposurePrice(tokenAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (!this.e.CurrentEpoch)
                    this.e.CurrentEpoch = yield this.e.ExposureObject.methods.epoch().call();
                try {
                }
                catch (_a) {
                }
                let price = yield this.e.ExposureObject.methods.getTokenPrice(this.e.CurrentEpoch, tokenAddress).call().catch((err) => console.log(err));
                resolve(Number(BigInt(price) / BigInt(10 ** 16)) / (100));
            }));
        });
    }
    getIndexPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (!this.e.CurrentEpoch)
                    this.e.CurrentEpoch = yield this.e.ExposureObject.methods.epoch().call();
                let divisor = yield this.e.ExposureObject.methods.getIndexDivisor(this.e.CurrentEpoch).call().catch((err) => console.log(err));
                divisor = Number(BigInt(divisor) / BigInt(10 ** 14)) / (10 ** 4);
                let v = 0;
                for (const i in this.e.Tokens) {
                    let val = yield this.e.ExposureObject.methods.getTokenMarketCap(this.e.CurrentEpoch, this.e.Tokens[i].tokenAddress).call().catch((err) => console.log(err));
                    v += Number(BigInt(val) / BigInt(10 ** 18));
                }
                resolve(v / divisor);
            }));
        });
    }
    actualIndexPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (!this.e.CurrentEpoch)
                    this.e.CurrentEpoch = yield this.e.ExposureObject.methods.epoch().call();
                let divisor = yield this.e.ExposureObject.methods.getIndexDivisor(this.e.CurrentEpoch).call();
                divisor /= 10 ** 18;
                let mcaps = yield this.getPricesAndMcaps();
                delete mcaps.mcaps["WAVAX/USDC"];
                // @ts-ignore
                let v = yield Object.values(mcaps.mcaps).reduce((tot, val) => tot + val);
                // @ts-ignore
                resolve(v / divisor);
            }));
        });
    }
    tokenPortionIndex(tracked) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                this.e.CurrentEpoch = yield this.e.ExposureObject.methods.epoch().call();
                let v = 0;
                for (const i in this.e.Tokens) {
                    if (tracked) {
                        let wavaxPrice = yield this.getPrice(this.e.WAVAX.tokenAddress, this.e.WAVAX.pairAddress, false, 0);
                        let price = yield this.getPrice(this.e.Tokens[i].tokenAddress, this.e.Tokens[i].pairAddress, true, wavaxPrice);
                        let portion = yield this.e.ExposureObject.methods.getTokenPortions(this.e.CurrentEpoch, this.e.Tokens[i].tokenAddress).call();
                        v += ((price) * (portion)) / 1e18;
                        continue;
                    }
                    let price = yield this.e.ExposureObject.methods.getTokenPrice(this.e.CurrentEpoch, this.e.Tokens[i].tokenAddress).call();
                    let portion = yield this.e.ExposureObject.methods.getTokenPortions(this.e.CurrentEpoch, this.e.Tokens[i].tokenAddress).call();
                    v += ((price / 1e18) * (portion / 1e18));
                }
                resolve(v);
            }));
        });
    }
    getNAV() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let balances = yield this.getAllExposureTokenBalances(this.e.ExposureAddress);
                let prices = yield this.getPricesAndMcaps();
                delete prices.prices["WAVAX/USDC"];
                let nav = yield Object.values(prices.prices).reduce((tot, token, i) => tot + (balances[this.e.Tokens[i].token] * prices.prices[this.e.Tokens[i].name]), 0);
                resolve(nav);
            }));
        });
    }
    getBalanceOfAddress(tokenAddress, publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let token = new this.e.Web3.eth.Contract(ERC20ABI, tokenAddress);
                let tokenBalance = yield token.methods.balanceOf(publicKey).call();
                resolve(Number(BigInt(tokenBalance) / BigInt(10 ** 18)));
            }));
        });
    }
    getAllExposureTokenBalances(accountAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let balances = {
                    'WAVAX': yield this.getBalanceOfAddress(this.e.WAVAX.tokenAddress, accountAddress),
                    'USDC': yield this.getBalanceOfAddress(this.e.USDCAddress, accountAddress)
                };
                for (const i in this.e.Tokens) {
                    balances[this.e.Tokens[i].token] = yield this.getBalanceOfAddress(this.e.Tokens[i].tokenAddress, accountAddress);
                }
                resolve(balances);
            }));
        });
    }
    getPricesAndMcaps() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let wavaxPrice = yield this.getPrice(this.e.WAVAX.tokenAddress, this.e.WAVAX.pairAddress, false, 0);
                let wavaxSupply = yield this.getSupply(this.e.WAVAX.tokenAddress);
                wavaxSupply *= wavaxPrice;
                let prices = { "WAVAX/USDC": wavaxPrice };
                let mcaps = { "WAVAX/USDC": wavaxSupply };
                for (const i in this.e.Tokens) {
                    let price = yield this.getPrice(this.e.Tokens[i].tokenAddress, this.e.Tokens[i].pairAddress, true, wavaxPrice);
                    let supply = yield this.getSupply(this.e.Tokens[i].tokenAddress);
                    prices[this.e.Tokens[i].name] = price;
                    mcaps[this.e.Tokens[i].name] = supply * price;
                    yield (0, util_1.sleep)(100);
                }
                resolve({ prices, mcaps });
            }));
        });
    }
    tradeToken(side, accountAddress, transferInAddress, transferOutAddress, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let token = new this.e.Web3.eth.Contract(ERC20ABI, transferInAddress);
                let router = new this.e.Web3.eth.Contract(RouterABI, this.e.RouterAddress);
                let deadline = Math.floor((Date.now() + 200000) / 1000);
                let path = [transferInAddress, transferOutAddress];
                let newAmount = amount;
                if (side == "buy") {
                    let _newAmount = yield router.methods.getAmountsIn(amount, path).call();
                    newAmount = _newAmount[0];
                }
                yield token.methods.approve(this.e.RouterAddress, newAmount).send({ from: accountAddress }).catch((err) => {
                    console.log(err);
                    resolve(false);
                });
                let swap = yield router.methods.swapExactTokensForTokens(newAmount, 1, path, accountAddress, deadline).send({ from: accountAddress }).catch((err) => {
                    console.log(err);
                    resolve(false);
                });
                resolve(swap);
            }));
        });
    }
    epochNotification(notif) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok) => __awaiter(this, void 0, void 0, function* () {
                let nav = yield this.getNAV();
                // let prices = await this.getPricesAndMcaps()
                // let p = "**Prices**: \n"
                // let pa: { [key: string]: any } = {}
                // let ma: any[any] = []
                // let m = "**MCAPs**: \n"
                // for (const i in prices.prices) {
                //     p += i + ": " + prices.prices[i].toLocaleString() + "\n"
                //     m += i + ": " + prices.mcaps[i].toLocaleString() + "\n"
                //     pa[i] = prices.prices[i]
                //     ma[i] = prices.prices[i]
                // }
                // let ep = "**Exposure Prices**: \n"
                // let xp: { [key: string]: any } = {}
                // for (const i in this.e.Tokens) {
                //     let pr = await this.getExposurePrice(this.e.Tokens[i].tokenAddress)
                //     ep += this.e.Tokens[i].token + ": " + pr.toLocaleString() + "\n"
                //     xp[i] = pr
                // }
                let ind = yield this.getIndexPrice();
                let actual = yield this.actualIndexPrice();
                let portion = yield this.tokenPortionIndex(false);
                let tportion = yield this.tokenPortionIndex(true);
                let shareBalance = yield this.e.ExposureObject.methods.totalSupply().call();
                let info = "Index Price:                                $" + ind.toLocaleString() + "\nPortion Index Price:                  $" + portion.toLocaleString() + "\nTracked Portion Index Price:   $" + tportion.toLocaleString() + "\nTrue Index Price:                       $" + actual.toLocaleString()
                    + "\nNAV: $" + nav.toLocaleString() + " \n" + "NAV Per Share: $" + (nav / (Number(BigInt(shareBalance) / BigInt(10 ** 16)) / 100)).toLocaleString() + "\n" + "Total Shares: " + shareBalance + "\n";
                // + p + ep
                if (notif)
                    yield (0, discordbot_1.sendDiscordWebook)(info);
                ok(info);
            }));
        });
    }
    calculateTradeAmount(side) {
        return __awaiter(this, void 0, void 0, function* () {
            let prices = yield this.getPricesAndMcaps();
            let toTrade = [];
            let method = "getTokenSellAmount";
            if (side)
                method = "getTokenBuyAmount";
            for (const i in this.e.Tokens) {
                let tradeAmount = yield this.e.ExposureObject.methods[method](this.e.CurrentEpoch.toString(), this.e.Tokens[i].tokenAddress).call().catch((err) => {
                    console.log(err);
                });
                toTrade.push({ name: this.e.Tokens[i].name, amountToTrade: (Number(BigInt(tradeAmount) / BigInt(10 ** 14)) / 10 ** 4), toTradeUSD: (Number(BigInt(tradeAmount) / BigInt(10 ** 14)) / 10 ** 4) * prices.prices[this.e.Tokens[i].name], currentPrice: prices.prices[this.e.Tokens[i].name], estimatedNewPrice: 0 });
            }
            return toTrade;
        });
    }
}
exports.ExposureInfo = ExposureInfo;
