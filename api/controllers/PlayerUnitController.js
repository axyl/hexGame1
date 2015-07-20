/**
 * PlayerUnitController
 *
 * @description :: Server-side logic for managing playerunits
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	moveOrder: function (req, res) {
		var params= req.allParams();



		// Look for the existing order for this playerUnit and replace the path.
		PlayerUnit.findOne({id:params.id}).populate('order').exec(function (err, found) {


			console.log('Updating orders for ', params.id);
			sails.log('orders currently are ', found.order);

			found.order.movePath= params.movePath;
			found.order.save();

			var subscribers= PlayerUnit.subscribers(found);
			sails.log('Current subscriber count is ', subscribers.length);
			sails.sockets.blast('PlayerUnit', {playerUnit: params.id,movePath: params.movePath}, req.socket);
		});
	},

	test: function (req, res) {
		return res.send("Hi");
	}
	
};

