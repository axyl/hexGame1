/**
 * MapController
 *
 * @description :: Server-side logic for managing maps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var tmx= require('tmx-parser');	// The TMX Map Parser

function offsetCoord(col,row) {
	return {col:col, row:row};
};

function cubetoOffset(cube) {
	var col= cube.x;
	var row= cube.z+ (cube.x- (cube.x%2))/ 2;
	return offsetCoord(col,row);
};

// How many steps do we need to advance to move into this tile?
function getNeededSteps(offsetPos, unit, loadedMap) {
	var steps= 0;
	sails.log('Unit is at position', offsetPos);

	// What types of terrain types do we have?
	for (var loopTiles= 0; loopTiles< loadedMap.layers.length; loopTiles++)	{
		if (loadedMap.layers[loopTiles].tileAt(offsetPos.col, offsetPos.row)!= undefined) {
			sails.log('Tile properties', loadedMap.layers[loopTiles].tileAt(offsetPos.col, offsetPos.row).properties);
			switch(loadedMap.layers[loopTiles].tileAt(offsetPos.col, offsetPos.row).properties.stepType) {
				case undefined:
					sails.log('Undefined');
					break;
				case "water":
					sails.log('Water Tile');
					steps= unit.unit.waterSteps;
					break;
				case "road":
					sails.log('Road Tile');
					steps= unit.unit.roadSteps; 
					break;
				case "hill":
					sails.log('Hill Tile');
					steps= unit.unit.hillSteps;
					break;
				default: 
					sails.log('Standard Tile');
					steps= unit.unit.moveSteps;

			}

		}
		
	}
	sails.log('Returning steps required as', steps);
	return steps;
};



function stepPlayerUnit(unit, loadedMap) {
 	if (unit.order.movePath.length< 1) {
 		unit.moveStepsLeft= 0;
 		return false;
 	}
 	sails.log('Stepping unit', unit.id);
 	// Check the hexTile it wants to move to, what's it's step?  Let's just guess 2...
 	neededSteps= getNeededSteps(cubetoOffset({x:unit.order.movePath[0].x, y:unit.order.movePath[0].y, z:unit.order.movePath[0].z}), unit, loadedMap);

 	if (unit.moveStepsLeft< neededSteps||neededSteps=== 0) {
 		unit.moveStepsLeft= 0;
 		return false;
 	}

 	// TODO: Is that next move path nextdoor?

 	// only move if the tile we're moving to is empty.
 	// TODO - PROBLEM this code runs after the steps left bit, because of the async.
 	PlayerUnit.findOne({posCubeX:unit.order.movePath[0].x,posCubeY:unit.order.movePath[0].y,posCubeZ:unit.order.movePath[0].z}).exec(function (err, found) {
 		if (found=== undefined) {
		 	sails.log('Moving Unit.', unit.id);
	 		unit.moveStepsLeft= unit.moveStepsLeft- neededSteps;
	 		unit.posCubeX= unit.order.movePath[0].x;
	 		unit.posCubeY= unit.order.movePath[0].y;
	 		unit.posCubeZ= unit.order.movePath[0].z;

	 		// Update the movePath...remove the oldest.
	 		unit.order.movePath.splice(0, 1);

			// Save it and broadcast.
			unit.save();
			// Send the socket update.
			sails.sockets.blast('PlayerUnit', {playerUnit: unit.id, movePath: unit.order.movePath, 
				posCubeX: unit.posCubeX, posCubeY: unit.posCubeY, posCubeZ: unit.posCubeZ});


 		} else {
 			sails.log('Destination Tile occupied. Halting this step.');	
 		}
 	});

 	return true;
 };

module.exports = {

	runTurn: function (req, res) {
		var params= req.allParams();
		sails.log('Running Turn');

		// TODO: Reset all steps.
		PlayerUnit.find({health:{'>':0}}).populate('unit').exec(function (err, foundUnits) {
			for (var loopUnits= 0; loopUnits< foundUnits.length; loopUnits++)
			{

				foundUnits[loopUnits].moveStepsLeft= 10; // foundUnits[loopUnits].unit.moveSteps;
				foundUnits[loopUnits].save();
			}
		});

		// Broadcast that we're starting a turn.
		sails.sockets.blast('GameMessages', {msg: 'Starting Action Sequence.'});

		return res.send('Done');
	},

	runStep: function (req, res) {
		var params= req.allParams();
		sails.log('Running Step');

		// Broadcast that we're starting a step.
		sails.sockets.blast('GameMessages', {msg: 'Starting Action Step.'});

		// find each playable Unit that has steps remaining...
		PlayerUnit.find({moveStepsLeft:{'>':0},health:{'>':0}}).populate('order').populate('unit').exec(function (err, foundUnits) {

			// No units to step!  OHMAIGAWD
			if (foundUnits.length=== 0) {
				sails.log('Found no units.');
		
				// Broadcast that we're starting a step.
				sails.sockets.blast('GameMessages', {msg: 'Finished Action Step - No Units left to Move.'});

				return false;

			}

			// Load up the map for terrain checks.
			// TODO - should request the data from the map model...!!!!! OAHMAIGAWD.
			tmx.parseFile("./assets/data/map/SecondGo.tmx", function (error, loadedMap) {
				sails.log('Loaded map', loadedMap.layers[0].tileAt(13,4).properties);

				for (var loopUnits= 0; loopUnits< foundUnits.length; loopUnits++)
				{
					sails.log('steps left before step is ', foundUnits[loopUnits].moveStepsLeft);
					stepPlayerUnit(foundUnits[loopUnits], loadedMap);
					sails.log('Steps remaining ', foundUnits[loopUnits].moveStepsLeft);

				}
			});

		});

		// Broadcast that we're starting a step.
		sails.sockets.blast('GameMessages', {msg: 'Finished Action Step.'});

		return res.send('complete');



	}






	
};

