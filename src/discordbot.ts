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

    const commands: { [key: string]: (msg: any, data: string[]) => any } | { [key: string]: (msg: any) => any } | { [key: string]: () => any } = {
        "epoch": async (msg: any): Promise<void> => {
            let epoch = e.ExposureObject.methods.epoch().call()
            msg.channel.send(epoch)
        },
        "epochinfo": async (msg: any): Promise<void> => {
            let epochInfo = await info.epochNotification(false)
            msg.channel.send(epochInfo)
        },
        "basketaddress": async (msg: any): Promise<void> => {
            msg.channel.send(e.ExposureAddress)

        },
        "nextepoch": async (): Promise<void> => {
            await info.epochNotification(true)
            await e.nextEpoch()
            await info.epochNotification(true)
        },
        "prices": async (msg: any): Promise<void> => {
            let prices = await info.getPricesAndMcaps()
            let p = "Prices: \n"
            for (const i in prices.prices) {
                p += i + ": " + prices.prices[i].toLocaleString() + "\n"
            }
            let ep = "Exposure Prices: \n"
            for (const i in e.Tokens) {
                let pr = await info.getExposurePrice(e.Tokens[i].tokenAddress)
                ep += e.Tokens[i].token + ": " + pr.toLocaleString() + "\n"
            }
            msg.channel.send(p)
            msg.channel.send(ep)

        },
        "mcaps": async (msg: any, data: string[]): Promise<void> => {
            let prices = await info.getPricesAndMcaps()
            let m = "MCAPs: \n"
            for (const i in prices.prices) {
                m += i + ": " + prices.mcaps[i].toLocaleString() + "\n"
            }
            if (data[1] == "mcaps")
                msg.channel.send(m)
        },
        "balances": async (msg: any): Promise<void> => {
            let balances = await info.getAllExposureTokenBalances(e.ExposureAddress)
            let m = "Balances: \n"
            for (const i in balances) {
                m += i + ": " + balances[i].toLocaleString() + "\n"
            }
            msg.channel.send(m.toLocaleString())
        },
        "shares": async (msg: any): Promise<void> => {
            let shareBalance = await e.ExposureObject.methods.totalSupply().call()
            msg.channel.send((BigInt(shareBalance) / BigInt(10 ** 18)).toLocaleString())
        },
        "nav": async (msg: any): Promise<void> => {
            let nav = await info.getNAV()
            let shareBalance = await e.ExposureObject.methods.totalSupply().call()
            msg.channel.send("$" + nav.toLocaleString())
            msg.channel.send("NAV Per Share: $" + (nav / (Number(BigInt(shareBalance) / BigInt(10 ** 16)) / 100)).toLocaleString())
        },
        "index": async (msg: any): Promise<void> => {
            let values = await Promise.all([
                info.getIndexPrice(),
                info.actualIndexPrice(),
                info.tokenPortionIndex(false),
                info.tokenPortionIndex(true)
            ])
            msg.channel.send("Index Price:                                $" + values[0].toLocaleString() + "\nPortion Index Price:                  $" + values[1].toLocaleString() + "\nTracked Portion Index Price:   $" + values[2].toLocaleString() + "\nTrue Index Price:                       $" + values[3].toLocaleString())
        },
        "portions": async (msg: any): Promise<void> => {
            let m = ""
            for (const i in e.Tokens) {
                let divisor = await e.ExposureObject.methods.getTokenPortions(e.CurrentEpoch, e.Tokens[i].tokenAddress).call()
                m += e.Tokens[i].token + ": " + (BigInt(divisor) / BigInt(10 ** 18)).toLocaleString() + "\n"
            }
            msg.channel.send(m)
        },
        "notif": async (msg: any, data: string[]): Promise<void> => {
            if (data[2] == "on") {
                DiscordNotifications = true
                msg.channel.send("Webhook notifications turned on")
            } else {
                DiscordNotifications = false
                msg.channel.send("Webhook notifications turned off")
            }
            await editConfig("discordNotifications", DiscordNotifications)
        },
        "newetf": async (msg: any, data: string[]): Promise<void> => {
            if (!data[2] && !data[3])
                return
            msg.channel.send("Starting new ETF")
            let address = await e.newETF(data[2], data[3])
            msg.channel.send("New basket initialized at " + address)
        },
        "editconfig": async (msg: any, data: string[]): Promise<void> => {
            await editConfig(data[2], data[3])
            msg.channel.send("Updated config for " + data[2])
        },
        "reboot": async (msg: any): Promise<void> => {
            await msg.channel.send("Rebooting bot")
            await editConfig("reboot", true)
            process.exit(1)
        },
        "mint": async (msg: any, data: string[]): Promise<void> => {
            let shareBalance = await e.ExposureObject.methods.balanceOf(e.PublicKey).call()
            await msg.channel.send("Initial balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString())
            let newBal = await e.mintShares(BigInt(Number(data[2]) * 10 ** 17))
            await msg.channel.send("New balance: " + (Number(BigInt(newBal) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString())
        },
        "burn": async (msg: any, data: string[]): Promise<void> => {
            let shareBalance = await e.ExposureObject.methods.balanceOf(e.PublicKey).call()
            await msg.channel.send("Initial balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString())
            let newBal = await e.burnShares(BigInt(Number(data[2]) * 10 ** 17))
            await msg.channel.send("New balance: " + (Number(BigInt(newBal) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString())
        },
        "sharebalance": async (msg: any): Promise<void> => {
            let shareBalance = await e.ExposureObject.methods.balanceOf(e.PublicKey).call()
            await msg.channel.send("Balance: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10 ** 4)).toLocaleString())
        },
        "baskets": async (msg: any): Promise<void> => {
            console.log(e.Baskets)
            let basket_list = ""
            for (const i in e.Baskets) {
                let token_list = ""
                for (const j in e.Baskets[i].tokens) {
                    token_list += e.Baskets[i].tokens[j].token + "\n"
                }
                basket_list += `${e.Baskets[i].name} [${e.Baskets[i].symbol}] | Address: ${i}\n**Tokens: (${e.Baskets[i].tokens.length})**\n${token_list}`
            }
            msg.channel.send(basket_list)
        },
        "help": async (msg: any): Promise<void> => {
            await msg.channel.send("epoch \nepochinfo \nbasketaddress \nnextepoch \nnewetf \nprices \nmcaps \nbalances \nshares \nnav \nindex \nportions \nnotif (on/off) \nnewetf (name) (symbol) \neditconfig (data) \nrebbot \nexposure \nmint (amount) \nburn (amount) \nsharebalance ")
        }
    }

    client.once('ready', () => {
        console.log('Bot loaded');
    });

    client.on('messageCreate',  (msg: any) => {
            msg.content = msg.content.toLowerCase()
            const data = msg.content.split(" ")
            if (data[0] != "!e" || data.length === 1)
                return

        if (commands[data[1]])
            commands[data[1]](msg, data)
        }
    );

    client.login(discordToken);
}
