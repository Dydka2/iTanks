(function() {
    if (window && !window.T) {
        window.T = {};
    }

    /**
     * Объект-синглтон для работы с GET-параметрами
     * @type T.Params
     */
    T.Params = {

    };

    /**
     * Определяет, передан ли параметр независимо от значения
     * @param {String} name
     * @returns {Boolean}
     */
    T.Params.isDefined = function(name) {
        var regex = new RegExp('/\\?.*' + name + '/ig');
        var parsed = regex.exec(location.href);

        return Boolean(parsed && parsed.length);
    };

    /**
     * Возвращает значение параметра по имени
     * @param {String} name
     * @returns {Boolean|null}
     */
    T.Params.getValue = function(name) {
        var regex = new RegExp('/\\?.*' + name + '=([^&]*)/igs');
        var parsed = regex.exec(location.href);
        if (parsed && parsed.length === 2) {
            return parsed[1];
        }

        return null;
    };
})();
