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
class ExposureAdmin {
    constructor(config) {
        this.RunBot = config.bot;
        this.PrivateKey = config.privateKey;
        this.API = config.APIURL;
        this.ExposureAddress = config.exposureAddress;
        this.RouterAddress = config.routerAddress;
        this.ExposureFactoryAddress = config.exposureFactoryAddress;
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
    setInitialEpoch() {
        return __awaiter(this, void 0, void 0, function* () {
            this.CurrentEpoch = yield this.ExposureObject.methods.epoch().call();
        });
    }
    changeAccount(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.Provider = new HDWalletProvider(key, this.API);
                    this.Accounts = new Accounts(this.Provider);
                    this.Web3 = new web3(this.Provider);
                    ok(true);
                }
                catch (_a) {
                    reject(false);
                }
            }));
        });
    }
    newETF(etfName, etfSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.changeAccount(this.PrivateKey)))
                return;
            const factory = new this.Web3.eth.Contract(ExposureFactoryABI, this.ExposureFactoryAddress);
            const newBasket = yield factory.methods.deployNewAssetBasket(etfName, etfSymbol, this.RouterAddress, this.WAVAX.tokenAddress, this.WAVAX.pairAddress, this.USDCAddress, this.PublicKey).send({ from: this.PublicKey });
            yield discordbot_1.sendDiscordWebook(`New Exposure ETF address: ${newBasket.events[0].address} | Name: ${etfName} | Symbol: ${etfSymbol}`);
            this.ExposureAddress = newBasket.events[0].address;
            this.ExposureObject = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress);
            yield util_1.editConfig("exposureAddress", this.ExposureAddress);
            yield util_1.sleep(1000);
            yield this.initExposure();
            return this.ExposureAddress;
        });
    }
    runSteps(step, maxStep) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentEpoch = yield this.ExposureObject.methods.epoch().call();
            const exposureSteps = new steps_1.ExposureSteps(this.ExposureObject, this.PublicKey, this.Tokens);
            for (step; step <= maxStep; step++) {
                yield util_1.sleep(2000);
                currentEpoch = yield this.ExposureObject.methods.epoch().call();
                if (step == 4)
                    yield this.ExposureObject.methods.changeIndexDivisor(0, (100000000 + "0".repeat(18).toString())).send({ from: this.PublicKey }).catch((err) => {
                        console.log("STEP 4 chaing index diviso", err);
                    });
                console.log("Starting step", step);
                yield exposureSteps.executeStep(step).then(() => __awaiter(this, void 0, void 0, function* () {
                    yield discordbot_1.sendDiscordWebook(`Step ${step} done`);
                    console.log(step, "done");
                    yield util_1.sleep(1000);
                })).catch((err) => __awaiter(this, void 0, void 0, function* () {
                    let error = err.toString().split("\n");
                    if (!error[0])
                        return;
                    yield discordbot_1.sendDiscordWebook(`Step ${step} error: ${error[0]}`);
                    console.log(error[0]);
                    yield util_1.sleep(15000);
                    step = Number(yield this.ExposureObject.methods.rebalanceStep().call()) - 1;
                    console.log(step + 1);
                }));
            }
            yield util_1.sleep(2000);
        });
    }
    initExposure() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.changeAccount(this.PrivateKey)))
                return;
            yield util_1.sleep(1000);
            yield this.ExposureObject.methods.startETF().send({ from: this.PublicKey }).catch(() => {
                console.log("Basket already started");
            });
            yield this.runSteps(1, 9);
            yield this.ExposureObject.methods.initETF().send({ from: this.PublicKey }).then(() => {
                console.log("done");
            }).catch((err) => __awaiter(this, void 0, void 0, function* () {
                yield this.initExposure();
                console.log(err);
            }));
        });
    }
    nextEpoch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.changeAccount(this.PrivateKey)))
                return;
            yield discordbot_1.sendDiscordWebook("Starting next epoch | Current epoch: " + this.CurrentEpoch);
            yield this.runSteps(0, 10);
            this.CurrentEpoch = yield this.ExposureObject.methods.epoch().call();
            yield discordbot_1.sendDiscordWebook("New epoch: " + this.CurrentEpoch);
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
}
exports.ExposureAdmin = ExposureAdmin;
