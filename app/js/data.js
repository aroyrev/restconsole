$(function Data () {
    console.log('initiating Data.js');

    var localSessionData = {};

    var storeLocalSessionData = _.throttle(function storeLocalSessionData() {
        console.log('(storeLocalSessionData) [throttled]]');

        // save changes
        chrome.storage.local.set({'session': localSessionData});
    }, 500);

    function constructHTTPRequest() {
        console.log('(constructHTTPRequest)', localSessionData);

        // construct HTTPArchive Request object
        var request = new HTTPArchiveRequest({
            'method': localSessionData.target.Method,
            'url': 'http://' + localSessionData.target.Host + localSessionData.target.Path,
            'httpVersion': localSessionData.target.Protocol
        });

        // construct headers
        $.each(localSessionData.headers, function constructHeader (name, value) {
            request.setHeader(name, value);
        });

        // add Authorization header
        if (localSessionData.authorization.Authorization) {
            request.setHeader('Authorization', localSessionData.authorization.Authorization);
        }

        // add Proxy-Authorization header
        if (localSessionData.authorization['Proxy-Authorization']) {
            request.setHeader('Proxy-Authorization', localSessionData.authorization['Proxy-Authorization']);
        }
        // write outputs
        $('#request-curl pre').html(request.toCurl(true));
        $('#request-har pre').html(JSON.stringify(request.toJSON()));

        // TODO: manually add blocked headers (ex: HOST)
        $('#request-raw pre').html(request.toString());
    }

    /**
     * listener on input changes to clean up and set default values
     */
    $('#editor').on('change', 'input:not([type="checkbox"], [name="Username"], [name="Password"], [name="key"], [name="value"]), select', function onChange (event, skipStorage) {
        var el = $(this);
        var form = el.parents('form').prop('name');
        var name = el.prop('name');
        var deflt = el.data('default');

        console.log('(onChange) #editor > form[name="%s"] > input[name="%s"]', form, name);

        // trim (anything other than username / password fields)
        if ($.inArray(name, ['Username', 'Password']) === -1) {
            el.val(el.val().trim());
        }

        // if empty set default value
        if (el.val() === '' && deflt !== '') {
            el.val(deflt);
        }

        // only store enabled elements
        if (el.is(':disabled')) {
            delete localSessionData[form][name];
        } else {
            localSessionData[form][name] = el.val();
        }

        if (skipStorage !== true) {
            storeLocalSessionData();
        }

        constructHTTPRequest();
    });

    // initiate first load
    chrome.storage.local.get('session', function getSession (storage) {
        console.log('(main) [async] chrome.storage.local.get');

        // must be first time
        if (!storage.hasOwnProperty('session')) {
            // cycle through all the individual forms and generate output
            $('#editor form').each(function constructStorageObject () {
                var form = $(this);
                var name = form.prop('name');

                if (localSessionData[name] === undefined) {
                    localSessionData[name] = {};
                }

                // create key-value array
                $.each(form.serializeArray(), function (_, input) {
                    localSessionData[name][input.name] = input.value;
                });
            });

            storeLocalSessionData();
        } else {
            // data exists, assign it to the fields
            localSessionData = storage.session;

            for (var form in localSessionData) {
                if (localSessionData.hasOwnProperty(form)) {
                    for (var name in localSessionData[form]) {
                        if (localSessionData[form].hasOwnProperty(name)) {
                            $('#editor form[name="' + form + '"] [name="' + name + '"]').val(localSessionData[form][name]).trigger('enable').trigger('change', [true]);
                        }
                    }
                }
            }
        }

        // construct request for the first time
        constructHTTPRequest();
    });
});
