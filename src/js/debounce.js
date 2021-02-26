debounce = new (function() {

    let eventWatchers = {}; // key is element id

    function addEventListener(el, evt, handler) {
        // get id
        let id = el.getAttribute("id");
        if (!id) {
            console.log("Tried to create event listener with no id:");
            console.log(el);
            return;
        }
        // add listener
        el.addEventListener(evt, function(e) {
            let id = e.target.getAttribute("id");
            if (id in eventWatchers) {
                clearTimeout(eventWatchers[id]);
            }
            eventWatchers[id] = setTimeout(function() {
                delete eventWatchers[id];
                handler(e);
            }, 200);
        });
    }

    return addEventListener;

})()
