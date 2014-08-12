
var Player = require('./entities/player');

function GameLogic() {

    this._map = require('./entities/map.js').loadMap(1);
    this._players = [];
}

/**
 * @param {WebSocket} socket
 */
GameLogic.prototype.onConnect = function(socket) {
    this._players.push(new Player({
        socket: socket
    }));
};

var EPSILON = 0.001;

/**
 * Обновление мира.
 */
GameLogic.prototype.updateWorld = function() {
    var i;
    var player;
    var axis;
    var delta;
    var p;
    var bullets;

    var bulletsToDestroy = [];

    for (i = 0; i < this._players.length; ++i) {
        player = this._players[i];

        bullets = player.getTank().getBullets();

        for (var j = 0; j < bullets.length; ++j) {
            var bullet = bullets[j];

            bullet.updatePosition();
        }
    }

    for (i = 0; i < this._players.length; ++i) {
        player = this._players[i];

        var tank = player.getTank();

        if (player.inGame && !tank.isDead) {
            tank.updatePosition();

            if (this._map.checkCollision(tank)) {
                // FIXME: Сделать нормальное выравнивание.
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

            for (p = 0; p <= this._players.length; ++p) {
                if (p !== i) {
                    continue;
                }

                var otherPlayer = this._players[p];

                if (player.checkCollision(otherPlayer)) {

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

                    player.position[axis] = otherPlayer.position[axis] + delta;
                }
            }
        }

        for (p = 0; p <= this._players.length; ++p) {
            if (p !== i) {
                continue;
            }

            bullets = this._players.getBullets();

            for (b = 0; b <= bullets.length; ++b) {

                bullet = bullets[b];

                if (player.checkCollision(bullet)) {
                    player.decreaseHp();

                    bulletsToDestroy.push(bullet);
                }
            }
        }
    }

    for (p = 0; p <= this._players.length; ++p) {
        bullets = this._players.getBullets();

        for (i = 0; i < bullets.length; ++i) {

            bullet = bullets[i];

            if (this._map.checkCollision(bullet)) {
                bullet.destroy();

                bulletsToDestroy.push(bullet);
            }
        }
    }

    for (i = 0; i < bulletsToDestroy.length; ++i) {
        bullet = bulletsToDestroy[i];

        var index = BULLETS.indexOf(bullet);

        if (index !== -1) {
            BULLETS = BULLETS.splice(index, 1);
        }
    }

};

GameLogic.prototype.sendUpdates = function() {
    var players = PLAYERS.filter(jointFilter).filter(notDead).map(function(player) {
        return {
            id: player.id,
            position: player.position,
            direction: player.direction
        };
    });

    var bullets = BULLETS.map(function(bullet) {
        return {
            position: bullet.position,
            direction: bullet.direction
        };
    });

    var data = {
        event: 'updateMapState',
        data: {
            players: players,
            bullets: bullets
        }
    };

    broadcast(data);
};


/* ---------- OLD ---------- */

function checkTerrainCollision(bullet) {
    for (var y = 0; y < MAP_DIMENSION ; ++y) {
        for (var x = 0; x < MAP_DIMENSION ; ++x) {

            var cell = MAP[y][x];

            if (cell === MAP_CELL_TYPE.HARD || (Array.isArray(cell) && cell[1] > 0)) {

                if (checkCollision(bullet, {
                    position: [x + 0.5, y + 0.5],
                    width: 1
                })) {

                    var cellsToDamage = [[x, y]];

                    if (bullet.direction === 0 || bullet.direction === 2) {
                        cellsToDamage.push([x - 1, y]);
                        cellsToDamage.push([x + 1, y]);
                    } else {
                        cellsToDamage.push([x, y - 1]);
                        cellsToDamage.push([x, y + 1]);
                    }

                    var toBroadcast = [];

                    for (var c = 0; c < cellsToDamage.length; ++c) {

                        var cellPos = cellsToDamage[c];
                        var x_ = cellPos[0];
                        var y_ = cellPos[1];

                        if (x_ < 0 || x_ >= MAP_DIMENSION ||
                            y_ < 0 || y_ >= MAP_DIMENSION) {
                            continue;
                        }

                        var cell_ = MAP[y_][x_];

                        if (cell_ === MAP_CELL_TYPE.EMPTY ||
                            (Array.isArray(cell_) && cell_[1] === 0)) {
                            break;
                        }

                        if (cell_ !== MAP_CELL_TYPE.HARD) {
                            cell_[1]--;

                            toBroadcast.push({
                                positions: cellPos,
                                cell: cell_
                            });
                        }

                        broadcast({
                            event: 'hit',
                            data: {
                                position: bullet.position
                            }
                        });
                    }

                    broadcast({
                        event: 'terrainDamage',
                        data: toBroadcast
                    });

                    return;
                }
            }
        }
    }

    return true;
}

function checkBulletCollision(player) {
    for (var i = 0; i < BULLETS.length; ++i) {
        var bullet = BULLETS[i];

        if (bullet.by !== player.id) {
            if (checkCollision(player, bullet)) {
                return bullet
            }
        }
    }
}

function setRandomRespawnPosition(player) {
    player.position = _.clone(RESPAWNS_POSITIONS[Math.floor(Math.random() * RESPAWNS_POSITIONS.length)]);
}

setInterval(function() {
    var timeBack = new Date().getTime() - 10000;
    BULLETS = BULLETS.filter(function(bullet) {
        return bullet.ts > timeBack;
    });
}, 2000);

/**
 * Отправить сообщение одному пользователю.
 * @param {PLAYER} player
 * @param {Object} data
 */
function send(player, data) {
    var json;

    try {
        json = JSON.stringify(data);
    } catch(e) {
        console.log('BROADCAST stringify failed', e);
        return;
    }

    if (player.socket) {
        player.socket.send(json);
    }
}

/**
 * Отправляет сообщение всем игрокам.
 * @param data
 */
function broadcast(data) {
    broadcastExcept(null, data);
}

/**
 * Отправляет сообщение всем игрокам за исключением одного.
 * @param {Object} data
 * @param {Player} [except]
 */
function broadcastExcept(except, data) {
    var json;

    try {
        json = JSON.stringify(data);
    } catch(e) {
        console.log('BROADCAST stringify failed', e);
        return;
    }

    PLAYERS.forEach(function(player) {
        if (player.joint && player !== except) {
            if (player.socket) {
                player.socket.send(json);
            }
        }
    });
}
