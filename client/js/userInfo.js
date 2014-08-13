(function() {
    T.UserInfo = {};

    var loginDeferred = new vow.Deferred();

    function saveLoginInfo(login, tankType) {
        T.UserInfo.login = login;
        T.UserInfo.tankType = tankType;

        loginDeferred.resolve(T.UserInfo);
    }

    function onDomReady() {
        $('.login-form').show().submit(function(e) {
            var $form = $(this);

            var $login = $form.find('[name="login"]');
            var login = $login.val();
            var tankType = Number($form.find('[name="tankType"]:checked').val());

            if (!login) {
                $login.addClass('error').focus().one('keydown', function() {
                    $login.removeClass('error');
                })
                return false;
            }

            saveLoginInfo(login, tankType);

            e.preventDefault();
        });
    }

    function init() {
        var login = T.Params.getValue('login');
        if (login) {
            console.log('USING LOGIN FROM PARAMS:', login);
            saveLoginInfo(login, 1);
        } else {
            T.Events.on('dom-ready', onDomReady);
        }
    }

    T.UserInfo.loginToGame = function() {
        return T.Transport.whenTransportReady().then(function(Transport) {
            Transport.sendAction('login', {
                login: T.UserInfo.login,
                tankType: T.UserInfo.tankType
            })
        });
    };

    T.UserInfo.whenLoginProvided = function() {
        return loginDeferred.promise();
    }

    T.Events.on('app-init', init);

})();
