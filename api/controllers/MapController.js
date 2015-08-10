/**
 * MapController
 *
 * @description :: Server-side logic for managing maps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var tmx= Promise.promisifyAll(require('tmx-parser'));	// The TMX Map Parser, Promisified...

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

	// TODO : find the smallest step only???

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


// Move a unit it's step...
stepPlayerUnit= function (unit, loadedMap) {
	if (unit.order== undefined) {
		sails.log('Unit has undefined orders.');
		return unit;
	}
 	if (unit.order.movePath.length< 1) {
		sails.log('Unit has no move orders left.')
 		unit.moveStepsLeft= 0;
 		unit.save();
 		return unit;
 	}
 	sails.log('Stepping unit', unit.id);
 	// Check the hexTile it wants to move to, what's it's step?
 	var neededSteps= getNeededSteps(cubetoOffset({x:unit.order.movePath[0].x, y:unit.order.movePath[0].y, z:unit.order.movePath[0].z}), unit, loadedMap);

 	if (unit.moveStepsLeft< neededSteps||neededSteps=== 0) {
 		sails.log("Unit doesn't have enough steps left.");
 		unit.moveStepsLeft= 0;
 		unit.save();
 		return unit;
 	}

 	// TODO: Is that next move path nextdoor?

 	// is there a unit in the way?
 	return PlayerUnit.findOne({posCubeX:unit.order.movePath[0].x,posCubeY:unit.order.movePath[0].y,posCubeZ:unit.order.movePath[0].z})
 	.then(function (found) {
 		sails.log("findOne..");
 		if (found=== undefined) {
		 	sails.log('Moving Unit needing steps', unit.id, neededSteps);
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
		// return unit;
	})
	.catch( function (error) {
		sails.log("Error stepping unit", error);
		throw error;
	});

 };

 // See if an unit can attack another unit.
 attackCheckForUnit= function(unit, loadedMap) {
 	// Look for the best candidate to attack and attack it...
 	// TODO : How do we select a unit to attack?
 	sails.log('Doing an attack check for', unit.id);

 	// Currently we're checking for the first unit that comes back that's within attack range.
 	return PlayerUnit.find({
 		health:{'>':0},
 		// TODO : Need to only select units on other teams!
 		// player.team:{'!':unit.player.team},
 		posCubeX:{'>=':unit.posCubeX- unit.unit.attackRange},
 		posCubeX:{'<=':unit.posCubeX+ unit.unit.attackRange},
 		posCubeY:{'>=':unit.posCubeY- unit.unit.attackRange},
 		posCubeY:{'<=':unit.posCubeY+ unit.unit.attackRange},
 		posCubeZ:{'>=':unit.posCubeZ- unit.unit.attackRange},
 		posCubeZ:{'<=':unit.posCubeZ+ unit.unit.attackRange}}).populate('player')
 	.then( function(possibleTargets) {
 		if (possibleTargets!= undefined) {
			// Loop through each one...until we find one that's enemy.

			for (var loopUnits= 0; loopUnits< possibleTargets.length; loopUnits++)
			{
				if (possibleTargets[loopUnits].player.team!= unit.player.team)
				{
					// Found an enemy - Need to update unit's data with the attackStepsLeft.
					unit.attackStepsLeft= unit.attackStepsLeft- 1;	// TODO : Should we have different attacks use up more than just one step?
					// OUT OF ORDER HERE...save is saving old data.
					// unit.save();
					sails.log('Current unit healthLeft', unit.healthLeft);
					sails.log('Current target healthLeft', possibleTargets[loopUnits].healthLeft);
		 			possibleTargets[loopUnits].healthLeft= possibleTargets[loopUnits].healthLeft- unit.unit.attack;
		 			possibleTargets[loopUnits].save();
		 			sails.log('Unit attacked with healthLeft as', unit.id, possibleTargets[loopUnits].id, possibleTargets[loopUnits].healthLeft);
					break;
				}
			}

 		} else {
 			sails.log('No units nearby for', unit.id);
 		}
		return unit;
 	})
 	.catch( function(error){
 		sails.log('Error doing attack check for unit.', error);
 		throw error;
 	});

 };

 resetHealthLeft= function() {
 	sails.log('resetHealthLeft');
 	// get All alive units and reset their healthLeft to health...
 	return PlayerUnit.find({health:{'>':0}}).populate('order')
 	.then (function(aliveUnits) {

		var m= Promise.map(aliveUnits, function(aliveUnit) {
			sails.log('Resetting health for unit', aliveUnit.id);

			aliveUnit.healthLeft= aliveUnit.health;
			return aliveUnit.save();
		});
		// This returns the promise to the outside...
		return Promise.all(m).catch(function(error){throw error;})

 	})
	.catch (function (error) {
		sails.log("Error finding playerUnits with health> 0", error);
		throw error;
	});
 };

 testPlayer= function(entry) {

 	sails.log('testPlayer', entry.id);
 	if (entry.order.movePath== 0) {
 		sails.log('No movement...');
 		return entry;
 	} else {

	 	return PlayerUnit.findOne({posCubeX:entry.order.movePath[0].x,posCubeY:entry.order.movePath[0].y,posCubeZ:entry.order.movePath[0].z})
	 	.then(function (found) {
	 		sails.log('findOne!', found);
	 		if (found=== undefined) {
	 			sails.log('Tile is free');
	 		}
	 		return entry;
	 	})
	 	.catch(function (error) {
	 		sails.log('Exception',error);
	 		throw error;
 		});
 	}
	sails.log('End of testPlayer');
 };

 testPlayer2= function(entry) {
	 return new Promise(function (resolve, reject) {
		 sails.log('testPlayer2', entry.id);
		 if (entry.order.movePath== 0) {
			 sails.log('No movement...');
			 resolve(entry);
		 } else {

			 PlayerUnit.findOne({posCubeX:entry.order.movePath[0].x,posCubeY:entry.order.movePath[0].y,posCubeZ:entry.order.movePath[0].z})
			 .then(function (found) {
				 sails.log('findOne!', found);
				 if (found=== undefined) {
					 sails.log('Tile is free');
				 }
				 resolve(entry);
			 })
			 .catch(function (error) {
				 sails.log('Exception',error);
				 reject(error);
				 });
			 };

	 });
	 sails.log('End of testPlayer');
};



module.exports = {

	runTurn: function (req, res) {
		sails.log('Running Turn')
		turnService.startTurn()
		// TODO run the steps.
		.then(function() {
			// Finish it!
			return turnService.endTurn()
		})
		.then(function(mapState) {
			return res.send(mapState)
		})
		.catch(function() {
			return res.badRequest
		})
	},


	runTest: function (req, res) {
		// Just an example of doing the promises based requests for dealing with each unit.
		// var Promises=  require('bluebird');  .....
		var params= req.allParams();

		sails.log('start');
		// Get a list of units that can move.

		PlayerUnit.find({moveStepsLeft:{'>':0},health:{'>':0}}).populate('order').populate('unit')
		.then(function (foundUnits) {
			sails.log('data', foundUnits.length);
			// Cycle through each unit and do something with it.
			// each means sequential...  map instead would be async.
			var m= Promise.map(foundUnits, function(foundUnit) {
				sails.log('SingleUnit', foundUnit.id);

				return testPlayer2(foundUnit);
			})
			// This returns the promise to the outside...
			sails.log('returning promise.all');
			return Promise.all(m).catch(function(error){throw error;})
		})
		.then(function (test) {
			// Now everything is done...test will be the foundUnits...
			sails.log('test', test.length);
			return res.send(test);
		})
		.catch(function (error){
			sails.log('Error', error);
			return res.error(error);
		});
		// This will run before all the async requests above.
		sails.log('end');
		// Web request will be left hanging...as no response.


	},

	runStep: function (req, res) {
		var params= req.allParams();
		sails.log('Running Step');

		// Broadcast that we're starting a step.
		sails.sockets.blast('GameMessages', {msg: 'Starting Movement Step.'});

		// Load up the map.  TODO read the map from the DB rather than hardcoded.
		// Using promisfied version of the TMX thing.
		// TODO: Might have to change that, as we need the map for a bunch of stuff here.
		tmx.parseFileAsync("./assets/data/map/SecondGo.tmx")
		.then(function (loadedMap) {
			sails.log('Map Loaded with dims',loadedMap.width,loadedMap.height);
			return loadedMap;
		})
		.then(function (loadedMap) {
			// Get a list of units that have steps left and are not dead...
			return PlayerUnit.find({moveStepsLeft:{'>':0},health:{'>':0}}).populate('order').populate('unit')
			.then(function (foundUnits) {
				// Async cycle through each unit and move them
				sails.log('Checking for units that can move');
				// Sequential.
				var move= Promise.each(foundUnits, function(foundUnit) {
					sails.log('Checking Move for unit', foundUnit.id);
					return stepPlayerUnit(foundUnit, loadedMap);
				});
				return Promise.all(move).catch(function(error){throw error;})
			})

			// Now combat
			.then(function (ignore) {
				// Now the Combat step - reset all unit PlayerUnit healthLeft to the value of their health.
				// We want to do this so all alive units get a chance to attack, before they kick the bucket...
				// Might change this mechanic over time.
				sails.log("Combat Step Begin - resetting health");
				return resetHealthLeft();
			})
			.then(function (ignore) {
				// get a list of all units that are healthy and have actionPoints left.
				return PlayerUnit.find({attackStepsLeft:{'>':0},health:{'>':0}}).populate('unit').populate('player')
				.then( function (possibleAttackingUnits) {
					sails.log('Atacking units checking for found nme.');
					var attackingUnits= Promise.each(possibleAttackingUnits, function(unitAttackingCheck) {
						return attackCheckForUnit(unitAttackingCheck, loadedMap);
					});
					return Promise.all(attackingUnits).catch(function(error){throw error;})
				})
				.catch (function (error){throw error;});
			})  // TODO Save the damage.
			.catch (function (error){throw error;});
		})
		.then(function (blah) {
			sails.log("Movement Step complete.");
			sails.sockets.blast('GameMessages', {msg: 'Finished Movement Step.'});
			return true;
		})
		.then(function (ignore) {
			sails.log("Combat Step Finished.");
			return true;
		})
		.then(function (finished) {
			sails.log("And we're done.  Should see this last.");
			sails.sockets.blast('GameMessages', {msg: 'Completed Step.'});
			return res.send('stepDone');
			sails.log("Step Complete.");
		})
		.catch (function (error){
			sails.log('Error Loading Map',error);
			return res.error(error);
		});

		/*

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
				sails.log('Loaded map');

				for (var loopUnits= 0; loopUnits< foundUnits.length; loopUnits++)
				{
					stepPlayerUnit(foundUnits[loopUnits], loadedMap);
				}
			});

		}); */
			// Broadcast that we're starting a step.
			//sails.sockets.blast('GameMessages', {msg: 'Finished Action Step.'});
			//sails.log('Step done.');
//			return true;


		// return res.send('running');

	}







};
