import {editConfig, sleep} from "./util";
import {ExposureSteps} from "./steps";
import {Config, Tokens, TradingAccounts, WAVAX} from "./types";
import {sendDiscordWebook} from "./discordbot";

const HDWalletProvider = require("@truffle/hdwallet-provider");
const web3 = require('web3');
const Accounts = require('web3-eth-accounts');

const ExposureABI = require("../abi/exposure.json")
const ERC20ABI = require("../abi/erc20.json")
const ExposureFactoryABI = require("../abi/exposure_factory.json");

export class ExposureAdmin {
    ExposureAddress: string;
    readonly RouterAddress: string;
    readonly USDCAddress: string;
    ExposureFactoryAddress: string;
    readonly WAVAX: WAVAX;
    Tokens: Tokens[];
    Provider: any;
    Accounts: any;
    Web3: any;
    ExposureABI: any;
    PublicKey: any;
    RunBot: boolean;
    TestnetAccounts: TradingAccounts[];
    Status: any;
    APIPort: number;
    ExposureObject: any
    API: string;
    CurrentEpoch: any;
    Baskets: { [key: string]: any }
    private DiscordBot: string;
    private PrivateKey: string;

    constructor(config: Config) {
        this.RunBot = config.bot
        this.PrivateKey = config.privateKey
        this.API = config.APIURL
        this.ExposureAddress = config.exposureAddress
        this.RouterAddress = config.routerAddress
        this.ExposureFactoryAddress = config.exposureFactoryAddress
        this.USDCAddress = config.USDCAddress
        this.WAVAX = config.WAVAX
        this.Tokens = config.tokens
        this.TestnetAccounts = config.accounts
        this.APIPort = config.apiPort
        this.Provider = new HDWalletProvider(this.PrivateKey, this.API);
        this.Accounts = new Accounts(this.Provider);
        this.Web3 = new web3(this.Provider);
        this.ExposureABI = ExposureABI
        this.ExposureObject = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress)
        this.PublicKey = this.Accounts.privateKeyToAccount(this.PrivateKey).address;
        this.DiscordBot = ""
        this.CurrentEpoch = 0
        this.Baskets = config.baskets
        this.setInitialEpoch().then(r => this.CurrentEpoch = r)
    }

    async changeAccount(key: string): Promise<boolean> {
        return new Promise(async (ok, reject) => {
            try {
                this.Provider = new HDWalletProvider(key, this.API);
                this.Accounts = new Accounts(this.Provider);
                this.Web3 = new web3(this.Provider);
                this.ExposureObject = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress)
                ok(true)
            } catch {
                reject(false)
            }
        })
    }

    async newETF(etfName: string, etfSymbol: string): Promise<string | void> {
        if (!await this.changeAccount(this.PrivateKey))
            return
        const factory = new this.Web3.eth.Contract(ExposureFactoryABI, this.ExposureFactoryAddress)
        let newBasket
        try {
            newBasket = await factory.methods.deployNewAssetBasket(etfName, etfSymbol, this.RouterAddress, this.WAVAX.tokenAddress, this.WAVAX.pairAddress, this.USDCAddress, this.PublicKey).send({from: this.PublicKey})
        } catch {
            console.error("Failed to deploy new basket")
            return
        }
        if (newBasket.events.length == 0)
            return
        this.ExposureAddress = newBasket?.events[0]?.address || "Bad address"
        await sendDiscordWebook(`New Exposure ETF address: ${newBasket.events[0].address} | Name: ${etfName} | Symbol: ${etfSymbol}`)
        this.ExposureObject = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress)
        await editConfig("exposureAddress", this.ExposureAddress)
        await sleep(1000)
        await this.initExposure()
        return this.ExposureAddress
    }

    async initExposure(): Promise<void> {
        if (!await this.changeAccount(this.PrivateKey))
            return
        await sleep(1000)
        await this.ExposureObject.methods.startETF().send({from: this.PublicKey}).catch(() => {
            console.log("Basket already started")
        })
        await this.runSteps(1, 9)
        await this.ExposureObject.methods.initETF().send({from: this.PublicKey}).then(() => {
            console.log("done")
        }).catch(async (err: any) => {
            await this.initExposure()
            console.log(err)
        })
    }

    async nextEpoch(): Promise<void> {
        if (!await this.changeAccount(this.PrivateKey))
            return
        await sendDiscordWebook("Starting next epoch | Current epoch: " + this.CurrentEpoch)
        await this.runSteps(0, 10)
        this.CurrentEpoch = await this.ExposureObject.methods.epoch().call()
        await sendDiscordWebook("New epoch: " + this.CurrentEpoch)
    }

    async burnShares(amount: bigint): Promise<bigint> {
        return new Promise(async resolve => {
            let shareBalance = await this.ExposureObject.methods.balanceOf(this.PublicKey).call()
            await this.ExposureObject.methods.approve(this.ExposureAddress, amount).send({from: this.PublicKey}).catch((err: any) => {
                console.log(err)
                resolve(shareBalance)
            })
            await this.ExposureObject.methods.burn(amount, this.PublicKey).send({from: this.PublicKey}).catch((err: any) => {
                console.log(err)
                resolve(shareBalance)
            })
            shareBalance = await this.ExposureObject.methods.balanceOf(this.PublicKey).call()
            resolve(shareBalance)
        })
    }

    async mintShares(amount: bigint): Promise<bigint> {
        return new Promise(async resolve => {
            let shareBalance = await this.ExposureObject.methods.balanceOf(this.PublicKey).call()
            this.CurrentEpoch = await this.ExposureObject.methods.epoch().call()
            let portions: { [key: string]: any } = {}
            let err
            for (const i in this.Tokens) {
                let portion = await this.ExposureObject.methods.getTokenPortions(this.CurrentEpoch, this.Tokens[i].tokenAddress).call()
                portions[this.Tokens[i].token] = (BigInt(portion) * BigInt(amount)) / BigInt(10 * 18)
                const token = new this.Web3.eth.Contract(ERC20ABI, this.Tokens[i].tokenAddress)
                await token.methods.approve(this.ExposureAddress, BigInt(portions[this.Tokens[i].token])).send({from: this.PublicKey}).catch((err: any) => {
                    console.log(err)
                    resolve(shareBalance)
                })
            }
            if (err)
                return

            await this.ExposureObject.methods.mint(amount, this.PublicKey).send({from: this.PublicKey}).catch((err: any) => {
                resolve(shareBalance)
            })
            shareBalance = await this.ExposureObject.methods.balanceOf(this.PublicKey).call()
            resolve(shareBalance)
        })
    }

    async switchBasket(basket: string): Promise<void> {
        if (!this.Baskets[basket])
            return
        this.Tokens = this.Baskets[basket].Tokens
        this.ExposureAddress = basket
        await this.changeAccount(this.PrivateKey)
    }

    private async setInitialEpoch() {
        return await this.ExposureObject.methods.epoch().call()
    }

    private async runSteps(step: number, maxStep: number) {
        let currentEpoch = await this.ExposureObject.methods.epoch().call()
        const exposureSteps = new ExposureSteps(this.ExposureObject, this.PublicKey, this.Tokens)
        for (step; step <= maxStep; step++) {
            await sleep(2000)
            currentEpoch = await this.ExposureObject.methods.epoch().call()
            if (step == 4)
                await this.ExposureObject.methods.changeIndexDivisor(0, (100000000 + "0".repeat(18).toString())).send({from: this.PublicKey}).catch((err: any) => {
                    console.log("STEP 4 chaing index diviso", err)
                })
            console.log("Starting step", step)
            await exposureSteps.executeStep(step).then(async () => {
                await sendDiscordWebook(`Step ${step} done`)
                console.log(step, "done")
                await sleep(1000)
            }).catch(async (err) => {
                let error = err.toString().split("\n")
                if (!error[0])
                    return
                await sendDiscordWebook(`Step ${step} error: ${error[0]}`)
                console.log(error[0])

                await sleep(15000)
                step = Number(await this.ExposureObject.methods.rebalanceStep().call()) - 1
                console.log(step + 1)
            })

        }
        await sendDiscordWebook(`Finished initializing basket`)
        await sleep(2000)
    }
}


