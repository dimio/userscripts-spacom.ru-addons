// ==UserScript==
// @name         Spacom::Addons::Design::Extensions
// @version      0.0.3
// @namespace    http://dimio.org/
// @description  Extends the functions of a ships constructor
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        https://spacom.ru/?act=design*
// @run-at       document-end
// ==/UserScript==
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

    function calcLaserPowerSumm(params){
        return params.lazer_power * params.lazer_shots;
    }

    function calcLaserEqHp(params){
        return Math.round( params.hp / (1 - params.lazer_defence/100) );
    }

    function calcLaserHp(hp, laser_eq_hp){
        return laser_eq_hp - hp;
    }

    function calcCannonHp(params){
        return params.hp + params.cannon_defence;
    }

    function makeDesignInfoTemplate() {
        var designInfoTemplate = document.getElementById("design_info_template").innerHTML;

        designInfoTemplate = designInfoTemplate.replace("lazer_shots'] + '&nbsp;' : '' %>",
                                                        "lazer_shots'] + ' <span class=\"lazer_attack\">&sum;&nbsp;</span>' + params['laser_power_summ'] + '&nbsp;' : '' %>");
        designInfoTemplate = designInfoTemplate.replace("lazer_defence'] + '%&nbsp;' : '' %>",
                                                        "lazer_defence'] + '%&nbsp;(' + params['laser_hp'] + ' hp)&nbsp;<i class=\"fa fa-heart lazer_attack\" title=\"Приведённые очки прочности с учётом защиты от лазеров\"></i>&nbsp;' + params['laser_eq_hp'] + '&nbsp;' : '' %>");
        designInfoTemplate = designInfoTemplate.replace("cannon_defence'] + '&nbsp;' : '' %>",
                                                        "cannon_defence'] + '&nbsp;<i class=\"fa fa-heart cannon_attack\" title=\"Очки прочности с учётом защиты от пушек\"></i>&nbsp;' + params['cannon_hp'] + '&nbsp;' : '' %>");

        document.getElementById("design_info_template").innerHTML = designInfoTemplate;
    }

    if (w.Design) {
        w.Addons.waitFor(w, "design", function (design) {
            var _designCalc = design.calc;
            design.calc = function() {
                _designCalc.apply(this, arguments);
                design.params.laser_power_summ = calcLaserPowerSumm(design.params);
                design.params.laser_eq_hp = calcLaserEqHp(design.params);
                design.params.laser_hp = calcLaserHp(
                    design.params.hp,
                    design.params.laser_eq_hp
                );
                design.params.cannon_hp = calcCannonHp(design.params);
            };

            var _designDraw = design.draw;
            design.draw = function() {
                _designDraw.apply(this, arguments);
                $("#design_info").html(tmpl(document.getElementById("design_info_template").innerHTML, this));
            };

            makeDesignInfoTemplate();

            design.calc();
            design.draw();
        });
    }

})(window);
