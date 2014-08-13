(function() {
    if (window && !window.T) {
        window.T = {};
    }

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

        T.Events.trigger('app-init');
        jQuery(function() {
            T.Events.trigger('dom-ready');
        });
    };

    T.App.init();

    T.UserInfo.whenLoginProvided().then(function() {
        T.Resources.whenResourcesLoaded().then(function() {
            return T.UserInfo.loginToGame();
        }).then(function() {
            T.startGame();
        })
    })
})();
