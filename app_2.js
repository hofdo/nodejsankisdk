//let noble = require('noble');
let noble = require('noble-uwp');
let util = require('util')

let vehicles = [];

let args = process.argv;
console.log(args.toString());

switch (args[0]) {
    case 'SCAN':
        noble.startScanning(['be15beef6186407e83810bd89c4d8df4']);
        setTimeout(function (){
            noble.stopScanning();
        }, 2000);
        break;
    case 'CONNECT':
        break;
    case 'DISCONNECT':
        break;
    case 'SPEED':
        break;
}

noble.on('discovery', function (device){
    vehicles = {
        'vehicle_id': device.id,
        'vehicle_uuid': device.advertisement.manufacturerData.toString('hex'),
        'peripheral': device
    }
    console.log("happend");
});

