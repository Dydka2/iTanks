
var _ = require('lodash');
var GameObject = require('./gameobject');
var Bullet = require('./bullet');

var TANK_SIZE = [1.6, 1.6];
var BASE_TANK_SPEED = 2.2;
var BASE_TANK_RECOIL = 1000;

var TANK_TYPES = [
    {
        baseHp: 1,
        speed: BASE_TANK_SPEED * 1.5,
        recoil: BASE_TANK_RECOIL / 1.7
    },
    {
        baseHp: 2,
        speed: BASE_TANK_SPEED,
        recoil: BASE_TANK_RECOIL
    },
    {
        baseHp: 3,
        speed: BASE_TANK_SPEED * 0.7,
        recoil: BASE_TANK_RECOIL / 0.7
    }
];

/**
 * @param {Object} initParams
 * @param {number} initParams.tankType
 * @constructor
 */
function Tank(initParams) {
    GameObject.call(this, {
        size: TANK_SIZE,
        inMove: false
    });

    this.hp = 0;
    this.lastShootTS = 0;
    this.isDead = true;

    var tankProto = TANK_TYPES[initParams.tankType];

    if (!tankProto) {
        throw new Error('DEBUG TANK TYPE');
    }

    _.extend(this, tankProto);
}

Tank.prototype = Object.create(GameObject.prototype);

Tank.prototype.tryShoot = function() {
    var now = new Date().getTime();

    if (!this.isDead && (this.lastShootTS + this.recoil < now)) {
        this.lastShootTS = now;

        var bullet = new Bullet({
            position: this.position,
            direction: this.direction,
            player: this.player
        });

        bullet.moveForward(this.size[1] * 0.55);

        this.emit('shoot', bullet);
    }
};

/**
 * Уменьшить жизни танка на один. Возвращает новое состояние.
 * @return {number}
 */
Tank.prototype.decreaseHp = function() {
    if (this.hp > 0) {
        this.hp--;

        this.emit('updateHealth', this.hp);
    }

    return this.hp;
};

module.exports = Tank;
