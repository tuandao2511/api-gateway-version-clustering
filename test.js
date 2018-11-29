const jayson = require('jayson');
const rpcBuilder = require('kurento-jsonrpc');


// const socket = require('socket.io-client')('http://localhost:8443');
const ws_uri = "ws://35.237.119.74:8888/kurento";

var JsonRpcClient = rpcBuilder.clients.JsonRpcClient;


for(i=0; i<2; i++){

    function connectCallback(){
        connected = true;
        console.log('successfully connected');
        var params = {
            type : 'MediaPipeline',
            constructorParams : {},
            properties : {}    
        };
        jsonRpcClient.send('create',params,function(err, _pipeline) {
        });
    }
    
    function disconnectCallback(){
        connected = false;
        console.log(' disconnect')

    }
    
    function errorCallback(error) {
        console.error(error);
        // var jsonRpcClient = new JsonRpcClient(configuration);
        // mapJsonRpcClient.set(clusterId,jsonRpcClient);
        // console.log('cluster id ' +clusterId);
        // callback(null,clusterId);
        callback(error);
    }

    function onEvent(_message) {
    
        socket.emit('candidate',JSON.stringify(_message));
    }

    var configuration = {
        hearbeat: 5000,
        sendCloseMessage : true,
        ws : {
        uri : ws_uri,
        useSockJS: false,
        onconnected : connectCallback,
        ondisconnect : disconnectCallback,
        onreconnecting : disconnectCallback,
        onreconnected : connectCallback,
        onerror : errorCallback
        },
        rpc : {
        requestTimeout : 15000,
        onEvent : onEvent
        }
    };
    var jsonRpcClient = new JsonRpcClient(configuration);
}