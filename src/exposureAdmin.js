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
exports.ExposureAdmin = void 0;
const util_1 = require("./util");
const steps_1 = require("./steps");
const discordbot_1 = require("./discordbot");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const web3 = require('web3');
const Accounts = require('web3-eth-accounts');
const ExposureABI = require("../abi/exposure.json");
const ERC20ABI = require("../abi/erc20.json");
const ExposureFactoryABI = require("../abi/exposure_factory.json");
const BasketSharesFactory = require("../abi/BasketSharesFactory.json");
class ExposureAdmin {
    constructor(config) {
        this.RunBot = config.bot;
        this.PrivateKey = config.privateKey;
        this.API = config.APIURL;
        this.ExposureAddress = config.exposureAddress;
        this.RouterAddress = config.routerAddress;
        this.ExposureFactoryAddress = config.exposureFactoryAddress;
        this.SharesFactoryAddress = config.sharesFactoryAddress;
        this.USDCAddress = config.USDCAddress;
        this.WAVAX = config.WAVAX;
        this.Tokens = config.tokens;
        this.TestnetAccounts = config.accounts;
        this.APIPort = config.apiPort;
        this.Provider = new HDWalletProvider(this.PrivateKey, this.API);
        this.Accounts = new Accounts(this.Provider);
        this.Web3 = new web3(this.Provider);
        this.ExposureABI = ExposureABI;
        this.ExposureObject = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress);
        this.PublicKey = this.Accounts.privateKeyToAccount(this.PrivateKey).address;
        this.DiscordBot = "";
        this.CurrentEpoch = 0;
        this.Baskets = config.baskets;
        this.setInitialEpoch().then(r => this.CurrentEpoch = r);
    }
    changeAccount(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.Provider = new HDWalletProvider(key, this.API);
                    this.Accounts = new Accounts(this.Provider);
                    this.Web3 = new web3(this.Provider);
                    this.ExposureObject = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress);
                    ok(true);
                }
                catch (_a) {
                    reject(false);
                }
            }));
        });
    }
    newETF(etfName, etfSymbol) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.changeAccount(this.PrivateKey)))
                return;
            const factory = new this.Web3.eth.Contract(ExposureFactoryABI, this.ExposureFactoryAddress);
            let newBasket;
            try {
                newBasket = yield factory.methods.deployNewAssetBasket(etfName, etfSymbol, this.RouterAddress, this.WAVAX.tokenAddress, this.WAVAX.pairAddress, this.USDCAddress, this.PublicKey).send({ from: this.PublicKey });
            }
            catch (_b) {
                console.error("Failed to deploy new basket");
                return;
            }
            if (newBasket.events.length == 0)
                return;
            this.ExposureAddress = ((_a = newBasket === null || newBasket === void 0 ? void 0 : newBasket.events[0]) === null || _a === void 0 ? void 0 : _a.address) || "Bad address";
            let sharesFactory = new this.Web3.eth.Contract(BasketSharesFactory, this.SharesFactoryAddress);
            let sharesAddy = yield sharesFactory.methods.newBasketSharesContract(etfName, etfSymbol, this.ExposureAddress).send({ from: this.PublicKey }).catch((err) => {
                console.error("Failed to create shares contract |", err);
            });
            console.log(sharesAddy);
        });
    }
    initExposure(etfName, etfSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.changeAccount(this.PrivateKey)))
                return;
            yield (0, util_1.sleep)(1000);
            // let sharesFactory = new this.Web3.eth.Contract(BasketShares, this.SharesFactoryAddress)
            // await sharesFactory.methods.newBasketSharesContract(etfName, etfSymbol, this.ExposureAddress).catch((err: any) => {
            //     console.error("Failed to create shares contract |", err)
            // })
            yield this.ExposureObject.methods.setBasketSharesAddress().send({ from: this.PublicKey }).catch(() => {
                console.log("Basket already started");
            });
            yield this.runSteps(1, 9);
            yield this.ExposureObject.methods.initETF().send({ from: this.PublicKey }).then(() => {
                console.log("done");
            }).catch((err) => __awaiter(this, void 0, void 0, function* () {
                yield this.initExposure(etfName, etfSymbol);
                console.log(err);
            }));
        });
    }
    nextEpoch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.changeAccount(this.PrivateKey)))
                return;
            yield (0, discordbot_1.sendDiscordWebook)("Starting next epoch | Current epoch: " + this.CurrentEpoch);
            yield this.runSteps(0, 10);
            this.CurrentEpoch = yield this.ExposureObject.methods.epoch().call();
            yield (0, discordbot_1.sendDiscordWebook)("New epoch: " + this.CurrentEpoch);
        });
    }
    burnShares(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let shareBalance = yield this.ExposureObject.methods.balanceOf(this.PublicKey).call();
                yield this.ExposureObject.methods.approve(this.ExposureAddress, amount).send({ from: this.PublicKey }).catch((err) => {
                    console.log(err);
                    resolve(shareBalance);
                });
                yield this.ExposureObject.methods.burn(amount, this.PublicKey).send({ from: this.PublicKey }).catch((err) => {
                    console.log(err);
                    resolve(shareBalance);
                });
                shareBalance = yield this.ExposureObject.methods.balanceOf(this.PublicKey).call();
                resolve(shareBalance);
            }));
        });
    }
    mintShares(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let shareBalance = yield this.ExposureObject.methods.balanceOf(this.PublicKey).call();
                this.CurrentEpoch = yield this.ExposureObject.methods.epoch().call();
                let portions = {};
                let err;
                for (const i in this.Tokens) {
                    let portion = yield this.ExposureObject.methods.getTokenPortions(this.CurrentEpoch, this.Tokens[i].tokenAddress).call();
                    portions[this.Tokens[i].token] = (BigInt(portion) * BigInt(amount)) / BigInt(10 * 18);
                    const token = new this.Web3.eth.Contract(ERC20ABI, this.Tokens[i].tokenAddress);
                    yield token.methods.approve(this.ExposureAddress, BigInt(portions[this.Tokens[i].token])).send({ from: this.PublicKey }).catch((err) => {
                        console.log(err);
                        resolve(shareBalance);
                    });
                }
                if (err)
                    return;
                yield this.ExposureObject.methods.mint(amount, this.PublicKey).send({ from: this.PublicKey }).catch((err) => {
                    resolve(shareBalance);
                });
                shareBalance = yield this.ExposureObject.methods.balanceOf(this.PublicKey).call();
                resolve(shareBalance);
            }));
        });
    }
    switchBasket(basket) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.Baskets[basket])
                return;
            this.Tokens = this.Baskets[basket].Tokens;
            this.ExposureAddress = basket;
            yield this.changeAccount(this.PrivateKey);
        });
    }
    setInitialEpoch() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ExposureObject.methods.epoch().call();
        });
    }
    runSteps(step, maxStep) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentEpoch = yield this.ExposureObject.methods.epoch().call();
            const exposureSteps = new steps_1.ExposureSteps(this.ExposureObject, this.PublicKey, this.Tokens);
            for (step; step <= maxStep; step++) {
                yield (0, util_1.sleep)(2000);
                currentEpoch = yield this.ExposureObject.methods.epoch().call();
                if (step == 4)
                    yield this.ExposureObject.methods.changeIndexDivisor(0, (100000000 + "0".repeat(18).toString())).send({ from: this.PublicKey }).catch((err) => {
                        console.log("STEP 4 chaing index diviso", err);
                    });
                console.log("Starting step", step);
                yield exposureSteps.executeStep(step).then(() => __awaiter(this, void 0, void 0, function* () {
                    yield (0, discordbot_1.sendDiscordWebook)(`Step ${step} done`);
                    console.log(step, "done");
                    yield (0, util_1.sleep)(1000);
                })).catch((err) => __awaiter(this, void 0, void 0, function* () {
                    let error = err.toString().split("\n");
                    if (!error[0])
                        return;
                    yield (0, discordbot_1.sendDiscordWebook)(`Step ${step} error: ${error[0]}`);
                    console.log(error[0]);
                    yield (0, util_1.sleep)(15000);
                    step = Number(yield this.ExposureObject.methods.rebalanceStep().call()) - 1;
                    console.log(step + 1);
                }));
            }
            yield (0, discordbot_1.sendDiscordWebook)(`Finished initializing basket`);
            yield (0, util_1.sleep)(2000);
        });
    }
}
exports.ExposureAdmin = ExposureAdmin;
//27.18
