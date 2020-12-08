let mqtt = require('mqtt');
let uuid = require('uuid');
let noble = require('@abandonware/noble');

const connectionID = "host" + uuid.v4();
//const hostID = uuid.v4();
const hostID = "host";

let vehicles = new Map();
let cars = [];
let message = null;
let device_id = null;

//Sets Interval for executing code all 5sec
setInterval(function (){
    client.publish("Anki/Host/' + hostID + '/S/HostStatus", JSON.stringify({
        "timestamp": Date.now(),
        "value": true
    }))
}, 5000);

let client = mqtt.connect('mqtt://192.168.1.160', {
    clientId: connectionID,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    will: {
        topic: 'Anki/Host/' + hostID + '/S/HostStatus',
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
    let msg = JSON.parse(message.toString());
    let topicSep = topic.split("/");
    console.log(topic)
    if ( RegExp("Anki[\/]Host[\/]host[\/]I").test(topic)) {
        let connecting = msg["connecting"];
        console.log(connecting)
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
    } else if (RegExp("Anki[\/]Car[\/].*[\/]I").test(topic)) {
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
    client.publish("Anki/Host/" + hostID + "/E/CarDiscovered", JSON.stringify({
        "timestamp": Date.now(),
        "Car": device.id
    }), {

    })
    client.publish("Anki/Car/" + device.id + "/S/DiscoveryTime", JSON.stringify({
        "timestamp": Date.now(),
    }), {

    })
    connect(device.id)
    client.publish("Anki/Car/" + device.id + "/S/Cars", JSON.stringify(cars.toString()))
});

noble.on("scanStop", function (){

})

client.on("error",function(error){ console.log("Can't connect"+error)});

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
                vehicle.reader.on('data', (data, isNot) => handleMsg(data, isNot, vehicle));
                vehicles[device_id]['connected'] = true;
                message = new Buffer(4);
                message.writeUInt8(0x03, 0);
                message.writeUInt8(0x90, 1);
                message.writeUInt8(0x01, 2);
                message.writeUInt8(0x01, 3);
                vehicle.writer.write(message, true);
                console.log("connect success");
                cars.push(device_id);
            }
        );
    });
}

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
            let version = data.readUInt16(2);
            client.publish("Anki/Car/" + vehicle.id + "/S/Version", JSON.stringify({
                "timestamp": Date.now,
                "value": version
                }
            ));
            break;
        case 27:
            // Battery Level received
            let level = data.readUInt16(2);
            client.publish("Anki/Car/" + vehicle.id + "/S/Version", JSON.stringify({
                "timestamp": Date.now,
                "value": level
                }
            ));
            break;
        case 39:
            // ANKI_VEHICLE_MSG_V2C_LOCALIZATION_POSITION_UPDATE
            let pieceLocation = data.readUInt8(2);
            let pieceId = data.readUInt8(3);
            let offset_pos = data.readFloatLE(4);
            let speed = data.readUInt16(8);
            let flag = data.readUInt8(10);
            let last_rec_lane_change_cmd_id = data.readUInt8(11);
            let last_exe_lane_change_cmd_id = data.readUInt8(12);
            let last_des_lane_change_speed = data.readUInt8(13);
            let last_des_speed = data.readUInt8(15);

            console.log("Vehicle ID: " + vehicle.id
                + " Message_id: " + messageID
                + ' offset: '  + offset_pos
                + ' speed: ' + speed
                + " flag: " + flag
                + ' - pieceId: '  + pieceId
                + ' pieceLocation: ' + pieceLocation
                + " last_rec_lane_change_cmd: " + last_rec_lane_change_cmd_id
                + " last_exe_lane_change_cmd: " + last_exe_lane_change_cmd_id
                + " last_des_lane_change_speed: " + last_des_lane_change_speed
                + " last_des_speed: " + last_des_speed);

            client.publish("Anki/Car/" + vehicle.id + "/S/PositionInfo", JSON.stringify({
                    "timestamp": Date.now()
            }
            ));
            break;
        case 41:
            // ANKI_VEHICLE_MSG_V2C_LOCALIZATION_TRANSITION_UPDATE
            let road_piece_idx = data.readInt8(2);
            let road_piece_idx_prev = data.readInt8(3);
            let offset_trans = data.readFloatLE(4);
            let last_recv_lane_change_id = data.readUInt8(8);
            let last_exec_lane_change_id = data.readUInt8(9);
            let last_desired_lane_change_speed_mm_per_sec = data.readUInt16(10);

            console.log("Vehicle ID " + vehicle.id
                + "Message_id: " + messageID
                + " road_piece_idx: " + road_piece_idx
                + " road_piece_idx_prev: " + road_piece_idx_prev
                + ' offset: '  + offset_trans
                + ' last_recv_lane_change_id: '  + last_recv_lane_change_id
                + ' last_exec_lane_change_id: '  + last_exec_lane_change_id
                + ' last_desired_lane_change_speed_mm_per_sec: '  + last_desired_lane_change_speed_mm_per_sec
                );

            client.publish("controller/trans_update", JSON.stringify({

                }
            ));
            break;
        case 42:
            //  ANKI_VEHICLE_MSG_V2C_LOCALIZATION_INTERSECTION_UPDATE
            let road_piece_idx_intersection = data.readInt8(2);
            let offset = data.readFloatLE(3);
            let intersection_code = data.readUInt8(7);
            let is_exiting = data.readUInt8(8);
            let mm_transition_bar = data.readUInt16(9);
            let mm_intersection_code = data.readUInt16(11);

            console.log(vehicle.id + "Message_id: " + messageID + " road_piece_idx: " + data.readInt8(2) + " offset: "
                + data.readFloatLE(3) + " intersection_code: " + data.readUInt8(7) + " is_exiting: " + data.readUInt8(8)
                + " mm_transition_bar: " + data.readUInt16(9) + " mm_insection_code: " + data.readUInt16(11));

            client.publish("controller/delocalized", JSON.stringify({

            }
            ));
            break;
        case 43:
            // ANKI_VEHICLE_MSG_V2C_VEHICLE_DELOCALIZED
            client.publish("Anki/Car/" + vehicle.id + "/E/Delocalized", JSON.stringify({
                    "timestamp": Date.now()
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