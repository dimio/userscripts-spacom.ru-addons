// ==UserScript==
// @name         Spacom.ru::Addons::ExploreAllGeo
// @namespace    http://tampermonkey.net/
// @version      0.1.6
// @description  Geo-exploring auto buying
// @author       dimio
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @encoding 	 utf-8
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
var EXPLORE_MESSAGE_ERR = 'Недостаточно денег для проведения разведки. Требуется ' +EXPLORE_COST+ ' кредитов.';

(function (window, undefined) {
    // https://habrahabr.ru/post/129343/
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
                //var fleets_allow_explore = [ "468", "530", "707", "734", "790", "799", "840", "866", "898", "1034", "1103", "1192", "1287" ]; //DBG
                var fleet;
                var explore_all_cost;

                for ( let i in map.fleets ) {
                    fleet = map.fleets[i];

                    // $fleet->{'owner'} = value
                    // $hash_name -ref_to_anonhash-> {key} = value
                    if ( fleet.owner == "own" && +fleet.allow_explore === 1 ) {
                        fleets_allow_explore.push( fleet.fleet_id );
                    }
                }

                explore_all_cost = +fleets_allow_explore.length * +EXPLORE_COST;
                /*result = prompt( "Доступно систем для разведки: " + fleets_allow_explore.length + " за " +
								fleets_allow_explore.length * EXPLORE_COST + " кредитов. " +
								"Разведать: ", fleets_allow_explore.length );*/
                if ( fleets_allow_explore.length ){ //не слишком большие накладные на многократное вычисление размера массива?
                    var explore_all = confirm( 'Разведать ' + fleets_allow_explore.length +
                                              ' систем за ' +
                                              explore_all_cost + ' кредитов?' );
                    if ( explore_all ){
                        // поискать скорость работы foreach и for/while-shift
                        //fleets_allow_explore.forEach( function( fleet, i, arr ) {

                        let explore_status = 1;
                        //outer:
                        while ( fleets_allow_explore.length !== 0 && explore_status === 1 ){
                            let fleet_id = fleets_allow_explore.shift();

                            var json_fleets = $.getJSON( APIUrl() + '&act=map&task=fleets&order=explore&fleet_id=' + fleet_id + '&format=json', {}, function ( json ) {
                                //console.log( json );
                                if ( +json.explore.status !== 1 ){
                                    w.showSmallMessage( EXPLORE_MESSAGE_ERR );
                                    explore_status = 0;
                                    //break outer;
                                }
                                return json;
                            } );
                            //break; //DBG
                        }

                        let timeoutID = w.setInterval( function(){
                            if ( fleets_allow_explore.length === 0 && json_fleets.responseJSON ){
                            //if ( json_fleets.responseJSON ){ //DBG
                                w.clearInterval( timeoutID );
                                let message = EXPLORE_MESSAGE_OK.replace( 'N', explore_all_cost );
                                w.showSmallMessage( message );
                                //console.log( "json_fleets.responseJSON is:\n" );
                                //console.log ( json_fleets.responseJSON );
                                map.removeAllFleets();
                                map.jsonToFleets( json_fleets.responseJSON );
                                map.drawFleets();
                                w.parseAnswer( json_fleets.responseJSON, '' );
                            }
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