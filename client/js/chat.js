(function() {
    /* globals $ */
    var Chat = T.Chat  = {};

    Chat.sendMessage = function(text) {
        T.Transport.sendAction('sendMessage', text);
        Chat.appendMessageToChat(null, text);
    };

    /**
     * Добавляем сообщение в DOM
     * @param {String|null} playerId Идентификатор игрока, либо я, если null
     * @param {Number} timestamp Время посылки сообщение
     * @param {String} text Такст сообщения
     */
    Chat.appendMessageToChat = function(playerId, timestamp, text) {

    };

    Chat.init = function(options) {
        options = options || {};

        Chat._node = options.node || document;
        Chat._$node = $(Chat._node);

        T.Transport.on('newMessages', function(data) {
            if (!data || !data.length) {
                return;
            }

            for (var i = 0; i < data.length; i++) {
                var message = data[i];
                Chat.appendMessageToChat(message.id, message.ts, message.message);
            }
        });
    };

})();


