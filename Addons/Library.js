// https://greasyfork.org/en/scripts/27897-spacom-addons
// https://spacom.ru/forum/discussion/47/polzovatelskie-skripty)

function createMapButton_test ( css, id, title ) {
    var last = $("#radar + div");
    var next = $('<div id="' +id+ '" title="' +title+ '"><i class="fa ' +css+ ' fa-2x"></i></div>').css( {
        "z-index": last.css("z-index"),
        "position": last.css("position"),
        "cursor": last.css("cursor"),
        "color": last.css("color"),
        "right": last.css("right"),
        "bottom": (parseInt(last.css("bottom")) + 40) + "px"
    } );
    last.before( next );
    return next;
}