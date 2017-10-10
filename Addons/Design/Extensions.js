// ==UserScript==
// @name         Spacom::Addons::Design::Extensions
// @version      0.0.2
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
       params.laser_power_summ = params.lazer_power * params.lazer_shots;
       return;
    }

    function calcLaserEqHp(params){
        params.laser_eq_hp = Math.round( params.hp / (1 - params.lazer_defence/100) );
        return;
    }

    if (w.Design) {
        w.Addons.waitFor(w, "design", function (design) {
            var _designCalc = design.calc;
            design.calc = function() {
                _designCalc.apply(this, arguments);
                calcLaserPowerSumm(design.params);
                calcLaserEqHp(design.params);
            };

            var _designDraw = design.draw;
            design.draw = function() {
                _designDraw.apply(this, arguments);
                $("#design_info").html(tmpl(document.getElementById("design_info_template").innerHTML, this));
            };

            var designInfoTemplate = document.getElementById("design_info_template").innerHTML;
            designInfoTemplate = designInfoTemplate.replace("lazer_shots'] + '&nbsp;' : '' %>",
                                                            "lazer_shots'] + ' <span class=\"lazer_attack\">&sum;&nbsp;</span>' + params['laser_power_summ'] + '&nbsp;' : '' %>");
            designInfoTemplate = designInfoTemplate.replace("lazer_defence'] + '%&nbsp;' : '' %>",
                                      "lazer_defence'] + '%&nbsp;<i class=\"fa fa-heart lazer_attack\" title=\"Приведённые очки прочности с учётом защиты от лазеров\"></i>&nbsp;' + params['laser_eq_hp'] + '&nbsp;' : '' %>");
            document.getElementById("design_info_template").innerHTML = designInfoTemplate;

            design.calc();
            design.draw();
        });
    }

})(window);
