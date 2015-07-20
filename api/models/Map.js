/**
* Map.js
*
* @description :: The current map for the game, what TMX, step we're up to etc.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	name: 'string',		// Text form name of the map....Might be in the TMX???
  	tmxFile: 'string',	// Filename for the TMX that we're using.
  	turnProcessing: 'boolean'	// Are we processing a turn?  If so, don't accept any changes...


  }
};

