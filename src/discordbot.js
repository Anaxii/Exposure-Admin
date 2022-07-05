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
        client.once('ready', () => {
            console.log('Bot loaded');
        });
        client.on('messageCreate', (msg) => __awaiter(this, void 0, void 0, function* () {
            msg.content = msg.content.toLowerCase();
            const data = msg.content.split(" ");
            if (data[0] != "!e" || data.length === 1)
                return;
            if (data[1] == "epoch") {
                let epoch = e.ExposureObject.methods.epoch().call();
                msg.channel.send(epoch);
            }
            if (data[1] == "epochinfo") {
                let epochInfo = yield info.epochNotification(false);
                msg.channel.send(epochInfo);
            }
            if (data[1] == "nextepoch") {
                yield info.epochNotification(true);
                yield e.nextEpoch();
                yield info.epochNotification(true);
            }
            if (data[1] == "newetf") {
                msg.channel.send("Starting new ETF");
                let address = yield e.newETF("TEST", "TEST");
                msg.channel.send("New ETF initialized at " + address);
            }
            if (data[1] == "prices" || data[1] == "mcaps") {
                let prices = yield info.getPricesAndMcaps();
                let p = "Prices: \n";
                let m = "MCAPs: \n";
                for (const i in prices.prices) {
                    p += i + ": " + prices.prices[i].toLocaleString() + "\n";
                    m += i + ": " + prices.mcaps[i].toLocaleString() + "\n";
                }
                if (data[1] == "prices") {
                    let ep = "Exposure Prices: \n";
                    for (const i in e.Tokens) {
                        let pr = yield info.getExposurePrice(e.Tokens[i].tokenAddress);
                        ep += e.Tokens[i].token + ": " + pr.toLocaleString() + "\n";
                    }
                    msg.channel.send(p);
                    msg.channel.send(ep);
                }
                if (data[1] == "mcaps")
                    msg.channel.send(m);
            }
            if (data[1] == "balances") {
                let balances = yield info.getAllExposureTokenBalances(e.ExposureAddress);
                let m = "Balances: \n";
                for (const i in balances) {
                    m += i + ": " + balances[i].toLocaleString() + "\n";
                }
                msg.channel.send(m.toLocaleString());
            }
            if (data[1] == "shares") {
                let shareBalance = yield e.ExposureObject.methods.totalSupply().call();
                msg.channel.send((BigInt(shareBalance) / BigInt(10 ** 18)).toLocaleString());
            }
            if (data[1] == "nav") {
                let nav = yield info.getNAV();
                let shareBalance = yield e.ExposureObject.methods.totalSupply().call();
                msg.channel.send("$" + nav.toLocaleString());
                msg.channel.send("NAV Per Share: $" + (nav / (Number(BigInt(shareBalance) / BigInt(10 ** 16)) / 100)).toLocaleString());
            }
            if (data[1] == "index") {
                let values = yield Promise.all([
                    info.getIndexPrice(),
                    info.actualIndexPrice(),
                    info.tokenPortionIndex(false),
                    info.tokenPortionIndex(true)
                ]);
                msg.channel.send("Index Price:                                $" + values[0].toLocaleString() + "\nPortion Index Price:                  $" + values[1].toLocaleString() + "\nTracked Portion Index Price:   $" + values[2].toLocaleString() + "\nTrue Index Price:                       $" + values[3].toLocaleString());
            }
            if (data[1] == "portions") {
                let m = "";
                for (const i in e.Tokens) {
                    let divisor = yield e.ExposureObject.methods.getTokenPortions(e.CurrentEpoch, e.Tokens[i].tokenAddress).call();
                    m += e.Tokens[i].token + ": " + (BigInt(divisor) / BigInt(10 ** 18)).toLocaleString() + "\n";
                }
                msg.channel.send(m);
            }
            if (data[1] == "notif") {
                if (data[2] == "on") {
                    DiscordNotifications = true;
                    msg.channel.send("Webhook notifications turned on");
                }
                else {
                    DiscordNotifications = false;
                    msg.channel.send("Webhook notifications turned off");
                }
                yield util_1.editConfig("discordNotifications", DiscordNotifications);
            }
            if (data[1] == "newetf") {
                yield e.newETF("TEST", "TEST");
            }
            if (data[1] == "editconfig" && data.length > 3) {
                yield util_1.editConfig(data[2], data[3]);
                msg.channel.send("Updated config for " + data[2]);
            }
            if (data[1] == "reboot") {
                yield msg.channel.send("Rebooting bot");
                yield util_1.editConfig("reboot", true);
                process.exit(1);
            }
            if (data[1] == "exposure") {
                yield msg.channel.send(e.ExposureAddress);
            }
            if (data[1] == "mint") {
                let shareBalance = yield e.ExposureObject.methods.balanceOf(e.PublicKey).call();
                yield msg.channel.send("Initial balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
                let newBal = yield e.mintShares(BigInt(Number(data[2]) * 10 ** 17));
                yield msg.channel.send("New balance: " + (Number(BigInt(newBal) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
            }
            if (data[1] == "burn") {
                let shareBalance = yield e.ExposureObject.methods.balanceOf(e.PublicKey).call();
                yield msg.channel.send("Initial balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
                let newBal = yield e.burnShares(BigInt(Number(data[2]) * 10 ** 17));
                yield msg.channel.send("New balance: " + (Number(BigInt(newBal) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
            }
            if (data[1] == "sharebalance") {
                let shareBalance = yield e.ExposureObject.methods.balanceOf(e.PublicKey).call();
                yield msg.channel.send("Balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString());
            }
        }));
        client.login(discordToken);
    });
}
exports.discordBot = discordBot;
