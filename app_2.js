//let noble = require('noble');
let noble = require('noble-uwp');
let util = require('util')
let readline = require('readline')

let vehicles = new Map();
let message = null;
let device_id = null;

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
            device_id = args[1];
            let vehicle = noble._peripherals[device_id]
            vehicle.connect(function(error) {
                vehicle.discoverSomeServicesAndCharacteristics(
                    ["be15beef6186407e83810bd89c4d8df4"],
                    ["be15bee06186407e83810bd89c4d8df4", "be15bee16186407e83810bd89c4d8df4"],
                    function(error, services, characteristics) {
                        //  console.log("!!!!!!!!!!!!!!!!!");
                        //  console.log(characteristics);
                        //  console.log("!!!!!!!!!!!!!!!!!");
                        vehicle.reader = characteristics[1];//.find(x => !x.properties.includes("write"));
                        vehicle.writer = characteristics[0];//.find(x => x.properties.includes("write"));
                        vehicles[device_id]['writer'] = vehicle.writer;
                        vehicles[device_id]['reader'] = vehicle.reader;
                        vehicle.reader.notify(true);
                        vehicle.reader.on('data', function(data, isNotification) {
                            console.log(util.format("%s;%s\n", vehicle.id, data.toString("hex")));
                        });
                        vehicles[device_id]['connected'] = true;
                        message = new Buffer(4);
                        message.writeUInt8(0x03, 0);
                        message.writeUInt8(0x90, 1);
                        message.writeUInt8(0x01, 2);
                        message.writeUInt8(0x01, 2);
                        vehicle.writer.write(message, true);
                        console.log("connect success");
                    }
                );
            });
            break;
        case 'disconnect':
            device_id = args[1];
            vehicles[device_id]['device'].disconnect();
            vehicles[device_id]['connected'] = false;
            console.log('Disconnected successfully!')
            break;
        case 'speed':
            device_id = args[1];
            let speed = args[2];
            message = new Buffer(7);
            message.writeUInt8(0x06, 0);
            message.writeUInt8(0x24, 1);
            message.writeInt16LE(500, 2);
            message.writeInt16LE(0, 4);
            //console.log(noble._peripherals[device_id]);
            //vehicles[device_id]['device'].writer.write(message);
            noble._peripherals[device_id].writer.write(message);
            break;
        case 'exit':

        default:
            console.log("Invalid Input!")
            break;
    }
});

