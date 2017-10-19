// ==UserScript==
// @name         Spacom::Addons::Design::Extensions
// @version      0.0.5
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
// An "All levels" addon - maked by segray (https://greasyfork.org/ru/scripts/27897-spacom-addons)
console.log( "Spacom::Addons::Design::Extensions" );

(function (window) {
    'use strict';

    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    if (w.self != w.top) {
        return;
    }

    if ( !w.Addons ){
        return false;
    }

    if ( !Addons.Design ){
        Addons.Design = {};
    }

    Addons.Design.ExtraInfo = {
        makeDesignInfoTemplate: function(){
            var designInfoTemplate = document.getElementById("design_info_template").innerHTML;

            designInfoTemplate = designInfoTemplate.replace("lazer_shots'] + '&nbsp;' : '' %>",
                                                            "lazer_shots'] + ' <span class=\"lazer_attack\">&sum;&nbsp;</span>' + params['laser_power_summ'] + '&nbsp;' : '' %>");
            designInfoTemplate = designInfoTemplate.replace("lazer_defence'] + '%&nbsp;' : '' %>",
                                                            "lazer_defence'] + '%&nbsp;(' + params['laser_defence_hp'] + ' hp)&nbsp;<i class=\"fa fa-heart lazer_attack\" title=\"Приведённые очки прочности с учётом защиты от лазеров\"></i>&nbsp;' + params['laser_eq_hp'] + '&nbsp;' : '' %>");
            designInfoTemplate = designInfoTemplate.replace("cannon_defence'] + '&nbsp;' : '' %>",
                                                            "cannon_defence'] + '&nbsp;<i class=\"fa fa-heart cannon_attack\" title=\"Очки прочности с учётом защиты от пушек\"></i>&nbsp;' + params['cannon_hp'] + '&nbsp;' : '' %>");
            /*designInfoTemplate = designInfoTemplate.replace("<button",
*/
            document.getElementById("design_info_template").innerHTML = designInfoTemplate;
        },
        calcLaserPowerSumm: function(params){
            return params.lazer_power * params.lazer_shots;
        },
        calcLaserEqHp: function(params){
            return Math.round( params.hp / (1 - params.lazer_defence/100) );
        },
        calcLaserHp: function(hp, laser_eq_hp){
            return laser_eq_hp - hp;
        },
        calcCannonHp: function(params){
            return params.hp + params.cannon_defence;
        },
        calcShipPower: function(params){
            //Если считать приближенно (точность 95%), то мощь корабля -
            //это корень из произведения его живучести и суммарного урона.
            var shipPower = Math.sqrt( (params.hp + params.cannon_defence + params.laser_defence_hp) *
                                      (params.laser_power_summ + params.cannon_power + params.rocket_power)
                                     );
            shipPower = shipPower / 100; //to percents
            return Math.round(shipPower * 100) / 100; //round
        },
        init: function(){
            var self = this;

            var _designCalc = design.calc;
            design.calc = function() {
                _designCalc.apply(this, arguments);
                design.params.laser_power_summ = self.calcLaserPowerSumm(design.params);
                design.params.laser_eq_hp = self.calcLaserEqHp(design.params);
                design.params.laser_defence_hp = self.calcLaserHp(
                    design.params.hp,
                    design.params.laser_eq_hp
                );
                design.params.cannon_hp = self.calcCannonHp(design.params);
                design.params.ship_power = self.calcShipPower(design.params);
            };

            var _designDraw = design.draw;
            design.draw = function() {
                _designDraw.apply(this, arguments);
                $("#design_info").html(tmpl(document.getElementById("design_info_template").innerHTML, this));
            };

            this.makeDesignInfoTemplate();

            design.calc();
            design.draw();
        },
    };

    Addons.Design.DetailKnownLevel = {
        makeDetailInstanceTemplate: function(){
            var detailInstanceTemplate = document.getElementById("detail_instance").innerHTML;
            detailInstanceTemplate = detailInstanceTemplate.replace(/<%=level%>\n/,
                                                                    '<%=level%><div title="Изученный уровень детали">(<%=known_level%>)</div>');
            document.getElementById("detail_instance").innerHTML = detailInstanceTemplate;
        },
        init: function(){
            for (var i in design.template_components) {
                design.template_components[i].known_level = design.template_components[i].max_level;
            }

            var _Component = w.Component;
            Component = function() {
                //console.log(this);
                _Component.apply(this, arguments);
                var id = parseInt(this.component_id, 10);
                this.known_level = w.design.template_components[id].known_level;
            };

            this.makeDetailInstanceTemplate();
        },
    };

    Addons.Design.AllLevels = {
        // Author: segray (https://greasyfork.org/ru/scripts/27897-spacom-addons)
        enable: function () {
            for (var i in design.template_components) {
                design.template_components[i].max_level = 100;
            }
            design.draw();
        },
        disable: function () {
            for (var i in design.template_components) {
                design.template_components[i].max_level = design.template_components[i]._max_level;
            }
            design.draw();
        },
        init: function () {
            var self = this;
            $("#details_list").prepend('<span><input id="all_levels" type="checkbox"> все уровни</span>');
            $("#all_levels").on("change", function () {
                if ($(this).is(":checked")) {
                    self.enable();
                } else {
                    self.disable();
                }
            });
            for (var i in design.template_components) {
                design.template_components[i]._max_level = design.template_components[i].max_level;
            }
        }
        // Author: segray (https://greasyfork.org/ru/scripts/27897-spacom-addons)
    };

    if (w.Design) {
        w.Addons.waitFor(w, "design", function (design) {
            Addons.Design.ExtraInfo.init();
            Addons.Design.DetailKnownLevel.init();
            // be backwards-compatible with "spacom-addons" userscript by segrey
            if ( !w.Addons.AllLevels ){
                Addons.Design.AllLevels.init();
            }
        });
    }

})(window);
