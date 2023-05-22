// create a new scene
let gameScene = new Phaser.Scene('Game');

// initiate game parameters
gameScene.init = function() {

  this.isTerminating = false;

  this.playerSpeed = 150;
  this.jumpSpeed = -600;
}

// load assets
gameScene.preload = function(){
  // load images
  this.load.image('background', 'assets/images/Battleground3.png');
  this.load.image('barrel', 'assets/images/barrel.png');
  this.load.image('block', 'assets/images/Tile_39.png');
  this.load.image('ground', 'assets/images/Tile_02.png');

  // load spritesheets
  this.load.spritesheet('idle_p', 'assets/images/player/Idle.png', {
    frameWidth: 126,
    frameHeight: 128
  });

  this.load.spritesheet('running_p', 'assets/images/player/Run.png', {
    frameWidth: 126,
    frameHeight: 128
  });

  this.load.spritesheet('jumping_p', 'assets/images/player/Jump.png', {
    frameWidth: 126,
    frameHeight: 128
  });

  this.load.spritesheet('dead_p', 'assets/images/player/Dead.png', {
    frameWidth: 126,
    frameHeight: 128
  });

  this.load.spritesheet('idle_e', 'assets/images/enemy/Idle.png', {
    frameWidth: 126,
    frameHeight: 128
  });

  this.load.spritesheet('attack_e', 'assets/images/enemy/Attack_2.png', {
    frameWidth: 126,
    frameHeight: 128
  });

  this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', {
    frameWidth: 20,
    frameHeight: 21,
    margin: 1,
    spacing: 1
  });

  this.load.json('levelData', 'assets/json/levelData.json');
};

// called once after the preload ends
gameScene.create = function(){

  // creates background sprite
  this.bg = this.add.sprite(150, 50, 'background');

  if (!this.anims.get('idle_p')){
    // fire animations
    this.anims.create({
      key: 'idle_p',
      frames: 'idle_p',
      frameRate: 8,
      yoyo: true,
      repeat: -1
    });
  };

  if (!this.anims.get('running_p')){
    // walking animations
    this.anims.create({
      key: 'running_p',
      frames: 'running_p',
      frameRate: 14,
      repeat: -1
    });
  };

  if (!this.anims.get('jumping_p')){
    // walking animations
    this.anims.create({
      key: 'jumping_p',
      frames: 'jumping_p',
      frameRate: 16,
      repeat: -1
    });
  };

  if (!this.anims.get('dead_p')){
    // walking animations
    this.anims.create({
      key: 'dead_p',
      frames: 'dead_p',
      frameRate: 4,
      repeat: 0
    });
  };

  if (!this.anims.get('idle_e')){
    // fire animations
    this.anims.create({
      key: 'idle_e',
      frames: 'idle_e',
      frameRate: 8,
      yoyo: true,
      repeat: -1
    });
  };

  if (!this.anims.get('attack_e')){
    // fire animations
    this.anims.create({
      key: 'attack_e',
      frames: 'attack_e',
      frameRate: 2,
      repeat: -1
    });
  };

  // if (!this.anims.get('walk_m')){
  //   // fire animations
  //   this.anims.create({
  //     key: 'walk_m',
  //     frames: 'walk_m',
  //     frameRate: 2,
  //     repeat: -1
  //   });
  // };

  if (!this.anims.get('burning')){
    // fire animations
    this.anims.create({
      key: 'burning',
      frames: this.anims.generateFrameNames('fire', {
        frames: [0, 1]
      }),
      frameRate: 4,
      repeat: -1
    });
  };

  // add all level elements
  this.setupLevel();

  // initiate barrel spawner
  this.setupSpawner();

  // collision detection
  this.physics.add.collider([this.player, this.goal, this.barrels], this.platforms);

  // overlap checks
  this.physics.add.overlap(this.player, [this.fires, this.barrels], this.restartGameLose, null, this);
  this.physics.add.overlap(this.player, [this.goal], this.restartGameWin, null, this);

  // enable cursor keys
  this.cursors = this.input.keyboard.createCursorKeys();

  this.input.on('pointerdown', function(pointer){
    console.log(pointer.x, pointer.y);
    });
};

// this is called up to 60 times per second
gameScene.update = function(){
  // check player on the ground
  let onGround = this.player.body.blocked.down || this.player.body.touching.down;
  let killed = this.physics.overlap(this.player, [this.fires, this.barrels])
  this.is_dead = 0;

  this.physics.add.overlap(this.player, this.barrels, (player, barrel) => {
    barrel.setVelocityX(0)
    barrel.setVelocityY(0)

  });

  // handle player dead
  if (killed){
    this.is_dead += 1;
  }

  if (this.is_dead > 0){
    // give the player a velocity in Y
    this.player.body.setVelocityX(0);
    // // set default frame
    this.player.anims.play('dead_p', true);
  }
  // handle player moving
  else if (this.cursors.left.isDown){
    // move left
    this.player.body.setVelocityX(-this.playerSpeed);
    this.player.flipX = true;
    // start walking animation
    if (onGround)
      this.player.anims.play('running_p', true);
  }
  else if(this.cursors.right.isDown){
    // move right
    this.player.body.setVelocityX(this.playerSpeed);
    this.player.flipX = false;
    // start walking animation
    if (onGround)
      this.player.anims.play('running_p', true);
  }
  else{
    // stop walking
    this.player.body.setVelocityX(0);
    // // set default frame
    this.player.anims.play('idle_p', true);
  }

  // handle player jumping
  if (onGround && (this.cursors.space.isDown || this.cursors.up.isDown) && this.is_dead == false){
    // give the player a velocity in Y
    this.player.body.setVelocityY(this.jumpSpeed);
    // stop the walking animation
    this.player.anims.play('jumping_p', true);
  }


};

// sets up all the elements in the level
gameScene.setupLevel = function(){

  this.levelData = this.cache.json.get('levelData');

  // world bounds
  this.physics.world.bounds.width = this.levelData.world.width;
  this.physics.world.bounds.height = this.levelData.world.height;

  // create all the platforms
  this.platforms = this.physics.add.staticGroup();
  for (let i = 0; i < this.levelData.platforms.length; i++) {
    let curr = this.levelData.platforms[i];

    let newObj;

    // create object
    if (curr.key == 'ground') {
      // create tileSprite
      let width = this.textures.get(curr.key).get(0).width;
      let height = this.textures.get(curr.key).get(0).height;
      newObj = this.add.tileSprite(curr.x, curr.y, curr.numTiles * width , height , curr.key).setOrigin(0);
    }
    else {
      // create tileSprite
      let width = this.textures.get(curr.key).get(0).width;
      newObj = this.add.tileSprite(curr.x, curr.y, curr.numTiles * width , 18 , curr.key).setOrigin(0);
    }
    // enable physics
    this.physics.add.existing(newObj, true);

    // add to group
    this.platforms.add(newObj);
  };

  // create all the fires
  this.fires = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });
  for (let i = 0; i < this.levelData.fires.length; i++) {
    let curr = this.levelData.fires[i];

    let newObj = this.add.sprite(curr.x, curr.y, 'fire').setOrigin(0);

    // play burning animation
    newObj.anims.play('burning');

    // add to group
    this.fires.add(newObj);

    // this is for level creation
    newObj.setInteractive();
    this.input.setDraggable(newObj);
  };

  // create player
  this.player = this.add.sprite(this.levelData.player.x, this.levelData.player.y).play('idle_p');
  // this.player.setDisplaySize(50, 50);
  this.player.setSize(30, 35, true);
  this.player.setScale(0.5);
  // console.log()
  this.physics.add.existing(this.player);
  this.player.body.offset.x = 35;
  this.player.body.offset.y = 55;

  // set constraints of player to world bounds
  this.player.body.setCollideWorldBounds(true);

  // camera bounds
  this.cameras.main.setBounds(0, 0, this.levelData.world.width, this.levelData.world.height);
  this.cameras.main.startFollow(this.player);

  // goal
  this.goal = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y).play('idle_e');
  this.goal.setSize(30, 35, true);
  this.goal.setScale(0.5);
  // console.log()
  this.physics.add.existing(this.goal);
  this.goal.body.offset.x = 35;
  this.goal.body.offset.y = 55;

};

gameScene.restartGameLose = function(sourceSprite, targetSprite) {
  this.is_dead = true;

  this.cameras.main.fade(1200);

  // when fade out completes, restart scene
  this.cameras.main.on('camerafadeoutcomplete', function(){
    // restart the game
    this.scene.restart();
  }, this);
};

// restart game (game over + you won!)
gameScene.restartGameWin = function(sourceSprite, targetSprite) {

  this.cameras.main.fade(2500);

  // when fade out completes, restart scene
  this.cameras.main.on('camerafadeoutcomplete', function(){
    // restart the game
    this.scene.restart();
  }, this);
};

gameScene.setupSpawner = function(){
  //barrel group
  this.barrels = this.physics.add.group({
    bounceY: 0.1,
    bounceX: 1,
    collideWorldBounds: true
  });

  //spawn barrels
  let spawningEvent = this.time.addEvent({
    delay: this.levelData.spawner.interval,
    loop: true,
    callbackScope: this,
    callback: function(){
      // create a barrel
      this.goal.anims.play('attack_e');
      let barrel = this.barrels.get(this.goal.x, this.goal.y, 'barrel');

      // interactive
      barrel.setActive(true);
      barrel.setVisible(true);
      barrel.body.enable = true;

      // set properties
      barrel.setVelocityX(this.levelData.spawner.speed);

      // lifespan
      this.time.addEvent({
        delay: this.levelData.spawner.lifespan,
        repeat: 0,
        callbackScope: this,
        callback: function(){
          this.barrels.killAndHide(barrel);
          barrel.body.enable = false;
        }
      });
      this.goal.anims.play('idle_e');
    }
  });
};

// set the configuration of the game
let config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  scene: gameScene,
  title: 'Forest Witch',
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {y: 1000},
      // debug: true
    }
  }
};

// create a new game, pass the configuration
let game = new Phaser.Game(config);
