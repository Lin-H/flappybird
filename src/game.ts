import 'phaser';
import { Tweens, Physics, Structs } from 'phaser';
import localForage from 'localforage';
import problems from './problems'

const HEIGHT = 896 || document.documentElement.clientHeight

const SPEED = 200
const problemProint = 30
let gap = 240
let timedEvent: Phaser.Time.TimerEvent
let timedAlive: Phaser.Time.TimerEvent
let stopPipeTimer: Phaser.Time.TimerEvent
let makeProblemTimer: Phaser.Time.TimerEvent
let switchProblemPipeTimer: Phaser.Time.TimerEvent
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

type Track = {
  gap: number,
  grade: number
}

type LocalItem = {
  maxGrade: number,
  track: Array<Track>
}

enum Status {
  ready,
  playing,
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
  changeScoreText: Phaser.GameObjects.Text
  score: number
  question: Phaser.GameObjects.Text

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
    this.openStartPanel()
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
    this.scoreText = this.add.text(this.size.width / 2, 100, '0', {
      fontSize: '70px',
      fontFamily: 'fb',
      align: 'center'
    })
    this.scoreText.setDepth(9)
    this.scoreText.setOrigin(.5, .5)
    this.changeScoreText = this.add.text(this.size.width / 2, 200, '', {
      fontSize: '70px',
      fontFamily: 'fb',
      align: 'center'
    })
    this.changeScoreText.setDepth(9)
    this.changeScoreText.setOrigin(.5, .5)
    this.bird = this.physics.add.sprite(0, 0, 'bird')
    this.bird.setDepth(2)
    this.bird.setCollideWorldBounds(true);
    this.birdCollider = this.physics.add.collider(this.bird, platforms, () => {
      if (this.status === Status.end) return
      this.die()
    })
    this.makeQuestion() // 初始化题目

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
        case Status.playing: {
          return this.fly()
        }
      }
    }, this)
  }
  update() {
    // 小鸟被题目撞到边界
    if (this.status === Status.playing && this.bird.x < 50) {
      this.bird.setVelocityX(200) 
      this.time.addEvent({
        delay: 2000,
        callback: () => {
          this.bird.setVelocityX(0) 
        },
        loop: false,
        callbackScope: this
      })
    }
  }
  ready() { // 进入准备阶段
    (this.bird.body as Physics.Arcade.Body).setAllowGravity(false)
    this.bird.setAngle(0)
    this.birdFloat.restart()
    this.pipes.clear(true, true) // 重新初始化水管
    firstAlivePipe = null
    this.setScore(0)
    this.bird.play('birdfly')
    this.bird.setVelocityX(0)
    this.bird.setPosition(this.size.width / 3, 300)
    this.initProblems() // 重新初始化题目
    this.destroyProblem()
    this.question.setPosition(this.size.width, HEIGHT / 2 - 60);
    this.status = Status.ready
    gap = 250
  }
  start() {
    this.status = Status.playing;
    (this.bird.body as Physics.Arcade.Body).setAllowGravity()
    this.birdFloat.stop()
    this.bird.play('birdfly')
    this.bird.setAngle(-25)
    this.birdTween.play()
    this.bird.setVelocityY(-700)
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
  fly() {
    this.birdTween.restart()
    this.bird.setVelocityY(-700)
  }
  die() {
    this.status = Status.end
    this.birdTween.stop(1)
    this.bird.setAngle(90)
    this.bird.anims.stop()
    // 停止所有水管移动
    this.pipes.setVelocityX(0)
    this.stopPipes()
    stopPipeTimer && stopPipeTimer.destroy()
    makeProblemTimer && makeProblemTimer.destroy()
    switchProblemPipeTimer && switchProblemPipeTimer.destroy()
    this.stopProblem()
    timedEvent.destroy()
    timedAlive.destroy()
    // 死亡时候先设置分数，再打开排行榜
    this.setGrade(this.score).then(() => this.openEndPanel())
  }
  makePipes () {
    this.makePipe()
    this.timer = setInterval(this.makePipe.bind(this), 2000)
    stopPipeTimer = this.time.addEvent({
      delay: 3800,
      callback: this.switchPipeProblem,
      loop: false,
      callbackScope: this
    })
  }
  makePipe() { // todo gap 原200，改为240方便调试
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
    down.setVelocityX(-SPEED)
    up.setVelocityX(-SPEED)
    let timer = setTimeout(() => {
      if (up.x < -100) {
        this.pipes.remove(up, true, true)
        this.pipes.remove(down, true, true)
      }
    }, 10000)
    this.physics.add.collider(this.bird, [down, up], () => {
      if (this.status === Status.end) return
      clearTimeout(timer)
      this.die()
    })
  }
  stopPipes() {
    clearInterval(this.timer)
  }
  switchPipeProblem () {
    this.stopPipes()
    makeProblemTimer = this.time.addEvent({
      delay: 2500,
      callback: this.makeProblem,
      loop: false,
      callbackScope: this
    })
  }

  // about problems START
  initProblems () {
    this.problems = problems.slice()
  }
  makeProblem () {
    this.problem = this.chooseProblem()
    // this.makeQuestion()
    this.question.setText(this.problem.question.label)
    let body = this.question.body as Physics.Arcade.Body
    body.width = this.question.width
    this.question.setPosition(this.size.width, HEIGHT / 2 - 60);
    (this.question.body as Physics.Arcade.Body).setVelocityX(-SPEED)
    this.makeAnswer()
    switchProblemPipeTimer = this.time.addEvent({
      delay: (this.size.width / 2 + this.question.width + 500) / 200 * 1000,
      callback: () => {
        this.makePipes()
        timedEvent.paused = false
      },
      loop: false,
      callbackScope: this
    })
  }
  chooseProblem (): Problem {
    const index = Phaser.Math.Between(0, this.problems.length)
    return this.problems.splice(index, 1)[0]
  }
  makeQuestion () {
    this.question = this.add.text(
      this.size.width,
      HEIGHT / 2 - 60,
      '',
      {
        fontSize: '40px',
        color: '#000',
        padding: {
          top: 2
        }
      }
    )
    let body = this.makeArcadeInstance(this.question)
    body.setImmovable()
    this.physics.add.collider(this.bird, this.question, () => {
      if (this.bird.y < HEIGHT / 2) {
        this.fly()
      }
    })
  }
  makeAnswer () {
    this.problem.answers.forEach((item, index) => {
      item.instance = this.add.text(
        this.size.width + this.question.width + 400, 
        HEIGHT / (this.problem.answers.length + 1) * (index + 1) - 100,
        item.label, 
        { 
          fontSize: '28px',
          color: '#000',
          padding: {
            top: 2
          }
        }
      )
      let body = this.makeArcadeInstance(item.instance)
      body.setVelocityX(-SPEED)
      // 开启答案与左墙壁的碰撞检测，用于未作答情况
      body.setCollideWorldBounds(true)
      body.onWorldBounds = true
      body.world.setBoundsCollision(true, false, true, true)
      body.world.on(
        "worldbounds",
        body => {
          if (index === 0) {
            body.world.removeListener('worldbounds')
            this.destroyProblem()
          }
        },
        item.instance
      )
      // 开启答案与小鸟的碰撞检测，用于作答情况
      this.physics.add.collider(this.bird, item.instance, () => {
        if (item.isCorrect) {
          this.addScore(problemProint, true)
          if (gap > 200) {
            gap -= 5
          }
        } else {
          this.addScore(-30, true)
        }
        this.bird.setVelocityX(0) // 防止小鸟被反作用力反弹
        body.world.removeListener('worldbounds')
        this.destroyProblem()
      }) 
    })
  }
  makeArcadeInstance (instance: Phaser.GameObjects.Text): arcadeBody {
    this.physics.world.enable(instance) 
    let body = instance.body as arcadeBody
    body.setAllowGravity(false)
    return body
  }
  stopProblem () {
    if (!this.problem) return
    let questionInstance = this.question
    if (questionInstance) {
      let questionBody = questionInstance.body as arcadeBody
      questionBody && questionBody.setVelocityX(0)
    }
    this.problem.answers.forEach(item => {
      let answerInstance = item.instance
      if (answerInstance) {
        let answerBody = answerInstance.body as arcadeBody
        answerBody && answerBody.setVelocityX(0)
      }
    })
  }
  destroyProblem () {
    if (!this.problem) return
    // let questionInstance = this.problem.question.instance
    // questionInstance && this.problem.question.instance.destroy()
    this.problem.answers.forEach(item => {
      let answerInstance = item.instance
      answerInstance && answerInstance.destroy()
    })
  }
  // about problems END

  saveUserName() {
    const userName = document.querySelector<HTMLInputElement>('.name-input').value.trim()
    if (!userName) return alert('姓名不能为空')
    localForage.getItem(userName).then((data?: LocalItem) => {
      // 新建用户数据
      let localItem: LocalItem = {
        maxGrade: 0,
        track: []
      }
      data === null && localForage.setItem(userName, localItem)
      this.currentUser = userName
      this.startLayer.setVisible(false)
    })
  }
  // 打开游戏开始面板
  openStartPanel() {
    if (!this.startLayer) {
      this.startLayer = this.add.dom(0, 0, '#start')
      this.startLayer.addListener('click')
      this.startLayer.addListener('keydown')
      this.startLayer.on('click', ({target}) => {
        target.classList.contains('start-button') && this.saveUserName()
        if (target.classList.contains('operation-container')) {
          const startPanel = document.querySelector('#start')
          if (startPanel.classList.contains('in-billboard')) {
            startPanel.classList.remove('in-billboard')
          } else {
            startPanel.classList.add('in-billboard')
            this.openGradeBillboard(true)
          }
        }
      })
      this.startLayer.on('keydown', e => {
        if (e.code === 'Enter' && e.target.classList.contains('name-input')) {
          this.saveUserName()
        }
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
        this.ready()
      })
    }
    this.openGradeBillboard(false)
    this.endLayer.setVisible(true)
  }
  // 设置分数
  setGrade(grade: number) {
    return localForage.getItem(this.currentUser).then(data => {
      let localItem: any = data
      return localForage.setItem(this.currentUser, {
        maxGrade: Math.max(localItem.maxGrade, grade), // 取最高分存入
        track: localItem.track.concat({
          gap,
          grade
        })
      })
    })
  }
  // 打开排行榜
  openGradeBillboard(isStart) {
    const gradeList = []
    localForage.iterate((localItem: LocalItem, user) => {
      gradeList.push({user, grade: localItem.maxGrade})
    }).then(() => {
      gradeList.sort((a, b) => b.grade - a.grade)
      let html = ''
      gradeList.slice(0, 20).forEach(item => html += `<div><span>${item.user}</span><span>${item.grade}</span></div>`)
      document.querySelector(`.${isStart ? 'start' : 'end'}-grade-billboard`).innerHTML = html
    })
  }
  setScore(score: number) {
    this.score = score
    this.scoreText.setText(this.score + '')
  }
  addScore(addScore: number, showChange?: boolean) { // 加分或加负分
    this.setScore(this.score + addScore)
    if (showChange) {
      const isAdd = addScore > 0
      this.changeScoreText.setColor(isAdd ? '#20a0ff' : '#ff6f6f')
      this.changeScoreText.setText(isAdd ? `+${addScore}😄` : addScore + '😪')
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          this.changeScoreText.setText('')
        },
        loop: false,
        callbackScope: this
      })
    }
  }
  aliveScore() { // 存活加分
    this.addScore(1)
  }
  checkPass() {
    if (this.pipes.getLength() <= 0) return
    // 穿过最后一组水管进入答题
    if (this.pipes.getChildren().length > 2 && !this.pipes.getChildren().filter(children => children.active).length) {
      timedEvent.paused = true
      return
    }
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
      gravity: { y: 2700 }
    }
  },
  parent: 'body',
  dom: {
    createContainer: true
  }
};

const game = new Phaser.Game(config)
