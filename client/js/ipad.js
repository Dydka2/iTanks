(function() {
    function processShootTouch() {
        T.Transport.sendAction('shoot');
    }

    function processNavTouch(e, x, y, navWidth, navHeight) {
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
    }

    function processTouch(e) {
        if (e.originalEvent) {
            var touches = e.originalEvent.touches;
            if (touches && touches.length) {
                _.forEach(touches, function(touch) {
                    processSingleTouch(e, touch.pageX, touch.pageY);
                });
            }
        }
    }

    function doesTouchBelongToNode(e, $node, pageX, pageY) {
        var deferred = new vow.Deferred();

        var offset = $node.offset();
        var width = $node.width();
        var height = $node.height();

        if (offset.left < pageX && offset.left + width > pageX &&
            offset.top < pageY && offset.top + height > pageY) {
            deferred.resolve(e, pageX - offset.left, pageY - offset.top, width, height);
        }

        return deferred.promise();
    }

    function processSingleTouch(e, pageX, pageY) {
        doesTouchBelongToNode(e, $('.b-pad-nav'), pageX, pageY).then(processNavTouch);
        doesTouchBelongToNode(e, $('.b-pad-shoot'), pageX, pageY).then(processShootTouch);
    }

    function onTouch(e) {
        processTouch(e);

        return false;
    }


    function iPadInit() {
        jQuery(function($) {
            $(document).on('touchstart', function(e) {
                var t2 = e.timeStamp,
                    t1 = $(this).data('lastTouch') || t2,
                    dt = t2 - t1,
                    fingers = e.originalEvent.touches.length;

                $(this).data('lastTouch', t2);
                if (!dt || dt > 500 || fingers > 1) return; // not double-tap

                e.preventDefault(); // double tap - prevent the zoom
                // also synthesize click Events we just swallowed up
                $(this).trigger('click').trigger('click');
            });

            document.ontouchmove = function(e)
            {
                return e.preventDefault();
            };

            $("html").addClass('ipad');

            $(document).on('tap', function() {
                return false;
            });

            $('.b-pad-nav').on('touchdown touchmove touchup touchstart', onTouch);
            $('.b-pad-shoot').on('touchdown touchmove touchstart', onTouch);
        });
    }

    var UA = navigator.userAgent;
    if (T.Params.isDefined('ipad') || UA.indexOf('iPad') > -1) {
        iPadInit();
    }
})();
