// ==UserScript==
// @name         Spacom.ru::Addons
// @namespace    http://tampermonkey.net/
// @version      0.0.9
// @description  Provide Spacom.ru::Addons library functions on spacom.ru
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

// console.log('Spacom.ru::Addons booted');

(function (window) {

  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;

  w.waitFor = function (obj, prop, callback) {
    const token = setInterval(() => {
      if (obj[prop] !== undefined) {
        clearInterval(token);
        callback(obj[prop]);
      }
    }, 0);
  };

  w.appendOnclickEvent = function (i, elem, callback) {
    const last_onclick = $(elem).attr('onclick');
    const new_onclick = `${callback}; ${last_onclick}`;
    $(elem).attr('onclick', new_onclick);

    return elem;
  };

  w.appendElemClickableIcon = function (elem, icon, css_name, title, callback) {
    const clickable_icon = document.createElement('a');
    clickable_icon.href = '#';
    clickable_icon.title = title;
    clickable_icon.setAttribute('onclick', `${callback}; return false;`);
    clickable_icon.innerHTML = ` <i class="fa ${icon}" id="${css_name}"></i></a>`;
    elem.appendChild(clickable_icon);

    return elem;
  };

  w.makeElementClickable = function (elem, icon, css_name, title, callback) {
    let text = elem.innerText;
    if (icon) { text = `<i id="${css_name}" class="fa ${icon}"></i> ${text}`; }
    elem.innerHTML = `<a href="#" title="${title}" onclick="${callback}; return false;">${text}</a>`;

    return elem;
  };

  w.createNaviBarButton = function (name, last_el_num, callback) {
    const last = $(`#navi > div:nth-child(${last_el_num})`);

    $(last).parent().css({
      width: `${parseInt($(last).parent().css('width'), 10) + 15}px`,
    });

    const next = $(`<div class="${last.attr('class')}" onclick="${callback};
        return false;"><a href="#">${name}</a></div>`);
    last.after(next);

    return next;
  };

  w.createMapButton = function (css, id, title) {
    const last = $('#radar + div');
    const next = $(`<div id="${id}" title="${title}"><i class="fa ${css} fa-2x"></i></div>`).css({
      'z-index': last.css('z-index'),
      position: last.css('position'),
      cursor: last.css('cursor'),
      color: last.css('color'),
      right: last.css('right'),
      bottom: `${parseInt(last.css('bottom'), 10) + 40}px`,
    });
    last.before(next);

    return next;
  };

  w.sortAlphabetically = function (a, b) {
        // too simply sorting
        // TODO: comare strings char-by-char
    const a_cmp = a.toUpperCase();
    const b_cmp = b.toUpperCase();

    return (a_cmp < b_cmp) ? -1 : (a_cmp > b_cmp) ? 1 : 0;
  };

  w.sortNumerically = function (a, b) {
    const a_cmp = parseFloat(a, 10);
    const b_cmp = parseFloat(b, 10);

    return a_cmp - b_cmp;
  };

  w.isObjNotEmpry = function (obj) {
    if (Object.values(obj).filter(isArrElemDefined).length > 0) {
      return true;
    }
    return false;
  };

  w.isVariableDefined = function (value) {
    if (typeof value === 'undefined') {
      return false; // retrun value >>> 0
    }
    if (value === null) {
      return false;
    }
    return true;
  };

  w.toggleFlag = function (flag) {
    if (this.isVariableDefined(flag)) {
      flag = null;
      return flag;
    }
    flag = true;
    return flag;
  };

  function isArrElemDefined(value) {
    if (this.isVariableDefined(value)) {
      return value;
    }
    return undefined;
  }

})(window);
=======

(function( window, undefined ) {
    'use strict';
    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    w.waitFor = function( obj, prop, callback ) {
        var token = setInterval( function() {
            if ( obj[prop] !== undefined ) {
                clearInterval( token );
                callback( obj[prop] );
            }
        }, 0 );
    };

    w.appendElemClickableIcon = function ( elem, icon, title, callback ){
        let clickable_icon = document.createElement( 'a' );
        clickable_icon.href = '#';
        clickable_icon.title = title;
        clickable_icon.setAttribute( 'onclick', callback+ '; return false;' );
        clickable_icon.innerHTML = '  <i class="fa ' +icon+ '"></i></a>';
        elem.appendChild( clickable_icon );

        return elem;
    };

    w.makeElementClickable = function ( elem, icon, title, callback ){
        let text = elem.innerText;
        if ( icon ){ text = '<i class="fa ' +icon+ '"></i> ' +text; }
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
    w.appendDivClickableIcon = function ( elem, icon, title, callback ){
        let new_div = document.createElement( 'div' );
        new_div.innerHTML = '<a href="#" title="' +title+ '" onclick="' +callback+ '; return false;"><i class="fa ' +icon+ '"></i></a>';
        new_div.classList.value = elem.classList.value;
        elem.appendChild( new_div );

        return elem;
    };
*/

/*
var head = document.getElementsByTagName('head')[0];
var lib= document.createElement( 'script' );
lib.type= 'text/javascript';
lib.src= 'https://rawgit.com/dimio/userscripts-spacom.ru-addons/master/Addons/Library.js';
head.appendChild( lib );
*/

