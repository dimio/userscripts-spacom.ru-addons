// ==UserScript==
// @name         Spacom.Addons.Design.Extensions
// @version      0.1.3
// @namespace    http://dimio.org/
// @description  Extends the functions of a ships constructor
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/design*
// @include      http*://spacom.ru/?act=game/design*
// @run-at       document-end
// ==/UserScript==
// An "All levels" addon - developed by segray (https://greasyfork.org/ru/scripts/27897-spacom-addons)
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

  Addons.Design.OPT = {
    COMPONENT_MAX_LEVEL: 30,
  };

  Addons.Design.ExtraInfo = {
    TEMPLATE: {
      LASER: {
        Attack: "lazer_shots'] + ' <span class=\"lazer_attack\" title=\"Суммарная атака лазеров\">&sum;&nbsp;</span>' + params['laser_power_sum'] + '&nbsp;' : '' %>",
        Defence: "lazer_defence'] + '%&nbsp;(' + params['laser_defence_hp'] + ' hp)&nbsp;<i class=\"fa fa-heart lazer_attack\" title=\"Очки прочности с учётом защиты от лазеров\"></i>&nbsp;' + params['laser_eq_hp'] + '&shy;' : '' %>",
      },
      CANNON: {
        Attack: "cannon_targets'] + ' <span class=\"cannon_attack\" title=\"Суммарная атака пушек\">&sum;&nbsp;</span>' + params['cannon_power_sum'] + '&nbsp;' : '' %>",
        Defence: "cannon_defence'] + '&nbsp;<i class=\"fa fa-heart cannon_attack\" title=\"Очки прочности с учётом защиты от пушек\"></i>&nbsp;' + params['cannon_hp'] + '&nbsp;' : '' %>",
      },
      ROCKET: {
        Attack: "' / ' + params['rocket_fragment_power_1'] + ' / ' + params['rocket_fragment_power_2'] + ",
      },
    },

    makeDesignInfoTemplate() {
      let designInfoTemplate = document.getElementById(
        'design_info_template').innerHTML;
      designInfoTemplate = designInfoTemplate.replace(
        "lazer_shots'] + '&nbsp;' : '' %>", this.TEMPLATE.LASER.Attack);
      designInfoTemplate = designInfoTemplate.replace(
        "lazer_defence'] + '%&nbsp;' : '' %>", this.TEMPLATE.LASER.Defence);
      designInfoTemplate = designInfoTemplate.replace(
        "cannon_defence'] + '&nbsp;' : '' %>", this.TEMPLATE.CANNON.Defence);
      designInfoTemplate = designInfoTemplate.replace(
        "cannon_targets'] + '&nbsp;' : '' %>", this.TEMPLATE.CANNON.Attack);
      designInfoTemplate = designInfoTemplate.replace(
        "' <i class=\"fa fa-compress rocket_attack\"",
        this.TEMPLATE.ROCKET.Attack + "$&");

      const designInfoTemplateTail = `'' %>
        <%= ( params['ship_power'] > '0' ) ?
        '<i class="fa fa-hand-rock-o" title="Примерная боевая эффективность корабля"></i>&nbsp;' + params['ship_power']
        + '&nbsp;'
        : '' %>
        <%= ( params['ship_damage_per_rent'] > '0' ) ?
        '<i class="fa fa-money" title="Повреждений на единицу поддержки"></i>&nbsp;' + params['ship_damage_per_rent']
        : '' %>
        </div>`;
      designInfoTemplate = designInfoTemplate.replace(/'' %>\s*<\/div>/,
        designInfoTemplateTail);

      document.getElementById(
        'design_info_template').innerHTML = designInfoTemplate;
    },
    calcRocketFragmentPower(power) {
      return Math.round(power / 2);
    },
    calcLaserPowerSum(params) {
      return params.lazer_power * params.lazer_shots;
    },
    calcLaserEqHp(params) {
      // return Math.round(params.hp / (1 - (params.lazer_defence / 100)));
      return Addons.GameEngine.calcLaserEqHp(params.hp, params.lazer_defence);
    },
    calcLaserHp(params) {
      return (params.laser_eq_hp) ? params.laser_eq_hp - params.hp
        : Addons.GameEngine.calcLaserHp(params.hp, params.lazer_defence);
    },
    calcCannonHp(params) {
      return params.hp + params.cannon_defence;
    },
    calcCannonPower(params) {
      return Math.round(params.cannon_power_sum / params.cannon_targets);
    },
    calcShipStatsTotal(...args) {
      return args.reduce((total, current) => total + current, 0);
    },
    calcShipPower(params) {
      // Если считать приближенно (точность 95%), то мощь корабля -
      // это корень из произведения его живучести и суммарного урона.
      let shipPower = Math.sqrt(params.hp *
        this.calcShipStatsTotal(params.laser_power_sum,
          params.cannon_power_sum, params.rocket_power)
      );
      return Math.round(shipPower);
    },
    calcShipDpR(params) {
      return +(this.calcShipStatsTotal(
        params.laser_power_sum, params.cannon_power_sum, params.rocket_power)
        / params.money_rent).toFixed(2);
    },
    init() {
      const self = this;
      const design = w.design;
      this.makeDesignInfoTemplate();

      const _designCalc = design.calc;
      design.calc = function () {
        _designCalc.apply(this);

        design.params.laser_power_sum = self.calcLaserPowerSum(design.params);
        design.params.laser_eq_hp = self.calcLaserEqHp(design.params);
        design.params.laser_defence_hp = self.calcLaserHp(design.params);

        design.params.rocket_fragment_power_1 = self.calcRocketFragmentPower(
          design.params.rocket_power);
        design.params.rocket_fragment_power_2 = self.calcRocketFragmentPower(
          design.params.rocket_fragment_power_1);

        design.params.cannon_power_sum = design.params.cannon_power;
        design.params.cannon_power = self.calcCannonPower(design.params);
        design.params.cannon_hp = self.calcCannonHp(design.params);

        design.params.ship_power = self.calcShipPower(design.params);
        design.params.ship_damage_per_rent = self.calcShipDpR(design.params);
      };

      const _designDraw = design.draw;
      design.draw = function () {
        _designDraw.apply(this);
        $('#design_info').html(
          w.tmpl(document.getElementById('design_info_template').innerHTML,
            this));
      };

      design.calc();
      design.draw();
    },
  };

  //FIXME: known levels not show for non-new designs
  Addons.Design.DetailKnownLevel = {
    makeDetailInstanceTemplate() {
      let detailInstanceTemplate = document.getElementById(
        'detail_instance').innerHTML;
      detailInstanceTemplate = detailInstanceTemplate.replace(/<%=level%>\n/,
        '<%=level%><div title="Изученный уровень детали">(<%=known_level%>)</div>');
      document.getElementById(
        'detail_instance').innerHTML = detailInstanceTemplate;
    },
    init() {
      this.makeDetailInstanceTemplate();

      const tc = w.design.template_components;
      for (const i in tc) {
        if (tc.hasOwnProperty(i)) {
          tc[i].known_level = tc[i].max_level;
        }
      }

      const _Component = w.Component;
      w.Component = function () {
        _Component.apply(this, arguments);
        const id = parseInt(this.component_id, 10);
        this.known_level = w.design.template_components[id].known_level;
      };
    },
  };

  Addons.Design.AllLevels = {
    // Based on AllLevels by segray (https://greasyfork.org/ru/scripts/27897-spacom-addons)
    enable() {
      w.design.template_components.forEach(c => {
        c.max_level = Addons.Design.OPT.COMPONENT_MAX_LEVEL;
      });
      w.design.draw();
    },
    disable() {
      w.design.template_components.forEach(c => {
        c.max_level = c._max_level
      });
      w.design.draw();
    },
    init() {
      const self = this;
      $('#details_list').prepend(
        '<span><input id="all_levels" type="checkbox"> все уровни</span>');
      $('#all_levels').on('change', function () {
        if ($(this).is(':checked')) {
          self.enable();
        }
        else {
          self.disable();
        }
      });

      w.design.template_components.forEach(c => {
        c._max_level = c.max_level
      });
    },
  };

  if (w.Design) {
    Addons.Common.waitFor(w, 'design', () => {
      Addons.Design.ExtraInfo.init();
      Addons.Design.DetailKnownLevel.init();
      // be backwards-compatible with "spacom-addons" userscript by segrey
      if (!Addons.AllLevels) {
        Addons.Design.AllLevels.init();
      }
    });
  }

})(window);
