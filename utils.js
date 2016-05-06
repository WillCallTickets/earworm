////////////////////////////////////////////
//  utils.js
//
//
////////////////////////////////////////////

var corsPrefix = 'https://crossorigin.me/';

// severity - '', 'error', 'notice', 'warning', 'success' = notice
// msgs should have a way to clear themselves - X
function displayMessageGrowl(msg, severity) {

    var msg = msg.trim() || '';

    // $.growl({ title: "Growl", message: "The kitten is awake!" });
    // $.growl.error({ message: "The kitten is attacking!" });
    // $.growl.notice({ message: "The kitten is cute!" });
    // $.growl.warning({ message: "The kitten is ugly!" });
    if (msg.length > 0) {
        if (severity === 'error') {
            $.growl.error({
                message: msg
            });
        } else if (severity === 'notice' || severity === 'success') {
            $.growl.notice({
                message: msg
            });
        } else if (severity === 'warning') {
            $.growl.warning({
                message: msg
            });
        } else {
            $.growl({
                title: 'Info',
                message: msg
            });
        }
    }
}


////////////////////////////////////////////
//  handle localStorage
//
//  store settings
////////////////////////////////////////////

var _storageWrapper = {
    set: function(key, value) {
        if (!key || (!value && value !== false)) {
            return;
        }

        if (typeof value === "object") {
            value = JSON.stringify(value);
        }

        try{
            localStorage.setItem(key, value);
        } catch(e) {

            return;
        }
    },
    get: function(key) {
        //console.log('getting', key);
        try{
            var value = localStorage.getItem(key);
        } catch(e) {
            value = null;
        }

        if (!value) {
            return;
        }

        // assume it is an object that has been stringified
        if (value[0] === "{") {
            value = JSON.parse(value);
        }

        return value;
    },
    remove: function(key) {
        try{
            localStorage.removeItem(key);
        } catch(e) {
            // disregard
        }
    }
}
