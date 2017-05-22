// ==UserScript==
// @name         Spacom.ru::Addons::ExploreAllGeo
// @namespace    http://tampermonkey.net/
// @version      0.2.2
// @description  Geo-exploring auto buying
// @author       dimio
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   dimio.org, dimio@dimio.org
// @encoding     utf-8
// @match        http*://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
//
// TODO:    не всегда успевает обновить лист флотов - попр. решить;
//          если над сист. неск. флотов готово к разв. - будет "ошибка" разведки или неверно посчитана её стоимость (больше фактической);
//
console.log( 'Spacom::Addons::ExploreAllGeo booted' );
//console.log( GM_info );

const EXPLORE_COST = 25;
var EXPLORE_MESSAGE_OK = 'Будет разведано систем: X. Результат разведки станет доступен через 1 ход. Это стоило вам N кредитов.';
var EXPLORE_MESSAGE_ERR = 'Разведка не окончена. Недостаточно денег для проведения разведки? Требуется ' +EXPLORE_COST+ ' кредитов. Было истрачено N кредитов. Перезагрузите страницу и проведите разведку вручную.';
var EXPLORE_MESSAGE_ERR_MONEY = 'Недостаточно денег для проведения разведки. Требуется N кредитов, баланс - X кредитов.';

(function ( window, undefined ) {
    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    if ( w.self != w.top ) {
        return;
    }

    function createMapButton ( css, id, title ) {
        var last = $("#radar + div");
        var next = $('<div id="' +id+ '" title="' +title+ '"><i class="fa ' +css+ ' fa-2x"></i></div>').css( {
            "z-index": last.css("z-index"),
            "position": last.css("position"),
            "cursor": last.css("cursor"),
            "color": last.css("color"),
            "right": last.css("right"),
            "bottom": (parseInt(last.css("bottom")) + 40) + "px"
        } );
        last.before( next );
        return next;
    }

    if ( /https:\/\/spacom.ru/.test(w.location.href) ){

        if ( !w.Addons ){
            w.Addons = {};
        }

        Addons.ExploreAll = {
            button: null,
            enabled: false,

            exploreAll: function () {
                var fleets_allow_explore = [];

                var fleet;
                var explore_all_cost;

                var money = +document.getElementsByClassName('turn money')[1].innerText.split('/')[0];

                for ( let i in map.fleets ) {
                    fleet = map.fleets[i];

                    // $fleet->{'owner'} = value
                    if ( fleet.owner == "own" && +fleet.allow_explore === 1 ) {
                        fleets_allow_explore.push( fleet.fleet_id );
                    }
                }

                var fleets_allow_explore_cnt = fleets_allow_explore.length;
                explore_all_cost = +fleets_allow_explore_cnt * +EXPLORE_COST;

                if ( money < explore_all_cost ){
                    let message = EXPLORE_MESSAGE_ERR_MONEY.replace( 'N', explore_all_cost );
                    message = message.replace( 'X', money );
                    w.showSmallMessage( message );
                    return false;
                    // ? throw 'Not enough money';
                }
                else if ( fleets_allow_explore.length ){
                    var explore_all = confirm( 'Разведать ' + fleets_allow_explore_cnt +
                                              ' систем за ' +
                                              explore_all_cost + ' кредитов?' );
                    if ( explore_all ){

                        let explore_status = 1;
                        while ( fleets_allow_explore.length !== 0 && explore_status === 1 ){
                            let fleet_id = fleets_allow_explore.shift();
                            var json_fleets = $.getJSON( APIUrl() + '&act=map&task=fleets&order=explore&fleet_id=' + fleet_id + '&format=json', {}, function ( json ) {
                                if ( +json.explore.status !== 1 ){
                                    explore_status = 0;
                                }
                                return json;
                            } );
                        }

                        let timeoutID = w.setInterval( function(){
                            if ( fleets_allow_explore.length === 0 && explore_status === 1 && json_fleets.responseJSON ){
                                w.clearInterval( timeoutID );
                                let message = EXPLORE_MESSAGE_OK.replace( 'N', explore_all_cost );
                                message = message.replace( 'X', fleets_allow_explore_cnt );
                                w.showSmallMessage( message );
                                map.removeAllFleets();
                                map.jsonToFleets( json_fleets.responseJSON );
                                map.drawFleets();
                                w.parseAnswer( json_fleets.responseJSON, '' );
                            }
                            else if ( explore_status === 0 ){
                                w.clearInterval( timeoutID );
                                let message = EXPLORE_MESSAGE_ERR.replace( 'N', +fleets_allow_explore.length * +EXPLORE_COST );
                                w.showSmallMessage( message );
                            }
                        }, 0 );

                    }
                    /*else { alert( "Массовая разведка отменена." ); }*/
                }
                else {
                    w.showSmallMessage( 'Нет готовых к разведке флотов.' );
                }

            },

            turnOn: function ( flag ){
                this.enabled = flag;
                this.exploreAll();
            },
            toggle: function () {
                this.turnOn( !this.enabled );
            },
            init: function () {
                var self = this;
                this.button = w.createMapButton( 'fa-wpexplorer', 'spacom-addons-exploreallgeo', 'Заказать массовую георазведку систем' );
                this.button.on( 'click', this.toggle.bind( this ) );
            }
        };

        if ( w.map ) {
            Addons.ExploreAll.init();
        }
    }
})(window);