// ==UserScript==
// @name         Spacom.Addons
// @version      0.1.2
// @namespace    http://dimio.org/
// @description  Provide Spacom.Addons library functions on spacom.ru
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/*
// @include      http*://spacom.ru/*
// @run-at       document-start
// ==/UserScript==
console.log(GM_info.script.name, 'booted v.', GM_info.script.version);

(function (window) {
  'use strict';

  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;

  if (w.self !== w.top) {
    return;
  }
  if (!w.Addons) {
    w.Addons = {
      // w: w,
      Common: {},
      Decor: {},
      Design: {},
      DOM: {},
      Fleets: {},
      Map: {},
      Sort: {},
      Stars: {},
    };
  }
  const Addons = w.Addons;

  Addons.Common = {
    waitFor(obj, prop, callback) {
      const token = setInterval(() => {
        if (typeof obj[prop] !== 'undefined') {
          clearInterval(token);
          callback(obj[prop]);
        }
      }, 0);
    },
    waitObj(obj, callback) {
      const token = setInterval(() => {
        if (this.isVariableDefined(obj) && this.isObjNotEmpty(obj)) {
          clearInterval(token);
          callback(obj);
        }
      }, 0);
    },
    getObjCenter(opt) {
      const obj = opt.obj;
      const mode = opt.mode;
      let center;

      switch (mode) {
        case 'mark':
          center = w.getCenterXY(obj.x, obj.y);
          break;
        case 'viewzone':
          if (+obj.turn === 0) {
            center = w.getCenterXY(obj.x, obj.y);
          }
          else {
            center = {x: obj.start_x, y: obj.start_y};
          }
          break;
      }

      return center;
    },
    isVariableDefined(value) {
      if (typeof value === 'undefined') {
        return false; //retrun value >>> 0
      }
      return value !== null;
    },
    isObjNotEmpty(obj) {
      return Object.keys(obj).length !== 0 || obj.size !== 0;
    },
  };

  Addons.DOM = {
    appendClickableIcon(opt) {
      const elem = opt.elem;
      const icon = opt.icon;
      const css_name = opt.css_name;
      const title = opt.title;
      const callback = opt.cb;

      const appended_elem = $(elem);

      const clickable_icon = document.createElement('a');
      clickable_icon.href = '#';
      clickable_icon.title = title;
      clickable_icon.setAttribute('onclick', `${callback}; return false;`);
      clickable_icon.innerHTML = ` <i class="fa ${icon}" id="${css_name}"></i></a>`;

      appended_elem.append(clickable_icon);

      return elem;
    },
    makeClickable(opt) {
      const elem = opt.elem;
      const icon = opt.icon;
      const css_name = opt.css_name;
      const title = opt.title;
      const callback = opt.cb;

      let text = elem.innerText;
      if (icon) {
        text = `<i id="${css_name}" class="fa ${icon}"></i> ${text}`;
      }
      elem.innerHTML = `<a href="#" title="${title}" onclick="${callback}; return false;">${text}</a>`;

      return elem;
    },
    replaceContent(elem, clearElem) {
      // replaceContent(elem) {
      if (clearElem) {
        $(elem).empty();
      }

      for (let i = 2; i < arguments.length; i++) {
        // for (let i = 1; i < arguments.length; i++) {
        $(elem).append(arguments[i]);
      }

      return elem;
    },
    createNaviBarButton(name, last_el_num, callback) {
      const last = $(`#navi > div:nth-child(${last_el_num})`);

      $(last).parent().css({
        //width: `${parseInt($(last).parent().css('width'), 10) + 15}px`,
        width: 'fit-content',
        'padding-left': '5px',
        'padding-right': '5px',
      });
      $(last).parent().children('*').css({
        //'margin-left': '10px',
        'margin-right': '5px',
      });

      const next = $(`<div class="${last.attr(
        'class')}" onclick="${callback};"><a href="#">${name}</a></div>`);
      last.after(next);

      return next;
    },
    createActionButton(btn_text, css_class, css_id) {
      return $(`<button class="btn-action" id="${css_id}" onclick="return false;">
<i class="${css_class}" aria-hidden="true"></i> <br><span class="button-text">${btn_text}</span>
<br></button>`);
    },
    createMapButton(css_class, id, title, imgSrc) {
      const img = (imgSrc) ? `<img alt="" src="${imgSrc}"/>` : '';
      const last = $('#radar + div');
      const next = $(
        `<div id="${id}" title="${title}">
         <i class="fa ${css_class} fa-2x">
         ${img}
        </i>
        </div>`)
      .css({
        'z-index': last.css('z-index'),
        position: last.css('position'),
        cursor: last.css('cursor'),
        color: last.css('color'),
        right: last.css('right'),
        bottom: `${parseInt(last.css('bottom'), 10) + 40}px`,
      });
      last.before(next);

      return next;
    },
  };

  Addons.Sort = {
    alphabetically(a, b) {
      return a.localeCompare(b);
    },
    numerically(a, b) {
      return parseFloat(a) - parseFloat(b);
    },
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
    uniqueArray(array) {
      // return array.filter((value, index, self) => {
      //   return self.indexOf(value) === index;
      // })
      return [...new Set(array)]
    },
  };

})(window);
