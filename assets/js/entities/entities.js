/************************************************************************************/
/*                                                                                  */
/*        a text entity                                                           */
/*                                                                                  */
/************************************************************************************/
game.TextEntity = me.Renderable.extend({
    init: function(x, y, width, height) {
        var self = this;
        this.text = "?,?";
        this.font_size = 20;
        this.font = new me.Font("courier", this.font_size, "white");
        
        // call the constructor
        this._super(me.Renderable, 'init', [x, y , width, height]);
        this.floating = true;
        
        this.pointerDown = me.event.subscribe("pointermove", function (event) {
            self.text = "?,?";
            //self.text = Math.round(event.gameX) + "," + Math.round(event.gameY);
            if(me.game.currentLevel){
                var layer = me.game.currentLevel.getLayers()[0];
                var tile = layer.getTile(event.gameWorldX, event.gameWorldY);
                if(tile){
                    self.text = tile.col + "," + tile.row;
                }

                // Show unit stats?
            }
        });
    },

    draw : function(renderer){
        renderer.setColor("black");
        renderer.fillRect(
            this.left,  this.top,
            this.width, this.height
        );
        this.font.draw(renderer,this.text,this.pos.x, this.pos.y);
    },
    
    update : function(){
        return true;
    },
});

game.ATInfantryEntity= me.DraggableEntity.extend({
    init: function(x, y, settings) {
        // settings.image= "ATInfantry";
        settings.height= 32;
        settings.width= 32;

        this._super(me.DraggableEntity, 'init', [x, y, settings]);
        this.id= 'atinfantry';
        // Empty orders for their movement path.
        this.movePath= [];
        this.renderable.angle= Math.random(5);

        //this.pos.x= 100;
        //this.pos.y= 100;

    },

    dragStart: function (e) {
        // Are we going to allow this?  Are you on the right player?
        // TODO : Fix this shit - Unit selection boxes - what side and if player unit...
        var currentPlayer= $("#currentPlayer").val();

        if (this.player.id != currentPlayer) return false; 


        // call the super function
        this._super(me.DraggableEntity, 'dragStart', [e]);
        // Save the start of the drag to draw a line...
        // We want to snap to the hex positions...
        var layer = me.game.currentLevel.getLayers()[0];
        var tile = layer.getTile(e.gameX, e.gameY);
        var pixelPos= me.game.tmxRenderer.tileToPixelCoords(tile.col, tile.row);
        pixelPos.x= pixelPos.x+ layer.tilewidth/ 2;
        pixelPos.y= pixelPos.y+ layer.tileheight/ 2;

        this.draggingPath= [];
        this.draggingPath.push({x:pixelPos.x,y:pixelPos.y});

        // Clear their existing movement path too.
        this.movePath= [];
        
    },

    dragMove: function (e) {
        // call the super function
        this._super(me.DraggableEntity, 'dragMove', [e]);
        if (this.dragging=== true) {
            // We want to snap to the hex positions...
            var layer = me.game.currentLevel.getLayers()[0];
            var tile = layer.getTile(e.gameX, e.gameY);
            var pixelPos= me.game.tmxRenderer.tileToPixelCoords(tile.col, tile.row);
            this.pos.set(pixelPos.x, pixelPos.y);

            pixelPos.x= pixelPos.x+ layer.tilewidth/ 2;
            pixelPos.y= pixelPos.y+ layer.tileheight/ 2;

            // is this a new pos?
            if ((this.draggingPath[this.draggingPath.length- 1].x!== pixelPos.x)||(this.draggingPath[this.draggingPath.length- 1].y!== pixelPos.y))
            {

                this.draggingPath.push({x:pixelPos.x, y:pixelPos.y});
                this.movePath.push(offsetToCube(tile.col, tile.row));
                console.log(this.movePath[this.movePath.length- 1]);

            }

        }
    },

    draw: function (renderer) {
        // inherited draw.
        this._super(me.DraggableEntity, 'draw', [renderer]);
        if (this.dragging===true)
        {
            renderer.setColor('black');
            renderer.setLineWidth(2);

            renderer.setGlobalAlpha(0.3);
            for (var loopPoints= 1; loopPoints< this.draggingPath.length; loopPoints++)
            {
                renderer.strokeLine(this.draggingPath[loopPoints- 1].x, this.draggingPath[loopPoints- 1].y, 
                    this.draggingPath[loopPoints].x, this.draggingPath[loopPoints].y);
            }
            renderer.setGlobalAlpha(1);  //TODO Is this safe?  NOPE!
            renderer.setLineWidth(1);
        } else {
            this.drawMovePath(renderer);
        // Draw outline of hex.
        var layer = me.game.currentLevel.getLayers()[0];

        // TODO : Fix this shit - Unit selection boxes - what side and if player unit...
        var currentPlayer= $("#currentPlayer").val();

        if (this.player.id==currentPlayer) renderer.setColor('yellow'); else if (this.player.team==1) renderer.setColor('red'); else renderer.setColor('blue');
        
        renderer.setGlobalAlpha(0.4);

        renderer.strokeRect(this.pos.x+ 6, this.pos.y+ 6,
            19, 19);
        renderer.setGlobalAlpha(1);


        } 
        // Show the health bar.
        this.drawHealth(renderer);
    },

    dragEnd: function (e) {
        // call the super function
        this._super(me.DraggableEntity, 'dragEnd', [e]);
        // Need to save this path to the unit.
        this.draggingPath= undefined;
        // Reset our position, as we're not actually allowed to move.
        var unitPos= cubetoOffset(this.cubePos);
        var pixelPos= me.game.tmxRenderer.tileToPixelCoords(unitPos.col, unitPos.row);
        this.pos.set(pixelPos.x, pixelPos.y);
        // Update the server with our new orders.
        io.socket.post('/playerUnit/moveOrder/', {id:this.name,type:'move',movePath:this.movePath});
        
    },

    drawHealth: function(renderer) {
        // Shows the healthbar of the unit, called as part of the draw routine.
        var percent= this.health/ this.strength;
        if (percent<= 0.3) renderer.setColor('red'); else if(percent< 0.8) renderer.setColor('orange'); else renderer.setColor('green');
        renderer.setLineWidth(2);
        renderer.setGlobalAlpha(1);
        var width= this.width* percent;
        renderer.strokeLine(this.pos.x, this.pos.y+ this.height- 1, this.pos.x+ width, this.pos.y+ this.height- 1);
    },

    drawMovePath: function(renderer) {
        // Shows the current movement path orders, if the unit has one.  Called as part of the draw routine.
        // First check if we should show this, depending on what team you're on.

        var currentPlayer= $("#currentPlayer").val();

        var team= 1;
        // TODO : OH MY GAWD I'M GETTING LAZY>>> FIX FHITSSSSSDFDSFSDFSDFDS
        if (currentPlayer== 2||currentPlayer== 3) team= 2;


        if (this.movePath.length> 0 && this.player.team=== team) {
            // get the current pos for the first from line...
            var layer = me.game.currentLevel.getLayers()[0];
            var fromX= this.pos.x+ layer.tilewidth/ 2;
            var fromY= this.pos.y+ layer.tileheight/ 2;

            renderer.setColor('black');
            renderer.setLineWidth(2);
            renderer.setGlobalAlpha(0.3);

            for (var loopWPs= 0; loopWPs< this.movePath.length; loopWPs++)
            {

                var waypointOffset= cubetoOffset(this.movePath[loopWPs]);
                // convert to pixels.
                var pixelPos= me.game.tmxRenderer.tileToPixelCoords(waypointOffset.col, waypointOffset.row);
                pixelPos.x= pixelPos.x+ layer.tilewidth/ 2;
                pixelPos.y= pixelPos.y+ layer.tileheight/ 2;

                renderer.strokeLine(fromX, fromY,
                pixelPos.x, pixelPos.y);

                fromX= pixelPos.x;
                fromY= pixelPos.y;
                }

            renderer.setGlobalAlpha(1);  //TODO Is this safe?  NOPE!
            renderer.setLineWidth(1);

        }
    }

});