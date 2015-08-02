/**
 * SampleService
 *
 * @description :: Sample SErvice implementation.
 * @help        :: See http://stackoverflow.com/questions/20735380/sails-js-access-controller-method-from-controller-method
 */

module.exports = {
	findStore: function(storeId) {
		return Store.findOne(storeId);
	}
};

/**
*  and the controller would call.
* index: function(req, res) {
*    if(req.param('id')) {
*      StoreService.findStore(req.param('id'))
*        .then(res.ok)
*        .fail(res.badRequest);
*    } else {
*      res.badRequest('Missing Store id');
*    }
*/

