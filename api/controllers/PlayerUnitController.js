/**
 * PlayerUnitController
 *
 * @description :: Server-side logic for managing playerunits
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Promise = require('bluebird');

module.exports = {

	moveOrder: function (req, res) {
		var params= req.allParams();


		// TODO : Validate this move order...?

		// Look for the existing order for this playerUnit and replace the path.
		PlayerUnit.findOne({id:params.id}).populate('order').exec(function (err, found) {

			sails.log('Updating orders for ', params.id);

			// Sometimes there's no existing order...
			if (found.order== undefined) {
				Order.create({playerUnit:found.id, type:"move", movePath:params.movePath}, function(newOrder) {
					sails.log('Linking new Order.', newOrder.id);
					found.order= [newOrder.id];
					found.save();
					sails.sockets.blast('PlayerUnit', {playerUnit: params.id,movePath: params.movePath}, req.socket);

				});
			} else {
				sails.log('New orders are ', params.movePath);

				found.order.movePath= params.movePath;
				found.order.save();
				sails.sockets.blast('PlayerUnit', {playerUnit: params.id,movePath: params.movePath}, req.socket);

			};

		});
	},

	test: function (req, res) {
		return res.send("Hi");
	},

	NewUnit: function (req, res) {
		// request to create a new unit in the player base.
		var params= req.allParams();

		// TODO : Fix up the spawn position...
		var startPos;
		if (params.player== 1||params.player==4)
		{
			// Red base start pos.
			startPos= {
	        	"x": 19,
        		"y": -30,
        		"z": 11};
        } else {
        	// Blue Base HARD CODED!?!?!?

        	startPos= {
        	 	"x": 11,
        	 	"y": -12,
        	 	"z": 1};
        }

        sails.log('Requested to add new Unit for ', params.player);

		return PlayerUnit.findOne({posCubeX:startPos.x,posCubeY:startPos.y,posCubeZ:startPos.z})
 		.then(function (found) {
	 		if (found=== undefined) {
	 			// No unit in that space, so we can create new unit!
	 			sails.log('Space is free, creating new unit.');
	 			PlayerUnit.create({posCubeX:startPos.x, posCubeY:startPos.y, posCubeZ: startPos.z, unit: params.unit, player: params.player})
	 			.then (function (NewPlayerUnit) {
	 				sails.log('Created new player unit with id', NewPlayerUnit.id);
	 				return Order.create({playerUnit:NewPlayerUnit.id, type:"move", movePath:[]})
	 				.then (function (newOrder) {
	 					sails.log('Linking new Order.', newOrder.id);
	 					NewPlayerUnit.order= [newOrder];
	 					// Set the health too.
	 					return NewPlayerUnit.save();
	 				})
	 				.then (function (newPlayerUnitwithOrder) {
	 					// Everything should be done now.
	 					sails.log('New unit created.');
	 					// broadcast that there's a new unit, need all the related data populated...
	 					PlayerUnit.findOne({id:newPlayerUnitwithOrder.id}).populateAll()
	 					.then (function (fullNewPlayerRecord) {
	 						// This is an async call, it'll come later...
	 						return sails.sockets.blast('NewPlayerUnit', {newUnit: fullNewPlayerRecord});
	 					});
	 					return res.send({msg: 'Unit Created'});
	 				})
	 			})
	 			.catch (function (error){
	 				sails.log('Error creating new Player Unit', error);
	 				return res.error(error);
	 			})
	 		} else {
	 			// Space is occupied.
	 			sails.log('Tile is occupied, unable to create new unit.');
	 			return res.send({msg: 'Tile is occupied!  Unable to create new unit.'});
	 		};
	 	})
 		.catch (function (error) {
 			sails.log('error with blajh blah');
 		});

	}

};
