/**
 * Это пример компанента на реакте
 */

var React = require('react');
var ChatMessages = require('./ChatMessages.js');
var ChatInputBox = require('./ChatInputBox.js');

var ChatBox = React.createClass({
    displayName: 'ChatBox',
    render: function() {
        return (
            React.DOM.div({className: 'b-chat-message-box'},
                ChatMessages({
                    data: this.props.data
                }),
                ChatInputBox({
                    onMessageSubmit: this.props.onMessageSubmit
                })
            )
        )
    }
});

module.exports = ChatBox;