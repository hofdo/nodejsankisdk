let mqtt = require('mqtt');
let uuid = require('uuid');
let noble = require('@abandonware/noble');

const connectionID = "host" + uuid.v4();
//const hostID = uuid.v4();
const hostID = "host";

let vehicles = new Map();
let message = null;
let device_id = null;

let client = mqtt.connect('mqtt://192.168.1.160', {
    clientId: connectionID,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    will: {
        topic: 'Anki/Host/' + uuid.v4() + '/S/HostStatus',
        payload: JSON.stringify({
            "value": false
        }),
        retain: true,
        qos: 0
    }
});

client.on("connect", function (){
    client.subscribe("Anki/Host/" + hostID + "/I/#");
    client.subscribe("Anki/Car/+/I/#");
    client.subscribe("Anki/Car/I");
    client.subscribe("Anki/Service/I");
});

client.on("message", function (topic, message){
    let msg = message.toJSON();
    let topicSep = topic.split("/");
    if ( RegExp("Anki[\/]Host[\/]host[\/]I[\/].*").test(topic)) {
        let connecting = msg["connecting"];
        if (connecting) {
            //scan and connect
            noble.startScanning(['be15beef6186407e83810bd89c4d8df4']);
            setTimeout(function (){
                noble.stopScanning();
                let payload = [];
                Object.keys(vehicles).forEach(function (key){
                    payload.push(key);
                })
                client.publish("controller/scanned", JSON.stringify(payload));
            }, 2000);
        } else {
            //disconnect
        }
    } else if (RegExp("Anki[\/]Car[\/].*[\/]I[\/].*").test(topic)) {
        handleCmd(topicSep[2], msg);
    } else if (RegExp("Anki[\/]Car[\/]I").test(topic)) {
        handleCmd("global", msg);
    } else {
    }
});


noble.on('discover', function (device){
    vehicles[device.id] = {
        'id': device.id,
        'device': noble._peripherals[device.id],
        'connected': false,
        'writer': null,
        'reader': null
    }
    console.log("Scanned: " + device.id);
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
                vehicle.reader.on('data', (data, isNot) => handleMsg(data, isNot, vehicle));
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
});

client.on("error",function(error){ console.log("Can't connect"+error)});

function handleMsg(data, isnNot, vehicle){
    let messageID = data.readUInt8(1);

    switch (messageID){
        case 23:
            // Ping Responses
            client.publish("controller/ping", JSON.stringify({

                }
            ));
            break;
        case 25:
            // Version received
            let version = data.readUInt16LE(2);
            client.publish("controller/version", JSON.stringify({

                }
            ));
            break;
        case 27:
            // Battery Level received
            let level = data.readUInt16LE(2);
            client.publish("controller/battery_level", JSON.stringify({

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

                }
            ));
            break;
        case 41:
            // ANKI_VEHICLE_MSG_V2C_LOCALIZATION_TRANSITION_UPDATE
            let offset_trans = data.readFloatLE(4)
            console.log(vehicle.id + "Message_id: " + messageID + ' offset: '  + offset_trans);
            client.publish("controller/trans_update", JSON.stringify({

                }
            ));
            break;
        case 42:
            //  ANKI_VEHICLE_MSG_V2C_LOCALIZATION_INTERSECTION_UPDATE
            console.log(vehicle.id + "Message_id: " + messageID + " road_piece_idx: " + data.readInt8(2) + " offset: "
                + data.readFloatLE(3) + " intersection_code: " + data.readUInt8(7) + " is_exiting: " + data.readUInt8(8)
                + " mm_transition_bar: " + data.readUInt16LE(9) + " mm_insection_code: " + data.readUInt16LE(11));
                client.publish("controller/delocalized", JSON.stringify({

                }
                ));
            break;
        case 43:
            // ANKI_VEHICLE_MSG_V2C_VEHICLE_DELOCALIZED
            client.publish("controller/delocalized", JSON.stringify({

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

function handleCmd(target, command) {
    switch (Object.keys(command)){
        case "speed":
            let speed = command["speed"];
            let acceleration = command["acceleration"]

            break;
        case "lane":
            let offset = command["offset"];
            break;
        case "turn":
            let turnType = command["turn"]["type"];
            let turnTime = command["turn"]["time"];
            break;
        case "Light":
            let light = command["light"];
            break;
        case "battery":
            let battery = command["battery"];
            break;
        case "version":
            let version = command["version"];
            break;
        default:
            break;
    }
}