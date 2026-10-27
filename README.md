# 🐱🐶 萌宠接金币 · Paws & Coins

小猫小狗的小小发财计划。用 60 秒接住金币、躲开炸弹，装满快乐的小口袋。

[🎮 在线玩](https://jiangwen2026132-dev.github.io/puppy-coin-catch/)

使用原生 HTML、CSS、JavaScript 和 Canvas，无需安装依赖、无需后端或 API Key。v2.0 使用内置图像生成工具制作的完整毛绒宠物插画和绘本花园，透明角色导出为 WebP，音效由浏览器合成。游戏运行时只读取同站文件，没有第三方素材或外部网络请求。美术方向、参考来源和提示词见 [美术说明](docs/art-direction.md)。

## 怎么玩

- 先选择 **小狗 / 猫咪**，再选外观：小狗有 **西高地、泰迪、边牧**，猫咪有 **橘猫、布偶、奶牛猫**。欢迎头像、完整游戏角色和页面称呼同步变化，游戏中也可随时切换。
- 猫狗两类会分别记住上次选的外观；来回切换或刷新后可以恢复。兼容上一版已保存的小狗选择，切换不会重置本局得分、爱心、时间或最高纪录。偏好保存在当前浏览器中。
- 电脑：方向键 `←` `→` 或 `A` `D` 移动，也可在游戏区内移动鼠标。
- 手机：在游戏区拖动手指，或按住下方的左右按钮。
- 暂停：点击右上角暂停按钮，或按空格 / `P` / `Esc`。切换窗口或标签页会自动暂停。
- 金币 **+10 分**，骨头 **+30 分**。连击达到 5 次（含第 5 次）时，奖励得分翻倍；漏接奖励或碰到炸弹会中断连击。
- 炸弹扣 1 颗爱心，碰撞后有 1.2 秒保护时间。漏接金币不会扣爱心。
- 每局 60 秒、3 颗爱心。时间结束或爱心用完时结算，可以重新开始。
- 音效默认关闭，可点击页面右上角开关打开。最高分保存在当前浏览器的本地存储中，不跨设备同步；清除浏览器数据会重置纪录。存储不可用时仍可游玩。

## 在自己的电脑上玩

直接双击 `index.html` 即可打开。推荐通过本地服务预览：

```sh
cd puppy-coin-catch
python3 -m http.server 4173 --bind 127.0.0.1
```

然后打开 <http://127.0.0.1:4173>。该地址仅在自己的电脑及服务运行期间可用；终端按 `Ctrl+C` 停止服务。

## 放到 GitHub 并获得试玩链接

1. 登录 GitHub，新建名为 `puppy-coin-catch` 的仓库。如使用 GitHub Free 的 Pages，请选择 **Public**。
2. 选择 **uploading an existing file**，把本项目文件及 `assets`、`tests` 文件夹上传到仓库根目录，点击 **Commit changes**。确认 `index.html` 直接位于根目录。
3. 进入仓库 **Settings → Pages**，在 **Build and deployment** 中选择 **Deploy from a branch**，分支选择 **main**，目录选择 **/ (root)**，点击 **Save**。
4. 等待部署完成，在 Pages 页面点击 **Visit site**，就可以把该链接分享给朋友。地址形式通常为 `https://你的用户名.github.io/puppy-coin-catch/`，以 GitHub 实际显示为准。

只上传 `puppy-coin-catch` 文件夹里的游戏文件即可。不要上传其上层文件夹。发布后的游戏网页可以被公开访问。

已安装 Git、并已完成 GitHub 身份验证的情况下，也可在本项目目录里初始化独立仓库后用命令行推送。无需为运行本游戏配置任何密钥。

部署步骤核对日期：2026-10-26。参考：[GitHub 创建 Pages 站点](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)、[配置 Pages 发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 项目结构

```text
index.html          页面结构
styles.css          配色、布局、手机适配
engine.js           得分、碰撞、计时和状态
game.js             场景绘制、输入、音效、本地纪录
assets/illustrated/  六只透明宠物 WebP 与 park.webp 花园背景
assets/*.svg        保留的旧版草稿，v2.0 不再引用
docs/art-direction.md  美术方向、来源与生成提示词
tests/engine.test.cjs  游戏规则验证
```

## 检查游戏规则

有 Node.js 18 或更新版本时，执行 `npm test`（不需要先运行 `npm install`），或：

```sh
node --test tests/engine.test.cjs
```

共 11 项规则测试，覆盖得分、连击、漏接、炸弹保护、失败、重新开始、暂停、计时结束、边界移动、画面边缘金币可接取及慢帧碰撞。

宠物带有轻微呼吸浮动、移动倾斜和接住奖励时的小跳跃；系统启用减少动态效果时关闭这些装饰动画。完整角色在窄屏保持比例，篮筐口与碰撞线对齐。

## 想改一点点

- 每局时长：`engine.js` 中的 `DURATION`。
- 金币 / 骨头分值和连击倍率：`engine.js` 的奖励碰撞分支。
- 宠物模样：`assets/illustrated/` 中对应的透明 WebP 插画，类型与名称在 `game.js` 的 `companions` 设置中。替换时保留角色居中和篮筐口约在图像高度 66% 的位置。
- 页面主色：`styles.css` 开头的颜色变量。

MIT License，可自由修改和分享。
