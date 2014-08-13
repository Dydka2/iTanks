/**
 * Это пример компанента на реакте
 */

var React = require('react');
var ChatMessage = require('./ChatMessage.js');

var ChatMessages = React.createClass({
    displayName: 'ChatMessages',
    render: function() {
        var ChatMessageNodes = this.props.data.map(function(message) {
            return (
                ChatMessage({
                    message: message
                })
            );
        });

        return (
            React.DOM.div({className: 'b-messages'},
                ChatMessageNodes
            )
        );
    }
});

module.exports = ChatMessages;