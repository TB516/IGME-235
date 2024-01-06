"use strict";
const app = new PIXI.Application({width:972, height:window.innerHeight - 20});
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;
const size = sceneWidth/27;	

let stage;

// pre-load the images (this code works with PIXI v6)
app.loader.add(["media/spaceship.png"]);
app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(setup);
app.loader.load();

let startScene, startScoreLabel;
let gameScene, blaster, scoreLabel, dt, fallTime, block, scoreGrid, bullets, paused, shootSound;

bullets = [];
paused = true; //Change to true for final product

//Set up scenes and blaster
function setup(){
    stage = app.stage;

    //#region Create scenes and label them
    startScene = new PIXI.Container();
    startScene.visible = true;
    stage.addChild(startScene);
	
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);
    labelMenu();
    //#endregion

    //#region Init blaster
    blaster = new Blaster();
    blaster.x = (sceneWidth/2) - blaster.width/2;
    blaster.y = sceneHeight - blaster.height/2;
    gameScene.addChild(blaster);
    //#endregion

    shootSound = new Howl({
        src: ['sounds/shoot.wav']
    });

    document.querySelector("#aboutButton").onclick = () => {location.href = "about.html"; };

    app.ticker.add(gameLoop);
}

//Create and add labels
function labelMenu(){
    let subStyle = new PIXI.TextStyle({
        fill: 0xFF0000,
        fontSize: 54,
        fontFamily: "Impact",
        stroke: 0x1d09b3,
        strokeThickness: 4
    });

    //#region Start label
    let startLabel = new PIXI.Text("Tetris Blast");
    startLabel.style = new PIXI.TextStyle({
        fill: 0x1d09b3,
        fontSize: 96,
        fontFamily: "Impact",
        stroke: 0xFF0000,
        strokeThickness: 6
    });

    startLabel.x = sceneWidth/2 - startLabel.width/2;
    startLabel.y = sceneHeight/5 - startLabel.height/2;
    startScene.addChild(startLabel);
    //#endregion

    //#region Start menu score label
    startScoreLabel = new PIXI.Text(`High Score: `);
    
    let highScore = localStorage.getItem("tmb3614-tetrisBlast-highScore");
    if (highScore == null){
        highScore = "None"
    }

    startScoreLabel.text += highScore;
    startScoreLabel.style = subStyle;

    startScoreLabel.x = sceneWidth/2 - startScoreLabel.width/2;
    startScoreLabel.y = sceneHeight/2 - sceneHeight/10;
    startScene.addChild(startScoreLabel);
    //#endregion

    //#region Start button
    let startButton = new PIXI.Text("Play");
    startButton.style = subStyle;
    startButton.x = sceneWidth/2 - startButton.width/2;
    startButton.y = sceneHeight/2 + startButton.height/2;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame);
    startButton.on("pointerover", e => e.target.alpha = 0.7);
    startButton.on("pointerout", e => e.currentTarget.alpha = 1);
    startScene.addChild(startButton);
    //#endregion

    //#region Start menu score label
    scoreLabel = new PIXI.Text(`Score: `);
    scoreLabel.style = subStyle;

    scoreLabel.x = sceneWidth - scoreLabel.width;
    scoreLabel.y = 0;
    gameScene.addChild(scoreLabel);
    //#endregion
}

//Starts game by spawning block, making score element, and adding event listeners
function startGame(){
    scoreGrid = new BlockStack(sceneWidth, sceneHeight, size);
    spawnBlock();
    fallTime = 0;

    gameScene.visible = true;
    startScene.visible = false;
    
    paused = false;

    document.addEventListener("keydown", keydown);
    document.addEventListener("click", blaster.fireBullet);
}

//Takes user input and turns it into one of the available control actions
function keydown(key){
    if (key.keyCode == 81){
        block.rotateCounterClockwise();
    }
    if (key.keyCode == 69)
    {
        block.rotateClockwise();
    }

    if (key.keyCode == 65 && block.x - block.tileSize >= 0 && !scoreGrid.blockIsCollidingSide(block, -1)){
        block.move(-1);
    }
    if (key.keyCode == 68 && block.x + block.tileSize * 4 <= sceneWidth && !scoreGrid.blockIsCollidingSide(block, 1)){
        block.move(1);
    }
    if (key.keyCode == 32) paused = !paused;
}

//Moves blaster, block, and updates score element to keep collisions from happening
function gameLoop(){
    if (paused) return;
    dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt=1/12;
    fallTime += dt;

    blaster.move(dt);

    //Bullet movement and collision
    for (let i = bullets.length - 1; i >= 0; i--){
        bullets[i].move(dt);
        updateBulletCollision(bullets[i]);

        if (!bullets[i].alive){
            gameScene.removeChild(bullets[i]);
            bullets.splice(i, 1);
        }
    }

    //Move and update the block
    if (fallTime >= 1){
        block.fall();
        fallTime = 0;
    }
    block.draw();
    

    scoreGrid.update(block);

    scoreLabel.text = `Score: ${scoreGrid.score}`;
    scoreLabel.x = scoreLabel.x = sceneWidth - scoreLabel.width - 10;

    if (!block.active){
        spawnBlock();
        if (scoreGrid.blockIsCollidingBottom(block)){
            gameOver();
        }
    }
}

//Spawns a new block at room center
function spawnBlock(){
    block = new Block(sceneWidth/2 - (size * 3)/2, 0, size);
}

//Takes a bullet and checks it against all the bottom tiles
function updateBulletCollision(bullet){
    for (let i = 0; i < block.tiles[block.tiles.length - 1].length; i++){
        if (block.checkTileCollision(i, bullet)){
            block.removeTile(i);
            bullet.alive = false;
            return;
        }
    }
}

//Unhook events, clean up scene, and store score if it is higher than old score.
function gameOver(){
    paused = true;
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("click", blaster.fireBullet);

    bullets.forEach(bullet => gameScene.removeChild(bullet));
    bullets = [];

    scoreGrid.clearGraphics(gameScene);
    block.changeColor(0x000000, 0);

    if (scoreGrid.score > localStorage.getItem("tmb3614-tetrisBlast-highScore")){
        startScoreLabel.text = `High Score: ${scoreGrid.score}`;
        localStorage.setItem("tmb3614-tetrisBlast-highScore", scoreGrid.score);
    }

    gameScene.visible = false;
    startScene.visible = true;
}