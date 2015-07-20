/************************************************************************************/
/*                                                                                  */
/*        HUD for the map                                                           */
/*                                                                                  */
/************************************************************************************/


// NOT IN USE
game.GameMessages = me.Renderable.extend({
	init: function (x, y, type, length) {
		this.$gameMessage= $('<textarea name="gameMessage" id="gameMessage"></textarea>');
		$(me.video.getWrapper()).append(this.$gameMessage);
	},

	destroy: function() {
		this.$gameMessage.remove();
	}
});