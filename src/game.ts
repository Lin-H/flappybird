import 'phaser';
import { Tweens, Physics, Structs } from 'phaser';
import localForage from 'localforage';
import problems from './problems'

const HEIGHT = 896 || document.documentElement.clientHeight

let scorePoint = 0
let timedEvent: Phaser.Time.TimerEvent
let timedAlive: Phaser.Time.TimerEvent
let firstAlivePipe: Physics.Arcade.Image = null

type arcadeBody = Phaser.Physics.Arcade.Body

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

enum Status {
  ready,
  palying,
  end
}

export default class Bird extends Phaser.Scene {

  bird: Phaser.Physics.Arcade.Sprite
  birdTween: Tweens.Tween
  problems: Array<Problem>
  problem?: Problem
  birdCollider: Physics.Arcade.Collider
  alive: Boolean
  startLayer: Phaser.GameObjects.DOMElement
  endLayer: Phaser.GameObjects.DOMElement
  status: Status
  timer: NodeJS.Timeout
  size: Structs.Size
  birdFloat: Tweens.Tween
  pipes: Phaser.Physics.Arcade.Group
  currentUser: string
  scoreText: Phaser.GameObjects.Text
  score: number

  constructor() {
    super('Bird')
    this.status = Status.ready
    this.score = 0
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
    // this.openStartPanel()
    this.pipes = this.physics.add.group()
    this.size = this.scale.baseSize
    scorePoint = this.size.width / 3
    for (let i = 0; i < Math.ceil(this.size.width / 768); i++) {
      this.add.image(i * 768 + 384 - i, 320, 'background')  // 图片拼接会有间隙
    }
    let platforms = this.physics.add.staticGroup()
    for (let i = 0; i < Math.ceil(this.size.width / 36); i++) {
      platforms.create(16 + 36 * i, 832, 'ground')
    }
    platforms.setDepth(10)
    this.scoreText = this.add.text(this.size.width / 2, 100, '0', {
      fontSize: '70px',
      fontFamily: 'fb',
      align: 'center'
    })
    this.setScore(0)
    this.scoreText.setDepth(9)
    this.scoreText.setOrigin(.5, .5)
    this.bird = this.physics.add.sprite(0, 0, 'bird')
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
    // this.initProblems()
    // this.makeProblem()
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
    this.bird.setPosition(this.size.width / 3, 300)
    this.status = Status.ready
  }
  start() {
    this.status = Status.palying;
    (this.bird.body as Physics.Arcade.Body).setAllowGravity()
    this.birdFloat.stop()
    this.bird.play('birdfly')
    this.bird.setAngle(-25)
    this.birdTween.play()
    this.bird.setVelocityY(-700)
    this.timer = setInterval(this.makePipes.bind(this), 2000)
    this.makePipes()
    // 使用定时器来计算小鸟是否通过水管，update过于频繁
    timedEvent = this.time.addEvent({
      delay: 200,
      callback: this.checkPass,
      loop: true,
      callbackScope: this
    })
    // 计时存活
    timedAlive = this.time.addEvent({
      delay: 1000,
      callback: this.aliveScore,
      loop: true,
      callbackScope: this
    })
  }
  die() {
    this.status = Status.end
    this.birdTween.stop(1)
    this.bird.setAngle(90)
    this.bird.anims.stop()
    // 停止所有水管移动
    this.pipes.setVelocityX(0)
    this.stopPipes()
    timedEvent.destroy()
    timedAlive.destroy()
    // todo 死亡时候先设置分数，再打开排行榜
    this.setGrade(+new Date).then(() => this.openEndPanel())
  }
  makePipes(gap = 300) { // todo gap 原200，改为300方便调试
    let up = this.physics.add.image(this.size.width + 100, 0, 'pipe')
    up.setName('up')
    up.setFlipY(true)
    let height = up.height
    let randomHeight = Math.ceil(Math.random() * (this.size.height - 300 - gap)) -700 + height /2
    up.y = randomHeight
    let down = this.physics.add.image(this.size.width + 100, 0, 'pipe')
    down.name = 'down'
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
    })
  }

  // about problems START
  initProblems () {
    this.problems = problems.slice()
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
      this.size.width,
      HEIGHT / 2 - 60,
      this.problem.question.label,
      {
        fontSize: '40px',
        color: '#000'
      }
    )
    let body = this.makeArcadeInstance(this.problem.question.instance)
    body.setImmovable()
    this.physics.add.collider(this.bird, this.problem.question.instance, () => {
      this.fly()
    })
  }
  makeAnswer () {
    this.problem.answers.forEach((item, index) => {
      item.instance = this.add.text(
        this.size.width + this.problem.question.instance.width + 500, 
        HEIGHT / (this.problem.answers.length + 1) * (index + 1) - 100,
        item.label, 
        { 
          fontSize: '28px',
          color: '#000' 
        }
      )
      let body = this.makeArcadeInstance(item.instance)
      // 开启答案与左墙壁的碰撞检测，用于未作答情况
      body.setCollideWorldBounds(true)
      body.onWorldBounds = true
      body.world.setBoundsCollision(true, false, true, true)
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
        this.bird.setVelocityX(0) // 防止小鸟被反作用力反弹
        this.refreshProblem(body)
      }) 
    })
  }
  makeArcadeInstance (instance: Phaser.GameObjects.Text): arcadeBody {
    this.physics.world.enable(instance) 
    let body = instance.body as arcadeBody
    body.setAllowGravity(false)
    body.setVelocityX(-200)
    return body
  }
  refreshProblem (body: arcadeBody) {
    body.world.removeListener('worldbounds')
    this.destroyProblem()
    this.makeProblem() // todo 删除掉这行
    console.log('创建水管')
  }
  destroyProblem () {
    this.problem.question.instance.destroy()
    this.problem.answers.forEach(item => {
      item.instance.destroy()
    })
  }
  // about problems END

  stopPipes() {
    clearInterval(this.timer)
  }
  fly() {
    this.birdTween.restart()
    this.bird.setVelocityY(-700)
  }
  // 打开游戏开始面板
  openStartPanel() {
    if (!this.startLayer) {
      this.startLayer = this.add.dom(0, 0, '#start')
      this.startLayer.addListener('click')
      this.startLayer.on('click', ({target}) => {
        if (!target.classList.contains('start-button')) return
        const userName = document.querySelector<HTMLInputElement>('.name-input').value.trim()
        if (!userName) return alert('姓名不能为空')
        localForage.getItem(userName).then((data) => {
            // 新建用户数据
            data === null && localForage.setItem(userName, 0)
            this.currentUser = userName
            this.startLayer.setVisible(false)
        })
      })
    }
    this.startLayer.setVisible(true)
  }
  // 游戏结束面板
  openEndPanel() {
    if (!this.endLayer) {
      this.endLayer = this.add.dom(0, 0, '#end')
      document.querySelector('.replay-button').addEventListener('click', () => {
        this.endLayer.setVisible(false)
        this.openStartPanel()
      })
    }
    const gradeList = []
    localForage.iterate((grade, user) => {
      gradeList.push({user, grade})
    }).then(() => {
      gradeList.sort((a, b) => b.grade - a.grade)
      let html = ''
      gradeList.slice(0, 20).forEach(item => html += `<div><span>${item.user}</span><span>${item.grade}</span></div>`)
      document.querySelector('.grade-list').innerHTML = html
    })
    this.endLayer.setVisible(true)
  }
  // 设置分数
  setGrade(grade: Number) {
    return localForage.getItem(this.currentUser).then(data => {
      // 取最高分存入
      if (grade > data) {
        return localForage.setItem(this.currentUser, grade)
      }
      return Promise.resolve<Number>(0)
    })
  }
  setScore(score: number) {
    this.score = score
    this.scoreText.setText(this.score + '')
  }
  addScore(score: number) { // 加分或加负分
    this.score += score
    this.scoreText.setText(this.score + '')
  }
  aliveScore() { // 存活加分
    this.addScore(1)
  }
  checkPass() {
    if (this.pipes.getLength() <= 0) return
    if (!firstAlivePipe) {
      firstAlivePipe = this.pipes.getFirstAlive()
      // 垂直方向上只判断一根水管
      if (firstAlivePipe.name == 'down') {
        firstAlivePipe.setActive(false)
        firstAlivePipe = null
        return
      }
    }
    let x = firstAlivePipe.x
    if (x > this.size.width / 3) return
    // 小鸟已过水管中间
    this.addScore(10)
    firstAlivePipe.setActive(false)
    firstAlivePipe = null
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
      debug: true
    }
  },
  parent: 'body',
  dom: {
    createContainer: true
  }
};

const game = new Phaser.Game(config)
