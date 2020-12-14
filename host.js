let mqtt = require('mqtt');
let uuid = require('uuid');
let noble = require('@abandonware/noble');
const events = require('events');

const {handleReturnMsg} = require("./ReturnMsgHandler");
const {handleCmd} = require("./CmdHandler");
const {getModel} = require("./models");

const connectionID = "host" + uuid.v4();
//const hostID = uuid.v4();
const hostID = "host";

let eventEmitter = new events.EventEmitter();

let vehicles = new Map();
let cars = [];
let message = null;
let device_id = null;

//Sets Interval for executing code all 5sec
setInterval(function (){
    client.publish("Anki/Host/' + hostID + '/S/HostStatus", JSON.stringify({
        "timestamp": Date.now(),
        "value": false
    }))
}, 5000);

/**
 * Establish connection
 * @type {MqttClient}
 */

let client = mqtt.connect('mqtt://192.168.1.160', {
    clientId: connectionID,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    will: {
        topic: 'Anki/Host/' + hostID + '/S/HostStatus',
        payload: JSON.stringify({
            "value": true
        }),
        retain: true,
        qos: 0
    }
});

/**
 * MQTT Listener
 */

client.on("connect", function (){
    client.subscribe("Anki/Host/" + hostID + "/I/#");
    client.subscribe("Anki/Car/+/I/#");
    client.subscribe("Anki/Car/I");
});

client.on("error",function(error){ console.log("Can't connect"+error)});

client.on("message", function (topic, message){
    let msg = JSON.parse(message.toString());
    let topicSep = topic.split("/");
    if ( RegExp("Anki[\/]Host[\/]host[\/]I").test(topic)) {
        let connecting = msg["connecting"];
        if (connecting) {
            //scan and connect
            noble.startScanning(['be15beef6186407e83810bd89c4d8df4']);
            setTimeout(function (){
                noble.stopScanning();
                let payload = [];
                Object.keys(vehicles).forEach(function (key){
                    payload.push(key);
                    connect(key)
                })
                client.publish("Anki/Host/" + hostID + "/S/Cars", JSON.stringify(payload), {});
            }, 2000);
        } else {
            Object.keys(vehicles).forEach(function (key){
                disconnect(key);
                client.publish("Anki/Host/" + hostID + "/S/Cars", JSON.stringify({

                }), {});
            })
        }
    } else if (RegExp("Anki[\/]Car[\/].*[\/]I").test(topic)) {
        handleCmd(topicSep[2], msg, vehicles, client);
    } else if (RegExp("Anki[\/]Car[\/]I").test(topic)) {
        handleCmd("global", msg, vehicles, client);
    } else {
    }
});


/**
 * Noble Listener
 */

noble.on('discover', function (device){
    vehicles[device.id] = {
        'id': device.id,
        'device': noble._peripherals[device.id],
        'connected': false,
        'isOnTrack': false,
        'isCharging': false,
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
    let manufacturerData = device.advertisement.manufacturerData;
    client.publish("Anki/Car/" + device.id + "/S/Information", JSON.stringify({
        "address": device.address,
        "identifier": manufacturerData.readUInt32LE(0),
        "model": getModel(manufacturerData.readUInt8(4)),
        "modelId": manufacturerData.readUInt8(4),
        "productId": manufacturerData.readUInt16LE(6)
    }), {

    })

});

/**
 *
 * @param device_id
 */

function connect(device_id){
    let vehicle = vehicles[device_id]["device"];
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
                vehicle.reader.on('data', (data, isNot) => handleReturnMsg(data, isNot, vehicle, client, eventEmitter));
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

/**
 *
 * @param device_id
 */

function disconnect(device_id){
    vehicles[device_id]['device'].disconnect();
    vehicles[device_id]['connected'] = false;
    console.log('Disconnected successfully!')
}

