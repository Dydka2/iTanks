(function() {
    if (window && !window.T) {
        window.T = {};
    }

    T.Resources = {};

    var resourcesLoadedDeferred = new vow.Deferred();

    /**
     * Загружает ресурсы текстур
     * @returns {Vow.Promise}
     */
    var loadResources = T.Resources.loadResources = function loadResources() {
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


        return vow.all(promises).then(function() {
            resourcesLoadedDeferred.resolve();
        });
    };

    T.Resources.whenResourcesLoaded = function() {
        return resourcesLoadedDeferred.promise();
    };

    T.Events.on('app-init', loadResources);
})();
