
(function() {
    /* --------------------------------------------------------------------- */

    var KEY_CODES_MATCHING = {
        38: 0, // arrow up
        87: 0, // w
        39: 1, // arrow right
        68: 1, // d
        40: 2, // arrow down
        83: 2, // s
        37: 3, // arrow left
        65: 3  // a
    };

    var movementInputOrder = [];

    /* --------------------------------------------------------------------- */

    /**
     * @param {Object} params
     */
    T.updateTankState = function(params) {
        T.Transport.sendAction('updateState', params);
    };

    /* --------------------------------------------------------------------- */

    /**
     * @param {string} eventType
     * @param {number} keyCode
     */
    T.processInput = function(eventType, keyCode) {

        if (keyCode === 32 /* space */) {
            T.updateTankState({
                shooting: eventType === 'keydown'
            });

        } else if (keyCode in KEY_CODES_MATCHING) {

            var index = movementInputOrder.indexOf(keyCode);
            if (index !== -1) {
                movementInputOrder.splice(index, 1);
            }

            if (eventType === 'keydown') {
                movementInputOrder.push(keyCode);
            }

            var inMove = movementInputOrder.length > 0;

            if (inMove) {
                var lastKeyCode = _(movementInputOrder).last();

                T.updateTankState({
                    direction: KEY_CODES_MATCHING[lastKeyCode],
                    inMove: true
                });
            } else {
                T.updateTankState({
                    inMove: false
                });
            }
        }
    };

    /* --------------------------------------------------------------------- */

    T.bindEvents = function() {
        $(document)
            .on('keydown keyup', function(e) {
                T.processInput(e.type, e.which);
            });
    };

    /* --------------------------------------------------------------------- */
})();
