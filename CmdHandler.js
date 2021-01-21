let message = "";
let isGlobal = false;

/*
This functions handles the commands from the Intents and returns the message that will be send to the car
 */

const handleCmd = (target, command, vehicles, client) => {
    if (target.toLowerCase() === 'global') isGlobal = true;
    switch (Object.keys(command)[0]){
        case "acceleration":
        case "speed":
            let speed = command["speed"];
            let acceleration = command["acceleration"]
            if (isGlobal) {
                Object.keys(vehicles).forEach(function (key){
                    console.log(key);
                    vehicles[key]['writer'].write(getSpeedMessage(key, speed, acceleration));
                })
            }
            else {
                vehicles[target]['writer'].write(getSpeedMessage(target, speed, acceleration));
                client.publish("Anki/Car/" + target + "/S/Speed/Desired", JSON.stringify({
                    "timestamp": Date.now(),
                    "value": speed
                }), {
                    "retain": true,
                    "qos": 1
                })
            }
            break;
        case "lane":
            let offset = command["lane"];
            if (isGlobal) {
                Object.keys(vehicles).forEach(function (key){
                    vehicles[key]['writer'].write(getLaneMessage(key, offset));
                })
            }
            else {
                vehicles[target]['writer'].write(getLaneMessage(target, offset));
                client.publish("Anki/Car/" + target + "/S/Lane/Desired", JSON.stringify({
                    "timestamp": Date.now(),
                    "value": offset
                }), {
                    "retain": true,
                    "qos": 1
                })
            }
            break;
        case "turn":
            let turnType = command["turn"]["type"];
            let turnTime = command["turn"]["time"];
            if (isGlobal) {
                Object.keys(vehicles).forEach(function (key){
                    vehicles[key]['writer'].write(getTurnMessage(key, turnType, turnTime));
                })
            }
            else vehicles[target]['writer'].write(getTurnMessage(target, turnType, turnTime));
            break;
        case "Light":
            let light = command["light"];
            break;
        case "battery":
            let battery = command["battery"];
            if (isGlobal) {
                Object.keys(vehicles).forEach(function (key){
                    vehicles[key]['writer'].write(getBatteryLevelMessage(key));
                })
            }
            else vehicles[target]['writer'].write(getBatteryLevelMessage(target));
            break;
        case "version":
            let version = command["version"];
            if (isGlobal) {
                Object.keys(vehicles).forEach(function (key){
                    vehicles[key]['writer'].write(getVersionMessage(key));
                })
            }
            else vehicles[target]['writer'].write(getVersionMessage(target));
            break;
        case "ping":
            if (isGlobal) {
                Object.keys(vehicles).forEach(function (key){
                    vehicles[key]['writer'].write(getPingMessage(key));
                })
            }
            else vehicles[target]['writer'].write(getPingMessage(target));
            break;
        default:
            break;
    }
}

/**
 * This function sets the message, so that the car changes its speed
 * @param device_id
 * @param speed
 * @param accel
 */

function getSpeedMessage(device_id, speed, accel){
    message = new Buffer(7);
    message.writeUInt8(0x06, 0);
    message.writeUInt8(0x24, 1);
    message.writeInt16LE(speed, 2);
    message.writeInt16LE(accel, 4);
    return message;
    //vehicles[device_id]['writer'].write(message);
}

/**
 * This function sets the message, so that the car changes to the desired lane
 * @param device_id
 * @param offset
 */

function getLaneMessage(device_id, offset){
    message = new Buffer(12);
    message.writeUInt8(11,0);
    message.writeUInt8(0x25,1);
    message.writeInt16LE(250,2);
    message.writeInt16LE(1000, 4);
    message.writeFloatLE(offset, 6);
    return message;
    //vehicles[device_id]['writer'].write(message);
}

/**
 * This function sets the message, so that the car sends its current offset value
 * @param device_id
 * @param offset
 */

function getOffsetFromCenterMessage(device_id, offset){
    message = Buffer.alloc(4);
    message.writeUInt8(3, 0);
    message.writeUInt8(0x2c, 1);
    message.writeFloatLE(offset, 2);
    return message;
    //vehicles[device_id]['writer'].write(message);
}

/**
 * This function sets the message, so that the car executes a turn based on the given parameters
 * @param key
 */

function getTurnMessage(device_id, type, time) {
    message = Buffer.alloc(4);
    message.writeUInt8(0x03, 0);
    message.writeUInt8(0x32, 1); // ANKI_VEHICLE_MSG_C2V_TURN_180
    message.writeUInt8(type, 2);
    message.writeUInt8(time, 3);
    return message;
    //vehicles[device_id]['writer'].write(message);
}

/**
 * This function sets the message, so that the car changes its lights
 * @param device_id
 */

function getChangeLightsMessage(device_id){
    message = new Buffer(3);
    message.writeUInt8(0x02, 0);
    message.writeUInt8(0x1d, 1);
    message.writeUInt8(140, 2);
    return message;
    //vehicles[device_id]['writer'].write(message);
}

/**
 * This function sets the message, so that the car changes its light pattern
 * @param device_id
 */

function getChangeLightsPatternMessage(device_id){
    message = new Buffer(8);
    message.writeUInt8(0x07, 0);
    message.writeUInt8(0x33, 1);
    message.writeUInt8(5, 2);
    message.writeUInt8(1, 3);
    message.writeUInt8(1, 4);
    message.writeUInt8(5, 5);
    message.writeInt16LE(0,6)
    return message;
    //vehicles[device_id]['writer'].write(message);
}

/**
 * This Function sets the message, so that the car will respond on a ping message send to him
 * @param device_id
 */

function getPingMessage(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x16,1);
    return message;
    //vehicles[device_id]['writer'].write(message);
}

/**
 * This function sets the message, so that the car sends it current battery level back
 * @param device_id
 */

function getBatteryLevelMessage(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x1a,1);
    return message;
    //vehicles[device_id]['writer'].write(message);
}

/**
 * This function sets the message, so that the car sends it current firmware version back
 * @param device_id
 */

function getVersionMessage(device_id){
    message = new Buffer(2);
    message.writeUInt8(0x01, 0);
    message.writeUInt8(0x18,1);
    return message;
    //vehicles[device_id]['writer'].write(message);
}

module.exports = {
    handleCmd
}