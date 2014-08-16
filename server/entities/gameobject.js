
var _ = require('lodash');

/**
 * Прототип игрового объекта.
 * @param {Object} [initParams]
 * @param {Array} [initParams.position=[0,0]] координаты объекта [x, y]
 * @param {Array} [initParams.size=[0,0]] размерность [width, height]
 * @param {boolean} [initParams.inMove=false] находится ли в движении
 * @param {Number} [initParams.direction=0] направление (0 - верх, 1 - право, 2 - низ, 3 - лево).
 * @param {Number} [initParams.speed=0] скорость движения
 * @constructor
 */
function GameObject(initParams) {
    initParams = initParams || {};

    this.direction = initParams.direction || 0;
    this.position = _.clone(initParams.position || [0, 0]);
    this.size = _.clone(initParams.size || [0, 0]);
    this.inMove = ('inMove' in initParams ? initParams.inMove : false);
    this.speed = initParams.speed || 0;
}

_.extend(GameObject.prototype, require('events').EventEmitter.prototype);

/**
 * Проверка на столкновение объектов.
 * @param {Object} object
 * @return {GameObject}
 */
GameObject.prototype.checkCollision = function(object) {
    if (this === object) {
        return false;
    }

    return checkCollisionByAxis(0, this, object) && checkCollisionByAxis(1, this, object);
};

/**
 * Обновить коодинаты.
 * @param {number} period (ms)
 */
GameObject.prototype.updatePosition = function(period) {
    if (this.inMove) {
        var isNegative = this.direction === 0 || this.direction === 3;

        var distantion = this.speed / period;

        this.position[1 - this.direction % 2] += distantion * (isNegative ? -1 : 1);
    }
};


/**
 * Передвинуть объект вперед.
 * @param {number} distance
 */
GameObject.prototype.moveForward = function(distance) {
    var axis = (this.direction === 0 || this.direction === 2 ? 1 : 0);
    var isNegative = (this.direction === 0 || this.direction === 3);

    this.position[axis] += distance * (isNegative ? -1 : 1);
};

/**
 * Проверяет столкновение по одной оси.
 * @param axis
 * @param object1
 * @param object2
 * @returns {boolean}
 */
function checkCollisionByAxis(axis, object1, object2) {

    var size1;
    if (object1.direction === 0 || object1.direction === 2) {
        size1 = object1.size[axis];
    } else {
        size1 = object1.size[1 - axis];
    }

    var size2;
    if (object2.direction === 0 || object2.direction === 2) {
        size2 = object2.size[axis];
    } else {
        size2 = object2.size[1 - axis];
    }

    var pos1 = object1.position[axis] - size1 / 2;
    var pos2 = object2.position[axis] - size2 / 2;

    var delta = pos2 - pos1;

    return (delta > 0 && delta < object1.width || delta < 0 && -delta < object2.width);
}

module.exports = GameObject;
