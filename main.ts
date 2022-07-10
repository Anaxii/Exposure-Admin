import {Config} from "./src/types";
import {discordBot, sendDiscordWebook} from "./src/discordbot";
import {ExposureAdmin} from "./src/exposureAdmin";
import {ExposureInfo} from "./src/ExposureInfo";
import {sleep} from "./src/util";

const fs = require('fs');

(async function () {
    const config = await getConfig()
    if (!config)
        return
    const e = await new ExposureAdmin(config)
    const i = new ExposureInfo(e)
    discordBot(config.discordToken, e, i, config.discordNotifications)
    await e.newETF("test", 'test')

    let last = "bull"
    const epochLoop = async () => {
        await e.mintShares(BigInt(1000) * BigInt(10 ** 18))
        await sendDiscordWebook("!t reboot")
        await sleep(15000)
        await sendDiscordWebook(`!t ${last} 5`)
        let shareBalance = await e.ExposureObject.methods.totalSupply().call()
        await sendDiscordWebook((BigInt(shareBalance) / BigInt(10 ** 18)).toLocaleString())
        if (last == "bull") {
            last = "bear"
        } else {
            last = "bull"
        }
        await e.nextEpoch()
    }

    setInterval(epochLoop, 60000 * 8)
}())

async function getConfig(): Promise<Config | null> {
    if (!fs.existsSync("json_storage/config.json")) {
        return null
    }
    return JSON.parse(await fs.readFileSync('json_storage/config.json', 'utf8'))
}
