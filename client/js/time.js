T.Time = {};

/**
 * Обновляет поправку серверного времени относительно клиентского
 * @param {Number} serverNow
 */
T.Time.updateTimeDelta = function(serverNow) {
    T.timestampDelta = Date.now() - serverNow;
};

/**
 * Возвращает серверное время, вычисленное из клиентского и поправки
 * @param {Boolean} dateObjNeeded Нужно ли время в виде объекта Date
 * @returns {Date|Number}
 */
T.Time.serverNow = function(dateObjNeeded) {
    var result = Date.now() - T.timestampDelta;
    if (dateObjNeeded) {
        result = new Date(result);
    }

    return result;
};
