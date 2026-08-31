import Phaser from 'phaser'
import './style.css'

class GameScene extends Phaser.Scene {

  private paddle!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  private ball!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  private bricks!: Phaser.Physics.Arcade.StaticGroup
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  private launched = false
  private gameOver = false

  // 提示文字
  private endText: Phaser.GameObjects.Text | null = null
  private launchText!: Phaser.GameObjects.Text

  // 结束图片（成功/失败）
  private endImage: Phaser.GameObjects.Image | null = null

  //移动挡板位置
  private updatePaddle(delta:number){
    const PaddleSpeed=400
    if(this.cursors.left.isDown){
      this.paddle.x-=PaddleSpeed*delta
    }else if(this.cursors.right.isDown){
      this.paddle.x+=PaddleSpeed*delta
    }
  }
  
  constructor() {
    super('game')
  }

  preload() {
    this.load.image('paddle', 'man.jpg')
    this.load.audio('kun', 'kun.mp3')
    this.load.audio('niganma', 'niganma.mp3')
    this.load.image('success', 'success.jpg')
    this.load.image('failure', 'failure.jpg')
    this.load.audio('man2','man.mp3')
    this.load.audio('success2','success.mp3')
  }

  create() {
    const g = this.add.graphics()

    // 篮球：一横线两竖线
    g.fillStyle(0xf28c28)
    g.fillCircle(10, 10, 10)
    g.lineStyle(1.5, 0x000000, 1)
    g.lineBetween(1, 10, 19, 10)
    g.lineBetween(6, 1, 6, 19)
    g.lineBetween(14, 1, 14, 19)
    g.generateTexture('ball', 20, 20)

    // 砖块
    g.clear()
    g.fillStyle(0x287b9f)
    g.fillRoundedRect(0, 0, 64, 32, 6)
    //砖块顶部高光
    g.fillStyle(0x4fa3c7)
    g.fillRoundedRect(3, 3, 58, 5, 3)
    g.generateTexture('brick', 64, 32)
  
    g.destroy()

    // 挡板
    this.paddle = this.physics.add.image(400, 540, 'paddle')
    this.paddle.setDisplaySize(180, 118)
    this.paddle.setImmovable(true)
    this.paddle.setCollideWorldBounds(true)

    // 篮球
    this.ball = this.physics.add.image(400, 460, 'ball')
    this.ball.setBounce(1)
    this.ball.setCollideWorldBounds(true, 1, 1, true)

    //开始前提示文字
    this.launchText = this.add.text(400, 300, '点击空格发射篮球', {
      fontSize: '28px',
      color: '#164863',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 球碰撞屏幕底部时，游戏失败
    this.physics.world.on(
      Phaser.Physics.Arcade.Events.WORLD_BOUNDS,
      (body: Phaser.Physics.Arcade.Body) => {
        if (body.gameObject === this.ball && body.blocked.down) {
          this.sound.play('niganma')
          this.endGame('你干嘛哎呦~~\n点击任意键重新开始', 'failure')
        }
      }
    )

    this.bricks = this.physics.add.staticGroup()
    this.createBricks()

    // 球撞砖块：砖块消失
    this.physics.add.collider(this.ball, this.bricks, (_ball: any, brick: any) => {
      this.sound.play('kun')
      brick.destroy()
      if (this.bricks.countActive() === 0) {
        this.endGame('基泥苔煤~~\n点击任意键重新开始', 'success')
      }
    })

    // 球撞挡板：弹开
    this.physics.add.collider(this.ball, this.paddle, () => {
      this.sound.play('man2')
    })

    this.cursors = this.input.keyboard!.createCursorKeys()

    // 按空格发射球
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (!this.launched) {
        this.launched = true
        this.ball.setVelocity(200, -300)
        this.launchText.setVisible(false)
      }
    })
  }

  update() {
    if (this.gameOver) return
    const delta = this.game.loop.delta / 1000
    this.updatePaddle(delta)
    if (!this.launched) {
      this.ball.setPosition(this.paddle.x, this.paddle.y- 70)
    }//发射前球跟随挡板移动
  }

  // 游戏结束
  private endGame(text: string, imageKey: string) {
    if (this.gameOver) return
    this.gameOver = true
    this.ball.setVelocity(0, 0) // 球停
    this.paddle.setVelocityX(0) // 挡板停

    if (imageKey === 'success') {
      this.sound.play('success2')
    }

    // 成功/失败时放置图片
    this.endImage = this.add.image(180, 300, imageKey).setOrigin(0.5)
    const ratio = this.endImage.width / this.endImage.height
    this.endImage.setDisplaySize(200 * ratio, 200)

    // 文字置于图片右边
    this.endText = this.add.text(510, 300, text, {
      fontSize: '45px',
      color: '#ef3753',
      align: 'center',
    }).setOrigin(0.5)

    // 按任意键重启，复位游戏状态
    this.input.keyboard!.once('keydown', this.resetGame, this)
    this.input.once('pointerdown', this.resetGame, this)
  }

  // 重新开始时游戏状态复位
  private resetGame() {
    this.input.keyboard!.off('keydown', this.resetGame, this)
    this.input.off('pointerdown', this.resetGame, this)

    this.gameOver = false
    this.launched = false
    this.launchText.setVisible(true)

    // 删掉提示文字和图片
    this.endText?.destroy()
    this.endText = null
    this.endImage?.destroy()
    this.endImage = null

    // 挡板和球回到初始位置
    this.paddle.setPosition(400, 540)
    this.paddle.setVelocityX(0)
    this.ball.setVelocity(0, 0)
    this.ball.setPosition(this.paddle.x, this.paddle.y - 70)

    // 重新摆一遍砖块
    this.bricks.clear(true, true)
    this.createBricks()
  }

  // 创建砖块：3*9
  private createBricks() {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 9; j++) {
        const x = 109 + j * 74 // 砖块长64 + 10间距
        const y = 50 + i * 42  // 砖块宽32 + 10间距
        this.bricks.create(x, y, 'brick')
      }
    }
  }
}

// 游戏配置
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#eef7fb',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: GameScene,
}

new Phaser.Game(config)
