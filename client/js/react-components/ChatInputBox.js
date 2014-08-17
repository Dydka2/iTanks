/**
 * Это форма для создания новых сообщений
 * Она состоит из поля и кнопки
 * [___________] [send]
 */

var React = require('react');

var ChatInputBox = React.createClass({
    displayName: 'ChatInputBox',

    /**
     * Обработчик события сабмит формы
     */
    handleSubmit: function(event) {
        event.preventDefault();

        var messageInput = this.refs.text.getDOMNode();
        var text = messageInput.value.trim();

        if (text) {
            this.props.onMessageSubmit({text: text});
            messageInput.value = "";
        } else {
            messageInput.className = "b-chat-message-input b-chat-message-input-error";
            setTimeout(function() {
                messageInput.className = "b-chat-message-input";
            }, 200)
        }
    },

    render: function() {
        return (
            /**
             * Форма
             */
            React.DOM.form({
                    className: 'b-chat-form',
                    onSubmit: this.handleSubmit
                },
                /**
                 * Поле ввода
                 */
                React.DOM.input({
                    className: "b-chat-message-input",
                    type: "text",
                    placeholder: "Type your message",
                    ref: "text"
                }),
                /**
                 * Кнопка ввод сообщения
                 */
                React.DOM.input({
                    className: "b-chat-message-send",
                    type: "submit",
                    value: "send"
                })
            )
        )
    }
});

module.exports = ChatInputBox;
