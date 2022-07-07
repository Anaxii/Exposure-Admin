const web3 = require('web3');

export function validateAddress() {
    return function<TFunction extends Function>(target: TFunction){
        let ignore = ["getIndexPrice", "actualIndexPrice", "tokenPortionIndex", "getNAV", "getPricesAndMcaps", "tradeToken", "epochNotification"]
        for(let prop of Object.getOwnPropertyNames(target.prototype)){
            if (ignore.includes(prop)) continue;
            console.log(prop)
            // Save the original function
            let oldFunc: Function = target.prototype[prop];
            target.prototype[prop] = function (data: any) {
                console.log(prop, arguments, data)
                let isValid = false
                switch (prop) {
                    case "getExposurePrice":
                        console.log(isAddress(data[0]))
                }
                // this['handleRequest'](); // call the extra method
                if (isValid)
                    return oldFunc.apply(this, arguments); // call the original and return any result
                return 0
            }
        }
    }
}

const isAddress = function (address: string) {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
        return true;
    } else {
        return isChecksumAddress(address);
    }
}


const isChecksumAddress = function (address: string): boolean {
    address = address.replace('0x','');
    let addressHash = web3.sha3(address.toLowerCase());
    for (let i = 0; i < 40; i++ ) {
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
            return false;
        }
    }
    return true;
}
