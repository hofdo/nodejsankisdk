let net = require('net');

let vehicles = [];

let client = net.connect({host: "192.168.1.160", port: 5000}, function (connection){
    client.write('SCAN');
    //client.write('SCAN');
});


client.on('data', function (data){
    console.log(data.toString());
    let res = data.toString().split(';');
    if (res[0] === 'SCAN'){
        vehicles.push({
            id: res[1],
            uuid: res[2]
        });
        client.write('CONNECT;' + res[1]);
    }
});


