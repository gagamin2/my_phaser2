# 🏀💪 肘击篮球

一个用 Phaser 4 写的打砖块小游戏，用来学习物理碰撞和键盘操作。

## 玩法

- **空格键**：发射篮球
- **← / → 方向键**：移动挡板
- 篮球弹起来打掉上方所有砖块即获胜
- 篮球落到屏幕底部（挡板没接住）则失败
- 结束后按任意键（或点击鼠标）重新开始

## 运行

```bash
npm install
npm run dev
```

浏览器打开终端里显示的地址（默认 http://localhost:5173）即可游玩。

## 技术栈

- [Phaser 4](https://phaser.io/) 游戏框架（Arcade 物理引擎）
- [Vite](https://vite.dev/) 构建工具
- TypeScript

## 文件结构

- `src/main.ts` — 全部游戏逻辑
- `public/` — 图片（挡板、结束画面）和音效资源
