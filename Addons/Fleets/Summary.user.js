// ==UserScript==
// @name         Spacom.Addons.Fleets.Summary
// @version      0.1.1
// @namespace    http://dimio.org/
// @description  none
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
<li>Spacom.Addons.Fleets.Sort</li>
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
  if (!Addons || !Addons.Fleets.Sort) {
    w.showSmallMessage(ERR_MSG.NO_LIB);
    return;
  }

  Addons.Fleets.Summary = {
    OPT: {
      showSummaryFleetsOnTop: true,
      summaryFleetName: 'Итого',
    },
    toSummaryAllButton: null,
    summaryTab: null,
    summaryParams: ['hp', 'laser_hp', 'lazer', 'rocket', 'cannon', 'weight'],
    summaryFleets: {},

    showSummaryFleets(opt) {
      const owner = opt.owner;
      const fleetType = opt.fleetType || 'fleet';

      w.map.clearInfo();
      if ((w.sub_menu = Addons.Fleets.Sort.toggleSubMenu(owner, fleetType, false))
        === false) {
        this.summaryFleets = {}
        this.summaryTab.toggle();
        return false;
      }

      let summary = {};
      for (const ties in this.summaryFleets) {
        if (this.summaryFleets.hasOwnProperty(ties)) {
          this.summaryFleets[ties] = Addons.Sort.uniqueArray(this.summaryFleets[ties]);
          summary[ties] = this.calcSummary(this.summaryFleets[ties], ties)
        }
      }
      summary = Object.values(summary).concat(Object.values(this.summaryFleets).flat());
      if (!this.OPT.showSummaryFleetsOnTop) {
        summary.reverse();
      }
      Addons.Fleets.Sort.drawFleetsTab(summary);
    },
    calcSummary(fleets, owner = '') {
      const summaryFleet = new w.Fleet({
        star_id: w.map.stars[w.map.stars.length - 1].id, //dummy star
        fleet_name: this.OPT.summaryFleetName,
        player_name: " ",
        ico: new Set(),
        hp: 0,
        laser_hp: 0,
        lazer: 0,
        rocket: 0,
        cannon: 0,
        repaired: "",
        health: "",
        weight: 0,
        x: "",
        y: "",
      });
      //map
      fleets.forEach(fleet => {
        this.summaryParams.forEach(param => {
          summaryFleet[param] += parseInt(fleet[param], 10);
        })
        fleet.ico.split(',').forEach(ico => {
          summaryFleet.ico.add(ico);
        })
      })
      summaryFleet.owner = owner;
      summaryFleet.ico = Array.from(summaryFleet.ico).join(',');

      return summaryFleet;
    },
    getFleetOwnerTies(subMenu) {
      if (subMenu.includes('own') || subMenu.includes('peace')) {
        return 'peace';
      }
      return 'other';
    },
    addToCmp() {
      const ties = this.getFleetOwnerTies(w.sub_menu)
      if (!this.summaryFleets[ties]) {
        this.summaryFleets[ties] = [];
      }
      //NOTE: split non-own fleets and garrisons in Fleets.Sort and remove this filter
      this.summaryFleets[ties].push(
        ...Addons.Fleets.Sort.fleets.filter(f => {
          return f.ico !== null && f.ico !== 'garrison.png'
        })
      );
      this.summaryTab.toggle(true);
    },
    addAllToSummaryButton() {
      const self = this;
      const fleetsTitle = $('#items_list .player_fleet_title .fleet_actions');
      Addons.Common.waitObj(fleetsTitle, () => {
        self.toSummaryAllButton = Addons.DOM.createActionButton('Сравнить',
          'fa fa-plus', 'fleets-summary');
        self.toSummaryAllButton.on('click', self.addToCmp.bind(self));

        Addons.DOM.replaceContent(fleetsTitle,
          fleetsTitle.children('button').length === 0,
          self.toSummaryAllButton);
      });
    },
    init() {
      this.addAllToSummaryButton();

      if (!this.summaryTab) {
        const self = this;
        this.summaryTab = Addons.DOM.createNaviBarButton('Сравнить', 6,
          'return false;')
        .on('click',
          self.showSummaryFleets.bind(self, {owner: 'all', fleetType: 'summary'}))
        .toggle();
      }
    },
  };

})(window);