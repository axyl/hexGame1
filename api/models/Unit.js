/**
* Unit.js
*
* @description :: Units that are available for the game.  Not units that are controlled/in the map.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	name: 'string',
  	attackRange: 'integer',
  	attack: 'integer',
  	strength: 'integer',
  	attackSteps: 'integer', // How many 'steps' do we get for attacks?
  	moveSteps: 'integer',	// How many 'steps' do we get for movement during a turn?  Faster units...more steps.
  	roadSteps: 'integer',	// What's the modifier for being on a road to our steps?
  	hillSteps: 'integer',	// What's the modifier for being in the hills to our steps?
  	waterSteps: 'integer',	// What's the modifier for being on water to our steps?
  	icon: 'string',
  	team: {
  		model: 'team'
  	}
  	// There's a oneway association from playerUnit to Unit...
  }
};

