class Blaster extends PIXI.Sprite{
    constructor(x = 0, y = 0) {
        super(app.loader.resources["media/spaceship.png"].texture);
        this.anchor.set(.5, .5);
        this.scale.set(1.5);
        this.x = x;
        this.y = y;
    }
    
    //Moves blaster with mouse
    move(dt = 1/60){
        let mousePosition = app.renderer.plugins.interaction.mouse.global;
        let w2 = blaster.width/2;
        blaster.x = clamp(lerp(blaster.x, mousePosition.x, 6 * dt), 0+w2, sceneWidth-w2);
    }

    //Spawns new bullet and adds it
    fireBullet(e){
        if (paused) return;
        
        let b = new Bullet(0xFFFFFF, blaster.x, blaster.y);
    
        bullets.push(b);
        gameScene.addChild(b);
        shootSound.play();
    }
}

class Tile extends PIXI.Graphics{
    constructor(x = 0, y = 0, size = 50, color=0xFFFFFF, id){
        super();
        this.lineStyle(1, 0x000000);
        this.beginFill(color);
        this.drawRect(0, 0, size, size);
        this.endFill();
        this.x = x;
        this.y = y;
        this.size = size;
        this.active = true;
        this.id = id;
    }

    //Changes the tiles color to the entered values
    changeColor(color, alpha){
        this.clear();
        this.beginFill(color, alpha);
        this.drawRect(0, 0, this.size, this.size);
        this.endFill();
    }
}

class Block{
    constructor(x = 0, y = 0, tileSize = 36, color = 0xFF0000, scene = gameScene){
        this.x = x;
        this.y = y;
        this.tiles = [[], [], []];
        this.tileSize = tileSize;
        this.active = true;
        this.id = Date.now() / ((Math.random() + 1) * 10);

        for (let i = 0; i < 3; i++){
            for (let j = 0; j < 3; j++){
                this.tiles[i][j] = new Tile((x + this.tileSize * j), (y + this.tileSize * i), this.tileSize, color, this.id);
                scene.addChild(this.tiles[i][j]);
            }
        }
    }
    
    //Moves the block down by the one tile
    fall(){
        this.y += this.tileSize;
    }

    //Moves the block in the X direction entered
    move(direction = 1){
        this.x += Math.round(direction * this.tileSize);
    }

    //Updates the positions of the tiles (redrawing them visually) 
    draw(){
        for (let i = 0; i < this.tiles.length; i++){
            for (let j = 0; j < this.tiles[i].length; j++){
                let tile = this.tiles[i][j];

                tile.x = this.x + this.tileSize * j;
                tile.y = this.y + this.tileSize * i;
            }
        }
    }

    //Rotates 2d array clockwise
    rotateClockwise(){
        this.tiles = this.tiles.map((row, rowIndex) => {return row.map((_, colIndex) => {return this.tiles[2 - colIndex][rowIndex]})});
    }

    //Rotates 2d array counterclockwise
    rotateCounterClockwise(){
        this.tiles = this.tiles.map((row, rowIndex) => {return row.map((_, colIndex) => {return this.tiles[colIndex][2 - rowIndex]})});
    }

    //Gets the tile lowest to the ground in the entered row
    getLowestColumnTile(rowIndex){
        for (let i = this.tiles.length - 1; i >= 0; i--){
            if (this.tiles[i][rowIndex].active) return i;
        }
        return -1;
    }

    //Checks if the tile at the entered x, y position, is colliding with a bullet
    checkTileCollision(rowIndex, bullet){
        let colIndex = this.getLowestColumnTile(rowIndex);

        return(colIndex != -1 && (bullet.x <= this.tiles[colIndex][rowIndex].x + this.tileSize)
         && (bullet.x >= this.tiles[colIndex][rowIndex].x) 
         && (bullet.y <= this.tiles[colIndex][rowIndex].y + this.tileSize) 
         && (bullet.y >= this.tiles[colIndex][rowIndex].y));
    }

    //Removes the lowest tile at the entered row
    removeTile(rowIndex){
        let colIndex = this.getLowestColumnTile(rowIndex);

        this.tiles[colIndex][rowIndex].changeColor(0x000000, 0);
        this.tiles[colIndex][rowIndex].active = false;

        for (let i = 0; i < this.tiles.length; i++){
            for (let j = 0; j < this.tiles[i].length; j++){
                if (this.tiles[i][j].active){
                    return;
                }
            }
        }
        this.active = false;
    }

    //Sets the active state of the block and its tiles
    setActive(val){
        this.active = val;

        for (let i = 0; i < this.tiles.length; i++){
            for (let j = 0; j < this.tiles[i].length; j++){
                this.tiles[i][j].active = val;
            }
        }
    }

    //Changes the active tiles color
    changeColor(color, alpha){
        for (let i = 0; i < this.tiles.length; i++){
            for (let j = 0; j < this.tiles[i].length; j++){
                if (this.tiles[i][j].active) this.tiles[i][j].changeColor(color, alpha);
            }
        }
    }
}

class Bullet extends PIXI.Graphics{
    constructor(color = 0xFFFFFF, x = 0, y = 0){
        super();
        this.beginFill(color);
        this.drawRect(-2, -2, 4, 4);
        this.endFill();
        this.x = x;
        this.y = y;
        this.speed = 400;
        this.alive = true;
    }

    //Moves bullet according to speed
    move(dt=1/60){
        this.y += -1 * this.speed * dt
    }
}

class BlockStack{
    constructor(screenWidth, screenHeight, tileSize = 50){
        this.score = 0;
        this.maxBlocksVertical = (screenHeight / tileSize) - 2;
        this.maxBlocksHorizontal = screenWidth / tileSize;
        this.scoreTiles = [];
        this.blankLine = new Array(this.maxBlocksHorizontal).fill(null);
        this.rowScore = 100;

        for (let i = 0; i < this.maxBlocksVertical; i++){
            this.scoreTiles[i] = [...this.blankLine];
        }
    }

    //Runs collision and line completion check;
    update(block){
        if (block.active && this.blockIsCollidingBottom(block)){
            this.addBlock(block, 1);
            block.changeColor(0x363636);
            block.setActive(false);
        }
        
        this.processLines();
    }

    //Checks if the bottom of a block is colliding with either the screen bottom or another block
    blockIsCollidingBottom(block){
        let tiles = block.tiles;

        for (let i = 0; i < tiles.length; i++){
            for (let j = 0; j < tiles[i].length; j++){
                if (tiles[i][j].active && ((Math.round(tiles[i][j].y / block.tileSize, 1) + 1) == this.scoreTiles.length || this.scoreTiles[Math.round(tiles[i][j].y / block.tileSize, 1) + 1][Math.round(tiles[i][j].x / block.tileSize)])){
                    return true;
                }
            }
        }
        return false;
    }

    //Checks if the block is colliding on its left or right
    blockIsCollidingSide(block, direction){
        let tiles = block.tiles;

        for (let i = 0; i < tiles.length; i++){
            for (let j = 0; j < tiles[i].length; j++){
                if (tiles[i][j].active && this.scoreTiles[Math.round(tiles[i][j].y / block.tileSize, 1)][Math.round(tiles[i][j].x / block.tileSize) + direction]){
                    return true;
                }
            }
        }
        return false;
    }

    //Adds a block's tiles to the score element
    addBlock(block){
        let tiles = block.tiles;

        for (let i = 0; i < tiles.length; i++){
            for (let j = 0; j < tiles[i].length; j++){
                if (tiles[i][j].active) this.scoreTiles[Math.round(tiles[i][j].y / block.tileSize, 1)][Math.round(tiles[i][j].x / block.tileSize)] = tiles[i][j];
            }
        }
    }

    //Checks if there is a line on the board, if yes then score and clear it
    processLines(){
        for (let i = this.scoreTiles.length - 1; i >= 0; i--){
            if (this.scoreTiles[i].every(val => val instanceof Tile)){                
                this.scoreLine(i);

                this.scoreTiles.splice(i);
                this.scoreTiles.unshift([...this.blankLine]);

                this.scoreTiles[i].forEach(tile => { if (tile != null) {tile.y = Math.round(i * tile.size); tile.changeColor(0x363636)}});

                i++;
            }
        }
    }

    //Takes a row of blocks and calculates the score value of it, then adds it to the score
    scoreLine(row){
        let ids = new Set();

        for (let i = 0; i < this.scoreTiles[row].length; i++){
            this.scoreTiles[row][i].clear();

            ids.add(this.scoreTiles[row][i].id);
        }

        if (ids.size > this.maxBlocksHorizontal/1.5){
            this.score += this.rowScore;
        }
        else{
            this.score += this.rowScore/3;
        }
        
        this.score = Math.round(this.score);
    }

    //Clears tiles from entered scene
    clearGraphics(scene){
        for (let i = 0; i < this.scoreTiles.length; i++){
            for (let j = 0; j < this.scoreTiles[i].length; j++){
                scene.removeChild(this.scoreTiles[i][j]);
            }
        }
    }
}