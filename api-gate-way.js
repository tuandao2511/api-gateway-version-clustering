const jayson = require('jayson');
const rpcBuilder = require('kurento-jsonrpc');


const socket = require('socket.io-client')('http://localhost:3000');


var JsonRpcClient = rpcBuilder.clients.JsonRpcClient;


// const ws_uri = "ws://localhost:8888/kurento";
const ws_uri = "ws://35.207.205.137:8888/kurento";


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

let configuration = {
    sendCloseMessage : false,
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

let jsonRpcClient = new JsonRpcClient(configuration);


let server = jayson.server({

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

server.http().listen(8088,process.env.HOST);