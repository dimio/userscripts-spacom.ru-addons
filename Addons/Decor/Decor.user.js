// ==UserScript==
// @name         Spacom.Addons.Decor
// @version      0.1.1
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
// console.log('Spacom.Addons.Decor booted');

const SETTINGS = {
  formatNumbers: true,
  addGlobalTurn: true,
};

(function (window) {
  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;

  if (w.self !== w.top) {
    return;
  }
  if (!w.Addons.Decor) {
    w.Addons.Decor = {};
  }

  w.Addons.Decor = {
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
        if (w.Addons.isVariableDefined(lengthCounter) && lengthCounter > "0") {
          $("#turn_num").append('&nbsp;[' + w.turn + ']')
        }
      };
    },
    init() {
      if (SETTINGS.formatNumbers) {
        this.formatShortNumber();
      }
      if (SETTINGS.addGlobalTurn) {
        this.addServerGlobalTurn();
      }
    },
  };

  w.Addons.Decor.init();

})(window);
