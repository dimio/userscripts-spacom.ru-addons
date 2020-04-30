// ==UserScript==
// @name         Spacom.Addons.Fleets.Show
// @version      0.1.3
// @namespace    http://dimio.org/
// @description  Some improvements on fleet show window
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/map*
// @include      http*://spacom.ru/?act=game/map*
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

  Addons.Fleets.Show = {
    OPT: {
      showShipsCount: true,
      showSystemName: true,
    },
    shipsCount: {
      calc(ships) {
        const shipCount = {};
        //garrison ships not defined
        if (Addons.Common.isVariableDefined(ships)) {
          ships.forEach((ship) => {
            shipCount[ship.image] = (shipCount[ship.image] || 0) + 1;
          });
        }
        return shipCount;
      },
      show(shipCount) {
        $('.fleet_ico_container').each(
          function () {
            $(this).append(
              shipCount[$(this).children('img').attr('src').split(
                '/')[3]]);
          }
        )
      },
    },
    systemName: {
      showOnFleetBlock() {
        const fleetBlockTmpl = $('#fleet_instance');
        fleetBlockTmpl.html(fleetBlockTmpl.html().replace('y +',
          '$& "<br><span>" + map.stars[star_id].name + "</span>" + '));
      },
    },

    init() {
      if (this.OPT.showSystemName) {
        this.systemName.showOnFleetBlock();
      }

      if (this.OPT.showShipsCount) {
        const self = this;
        const _showFleetShips = w.map.showFleetShips;
        w.map.showFleetShips = (function (json) {
          _showFleetShips.call(this, json);
          self.shipsCount.show(
            self.shipsCount.calc(json.fleets.fleet.ships)
          );
        });
      }
    }
  };

  Addons.Fleets.Show.init();

})(window);