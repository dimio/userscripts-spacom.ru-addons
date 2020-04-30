// ==UserScript==
// @name         Spacom.Addons.Decor
// @version      0.1.2
// @namespace    http://dimio.org/
// @description  Some game interface view improvements
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/*
// @include      http*://spacom.ru/*
// @run-at       document-end
// ==/UserScript==
console.log(GM_info.script.name, 'booted v.', GM_info.script.version);
const homePage = GM_info.scriptMetaStr.split('\n')[6].split(' ')[6];

const ERR_MSG = {
  NO_LIB: `Для работы ${GM_info.script.name} необходимо установить и включить последние версии следующих дополнений:
<ul>
<li>Spacom.Addons</li>
</ul>
<a href="${homePage}">${homePage}</a>`,
};

(function (window) {
  'use strict';

  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;
  const Addons = w.Addons;

  if (w.self !== w.top) {
    return;
  }
  if (!Addons) {
    w.showSmallMessage(ERR_MSG.NO_LIB);
    return;
  }

  Addons.Decor = {
    OPT: {
      formatNumbers: true,
      addGlobalTurn: true,
    },

    formatShortNumber() {
      const _short_number = w.short_number;
      w.short_number = function (number) {
        return (number < 10000) ?
          parseInt(number, 10).toLocaleString() :
          _short_number.call(this, number)
          .replace(/^(\d+)(\w)$/, "$1&nbsp;$2");
      }
    },
    addServerGlobalTurn() {
      const _parseAnswer = w.parseAnswer;
      w.parseAnswer = function (json, type) {
        _parseAnswer.call(self, ...arguments);
        const lengthCounter = json['info']['length_counter'];
        if (Addons.Common.isVariableDefined(lengthCounter) && lengthCounter > "0") {
          $("#turn_num").append('&nbsp;[' + w.turn + ']')
        }
      };
    },
    init() {
      if (this.OPT.formatNumbers) {
        this.formatShortNumber();
      }
      if (this.OPT.addGlobalTurn) {
        this.addServerGlobalTurn();
      }
    },
  };

  Addons.Decor.init();

})(window);
