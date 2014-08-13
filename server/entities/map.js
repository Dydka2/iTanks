
var _ = require('lodash');

/**
 * Создает инстанс определенной карты.
 * @param {Object} initParams
 * @param {number} initParams.mapNumber
 * @constructor
 */
function Map(initParams) {
    this._loadMap(initParams.mapId);
}

Map.CELL_TYPE = {
    EMPTY: 0,
    NORMAL: 1,
    HARD: 2,
    RESPAWN: 99
};

_.extend(Map.prototype, require('events').EventEmitter);

/**
 * Загружает выбранную карту.
 * @param {number} mapNumber
 * @private
 */
Map.prototype._loadMap = function(mapNumber) {

    var map = this.map = require('../maps/map_' + mapNumber + '.js');
    this.respawns = [];

    this.rowsCount = map.length;
    this.colsCount = map[0].length;

    for (var y = 0; y < this.rowsCount; ++y) {
        for (var x = 0; y < this.colsCount; ++x) {
            var cell = map[y][x];

            if (cell === Map.CELL_TYPE.NORMAL) {
                map[y][x] = [cell, 2];

            } else if (cell === Map.CELL_TYPE.RESPAWN) {
                map[y][x] = [Map.CELL_TYPE.EMPTY];

                this.respawns.push([x + 1, y + 1]);
            } else {
                map[y][x] = [cell];
            }
        }
    }
};

/**
 * Просчитать коллизию с поверхростью.
 * @param object
 * @returns {boolean}
 */
Map.prototype.checkCollision = function(object) {
    var width;
    var height;

    if (object.direction === 0 || object.direction === 2) {
        width = object.size[0];
        height = object.size[1];
    } else {
        width = object.size[1];
        height = object.size[0];
    }

    var x = object.position[0];
    var y = object.position[1];

    var col1 = Math.floor(x - width / 2);
    var row1 = Math.floor(y - height / 2);

    var col2 = Math.ceil(x + width / 2);
    var row2 = Math.ceil(y + height / 2);

    if (col1 < 0 || col2 >= COLS_COUNT || row1 < 0 || row2 >= ROWS_COUNT) {
        return true;
    }

    for (var col = col1; col <= col2; ++col) {
        for (var row = row1; row <= row2; ++row) {

            var cell = map[row][col];

            if (!(cell[0] === CELL_TYPE.EMPTY || cell[1] === 0)) {
                return true;
            }
        }
    }

    this.respawnsCount = this.respawns.length;
};

/**
 * Повредить (или уничтожить) ячейку карты.
 * @param {Array} cell координаты ячейки
 */
Map.prototype.damageCell = function(cell) {
    var cellInfo = map[cell[1]][cell[0]];

    if (cellInfo[0] === CELL_TYPE.NORMAL && cellInfo[1] !== 0) {
        cellInfo[1]--;

        this.emit('mapCellUpdate', {
            positions: cell,
            cell: cellInfo
        });
    }
};

/**
 * Возвращает случайную позицию возрождения.
 * @return {Array}
 */
Map.prototype.getRandomRespawn = function() {
    return this.respawns[Math.floor(Math.random() * this.respawnsCount)];
};

module.exports = Map;
