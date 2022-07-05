import {Tokens} from './types'
import {sleep} from "./util";

export class ExposureSteps {
    private Exposure: any;
    private PublicKey: string;
    private Tokens: Tokens[];

    constructor(Exposure: any, PublicKey: string, Tokens: Tokens[]) {
        this.Exposure = Exposure
        this.PublicKey = PublicKey
        this.Tokens = Tokens
    }

    async executeStep(step: number) {
       let steps: {[key: number]: any} = {
           0: async () => {
               return new Promise(async (ok, reject) => {
                   await this.Exposure.methods.startRebalance().send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           },
           1: async () => {
               return new Promise(async (ok, reject) => {

                   let pair_array = []
                   let token_array = []

                   for (const i in this.Tokens) {
                       token_array.push(this.Tokens[i].tokenAddress);
                       pair_array.push(this.Tokens[i].pairAddress);
                   }

                   await this.Exposure.methods.addTokens(token_array, pair_array).send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           },
           2: async () => {
               return new Promise(async (ok, reject) => {
                   await this.Exposure.methods.removeTokens([]).send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           },
           3: async () => {
               return new Promise(async (ok, reject) => {
                   for (const i in this.Tokens) {
                       await this.Exposure.methods.updateTokenMarketCap().send({from: this.PublicKey}).catch((err: any) => {
                           reject(err)
                       })
                       await sleep(3000)
                   }
                   ok(true)
               })
           },
           4: async () => {
               return new Promise(async (ok, reject) => {
                   await this.Exposure.methods.updateIndexTotal().send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           },
           5: async () => {
               return new Promise(async (ok, reject) => {
                   for (const i in this.Tokens) {
                       await this.Exposure.methods.updateTokenPortions().send({from: this.PublicKey}).then(() => {
                           ok(true)
                       }).catch((err: any) => {
                           reject(err)
                       })
                   }
               })
           },
           6: async () => {
               return new Promise(async (ok, reject) => {
                   await this.Exposure.methods.updateRemainingPortions().send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           },
           7: async () => {
               return new Promise(async (ok, reject) => {
                   await this.Exposure.methods.rebaseLiquidate().send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           },
           8: async () => {
               return new Promise(async (ok, reject) => {
                   await this.Exposure.methods.rebaseBuy().send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           },
           9: async () => {
               return new Promise(async (ok, reject) => {
                   await this.Exposure.methods.finalizeIndexPrice().send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           },
           10: async () => {
               return new Promise(async (ok, reject) => {
                   await this.Exposure.methods.newEpoch().send({from: this.PublicKey}).then(() => {
                       ok(true)
                   }).catch((err: any) => {
                       reject(err)
                   })
               })
           }
       }
       return await steps[step]()
    }
}
