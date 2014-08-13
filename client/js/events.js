(function() {
    if (window && !window.T) {
        window.T = {};
    }

    T.Events = {};
    _.extend(T.Events, EventEmitter.prototype);
})();

