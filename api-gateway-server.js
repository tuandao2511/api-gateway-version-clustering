var rpc = require('json-rpc2');
var rpcBuilder = require('kurento-jsonrpc');

var socket = require('socket.io-client')('https://tuan-dao.herokuapp.com');
// var socket = require('socket.io-client')('http://localhost:3000');

var JsonRpcClient = rpcBuilder.clients.JsonRpcClient;
// var ws_uri = "ws://34.207.205.137:8888/kurento";
var ws_uri = [
    "ws://35.231.76.154:8888/kurento",
    "ws://34.207.205.137:8888/kurento"
];
// var ws_uri = [
//     "ws://localhost:8888/kurento"
// ];

var server = rpc.Server.$create({
    websocket: true
});
function connectCallback(){
    connected = true;
  }
  
function disconnectCallback(){
    connected = false;
}
  
function errorCallback(error) {
    console.error(error);
}


// function onEvent(_message) {
//     var candidate = _message.value.data.candidate;
//     var message = null;
//     var session = sessionStorage[sessionStorage.length-1];

//     var object = _message.value.object
//     console.log('on event ' +JSON.stringify(_message));
//     if(object === webRtcEndpoint[callerId]){
//         message = {id:'serverCandidate',userId: callerId,candidate : candidate};
//         console.log('?????????????????????????????????????????????????????');
//     }    
//     else {
//         message = {id:'serverCandidate',userId: calleeId,candidate: candidate};
//         console.log('::::::::::::::::::::::::::::::::::::::::::::::::::::;')
//     }    

     
//     socket.emit('candidate',JSON.stringify(message));
// }




var pipeline = {};

var webRtcEndpoint = {};
var queueCandidate = {};

var globalClient = null;
var count = 0;



server.expose('candidate',function(args,opt,callback){

    // var clusterId = 0
    // var l = sessionStorage.length-1;
    // var n = ws_uri.length;
    // if(sessionStorage.length > 0) clusterId = l%n;


    


    // var configuration = {
    //     sendCloseMessage : false,
    //     ws : {
    //       uri : ws_uri[clusterId],
    //       useSockJS: false,
    //       onconnected : connectCallback,
    //       ondisconnect : disconnectCallback,
    //       onreconnecting : disconnectCallback,
    //       onreconnected : connectCallback,
    //       onerror : errorCallback
    //     },
    //     rpc : {
    //       requestTimeout : 15000
    //     }
    // };
    
    // var jsonRpcClient = new JsonRpcClient(configuration);
    


    // setTimeout(function(){
    // console.log('client-candidate ' +args[0]);
    var message = JSON.parse(args[0]);
    //nho doi cai nay
    var id = message.userId;
    // console.log('object candidate '+message.candidate);
    // var session = sessionStorage[sessionStorage.length-1];
    if(webRtcEndpoint[count] && pipeline[count]){

        var params = {
            object : webRtcEndpoint[count][id],
            operation : 'addIceCandidate',
            operationParams:{
                candidate : message.candidate
            },
            sessionId :sessionId
        };
        globalClient.send('invoke',params,function(error,response){
            // console.log('add candidate ' +JSON.stringify(response));
            if(error) console.log(error);
        });
    }else{
        if(!queueCandidate[count]){
            queueCandidate[count] = {};
            queueCandidate[count][id] = [];
        }    
        // console.log('queue candidate ' +queueCandidate[id]);
        queueCandidate[count][id].push(message.candidate);
        console.log('queue candidate' +JSON.stringify(queueCandidate[session][id]));
        // console.log('??????????????????/');
    }

    callback(null);
    // },100);
});


server.expose('incommingCallResponse', function(args,opt,callback) {


    var callerSdpOffer = args[0];
    var calleeSdpOffer = args[1];
    var callerId = args[2];
    var calleeId = args[3];


    var l = count
    var n = ws_uri.length;
    var clusterId = l%n;
    console.log('cluster id ' + ws_uri[clusterId]);
   
    function onEvent(_message) {
        var candidate = _message.value.data.candidate;
        var message = null;
        
        var object = _message.value.object
        if(object === webRtcEndpoint[count][callerId]){
            message = {id:'serverCandidate',userId: callerId,candidate : candidate};
        }    
        else {
            message = {id:'serverCandidate',userId: calleeId,candidate: candidate};
        }    
    
        socket.emit('candidate',JSON.stringify(message));
    }
    
   
    
    
   

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
    
    var jsonRpcClient = new JsonRpcClient(configuration);
    globalClient = jsonRpcClient;



    
   
    // var caller = userRegister.getUserById(callerId);
    // var callee = userRegister.getUserById(calleeId);
   // create media pipeline 
   


    setTimeout(function(){
        var params = {
            type : 'MediaPipeline',
            constructorParams : {},
            properties : {}    
        };
        
        jsonRpcClient.send('create',params,function(error,_pipeline) {
            if(error) return callback(error);
        // console.log('Media pipeline ' + JSON.stringify(_pipeline));
        console.log('pipeline ');
        var sessionId = _pipeline.sessionId; 
        // sessionStorage.push(_pipeline.sessionId);
        pipeline[count] = _pipeline.value;


        //create caller webrtc endpoint
        var params = {
            type: "WebRtcEndpoint",
            constructorParams: {
                mediaPipeline : _pipeline.value
            },
            properties : {},    
            sessionId : sessionId
        };

        jsonRpcClient.send('create',params,function(error,_callerWebRtcEndpoint){
            if(error) return callback(error);
    
            // console.log('webRtcEndpoint ' + JSON.stringify(_callerWebRtcEndpoint));
            var callerWebRtcEndpoint= _callerWebRtcEndpoint.value;


              //add candidate
              if(queueCandidate[count][callerId]){
                // console.log('can candidate');
                while(queueCandidate[count][callerId].length){
                    var candidate = queueCandidate[count][callerId].shift();
                    // console.log('candidate shift ' +candidate);
                    var params = {
                        object : callerWebRtcEndpoint,
                        operation : 'addIceCandidate',
                        operationParams:{
                            candidate : candidate
                        },
                        sessionId :sessionId
                    };
                    jsonRpcClient.send('invoke',params,function(error,response){
                        // console.log('add candidate ' +JSON.stringify(response));
                    });
                }
            }

            //OnIceCandidate
            var params = {
                type : 'OnIceCandidate',
                object: callerWebRtcEndpoint,
                sessionId : sessionId
            };
            jsonRpcClient.send('subscribe', params,function(error,response){
                // console.log('caller is subsribed ', +response);
            });
            
            //create callee webrtc endpoint
            var params = {
                type: "WebRtcEndpoint",
                constructorParams: {
                    mediaPipeline : _pipeline.value
                },
                properties : {},    
                sessionId : sessionId
            };

            jsonRpcClient.send('create',params,function(error,_calleeWebRtcEndpoint){
                if(error) return callback(error);

                var calleeWebRtcEndpoint = _calleeWebRtcEndpoint.value;
                console.log('webRtcEndpoint callee' + JSON.stringify(_calleeWebRtcEndpoint));

                //add candidate
                if(queueCandidate[count][calleeId]){
                //   console.log('can candidate');
                  while(queueCandidate[count][calleeId].length){
                      var candidate = queueCandidate[count][calleeId].shift();
                    //   console.log('candidate shift ' +candidate);
                      var params = {
                          object : calleeWebRtcEndpoint,
                          operation : 'addIceCandidate',
                          operationParams:{
                              candidate : candidate
                          },
                          sessionId :sessionId
                      };
                      jsonRpcClient.send('invoke',params,function(error,response){
                        //   console.log('add candidate ?????????????? ' +JSON.stringify(response));
                      });
                  }
                }

                //OnIceCandidate
                var params = {
                    type : 'OnIceCandidate',
                    object: calleeWebRtcEndpoint,
                    sessionId : sessionId
                };
                jsonRpcClient.send('subscribe', params,function(error,response){
                    // console.log('callee is subscribed ' +response);
                });

                //assign webrtc endpoint
                webRtcEndpoint[count] = {};
                webRtcEndpoint[count][callerId] = callerWebRtcEndpoint;
                webRtcEndpoint[count][calleeId] = calleeWebRtcEndpoint;

                //connect caller to callee
                var params = {
                    object : callerWebRtcEndpoint,
                    operation : 'connect',
                    operationParams:{
                        sink : calleeWebRtcEndpoint
                    },
                    sessionId : sessionId
                };

                jsonRpcClient.send('invoke', params, function(error,response){
                    if(error) return callback(error);
                    console.log('connect ' +JSON.stringify(response));
                    
                    //connect callee to caller
                    var params = {
                        object : calleeWebRtcEndpoint,
                        operation : 'connect',
                        operationParams:{
                            sink : callerWebRtcEndpoint
                        },
                        sessionId :sessionId
                    };

                    jsonRpcClient.send('invoke', params, function(error,response){
                        if(error) return callback(error);
                        // console.log('connect ' +JSON.stringify(response));


                        //generate caller sdpAnswer

                        var params = {
                            object : callerWebRtcEndpoint,
                            operation : 'processOffer',
                            operationParams:{
                                offer :callerSdpOffer
                            },
                            sessionId :sessionId
                        };

                        jsonRpcClient.send('invoke', params, function(error,_callerSdpAnswer){
                            if(error) return callback(error);

                            var callerSdpAnswer =_callerSdpAnswer.value;
                            // console.log('caller sdp answer ' + JSON.stringify(callerSdpAnswer));

                            //generate callee sdpAnswer

                            var params = {
                                object : calleeWebRtcEndpoint,
                                operation : 'processOffer',
                                operationParams:{
                                    offer : calleeSdpOffer
                                },
                                sessionId :sessionId
                            };

                            jsonRpcClient.send('invoke', params, function(error, _calleeSdpAnswer){
                                if(error) return callback(error);

                                var calleeSdpAnswer = _calleeSdpAnswer.value;
                                // console.log('callee sdp answer ' + JSON.stringify(calleeSdpAnswer));


                                var obj = {
                                    callerSdpAnswer :callerSdpAnswer,
                                    calleeSdpAnswer : calleeSdpAnswer
                                }

                                // console.log('sdp answer ' + JSON.stringify(obj));
                                callback(null,obj);
                            });

                            //callee gathers candidates

                            var params = {
                                object : calleeWebRtcEndpoint,
                                operation : 'gatherCandidates',
                                operationParams:{
                                    offer : calleeSdpOffer
                                },
                                sessionId :sessionId
                            };

                            jsonRpcClient.send('invoke',params,function(error,response){
                                if(error) console.log('gather candidate error callee ' +error);
                                // console.log('gather candidates response callee '+JSON.stringify(response));
                            });

                        });

                        //caller gathers candidates

                        var params = {
                            object : callerWebRtcEndpoint,
                            operation : 'gatherCandidates',
                            operationParams:{
                                offer : callerSdpOffer
                            },
                            sessionId :sessionId
                        };

                        jsonRpcClient.send('invoke',params,function(error,response){
                            if(error) console.log('gathercandidate error caller ' +error);
                            // console.log('gather candidates response caller '+JSON.stringify(response));
                        });
                       


                    });


                });


            });
        

        });

    });
    },1000);

    count++;
});


server.enableAuth(function(user, password){
    return user === 'myuser' && password === 'secret123';
});
  
  /* HTTP/Websocket server on port 8088 */
server.listen(8088, process.env.HOST);
// server.listen(8088, 'localhost');

