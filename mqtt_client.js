let mqtt = require('mqtt');
let readline = require('readline');

let client = mqtt.connect('mqtt://192.168.1.160', {
    clientId: 'mqtt_client',
    clean: true
});

client.on('connect', function (){
    console.log("Connected: " + client.connected);
});

client.on('error', function (error) {
    console.log("Can't connect: " + error);
    process.exit(1);
})

client.on('message', function (topic, message){
    console.log('Topic: ' + topic + ' Msg: ' + message.toString());
})

var cli = readline.createInterface(({
    input: process.stdin,
    output: process.stdout
}));

cli.on('line', function (cmd){
    let args = cmd.split(' ');
    switch (args[0].toLowerCase()) {
        case 'scan':
            client.publish('command/scan', JSON.stringify({
                command: 'scan'
            }))
            break;
        case 'connect':
            client.publish('command/connect', JSON.stringify({
                command: 'connect',
                target: args[1]
            }))
            break;
        case 'disconnect':
            client.publish('command/disconnect', JSON.stringify({
                command: 'disconnect',
                target: args[1]
            }))
            break;
        case 'speed':
            client.publish('command/speed', JSON.stringify({
                command: 'speed',
                target: args[1],
                speed: args[2],
                accel: args[3]
            }))
            break;
        case 'change_lane':
            client.publish('command/change_lane', JSON.stringify({
                command: 'change_lane',
                target: args[1],
                offset: args[2]
            }))
            break;
        case 'change_light':
            client.publish('command/change_light', JSON.stringify({
                command: 'change_light',
                target: args[1],
                offset: args[2]
            }))
            break;
        case 'change_light_pattern':
            client.publish('command/change_light', JSON.stringify({
                command: 'change_light',
                target: args[1],
                offset: args[2]
            }))
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