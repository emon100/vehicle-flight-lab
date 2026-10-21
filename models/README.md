# 默认车辆模型

Model created with [Meshy](https://www.meshy.ai/) – [CC BY 4.0 License](https://creativecommons.org/licenses/by/4.0/)

文件：[default-vehicle.glb](default-vehicle.glb)。来源是项目所有者提供的 Meshy 生成模型，经本项目调整车身曲面、重建轮毂和玻璃后导出。项目所有者指定按 CC BY 4.0 署名分发；这里没有独立核实生成时的账户套餐或输入素材授权。

项目维护者 emon100 负责本仓库版本和改动。原始模型未提供独立公开作品页。Meshy 是生成工具，署名不代表其认可本项目或保证车型外观不存在第三方权利。

2026-10-22 的开源导出保留当前精修几何及四个可转动车轮，移除全部嵌入图片、纹理引用、UV、顶点颜色和旧元数据。GLB 使用纯色车漆和轮胎、轮毂材质，在其他查看器中车身呈素色。沙盒通过 `sandbox/vehicle-material.mjs` 中的几何公式绘制玻璃、饰条和灯光，边界不依赖三角面密度，也不需要任何图片。没有保留底盘视频截图或把照片转换成顶点颜色。车身外形仍然可识别。

原精修文件 SHA-256 和公开文件 SHA-256 见 [model-provenance.json](model-provenance.json)。`scripts/strip-model.py` 记录了导出方法，输入的带贴图原件不随仓库分发。

许可全文：[CC BY 4.0](../LICENSES/CC-BY-4.0.txt)。再分发时保留署名、许可链接与改动说明，不暗示作者或 Meshy 背书。模型许可只覆盖许可人有权许可的部分，不授予商标或专利权，也不清除他人可能享有的车型外观权利。见 [权利说明](../RIGHTS.md)。本模型按现状提供，无担保。
