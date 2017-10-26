// ==UserScript==
// @name         Spacom::Addons::Design::Extensions
// @version      0.0.6
// @namespace    http://dimio.org/
// @description  Extends the functions of a ships constructor
// @author       dimio (dimio@dimio.org)
// @author       segrey
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        https://spacom.ru/?act=design*
// @include      https://spacom.ru/?act=design*
// @run-at       document-end
// ==/UserScript==
//
// An "All levels" addon - maked by segray (https://greasyfork.org/ru/scripts/27897-spacom-addons)
// console.log("Spacom::Addons::Design::Extensions booted");
const ERR_MSG_NOLIB = 'Для работы дополнений необходимо установить Spacom.ru::Addons:<br>' +
    'https://github.com/dimio/userscripts-spacom.ru-addons/raw/master/Addons.user.js';

(function(window) {
    window.unsafeWindow = window.unsafeWindow || window;
    const w = unsafeWindow;

    if (w.self !== w.top) {
        return;
    }
    if (!w.Addons) {
        w.showSmallMessage(ERR_MSG_NOLIB);
        return;
    }
    if (!w.Addons.Design) {
        w.Addons.Design = {};
    }

    w.Addons.Design.ExtraInfo = {
        makeDesignInfoTemplate() {
            let designInfoTemplate = document.getElementById('design_info_template').innerHTML;

            designInfoTemplate = designInfoTemplate.replace("lazer_shots'] + '&nbsp;' : '' %>",
                "lazer_shots'] + ' <span class=\"lazer_attack\">&sum;&nbsp;</span>' + params['laser_power_summ'] + '&nbsp;' : '' %>");
            designInfoTemplate = designInfoTemplate.replace("lazer_defence'] + '%&nbsp;' : '' %>",
                "lazer_defence'] + '%&nbsp;(' + params['laser_defence_hp'] + ' hp)&nbsp;<i class=\"fa fa-heart lazer_attack\" title=\"Приведённые очки прочности с учётом защиты от лазеров\"></i>&nbsp;' + params['laser_eq_hp'] + '&nbsp;' : '' %>");
            designInfoTemplate = designInfoTemplate.replace("cannon_defence'] + '&nbsp;' : '' %>",
                "cannon_defence'] + '&nbsp;<i class=\"fa fa-heart cannon_attack\" title=\"Очки прочности с учётом защиты от пушек\"></i>&nbsp;' + params['cannon_hp'] + '&nbsp;' : '' %>");
            designInfoTemplate = designInfoTemplate.replace(/<br\/>\s*<button/,
                "<%= ( params['ship_power'] > '0') ? '<i class=\"fa fa-percent\" title=\"Примерная боевая эффективность корабля\"></i>&nbsp;' + params['ship_power'] : '' %> <br><br><button");

            document.getElementById('design_info_template').innerHTML = designInfoTemplate;
        },
        calcLaserPowerSumm(params) {
            return params.lazer_power * params.lazer_shots;
        },
        calcLaserEqHp(params) {
            return Math.round(params.hp / (1 - (params.lazer_defence / 100)));
        },
        calcLaserHp(hp, laser_eq_hp) {
            return laser_eq_hp - hp;
        },
        calcCannonHp(params) {
            return params.hp + params.cannon_defence;
        },
        calcShipPower(params) {
            // Если считать приближенно (точность 95%), то мощь корабля -
            // это корень из произведения его живучести и суммарного урона.
            let shipPower = Math.sqrt(params.hp *
                (params.laser_power_summ + params.cannon_power + params.rocket_power)
            );
            shipPower /= 100; // to percents
            return Math.round(shipPower * 100) / 100; // round
        },
        init() {
            const self = this;
            const design = w.design;

            const _designCalc = design.calc;
            design.calc = function() {
                _designCalc.apply(this);
                design.params.laser_power_summ = self.calcLaserPowerSumm(design.params);
                design.params.laser_eq_hp = self.calcLaserEqHp(design.params);
                design.params.laser_defence_hp = self.calcLaserHp(
                    design.params.hp,
                    design.params.laser_eq_hp
                );
                design.params.cannon_hp = self.calcCannonHp(design.params);
                design.params.ship_power = self.calcShipPower(design.params);
            };

            const _designDraw = design.draw;
            design.draw = function() {
                _designDraw.apply(this);
                $('#design_info').html(w.tmpl(document.getElementById('design_info_template').innerHTML, this));
            };

            this.makeDesignInfoTemplate();

            design.calc();
            design.draw();
        },
    };

    w.Addons.Design.DetailKnownLevel = {
        makeDetailInstanceTemplate() {
            let detailInstanceTemplate = document.getElementById('detail_instance').innerHTML;
            detailInstanceTemplate = detailInstanceTemplate.replace(/<%=level%>\n/,
                '<%=level%><div title="Изученный уровень детали">(<%=known_level%>)</div>');
            document.getElementById('detail_instance').innerHTML = detailInstanceTemplate;
        },
        init() {
            const template_components = w.design.template_components;
            for (const i in template_components) {
                if (template_components.hasOwnProperty(i)) {
                    template_components[i].known_level = template_components[i].max_level;
                }
            }

            const _Component = w.Component;
            w.Component = function() {
                // console.log(this);
                _Component.apply(this);
                const id = parseInt(this.component_id, 10);
                this.known_level = w.design.template_components[id].known_level;
            };

            this.makeDetailInstanceTemplate();
        },
    };

    w.Addons.Design.AllLevels = {
        // Author: segray (https://greasyfork.org/ru/scripts/27897-spacom-addons)
        enable() {
            const template_components = w.design.template_components;
            for (const i in template_components) {
                if (template_components.hasOwnProperty(i)) {
                    template_components[i].known_level = template_components[i].max_level;
                }
            }
            w.design.draw();
        },
        disable() {
            const template_components = w.design.template_components;
            for (const i in template_components) {
                if (template_components.hasOwnProperty(i)) {
                    template_components[i].max_level = template_components[i]._max_level;
                }
            }
            w.design.draw();
        },
        init() {
            const self = this;
            $('#details_list').prepend('<span><input id="all_levels" type="checkbox"> все уровни</span>');
            $('#all_levels').on('change', function() {
                if ($(this).is(':checked')) {
                    self.enable();
                }
                else {
                    self.disable();
                }
            });

            const template_components = w.design.template_components;
            for (const i in template_components) {
                if (template_components.hasOwnProperty(i)) {
                    template_components[i]._max_level = template_components[i].max_level;
                }
            }
            // Author: segray (https://greasyfork.org/ru/scripts/27897-spacom-addons)
        },
    };

    if (w.Design) {
        w.Addons.waitFor(w, 'design', () => {
            w.Addons.Design.ExtraInfo.init();
            w.Addons.Design.DetailKnownLevel.init();
            // be backwards-compatible with "spacom-addons" userscript by segrey
            if (!w.Addons.AllLevels) {
                w.Addons.Design.AllLevels.init();
            }
        });
    }

})(window);
