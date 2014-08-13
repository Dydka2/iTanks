(function() {
    if (window && !window.T) {
        window.T = {};
    }

    var Transport = T.Transport = {};

    var socket;
    var socketInitDeferred = new vow.Deferred();

    Transport._getPort = function() {
        var parsed = /\?.*port=([^&]*)/.exec(location.href);
        if (parsed && parsed.length === 2) {
            return parsed[1];
        }

        return "1337";
    };

    Transport._onMessage = function(message) {
        message = JSON.parse(message.data);
        // сохраняем лаг между клиентом и сервером
        if (message.data.now) {
            T.Time.updateTimeDelta(message.data.now);
        }

        Transport.trigger(message.event, [message.data]);
    };

    /**
     * Инициализируем сокет до сервера
     */
    Transport.initSocket = function() {
        var port = T.Transport._getPort();

        var pageUrl = /^https?:\/\/([^:/]*)[:/]/.exec(location.href)[1];
        var url = "ws://" + pageUrl + ":" + port + "/game";

        socket = T.Transport._socket = new WebSocket(url);

        socket.onopen = function() {
            console.log('SOCKET OPENED');
            socketInitDeferred.resolve(Transport);
        };

        socket.onclose = function() {
            console.log('SOCKET CLOSED');
        };

        // можно использовать addEventListener
        socket.onmessage = Transport._onMessage;
    };

    Transport.whenTransportReady = function() {
        return socketInitDeferred.promise();
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

    _.extend(Transport, EventEmitter.prototype);

    T.Events.on('app-init', function() {
        Transport.initSocket();

        // FIXME: разнести по компонентам
        T.Transport
            .on('details', function(data) {
                T.playSound('start');
                T.hideLoader();
                T.updateMap(data.map);
                T.renderHP(data.hp);
            })
            .on('playerList', T.updatePlayerList)
            .on('updateMapState', T.render)
            .on('playerJoined', T.addPlayer)
            .on('playerLeft', T.removePlayer)
            .on('playerDeath', T.killPlayer)
            .on('hit', T.hitPlayer)
            .on('updateHealth', T.updateHP)
            .on('terrainDamage', T.terrainDamage);
    })
})();
