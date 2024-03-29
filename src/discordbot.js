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
exports.discordBot = exports.sendDiscordWebook = void 0;
const util_1 = require("./util");
const { WebhookClient } = require("discord.js");
const webhookClient = new WebhookClient({
    id: "957513644743204935",
    token: "DPQPMemPDzS_cIzuP4QP8Tqpy-BmI4iy5Ea35i58YuJP1q9jxeslPwGh2fPRZP0vfZ6w"
});
function sendDiscordWebook(message) {
    return __awaiter(this, void 0, void 0, function* () {
        yield webhookClient.send({
            content: message,
        });
    });
}
exports.sendDiscordWebook = sendDiscordWebook;
function discordBot(discordToken, e, info, DiscordNotifications) {
    return __awaiter(this, void 0, void 0, function* () {
        const { Client, Intents } = require('discord.js');
        const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
        const commands = {
            "epoch": (msg) => __awaiter(this, void 0, void 0, function* () {
                let epoch = e.ExposureObject.methods.epoch().call();
                msg.channel.send(epoch);
            }),
            "epochinfo": (msg) => __awaiter(this, void 0, void 0, function* () {
                let epochInfo = yield info.epochNotification(false);
                msg.channel.send(epochInfo);
            }),
            "basketaddress": (msg) => __awaiter(this, void 0, void 0, function* () {
                msg.channel.send(e.ExposureAddress);
            }),
            "nextepoch": () => __awaiter(this, void 0, void 0, function* () {
                yield info.epochNotification(true);
                yield e.nextEpoch();
                yield info.epochNotification(true);
            }),
            "prices": (msg) => __awaiter(this, void 0, void 0, function* () {
                let prices = yield info.getPricesAndMcaps();
                let p = "Prices: \n";
                for (const i in prices.prices) {
                    p += i + ": " + prices.prices[i].toLocaleString() + "\n";
                }
                let ep = "Exposure Prices: \n";
                for (const i in e.Tokens) {
                    let pr = yield info.getExposurePrice(e.Tokens[i].tokenAddress);
                    ep += e.Tokens[i].token + ": " + pr.toLocaleString() + "\n";
                }
                msg.channel.send(p);
                msg.channel.send(ep);
            }),
            "mcaps": (msg, data) => __awaiter(this, void 0, void 0, function* () {
                let prices = yield info.getPricesAndMcaps();
                let m = "MCAPs: \n";
                for (const i in prices.prices) {
                    m += i + ": " + prices.mcaps[i].toLocaleString() + "\n";
                }
                if (data[1] == "mcaps")
                    msg.channel.send(m);
            }),
            "balances": (msg) => __awaiter(this, void 0, void 0, function* () {
                let balances = yield info.getAllExposureTokenBalances(e.ExposureAddress);
                let m = "Balances: \n";
                for (const i in balances) {
                    m += i + ": " + balances[i].toLocaleString(undefined, { minimumFractionDigits: 8 }) + "\n";
                }
                msg.channel.send(m.toLocaleString());
            }),
            "shares": (msg) => __awaiter(this, void 0, void 0, function* () {
                let shareBalance = yield e.ExposureObject.methods.totalSupply().call();
                msg.channel.send((BigInt(shareBalance) / BigInt(10 ** 18)).toLocaleString());
            }),
            "nav": (msg) => __awaiter(this, void 0, void 0, function* () {
                let nav = yield info.getNAV();
                let shareBalance = yield e.ExposureObject.methods.totalSupply().call();
                msg.channel.send("$" + nav.toLocaleString());
                msg.channel.send("NAV Per Share: $" + (nav / (Number(BigInt(shareBalance) / BigInt(10 ** 16)) / 100)).toLocaleString());
            }),
            "index": (msg) => __awaiter(this, void 0, void 0, function* () {
                let values = yield Promise.all([
                    info.getIndexPrice(),
                    info.actualIndexPrice(),
                    info.tokenPortionIndex(false),
                    info.tokenPortionIndex(true)
                ]);
                msg.channel.send("Index Price:                                $" + values[0].toLocaleString() + "\nPortion Index Price:                  $" + values[1].toLocaleString() + "\nTracked Portion Index Price:   $" + values[2].toLocaleString() + "\nTrue Index Price:                       $" + values[3].toLocaleString());
            }),
            "portions": (msg) => __awaiter(this, void 0, void 0, function* () {
                let m = "";
                for (const i in e.Tokens) {
                    let divisor = yield e.ExposureObject.methods.getTokenPortions(e.CurrentEpoch, e.Tokens[i].tokenAddress).call();
                    m += e.Tokens[i].token + ": " + (BigInt(divisor) / BigInt(10 ** 18)).toLocaleString() + "\n";
                }
                msg.channel.send(m);
            }),
            "notif": (msg, data) => __awaiter(this, void 0, void 0, function* () {
                if (data[2] == "on") {
                    DiscordNotifications = true;
                    msg.channel.send("Webhook notifications turned on");
                }
                else {
                    DiscordNotifications = false;
                    msg.channel.send("Webhook notifications turned off");
                }
                yield (0, util_1.editConfig)("discordNotifications", DiscordNotifications);
            }),
            "newetf": (msg, data) => __awaiter(this, void 0, void 0, function* () {
                if (!data[2] && !data[3])
                    return;
                msg.channel.send("Starting new ETF");
                let address = yield e.newETF(data[2], data[3]);
                msg.channel.send("New basket initialized at " + address);
            }),
            "editconfig": (msg, data) => __awaiter(this, void 0, void 0, function* () {
                yield (0, util_1.editConfig)(data[2], data[3]);
                msg.channel.send("Updated config for " + data[2]);
            }),
            "reboot": (msg) => __awaiter(this, void 0, void 0, function* () {
                yield msg.channel.send("Rebooting bot");
                yield (0, util_1.editConfig)("reboot", true);
                process.exit(1);
            }),
            "mint": (msg, data) => __awaiter(this, void 0, void 0, function* () {
                let shareBalance = yield e.ExposureObject.methods.balanceOf(e.PublicKey).call();
                yield msg.channel.send("Initial balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
                let newBal = yield e.mintShares(BigInt(Number(data[2]) * 10 ** 17));
                yield msg.channel.send("New balance: " + (Number(BigInt(newBal) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
            }),
            "burn": (msg, data) => __awaiter(this, void 0, void 0, function* () {
                let shareBalance = yield e.ExposureObject.methods.balanceOf(e.PublicKey).call();
                yield msg.channel.send("Initial balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
                let newBal = yield e.burnShares(BigInt(Number(data[2]) * 10 ** 17));
                yield msg.channel.send("New balance: " + (Number(BigInt(newBal) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
            }),
            "sharebalance": (msg) => __awaiter(this, void 0, void 0, function* () {
                let shareBalance = yield e.ExposureObject.methods.balanceOf(e.PublicKey).call();
                yield msg.channel.send("Balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
            }),
            "baskets": (msg) => __awaiter(this, void 0, void 0, function* () {
                let basket_list = "";
                for (const i in e.Baskets) {
                    let token_list = "";
                    for (const j in e.Baskets[i].tokens) {
                        token_list += e.Baskets[i].tokens[j].token + " | ";
                    }
                    basket_list += `**${e.Baskets[i].name} [${e.Baskets[i].symbol}] | Address: ${i}**\nTokens: (${e.Baskets[i].tokens.length})\n${token_list}\n`;
                }
                msg.channel.send(basket_list);
            }),
            "changebasket": (msg, data) => __awaiter(this, void 0, void 0, function* () {
                msg.channel.send("Current basket: " + e.ExposureAddress);
                yield e.switchBasket(Object.keys(e.Baskets)[Number(data[2])]);
                msg.channel.send("New basket: " + e.ExposureAddress);
            }),
            "tobuy": (msg) => __awaiter(this, void 0, void 0, function* () {
                let tradeMessage = yield getTradeMessage(true);
                msg.channel.send(tradeMessage);
            }),
            "tosell": (msg) => __awaiter(this, void 0, void 0, function* () {
                let tradeMessage = yield getTradeMessage(false);
                msg.channel.send(tradeMessage);
            }),
            "rebsum": (msg) => __awaiter(this, void 0, void 0, function* () {
                let totalBuy = 0;
                let totalSell = 0;
                let buys = yield info.calculateTradeAmount(true);
                for (const i in buys) {
                    totalBuy += buys[i].toTradeUSD;
                }
                let sells = yield info.calculateTradeAmount(false);
                for (const i in sells) {
                    totalSell += sells[i].toTradeUSD;
                }
                msg.channel.send(`Total Sell: $${totalSell.toLocaleString()}\nTotal Buy: $${totalBuy.toLocaleString()}\nCost: $${(totalBuy - totalSell).toLocaleString()}`);
            }),
            "help": (msg) => __awaiter(this, void 0, void 0, function* () {
                yield msg.channel.send("epoch \nepochinfo \nbasketaddress \nnextepoch \nnewetf \nprices \nmcaps \nbalances \nshares \nnav \nindex \nportions \nnotif (on/off) \nnewetf (name) (symbol) \neditconfig (data) \nrebbot \nexposure \nmint (amount) \nburn (amount) \nsharebalance \nrebsum \ntobuy \ntosell");
            })
        };
        function getTradeMessage(side) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let amounts = yield info.calculateTradeAmount(side);
                    let sideMessage = "Selling";
                    if (side)
                        sideMessage = "Buying";
                    let message = "";
                    let totalUSD = 0;
                    for (const i in amounts) {
                        totalUSD += amounts[i].toTradeUSD;
                        message += `${amounts[i].name} | ${sideMessage} ${amounts[i].amountToTrade} ($${amounts[i].toTradeUSD.toLocaleString()}) | Current Price: ${amounts[i].currentPrice.toLocaleString()} | Est New Price: ${amounts[i].estimatedNewPrice.toLocaleString()}\n`;
                    }
                    resolve(`Total ${sideMessage}: $${totalUSD.toLocaleString()}\n` + message);
                }));
            });
        }
        client.once('ready', () => {
            console.log('Bot loaded');
        });
        client.on('messageCreate', (msg) => {
            msg.content = msg.content.toLowerCase();
            const data = msg.content.split(" ");
            if (data[0] != "!e" || data.length === 1)
                return;
            if (commands[data[1]])
                commands[data[1]](msg, data);
        });
        client.login(discordToken);
    });
}
exports.discordBot = discordBot;
