import {Config} from "./src/types";
import {discordBot} from "./src/discordbot";
import {ExposureAdmin} from "./src/exposureAdmin";
import {ExposureInfo} from "./src/ExposureInfo";

const fs = require('fs')

(async function () {
    const config = await getConfig()
    if (!config)
        return
    const e = await new ExposureAdmin(config)
    const i = new ExposureInfo(e)
    discordBot(config.discordToken, e, i, config.discordNotifications)
}())

async function getConfig(): Promise<Config | null> {
    if (!fs.existsSync("json_storage/config.json")) {
        return null
    }
    return JSON.parse(await fs.readFileSync('json_storage/config.json', 'utf8'))
}
