//let noble = require('noble-uwp');
let noble = require('noble-uwp');
let util = require('util')

let vehicles = [];
let i = 0;

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning(['be15beef6186407e83810bd89c4d8df4']);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function(device) {
        vehicles = {
        'vehicle_id': device.address,
        'peripheral': device
    }
    console.log(util.format("SCAN;%s;%s\n",
        device.id,
        device.advertisement.manufacturerData.toString('hex')));
});


