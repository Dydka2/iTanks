
var EPSILON = 0.001;
var PLAYER_RESPAWN_INTERVAL = 3000;
var PLAYER_RESPAWN_TRY_INTERVAL = 100;

var Map = require('./entities/map');
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

    this._map.on('updateCell', function(data) {
        that.broadcast({
            event: 'updateCell',
            data: data
        });
    });

    this._players = [];
    this._tanks = [];
    this._bullets = [];

    this.updateInterval = setInterval(this.updateWorld.bind(this), 23);
    this.sendInterval = setInterval(this.sendUpdates.bind(this), 70);
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

            bullet.on('explode', function() {
               that.broadcast({
                   event: 'hit',
                   data: {
                       position: bullet.position
                   }
               });
            });
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

    newPlayer.on('joined', function() {
        that.send(newPlayer, {
            event: 'details',
            data: {
                map: that._map.map,
                baseHp: newPlayer.tank.baseHp,
                now: new Date().getTime()
            }
        });

        that.send(newPlayer, {
            event: 'playerList',
            data: that._players.filter(function(pl) { return pl.inGame; }).map(function(player) {
                return {
                    id: player.id,
                    name: player.name,
                    color: player.color,
                    kills: player.kills,
                    deaths: player.deaths
                };
            })
        });

        that.broadcastExcept(newPlayer, {
            event: 'playerJoined',
            data: {
                id: newPlayer.id,
                name: newPlayer.name,
                color: newPlayer.color,
                kills: newPlayer.kills,
                deaths: newPlayer.deaths
            }
        });

        that.setRespawnTankTimer(newPlayer.tank, 0);

    });

    newPlayer.on('leave', function() {
        var index = that._players.indexOf(newPlayer);
        if (index !== -1) {
            that._players.splice(index, 1);
        }

        that.broadcast({
            event: 'playerLeft',
            data: {
                id: newPlayer.id
            }
        });
    });

    this._players.push(newPlayer);
};

/**
 * Устанавливает время возрождения танка.
 * @param {Tank} tank
 * @param {number} time
 */
GameLogic.prototype.setRespawnTankTimer = function(tank, time) {
    var that = this;

    tank.respawnTimeout = setTimeout(function() {
        tank.position = that._map.getRandomRespawn();

        for (var i = 0; i < that._tanks.length; ++i) {
            var otherTank = that._tanks[i];

            if (!otherTank.isDead) {
                if (tank.checkCollision(otherTank)) {
                    that.setRespawnTankTimer(tank, PLAYER_RESPAWN_TRY_INTERVAL);
                    return;
                }
            }
        }

        tank.isDead = false;
    }, time);
};

/**
 * Обновление мира.
 */
GameLogic.prototype.updateWorld = function() {
    var i, j;
    var axis;
    var delta;
    var bullet;

    var bulletsToDestroy = [];

    for (i = 0; i < this._bullets.length; ++i) {
        this._bullets[i].updatePosition();
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

                if (tank.direction === 1 || tank.direction === 2) {
                    roundFunc = Math.floor;
                    delta = tank.size[axis] / 2;
                    epsilon = EPSILON;
                } else {
                    roundFunc = Math.ceil;
                    delta = -tank.size[axis] / 2;
                    epsilon = -EPSILON;
                }

                tank.position[axis] = roundFunc(tank.position[axis] + delta) - delta - epsilon;
            }

            for (j = 0; j < this._tanks.length; ++j) {

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

        for (j = 0; j < this._bullets.length; ++j) {

            bullet = this._bullets[j];

            if (tank.checkCollision(bullet)) {

                if (tank.decreaseHp() === 0) {

                    this.setRespawnTankTimer(tank, PLAYER_RESPAWN_INTERVAL);

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

        var cell = this._map.checkCollision(bullet);

        if (cell) {
            bulletsToDestroy.push(bullet);

            if (Array.isArray(cell)) {
                var damageCells = [cell];

                if (bullet.direction === 0 || bullet.direction === 2) {
                    damageCells.push([cell[0] - 1, cell[1]]);
                    damageCells.push([cell[0] + 1, cell[1]]);
                } else {
                    damageCells.push([cell[0], cell[1] - 1]);
                    damageCells.push([cell[0], cell[1] + 1]);
                }

                for (var k = 0; k < damageCells.length; ++k) {
                    this._map.damageCell(damageCells[k]);
                }
            }
        }
    }

    for (i = 0; i < bulletsToDestroy.length; ++i) {
        bullet = bulletsToDestroy[i];

        var index = this._bullets.indexOf(bullet);

        if (index !== -1) {
            bullet.explode();

            this._bullets.splice(index, 1);
        }
    }

};

/**
 * Посылает обновления игрокам.
 */
GameLogic.prototype.sendUpdates = function() {
    var i;
    var tanks = [];
    var bullets = [];

    for (i = 0; i < this._players.length; ++i) {
        var player = this._players[i];
        var tank = player.getTank();

        if (tank && !tank.isDead) {
            tanks.push({
                id: player.id,
                position: tank.position,
                direction: tank.direction
            });
        }
    }

    for (i = 0; i < this._bullets.length; ++i) {
        var bullet = this._bullets[i];

        bullets.push({
            position: bullet.position,
            direction: bullet.direction
        });
    }

    this.broadcast({
        event: 'updateGameEntities',
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

    player.socket.send(json);
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

module.exports = GameLogic;
