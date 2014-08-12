
var CELL_TYPE = {
    EMPTY: 0,
    NORMAL: 1,
    HARD: 2,
    RESPAWN: 99
};

module.exports = {
    /**
     * @param {number} mapNumber
     * @return {Object}
     */
    loadMap: function(mapNumber) {

        var map = require('../../maps/map_' + mapNumber + '.js');
        var respawns = [];

        var ROWS_COUNT = map.length;
        var COLS_COUNT = map[0].length;

        for (var y = 0; y < ROWS_COUNT; ++y) {
            for (var x = 0; y < COLS_COUNT; ++x) {
                var cell = map[y][x];

                if (cell === CELL_TYPE.NORMAL) {
                    map[y][x] = [cell, 2];

                } else if (cell === CELL_TYPE.RESPAWN) {
                    map[y][x] = [CELL_TYPE.EMPTY];

                    respawns.push([x + 1, y + 1]);
                } else {
                    map[y][x] = [cell];
                }
            }
        }

        return {
            map: map,
            rowsCount: ROWS_COUNT,
            colsCount: COLS_COUNT,
            respawns: respawns,

            checkCollision: function(object) {
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
            }
        }
    }
};
