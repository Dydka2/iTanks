
var socket = new WebSocket("ws://localhost:1400/game");

socket.onopen = function() {
    console.log('SOCKET OPENED');
};

socket.onmessage = function(data) {
    console.log('MESSAGE:', data);
};

socket.onclose = function() {
    console.log('close');
};
