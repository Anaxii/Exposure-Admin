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
exports.Exposure = void 0;
const util_1 = require("./src/util");
const steps_1 = require("./src/steps");
const discordbot_1 = require("./src/discordbot");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const web3 = require('web3');
const Accounts = require('web3-eth-accounts');
const fs = require('fs');
const ExposureABI = require("./abi/exposure.json");
const PairABI = require("./abi/pair.json");
const ERC20ABI = require("./abi/erc20.json");
const RouterABI = require("./abi/router.json");
const ExposureFactoryABI = require("./abi/exposure_factory.json");
class Exposure {
    constructor(config) {
        this.Status = config.status;
        this.Init = config.init;
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
        this.ShareCreation = config.shareCreation;
        this.Provider = new HDWalletProvider(this.PrivateKey, this.API);
        this.TradingAccounts = new Accounts(this.Provider);
        this.Web3 = new web3(this.Provider);
        this.ExposureABI = ExposureABI;
        this.ExposureObject = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress);
        this.PublicKey = this.Accounts.privateKeyToAccount(this.PrivateKey).address;
        this.Bias = config.bias;
        this.DiscordBot = "";
        this.CurrentEpoch = this.ExposureObject.methods.epoch().call();
    }
    changeAccount(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.Provider = new HDWalletProvider(key, this.API);
                    this.TradingAccounts = new Accounts(this.Provider);
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
            let factory = new this.Web3.eth.Contract(ExposureFactoryABI, this.ExposureFactoryAddress);
            let newBasket = yield factory.methods.deployNewAssetBasket(etfName, etfSymbol, this.RouterAddress, this.WAVAX.tokenAddress, this.WAVAX.pairAddress, this.USDCAddress, this.PublicKey).send({ from: this.PublicKey });
            yield discordbot_1.sendDiscordWebook(`New Exposure ETF address: ${newBasket.events[0].address} | Name: ${etfName} | Symbol: ${etfSymbol}`);
            this.ExposureAddress = newBasket.events[0].address;
            yield util_1.sleep(1000);
            this.initExposure();
        });
    }
    runSteps(step, maxStep) {
        return __awaiter(this, void 0, void 0, function* () {
            let exposure = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress);
            let currentEpoch = yield exposure.methods.epoch().call();
            let exposureSteps = new steps_1.ExposureSteps(exposure, this.PublicKey, this.Tokens);
            for (step; step <= maxStep; step++) {
                yield util_1.sleep(2000);
                currentEpoch = yield exposure.methods.epoch().call();
                if (step == 4)
                    yield exposure.methods.changeIndexDivisor(0, (100000000 + "0".repeat(18).toString())).send({ from: this.PublicKey }).catch((err) => {
                        console.log("STEP 4 chaing index diviso", err);
                    });
                console.log("Starting step", step);
                yield exposureSteps.executeStep(step).then(() => __awaiter(this, void 0, void 0, function* () {
                    console.log(step, "done");
                    yield util_1.sleep(1000);
                })).catch((err) => __awaiter(this, void 0, void 0, function* () {
                    let error = err.toString().split("\n");
                    if (!error[0])
                        return;
                    console.log(error[0]);
                    yield util_1.sleep(15000);
                    step = Number(yield exposure.methods.rebalanceStep().call()) - 1;
                    console.log(step);
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
            let exposure = new this.Web3.eth.Contract(ExposureABI, this.ExposureAddress);
            yield exposure.methods.startETF().send({ from: this.PublicKey }).catch(() => {
                console.log("Basket already started");
            });
            yield this.runSteps(1, 9);
            yield exposure.methods.initETF().send({ from: this.PublicKey }).then(() => {
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
            yield this.runSteps(0, 10);
        });
    }
}
exports.Exposure = Exposure;
