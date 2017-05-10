// ==UserScript==
// @name         Spacom.ru::Addons
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Include Spacom.ru::Addons library functions on spacom.ru
// @author       dimio
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @encoding     utf-8
// @match        http*://spacom.ru/*
// @run-at       document-start
// ==/UserScript==
// Based on "Spacom addons" by segrey (
// https://greasyfork.org/en/scripts/27897-spacom-addons
// https://spacom.ru/forum/discussion/47/polzovatelskie-skripty)

(function( window, undefined ) {
    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    w.createMapButton = function( css, id, title ) {
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
    };
    
} )(window);

/*
var head = document.getElementsByTagName('head')[0];
var lib= document.createElement( 'script' );
lib.type= 'text/javascript';
lib.src= 'https://rawgit.com/dimio/userscripts-spacom.ru-addons/master/Addons/Library.js';
head.appendChild( lib );
*/