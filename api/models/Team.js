/**
* Team.js
*
* @description :: Defines a team that players and possible units belong to.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	name: 'string',		// Free form text that's displayed for this team
  	colour: 'string',	// Primary colour used for this team
  	players: {			// What players belong to this team.
  		collection: 'player',
  		via: 'team'
  	},
  	units: {			// What units are available for this team?
  		collection: 'unit',
  		via: 'team'
  	}

  }
};

