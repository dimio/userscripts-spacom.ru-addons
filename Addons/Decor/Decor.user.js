// ==UserScript==
// @name         Spacom.Addons.Decor
// @version      0.1.0
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
    init() {
      this.formatShortNumber();
    },
  };

  w.Addons.Decor.init();

})(window);
