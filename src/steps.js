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
exports.ExposureSteps = void 0;
const util_1 = require("./util");
class ExposureSteps {
    constructor(Exposure, PublicKey, Tokens) {
        this.Exposure = Exposure;
        this.PublicKey = PublicKey;
        this.Tokens = Tokens;
    }
    executeStep(step) {
        return __awaiter(this, void 0, void 0, function* () {
            let steps = {
                0: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        yield this.Exposure.methods.startRebalance().send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                }),
                1: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        let pair_array = [];
                        let token_array = [];
                        for (const i in this.Tokens) {
                            token_array.push(this.Tokens[i].tokenAddress);
                            pair_array.push(this.Tokens[i].pairAddress);
                        }
                        yield this.Exposure.methods.addTokens(token_array, pair_array).send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                }),
                2: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        yield this.Exposure.methods.removeTokens([]).send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                }),
                3: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        for (const i in this.Tokens) {
                            yield this.Exposure.methods.updateTokenMarketCap().send({ from: this.PublicKey }).catch((err) => {
                                reject(err);
                            });
                            yield util_1.sleep(3000);
                        }
                        ok(true);
                    }));
                }),
                4: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        yield this.Exposure.methods.updateIndexTotal().send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                }),
                5: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        for (const i in this.Tokens) {
                            yield this.Exposure.methods.updateTokenPortions().send({ from: this.PublicKey }).then(() => {
                                ok(true);
                            }).catch((err) => {
                                reject(err);
                            });
                        }
                    }));
                }),
                6: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        yield this.Exposure.methods.updateRemainingPortions().send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                }),
                7: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        yield this.Exposure.methods.rebaseLiquidate().send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                }),
                8: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        yield this.Exposure.methods.rebaseBuy().send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                }),
                9: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        yield this.Exposure.methods.finalizeIndexPrice().send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                }),
                10: () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((ok, reject) => __awaiter(this, void 0, void 0, function* () {
                        yield this.Exposure.methods.newEpoch().send({ from: this.PublicKey }).then(() => {
                            ok(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }));
                })
            };
            return yield steps[step]();
        });
    }
}
exports.ExposureSteps = ExposureSteps;
