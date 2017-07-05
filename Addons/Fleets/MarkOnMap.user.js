// ==UserScript==
// @name         Spacom.ru::Addons::Fleets::MarkOnMap
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  none
// @author       dimio
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @encoding     utf-8
// @match        https://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
console.log( 'Spacom.ru::Addons::Fleets::MarkOnMap dev booted' );

(function (window) {
    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    if (w.self != w.top) {
        return;
    }

    if ( !w.Addons.Fleets ){
        w.Addons.Fleets = {};
        // разобр. с насл. методов и обращению к ним
        //Object.setPrototypeOf( w.Addons.Fleets, w.Addons );
    }

    if ( !w.Addons.Fleets.mark_circles ){
        w.Addons.Fleets.mark_circles = {};
    }
    let circles = w.Addons.Fleets.mark_circles;

    w.Addons.Fleets.MarkOnMap = {
        buttonOn: null,
        buttonOff: null,
        enabled: false,

        markFleetsOnMap: function (fleets){
            if (w.backlighted_fleets){
                for (let i in w.backlighted_fleets){
                    const fleet = w.backlighted_fleets[i];

                    //const center = w.Addons.getFleetCenter(fleet);
                    const center = w.getCenterXY(fleet.x, fleet.y);
                    circles[i] = w.Addons.createCircle({
                        x: center.x,
                        y: center.y,
                        radius: 0.8,
                        fill: this.setMarkFillColor(fleet.owner),
                        opacity: 0.5,
                    });
                }
                w.Addons.drawCircles(circles);
            }
        },
        unmarkFleetsOnMap: function (circles){
            circles = w.Addons.Fleets.mark_circles;
            for (let j in circles){
                scene.remove( circles[j] );
                delete circles[j];
            }
        },
        setMarkFillColor: function (fleet_owner){
            if ( fleet_owner == 'own' ){
                return 'blue';
            }

            if ( fleet_owner == 'other' ){
                return 'red';
            }

            if ( fleet_owner == 'pirate' ){
                return 'yellow';
            }

            return 'coral';
        },

        turnOn: function(){
            this.enabled = true;
            this.markFleetsOnMap();
            scene.renderAll();
        },
        turnOff: function(){
            if (this.enabled){
                this.unmarkFleetsOnMap();
                scene.renderAll();
            }
        },
        makeMarkButtons: function (){
            const self = this;
            // Addons.waitMenu.bind(this);
            // разобр., почему не работает this.waitMenu, хотя waitMenu унаследована и вызывается так:
            //Addons.Fleets.waitMenu( $('#items_list > div.row.player_fleet_title'), function(menu) {
            w.Addons.waitMenu( $('#items_list > div.row.player_fleet_title'), function(menu) {
                self.buttonOn = w.createActionButton('Пометить на карте', 'fa fa-eye', 'map-backlight' );
                self.buttonOn.on( "click", self.turnOn.bind(self) );

                self.buttonOff = w.createActionButton('Убрать все пометки', 'fa fa-eye-slash', 'map-backlight' );
                self.buttonOff.on( "click", self.turnOff.bind(self) );

                w.Addons.replaceElemContent( $('div.col-xs-4.col-md-2.fleet_actions')[0], self.buttonOn, self.buttonOff);
            } );
        },
        init: function () {
            this.makeMarkButtons();

            /*const renewMap = map.renewMap;
            map.renewMap = function () {
                renewMap();
                w.Addons.drawCircles(circles);
            };*/
        },
    };

})(window);

