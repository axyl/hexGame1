/**
* Player.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	name: {type: 'string', unique: true},
  	team: {model: 'team'},
 	units: {			// What units does this player have?
  		collection: 'playerUnit',
  		via: 'player'
  	},
  	ordersDone: {type: 'boolean', defaultsTo: false}		// A turn can be conducted until all orders are done...


  }
};

