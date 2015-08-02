/**
* PlayerUnit.js
*
* @description :: An actual unit in the game!!!!!
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	unitId: {	//Possible DOM ID?  // TODO - remove this.  Just using the Waterline ID
  		type:'integer',
  		autoIncrement: true
  	}, 
  	unit: {
  		model: 'unit',
      required: true
  	},
  	player: {
  		model:'player',
      required: true
  	},
  	order: {
  		model: 'order',
      via: 'playerUnit'
  	},
  	posCubeX: 'integer',	// The cube based coordinates for this unit....maybe we could use array type?
  	posCubeY: 'integer',
  	posCubeZ: 'integer',
  	health: 'integer',	// Link this to the unit.strength ...but if zero...she dead.
  	moveStepsLeft: 'integer',	// While a turn is being executed, this shows how many steps we have left available to move.
  	attackStepsLeft: 'integer',	// While a turn is being executed, how many attacks left do we have?
    healthLeft: 'integer' // While a step is in progress, what health do we have left?
  },

  afterCreate: function (newlyInsertedRecord, cb) {
    sails.log('Player Unit ID is', newlyInsertedRecord.id);
    PlayerUnit.findOne({id:newlyInsertedRecord.id}).populate('unit').exec(function (err, updated){
      sails.log('Updating new record with health');
      updated.health= updated.unit.strength;
      updated.save();
      cb();
    });
  }
};

