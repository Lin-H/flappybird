import 'phaser';
import { Tweens } from 'phaser';

const WIDTH = 768
const HEIGHT = 896

export default class Bird extends Phaser.Scene {

  bird: Phaser.Physics.Arcade.Sprite
  birdTween: Tweens.Tween

  constructor() {
    super('Bird')
  }

  preload() {
    this.load.image('ground', 'assets/ground.png')
    this.load.image('background', 'assets/background.png');
    this.load.spritesheet('bird', 'assets/bird.png', {
      frameWidth: 92,
      frameHeight: 64,
      startFrame: 0,
      endFrame: 2
    })
  }

  create() {
    let platforms = this.physics.add.staticGroup();
    let a = this.add.image(384, 320, 'background')
    for (let i = 0; i < Math.ceil(WIDTH / 36); i++) {
      platforms.create(16 + 36 * i, 832, 'ground')
    }
    this.bird = this.physics.add.sprite(384, 448, 'bird')
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
        'angle':{
          value: {
            getStart() {
              return -25
            },
            getEnd() {
              return 90
            }
          }
        }
      }
    })
    this.bird.play('birdfly')
    this.input.on('pointerdown', this.fly, this)
  }
  update() {
  }
  fly() {
    this.bird.setAngle(-25)
    this.birdTween.resume()
    this.birdTween.restart()
    this.bird.setVelocityY(-700)
  }
}

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#125555',
  width: WIDTH,
  height: HEIGHT,
  scene: Bird,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 2700 },
      debug: false
    }
  },
};

const game = new Phaser.Game(config)
