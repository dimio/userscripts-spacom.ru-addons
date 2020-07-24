// ==UserScript==
// @name         Spacom.Addons.Stars.StateView
// @version      0.0.2
// @namespace    http://dimio.org/
// @description  Improves the systems state view page
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/view
// @include      http*://spacom.ru/?act=game/view
// @run-at       document-idle
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

  Addons.Stars.StateView = {
    OPT: {
      showRepairPercent: true,
    },

    showShipyardTotalCount() {
      let shipyardTotalCountTemplate =
        '<%='
        + "(ship_count > '0' ? "
        + "'<i class=\"fa fa-wrench help production_ico\" title=\"Уровень ремонта флота за ход, %\"></i>&nbsp;'"
        + " + planets.map(p => p.shipyard_level).reduce((sum, curr) => sum + parseInt(curr, 10), 0)"
        + " : '')"
        + '%>';

      const starInstance = $('#star_instance');
      let starInstanceHtml = starInstance.html().split('</div>');
      starInstanceHtml.splice(starInstanceHtml.length - 3, 1,
        starInstanceHtml[starInstanceHtml.length - 3] + shipyardTotalCountTemplate);
      starInstance.html(starInstanceHtml.join('</div>'));
    },
    init() {
      if (this.OPT.showRepairPercent) {
        this.showShipyardTotalCount();
      }
    },
  }

  Addons.Stars.StateView.init();

})(window);
