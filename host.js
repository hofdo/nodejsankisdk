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

/**
 * Establish connection
 * @type {MqttClient}
 */

let client = mqtt.connect('mqtt://192.168.1.121', {
    clientId: connectionID,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    will: {
        topic: 'Anki/Host/' + hostID + '/S/HostStatus',
        payload: JSON.stringify({
            "value": false
        }),
        retain: true,
        qos: 1
    }
});

/**
 * MQTT Listener
 */

client.on("connect", function () {
    client.publish('Anki/Host/' + hostID + '/S/HostStatus', JSON.stringify({
        "value": true
    }), {
        "retain": true,
        "qos": 1
    })
    client.publish("Anki/Host/" + hostID + "/S/Cars", JSON.stringify({}), {
        "retain": true,
        "qos": 1
    });
    client.subscribe("Anki/Host/" + hostID + "/I/#");
    client.subscribe("Anki/Car/+/I/#");
    client.subscribe("Anki/Car/I");
});

client.on("error", function (error) {
    console.log("Can't connect" + error)
});

client.on("message", function (topic, message) {
    let msg = JSON.parse(message.toString());
    let topicSep = topic.split("/");
    if (RegExp("Anki[\/]Host[\/]" + hostID + "[\/]I").test(topic)) {

        let cmd = Object.keys(msg)
        switch (cmd.toString()) {
            case "connecting":
                let connecting = msg["connecting"];
                if (connecting) {
                    //scan and connect
                    noble.startScanning(['be15beef6186407e83810bd89c4d8df4']);
                    setTimeout(function () {
                        noble.stopScanning();
                        let payload = [];
                        Object.keys(vehicles).forEach(function (key) {
                            payload.push(key);
                            connect(key)
                        })
                        client.publish("Anki/Host/" + hostID + "/S/Cars", JSON.stringify(payload), {
                            "retain": true,
                            "qos": 1
                        });
                    }, 2000);
                } else {
                    Object.keys(vehicles).forEach(function (key) {
                        disconnect(key);
                    })
                }
                break
            case "cars":
                client.publish("Anki/Host/" + hostID + "/S/Cars", JSON.stringify(cars), {
                    "retain": true,
                    "qos": 1
                });
                break
            case "car_status":
                Object.keys(vehicles).forEach(function (car_id){
                    client.publish("Anki/Car/" + car_id + "/S/Information", JSON.stringify({
                        "address": vehicles[car_id]["device"].address,
                        "identifier": vehicles[car_id]["device"].advertisement.manufacturerData.readUInt32LE(0),
                        "model": getModel(vehicles[car_id]["device"].advertisement.manufacturerData.readUInt8(4)),
                        "modelId": vehicles[car_id]["device"].advertisement.manufacturerData.readUInt8(4),
                        "productId": vehicles[car_id]["device"].advertisement.manufacturerData.readUInt16LE(6)
                    }), {
                        "retain": true,
                        "qos": 1
                    })
                })
                break
        }
    } else if (RegExp("Anki[\/]Car[\/].*[\/]I").test(topic)) {
        handleCmd(topicSep[2], msg, vehicles, client);
    } else if (RegExp("Anki[\/]Car[\/]I").test(topic)) {
        handleCmd("global", msg, vehicles, client);
    } else {

    }
});

/**
 * Set up Interval
 * Requests the version, battery status and a ping response from the connected devices in a 10sec interval
 */

setInterval(function () {

    Object.keys(vehicles).forEach(function (car_id){
        if (vehicles[car_id]['connected']){
            handleCmd(car_id, {
                "version": true
            }, vehicles, client);
            handleCmd(car_id, {
                "battery": true
            }, vehicles, client);
            handleCmd(car_id, {
                "ping": true
            }, vehicles, client);
        }
    })
}, 10000)

/**
 * Noble Listener
 */

noble.on('discover', function (device) {
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
    }), {})
    client.publish("Anki/Car/" + device.id + "/S/DiscoveryTime", JSON.stringify({
        "timestamp": Date.now(),
    }), {
        "retain": true,
        "qos": 1
    })
    let manufacturerData = device.advertisement.manufacturerData;
    client.publish("Anki/Car/" + device.id + "/S/Information", JSON.stringify({
        "address": device.address,
        "identifier": manufacturerData.readUInt32LE(0),
        "model": getModel(manufacturerData.readUInt8(4)),
        "modelId": manufacturerData.readUInt8(4),
        "productId": manufacturerData.readUInt16LE(6)
    }), {
        "retain": true,
        "qos": 1
    })

});

/**
 *  Function for establishing connection to BLE Devices
 * @param device_id
 */

function connect(device_id) {
    let vehicle = vehicles[device_id]["device"];
    vehicle.connect(function (error) {
        vehicle.discoverSomeServicesAndCharacteristics(
            ["be15beef6186407e83810bd89c4d8df4"],
            ["be15bee06186407e83810bd89c4d8df4", "be15bee16186407e83810bd89c4d8df4"],
            function (error, services, characteristics) {
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
                client.publish("Anki/Host/" + hostID + "/E/CarConnected", JSON.stringify({
                    "timestamp": Date.now(),
                    "Car": device_id
                }), {})
                cars.push(device_id);
            }
        );
    });
}

/**
 * Function for disconnecting BLE Devices
 * @param device_id
 */

function disconnect(device_id) {
    vehicles[device_id]['device'].disconnect();
    vehicles[device_id]['connected'] = false;
    client.publish("Anki/Car/" + device_id + "/S/Information", JSON.stringify({
        "address": "",
        "identifier": "",
        "model": "",
        "modelId": "",
        "productId": ""
    }), {
        "retain": true,
        "qos": 1
    })
    cars = []
    client.publish("Anki/Host/" + hostID + "/S/Cars", JSON.stringify({}), {
        "retain": true,
        "qos": 1
    });
    client.publish("Anki/Host/" + hostID + "/E/CarDisconnected", JSON.stringify({
        "timestamp": Date.now(),
        "Car": device_id
    }), {})
    console.log('Disconnected successfully!')
}

process.on('exit', code => {
    console.log("exit")
    process.exit()
});

//catches ctrl+c event
process.on('SIGINT', code => {
    console.log("CTRL+C")
    Object.keys(vehicles).forEach(function (key) {
        disconnect(key);
    })
    process.exit()


});



