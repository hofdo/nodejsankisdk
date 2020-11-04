//let noble = require('noble');
let noble = require('noble-uwp');
let util = require('util')
let readline = require('readline')

let vehicles = new Map();
let message = null;
let device_id = null;

function connect(device_id){
    let vehicle = noble._peripherals[device_id]
    vehicle.connect(function(error) {
        vehicle.discoverSomeServicesAndCharacteristics(
            ["be15beef6186407e83810bd89c4d8df4"],
            ["be15bee06186407e83810bd89c4d8df4", "be15bee16186407e83810bd89c4d8df4"],
            function(error, services, characteristics) {
                vehicle.reader = characteristics[1];//.find(x => !x.properties.includes("write"));
                vehicle.writer = characteristics[0];//.find(x => x.properties.includes("write"));
                vehicles[device_id]['writer'] = characteristics[0];
                vehicles[device_id]['reader'] = characteristics[1];
                vehicle.reader.notify(true);
                vehicle.reader.on('data', function(data, isNotification) {
                    //console.log(util.format("%s;%s\n", vehicle.id, data.toString("hex")));
                });
                vehicles[device_id]['connected'] = true;
                message = new Buffer(4);
                message.writeUInt8(0x03, 0);
                message.writeUInt8(0x90, 1);
                message.writeUInt8(0x01, 2);
                message.writeUInt8(0x01, 3);
                vehicle.writer.write(message, true);
                console.log("connect success");
            }
        );
    });
}

function disconnect(device_id){
    vehicles[device_id]['device'].disconnect();
    vehicles[device_id]['connected'] = false;
    console.log('Disconnected successfully!')
}

function setSpeed(device_id, speed, accel){
    message = new Buffer(7);
    message.writeUInt8(0x06, 0);
    message.writeUInt8(0x24, 1);
    message.writeInt16LE(speed, 2);
    message.writeInt16LE(accel, 4);
    vehicles[device_id]['writer'].write(message);
}

function changeLane(device_id, offset){
    message = new Buffer(12);
    message.writeUInt8(11,0);
    message.writeUInt8(0x25,1);
    message.writeInt16LE(250,2);
    message.writeInt16LE(1000, 4);
    message.writeFloatLE(offset, 6);
    vehicles[device_id]['writer'].write(message);
}

noble.on('discover', function (device){
    /*
    vehicles = {
        'vehicle_id': device.id,
        'vehicle_uuid': device.advertisement.manufacturerData.toString('hex'),
        'device': noble._peripherals[device.id]
    }
     */
    vehicles[device.id] = {
        'id': device.id,
        'device': noble._peripherals[device.id],
        'connected': false,
        'writer': null,
        'reader': null
    }
    console.log("Scanned: " + device.id);
});

var cli = readline.createInterface(({
    input: process.stdin,
    output: process.stdout
}));

cli.on('line', function (cmd){
    let args = cmd.split(' ');
    switch (args[0].toLowerCase()) {
        case 'scan':
            noble.startScanning(['be15beef6186407e83810bd89c4d8df4']);
            setTimeout(function (){
                noble.stopScanning();
            }, 2000);
            break;
        case 'connect':
            if (args[1].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    connect(key);
                })
            }
            else {
                device_id = args[1];
                connect(device_id);
            }
            break;
        case 'disconnect':
            if (args[1].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    disconnect(key);
                })
            }
            else {
                device_id = args[1];
                disconnect(device_id)
            }
            break;
        case 'speed':
            let speed = args[2];
            let accel = args[3];
            if (args[1] === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    setSpeed(key, speed, accel);
                })
            }
            else {
                device_id = args[1];
                setSpeed(device_id, speed, accel);
            }
            break;
        case 'change_lane':
            if (args[1] === 'global'){

            }
            else {
                device_id = args[1];
                let offset = args[2];

            }
            break;
        case 'exit':
            console.log("Exit program...")
            process.exit();
            break;
        default:
            console.log("Invalid Input!")
            break;
    }
});
