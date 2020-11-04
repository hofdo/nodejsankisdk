//let noble = require('noble');
let noble = require('noble-uwp');
let util = require('util')

let vehicles = [];
let i = 0;

noble.startScanning(['be15beef6186407e83810bd89c4d8df4']);

setTimeout(function (){
    noble.stopScanning();
}, 2000);

function connect(vehicle) {
    vehicle.connect(function(error) {
        console.log(vehicle);
        vehicle.discoverSomeServicesAndCharacteristics(
            ["be15beef6186407e83810bd89c4d8df4"],
            ["be15bee06186407e83810bd89c4d8df4", "be15bee16186407e83810bd89c4d8df4"],
            function(error, services, characteristics) {
                //  console.log("!!!!!!!!!!!!!!!!!");
                //  console.log(characteristics);
                //  console.log("!!!!!!!!!!!!!!!!!");
                vehicle.reader = characteristics[1];//.find(x => !x.properties.includes("write"));
                vehicle.writer = characteristics[0];//.find(x => x.properties.includes("write"));

                vehicle.reader.notify(true);
                vehicle.reader.on('data', function(data, isNotification) {
                    console.log(util.format("%s;%s\n", vehicle.id, data.toString("hex")));
                });
                console.log("connect success");
            }
        );
    });
}

function setSpeed(device, speed) {
    let message = new Buffer(7);
    message.writeUInt8(0x06, 0);
    message.writeUInt8(0x24, 1);
    message.writeInt16LE(speed, 2);
    message.writeInt16LE(0, 4);
    device.writer.write(message, true);
}

function discover (device) {
    vehicles = {
        'vehicle_id': device.id,
        'vehicle_uuid': device.advertisement.manufacturerData.toString('hex'),
        'peripheral': device
    }
    //console.log(util.format("SCAN;%s;%s\n", device.id, device.advertisement.manufacturerData.toString('hex')));
    connect(noble._peripherals[device.id]);
}

noble.on('discover', discover);



