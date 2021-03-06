const jayson = require('jayson');
const rpcBuilder = require('kurento-jsonrpc');
require('dotenv').load();


const socket = require('socket.io-client')('http://localhost:8443');
// const socket = require('socket.io-client')(process.env.HEROKU_DOMAIN);


var JsonRpcClient = rpcBuilder.clients.JsonRpcClient;


// const ws_uri = ["ws://localhost:8888/kurento"];



// var configuration = {
//     sendCloseMessage : false,
//     ws : {
//       uri : ws_uri[0],
//       useSockJS: false,
//       onconnected : connectCallback,
//       ondisconnect : disconnectCallback,
//       onreconnecting : disconnectCallback,
//       onreconnected : connectCallback,
//       onerror : errorCallback
//     },
//     rpc : {
//       requestTimeout : 15000,
//       onEvent : onEvent
//     }
// };
var mapJsonRpcClient = new Map();
var count = 0;


const ws_uri = process.env.KMS_URIS.split(' ');

// let toHash = max =>{
//     return Math.floor(Math.random() * Math.floor(max));
// }

function connectCallback(){
    connected = true;
    console.log('successfully connected');
    count++;
    if(count == ws_uri.length){
        console.log('number of connection ' + count);
    }    
}
  
function disconnectCallback(){
    connected = false;
    console.log(' disconnect')

}
  
function errorCallback(error) {
    console.error('error: '  +error);

    socket.emit('error',JSON.stringify(error));
}

function onEvent(_message) {

    socket.emit('candidate',JSON.stringify(_message));
}

for(i=0 ; i<ws_uri.length; i++){
    var configuration = {
        hearbeat: 5000,
        sendCloseMessage : true,
        ws : {
        uri : ws_uri[i],
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
    mapJsonRpcClient.set(i,jsonRpcClient);
}

let server = jayson.server({


    establishToKMS :function(params,callback) {
        const ws_uri = process.env.KMS_URIS.split(' ');

        // let toHash = max =>{
        //     return Math.floor(Math.random() * Math.floor(max));
        // }

        function connectCallback(){
            connected = true;
            console.log('successfully connected');
            count++;
            if(count == ws_uri.length +1){
                console.log('number of connection ' + count);
                callback(null,count+1);
            }    
        }
          
        function disconnectCallback(){
            connected = false;
            console.log(' disconnect')

        }
          
        // function errorCallback(error) {
        //     console.error(error);
        //     // var jsonRpcClient = new JsonRpcClient(configuration);
        //     // mapJsonRpcClient.set(clusterId,jsonRpcClient);
        //     // console.log('cluster id ' +clusterId);
        //     // callback(null,clusterId);
        //     callback(error);
        // }
        
        function onEvent(_message) {
    
            socket.emit('candidate',JSON.stringify(_message));
        }

        for(i=0 ; i<ws_uri.length; i++){
            var configuration = {
                hearbeat: 5000,
                sendCloseMessage : true,
                ws : {
                uri : ws_uri[i],
                useSockJS: false,
                onconnected : connectCallback,
                ondisconnect : disconnectCallback,
                onreconnecting : disconnectCallback,
                onreconnected : connectCallback,
                //   onerror : errorCallback
                },
                rpc : {
                requestTimeout : 15000,
                onEvent : onEvent
                }
            };
            var jsonRpcClient = new JsonRpcClient(configuration);
            mapJsonRpcClient.set(i,jsonRpcClient);
        }
    },

    getKurentoClient : function(params,callback){
        const ws_uri = process.env.KMS_URIS.split(' ');
        let toHash = max =>{
            return Math.floor(Math.random() * Math.floor(max));
        }
        var clusterId = toHash(ws_uri.length);

        callback(null,clusterId);
    }, 
    createPipeline : function(args,callback){
        var clusterId = args[0];
        console.log('createPipeline' +clusterId);
        var params = args[1];
        var jsonRpcClient = mapJsonRpcClient.get(clusterId); 
        jsonRpcClient.send('create',params,function(err, _pipeline) {
            if(err) return callback(err);
            callback(null,_pipeline);
        });
    },

    createWebRtcEndpoint : function(args,callback) {
        var clusterId = args[0];
        console.log('createWebRtcEndpoint ' +clusterId);

        var params = args[1];
        var jsonRpcClient = mapJsonRpcClient.get(clusterId); 
        jsonRpcClient.send('create',params,function(err, _webRtcEndpoint) {
            if(err) return callback(err);
            callback(null,_webRtcEndpoint);
        });
    },

    addCandidate : function(args,callback){
        var clusterId = args[0];
        console.log('addCandidate ' +clusterId);
        var params = args[1];
        var jsonRpcClient = mapJsonRpcClient.get(clusterId); 
        jsonRpcClient.send('invoke',params,function(err, response){
            if(err) return callback(err);
            callback(null,response);
        });
    },

    onIceCandidate : function(args,callback){
        var clusterId = args[0];
        console.log('onIceCandidate ' +clusterId);
        var params = args[1];
        var jsonRpcClient = mapJsonRpcClient.get(clusterId); 
        jsonRpcClient.send('subscribe',params,function (err, response){
            if(err) return callback(err);
            callback(null,response);
        });
    },

    connect : function(args,callback){
        var clusterId = args[0];
        console.log('connect ' +clusterId);
        var params = args[1];
        var jsonRpcClient = mapJsonRpcClient.get(clusterId); 
        jsonRpcClient.send('invoke',params,function(err, response){
            if(err) return callback(err);
            callback(null,response);
        });
    },

    processOffer : function(args,callback){
        var clusterId = args[0];
        console.log('processOffer ' +clusterId);
        var params = args[1];
        var jsonRpcClient = mapJsonRpcClient.get(clusterId); 
        jsonRpcClient.send('invoke',params,function(err, sdpAnswer){
            if(err) callback(err);
            callback(null,sdpAnswer);
        });
    },


    gatherCandidates : function(args,callback){
        var clusterId = args[0];
        console.log('gatherCandidates ' +clusterId);

        var params = args[1];
        var jsonRpcClient = mapJsonRpcClient.get(clusterId); 
        jsonRpcClient.send('invoke',params,function(err, response){
            if(err) return callback(err);
            callback(null,response);
        });
    },

    release: function(args, callback) {
        var clusterId = args[0];
        console.log('release ' +clusterId);
        var params = args[1];
        var jsonRpcClient = mapJsonRpcClient.get(clusterId);
        jsonRpcClient.send('release',params,function(err, response){
            if(err) return callback(err);
            callback(null,response);
        });
    }
});

// server.http().listen(8088,process.env.HOST);
server.http().listen(8088,process.env.HOST);