// ==UserScript==
// @name         Spacom.ru::Addons::ExploreAllGeo
// @namespace    http://tampermonkey.net/
// @version      0.1.7
// @description  Geo-exploring auto buying
// @author       dimio
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @encoding     utf-8
// @match        https://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
// Based on "Spacom addons" by segrey (
// https://greasyfork.org/en/scripts/27897-spacom-addons
// https://spacom.ru/forum/discussion/47/polzovatelskie-skripty)

console.log( 'Spacom::Addons::ExploreAllGeo booted' );
//console.log( GM_info );

const EXPLORE_COST = 25;
var EXPLORE_MESSAGE_OK = 'Разведка начата. Результат разведки будет доступен через 1 ход. Это стоило вам N кредитов.';
var EXPLORE_MESSAGE_ERR = 'Недостаточно денег для проведения разведки. Требуется ' +EXPLORE_COST+ ' кредитов. Было истрачено N кредитов.';

(function (window, undefined) {
    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    if (w.self != w.top) {
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

                for ( let i in map.fleets ) {
                    fleet = map.fleets[i];

                    // $fleet->{'owner'} = value
                    if ( fleet.owner == "own" && +fleet.allow_explore === 1 ) {
                        fleets_allow_explore.push( fleet.fleet_id );
                    }
                }

                explore_all_cost = +fleets_allow_explore.length * +EXPLORE_COST;

                if ( fleets_allow_explore.length ){
                    var explore_all = confirm( 'Разведать ' + fleets_allow_explore.length +
                                              ' систем за ' +
                                              explore_all_cost + ' кредитов?' );
                    if ( explore_all ){

                        let explore_status = 1;
                        while ( fleets_allow_explore.length !== 0 && explore_status === 1 ){
                            let fleet_id = fleets_allow_explore.shift();
                            // м.б. читать ост. кред. и сравн. с остаточн. ценой разв.?
                            var json_fleets = $.getJSON( APIUrl() + '&act=map&task=fleets&order=explore&fleet_id=' + fleet_id + '&format=json', {}, function ( json ) {
                                if ( +json.explore.status !== 1 ){
                                    //w.showSmallMessage( EXPLORE_MESSAGE_ERR );
                                    explore_status = 0;
                                }
                                return json;
                            } );
                        }

                        let timeoutID = w.setInterval( function(){
                            if ( fleets_allow_explore.length === 0 && explore_status === 1 && json_fleets.responseJSON ){
                                w.clearInterval( timeoutID );
                                let message = EXPLORE_MESSAGE_OK.replace( 'N', explore_all_cost );
                                w.showSmallMessage( message );
                                map.removeAllFleets();
                                map.jsonToFleets( json_fleets.responseJSON );
                                map.drawFleets();
                                w.parseAnswer( json_fleets.responseJSON, '' );
                            }
                            else if ( explore_status === 0 && json_fleets.responseJSON ){
                                w.clearInterval( timeoutID );
                                let message = EXPLORE_MESSAGE_ERR.replace( 'N', +fleets_allow_explore.length * +EXPLORE_COST );
                                w.showSmallMessage( message );
                                map.removeAllFleets();
                                map.jsonToFleets( json_fleets.responseJSON );
                                map.drawFleets();
                                w.parseAnswer( json_fleets.responseJSON, '' );
                            }
                            else { alert( 'Разведка не была проведена. Неизвестная ошибка' ); }
                        }, 0 );

                    }
                    /*else { alert( "Массовая разведка отменена." ); }*/
                }
                else {
                    alert( 'Нет готовых к разведке флотов.' );
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
                this.button = createMapButton( 'fa-wpexplorer', 'spacom-addons-exploreallgeo', 'Заказать массовую георазведку систем' );
                this.button.on( "click", this.toggle.bind(this) );
            }
        };

        if (w.map) {
            Addons.ExploreAll.init();
        }
    }
})(window);