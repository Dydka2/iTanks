/**
 * Это пример компанента на реакте
 */

var React = require('react');

var ChatInputBox = React.createClass({
    displayName: 'ChatInputBox',
    handleSubmit: function(event) {
        event.preventDefault();
        var text = this.refs.text.getDOMNode().value.trim();
        this.props.onMessageSubmit({text: text});
    },
    render: function() {
        return (
            React.DOM.form({
                    className: 'b-send-message',
                    onSubmit: this.handleSubmit
                },
                React.DOM.input({type: "text", placeholder: "Type your message", ref: "text"}),
                React.DOM.input({type: "submit", value: "send"})
            )
        )
    }
});

module.exports = ChatInputBox;