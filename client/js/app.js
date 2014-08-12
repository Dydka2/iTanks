(function() {
    T.App = {};
    T.App.init = function() {
        T.cellCount = 26;
        T.cellWidth = 20;
        T.cellHeight = 20;
        T.AREA_WIDTH = T.cellCount * T.cellWidth;
        T.AREA_HEIGHT = T.cellCount * T.cellHeight;
        T.bullets = [];
        T.enemies = [];
        // кеш для загруженных тектсур
        T.textures = {};
        T.gameTime = 0;
        T.timestampNode = document.querySelector('.timestamp');

        T.scale = 1;

        T.tankSize = [ T.scale*T.cellWidth*1.7, T.scale*T.cellWidth*1.7 ];
        T.bulletSize = [ 6, 10 ];

        T.App.loadResources().then(function() {
            T.Transport.initSocket(function() {
                var login = T.Params.getValue('name');
                if (login) {
                    T.Transport.sendAction('login', {
                        action: 'login',
                        data: {
                            name: login || 'la-la-la2',
                            tankType: 1
                        }
                    });
                }
            });

            T.Transport
                .on('details', function(data) {
                    T.playSound('start');
                    T.hideLoader();
                    T.updateMap(data.map);
                    T.renderHP(data.hp);
                    T.updateTimeDelta(data.now);
                })
                .on('playerList', T.updatePlayerList)
                .on('updateMapState', T.render)
                .on('playerJoined', T.addPlayer)
                .on('playerLeft', T.removePlayer)
                .on('playerDeath', T.killPlayer)
                .on('hit', T.hitPlayer)
                .on('updateHealth', T.updateHP)
                .on('terrainDamage', T.terrainDamage);

            T.Chat.init({
                node: $('.b-messages')[0]
            });

        });

        jQuery(T.App.onDomReady);
    };

    T.App.onDomReady = function($) {


        var login = T.getForcedName();
        if (login) {
            T.startGame();
            return;
        }

        $('form').submit(function(e) {
            var $form = $(this);

            var $login = $form.find('[name="login"]');
            var login = $login.val();
            var tankType = Number($form.find('[name="tankType"]:checked').val());
            console.log('TANKTYPE:', tankType);

            if (!login) {
                T.hideLoader();
                $login.addClass('error').focus().one('keydown', function() {
                    $login.removeClass('error');
                });
                return false;
            }

            T.showLoader();

            T.Transport.sendAction('login', {
                name: login,
                tankType: tankType
            });

            T.startGame();

            e.preventDefault();
        });
    };

    /**
     * Загружает ресурсы текстур
     * @returns {Vow.Promise}
     */
    T.App.loadResources = function() {
        var pathPrefix = 'images/';

        var resources = [
            'tank_yellow.png',
            'tank_green.png',
            'tank_blue.png',
            'tank_red.png',
            'tank_brown.png',
            'tank_gray.png',
            'tank_lblue.png',
            'tank_orange.png',
            'tank_purple.png',

            'brick.png',
            'cement.png',
            'missile.png',
            'explosion.png',
            'brick_broken.png',

            'heart.png',
            'heart_none.png'
        ];

        var promises = _.map(resources, function(file) {
            var deferred = new vow.Deferred();

            var image = new Image();
            image.src = pathPrefix + file;
            image.onload = function() {
                deferred.resolve(image);
                T.textures[file.split('.')[0]] = image;
                console.log('Image ' + image.src + ' loaded successfully');
            };

            image.onerror = function() {
                deferred.reject('Image ' + image.src + ' not loaded!');
                console.error('Image ' + image.src + ' not loaded!');
            };
            return deferred.promise();
        });

        return vow.all(promises);
    };

    T.App.init();

})();
