/// <reference >

import 'phaser';
import { Tweens, Scale, Physics, Structs } from 'phaser';

const HEIGHT = 896 || document.documentElement.clientHeight

enum Status {
  ready,
  palying,
  end
}

export default class Bird extends Phaser.Scene {

  bird: Phaser.Physics.Arcade.Sprite
  birdTween: Tweens.Tween
  birdCollider: Physics.Arcade.Collider
  alive: Boolean
  status: Status
  timer: NodeJS.Timeout
  size: Structs.Size
  birdFloat: Tweens.Tween
  pipes: Phaser.Physics.Arcade.Group

  constructor() {
    super('Bird')
    this.status = Status.ready
  }

  preload() {
    this.load.image('ground', 'assets/ground.png')
    this.load.image('background', 'assets/background.png')
    this.load.image('pipe', 'assets/pipe.png')
    this.load.spritesheet('bird', 'assets/bird.png', {
      frameWidth: 92,
      frameHeight: 64,
      startFrame: 0,
      endFrame: 2
    })
  }

  create() {
    // 初始化数据
    this.pipes = this.physics.add.group()
    this.size = this.scale.baseSize
    for (let i = 0; i < Math.ceil(this.size.width / 768); i++) {
      this.add.image(i * 768 + 384 - i, 320, 'background')  // 图片拼接会有间隙
    }
    let platforms = this.physics.add.staticGroup()
    for (let i = 0; i < Math.ceil(this.size.width / 36); i++) {
      platforms.create(16 + 36 * i, 832, 'ground')
    }
    platforms.setDepth(10)
    this.bird = this.physics.add.sprite(400, 300, 'bird')
    this.bird.setDepth(2)
    this.bird.setCollideWorldBounds(true);
    (this.bird.body as Physics.Arcade.Body).setAllowGravity(false)
    this.birdCollider = this.physics.add.collider(this.bird, platforms, () => {
      if (this.status === Status.end) return
      this.die()
    })
    
    this.anims.create({
      key: 'birdfly',
      frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    })
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
    this.birdFloat = this.tweens.add({
      targets: this.bird,
      delay: 0,
      duration: 800,
      ease: 'ease',
      y: {
        value: '-=100'
      },
      yoyo: true,
      repeat: -1
    })
    this.initEvent()
    this.ready()
  }
  initEvent() {
    this.input.on('pointerdown', function() {
      switch (this.status) {
        case Status.ready: {
          return this.start()
        }
        case Status.palying: {
          return this.fly()
        }
      }
    }, this)
  }
  update() {
  }
  ready() { // 进入准备阶段
    this.bird.play('birdfly')
    this.bird.setPosition(400, 300)
    this.status = Status.ready
  }
  start() {
    this.status = Status.palying;
    (this.bird.body as Physics.Arcade.Body).setAllowGravity()
    this.birdFloat.stop()
    this.bird.play('birdfly')
    this.bird.setAngle(-25)
    this.birdTween.resume()
    this.bird.setVelocityY(-700)
    this.timer = setInterval(this.makePipes.bind(this), 2000)
  }
  die() {
    this.status = Status.end
    this.input.off('pointerdown', this.fly)
    this.birdTween.stop()
    this.bird.setAngle(90)
    this.bird.anims.stop()
    // 停止所有水管移动
    this.pipes.setVelocityX(0)
  }
  makePipes(gap = 200) {
    let up = this.physics.add.image(this.size.width + 100, 0, 'pipe')
    up.setFlipY(true)
    let height = up.height
    let randomHeight = Math.ceil(Math.random() * (this.size.height - 300 - gap)) -700 + height /2
    up.y = randomHeight
    let down = this.physics.add.image(this.size.width + 100, 0, 'pipe')
    down.y = up.y + gap + height
    this.pipes.addMultiple([up, down])
    // 目前Phaser有bug，physics.body的类型不正确
    ;(up.body as Physics.Arcade.Body).setAllowGravity(false)
    ;(down.body as Physics.Arcade.Body).setAllowGravity(false)
    up.setImmovable()
    down.setImmovable()
    down.setVelocityX(-200)
    up.setVelocityX(-200)
    let timer = setTimeout(() => {
      this.pipes.remove(up)
      this.pipes.remove(down)
    }, 10000)
    this.physics.add.collider(this.bird, [down, up], () => {
      if (this.status === Status.end) return
      clearTimeout(timer)
      this.die()
      this.stopPipes()
    })
  }
  stopPipes() {
    clearInterval(this.timer) 
  }
  fly() {
    this.birdTween.restart()
    this.bird.setVelocityY(-700)
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

const game = new Phaser.Game(config)
