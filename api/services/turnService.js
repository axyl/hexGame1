/**
 * turnService
 *
 * @description :: Manages Turn processing
 * @help        :: See http://stackoverflow.com/questions/20735380/sails-js-access-controller-method-from-controller-method
 */

var Promise = require('bluebird');

// Resets steps for all units passed.
resetUnitSteps= function(unitsToReset) {
  // Could be a for loop, but am experimenting...
  var m= Promise.map(unitsToReset, function(unitReset) {
    unitReset.moveStepsLeft= unitReset.unit.moveSteps
    unitReset.attackStepsLeft= unitReset.unit.attackSteps
    return unitReset.save()
  })
  return Promise.all(m).catch(function(e){throw e})
},

getAlivePlayableUnits= function() {
  return PlayerUnit.find({health:{'>':0}}).populate('unit')
}

module.exports = {

	startTurn: function() {
    sails.log('Starting a new Turn')

    // Reset all steps for playable units and set the map to being in turn mode.
    // TODO : Only one map record at the moment...Need to update for multiple map support.
    // TODO : Are we already in a turn?
    return new Promise(function (resolve, reject) {
      Map.update({}, {turnProcessing: true})
      .then( getAlivePlayableUnits)
      .then(resetUnitSteps)
      .then(function() {
        sails.log('startTurn done.')
        sails.sockets.blast('GameMessages', {msg: 'Starting Turn.'})
        resolve(true)
      })
      .catch(function(e) {
        sails.log("Error with turnService.startTurn", e)
        reject(e)
      })
    })
  },

  endTurn: function() {
    sails.log('Finishing a turn')
    return new Promise(function (resolve, reject){
      Map.update({}, {turnProcessing: false})
      .then( function (mapState)
      {
        resolve(mapState)
      })
      .catch( function()
      {
        sails.log('Error with setting Map turnProcessing to false.', e)
        reject(e)
      })
    })
  },

  executeStep: function() {
    sails.log('Starting a Step')
    //Need the map for all other step assignments.


  }
};
