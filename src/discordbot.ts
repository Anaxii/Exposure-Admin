import {ExposureAdmin} from "./exposureAdmin";
import {ExposureInfo} from "./ExposureInfo";
import {editConfig} from "./util";

const {WebhookClient} = require("discord.js");
const webhookClient = new WebhookClient({
    id: "957513644743204935",
    token: "DPQPMemPDzS_cIzuP4QP8Tqpy-BmI4iy5Ea35i58YuJP1q9jxeslPwGh2fPRZP0vfZ6w"
});

export async function sendDiscordWebook(message: string) {
    await webhookClient.send({
        content: message,
    });
}

export async function discordBot(discordToken: string, e: ExposureAdmin, info: ExposureInfo, DiscordNotifications: boolean) {
    const {Client, Intents} = require('discord.js');
    const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});

    client.once('ready', () => {
        console.log('Bot loaded');
    });

    client.on('messageCreate', async (msg: any) => {
            msg.content = msg.content.toLowerCase()
            const data = msg.content.split(" ")
            if (data[0] != "!e" || data.length === 1)
                return

            if (data[1] == "epoch") {
                let epoch = e.ExposureObject.methods.epoch().call()
                msg.channel.send(epoch)
            }
            if (data[1] == "epochinfo") {
                let epochInfo = await info.epochNotification(false)
                msg.channel.send(epochInfo)
            }
            if (data[1] == "nextepoch") {
                await info.epochNotification(true)
                await e.nextEpoch()
                await info.epochNotification(true)
            }
            if (data[1] == "newetf") {
                msg.channel.send("Starting new ETF")
                let address = await e.newETF("TEST", "TEST")
                msg.channel.send("New ETF initialized at " + address)
            }
            if (data[1] == "prices" || data[1] == "mcaps") {
                let prices = await info.getPricesAndMcaps()
                let p = "Prices: \n"
                let m = "MCAPs: \n"
                for (const i in prices.prices) {
                    p += i + ": " + prices.prices[i].toLocaleString() + "\n"
                    m += i + ": " + prices.mcaps[i].toLocaleString() + "\n"
                }
                if (data[1] == "prices") {
                    let ep = "Exposure Prices: \n"
                    for (const i in e.Tokens) {
                        let pr = await info.getExposurePrice(e.Tokens[i].tokenAddress)
                        ep += e.Tokens[i].token + ": " + pr.toLocaleString() + "\n"
                    }
                    msg.channel.send(p)
                    msg.channel.send(ep)

                }
                if (data[1] == "mcaps")
                    msg.channel.send(m)
            }
            if (data[1] == "balances") {
                let balances = await info.getAllExposureTokenBalances(e.ExposureAddress)
                let m = "Balances: \n"
                for (const i in balances) {
                    m += i + ": " + balances[i].toLocaleString() + "\n"
                }
                msg.channel.send(m.toLocaleString())

            }
            if (data[1] == "shares") {
                let shareBalance = await e.ExposureObject.methods.totalSupply().call()
                msg.channel.send((BigInt(shareBalance) / BigInt(10 ** 18)).toLocaleString())
            }
            if (data[1] == "nav") {
                let nav = await info.getNAV()
                let shareBalance = await e.ExposureObject.methods.totalSupply().call()
                msg.channel.send("$" + nav.toLocaleString())
                msg.channel.send("NAV Per Share: $" + (nav / (Number(BigInt(shareBalance) / BigInt(10 ** 16)) / 100)).toLocaleString())
            }
            if (data[1] == "index") {
                let values = await Promise.all([
                    info.getIndexPrice(),
                    info.actualIndexPrice(),
                    info.tokenPortionIndex(false),
                    info.tokenPortionIndex(true)
                ])

                msg.channel.send("Index Price:                                $" + values[0].toLocaleString() + "\nPortion Index Price:                  $" + values[1].toLocaleString() + "\nTracked Portion Index Price:   $" + values[2].toLocaleString() + "\nTrue Index Price:                       $" + values[3].toLocaleString())
            }
            if (data[1] == "portions") {
                let m = ""
                for (const i in e.Tokens) {
                    let divisor = await e.ExposureObject.methods.getTokenPortions(e.CurrentEpoch, e.Tokens[i].tokenAddress).call()
                    m += e.Tokens[i].token + ": " + (BigInt(divisor) / BigInt(10 ** 18)).toLocaleString() + "\n"
                }
                msg.channel.send(m)
            }
            if (data[1] == "notif") {
                if (data[2] == "on") {
                    DiscordNotifications = true
                    msg.channel.send("Webhook notifications turned on")
                } else {
                    DiscordNotifications = false
                    msg.channel.send("Webhook notifications turned off")
                }
                await editConfig("discordNotifications", DiscordNotifications)
            }
            if (data[1] == "newetf") {
                await e.newETF("TEST", "TEST")
            }
            if (data[1] == "editconfig" && data.length > 3) {
                await editConfig(data[2], data[3])
                msg.channel.send("Updated config for " + data[2])
            }
            if (data[1] == "reboot") {
                await msg.channel.send("Rebooting bot")
                await editConfig("reboot", true)
                process.exit(1)
            }
            if (data[1] == "exposure") {
                await msg.channel.send(e.ExposureAddress)
            }
            if (data[1] == "mint") {
                let shareBalance = await e.ExposureObject.methods.balanceOf(e.PublicKey).call()
                await msg.channel.send("Initial balance: " + (Number(BigInt(shareBalance) / BigInt(10**14)) / (10**4)).toLocaleString())
                let newBal = await e.mintShares(BigInt(Number(data[2]) * 10 ** 17))
                await msg.channel.send("New balance: " + (Number(BigInt(newBal) / BigInt(10**14)) / (10**4)).toLocaleString())
            }
        if (data[1] == "burn") {
            let shareBalance = await e.ExposureObject.methods.balanceOf(e.PublicKey).call()
            await msg.channel.send("Initial balance: " + (Number(BigInt(shareBalance) / BigInt(10**14)) / (10**4)).toLocaleString())
            let newBal = await e.burnShares(BigInt(Number(data[2]) * 10 ** 17))
            await msg.channel.send("New balance: " + (Number(BigInt(newBal) / BigInt(10**14)) / (10**4)).toLocaleString())
        }
        if (data[1] == "sharebalance") {
            let shareBalance = await e.ExposureObject.methods.balanceOf(e.PublicKey).call()
            await msg.channel.send("Balance: " + (Number(BigInt(shareBalance) / BigInt(10**14)) / (10**4)).toLocaleString())
        }
        }
    );

    client.login(discordToken);
}
