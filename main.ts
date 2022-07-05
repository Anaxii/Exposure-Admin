import {Config} from "./src/types";
const fs = require('fs')

import {discordBot} from "./src/discordbot";
import {ExposureAdmin} from "./src/exposureAdmin";
import {ExposureInfo} from "./src/ExposureInfo";

(async function () {
    let config = await getConfig()
    if (!config)
        return
    let e = await new ExposureAdmin(config)
    let i = new ExposureInfo(e)
    discordBot(config.discordToken, e, i, config.discordNotifications)
}())

async function getConfig(): Promise<Config | null> {
    if (!fs.existsSync("json_storage/config.json")) {
        return null
    }
    return JSON.parse(await fs.readFileSync('json_storage/config.json', 'utf8'))
}
