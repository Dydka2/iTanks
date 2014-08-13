var React = require('react');
var ChatBox = require('./react-components/ChatBox.js');
var container = document.getElementById('chat');

var handleMessageSubmit = function(text) {
    T.Chat.sendMessage(text);
};

T.Chat.generateNode = function(data) {
    React.renderComponent(
        ChatBox({
            data: data,
            onMessageSubmit: handleMessageSubmit
        }),
        container
    );
};