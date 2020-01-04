import 'phaser'
import { Tweens, Scale } from 'phaser'
import problems from './problems'

const WIDTH = document.documentElement.clientWidth
const HEIGHT = 896 || document.documentElement.clientHeight

type Problem = {
  question: Question,
  answers: Array<Answer>
}

type Question = {
  label: string,
  instance?: Phaser.GameObjects.Text
}

type Answer = {
  label: string,
  isCorrect: boolean,
  instance?: Phaser.GameObjects.Text
}

export default class Bird extends Phaser.Scene {

  bird: Phaser.Physics.Arcade.Sprite
  birdTween: Tweens.Tween
  problems: Array<Problem>
  problem?: Problem

  constructor() {
    super('Bird')
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
    for (let i = 0; i < Math.ceil(WIDTH / 768); i++) {
      this.add.image(i * 768 + 384 - i, 320, 'background')  // 图片拼接会有间隙
    }
    let platforms = this.physics.add.staticGroup()
    for (let i = 0; i < Math.ceil(WIDTH / 36); i++) {
      platforms.create(16 + 36 * i, 832, 'ground')
    }
    platforms.setDepth(10)
    this.bird = this.physics.add.sprite(0, 0, 'bird')
    this.bird.setDepth(2)
    this.bird.setCollideWorldBounds(true)
    this.physics.add.collider(this.bird, platforms)
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
            getStart () {
              return -25
            },
            getEnd () {
              return 90
            }
          }
        }
      }
    })
    this.bird.play('birdfly')
    this.input.on('pointerdown', this.fly, this)
    // this.makePipes()
    this.initProblems()
    this.makeProblem()
  }
  update() {
  }
  start() {
  }
  makePipes() {
    let up = this.physics.add.image(1400, 300, 'pipe')
    up.setFlipY(true)
    let down = this.physics.add.image(400, 700, 'pipe')
    up.setGravityY(-2700) // 反重力
    down.setGravityY(-2700)
    up.setImmovable()
    down.setImmovable()
    down.setVelocityX(-200)
    up.setVelocityX(-200)
    this.physics.add.collider(this.bird, [down, up], () => {
      console.log(111)
    })
  }

  // about problems START
  initProblems () {
    this.problems = JSON.parse(JSON.stringify(problems))
  }
  makeProblem () {
    this.problem = this.chooseProblem()
    this.makeQuestion()
    this.makeAnswer()
  }
  chooseProblem (): Problem {
    const index = Math.floor(Math.random() * this.problems.length)
    return this.problems.splice(index, 1)[0]
  }
  makeQuestion () {
    this.problem.question.instance = this.add.text(
      WIDTH,
      HEIGHT / 2 - 60,
      this.problem.question.label,
      {
        fontSize: '40px',
        color: '#000'
      }
    )
    this.makeArcadeInstance(this.problem.question.instance)
    this.physics.add.collider(this.bird, this.problem.question.instance, () => {
      this.fly()
    })
  }
  makeAnswer () {
    this.problem.answers.forEach((item, index) => {
      item.instance = this.add.text(
        WIDTH + this.problem.question.label.length * 50, 
        HEIGHT / (this.problem.answers.length + 1) * (index + 1) - 100,
        item.label, 
        { 
          fontSize: '20px',
          color: '#000' 
        }
      )
      let body = this.makeArcadeInstance(item.instance)
      // 开启答案与左墙壁的碰撞检测，用于未作答情况
      body.setCollideWorldBounds(true)
      body.onWorldBounds = true
      body.world.setBoundsCollision(true, false, false, false)
      body.world.on(
        "worldbounds",
        body => {
          if (index === 0) {
            this.refreshProblem(body)
          }
        },
        item.instance
      )
      // 开启答案与小鸟的碰撞检测，用于作答情况
      this.physics.add.collider(this.bird, item.instance, () => {
        if (item.isCorrect) {
          console.log('正确')
        } else {
          console.log('错误')
        }
        this.refreshProblem(body)
      }) 
    })
  }
  makeArcadeInstance (instance: Phaser.GameObjects.Text) {
    this.physics.world.enable(instance) 
    let body = instance.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable()
    body.setVelocityX(-200)
    return body
  }
  refreshProblem (body) {
    body.world.removeListener('worldbounds')
    this.destroyProblem()
    this.makeProblem() // todo 创建水管
  }
  destroyProblem () {
    this.problem.question.instance.destroy()
    this.problem.answers.forEach(item => {
      item.instance.destroy()
    })
  }
  // about problems END

  fly() {
    this.bird.setAngle(-25)
    this.birdTween.resume()
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
}

const game = new Phaser.Game(config)
