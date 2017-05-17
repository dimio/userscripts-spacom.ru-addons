// ==UserScript==
// @name         Spacom.ru::Addons
// @namespace    http://tampermonkey.net/
// @version      0.0.3
// @description  Include Spacom.ru::Addons library functions on spacom.ru
// @author       dimio
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   dimio.org, dimio@dimio.org
// @encoding     utf-8
// @match        http*://spacom.ru/*
// @run-at       document-start
// ==/UserScript==
// Based on "Spacom addons" by segrey (
// https://greasyfork.org/en/scripts/27897-spacom-addons
// https://spacom.ru/forum/discussion/47/polzovatelskie-skripty)

(function( window, undefined ) {
    'use strict';
    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    w.waitFor = function( obj, prop, callback ) {
        var token = setInterval( function () {
            if ( obj[prop] !== undefined ) {
                clearInterval( token );
                callback( obj[prop] );
            }
        }, 0 );
    };

    w.makeElementClickable = function ( elem, icon, title, callback ){
        let text = elem.innerText;
        if ( icon ){ text = '<i class="fa ' +icon+ '" aria-hidden="true"></i> ' +text; }
        elem.innerHTML = '<a href="#" title="' +title+ '" onclick="' +callback+ '; return false;">' +text+ '</a>';
        return elem;
    };

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

    w.createNaviBarButton = function( name, callback ) {
        var last = $("#navi > div:nth-child(3)");
        var next = $('<div class="navi_menu_item" onclick="' +callback+ '; return false;">\
<a href="#">' +name+ '</a></div>').css( {
            "z-index": last.css("z-index"),
            "position": last.css("position"),
            "cursor": last.css("cursor"),
            "color": last.css("color"),
            "right": last.css("right"),
            "bottom": last.css("bottom"),
            //"bottom": (parseInt(last.css("bottom")) + 40) + "px"
        } );
        last.after( next );
        return next;
    };

} )( window );

/*
var head = document.getElementsByTagName('head')[0];
var lib= document.createElement( 'script' );
lib.type= 'text/javascript';
lib.src= 'https://rawgit.com/dimio/userscripts-spacom.ru-addons/master/Addons/Library.js';
head.appendChild( lib );
*/
