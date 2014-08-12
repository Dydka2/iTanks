(function() {
    /* globals $ */
    var Chat = T.Chat  = {};

    Chat.sendMessage = function(text) {
        T.Transport.sendAction('sendMessage', text);
        Chat.appendMessageToChat(null, (new Date).getTime(), text);
    };

    /**
     * Добавляем сообщение в DOM
     * @param {String|null} playerId Идентификатор игрока, либо я, если null
     * @param {Number} timestamp Время посылки сообщение
     * @param {String} text Такст сообщения
     */
    Chat.appendMessageToChat = function(playerId, timestamp, text) {
        var name = this.getNameById(playerId);
        var date = new Date(timestamp);
        var hours = date.getHours();
        var minutes = date.getMinutes();

        var node = this.generateNode(hours, minutes, name, text);
        this._$node.append(node);
    };

    Chat.getNameById = function(playerId) {
        return playerId ? _.find(T.players, {id : playerId}).name : "Me";
    };

    Chat.generateNode = function(hours, minutes, name, text) {
        var node = $('<div class="b-message">' + hours + ":"
                     + minutes + " "
                     + name + " > "
                     + text + "</div>");

        return node;
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


