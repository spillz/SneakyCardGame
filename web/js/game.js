class Game {
    constructor() {
        this.timer_tick = null;
        this.FPSframes = 0;
        this.FPStime = 0;
        this.FPS = 0;
        this.updateTimes = new MathArray([]);
        this.drawTimes = new MathArray([]);
        this.updateMean = 0;
        this.updateMax = 0;
        this.drawMean = 0;
        this.drawMax = 0;  
        this.pixelSize = 1;

        this.fillScreen = false;
        this.dimW = this.prefDimW = 32;
        this.dimH = this.prefDimH = 16;
        this.uiWidth = 0; //width in tiles of non-game portion of screen
        this.uiHeight = 0; //height in tiles for non-game portion of screen
        this.tileSize = this.getTileScale()*this.pixelSize;

        this.gameOffsetX = 0;
        this.gameOffsetY = 0;

        this.level = 1;
        this.numLevels = 10;      

        this.activePlayers = [];
        this.inputHandler = new InputHandler();

        this.widgets = null; // widget container

        this.multiplayerEnabled = true;
        this.competitiveMode = false;
        this.sandboxMode = false;
        this.gameState = "loading";  
        this.showFPS = false;
        this.cullOffCamera = true;

        this.shakeAmount = 0;       
        this.shakeX = 0;                 
        this.shakeY = 0;      

        this.initSounds();

        this.numReady = 1;

    }    

    start() {
        let that = this;
        window.onresize = (() => that.updateWindowSize());
        this.setupCanvas();

//        let that = this;
//        this.sprites.players.sheet.onload = (() => that.ready());
    
        this.board = new Widget(new Rect([0, 0, this.dimW, this.dimH]));

//        this.board.addChild(new Card([1,1,4,6], "TEST CARD", "This is a very long string of card text", null, true));
        let deck = new Deck([1,1,4,8], 'down');
        let card1 = new Card([1,1,4,6], "CARD 1", "This is a very long string of card text", null, true)
        let card2 = new Card([1,1,4,6], "CARD 2", "This is a very long string of card text", null, true)
        let card3 = new Card([1,1,4,6], "CARD 3", "This is a very long string of card text", null, true)
        let mapcard1 = new CityMap([8,1,5,7]);
        let mapcard2 = new CityMap([13,1,5,7]);
        card3.processTouches = true;
        deck.addChild(card1);
        deck.addChild(card2);
        deck.addChild(card3);
        this.board.addChild(deck);
        this.board.addChild(mapcard1);
        this.board.addChild(mapcard2);

        this.ready();
    }

    ready() {
        this.numReady--;
        if(this.numReady>=0) {
            this.gameState = 'running';
            this.update();
        }
    }

    update() {
        let updateStart = performance.now();
    //    this.gamepadMgr.update_gamepad_states();
        // for(let s of Object.keys(controlStates))
        //     newControlStates[s] = oldControlStates[s]!=controlStates[s];
        // for(let p of this.activePlayers) {
        //     for(let s of Object.keys(p.controlStates))
        //         p.newControlStates[s] = p.oldControlStates[s]!=p.controlStates[s];
        // }
        // if(this.gameState=="dead" && !oldControlStates["jump"] && controlStates["jump"]) {
        //     this.gameState = "scores"
        // }
        if(this.gameState == "running" || this.gameState == "dead"){  
            // if(this.gameState=="running" && controlStates['menu'] && !oldControlStates['menu']) {
            //     this.gameState = "paused";
            // }
            // if(this.gameState=="running" && controlStates['jump'] && !oldControlStates['jump']) {
            //     if(lastController.player==null)
            //     this.addPlayer();
            // }
            let millis = 15;
            let n_timer_tick = Date.now();
            if(this.timer_tick!=null){
                millis = Math.min(n_timer_tick - this.timer_tick, 30); //maximum of 30 ms refresh
            }

            this.board.update(millis);
    
            let all_dead=false;
            if(!this.competitiveMode && all_dead && this.gameState!="dead"){    
                // this.keyboard.player = null;
                // this.touch.player = null;
                // this.gamepadMgr.release_all_players();
                addScore(this.score, false);
                this.gameState = "dead";
                this.items.push(new DelayedSound('gameOver', 1000));
            }

            this.updateTimes.push(performance.now() - updateStart);
            this.draw(millis);
        } else if(this.gameState == "title" || this.gameState == "options") {
            this.showTitle();
        } else if(this.gameState == "scores") {
            this.showTitle();
            // if(!oldControlStates["jump"] && controlStates["jump"]) {
            //     this.gameState = "title"
            // }
        } else if(this.gameState == "paused") {
            this.showTitle();
            // if(this.gameState=="paused" && !oldControlStates["menu"] && controlStates["menu"]) {
            //     this.gameState = "running";
            // }
        }

        // oldControlStates = {... controlStates};
        // for(let p of this.activePlayers) {
        //     p.oldControlStates = {... p.controlStates};
        // }
        let that = this;
        window.requestAnimationFrame(() => that.update());
    }
    
    draw(millis){
        let drawStart = performance.now();
        if(this.gameState == "running" || this.gameState == "dead"){  
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    
            screenshake();
            // this.camera.update(millis);

            let cx = 0; 
            let cy = 0;
            let cr = this.dimW;
            let cb = this.dimH;    
            // if(this.cullOffCamera) {
            //     cx = Math.floor(this.camera.x);
            //     cy = Math.floor(this.camera.y);
            //     cr = Math.ceil(this.camera.right);
            //     cb = Math.ceil(this.camera.bottom);    
            // }

            // for(let i=cx;i<cr;i++){
            //     for(let j=cy;j<cb;j++){
            //         this.tiles.at([i,j]).draw();
            //     }
            // }

            // if(this.cullOffCamera) {
            //     let cam = this.camera;
            //     for(let m of this.monsters) {
            //         if(cam.collide(new Rect([m.pos.x,m.pos.y,1,1]))) m.draw();
            //     }
            //     for(let p of this.activePlayers) {
            //         if(cam.collide(new Rect([p.pos.x,p.pos.y,1,1]))) p.draw();
            //     }
            //     for(let i of this.items) {
            //         if(cam.collide(new Rect([i.pos.x,i.pos.y,1,1]))) i.draw();
            //     }
            // } else {
            //     for(let i=0;i<this.monsters.length;i++){
            //         this.monsters[i].draw();
            //     }
        
            //     for (let player of this.activePlayers) {
            //         player.draw();
            //     }
    
            //     for(let i=0;i<this.items.length;i++){
            //         this.items[i].draw();
            //     }    
            // }

            // for(let i=0;i<this.items.length;i++){
            //     this.items[i].draw_bounds();
            // }


            this.shakeX = 0;
            this.shakeY = 0;

            this.board.draw();
            //Draw time left
//            drawText("Lvl "+this.level+" Time "+Math.ceil(this.levelTime/1000)+" Scr "+this.score, this.tileSize*3/8, true, this.tileSize*3/4, timerColor);
    
            // let hud_pos = [new Vec2([0,0]),new Vec2([W-6,0]),new Vec2([0,H-1]),new Vec2([W-6,H-1])];
            // let p = 0;
            // for(let player of this.activePlayers) {
            //     let hp = hud_pos[p];
            //     player.draw_hud(hp);
            //     let i = 0;
            //     for(let item of player.inventory) {
            //         item.draw(hp.add([2+i+this.competitiveMode,0]), player);
            //         i++;
            //     }
            //     for(let item of player.passiveInventory) {
            //         item.draw(hp.add([2+i+this.competitiveMode,0]), player);
            //         i++;
            //     }
            //     p++;
            // }
            this.drawTimes.push(performance.now() - drawStart);
            if(this.showFPS) {
                this.FPSframes += 1;
                this.FPStime += millis;
                if(this.FPStime>1000) {
                    this.FPS = Math.round(10*1000*this.FPSframes/this.FPStime)/10
                    this.FPStime = 0;
                    this.FPSframes = 0;
                    this.updateMean = Math.round(this.updateTimes.mean()*100)/100;
                    this.updateMax = Math.round(this.updateTimes.max()*100)/100;
                    this.updateTimes = new MathArray([]);
                    this.drawMean = Math.round(this.drawTimes.mean()*100)/100;
                    this.drawMax = Math.round(this.drawTimes.max()*100)/100;
                    this.drawTimes = new MathArray([]);
                }
                let cull = this.cullOffCamera? "CULL":"";
                drawText("FPS: "+this.FPS+"  Update: "+this.updateMean+"ms (peak "+this.updateMax+")  Draw: "+this.drawMean+"ms (peak "+this.drawMax+") "+cull, this.tileSize*3/8, true, this.tileSize*(H-0.25)+this.gameOffsetY, "DarkSeaGreen");
            }
        }
    }
        
    setupCanvas(){
        this.canvas = document.querySelector("canvas");
    
        this.canvas.width = window.innerWidth; //this.tileSize*(this.dimW);
        this.canvas.height = window.innerHeight; //this.tileSize*(this.dimH);
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.gameOffsetX = Math.floor((window.innerWidth - this.tileSize*this.dimW)/2);
        this.gameOffsetY =  Math.floor((window.innerHeight - this.tileSize*this.dimH)/2);
    
        // if(this.camera.scrollable) {
        //     this.gameOffsetX = Math.floor((window.innerWidth - this.tileSize*this.camera.viewPortW)/2);
        //     this.gameOffsetY =  Math.floor((window.innerHeight - this.tileSize*this.camera.viewPortH)/2);

        // } else {
        //     this.gameOffsetX = Math.floor((window.innerWidth - this.tileSize*this.dimW)/2);
        //     this.gameOffsetY =  Math.floor((window.innerHeight - this.tileSize*this.dimH)/2);
        // }
    
    }

    getTileScale() {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        let scale;
        scale = Math.min(sh/(this.prefDimH+this.uiHeight)/this.pixelSize,sw/(this.prefDimW+this.uiWidth)/this.pixelSize);
        // if(this.camera.scrollable) {
        //     scale = sh/(this.camera.viewPortH+this.uiHeight)/16;
        // } else {
        //     scale = Math.min(sh/(this.prefDimH+this.uiHeight)/16,sw/(this.prefDimW+this.uiWidth)/16);
        // }
        if(!this.fillScreen) { //pixel perfect scaling
            scale = Math.floor(scale);
        }    
        return scale;
    }
    
    fitMaptoTileSize(scale) {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        this.dimH = Math.floor(sh/scale);
        this.dimW = Math.floor(sw/scale);    
        // if(this.camera.scrollable) {
        //     this.camera.viewPortH = sh/scale; // (sh/scale - this.uiHeight);
        //     this.camera.viewPortW = sw/scale; //(sw/scale - this.uiWidth);    
        // } else {
        //     this.dimH = Math.floor(sh/scale);
        //     this.dimW = Math.floor(sw/scale);    
        //     this.camera.viewPortH = this.dimH;
        //     this.camera.viewPortW = this.dimW;
        // }
    }
    
    updateWindowSize() {
        // if(this.competitiveMode) {
        //     this.camera.scrollable = false;
        // } else {
        //     this.camera.scrollable = true;
        //     this.camera.viewPortW = 14;
        //     this.camera.viewPortH = 8;    
        // }

        this.tileSize = this.getTileScale()*this.pixelSize;
        this.fitMaptoTileSize(this.tileSize);
        this.setupCanvas();
    }
        

    initSounds(){          
        this.sounds = {
            // hit1: new Audio('sounds/hit1.wav'),
            // hit2: new Audio('sounds/hit2.wav'),
            // pickup1: new Audio('sounds/sfx_sounds_powerup5.wav'),
            // pickup2: new Audio('sounds/sfx_sounds_powerup15.wav'),
            // changeInv: new Audio('sounds/Slide_Sharp_01.wav'),
            // boom: new Audio('sounds/explodemini.wav'),
            // boomBig: new Audio('sounds/explode.wav'),
            // dead1: new Audio('sounds/aargh0.ogg'),
            // dead2: new Audio('sounds/aargh1.ogg'),
            // dead3: new Audio('sounds/aargh2.ogg'),
            // dead4: new Audio('sounds/aargh3.ogg'),
            // dead5: new Audio('sounds/aargh4.ogg'),
            // dead6: new Audio('sounds/aargh5.ogg'),
            // dead7: new Audio('sounds/aargh6.ogg'),
            // dead8: new Audio('sounds/aargh7.ogg'),
            // exitLevel: new Audio('sounds/rock_metal_slide_1.wav'),
            // gameOver: new Audio('sounds/evil cyber laugh.wav'),            
            // kioskInteract: new Audio('sounds/Click_Standard_02.wav'),
            // kioskDispense: new Audio('sounds/flaunch.wav'),
            // gunFire1: new Audio('sounds/sfx_wpn_laser7.wav'),
            // gunFire2: new Audio('sounds/sfx_wpn_laser6.wav'),
            // gunFire3: new Audio('sounds/sfx_wpn_laser5.wav'),
            // gunReload: new Audio('sounds/sfx_wpn_reload.wav'),
            // rifleFire: new Audio('sounds/Rifleprimary2.ogg'),
            // rifleReload: new Audio('sounds/sfx_wpn_reload.wav'),
            // shotgunFire: new Audio('sounds/minigun3.ogg'),
            // shotgunReload: new Audio('sounds/Rack.mp3'),
            // rocketFire: new Audio('sounds/sfx_wpn_missilelaunch.wav'),
            // rocketReload: new Audio('sounds/Slide_Sharp_01.wav'),
            // grappleFire: new Audio('sounds/jumppad.ogg'),
            // grappleReload: new Audio('sounds/Slide_Sharp_01.wav'),
            // grappleRetract: new Audio('sounds/rattle1.wav'),
            // wrenchFire: new Audio('sounds/rattle1.wav'),
            // wrenchReload: new Audio('sounds/Slide_Sharp_01.wav'),
            // saberCharge: new Audio('sounds/SpaceShip_Engine_Large_Loop_00.wav'),
        };
    }
    
    playSound(soundName, ctime=0, loop=false, play=true){
       this.sounds[soundName].currentTime = ctime;
       this.sounds[soundName].loop = loop;
       if(play) {
           this.sounds[soundName].play();
       }
       return this.sounds[soundName];
    }

    showTitle(){                                          
        this.ctx.fillStyle = 'rgba(0,0,0,.75)';
        this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height); 
    
        drawText("RunLike", this.tileSize, true, this.canvas.height/2 - 3.5*this.tileSize, "DarkSeaGreen");
        drawText("MAD", 2*this.tileSize, true, this.canvas.height/2 - 2*this.tileSize, "DarkOrange"); 
    
        if(this.gameState == "title") {
        } else
        if(this.gameState == "options") {
        } else
        if(this.gameState == "paused") {
        } else
        if(this.gameState == "scores")
            drawScores(); 
    }
    
    addPlayer() {
        let player = new Player();
        player.hp = this.startingHp;
        player.maxHp = this.startingHp;
        let startingItems;
        if(this.sandboxMode) {
            startingItems = [new Wrench(), new Fist(), new PowerSaber(), new Grenade(), new Gun(), new Shotgun(), new Rifle(), new RocketLauncher(), new JetPack(), new Drone(), new GrappleGun()];
            startingItems[0].count = 4;
            startingItems[3].count = 5;
            for(let i of [new Shield(), new Glider()]) {
                player.passiveInventory.add(i);
            }
        } else {
            startingItems = [new Fist()];
            if(this.competitiveMode)
                startingItems[0].hitDamage = 1;
        }
        for(let i of startingItems)
            player.inventory.add(i);
        player.inventory.select(player.inventory[0]);
        // player.pos = this.tiles.startTile.pos;
        player.controller = lastController;
        lastController.attach_to_player(player);
        this.activePlayers.push(player);
    }
    
    startGame(){                                           
        this.timer_tick = null;
        this.level = 1;
        this.score = 0;
        this.cellsCollected = 2;
        this.activePlayers = []; 
        let player = new Player();
        this.activePlayers.push(player);
        // single player attach all controllers to this player
        // if(this.multiplayerEnabled) {
        //     lastController.attach_to_player(player);
        // } else {
        //     this.keyboard.attach_to_player(player);
        //     this.touch.attach_to_player(player);
        //     this.gamepadMgr.attach_all_to_player(player);
        // }
        this.startLevel();
    
        this.gameState = "running";
    }
    
    startLevel(){  
        this.spawnRate = 10000;              
        this.spawnCounter = this.spawnRate;  
        this.levelTime = this.startLevelTime;
        // this.camera.pos = null;

        let cc = this.competitiveMode? 1 : this.cellsCollected;

        // generateLevel();
    
        for(let player of this.activePlayers) {
            // player.pos = this.tiles.startTile.pos;
            player.escaped = false;
            if (player.dead) {
                player.revive();
            }
    
        }
    }    
}

