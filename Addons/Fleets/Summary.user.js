// ==UserScript==
// @name         Spacom.Addons.Fleets.Summary
// @version      0.1.3
// @namespace    http://dimio.org/
// @description  Compare selected fleets and show summary
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/map*
// @include      http*://spacom.ru/?act=game/map*
// @run-at       document-idle
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
    toSummaryOneButton: null,
    toSummaryManyButton: null,
    summaryTab: null,
    summaryParams: ['hp', 'laser_hp', 'lazer', 'rocket', 'cannon', 'weight'],
    summaryFleets: {},
    garrisonIco: 'garrison.png',

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
    getFleetOwnerTies(owner) {
      if (owner.includes('own') || owner.includes('peace')) {
        return 'peace';
      }
      return 'other';
    },
    addToCmp(addFrom, id) {
      let ties;
      switch (addFrom) {
        case 'fleetsTab':
          ties = this.getFleetOwnerTies(w.sub_menu);
          if (!this.summaryFleets[ties]) {
            this.summaryFleets[ties] = [];
          }
          //NOTE: split non-own fleets and garrisons in Fleets.Sort and remove this filter
          this.summaryFleets[ties].push(
            ...Addons.Fleets.Sort.fleets.filter(f => {
              return f.ico !== null && f.ico !== this.garrisonIco
            })
          );
          break;
        case 'starOne':
        case 'starMany':
          const fleets = (addFrom === 'starOne') ?
            new Array(w.map.fleets[id]) :
            w.map.fleets.filter(f => {
              return +f.star_id === id && f.ico !== null && f.ico !== this.garrisonIco
            })
          fleets.forEach(f => {
            ties = this.getFleetOwnerTies(f.owner);
            if (!this.summaryFleets[ties]) {
              this.summaryFleets[ties] = [];
            }
            this.summaryFleets[ties].push(f);
          })
          break;
      }
      this.summaryTab.toggle(true);
    },
    // NOTE: to be compatible on MarkOnMap
    //  (maybe use jQuery template, like a addButtonManyFromStar?)
    addButtonAllFromFleetsTab() {
      const self = this;
      const fleetsTitleAction = $('#items_list .player_fleet_title .fleet_actions');
      Addons.Common.waitObj(fleetsTitleAction, () => {
        self.toSummaryAllButton = Addons.DOM.createActionButton('Сравнить',
          'fa fa-plus', 'fleets-summary-from-tab');
        self.toSummaryAllButton.on('click', self.addToCmp.bind(self, 'fleetsTab'));

        Addons.DOM.replaceContent(fleetsTitleAction,
          fleetsTitleAction.children('button').length === 0,
          self.toSummaryAllButton);
      });
    },
    addButtonOneFromStar() {
      this.toSummaryOneButton = Addons.DOM.createActionButton('Сравнить',
        'fa fa-plus', 'fleets-summary-one');
      this.toSummaryOneButton.attr('onclick',
        "Addons.Fleets.Summary.addToCmp(\"starOne\", <%=fleet_id%>)");
      let toSummaryOneButtonHtml =
        '<% if'
        + '(sub_menu !== "fleets_all_summary" && '
        + 'map.fleets[fleet_id].ico !== null && map.fleets[fleet_id].ico !== "garrison.png")'
        + ' { %>' +
        this.toSummaryOneButton.get(0).outerHTML.replace('</button>', '') +
        '<% } %>';

      const fleetInstance = $('#fleet_instance');
      let fleetInstanceHtml = fleetInstance.html().split('</button>');
      fleetInstanceHtml.splice(fleetInstanceHtml.length - 1, 0, toSummaryOneButtonHtml);
      fleetInstance.html(fleetInstanceHtml.join('</button>'));
    },
    addButtonManyFromStar() {
      this.toSummaryManyButton = Addons.DOM.createActionButton('Сравнить все',
        'fa fa-plus', 'fleets-summary-many');
      this.toSummaryManyButton.attr('onclick',
        "Addons.Fleets.Summary.addToCmp(\"starMany\", <%=star.id%>)");
      let toSummaryManyButtonHtml =
        '<% if (!sub_menu && star.id) { %>' +
        this.toSummaryManyButton.get(0).outerHTML +
        '<% } %>';

      const fleetsTitle = $('#fleets_title');
      let fleetsTitleHtml = fleetsTitle.html().split('</div>');
      fleetsTitleHtml[fleetsTitleHtml.length - 3] =
        fleetsTitleHtml[fleetsTitleHtml.length - 3].replace('Корабли', '');
      fleetsTitleHtml[fleetsTitleHtml.length - 3] += toSummaryManyButtonHtml;
      fleetsTitle.html(fleetsTitleHtml.join('</div>'));
    },
    init() {
      if (w.sub_menu) {
        this.addButtonAllFromFleetsTab();
      }
      if (!this.toSummaryOneButton) {
        this.addButtonOneFromStar();
      }
      if (!this.toSummaryManyButton) {
        this.addButtonManyFromStar();
      }
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

  //TODO: Fleets.Sort:
  /**
   * if (Addons.Fleets.Summary) {
   * Addons.Fleets.Summary.init();
   * // Addons.Fleets.Summary.addButtonAllFromFleetsTab();
   * }
   *
   * and add this to init //function clickFleet(fleet_id)
   * */
  const _clickMapStar = w.map.clickMapStar;
  w.map.clickMapStar = function (id, fleet_id) {
    w.sub_menu = false;
    _clickMapStar.call(w.map, ...arguments);
  }

  Addons.Fleets.Summary.init();

})(window);
