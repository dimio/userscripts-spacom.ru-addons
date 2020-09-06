// ==UserScript==
// @name         Spacom.Addons.Premium.AnomalyView
// @version      0.1.0
// @namespace    http://dimio.org/
// @description  More usability for anomaly-view table on a premium access
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/premium*
// @include      http*://spacom.ru/?act=game/premium*
// @require      https://cdn.datatables.net/1.10.21/js/jquery.dataTables.min.js
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

  Addons.Premium.AnomalyView = {
    OPT: {
      saveTableState: false,
      lng: $('meta[http-equiv=content-language]').attr("content") || "en",
    },

    i18n: {
      'search': {ru: 'Искать', en: 'Search',},
      'zeroRecords': {ru: 'Нет подходящих записей', en: 'Not found',},
    },
    makeEditable(selector, ctx) {
      ctx.datatableApi = $(selector).DataTable(
        $.extend(true, ctx.datatableOpts,
          {
            //row numbers column settings
            "columnDefs": [{
              "searchable": false,
              "orderable": false,
              "targets": 0,
              // "title": "№",
              // "type": "num",
              "contentPadding": "000",
            }],

            "paging": false,
            "info": false,
            "stateSave": this.OPT.saveTableState,
            "language": {
              // "url": "http://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Russian.json",
              "search": this.i18n["search"][this.OPT.lng],
              "zeroRecords": this.i18n["zeroRecords"][this.OPT.lng],
              "decimal": ",",
              "thousands": "&nbsp;",
            }
          }
        ));
      //add rows numbers
      ctx.datatableApi.on('order.dt search.dt', function () {
        ctx.datatableApi.column(0, {search: 'applied', order: 'applied'}).nodes().each(
          function (cell, i) {
            cell.innerHTML = i + 1;
          });
      }).draw();
    },

    init() {
      const anomalyTableSelector = ".fullGridTable";
      //add column for rows numbers
      $(anomalyTableSelector + ' tr').prepend('<td></td>');
      this.makeEditable(anomalyTableSelector, {
          datatableOpts: {
            "order": [
              [0, "asc"],
            ],
          },
        },
      );

      $("thead>tr>td").first().html("№");
      $("td.sorting").html('<i class="fa fa-sort" aria-hidden="true"></i>');
    },
  };

  Addons.Premium.AnomalyView.init();

})(window);
