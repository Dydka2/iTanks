
var _ = require('lodash');
var GameObject = require('./gameobject');

var BULLET_SPEED = 4;
var BULLET_SIZE = [0.35, 0.5];

/**
 * @param {Object} [initParams]
 * @param {number} [initParams.direction=0]
 * @param {Array} [initParams.position=[0,0]]
 * @param {Object} [initParams.player]
 * @constructor
 */
function Bullet(initParams) {
    initParams = initParams || {};

    GameObject.call(this, {
        direction: initParams.direction,
        position: _.clone(initParams.position),
        size: BULLET_SIZE,
        speed: BULLET_SPEED,
        inMove: true
    });

    this.player = initParams.player || null;
}

Bullet.prototype = Object.create(GameObject.prototype);

Bullet.prototype.explode = function() {
    this.emit('explode');
};

module.exports = Bullet;
