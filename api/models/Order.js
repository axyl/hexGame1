/**
* Order.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	playerUnit: {
      model:'playerUnit', 
      via: 'order',
      unique: true  // 1:1 relationship.  This enforces that.
    },
  	type: {
  		type: 'string',
  		enum: ['move']
  	},
  	movePath: {		// What path are we meant to be following for our steps?
  		type: 'array'
  	}

  }
};

