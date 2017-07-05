// ==UserScript==
// @name         Spacom.ru::Addons::Stars::Own::Sort
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Add a sorting on Planets tab
// @author       dimio
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   dimio.org, dimio@dimio.org
// @encoding     utf-8
// @match        http*://spacom.ru/?act=view
// @run-at       document-end
// ==/UserScript==
console.log('Spacom.ru::Addons::Stars::Own::ViewListSort');
// https://jsfiddle.net/hnL8x7kf/

(function (window) {

  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;

  if (w.self !== w.top) {
    return;
  }
  
  // делать повторный запрос в начале скрипта?
  // или как-то "перехватить" оригинальный и сформировать свой массив?

  const flags = {
    sortby_last: null,
    sortby_flag: null,
    filterby_last: null,
  };
  const filters_stack = [];

  w.showPlanets = function (opt) {
    let sortby = opt.sortby || null;

    //let sorted_stars = w.sorted_stars.slice();
    
    
    
    if ( !w.isObjNotEmpry(sorted_stars)) {
      return false;
    }

    for (let i in sorted_stars){
      const star = sorted_stars[i];
      star.image = star.classname[0];
      $('#viewPlanets').append(tmpl("star_instance", star));

      if (w.isObjNotEmpry(star.planets)){
        $.each(star.planets, function (index) {
          star.planets[index].building_turnwait = turnCase(this.building_wait);
          $('#viewPlanets').append(tmpl("planet_instance", this));
        });
      }

      if (star.stations){
        $.each(star.stations, function (index) {
          $('#viewPlanets').append(tmpl("station_instance", this));
        });
      }

    }

    //const filterby = opt.filterby || null;
    //const filter_key = opt.filter_key || null;

    //const exclude_f_flag = opt.exclude_f_flag || false;

    //$("#menu_view").addClass("menu_active");

    const timerID = setInterval(() => {
      const divs = getHeadBlockDivs();
      if (w.isObjNotEmpry(divs)) {
        clearInterval(timerID);
        makeClickableSortingIcons(divs);
        //makeClickableFilteringIcons(divs, owner, fleet_type, sortby);
      }
    }, 0);

    return true;
  };

  function getHeadBlockDivs() {
    const divs = {};
    divs.production_total = $('#viewPlanets > div.viewHeadLine > div.viewHeadBlock.industry.col-xs-2.col-md-1')[0];
    /*divs.player_name = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_name')[0];
    divs.turn = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_state')[0];
    divs.ico = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_ico_list')[0];
    divs.stat = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_stat')[0];*/

    return divs;
  }

  function makeClickableSortingIcons(divs) {
    for (let i in divs) { // i = sortby
      if (w.isVariableDefined(i)) {
        const div = divs[i];

        w.appendElemClickableIcon(div, 'fa-sort', `sort-by-${i}`, 'Отсортировать',
                               `showPlanets({sortby:'${i}'})`);
      }
    }
  }

  function sortStarsBy(sorted_stars, sortby) {
    switch (sortby) {
      case 'production_total':
        sorted_stars.sort(sortStarsByProdTotal);
        break;
      default:
        //sorted_fleets.sort(w.fleetOrder);
        break;
    }

    if (flags.sortby_flag === sortby) {
      sorted_stars.reverse();
      flags.sortby_flag = null;
    }
    else if (w.isVariableDefined(sortby)) {
      flags.sortby_flag = sortby;
    }
    else {
      flags.sortby_flag = null;
    }

    return sorted_stars;
  }

  function sortStarsByProdTotal(a, b) {
    return w.sortNumerically(a.production_total, b.production_total);
  }

})(window);