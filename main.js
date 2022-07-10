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
        // discordBot(config.discordToken, e, i, config.discordNotifications)
        console.log(e.PublicKey);
        e.newETF("test", 'test');
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
