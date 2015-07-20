/**
* PlayerUnit.js
*
* @description :: An actual unit in the game!!!!!
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	unitId: {	//Possible DOM ID?
  		type:'integer',
  		autoIncrement: true
  	}, 
  	unit: {
  		model: 'unit'
  	},
  	player: {
  		model:'player'
  	},
  	order: {
  		model: 'order',
      via: 'playerUnit'
  	},
  	posCubeX: 'integer',	// The cube based coordinates for this unit....maybe we could use array type?
  	posCubeY: 'integer',
  	posCubeZ: 'integer',
  	health: 'integer',	// Link this to the unit.strength ...but if zero...she dead.
  	//TODO : On create, health should be set to whatever the unit has defined.
  	moveStepsLeft: 'integer',	// While a turn is being executed, this shows how many steps we have left available to move.
  	attackStepsLeft: 'integer'	// While a turn is being executed, how many attacks left do we have?


  }
};
