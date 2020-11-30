//let noble = require('noble');
//let noble = require('noble-uwp');
let noble = require('@abandonware/noble');
let mqtt = require('mqtt')
let url = require('url');
let readline = require('readline');
let util = require('util');

let vehicles = new Map();
let message = null;
let device_id = null;

/**
 *
 * @type {MqttClient}
 */

let client = mqtt.connect('mqtt://localhost', {
    clientId: 'controller',
    protocolId: 'MQIsdp',
    protocolVersion: 3
});

/**
 *
 */

client.on("connect", function () {
    client.subscribe('command/#')
})


/**
 *
 */

client.on("message", function (topic, message) {
    console.log('Topic: ' + topic + ' Msg: ' + message.toString());
    let msg = JSON.parse(message.toString());

    switch (msg['command'].toLowerCase()) {
        case 'scan':
            noble.startScanning(['be15beef6186407e83810bd89c4d8df4']);
            setTimeout(function (){
                noble.stopScanning();
                let payload = [];
                Object.keys(vehicles).forEach(function (key){
                    payload.push(key);
                })
                client.publish("controller/scanned", JSON.stringify(payload));
            }, 2000);
            break;
        case 'connect':
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    connect(key);
                })
            }
            else {
                device_id = msg['target'];
                connect(device_id);
            }
            break;
        case 'disconnect':
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    disconnect(key);
                })
            }
            else {
                device_id = msg['target'];
                disconnect(device_id)
            }
            break;
        case 'speed':
            let speed = msg['speed'];
            let accel = msg['accel'];
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    setSpeed(key, speed, accel);
                })
            }
            else {
                device_id = msg['target'];
                setSpeed(device_id, speed, accel);
            }
            break;
        case 'change_lane':
            if (msg['target'].toLowerCase() === 'global'){
                let offset = msg['offset'];
                Object.keys(vehicles).forEach(function (key){
                    changeLane(key, offset);
                })
            }
            else {
                device_id = msg['target'];
                let offset = msg['offset'];
                changeLane(device_id, offset);
            }
            break;
        case 'change_offset':
            if (msg['target'].toLowerCase() === 'global'){
                let offset = msg['offset'];
                Object.keys(vehicles).forEach(function (key){
                    setOffsetFromCenter(key, offset);
                })
            }
            else {
                device_id = msg['target'];
                let offset = msg['offset'];
                setOffsetFromCenter(device_id, offset);
            }
            break;
        case 'u_turn':
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    uTurn(key);
                })
            }
            else {
                device_id = msg['target'];
                uTurn(device_id);
            }
            break;
        case 'changelight':
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    changeLights(key);
                })
            }
            else {
                device_id = msg['target'];
                changeLights(device_id);
            }
            break;
        case 'changelightpattern':
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    changeLightPattern(key);
                })
            }
            else {
                device_id = msg['target'];
                changeLightPattern(device_id);
            }
            break;
        case 'batterystatus':
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    requestBatteryLevel(key);
                })
            }
            else {
                device_id = msg['target'];
                requestBatteryLevel(device_id);
            }
            break;
        case 'getversion':
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    requestVersion(key);
                })
            }
            else {
                device_id = msg['target'];
                requestVersion(device_id);
            }
            break;
        case 'ping':
            if (msg['target'].toLowerCase() === 'global'){
                Object.keys(vehicles).forEach(function (key){
                    ping(key);
                })
            }
            else {
                device_id = msg['target'];
                ping(device_id);
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

})

/**
 *
 * @param data
 * @param isNotification
 * @param vehicle
 */

function dataListener(data, isNotification, vehicle){
    // console.log(util.format("%s;%s\n", vehicle.id, data.readUInt8(1)));
    let messageID = data.readUInt8(1);

    switch (messageID){
        case 23:
            // Ping Responses
            client.publish("controller/ping", JSON.stringify({
                "command": "ping_res",
                "target": vehicle.id
                }
            ));
            break;
        case 25:
            // Version received
            let version = data.readUInt16LE(2);
            client.publish("controller/version", JSON.stringify({
                    "command": "version_res",
                    "target": vehicle.id,
                    "data": version
                }
            ));
            break;
        case 27:
            // Battery Level received
            let level = data.readUInt16LE(2);
            client.publish("controller/battery_level", JSON.stringify({
                    "command": "battery_res",
                    "target": vehicle.id,
                    "data": level
                }
            ));
            break;
        case 39:
            // ANKI_VEHICLE_MSG_V2C_LOCALIZATION_POSITION_UPDATE
            let pieceLocation = data.readUInt8(2);
            let pieceId = data.readUInt8(3);
            let offset_pos = data.readFloatLE(4);
            let speed = data.readUInt16LE(8);
            console.log(vehicle.id + "Message_id: " + messageID + ' offset: '  + offset_pos + ' speed: ' + speed + ' - pieceId: '  + pieceId + ' pieceLocation: ' + pieceLocation);
            client.publish("controller/pos_update", JSON.stringify({
                    "command": "pos_update_res",
                    "target": vehicle.id,
                    "data": {
                        "offset": offset_pos,
                        "speed": speed,
                        "pieceID": pieceId,
                        "pieceLocation": pieceLocation,
                    }
                }
            ));
            break;
        case 41:
            // ANKI_VEHICLE_MSG_V2C_LOCALIZATION_TRANSITION_UPDATE
            let offset_trans = data.readFloatLE(4)
            console.log(vehicle.id + "Message_id: " + messageID + ' offset: '  + offset_trans);
            client.publish("controller/trans_update", JSON.stringify({
                    "command": "trams_update_res",
                    "target": vehicle.id,
                    "data": {
                        "offset": offset_trans
                    }
                }
            ));
            break;
        case 42:
            //  ANKI_VEHICLE_MSG_V2C_LOCALIZATION_INTERSECTION_UPDATE
            //ToDo Implement
            break;
        case 43:
            // ANKI_VEHICLE_MSG_V2C_VEHICLE_DELOCALIZED
            client.publish("controller/delocalized", JSON.stringify({
                    "command": "delocalized",
                    "target": vehicle.id
                }
            ));
            break;
        case 45:
            // ANKI_VEHICLE_MSG_V2C_OFFSET_FROM_ROAD_CENTER_UPDATE
            let offset_update = data.readFloatLE(2);
            client.publish("controller/offset_update", JSON.stringify({
                    "command": "trams_update_res",
                    "target": vehicle.id,
                    "data": {
                        "offset": offset_update
                    }
                }
            ));

            break;
        default:
            // Not definded

            break;
    }

}

/**
 *
 * @param device_id
 */

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
                    vehicle.reader.on('data', (data, isNot) => dataListener(data, isNot, vehicle));
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

/**
 *
 * @param device_id
 */

function disconnect(device_id){
    vehicles[device_id]['device'].disconnect();
    vehicles[device_id]['connected'] = false;
    console.log('Disconnected successfully!')
}

/**
 *
 * @param device_id
 * @param speed
 * @param accel
 */

function setSpeed(device_id, speed, accel){
    message = new Buffer(7);
    message.writeUInt8(0x06, 0);
    message.writeUInt8(0x24, 1);
    message.writeInt16LE(speed, 2);
    message.writeInt16LE(accel, 4);
    vehicles[device_id]['writer'].write(message);
}

/**
 *
 * @param device_id
 * @param offset
 */

function changeLane(device_id, offset){
    message = new Buffer(12);
    message.writeUInt8(11,0);
    message.writeUInt8(0x25,1);
    message.writeInt16LE(250,2);
    message.writeInt16LE(1000, 4);
    message.writeFloatLE(offset, 6);
    vehicles[device_id]['writer'].write(message);
}

/**
 *
 * @param device_id
 * @param offset
 */

function setOffsetFromCenter(device_id, offset){
    message = Buffer.alloc(4);
    message.writeUInt8(3, 0);
    message.writeUInt8(0x2c, 1);
    message.writeFloatLE(offset, 2);
    vehicles[device_id]['writer'].write(message);
}

/**
 *
 * @param key
 */

function uTurn(device_id) {
    message = Buffer.alloc(4);
    message.writeUInt8(0x03, 0);
    message.writeUInt8(0x32, 1); // ANKI_VEHICLE_MSG_C2V_TURN_180
    message.writeUInt8(0x03, 2);
    message.writeUInt8(0x00, 3);
    vehicles[device_id]['writer'].write(message);
}

/**
 *
 * @param device_id
 */

function changeLights(device_id){
    message = new Buffer(3);
    message.writeUInt8(0x02, 0);
    message.writeUInt8(0x1d, 1);
    message.writeUInt8(140, 2);
    vehicles[device_id]['writer'].write(message);
}

/**
 *
 * @param device_id
 */

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

/**
 *
 * @param device_id
 */

function ping(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x16,1);
    vehicles[device_id]['writer'].write(message);
}

/**
 *
 * @param device_id
 */

function requestBatteryLevel(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x1a,1);
    vehicles[device_id]['writer'].write(message);
}

/**
 *
 * @param device_id
 */

function requestVersion(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x18,1);
    vehicles[device_id]['writer'].write(message);
}

/**
 *
 */

noble.on('discover', function (device){
    vehicles[device.id] = {
        'id': device.id,
        'device': noble._peripherals[device.id],
        'connected': false,
        'writer': null,
        'reader': null
    }
    console.log("Scanned: " + device.id);
    connect(device_id);
});
