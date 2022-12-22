const gameover = false;
var enemies = {};
const serverDirectory = "http://127.0.0.1:3000/";
const player = {};
const keys = {};

var config = {
    type: Phaser.AUTO,
    parent: 'phaser',
    backgroundColor: '#808080',
    width: 800,
    height: 400,
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: {y:0},
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 600,
            height: 300
        },
    },
    dom: {
        createContainer: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update
        
    }
};

class Player extends Phaser.Physics.Matter.Sprite {
    constructor(data) {
        let {scene, x, y, texture, frame} = data
        super(scene.matter.world, x, y, texture, frame);
        this.scene.add.existing(this);
        this.setScale(0.75);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter;
        var playerCollider = Bodies.circle(this.x, this.y, 6, { isSensor: false, label: "playerCollider" });
        var playerSensor = Bodies.circle(this.x, this.y, 24, { isSensor: true, label: "playerSensor" });
        const compoundBody = Body.create({
            parts: [playerCollider, playerSensor],
            frictionAir: 0.35,
        });
        this.setExistingBody(compoundBody);
        
        this.setFixedRotation();
        this.state = { sweep_attack: false, attack1: false, attack2: false, slice: false };
        this.speed = 3;
        this.dash_distance = 15;
        this.health = 100;
        this.health_bar = 100;
        this.score = 0;
        this.givingDamage = false;
        this.damage1 = 10;
        this.damage2 = 20;
        this.damage3 = 30;
        this.damage4 = 25;
        this.targets = {};
        
    }

    static preload(scene) {
        scene.load.atlas('assassin', serverDirectory+'Images/Sprites/Player/assassin/assassin.png', serverDirectory+'Images/Sprites/Player/assassin/assassin_atlas.json');
        scene.load.animation('assassin_anim', serverDirectory+'Images/Sprites/Player/assassin/assassin_anim.json');
    }

    get velocity() {
        return this.body.velocity;
    }

    update() {
        let playerVelocity = new Phaser.Math.Vector2();

        if (this.inputKeys.left.isDown) {
            playerVelocity.x = -1;
            this.flipX = true;
        }
        else if (this.inputKeys.right.isDown) {
            playerVelocity.x = 1;
            this.flipX = false;
        }

        if (this.inputKeys.up.isDown) {
            playerVelocity.y = -1
        }
        else if (this.inputKeys.down.isDown) {
            playerVelocity.y = 1;
        }

        if ((this.inputKeys.one.isDown && this.state.attack1 == false) || this.state.attack1 == true) {
            this.state.attack1 = true;
            this.anims.play('attack1', true);
            if (this.anims.currentFrame.index == 4) {
                this.state.attack1 = false;
                if (this.givingDamage = true && this.attackLocked == false) {
                    for (var target in this.targets) {
                        this.targets[target].health -= this.damage1;
                    }
                    this.attackLocked == true;
                }
            }
            else { this.attackLocked = false;}
        }
        else if ((this.inputKeys.two.isDown && this.state.attack2 == false) || this.state.attack2 == true) {
            this.state.attack2 = true;
            this.anims.play('attack2', true);
            if (this.anims.currentFrame.index == 5) {
                this.state.attack2 = false;
                if (this.givingDamage = true && this.attackLocked == false) {
                    for (var target in this.targets) {
                        this.targets[target].health -= this.damage2;
                    }
                    this.attackLocked == true;
                }
            }
            else { this.attackLocked = false; }
        }
        else if ((this.inputKeys.three.isDown && this.state.slice == false) || this.state.slice == true) {
            this.state.slice = true;
            this.anims.play('slice', true);
            if (this.anims.currentFrame.index == 5) {
                this.state.slice = false;
                if (this.givingDamage = true && this.attackLocked == false) {
                    for (var target in this.targets) {
                        this.targets[target].health -= this.damage3;
                    }
                    this.attackLocked == true;
                }
            }
            else { this.attackLocked = false; }
        }
        else if ((this.inputKeys.four.isDown && this.state.sweep_attack == false) || this.state.sweep_attack == true) {
            this.state.sweep_attack = true;
            this.anims.play('sweep_attack', true);
            if (this.anims.currentFrame.index == 5) {
                if (this.flipX) { this.x -= this.dash_distance; }
                else { this.x += this.dash_distance; }
            }
            else if (this.anims.currentFrame.index == 10) {
                this.state.sweep_attack = false;
                if (this.givingDamage = true && this.attackLocked == false) {
                    for (var target in this.targets) {
                        this.targets[target].health -= this.damage4;
                    }
                    this.attackLocked == true;
                }
            }
            else { this.attackLocked = false;}
        }
        
        else {
            playerVelocity.normalize();
            playerVelocity.scale(this.speed);
            this.setVelocity(playerVelocity.x, playerVelocity.y);

            if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
                this.anims.play('run', true); 
            }
            else {
                this.anims.play('idle', true);
            }
        }
        if (this.health != this.health_bar) {
            updateHealthBar(this.health);
            this.health_bar = this.health;
            if (this.health <= 0) {
                saveScore(this.score);
            }
        }
    }
}

class Enemy extends Phaser.Physics.Matter.Sprite {
    constructor(data) {
        let { scene, x, y, texture, frame, target, label} = data;
        super(scene.matter.world, x, y, texture, frame, label);
        this.target = target;
        this.scene.add.existing(this);

        this.setScale(0.75);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter;
        var enemyCollider = Bodies.circle(this.x, this.y, 9, { isSensor: false, label: "enemyCollider" + ":" + label });
        var enemyAttackSensor = Bodies.circle(this.x, this.y, 24, { isSensor: true, label: "enemyAttackSensor" + ":" + label});
        var enemyChaseSensor = Bodies.circle(this.x, this.y, 150, { isSensor: true, label: "enemyChaseSensor" + ":" + label});
        const compoundBody = Body.create({
            parts: [enemyCollider, enemyAttackSensor, enemyChaseSensor],
            frictionAir: 0.35,
        });
        this.setExistingBody(compoundBody);
        this.health = 60;
        this.points = 100;
        this.setFixedRotation();
        this.state = { attack: false, attack1: false, attack2: false, idle: true, run: false};
        this.speed = 1.5;
        this.probabilityAttack = 4; // 1 in x chances is Attack2 where x is this.probabilityAttack
        this.damage1 = 3;
        this.damage2 = 6;
        this.givingDamage = false;
        this.active = true;
    }

    static preload(scene) {
        scene.load.atlas('mud_guard', serverDirectory+'Images/Sprites/Enemies/mud_guard/mud_guard.png', serverDirectory+'Images/Sprites/Enemies/mud_guard/mud_guard_atlas.json');
        scene.load.animation('mud_guard', serverDirectory+'Images/Sprites/Enemies/mud_guard/mud_guard_anim.json');
    }

    update(scene) {
        if (this.active == false) {return}
        let enemyVelocity = new Phaser.Math.Vector2();
        if (this.state.attack1 == true) {
            this.anims.play('mg_attack1', true)
            if (this.anims.currentFrame.index == 7) {
                this.state.attack1 = false;
                if (this.state.run == false && this.givingDamage == true && this.attackLocked == false) {
                    this.state.attack = true;
                    this.target.health -= this.damage1;
                    this.attackLocked = true;
                }
            }
            else {
                this.attackLocked = false;
            }
        }
        else if (this.state.attack2 == true) {
            this.anims.play('mg_attack2', true)
            if (this.anims.currentFrame.index == 7) {
                this.state.attack2 = false;
                if (this.state.run == false && this.givingDamage == true && this.attackLocked == false) {
                    this.state.attack = true;
                    this.target.health -= this.damage2;
                    this.attackLocked = true;
                }
            }
            else {
                this.attackLocked = false;
            }

        }
        else if (this.state.attack == true) {
            this.state.run = false;
            let choice = Math.floor(Math.random() * this.probabilityAttack);
            if (choice == 0) {
                this.state.attack2 = true;
                this.anims.play('mg_attack2', true)
            }
            else {
                this.state.attack1 = true;
                this.anims.play('mg_attack1', true)
                
            }
            
        }
        else if (this.state.run == true) {
            enemyVelocity.x = (this.target.x - this.x);
            enemyVelocity.y = (this.target.y - this.y);
            if (enemyVelocity.x < 0) { this.flipX = true; }

            else {this.flipX = false;}

            enemyVelocity.normalize();
            enemyVelocity.scale(this.speed);
            this.setVelocity(enemyVelocity.x, enemyVelocity.y);
            this.anims.play('mg_run', true);
        }
        else {
            this.anims.play('mg_idle', true);
        }


        if (this.health <= 0) {
            if (this.label == "boss") {
                updateScore(this.points);
                saveScore(player['p1'].score);
            }
            else {
                updateScore(this.points);
                enemies[this.label] = null;
                delete player['p1'].targets[this.label];
                this.setActive(false).setVisible(false);
                this.active = false;
                scene.matter.world.remove(this);
            }
        }
    }

    
}


function preload() {
    Player.preload(this);
    Enemy.preload(this);
    this.load.image('Cosmic Lilac', serverDirectory+'Map/Tiles/CosmicLilac_Tiles.png');
    this.load.image('Desert Sands', serverDirectory+'Map/Tiles/DesertSands.png');
    this.load.image('Frost Chill', serverDirectory+'Map/Tiles/frostchill.png');
    this.load.image('Hidden Jungle', serverDirectory+'Map/Tiles/HiddenJungle_PNG.png');
    this.load.image('Retro Space', serverDirectory+'Map/Tiles/RetroSpacePNG.png');
    this.load.image('Retro Space Hell', serverDirectory+'Map/Tiles/RetroSpaceHell_PNG.png');
    this.load.tilemapTiledJSON('map', serverDirectory + 'Map/map.json');
    this.load.image('key desert', serverDirectory + 'Images/Keys/key1.png');
    this.load.image('key jungle', serverDirectory + 'Images/Keys/key2.png');
    this.load.image('key glacier', serverDirectory + 'Images/Keys/key3.png');
    this.load.image('portal red', serverDirectory + 'Images/Sprites/Portals/Red-Portal/red-portal1.png');
}


function create() {
    const { Body, Bodies } = Phaser.Physics.Matter.Matter;
    const map = this.make.tilemap({ key: 'map' });
    const CosmicLilacTiles = map.addTilesetImage('Cosmic Lilac', 'Cosmic Lilac', 16, 16, 0, 0);
    const DesertSandsTiles = map.addTilesetImage('Desert Sands', 'Desert Sands', 16, 16, 0, 0);
    const FrostChillTiles = map.addTilesetImage('Frost Chill', 'Frost Chill', 16, 16, 0, 0);
    const HiddenJungleTileset = map.addTilesetImage('Hidden Jungle', 'Hidden Jungle', 16, 16, 0, 0);
    const RetroSpaceTiles = map.addTilesetImage('Retro Space', 'Retro Space', 16, 16, 0, 0);
    const RetroSpaceHellTiles = map.addTilesetImage('Retro Space Hell', 'Retro Space Hell', 16, 16, 0, 0);
    const layer1 = map.createLayer('Tile Layer 1', [CosmicLilacTiles, DesertSandsTiles, FrostChillTiles, HiddenJungleTileset, RetroSpaceTiles, RetroSpaceHellTiles], 0, 0);
    const layer2 = map.createLayer('Tile Layer 2', [CosmicLilacTiles, DesertSandsTiles, FrostChillTiles, HiddenJungleTileset, RetroSpaceTiles, RetroSpaceHellTiles], 512, 512);

    layer1.setCollisionByProperty({ collides: true });
    layer2.setCollisionByProperty({ collides: true });
    this.matter.world.convertTilemapLayer(layer1);
    this.matter.world.convertTilemapLayer(layer2);

    desertKey = this.matter.add.image(344/*344*/, 2984/*2984*/, 'key desert');
    desertKey.setStatic(true);
    desertKey.label = 'desertKey';
    desertKey.url = serverDirectory + 'Images/Keys/key1.png';
    keys['desertKey'] = desertKey;
    jungleKey = this.matter.add.image(1960/*1960*/, 3464/*3464*/, 'key jungle');
    jungleKey.setStatic(true);
    jungleKey.label = 'jungleKey';
    jungleKey.url = serverDirectory + 'Images/Keys/key2.png';
    keys['jungleKey'] = jungleKey;
    glacierKey = this.matter.add.image(2760/*2760*/, 2952/*2952*/, 'key glacier');
    glacierKey.setStatic(true);
    glacierKey.label = 'glacierKey';
    glacierKey.url = serverDirectory + 'Images/Keys/key3.png';
    keys['glacierKey'] = glacierKey;

    function collectKey(scene, key) {
        key.setVisible(false);
        updateScore(500);
        document.getElementById(key.label).src = key.url;
        delete keys[key.label];
        key.destroy();
        if (Object.keys(keys).length <= 0) {
            redPortal.active = true;
            redPortal.setVisible(true);
        }
    }
    redPortal = this.matter.add.image(1344, 1728, 'portal red');
    redPortal.setStatic(true);
    redPortal.label = 'redPortal';
    redPortal.setVisible(false);
    redPortal.active = false;
    redPortal.setExistingBody(Bodies.circle(redPortal.x, redPortal.y, 20, { isSensor: true, label: "portalSensor" }));
    redPortal.tpX = 752;
    redPortal.tpY = 816;

    this.player = new Player({ scene: this, x: 1416/*1416*/, y: 2664/*2664*/, texture: 'assassin', frame: "idle_(1)" });
    this.player.inputKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        death: Phaser.Input.Keyboard.KeyCodes.P,
        one: Phaser.Input.Keyboard.KeyCodes.ONE,
        two: Phaser.Input.Keyboard.KeyCodes.TWO,
        three: Phaser.Input.Keyboard.KeyCodes.THREE,
        four: Phaser.Input.Keyboard.KeyCodes.FOUR
    });
    player['p1'] = this.player;

    //'desert' enemies
    this.enemy1 = new Enemy({ scene: this, x: 472, y: 2584, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "1" });
    enemies['1'] = this.enemy1;
    this.enemy2 = new Enemy({ scene: this, x: 280, y: 2632, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "2" });
    enemies['2'] = this.enemy2;
    this.enemy3 = new Enemy({ scene: this, x: 536, y: 2760, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "3" });
    enemies['3'] = this.enemy3;
    this.enemy4 = new Enemy({ scene: this, x: 472, y: 2935, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "4" });
    enemies['4'] = this.enemy4;

    //'jungle' enemies
    this.enemy5 = new Enemy({ scene: this, x: 1192, y: 3448, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "5" });
    enemies['5'] = this.enemy5;
    this.enemy6 = new Enemy({ scene: this, x: 1352, y: 3496, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "6" });
    enemies['6'] = this.enemy6;
    this.enemy7 = new Enemy({ scene: this, x: 1560, y: 3480, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "7" });
    enemies['7'] = this.enemy7;
    this.enemy8 = new Enemy({ scene: this, x: 1944, y: 3432, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "8" });
    enemies['8'] = this.enemy8;
    this.enemy9 = new Enemy({ scene: this, x: 1912, y: 3480, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "9" });
    enemies['9'] = this.enemy9;

    //'glacier' enemies
    this.enemy10 = new Enemy({ scene: this, x: 2168, y: 2600, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "10" });
    enemies['10'] = this.enemy10;
    this.enemy11 = new Enemy({ scene: this, x: 2536, y: 2552, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "11" });
    enemies['11'] = this.enemy11;
    this.enemy12 = new Enemy({ scene: this, x: 2200, y: 2920, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "12" });
    enemies['12'] = this.enemy12;
    this.enemy13 = new Enemy({ scene: this, x: 2632, y: 2856, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "13" });
    enemies['13'] = this.enemy13;
    this.enemy14 = new Enemy({ scene: this, x: 2536, y: 2936, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "14" });
    enemies['14'] = this.enemy14;
    this.enemy15 = new Enemy({ scene: this, x: 2648, y: 2968, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "15" });
    enemies['15'] = this.enemy15;

    //'hell' enemies
    this.enemy16 = new Enemy({ scene: this, x: 920, y: 824, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "16" });
    enemies['16'] = this.enemy16;
    this.enemy17 = new Enemy({ scene: this, x: 1080, y: 808, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "17" });
    enemies['17'] = this.enemy17;
    this.enemy18 = new Enemy({ scene: this, x: 1240, y: 824, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "18" });
    enemies['18'] = this.enemy18;
    this.enemy19 = new Enemy({ scene: this, x: 1400, y: 808, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "19" });
    enemies['19'] = this.enemy19;
    this.enemy20 = new Enemy({ scene: this, x: 1560, y: 824, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "20" });
    enemies['20'] = this.enemy20;
    this.enemy21 = new Enemy({ scene: this, x: 1720, y: 808, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "21" });
    enemies['21'] = this.enemy21;
    this.enemy22 = new Enemy({ scene: this, x: 1880, y: 824, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "22" });
    enemies['22'] = this.enemy22;
    this.enemy23 = new Enemy({ scene: this, x: 2040, y: 808, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "23" });
    enemies['23'] = this.enemy23;
    //boss
    this.boss = new Enemy({ scene: this, x: 2520, y: 824, texture: 'mud_guard', frame: "idle_(1)", target: this.player, label: "boss" });
    this.boss.health = 1000;
    this.boss.damage1 *= 10;
    this.boss.damage2 *= 10;
    enemies['boss'] = this.boss;

    let camera = this.cameras.main;
    camera.zoom = 1.2;
    camera.startFollow(this.player);
    camera.setLerp(0.1, 0.1);

    this.matter.world.on('collisionstart', function (event) {
        let pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            let bodyA = pairs[i].bodyA;
            let bodyB = pairs[i].bodyB;
            if (pairs[i].isSensor) {
                let splitLabel = bodyB.label.split(":");
                if (splitLabel[0] == 'enemyAttackSensor' && bodyA.label == 'playerCollider') {
                    enemies[splitLabel[1]].state.attack = true;
                    enemies[splitLabel[1]].state.run = false;
                    enemies[splitLabel[1]].givingDamage = true;
                    player['p1'].givingDamage = true;
                    player['p1'].targets[splitLabel[1]] = enemies[splitLabel[1]];
                }
                else if (splitLabel[0] == 'enemyChaseSensor' && bodyA.label == 'playerCollider') {
                    enemies[splitLabel[1]].state.run = true;
                }
                
            }
            try {
                if (bodyA.gameObject.label in keys && bodyB.label == 'playerCollider') {
                    collectKey(this, bodyA.gameObject);
                }
                else if (bodyA.gameObject.label == 'redPortal' && bodyA.gameObject.active == true && bodyB.label == 'playerCollider'){
                    bodyA.gameObject.x = bodyA.gameObject.tpX;
                    bodyA.gameObject.y = bodyA.gameObject.tpY;
                    bodyB.gameObject.x = bodyA.gameObject.tpX;
                    bodyB.gameObject.y = bodyA.gameObject.tpY;
                }
            }
            finally {
                continue;
            }
        }
    });

    this.matter.world.on('collisionend', function (event) {
        let pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            let bodyA = pairs[i].bodyA;
            let bodyB = pairs[i].bodyB;
            if (pairs[i].isSensor) {
                let splitLabel = bodyB.label.split(":");
                if (splitLabel[0]  == 'enemyAttackSensor' && bodyA.label == 'playerCollider') {
                    enemies[splitLabel[1]].state.attack = false;
                    enemies[splitLabel[1]].state.run = true;
                    enemies[splitLabel[1]].givingDamage = false;
                    player['p1'].givingDamage = false;
                    delete player['p1'].targets[splitLabel[1]];
                }
                else if (splitLabel[0]  == 'enemyChaseSensor' && bodyA.label == 'playerCollider') {
                    enemies[splitLabel[1]].state.run = false;
                }
            }
        }
    });

}

function update() {
    this.player.update(this);
    for (var key in enemies) {
        if (enemies[key] != null) {
            enemies[key].update(this);
        }
    }
    if (redPortal.active) {
        redPortal.rotation += 0.05;
    }
}

function updateHealthBar(health) {
    document.getElementById("health_bar").style.background = "linear-gradient(110deg, #855DBB " + health + "%, #551D9F " + health + "%)";
}

function updateScore(score) {
    player["p1"].score += score;
    document.getElementById("score").innerHTML = "Score:<br />" + player["p1"].score;
}

function saveScore(score) {

    var name = window.prompt("End of game - Please put in your name (at least two characters) to save your score", "");
    if (name.length < 2) { return; }
    
        $.ajax({
            url: "/addscore",
            type: "POST",
            data: { "name": name, "score": score },
            success: function (data) {
                $('#response_div').html(data);
                
            }
        });
        $(location).prop('href', serverDirectory);
    
    
}

new Phaser.Game(config);

