var MyGame = (function () {
  'use strict';

  var global = window;

  const WIDTH = document.documentElement.clientWidth;
  const HEIGHT = 896 || document.documentElement.clientHeight;
  class Bird extends Phaser.Scene {
      constructor() {
          super('Bird');
      }
      preload() {
          this.load.image('ground', 'assets/ground.png');
          this.load.image('background', 'assets/background.png');
          this.load.image('pipe', 'assets/pipe.png');
          this.load.spritesheet('bird', 'assets/bird.png', {
              frameWidth: 92,
              frameHeight: 64,
              startFrame: 0,
              endFrame: 2
          });
      }
      create() {
          for (let i = 0; i < Math.ceil(WIDTH / 768); i++) {
              this.add.image(i * 768 + 384 - i, 320, 'background'); // 图片拼接会有间隙
          }
          let platforms = this.physics.add.staticGroup();
          for (let i = 0; i < Math.ceil(WIDTH / 36); i++) {
              platforms.create(16 + 36 * i, 832, 'ground');
          }
          platforms.setDepth(10);
          this.bird = this.physics.add.sprite(0, 0, 'bird');
          this.bird.setDepth(2);
          this.bird.setCollideWorldBounds(true);
          this.physics.add.collider(this.bird, platforms);
          this.anims.create({
              key: 'birdfly',
              frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 2 }),
              frameRate: 10,
              repeat: -1
          });
          this.birdTween = this.tweens.add({
              targets: this.bird,
              delay: 300,
              duration: 500,
              ease: 'easeOut',
              paused: true,
              props: {
                  'angle': {
                      value: {
                          getStart() {
                              return -25;
                          },
                          getEnd() {
                              return 90;
                          }
                      }
                  }
              }
          });
          this.bird.play('birdfly');
          this.input.on('pointerdown', this.fly, this);
          this.makePipes();
      }
      update() {
      }
      start() {
      }
      makePipes() {
          let up = this.physics.add.image(1400, 300, 'pipe');
          up.setFlipY(true);
          let down = this.physics.add.image(400, 700, 'pipe');
          up.setGravityY(-2700); // 反重力
          down.setGravityY(-2700);
          up.setImmovable();
          down.setImmovable();
          down.setVelocityX(-200);
          up.setVelocityX(-200);
          this.physics.add.collider(this.bird, [down, up], () => {
              console.log(111);
          });
      }
      fly() {
          this.bird.setAngle(-25);
          this.birdTween.resume();
          this.birdTween.restart();
          this.bird.setVelocityY(-700);
      }
  }
  const config = {
      type: Phaser.AUTO,
      backgroundColor: '#ded895',
      scene: Bird,
      scale: {
          width: '100%',
          height: HEIGHT,
          mode: Phaser.Scale.ScaleModes.HEIGHT_CONTROLS_WIDTH,
          autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
      },
      physics: {
          default: 'arcade',
          arcade: {
              gravity: { y: 2700 },
              debug: false
          }
      },
  };
  const game = new Phaser.Game(config);

  return Bird;

}());
//# sourceMappingURL=game.js.map
