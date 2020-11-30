let mqtt = require('mqtt');

let client = mqtt.connect('mqtt://localhost', {
    clientId: 'controller',
    protocolId: 'MQIsdp',
    protocolVersion: 3
});

client.on("connect", function (){
    client.subscribe('');
});

client.on("message", function (topic, message){

});