const fs = require("fs");
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function editConfig(key: string, data: any) {
    return new Promise(async ok => {
        let config
        try {
            config = await fs.readFileSync('json_storage/config.json')
        } catch {
            config = await fs.readFileSync('../json_storage/config.json')
        }
        config = JSON.parse(config);
        config[key] = data
        try {
            await fs.writeFileSync('../json_storage/config.json', JSON.stringify(config, null, 4));
        } catch {
            await fs.writeFileSync('json_storage/config.json', JSON.stringify(config, null, 4));
        }
        ok(null)
    })
}
