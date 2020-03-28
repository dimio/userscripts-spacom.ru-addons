// ==UserScript==
// @name         Spacom.Addons.Fleets.Show
// @version      0.0.1
// @namespace    http://dimio.org/
// @description  Some improvements on fleet show window
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/map*
// @run-at       document-end
// ==/UserScript==

const ERR_MSG = {
  NO_LIB: `Для работы дополнений необходимо установить и включить Spacom.Addons:<br>
https://github.com/dimio/userscripts-spacom.ru-addons/raw/master/Addons/Addons.user.js`,
};

(function (window) {
  'use strict';

  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;

  if (w.self !== w.top) {
    return;
  }
  if (!w.Addons) {
    w.showSmallMessage(ERR_MSG.NO_LIB);
    return;
  }
  if (!w.Addons.Fleets) {
    w.Addons.Fleets = {};
  }

  w.Addons.Fleets.Show = {
    showShipsCount() {
      const shipTypes = [];

      w.Addons.waitFor(w.$('#ships_info'), 'length', () => {
        w.$('.ships_info > div').each(
            function () {
              shipTypes.push(w.$(this).attr('data-ship'));
            }
        )

        let shipCount = shipTypes.reduce(function (acc, el) {
          acc[el] = (acc[el] || 0) + 1;
          return acc;
        }, {});

        w.$('.fleet_ico_container').each(
            function () {
              w.$(this).append(
                  shipCount[w.$(this).children('img').attr('src').split(
                      '/')[3]]);
            }
        )
      })
    },

    init() {
      const _showBlockFleet = w.map.showBlockFleet;
      w.map.showBlockFleet = function () {
        _showBlockFleet.apply(this, arguments);
        w.Addons.Fleets.showFleet.showShipsCount();
      };
    }
  }

  w.Addons.Fleets.showFleet.init();
})();