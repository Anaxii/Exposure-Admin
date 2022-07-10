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
const discordbot_1 = require("./src/discordbot");
const exposureAdmin_1 = require("./src/exposureAdmin");
const ExposureInfo_1 = require("./src/ExposureInfo");
const fs = require('fs');
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield getConfig();
        if (!config)
            return;
        const e = yield new exposureAdmin_1.ExposureAdmin(config);
        const i = new ExposureInfo_1.ExposureInfo(e);
        (0, discordbot_1.discordBot)(config.discordToken, e, i, config.discordNotifications);
        // await e.newETF("test", 'test')
        let last = "bull";
        const epochLoop = () => __awaiter(this, void 0, void 0, function* () {
            // await e.mintShares(BigInt(1000) * BigInt(10 ** 18))
            // await sendDiscordWebook("!t reboot")
            // await sleep(15000)
            yield (0, discordbot_1.sendDiscordWebook)(`!t ${last} 5`);
            // let shareBalance = await e.ExposureObject.methods.totalSupply().call()
            // await sendDiscordWebook("# of shares: " + (Number(BigInt(shareBalance) / BigInt(10 ** 14)) / (10**4)).toLocaleString())
            if (last == "bull") {
                last = "bear";
            }
            else {
                last = "bull";
            }
            // await e.nextEpoch()
            setTimeout(epochLoop, 600 * 3);
            yield (0, discordbot_1.sendDiscordWebook)(`Next epoch starts in 8 minutes`);
        });
        yield epochLoop();
    });
}());
function getConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs.existsSync("json_storage/config.json")) {
            return null;
        }
        return JSON.parse(yield fs.readFileSync('json_storage/config.json', 'utf8'));
    });
}
