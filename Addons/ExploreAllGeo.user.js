// ==UserScript==
// @name         Spacom.ru::Addons::ExploreAllGeo
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  Geo-exploring auto buying
// @author       dimio
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @encoding 	 utf-8
// @match        https://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
// Based on "Spacom addons" by segrey (https://greasyfork.org/en/scripts/27897-spacom-addons https://spacom.ru/forum/discussion/47/polzovatelskie-skripty)
console.log( 'Spacom::Addons::ExploreAllGeo booted' );

const EXPLORE_COST = 25;

(function (window, undefined) {
// https://habrahabr.ru/post/129343/
	window.unsafeWindow = window.unsafeWindow || window;
	var w = unsafeWindow;

    if (w.self != w.top) {
        return;
    }

    function waitFor( obj, prop, callback ){
		var token = setInterval(function () {
			if (obj[prop] !== undefined) {
				clearInterval(token);
				callback(obj[prop]);
			}
		}, 0);
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

				for ( let i in map.fleets ) {
					fleet = map.fleets[i];
					//console.log( fleet );

					if ( fleet.owner == "own" ) {
						if ( fleet.allow_explore == "1" ){
							fleets_allow_explore.push( fleet );
						}
					}
				}

				/*result = prompt( "Доступно систем для разведки: " + fleets_allow_explore.length + " за " +
								fleets_allow_explore.length * EXPLORE_COST + " кредитов. " +
								"Разведать: ", fleets_allow_explore.length );*/
				if ( fleets_allow_explore.length ){ //не слишком большие накладные на многократное вычисление размера массива?
					var explore_all = confirm( 'Разведать ' + fleets_allow_explore.length +
											  ' систем за ' +
											  fleets_allow_explore.length * EXPLORE_COST + ' кредитов?' );
					if ( explore_all ){
						// поискать скорость работы foreach и for/while-shift
						fleets_allow_explore.forEach( function( fleet, i, arr ) {
							map.fleets[fleet.fleet_id].clickExplore();
						});
	                    //waitFor( w, "$", function(){ document.getElementsByClassName('btn')[0].onclick(); } );
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