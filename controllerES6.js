//let noble = require('noble');
//let noble = require('noble-uwp');
let noble = require('@abandonware/noble');
let mqtt = require('mqtt')
let url = require('url');
let readline = require('readline');

let vehicles = new Map();
let message = null;
let device_id = null;

noble.startScanning(['be15beef6186407e83810bd89c4d8df4'], false);
setTimeout(function (){
    noble.stopScanning();
}, 10000);

noble.on('discover', async function (device){
    console.log("Scanned: " + device.id);
    await device.connectAsync();
    const {characteristics} = await device.discoverSomeServicesAndCharacteristicsAsync(["be15beef6186407e83810bd89c4d8df4"],
        ["be15bee06186407e83810bd89c4d8df4", "be15bee16186407e83810bd89c4d8df4"]);
    console.log("Connected: " + device.id);
    await characteristics[1].notifyAsync(true);
    await device.on('data', function (data, isNotification){
        console.log(util.format("%s;%s\n", vehicle.id, data.toString("hex")));
    })

    message = new Buffer(4);
    message.writeUInt8(0x03, 0);
    message.writeUInt8(0x90, 1);
    message.writeUInt8(0x01, 2);
    message.writeUInt8(0x01, 3);

    await characteristics[0].writeAsync(message, false);
    vehicles[device.id] = {
        'id': device.id,
        'connected': true,
        'reader': characteristics[1],
        'writer': characteristics[0]
    }
    //connect(device_id);
});

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

function changeLights(device_id){
    message = new Buffer(3);
    message.writeUInt8(0x02, 0);
    message.writeUInt8(0x1d, 1);
    message.writeUInt8(140, 2);
    vehicles[device_id]['writer'].write(message);
}

function changeLightPattern(device_id){
    message = new Buffer(8);
    message.writeUInt8(0x07, 0);
    message.writeUInt8(0x33, 1);
    message.writeUInt8(5, 2);
    message.writeUInt8(1, 3);
    message.writeUInt8(1, 4);
    message.writeUInt8(5, 5);
    message.writeInt16LE(0,6)
    vehicles[device_id]['writer'].write(message);
}

function ping(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x1a,1);
    vehicles[device_id]['writer'].write(message);
}

function requestBatteryLevel(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x18,1);
    vehicles[device_id]['writer'].write(message);
}

function requestVersion(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x16,1);
    vehicles[device_id]['writer'].write(message);
}


/*

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
                let offset = args[2];
                Object.keys(vehicles).forEach(function (key){
                    changeLane(key, offset);
                })
            }
            else {
                device_id = args[1];
                let offset = args[2];
                changeLane(device_id, offset);
            }
            break;
        case 'changelight':
            if (args[1] === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    changeLights(key);
                })
            }
            else {
                device_id = args[1];
                changeLights(device_id);
            }
            break;
        case 'changeightpattern':
            if (args[1] === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    changeLightPattern(key);
                })
            }
            else {
                device_id = args[1];
                changeLightPattern(device_id);
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


 */
