game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {
        // load a level
        me.levelDirector.loadLevel("hexagonal-mini");
		
		me.input.bindKey(me.input.KEY.S, "down");
		me.input.bindKey(me.input.KEY.W, "up");
		
		// Check for key press
		this.handler = me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
			
			if (action==="down") {
				me.game.viewport.move(0,10);
			}
			if (action==="up") {
				me.game.viewport.move(0,-10);
			}
		});

        io.socket.on('GameMessages', function(msg) {
            var currentDate= new Date();
            $("#lastGameMessage").text(currentDate.getHours()+':'+ currentDate.getMinutes()+ ':'+ currentDate.getSeconds()+ ' - '+ msg.msg);
        });

		// Listen for updates from the socket server.
		io.socket.on('PlayerUnit', function(obj) {
		//io.socket.on('message', function(obj) {

			console.log("Socket Update: "+ obj);

            $("#lastGameMessage").text= "Move path updated.";
			
				// Find the unit by ID and change it's movePath.
				var affectedUnit= me.game.world.getChildByName(obj.playerUnit);
                affectedUnit[0].movePath= obj.movePath;

                // Is there also a position move?
                if (obj.posCubeX!= undefined) {
                    var unitPos= cubetoOffset({x:obj.posCubeX,y:obj.posCubeY, z:obj.posCubeZ});
                    var pixelPos= me.game.tmxRenderer.tileToPixelCoords(unitPos.col, unitPos.row);
                    affectedUnit[0].cubePos.x= obj.posCubeX;
                    affectedUnit[0].cubePos.y= obj.posCubeY;
                    affectedUnit[0].cubePos.z= obj.posCubeZ;
                    affectedUnit[0].pos.set(pixelPos.x, pixelPos.y);
                }        




			

		});

		// Load the existing unit positions.
		io.socket.get('/PlayerUnit', function (data, jwres) {

			for (var index= 0; index< data.length; index++){
			    var unitPos= cubetoOffset({x:data[index].posCubeX,y:data[index].posCubeY, z:data[index].posCubeZ});
				var pixelPos= me.game.tmxRenderer.tileToPixelCoords(unitPos.col, unitPos.row);
				tank= new game.ATInfantryEntity(pixelPos.x, pixelPos.y, {image:data[index].unit.icon,name:data[index].unitId});
                tank.health= data[index].health;
                tank.strength= data[index].unit.strength;
                tank.cubePos= new Cube(data[index].posCubeX, data[index].posCubeY, data[index].posCubeZ);
                tank.player= data[index].player;
                if (data[index].order!=undefined && data[index].order.movePath!= undefined) {
                    tank.movePath= data[index].order.movePath;
                } else {
                    tank.movePath= [];
                }



				me.game.world.addChild(tank);


			} 

			
		});
    
		
    },

    /**
     *  action to perform on state change
     */
    onDestroyEvent: function() {
    }
	
});