(function() {
    var Transport = T.Transport = {};

    var socket;

    Transport._getPort = function() {
        var parsed = /\?.*port=([^&]*)/.exec(location.href);
        if (parsed && parsed.length === 2) {
            return parsed[1];
        }

        return "1400";
    };

    Transport._onMessage = function(message) {
        message = JSON.parse(message.data);

        var handlers = Transport._events[message.event];
        if (handlers && handlers.length) {
            for (var i = 0; i < handlers.length; i++) {
                handlers[i].call(null, message.data);
            }
        }
    };

    /**
     * Инициализируем сокет до сервера
     * @param {Function} onopen
     */
    Transport.initSocket = function(onopen) {
        var port = T.Transport._getPort();

        var pageUrl = /^https?:\/\/([^:/]*)[:/]/.exec(location.href)[1];
        var url = "ws://" + pageUrl + ":" + port + "/game";

        socket = T.Transport._socket = new WebSocket(url);

        socket.onopen = function() {
            console.log('SOCKET OPENED');
            if (_.isFunction(onopen)) {
                onopen();
            }
        };

        socket.onclose = function() {
            console.log('SOCKET CLOSED');
        };

        // можно использовать addEventListener
        socket.onmessage = Transport._onMessage;
    };

    /**
     * Посылает действие
     * @param {String} action Действие
     * @param {Object?} data Данные
     */
    Transport.sendAction = function(action, data) {
        if (!socket) {
            console.error('SOCKET NOT INITED! CAN\'T SEND ACTION');
        }

        var obj = {
            action: action
        };

        if (data) {
            obj.data = data;
        }

        console.log('SENDING ACTION', obj);

        T.Transport._socket.send(JSON.stringify(obj));
    };

    /**
     * Подписка на события
     * @param {String} event Название события
     * @param {Function} callback Обработчик
     */
    Transport.on = function(event, callback) {
        if (!event || !_.isFunction(callback)) {
            return;
        }

        Transport._events = Transport._events || [];

        if (!Transport._events[event]) {
            Transport._events[event] = [];
        }

        Transport._events[event].push(callback);

        return Transport;
    };
})();
