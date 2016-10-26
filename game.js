var K = {
    'w': false,
    's': false,
    'a': false,
    'd': false
};

$(function(){
    function setKey(key, pressed) {
        K[key] = pressed;
    }
    
    $(document.body).keyup(function(e){
        setKey(e.key, false);
    }).keydown(function(e){
        setKey(e.key, true);
    });
    
    function rnd(s) {
        return Math.random()*s;
    }
    
    var exit = {
        bounce: function() {
            if (this.x<0 || this.x>W) {
                this.dx*=-1;
            }
            if (this.y<0 || this.y>H) {
                this.dy*=-1;
            }
        },
        
        wrap: function(){
            if (this.x<0) this.x=W;
            else if (this.x>W) this.x=0;
            if (this.y<0) this.y=H;
            else if (this.y>W) this.y=0;
        },
        
        stick: function(){
            if (this.x<0) {
                this.x=0;
                this.dx=0;
            }
            if (this.y<0) {
                this.y=0;
                this.dy=0;
            }
            if (this.x>W) {
                this.x=W;
                this.dx=0;
            }
            if (this.y>H) {
                this.y=H;
                this.dy=0;
            }
        }
    };
    
    class Point {
        constructor(x, y) {
            this.x = x||0;
            this.y = y||0;
        }
        
        static dist(v1, v2) {
            return Math.sqrt(Math.pow(v1.x-v2.x,2) + Math.pow(v1.y-v2.y,2));
        }
    }
    
    class Vector {
        constructor(dx, dy) {
            this.dx = dx||0;
            this.dy = dy||0;
        }
    }
    
    class Sprite extends Point {
        constructor(x, y) {
            super(x, y);
            this.dx = 0;
            this.dy = 0;
        }
        
        step() { 
            this.onStep(); 
            this.x += this.dx;
            this.y += this.dy;
            
            if (this.x>W || this.y>H || this.x<0 || this.y<0) {
                this.onExit();
            }
        }
        
        draw() {
            this.onDraw();
        }
        
        onStep(){}
        onDraw(){}
        onExit(){}
        
    }
    
    class Coin extends Sprite {
        constructor(x, y) {
            super(x, y);
            this.dx = rnd(5)-1.5;
            this.dy = rnd(5)-1.5;
            this.dead = false;
            this.onExit = exit.bounce;
        }
        
        onDraw(){
            ctx.fillStyle = this.dead?'#ffffff':'#00ff00';
            var r = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, 2*Math.PI);
            ctx.fill();
        }
        
        onStep(){
            if (this.dead) return;
            if (Point.dist(this,pc) < 10) {
                this.dead = true;
                this.dx = 0;
                this.dy = 0;
                score++;
            }
        }
    }
    
    class Bomb extends Sprite {
        constructor(x, y) {
            super(x, y);
            this.dx = rnd(5)-1.5;
            this.dy = rnd(5)-1.5;
            this.dead = false;
            this.onExit = exit.wrap;
        }
        
        onDraw(){
            if (this.dead) return;
            ctx.fillStyle = '#ff0000';
            var r = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - r);
            ctx.lineTo(this.x - r, this.y);
            ctx.lineTo(this.x, this.y + r);
            ctx.lineTo(this.x + r, this.y);
            ctx.fill();
        }
        
        onStep(){
            if (this.dead) return;
            var dx = Math.abs(this.x-pc.x);
            var dy = Math.abs(this.y-pc.y);
            if (dx<10 && dy<10) {
                this.dead = true;
                this.dx = 0;
                this.dy = 0;
                pc.hp--;
                var ex = new Explosion(this.x, this.y, 10);
                ex.dx = pc.dx;
                ex.dy = pc.dy;
                objects.push(ex);
            }
            if (score >= coinCount) {
                this.dead = true;
                this.dx = 0;
                this.dy = 0;
            }
        }
    }
    
    class Explosion extends Sprite {
        constructor(x, y, size) {
            super(x, y);
            this.size = size;
            this.frame = 0;
            this.lifetime = size;
        }
        
        onDraw(){
            if (this.frame>this.lifetime) return;
            ctx.fillStyle = 'rgba(255,100,0,' + (1 - this.frame/this.lifetime) + ')';
            //ctx.fillStyle = '#ffff0077';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2*this.lifetime*Math.log(this.frame), 0, 2*Math.PI);
            ctx.fill();
        }
        
        onStep(){
            this.frame++;
        }
    }
    
    function initPage() {
        window.W = 700;
        window.H = 700;
        window.canvas = document.getElementById('game-canvas')
        canvas.width = H;
        canvas.height = H;
        window.ctx = canvas.getContext('2d');
        initGame();
    }
    
    function initGame() {
        window.FPS = 45;
        window.score = 0;
        window.objects = [];
        window.map = [];
        window.pc = {};
        window.coinCount = 10;
        
        initPlayerCharacter();
        var ui = initHUD();
        var coins = initCoins(coinCount);
        var bombs = initBombs(10);
        //var maps = initMap();
        
        //objects = objects.concat(maps);
        objects = objects.concat(coins);
        objects = objects.concat(bombs);
        objects.push(pc);
        objects = objects.concat(ui);
    }
    
    function initMap() {
        var spritelist = [];
        var tileImage = document.createElement('img');
        tileImage.src='stars.png';
        var r = 16;
        
        for (var j = 0; j < W/r; j++) {
            for (var i = 0; i < H/r; i++) {
                var tile = new Sprite();
                tile.x = i;
                tile.y = j;
                tile.sx = r*rnd(4);
                tile.sy = r*rnd(4);
               
                tile.onDraw = function(){
                    ctx.drawImage(tileImage, 
                    this.sx, this.sy, 
                    r,r,
                    this.x*r,this.y*r,
                    r,r);
                };
                spritelist.push(tile);
            }
        }
        
        return spritelist;
    }
    
    function initCoins(count) {
        var spritelist = [];
        for (var i = 0; i < count; i++) {
            spritelist.push(new Coin(rnd(W),rnd(H)));
        }
        return spritelist;
    }
    
    function initBombs(count) {
        var spritelist = [];
        for (var i = 0; i < count; i++) {
            spritelist.push(new Bomb(rnd(W),rnd(H)));
        }
        return spritelist;
    }
    
    function initPlayerCharacter() {
        pc = new Sprite();

        pc.onDraw = function(){
            if (this.hp<=0) return;
            var r = 10;
            this.color = {
                r: Math.floor(200+5.5*(this._hpmax-this.hp)),
                g: Math.floor(200*this.hp/this._hpmax),
                b: Math.floor(200*this.hp/this._hpmax)
            };
            ctx.fillStyle = 'rgb('+this.color.r+','+this.color.g+','+this.color.b+')';
            ctx.strokeStyle = '#777777';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - r);
            ctx.lineTo(this.x - r, this.y);
            ctx.lineTo(this.x, this.y + r);
            ctx.lineTo(this.x + r, this.y);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ff7700';
            
            // Bottom
            if (K['w']) {
                ctx.beginPath();
                ctx.moveTo(this.x-3, this.y+r+5);
                ctx.lineTo(this.x+3, this.y+r+5);
                ctx.lineTo(this.x, this.y+r+5+10);
                ctx.fill();
            }
            
            // Top
            if (K['s']) {
                ctx.beginPath();
                ctx.moveTo(this.x-3, this.y-r-5);
                ctx.lineTo(this.x+3, this.y-r-5);
                ctx.lineTo(this.x, this.y-r-5-10);
                ctx.fill();
            }
            
            // Left
            if (K['a']) {
                ctx.beginPath();
                ctx.moveTo(this.x+r+5, this.y-3);
                ctx.lineTo(this.x+r+5, this.y+3);
                ctx.lineTo(this.x+r+5+10, this.y);
                ctx.fill();
            }
            
            // Right
            if (K['d']) {
                ctx.beginPath();
                ctx.moveTo(this.x-r-5, this.y-3);
                ctx.lineTo(this.x-r-5, this.y+3);
                ctx.lineTo(this.x-r-5-10, this.y);
                ctx.fill();
            }
        };
        pc.onStep = function(){
            if (this.hp<=0) {
                this.x=-W;
                this.y=-H;
                this.dx=0;
                this.dy=0;
            }
            
            var force = 0.05;
            if (K['d']) {
                this.dx+= force;
                pc.fuelUsed++;
            }
            if (K['a']) {
                this.dx-= force;
                pc.fuelUsed++;
            }
            if (K['w']) {
                this.dy-= force;
                pc.fuelUsed++;
            }
            if (K['s']) {
                this.dy+= force;
                pc.fuelUsed++;
            }
            
            if (K['x']) {
                this.dx = 0;
                this.dy = 0;
            }
        };
        pc.onExit = exit.bounce;
        pc.x = W/2;
        pc.y = H/2;
        pc._hpmax = 3;
        pc.hp = pc._hpmax;
        
        pc.fuelUsed = 0;
        
        objects.push(pc);
    }
    
    function initHUD() {
        var spritelist = [];
        
        var scoreboard = new Sprite();
        scoreboard.x = 10;
        scoreboard.y = 20;
        scoreboard.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "20px monospace";
            ctx.fillText('Score: ' + score,this.x,this.y);
        };
        spritelist.push(scoreboard);
     
        var healthdisplay = new Sprite();
        healthdisplay.x = 150;
        healthdisplay.y = 20;
        healthdisplay.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "20px monospace";
            ctx.fillText('HP:', this.x, this.y);
            
            ctx.strokeStyle = '#ffffff';
            
            for (var i = 0; i < pc._hpmax; i++) {
                if (i < pc.hp) {
                    ctx.fillRect(40 + this.x+i*10, this.y-16, 5, 20);
                }
                else {
                    ctx.strokeRect(40 + this.x+i*10, this.y-16, 5, 20);
                }
            }
        };
        spritelist.push(healthdisplay);
        
        var fuelDisplay = new Sprite();
        fuelDisplay.x = 10;
        fuelDisplay.y = 50;
        fuelDisplay.onDraw = function(){
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = "15px monospace";
            ctx.fillText('Fuel Usage: ' + pc.fuelUsed, this.x, this.y);
        };  
        spritelist.push(fuelDisplay);
        
        var title = new Sprite();
        title.x = W/2;
        title.y = H/2;
        title.onDraw = function(){
            if (pc.hp<=0) {
                ctx.strokeStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = "50px monospace";
                ctx.strokeText('GAME OVER', this.x, this.y);
            }
            else if (score >= coinCount) {
                ctx.strokeStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = "50px monospace";
                ctx.strokeText('YOU WIN!', this.x, this.y);
            }
        };
        spritelist.push(title);
        
        return spritelist;
    }

    function gameLoop() {
        ctx.clearRect(0,0, W, H);
        //ctx.fillStyle = '#00000022';
        //ctx.fillRect(0, 0, W, H);
        
        var allSprites = objects;//map.concat(objects);
        
        for (var i in allSprites) {
            allSprites[i].step();
            allSprites[i].draw();
        }
    }
    
    function startGame() {
        window.gameLoopTimer = setInterval(gameLoop, Math.floor(1000/FPS) );
    }
    
    function stopGame() {
        clearInterval(window.gameLoopTimer);
    }
    
    $('#stop').click(function(){
        stopGame();
    });
    
    $('#restart').click(function(){
        stopGame();
        initGame();
        startGame();
    });
    
    initPage();
    startGame();
});