// ==UserScript==
// @name         Spacom.Addons.Stars.PlanetStats
// @version      0.1.1
// @namespace    http://dimio.org/
// @description  Show summary planets stats in star system window
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

  w.Addons.Stars.PlanetStats = {
    STATS_TOTAL: {
      'populationmax_base': 0,
      'food_base': 0,
      'production_base': 0,
      'science_base': 0,
      'money_base': 0,
    },
    calcTotalStats(planets) {
      planets.forEach((planet) => {
        for (let stat in this.STATS_TOTAL) {
          this.STATS_TOTAL[stat] += parseInt(planet[stat], 10);
        }
      });
    },
    clearTotalStats() {
      for (let stat in this.STATS_TOTAL) {
        this.STATS_TOTAL[stat] = 0;
      }
    },
    init() {
      this.makeTotalStatsTemplate();

      const self = this;
      const _showStarPlanets = w.map.showStarPlanets;

      w.map.showStarPlanets = function (json) {
        if (json.star.planets && json.star.planets.length > 0) {
          self.clearTotalStats();
          self.calcTotalStats(json.star.planets);
        }
        _showStarPlanets.call(this, json);
        $("#items_list .row.player_fleet_title .col-xs-12.col-md-4").append(
          w.tmpl("planets_total_stats", self));
      };
    },
    makeTotalStatsTemplate() {
      let planetsStatsTotalTemplate = document.createElement('script');
      planetsStatsTotalTemplate.setAttribute('type', 'text/html');
      planetsStatsTotalTemplate.setAttribute('id', 'planets_total_stats');
      planetsStatsTotalTemplate.innerHTML = `
<%
if (typeof STATS_TOTAL != 'undefined' && !isNaN(STATS_TOTAL.populationmax_base)){
%>
<br>
  <div class="planet_stat">
    <div class="population_max">
      <i class="fa fa-globe fa-lg ico" title="Суммарная базовая вместимость системы"></i>
      <br>
      <span><%=STATS_TOTAL.populationmax_base%></span>
    </div>
    <div class="food">
      <i class="fa fa-cutlery fa-lg ico" title = "Суммарное базовое плодородие системы"></i>
      <br>
      <span><%=STATS_TOTAL.food_base%></span>
    </div>
    <div class="industry">
      <i class="fa fa-cogs fa-lg ico" title = "Суммарная базовая производительность системы"></i>
      <br>
      <span><%=STATS_TOTAL.production_base%></span>
    </div>
    <div class="science">
      <i class="fa fa-flask fa-lg ico" title = "Суммарная базовая наука системы"></i>
      <br>
      <span><%=STATS_TOTAL.science_base%></span>
    </div>
    <div class="money">
      <i class="fa fa-circle-o fa-lg ico" title = "Суммарное базовое богатство системы"></i>
      <br>
      <span><%=STATS_TOTAL.money_base%></span>
    </div>
  </div>
<%
}
%>
`;
      document.getElementById("allcontent").appendChild(
        planetsStatsTotalTemplate);
    },
  };

  Addons.Stars.PlanetStats.init();

})(window);
