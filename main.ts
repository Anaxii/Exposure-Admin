import {Config} from "./src/types";
const fs = require('fs')

import {discordBot} from "./src/discordbot";
import {ExposureAdmin} from "./src/exposureAdmin";
import {ExposureInfo} from "./src/ExposureInfo";

(async function () {
    const config = await getConfig()
    if (!config)
        return
    const e = await new ExposureAdmin(config)
    const i = new ExposureInfo(e)
    discordBot(config.discordToken, e, i, config.discordNotifications)
    console.log(e.Baskets)
}())

async function getConfig(): Promise<Config | null> {
    if (!fs.existsSync("json_storage/config.json")) {
        return null
    }
    return JSON.parse(await fs.readFileSync('json_storage/config.json', 'utf8'))
}
