$(function Host () {
    'use strict';

    console.log('initiating Host.js');

    /**
     * monitor host field
     */
    $('input[name="Host"]').on('change', function onChange (event, skipStorage) {
        console.log('(onChange) input[name="Host"]');

        // construct URI object
        var uri = new URI($(this).val().trim());

        if (uri.hostname() !== '') {
            // default to port 80 unless its HTTPS
            if (uri.protocol() === 'https') {
                uri.port(443);
            } else if(uri.port() === '') {
                uri.port(80);
            }

            // populate fields
            $('input[name=Port]').val(uri.port()).trigger('change', [skipStorage]);
            $('input[name=Path]').val(uri.resource()).trigger('change', [skipStorage]);

            // TODO potential danger of loop
            $('input[name=Host]').val(uri.hostname()).trigger('change', [skipStorage]);

            // handle basic authentication typed/pasted into the URI
            if (uri.username() !== '') {
                $('a[data-target="#headers-authorization"]').trigger('click').find('a[data-target="#authorization-basic"]').trigger('click');
                $('#authorization-basic input[name="Username"]').val(uri.username());
                $('#authorization-basic input[name="Password"]').val(uri.password()).trigger('change', [skipStorage]);
            }
        }

    });
});