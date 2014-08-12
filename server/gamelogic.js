
var EPSILON = 0.001;
var PLAYER_RESPAWN_INTERVAL = 3000;

var Map = require('./entities/map.js');
var Player = require('./entities/player');

/**
 * Класс описывающий игровую логику одного мира.
 * @constructor
 */
function GameLogic() {
    var that = this;

    this._map = new Map({
        mapId: 2
    });

    this._map.on('mapCellUpdate', function(data) {
        that.broadcast({
            event: 'mapCellUpdate',
            data: data
        });
    });

    this._players = [];
    this._tanks = [];
    this._bullets = [];

    this.updateInterval = setInterval(this.updateWorld.bind(this), 23);
    this.sendInterval = setInterval(this.sendUpdates.bind(this), 7);
}

GameLogic.prototype.destroy = function() {
    clearInterval(this.updateInterval);
    clearInterval(this.sendInterval);

    this._players.forEach(function(player) {
        player.socket.reject();
    });
};

/**
 * @param {WebSocket} socket
 */
GameLogic.prototype.onConnect = function(socket) {
    var that = this;

    var newPlayer = new Player({
        socket: socket
    });

    newPlayer.on('tankCreated', function(tank) {

        tank.on('shoot', function(bullet) {
            that._bullets.push(bullet);
        });

        tank.on('updateHealth', function(hp) {
            that.send(tank.player, {
                event: 'updateHealth',
                data: {
                    hp: hp
                }
            });
        });

        that._tanks.push(tank);
    });

    this._players.push(newPlayer);
};

/**
 * Обновление мира.
 */
GameLogic.prototype.updateWorld = function() {
    var i, j;
    var player;
    var axis;
    var delta;
    var bullet;

    var bulletsToDestroy = [];

    for (i = 0; i < this._bullets.length; ++i) {
        bullets[i].updatePosition();
    }

    for (i = 0; i < this._tanks.length; ++i) {

        var tank = this._tanks[i];

        if (!tank.isDead) {
            tank.updatePosition();

            if (this._map.checkCollision(tank)) {

                if (tank.direction === 0 || tank.direction === 2) {
                    axis = 1;
                } else {
                    axis = 0;
                }

                var roundFunc;
                var epsilon;

                if (tank.direction === 0 || tank.direction === 3) {
                    roundFunc = Math.ceil;
                    delta = tank.size[axis] / 2;
                    epsilon = EPSILON;
                } else {
                    roundFunc = Math.floor;
                    delta = -tank.size[axis] / 2;
                    epsilon = -EPSILON;
                }

                tank.position[axis] = roundFunc(tank.position[axis] + delta) - delta - epsilon;
            }

            for (j = 0; j <= this._tanks.length; ++p) {

                if (j === i) {
                    continue;
                }

                var otherTank = this._tanks[j];

                if (tank.checkCollision(otherTank)) {

                    if (tank.direction === 0 || tank.direction === 2) {
                        axis = 1;
                    } else {
                        axis = 0;
                    }

                    if (tank.direction === 0 || tank.direction === 3) {
                        delta = tank.size[axis] + EPSILON;
                    } else {
                        delta = -(tank.size[axis] + EPSILON);
                    }

                    tank.position[axis] = otherTank.position[axis] + delta;
                }
            }
        }

        for (j = 0; j <= this._bullets.length; ++j) {

            bullet = this._bullets[j];

            if (tank.checkCollision(bullet)) {

                if (tank.decreaseHp() === 0) {

                    this.setRespawnTankTimer(tank);

                    bullet.player.kills++;

                    this.broadcast({
                        event: 'playerDeath',
                        data: {
                            dead: tank.player.id,
                            killer: bullet.player.id
                        }
                    });

                } else {
                    this.broadcast({
                        event: 'hit',
                        data: {
                            position: bullet.position
                        }
                    });
                }

                bulletsToDestroy.push(bullet);
            }
        }
    }


    for (i = 0; i < this._bullets.length; ++i) {
        bullet = this._bullets[i];

        var cell;

        if (cell = this._map.checkCollision(bullet)) {
            bulletsToDestroy.push(bullet);

            this._map.damageCell(cell);

            this.broadcast({
                event: 'hit',
                data: {
                    position: bullet.position
                }
            });
        }
    }

    for (i = 0; i < bulletsToDestroy.length; ++i) {
        bullet = bulletsToDestroy[i];

        var index = BULLETS.indexOf(bullet);

        if (index !== -1) {
            bullet.explode();

            BULLETS = BULLETS.splice(index, 1);
        }
    }

};

/**
 * Посылает обновления игрокам.
 */
GameLogic.prototype.sendUpdates = function() {
    var tanks = [];
    var bullets = [];

    for (var i = 0; i < this._players.length; ++i) {
        var player = this._players[i];

        var tank = player.getTank();

        if (player.inGame) {
            if (!tank.isDead) {
                tanks.push({
                    id: player.id,
                    position: tank.position,
                    direction: tank.direction
                });
            }

            var playerBullets = player.getBullets();

            for (var j = 0; j < playerBullets.length; ++j) {
                var bullet = playerBullets[j];

                bullets.push({
                    position: bullet.position,
                    direction: bullet.direction
                });
            }
        }
    }

    this.broadcast({
        event: 'updateMapState',
        data: {
            tanks: tanks,
            bullets: bullets
        }
    });
};

/**
 * Отправить сообщение одному игроку.
 * @param {Player} player
 * @param {Object} data
 */
GameLogic.prototype.send = function(player, data) {
    var json;

    try {
        json = JSON.stringify(data);
    } catch(e) {
        console.log('BROADCAST stringify failed', e);
        return;
    }

    if (player.inGame) {
        player.socket.send(json);
    }
};

/**
 * Отправляет сообщение всем игрокам.
 * @param {Object} data
 */
GameLogic.prototype.broadcast = function(data) {
    this.broadcastExcept(null, data);
};

/**
 * Отправляет сообщение всем игрокам за исключением одного.
 * @param {Object} data
 * @param {Player} [except]
 */
GameLogic.prototype.broadcastExcept = function(except, data) {
    var json;

    try {
        json = JSON.stringify(data);
    } catch(e) {
        console.log('BROADCAST stringify failed', e);
        return;
    }

    for (var i = 0; i < this._players.length; ++i) {
        var player = this._players[i];

        if (player.inGame && player !== except) {
            player.socket.send(json);
        }
    }
};
