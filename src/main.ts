import Phaser from 'phaser'
import './style.css'

// 游戏场景：一个场景就够用了
class GameScene extends Phaser.Scene {

  // 这些对象都在 create() 里创建，加 ! 是告诉 TypeScript "稍后一定会赋值"
  private paddle!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  private ball!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  private bricks!: Phaser.Physics.Arcade.StaticGroup
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  // 球有没有发射出去（发射前球会跟着挡板走）
  private launched = false

  // 游戏有没有结束（结束就停掉一切，等重新开始）
  private gameOver = false

  constructor() {
    super('game')
  }

  preload() {
  this.load.image('paddle', 'man.jpg')
  }

  create() {
    // ---------- 先用 Graphics 画出几个纯色纹理当作占位图 ----------
    const g = this.add.graphics()

    // 球：20x20 的白色圆形
    g.fillStyle(0xffffff)
    g.fillCircle(10, 10, 10)
    g.generateTexture('ball', 20, 20)

    // 砖块：64x32
    g.clear()
    g.fillStyle(0xff9900)
    g.fillRect(0, 0, 64, 32)
    g.generateTexture('brick', 64, 32)

    g.destroy() // 纹理都生成好了，这个画笔可以扔了

    // ---------- 挡板（屏幕下方） ----------
    this.paddle = this.physics.add.image(400, 540, 'paddle')
    this.paddle.setDisplaySize(180, 118)
    // 注意：物理碰撞框默认用的是图片原始大小（600x394），
    // 必须再调一次 setSize 让碰撞框和显示大小一致
    this.paddle.body.setSize(180, 118)
    this.paddle.setImmovable(true)          // 不会被球撞动
    this.paddle.setCollideWorldBounds(true) // 不能移出屏幕

    // ---------- 球 ----------
    this.ball = this.physics.add.image(400, 460, 'ball')
    this.ball.setBounce(1)                            // 撞到什么都弹回来
    this.ball.setCollideWorldBounds(true, 1, 1, true) // 撞到屏幕边缘会发出 worldbounds 事件

    // 球撞到屏幕底部（也就是挡板没接住）就失败
    this.physics.world.on(
      Phaser.Physics.Arcade.Events.WORLD_BOUNDS,
      (body: Phaser.Physics.Arcade.Body) => {
        if (body.gameObject === this.ball && body.blocked.down) {
          this.endGame('失败\n点击任意键重新开始')
        }
      }
    )

    // ---------- 砖块（屏幕上方，3 行 x 8 列） ----------
    this.bricks = this.physics.add.staticGroup()
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        const x = 109 + col * 74 // 64 宽 + 10 间距
        const y = 50 + row * 42  // 32 高 + 10 间距
        this.bricks.create(x, y, 'brick') // 纹理本来就是橙色，不用再 tint
      }
    }

    // ---------- 碰撞 ----------
    // 球撞砖块：砖块消失，全没了就赢
    this.physics.add.collider(this.ball, this.bricks, (_ball: any, brick: any) => {
      brick.destroy()
      if (this.bricks.countActive() === 0) {
        this.endGame('成功\n点击任意键重新开始')
      }
    })

    // 球撞挡板：默认就是弹开，不用写回调
    this.physics.add.collider(this.ball, this.paddle)

    // ---------- 键盘 ----------
    this.cursors = this.input.keyboard!.createCursorKeys()

    // 按空格发射球
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (!this.launched) {
        this.launched = true
        this.ball.setVelocity(200, -300)
      }
    })

    // 游戏结束后：按任意键或者点一下鼠标，就重新开始
    this.input.keyboard!.on('keydown', () => {
      if (this.gameOver) this.scene.restart()
    })
    this.input.on('pointerdown', () => {
      if (this.gameOver) this.scene.restart()
    })
  }

  update() {
    // 游戏结束了：什么都不做
    if (this.gameOver) return

    // 左右方向键移动挡板
    if (this.cursors.left.isDown) {
      this.paddle.setVelocityX(-400)
    } else if (this.cursors.right.isDown) {
      this.paddle.setVelocityX(400)
    } else {
      this.paddle.setVelocityX(0)
    }

    // 球还没发射的时候，跟着挡板走
    if (!this.launched) {
      this.ball.setPosition(this.paddle.x, this.paddle.y - 70)
    }
  }

  // 游戏结束：停止一切活动，在屏幕中间显示文字
  private endGame(text: string) {
    if (this.gameOver) return // 已经结束过了，不用再来一次
    this.gameOver = true
    this.ball.setVelocity(0, 0)   // 球停下来
    this.paddle.setVelocityX(0)   // 挡板停下来
    this.physics.pause()          // 整个物理世界暂停
    this.add.text(400, 300, text, {
      fontSize: '48px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5)
  }
}

// 游戏配置
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#333333',
  // 游戏会按比例缩放并居中到窗口里
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade', // 用最简单的 Arcade 物理引擎
    arcade: {
      debug: false, // 想看看碰撞框的话可以改成 true
    },
  },
  scene: GameScene,
}

new Phaser.Game(config)
