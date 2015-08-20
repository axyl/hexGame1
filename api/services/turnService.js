/**
 * turnService
 *
 * @description :: Manages Turn processing
 * @help        :: See http://stackoverflow.com/questions/20735380/sails-js-access-controller-method-from-controller-method
 */

var Promise = require('bluebird')
var tmx= Promise.promisifyAll(require('tmx-parser'))	// The TMX Map Parser - promisfied

/*
This was my old method for resetting the unit steps...
But I was creating a new promise...didn't need to!

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
*/

// Resets steps for all units passed.
resetUnitStep= function(unitToReset) {
  unitToReset.moveStepsLeft= unitToReset.unit.moveSteps
  unitToReset.attackStepsLeft= unitToReset.unit.attackSteps
  return unitToReset.save()
},

// Returns all units that are alive - used for the turn actions...
// What units should be involved in doing the turns?
getAlivePlayableUnits= function() {
  return PlayerUnit.find({health:{'>':0}}).populate('unit')
}

// Loading the TMX map definition
loadTMXMap= function(mapInstance) {
  return tmx.parseFileAsync("./assets/data/map/"+ mapInstance[0].tmxFile)
}

module.exports = {

	startTurn: function() {
    sails.log('Starting a new Turn')

    // Reset all steps for playable units and set the map to being in turn mode.
    // TODO : Are we already in a turn?
    return new Promise(function (resolve, reject) {
      // see here.  https://github.com/petkaantonov/bluebird/blob/master/API.md#binddynamic-thisarg---promise
      Map.update({}, {turnProcessing: true})
      .then(loadTMXMap)
      .bind({}) // We want to keep the TMX definition available for other calls.
      .then( function (loadedTMXDefinition) {
        return this.tmxMap= loadedTMXDefinition;
      })
      .then(getAlivePlayableUnits)
      .map(resetUnitStep)
      .then(function() {
        sails.log('startTurn done.',this.tmxMap.height)
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
