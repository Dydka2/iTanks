if (window && !window.T) {
    window.T = {};
}

((function($) {
    var IS_IOS = /iphone|ipad/i.test(navigator.userAgent);
    $.fn.nodoubletapzoom = function() {
        if (IS_IOS)
            $(this).bind('touchstart', function preventZoom(e) {
                var t2 = e.timeStamp
                    , t1 = $(this).data('lastTouch') || t2
                    , dt = t2 - t1
                    , fingers = e.originalEvent.touches.length;
                $(this).data('lastTouch', t2);
                if (!dt || dt > 500 || fingers > 1) return; // not double-tap

                e.preventDefault(); // double tap - prevent the zoom
                // also synthesize click Events we just swallowed up
                $(this).trigger('click').trigger('click');
            });
    };

    $(document).ready(function() {
        $(document).nodoubletapzoom();
    })
})(jQuery));

document.ontouchmove = function(e)
{
    return e.preventDefault();
};



var UA = navigator.userAgent;
T.iPad = false;
if (UA.indexOf('iPad') > -1) {
    T.iPad = true;
}


/**
 * Рисует ячейку карты
 * @param {Number|Array} cell
 * @param {Number} x
 * @param {Number} y
 */
T.renderCell = function(cell, x, y) {
    console.log('renderCell');

    var type = cell[0];
    var state = cell[1];
    var texture = null;

    switch (type) {
    case T.EMPTY:
        break;

    case T.BRICK:

        if (state === 2) {
            texture = T.textures['brick'];

        } else if (state === 1) {
            texture = T.textures['brick_broken'];
        }

        break;

    case T.CEMENT:
        texture = T.textures['cement'];
        break;
    }

    if (!texture) {
        //works with shapes but not with images
        T.ctx2.fillStyle = "rgb(0, 0, 0)";
        T.ctx2.fillRect(x * T.cellWidth * T.scale, y * T.cellHeight * T.scale, T.cellWidth * T.scale, T.cellHeight * T.scale);
    } else {
        T.ctx2.drawImage(texture, x * T.cellWidth * T.scale, y * T.cellHeight * T.scale, T.cellWidth * T.scale, T.cellHeight * T.scale);
    }

    if (T.isGridEnabled()) {
        T.ctx2.strokeStyle = "rgb(0, 255, 0)";
        T.ctx2.strokeRect(x * T.cellWidth * T.scale, y * T.cellHeight * T.scale, T.cellWidth * T.scale, T.cellHeight * T.scale);

        T.ctx2.font = '8px Consolas';
        T.ctx2.fillStyle = "rgb(0, 255, 0)";
        T.ctx2.fillText(x + ',' + y, x * T.cellWidth * T.scale, y * T.cellHeight * T.scale + 16);
    }
};

T.updateMap = function(map) {
    T.mapData = map;
    for (var y = 0; y < map.length; y++) {
        var row = map[y];
        for (var x = 0; x < row.length; x++) {
            var cell = row[x];

            T.renderCell(cell, x, y);
        }
    }
};

T.main = function() {
    var now = Date.now();
    var dt = (now - T.lastTime) / 1000.0;
    T.update(dt);
    T.lastTime = now;
    requestAnimationFrame(T.main);
};

T.playSound = function(sound) {
    var $audio = $('audio#' + sound);

    $audio[0].play();
};

T.renderEntities = function(data, isBullet) {
    var dataLength = data.length;

    for (var i = 0; i < dataLength; i++) {
        T.renderEntity(data[i], isBullet)
    }
};

T.renderEntity = function(data, isBullet) {
    var ctx = T.ctx;
    var position = data.position;
    var size = isBullet ? T.bulletSize : T.tankSize;
    var playerInfo = _.find(T.players, {id: data.id});
    var image = isBullet ? T.textures['missile'] : T.textures['tank_' + playerInfo.color];

    ctx.save();

    if (isBullet) {
        ctx.translate((position[0]) * T.cellWidth + (size[0] - 5)/2, (position[1]) * T.cellWidth + (size[1] - 7)/2);
    } else {
        ctx.translate((position[0] - 1) * T.cellWidth + (size[0] + 6)/2, (position[1] - 1) * T.cellWidth + (size[1]+ 6)/2);
    }

    switch (data.direction) {
        case 0:
            ctx.rotate(0);
            break;
        case 2:
            ctx.rotate(Math.PI);
            break;
        case 3:
            ctx.rotate(Math.PI*3/2);
            break;
        case 1:
            ctx.rotate(Math.PI/2);
            break;
    }
    ctx.drawImage(image, -size[0]/2, -size[1]/2, size[0], size[1]);

    ctx.restore();

    if (!isBullet) {
        playerInfo.position = position;
    }
};

T.killPlayer = function(data) {
    var dead = T.getPlayer(data.dead);
    var killer = T.getPlayer(data.killer);

    killer.kills++;
    dead.deaths++;

    T.updatePlayer(killer);
    T.updatePlayer(dead);

    T.animations = T.animations || [];
    T.animations.push({
        id: dead.id,
        position: dead.position,
        // время начала анимации
        startTimestamp: Date.now(),
        name: 'explosion'
    });

    T.playSound('explosion');
};

T.hitPlayer = function(data) {
    T.animations = T.animations || [];
    T.animations.push({
        position: data.position,
        // время начала анимации
        startTimestamp: Date.now(),
        name: 'hit'
    });

    T.renderAnimations();
};

T.getPlayer = function(id) {
    return _.find(T.players, {id: id});
};

T.updatePlayerList = function(players) {
    T.players = [];

    var $template = $('.player-list-item-template');
    var $playerList = $('.player-list').empty();

    _.forEach(players, function(player) {
        T.addPlayer(player, $template, $playerList);
    });
};

T._generatePlayer = function(player, $template) {
    if (!$template) {
        $template = $('.player-list-item-template');
    }

    var $player = $template.clone().removeClass('player-list-item-template');

    $player.attr('data-id', player.id);
    $player.find('.player-name').text(player.name);
    $player.find('.player-color').css('background-color', player.color);
    $player.find('.player-kills .value').text(player.kills);
    $player.find('.player-deaths .value').text(player.deaths);

    return $player.show();
};

T.updatePlayer = function(player) {
    var $player = T.$getPlayerNode(player);
    $player.replaceWith(T._generatePlayer(player));

    T.players = _.sortBy(T.players, function(player) {
        return -player.kills;
    });

    T.updatePlayerList(T.players);
};

T.addPlayer = function(player, $template, $playerList) {
    T.players.push(player);

    if (!$template) {
        $template = $('.player-list-item-template');
    }

    if (!$playerList) {
        $playerList = $('.player-list');
    }

    $playerList.append(T._generatePlayer(player, $template));
};

T.removePlayer = function(playerToRemove) {
    T.players = _.reject(T.players, function(player) {
        return player.id === playerToRemove.id;
    });

    $('.player-list-item[data-id=' + playerToRemove.id + ']').remove();
};

T.showLoader = function() {
    $('.loader').removeClass('g-hidden');
};

T.hideLoader = function() {
    $('.loader').addClass('g-hidden');
};

T.renderCanvas = function() {
    var canvas = T.canvas = document.createElement('canvas');
    var canvas2 = T.canvas2 = document.createElement('canvas'); // для карты
    var wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    var $padShoot = $('.b-pad-shoot');

    canvas.width = T.AREA_WIDTH;
    canvas.height = T.AREA_HEIGHT;

    canvas2.width = T.AREA_WIDTH;
    canvas2.height = T.AREA_HEIGHT;

    wrapper.style.width = T.AREA_WIDTH + 'px';
    wrapper.style.height = T.AREA_HEIGHT + 'px';
    var areaNode = document.querySelector('.b-game__area');

    $('.b-pad-nav').css('left', T.AREA_WIDTH + $padShoot.width() + 50);

    wrapper.appendChild(canvas2);
    wrapper.appendChild(canvas);

    areaNode.appendChild(wrapper);

    T.ctx = canvas.getContext('2d');
    T.ctx2 = canvas2.getContext('2d');
};

T.getForcedName = function() {
    var parsed = /\?.*name=([^&]*)/.exec(location.href);
    if (parsed && parsed.length === 2) {
        return parsed[1];
    }

    return null;
};

T.isGridEnabled = function() {
    var parsed = /\?.*grid/.exec(location.href);
    if (parsed && parsed.length) {
        return true;
    }

    return false;
};

/**
 *
 * @returns {jQuery}
 */
T.$getPlayerNode = function(playerInfo) {
    return $('.player-list-item[data-id="' + playerInfo.id + '"]');
};

T.startGame = function() {
    $('body').addClass('game');
    $('.b-auth').hide();
    $('.b-game').show();
    T.renderCanvas();
    T.bindEvents();
};

T.renderAnimations = function(animations) {
    if (!animations) {
        return;
    }

    var result;
    for (var i = 0; i < animations.length; i++) {
        var animation = animations[i];
        switch (animation.name) {
        case 'explosion':
            result = T.renderExplosion(animation);
            if (!result) {
                // удаляем книмацию из массива
                animations.splice(i, 1);
                i--;
            }
            break;

        case 'hit':
            result = T.renderHit(animation);
            if (!result) {
                // удаляем книмацию из массива
                animations.splice(i, 1);
                i--;
            }
            break;
        }
    }
};

T.renderExplosion = function(animation) {
    var STEP_TIMEOUT = 100;
    var STEPS_NUMBER = 8;

    var step = Math.floor((Date.now() - animation.startTimestamp) / STEP_TIMEOUT);
    console.log('RENDER EXPLOSION', step);
    // если закончили анимацию, то ее нужно исключить из массива
    if (step >= STEPS_NUMBER) {
        return false;
    }

    var position = animation.position;
    var x = (position[0] - 1) * T.cellWidth + (T.tankSize[0] + 6)/2 - T.tankSize[0]/2;
    var y = (position[1] - 1) * T.cellWidth + (T.tankSize[1] + 6)/2 - T.tankSize[1]/2;

    var SPRITE_ELEMENT_WIDTH = 40;

    T.ctx.drawImage(T.textures['explosion'], step * SPRITE_ELEMENT_WIDTH, 0, SPRITE_ELEMENT_WIDTH, SPRITE_ELEMENT_WIDTH,
            x - 3, y - 3, T.tankSize[0] + 6, T.tankSize[1] + 6);

    return true;
};

T.renderHit = function(animation) {
    var STEP_TIMEOUT = 40;
    var STEPS_NUMBER = 8;

    var step = Math.floor((Date.now() - animation.startTimestamp) / STEP_TIMEOUT);
    console.log('RENDER HIT', step);
    // если закончили анимацию, то ее нужно исключить из массива
    if (step >= STEPS_NUMBER) {
        return false;
    }

    var position = animation.position;
    var x = (position[0] - 1) * T.cellWidth + (T.tankSize[0] + 6)/2 - T.tankSize[0]/2;
    var y = (position[1] - 1) * T.cellWidth + (T.tankSize[1] + 6)/2 - T.tankSize[1]/2;

    var SPRITE_ELEMENT_WIDTH = 40;

    T.ctx.drawImage(T.textures['explosion'], step * SPRITE_ELEMENT_WIDTH, 0, SPRITE_ELEMENT_WIDTH, SPRITE_ELEMENT_WIDTH,
            x+4, y+4, T.tankSize[0]-8, T.tankSize[1]-8);

    return true;
};

T.updateHP = function(data) {
    var currentHp = data.hp;
    $('.b-lives .heart').each(function(i){
        if (i < currentHp) {
            $(this).addClass('yes');
        } else {
            $(this).removeClass('yes');
        }
    });


};

T.renderHP = function(hp) {
    T.tankHP = hp;
    var $template = $('.lives-template').html();
    var $livesBox = $('.b-lives').empty();

    for (var i = 0; i < hp; i++) {
        $livesBox.append($template);
    }
};

T.terrainDamage = function(data) {
    T.renderCell(data.cell, data.positions[0], data.positions[1]);
};

/**
 * Перерисовка событий на канвасе
 * @type {object}
 */
T.render = function(data) {
    T.ctx.clearRect(0,0,T.AREA_WIDTH,T.AREA_WIDTH);
    T.renderEntities(data.tanks);
    T.renderEntities(data.bullets, true);
    T.renderAnimations(T.animations);
};

T._processTouch = function(e, pageX, pageY) {
    var $padNav = $('.b-pad-nav');
    var offset = $padNav.offset();
    var width = $padNav.width();
    var height = $padNav.height();

    if (offset.left < pageX && offset.left + width > pageY) {
        T._processNavTouch(e, pageX - offset.left, pageY - offset.top, width, height);
    } else {
        T._processShootTouch();
    }
};

T._processShootTouch = function() {
    console.log('SHOOT');
    T.Transport.sendAction('shoot');
};

T._processNavTouch = function(e, x, y, navWidth, navHeight) {
    // приводим к центру координат
    x = x - navWidth / 2;
    y = y - navHeight / 2;

    var dir;
    if (x < y) {
        if (x > -y) {
            // up
            dir = 2;
            console.log('DIRECTION', 'DOWN');
        } else {
            // left
            dir = 3;
            console.log('DIRECTION', 'LEFT');
        }
    } else {
        if (x < -y) {
            // down
            dir = 0;
            console.log('DIRECTION', 'UP');
        } else {
            // right
            dir = 1;
            console.log('DIRECTION', 'RIGHT');
        }
    }

    T.sendDirection(dir, e.type !== 'touchup');
};

T.processTouch = function(e) {
    if (e.originalEvent) {
        var touches = e.originalEvent.touches;
        if (touches && touches.length) {
            _.forEach(touches, function(touch) {
                T._processTouch(e, touch.pageX, touch.pageY);
            });
        }
    }
};

T.updateTimeDelta = function(serverNow) {
    T.timestampDelta = Date.now() - serverNow;
};

T.serverNow = function() {
    return Date.now() - T.timestampDelta;
};
