# 第三方许可

原创项目代码采用 GPL-3.0-only；以下材料有各自许可，不因放在同一仓库而改变。

| 内容 | 版本与许可 | 来源 |
| --- | --- | --- |
| 默认模型 | CC BY 4.0，按项目所有者声明 | [模型说明](models/README.md)，[Meshy](https://www.meshy.ai/) |
| Three.js | 0.180.0，MIT，Copyright 2010-2025 Three.js Authors | [固定版本源码](https://github.com/mrdoob/three.js/tree/0af9729d0c143a86a1d725d6e2c3ad83301f3f34) |
| MuJoCo JavaScript/WASM | 3.15.0，Apache-2.0，Google DeepMind 及贡献者 | [固定版本源码](https://github.com/google-deepmind/mujoco/tree/9ea3cdfcae93bf2cc4dc0e1a1627c5a39a1e06e5)，[构建说明](https://github.com/google-deepmind/mujoco/blob/9ea3cdfcae93bf2cc4dc0e1a1627c5a39a1e06e5/wasm/README.md) |
| Python 实验依赖 | MuJoCo 3.15.0、NumPy 2.5.4、SciPy 1.18.1，分别保留 Apache-2.0/BSD 等上游许可 | `simulation_v3/baseline_r6/requirements.txt` |

仓库不提交 `node_modules/` 或第三方编译二进制。`npm ci --ignore-scripts` 按 `package-lock.json` 中固定版本和完整性值下载依赖。`npm run setup` 从安装包复制浏览器所需文件，并保留 Three.js、MuJoCo 的原许可文件。该 MuJoCo npm 包未附许可全文，因此脚本从仓库的 `LICENSES/MuJoCo-Apache-2.0.txt` 补入上游 Apache-2.0 许可。Three.js 示例模块只调整本地 import 路径；MuJoCo 二进制未修改。

安装后的许可全文位于 `vendor/THREE-LICENSE`、`vendor/mujoco/LICENSE` 和各 npm/Python 包中。制作可分发的离线包时，应一同保留这些通知、各依赖许可和适用的对应源码；上表提供固定源码和 MuJoCo 构建入口。不要把这些依赖或模型重新标成项目原创 GPL 代码。

本仓库未分发 Tesla 的官方图片、视频、截图、照片衍生贴图、录音或商标图标，也未分发未使用的求解器包、原站点组件库、代理对话、部署元数据或私人凭据。
