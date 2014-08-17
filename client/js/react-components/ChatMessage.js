/**
 * Это пример компанента на реакте
 */

var React = require('react');

var ChatMessage = React.createClass({
    displayName: 'ChatMessage',
    render: function() {
        return (
            React.DOM.div({className: 'b-chat-message'},
                this.props.message.hours,
                ":",
                this.props.message.minutes,
                " ",
                this.props.message.name,
                " > ",
                this.props.message.text
            )
        )
    }
});

module.exports = ChatMessage;