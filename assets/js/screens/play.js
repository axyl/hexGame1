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

        // Adding New units - clicky event for any adding new unit button.
        // TODO : Move this !!!!
        $(".spawnUnit").click(function(event) {
            // Which player and unit?
            var currentButton= event.target.id;
            var unitID= 0;
            switch (currentButton) {
                case "newATInfantry":
                    (currentTeam()== 1) ? unitID= 4 : unitID= 3; 
                    break;
                case "newAPC":
                    (currentTeam()== 1) ? unitID= 7 : unitID= 8; 
                    break;
                case "newTank":
                    (currentTeam()== 1) ? unitID= 6 : unitID= 5; 
                    break;
                default:
                    (currentTeam()== 1) ? unitID= 2 : unitID= 1; 
            }

            console.log('Adding Unit ID: '+ unitID+ ', player: '+ currentPlayer()+ ', team: '+ currentTeam());

            io.socket.post('/PlayerUnit/NewUnit',{player:currentPlayer(),unit:unitID}, function (data) {
                window.alert(data.msg);
            });
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

        // New unit added to map
        // TODO : This and the initial fetch below...combine the damn thing!
        io.socket.on('NewPlayerUnit', function(msg) {
            var newUnit= msg.newUnit;
            console.log('New Player Unit: '+ newUnit);
            var unitPos= cubetoOffset({x:newUnit.posCubeX,y:newUnit.posCubeY, z:newUnit.posCubeZ});
            var pixelPos= me.game.tmxRenderer.tileToPixelCoords(unitPos.col, unitPos.row);
            tank= new game.ATInfantryEntity(pixelPos.x, pixelPos.y, {image:newUnit.unit.icon,name:newUnit.unitId});
            tank.health= newUnit.health;
            tank.strength= newUnit.unit.strength;
            tank.cubePos= new Cube(newUnit.posCubeX, newUnit.posCubeY, newUnit.posCubeZ);
            tank.player= newUnit.player;
            if (newUnit.order!=undefined && newUnit.order.movePath!= undefined) {
                tank.movePath= newUnit.order.movePath;
            } else {
                tank.movePath= [];
            }


            me.game.world.addChild(tank);
            $("#lastGameMessage").text= "A new unit appears!";


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