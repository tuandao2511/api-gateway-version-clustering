const jayson = require('jayson');
const rpcBuilder = require('kurento-jsonrpc');
require('dotenv').load();


// const socket = require('socket.io-client')('http://localhost:3000');
const socket = require('socket.io-client')(process.env.HEROKU_DOMAIN);


var JsonRpcClient = rpcBuilder.clients.JsonRpcClient;


// const ws_uri = ["ws://localhost:8888/kurento"];

function connectCallback(){
    connected = true;
}
  
function disconnectCallback(){
    connected = false;
}
  
function errorCallback(error) {
    console.error(error);
}

function onEvent(_message) {
    // var candidate = _message.value.data.candidate;
    // var message = null;
    
    // var object = _message.value.object
    // if(object === webRtcEndpoint[count][callerId]){
    //     message = {id:'serverCandidate',userId: callerId,candidate : candidate};
    // }    
    // else {
    //     message = {id:'serverCandidate',userId: calleeId,candidate: candidate};
    // }    
        socket.emit('candidate',JSON.stringify(_message));
    // socket.emit('candidate',JSON.stringify(_message));
}

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

var jsonRpcClient = null;


let server = jayson.server({


    getKurentoClient : function(params,callback) {

        const ws_uri = process.env.KMS_URIS.split(' ');

        let toHash = max =>{
            return Math.floor(Math.random() * Math.floor(max));
        }

        const clusterId = toHash(ws_uri.length);
        var configuration = {
            sendCloseMessage : false,
            ws : {
              uri : ws_uri[clusterId],
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
        
        jsonRpcClient = new JsonRpcClient(configuration);
        callback(null,'clustering id= ' +clusterId);   
    },
    createPipeline : function(params,callback){ 
        jsonRpcClient.send('create',params,function(err, _pipeline) {
            if(err) return callback(err);
            callback(null,_pipeline);
        });
    },

    createWebRtcEndpoint : function(params,callback) {
        jsonRpcClient.send('create',params,function(err, _webRtcEndpoint) {
            if(err) return callback(err);
            callback(null,_webRtcEndpoint);
        });
    },

    addCandidate : function(params,callback){
        jsonRpcClient.send('invoke',params,function(err, response){
            if(err) return callback(err);
            callback(null,response);
        });
    },

    onIceCandidate : function(params,callback){
        jsonRpcClient.send('subscribe',params,function (err, response){
            if(err) return callback(err);
            callback(null,response);
        });
    },

    connect : function(params,callback){
        jsonRpcClient.send('invoke',params,function(err, response){
            if(err) return callback(err);
            callback(null,response);
        });
    },

    processOffer : function(params,callback){
        jsonRpcClient.send('invoke',params,function(err, sdpAnswer){
            if(err) callback(err);
            callback(null,sdpAnswer);
        });
    },


    gatherCandidates : function(params,callback){
            jsonRpcClient.send('invoke',params,function(err, response){
                if(err) return callback(err);
                callback(null,response);
            });

    }
});

// server.http().listen(8088,process.env.HOST);
server.http().listen(8088,process.env.HOST);