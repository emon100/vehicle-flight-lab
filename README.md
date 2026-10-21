# Vehicle flight lab

浏览器车辆驾驶与腾空姿态控制实验。包含控制器、MuJoCo 物理模型、CEM 参数搜索、冻结训练记录、验证结果和驾驶沙盒。

本项目是独立模拟实验，与 Tesla, Inc. 无关联，也未获得其赞助或认可。车辆参数、喷口、气罐、风扇、动力和悬挂均为实验假设，不是任何量产车或原型车的工程复原。模型外观仍接近 Tesla Roadster；去除贴图和标志不等于取得车型外观权利。模型按项目所有者声明的 CC BY 4.0 提供，第三方权利限制见 [RIGHTS.md](RIGHTS.md)。

## 运行驾驶沙盒

需要 Node.js 20 或更新版本，以及 Python 3。

```sh
npm ci --ignore-scripts
npm run setup
python3 -m http.server 4180 --bind 127.0.0.1
```

打开 <http://127.0.0.1:4180/sandbox/>。依赖只在安装时从 npm 获取，运行沙盒无需外部图片或模型服务。

W/S 或方向键控制前进与倒车，A/D 转向，空格刹车，K 请求一次翻转，R 复位，F 全屏。喷气辅助、吸地风扇、声音和视角使用屏幕按钮。场内有四条坡道、三个无品牌障碍物和少量水面反射。

## 代码与记录

| 目录 | 内容 |
| --- | --- |
| `sandbox/` | 驾驶输入、动力、接触处理、场景、摄像机、灯光及音效 |
| `simulation/` | 最早的控制与搜索实验，保留历史结果 |
| `simulation_v2/` | r6 接触物理、100 代参数搜索、逐候选与逐次评估记录、检查点及 r4/r5 前序记录 |
| `simulation_v3/` | 四元数回正控制器、保守分配器、刹降预测、冻结 r6 基线及验证数据 |
| `simulation_v4/` | 共享目标控制器、60 代搜索、开发集选择、冻结留出验证、步长核查、浏览器对照记录 |
| `models/` | 保留当前车身几何的无贴图模型与独立许可说明 |
| `docs/` | 复现说明、历史记录索引、导出来源与校验值 |

训练记录使用无损 gzip 压缩。运行 `python3 scripts/unpack-records.py --check` 可核对全部压缩记录，省略 `--check` 可恢复原文件名。完整逐帧轨迹只保留检查点、浏览器对照样本和代表性演示；所有候选、最终验证的结果指标与失败均保留。未收录的开发草稿和重复备份不属于本仓库的完整性承诺。

控制算法是人工设计的状态反馈、姿态路径、分配器与预测器，CEM 只搜索参数。v3 是人工结构修复，不应描述成一次新的机器学习训练。已观察的历史验证集也不能重新称为未使用的留出集。见 [复现](docs/reproduce.md)、[验证](docs/validation.md)和[历史范围](docs/history.md)。

## 检查

```sh
python3 scripts/unpack-records.py
npm test
python3.12 -m venv .venv
.venv/bin/pip install -r simulation_v3/baseline_r6/requirements.txt
.venv/bin/python simulation_v2/test_core.py
.venv/bin/python simulation_v3/test_frozen.py
.venv/bin/python simulation_v4/test_controller.py
```

## 许可

原创程序、文档与具有著作权的实验记录采用 [GPL-3.0-only](LICENSE)。允许商业使用。分发修改版本须遵守 GPL 的源码和许可要求。浏览器收到的 JavaScript 本身也是分发的程序；仅部署在服务器而不分发的修改不因 GPL 自动产生 AGPL 式的网络源码义务。

模型独立采用 [CC BY 4.0](LICENSES/CC-BY-4.0.txt)，不改为 GPL：

Model created with [Meshy](https://www.meshy.ai/) – [CC BY 4.0 License](https://creativecommons.org/licenses/by/4.0/)

Three.js、MuJoCo 等依赖保留各自许可，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。GPL 与 CC BY 都不会自动授予第三方商标、车型外观或专利权。

Copyright 2026 emon100 and contributors. 程序按现状提供，不提供担保。仅用于模拟研究与娱乐，未验证可用于真实车辆控制。
