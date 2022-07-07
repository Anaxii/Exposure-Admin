import {ExposureAdmin} from "./exposureAdmin";
import {sleep} from "./util";
import {sendDiscordWebook} from "./discordbot";
import {ExposureToTrade} from "./types";
// import {validateAddress} from "./decorators";
const PairABI = require("../abi/pair.json")
const ERC20ABI = require("../abi/erc20.json")
const RouterABI = require("../abi/router.json");

// @validateAddress()
export class ExposureInfo {
    private e: ExposureAdmin;

    constructor(e: ExposureAdmin) {
        this.e = e
    }

    async getPrice(tokenAddress: string, pairAddress: string, divide: boolean | undefined, wavaxPrice: number | undefined): Promise<number> {
        return new Promise(async (resolve, reject) => {
            let pair = new this.e.Web3.eth.Contract(PairABI, pairAddress)

            let reserves = await pair.methods.getReserves().call()
            let token0 = await pair.methods.token0().call()

            if (!reserves._reserve1 || !reserves._reserve0 || !token0) {
                reject(0)
                return 0
            }

            let price = reserves._reserve1 / reserves._reserve0
            if (token0 == tokenAddress) {
                price = reserves._reserve0 / reserves._reserve1
            }

            if (!divide)
                resolve(price)
            if (wavaxPrice)
                resolve(wavaxPrice / price)
        })
    }


    async getSupply(tokenAddress: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            let token = new this.e.Web3.eth.Contract(ERC20ABI, tokenAddress)
            try {
                let mcap = await token.methods.totalSupply().call()
                resolve(Number(BigInt(mcap) / BigInt(10 ** 18)))
            } catch {
                reject(0)
            }

        })
    }

    async getExposurePrice(tokenAddress: string): Promise<number> {
        return new Promise(async resolve => {
            if (!this.e.CurrentEpoch)
                this.e.CurrentEpoch = await this.e.ExposureObject.methods.epoch().call()
            try {

            } catch {

            }
            let price = await this.e.ExposureObject.methods.getTokenPrice(this.e.CurrentEpoch, tokenAddress).call().catch((err: any) => console.log(err))
            console.log("Test")
            resolve(Number(BigInt(price) / BigInt(10 ** 16)) / (100))
        })
    }

    async getIndexPrice(): Promise<number> {
        return new Promise(async resolve => {
            if (!this.e.CurrentEpoch)
                this.e.CurrentEpoch = await this.e.ExposureObject.methods.epoch().call()
            let divisor = await this.e.ExposureObject.methods.getIndexDivisor(this.e.CurrentEpoch).call().catch((err: any) => console.log(err))
            divisor = Number(BigInt(divisor) / BigInt(10 ** 14)) / (10 ** 4)
            let v = 0
            for (const i in this.e.Tokens) {
                let val = await this.e.ExposureObject.methods.getTokenMarketCap(this.e.CurrentEpoch, this.e.Tokens[i].tokenAddress).call().catch((err: any) => console.log(err))
                v += Number(BigInt(val) / BigInt(10 ** 18))
            }
            resolve(v / divisor)
        })
    }

    async actualIndexPrice(): Promise<number> {
        return new Promise(async resolve => {
            if (!this.e.CurrentEpoch)
                this.e.CurrentEpoch = await this.e.ExposureObject.methods.epoch().call()
            let divisor = await this.e.ExposureObject.methods.getIndexDivisor(this.e.CurrentEpoch).call()
            divisor /= 10 ** 18
            let mcaps = await this.getPricesAndMcaps()
            delete mcaps.mcaps["WAVAX/USDC"]
            // @ts-ignore
            let v = await Object.values(mcaps.mcaps).reduce((tot, val) => tot + val)
            // @ts-ignore
            resolve(v / divisor)
        })
    }

    async tokenPortionIndex(tracked: boolean | null): Promise<number> {
        return new Promise(async resolve => {
            this.e.CurrentEpoch = await this.e.ExposureObject.methods.epoch().call()
            let v = 0
            for (const i in this.e.Tokens) {
                if (tracked) {
                    let wavaxPrice = await this.getPrice(this.e.WAVAX.tokenAddress, this.e.WAVAX.pairAddress, false, 0)
                    let price = await this.getPrice(this.e.Tokens[i].tokenAddress, this.e.Tokens[i].pairAddress, true, wavaxPrice)
                    let portion = await this.e.ExposureObject.methods.getTokenPortions(this.e.CurrentEpoch, this.e.Tokens[i].tokenAddress).call()
                    v += ((price) * (portion)) / 1e18
                    continue
                }
                let price = await this.e.ExposureObject.methods.getTokenPrice(this.e.CurrentEpoch, this.e.Tokens[i].tokenAddress).call()
                let portion = await this.e.ExposureObject.methods.getTokenPortions(this.e.CurrentEpoch, this.e.Tokens[i].tokenAddress).call()
                v += ((price / 1e18) * (portion / 1e18))
            }
            resolve(v)
        })
    }

    async getNAV(): Promise<number> {
        return new Promise(async resolve => {
            let balances = await this.getAllExposureTokenBalances(this.e.ExposureAddress)
            let prices = await this.getPricesAndMcaps()
            delete prices.prices["WAVAX/USDC"]
            let nav = await Object.values(prices.prices).reduce((tot: number, token, i) => tot + (balances[this.e.Tokens[i].token] * prices.prices[this.e.Tokens[i].name]), 0)
            resolve(nav)
        })
    }

    async getBalanceOfAddress(tokenAddress: string, publicKey: string) {
        return new Promise(async resolve => {
            let token = new this.e.Web3.eth.Contract(ERC20ABI, tokenAddress)
            let tokenBalance = await token.methods.balanceOf(publicKey).call()
            resolve(Number(BigInt(tokenBalance) / BigInt(10 ** 18)))
        })
    }

    async getAllExposureTokenBalances(accountAddress: string): Promise<{ [key: string]: number }> {
        return new Promise(async resolve => {
            let balances: { [key: string]: any } = {
                'WAVAX': await this.getBalanceOfAddress(this.e.WAVAX.tokenAddress, accountAddress),
                'USDC': await this.getBalanceOfAddress(this.e.USDCAddress, accountAddress)
            }
            for (const i in this.e.Tokens) {
                balances[this.e.Tokens[i].token] = await this.getBalanceOfAddress(this.e.Tokens[i].tokenAddress, accountAddress)
            }
            resolve(balances)
        })
    }

    async getPricesAndMcaps(): Promise<any> {
        return new Promise(async resolve => {
            let wavaxPrice: number = await this.getPrice(this.e.WAVAX.tokenAddress, this.e.WAVAX.pairAddress, false, 0)
            let wavaxSupply: number = await this.getSupply(this.e.WAVAX.tokenAddress)
            wavaxSupply *= wavaxPrice
            let prices: { [key: string]: any } = {"WAVAX/USDC": wavaxPrice}
            let mcaps: { [key: string]: any } = {"WAVAX/USDC": wavaxSupply}
            for (const i in this.e.Tokens) {
                let price = await this.getPrice(this.e.Tokens[i].tokenAddress, this.e.Tokens[i].pairAddress, true, wavaxPrice)
                let supply = await this.getSupply(this.e.Tokens[i].tokenAddress)
                prices[this.e.Tokens[i].name] = price
                mcaps[this.e.Tokens[i].name] = supply * price
                await sleep(100)
            }
            resolve({prices, mcaps})
        })
    }

    async tradeToken(side: string, accountAddress: string, transferInAddress: string, transferOutAddress: string, amount: bigint) {
        return new Promise(async resolve => {
            let token = new this.e.Web3.eth.Contract(ERC20ABI, transferInAddress)
            let router = new this.e.Web3.eth.Contract(RouterABI, this.e.RouterAddress)
            let deadline = Math.floor((Date.now() + 200000) / 1000)
            let path = [transferInAddress, transferOutAddress]
            let newAmount = amount
            if (side == "buy") {
                let _newAmount: bigint[] = await router.methods.getAmountsIn(amount, path).call()
                newAmount = _newAmount[0]
            }
            await token.methods.approve(this.e.RouterAddress, newAmount).send({from: accountAddress}).catch((err: any) => {
                console.log(err)
                resolve(false)
            })
            let swap = await router.methods.swapExactTokensForTokens(newAmount, 1, path, accountAddress, deadline).send({from: accountAddress}).catch((err: any) => {
                console.log(err)
                resolve(false)
            })
            resolve(swap)
        })
    }

    async epochNotification(notif: boolean) {
        return new Promise(async ok => {
            let nav = await this.getNAV()
            let prices = await this.getPricesAndMcaps()
            let p = "**Prices**: \n"
            let pa: { [key: string]: any } = {}
            let ma: any[any] = []
            let m = "**MCAPs**: \n"
            for (const i in prices.prices) {
                p += i + ": " + prices.prices[i].toLocaleString() + "\n"
                m += i + ": " + prices.mcaps[i].toLocaleString() + "\n"
                pa[i] = prices.prices[i]
                ma[i] = prices.prices[i]
            }
            let ep = "**Exposure Prices**: \n"
            let xp: { [key: string]: any } = {}
            for (const i in this.e.Tokens) {
                let pr = await this.getExposurePrice(this.e.Tokens[i].tokenAddress)
                ep += this.e.Tokens[i].token + ": " + pr.toLocaleString() + "\n"
                xp[i] = pr
            }
            let ind = await this.getIndexPrice()
            let actual = await this.actualIndexPrice()
            let portion = await this.tokenPortionIndex(false)
            let tportion = await this.tokenPortionIndex(true)
            let shareBalance = await this.e.ExposureObject.methods.totalSupply().call()
            let info = "Index Price:                                $" + ind.toLocaleString() + "\nPortion Index Price:                  $" + portion.toLocaleString() + "\nTracked Portion Index Price:   $" + tportion.toLocaleString() + "\nTrue Index Price:                       $" + actual.toLocaleString()
                + "\nNAV: $" + nav.toLocaleString() + " \n" + "NAV Per Share: $" + (nav / (Number(BigInt(shareBalance) / BigInt(10 ** 16)) / 100)).toLocaleString() + "\n" + p + ep
            if (notif)
                await sendDiscordWebook(info)
            ok(info)
        })
    }

    async calculateTradeAmount(side: boolean) {
        let prices = await this.getPricesAndMcaps()
        let toTrade: ExposureToTrade[] = []
        let method = "getTokenSellAmount"
        if (side)
            method = "getTokenBuyAmount"
        for (const i in this.e.Tokens) {
            let tradeAmount = await this.e.ExposureObject.methods[method](this.e.CurrentEpoch.toString(), this.e.Tokens[i].tokenAddress).call().catch((err: any) => {
                console.log(err)
            })
            toTrade.push({name: this.e.Tokens[i].name, amountToTrade: (Number(BigInt(tradeAmount) / BigInt(10**14)) / 10**4), toTradeUSD: (Number(BigInt(tradeAmount) / BigInt(10**14)) / 10**4) * prices.prices[this.e.Tokens[i].name], currentPrice: prices.prices[this.e.Tokens[i].name], estimatedNewPrice: 0})
        }
        return toTrade
    }
}
