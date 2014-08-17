
var Tank = require('./tank');

var PLAYER_COLORS = ['blue', 'green', 'red', 'yellow', 'brown', 'orange', 'purple'];

/**
 * @param {Object} initParams
 * @param {WebSocket} initParams.socket
 * @constructor
 */
function Player(initParams) {
    this.id = require('../uniqid').generate();
    this.kills = 0;
    this.deaths = 0;

    this.inGame = false;
    this.tank = null;

    this.socket = initParams.socket;

    this._addEventListeners();
}

Player.prototype = Object.create(require('events').EventEmitter.prototype);

/**
 * @param {Object} loginParams
 * @param {string} loginParams.name
 */
Player.prototype.login = function(loginParams) {
    this.name = loginParams.name;
    this.inGame = true;
    this.color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

    this.createTank(loginParams.tankType);

    this.emit('tankCreated', this.tank);

    this.emit('joined');
};

Player.prototype.getTank = function() {
    return this.tank;
};

/**
 * Создает пользователю новый танк.
 * @param {number} tankType
 */
Player.prototype.createTank = function(tankType) {
    this.tank = new Tank({
        player: this,
        tankType: tankType
    });
};

//Player.prototype.destroyTank = function() {
//    this.tank
//};

/**
 * Устанавливает обработчики событий.
 * @private
 */
Player.prototype._addEventListeners = function() {
    var that = this;

    this.socket.on('message', function(message) {
        if (message.type !== 'utf8') {
            return;
        }

        var action;
        var data;

        try {
            var messageData = JSON.parse(message.utf8Data);

            action = messageData.action;
            data = messageData.data;
        } catch(e) {
            console.log('MESSAGE HAS BAD JSON', message.utf8Data);
            return;
        }

        switch (action) {
            case 'login':
                that.login(data);
                break;

            case 'updateState':
                if (that.tank) {
                    that.tank.direction = data.direction;
                    that.tank.inMove = data.inMove;
                }
                break;

            case 'shoot':
                that.tank.tryShoot();
                break;

            default:
                console.log('UNSUPPORTED INCOMMING MESSAGE', action, data);
        }
    });

    this.socket.on('close', function() {
        that.emit('leave');
    });
};

module.exports = Player;
