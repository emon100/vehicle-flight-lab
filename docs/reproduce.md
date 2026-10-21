# 复现控制与训练

保留 `simulation_v2/`、`simulation_v3/`、`simulation_v4/` 并列。v4 复用 v3 控制器、分配器、预测器和冻结的 r6 物理；单独复制 v4 文件不能运行。

## 恢复历史文件

```sh
python3 scripts/unpack-records.py
```

脚本校验原始字节长度和 SHA-256。已存在且内容不同的文件会导致拒绝覆盖。压缩只改变存储方式，没有删掉失败记录或重写历史指标。

## 原生环境与新初态

```sh
python3.12 -m venv .venv
.venv/bin/pip install -r simulation_v3/baseline_r6/requirements.txt
.venv/bin/python simulation_v4/run_case.py --case examples/inverted.json --output runs/inverted.json
```

四元数顺序为 w,x,y,z，角速度是车体坐标中的 rad/s，位置和速度使用米和米每秒。`goal.turns` 为 0 表示回正落地，为 1 表示回正后完整翻转一圈。`--policy initial`、`--policy reference` 可与默认最终参数对照。输出路径已有文件时拒绝覆盖。

```sh
.venv/bin/python simulation_v2/test_core.py
.venv/bin/python simulation_v3/test_frozen.py
.venv/bin/python simulation_v4/test_controller.py
.venv/bin/python simulation_v2/audit_training_records.py
node simulation_v3/test-controller.mjs
node simulation_v3/test-predictor.mjs
node simulation_v4/test-browser.mjs
```

浏览器对照测试读取原生轨迹，再独立积分，并核对终态和误差阈值，不只播放录制动画。它会另写 `browser-parity-rerun.json`。该检查不等于硬实时或实车安全验证。

## 重训与完整评估

不要直接在冻结记录目录执行 `train.py` 或 `evaluate.py`。v2 训练器会清空自己的日志；v4 训练器拒绝覆盖现有 `campaign/`；评估器也会产生新结果。先复制一份到独立的实验目录，保留版本目录之间的相对路径，再移走该副本中已有的训练、评估输出。切勿覆盖仓库中的历史结果。对 v4 依次运行 `train.py`、`evaluate.py`、`audit_steps.py`、`audit_followup.py`，并把运行环境与新的源码哈希一起保存。

v2 使用 100 代 CEM，v4 使用 60 代、每代 18 个候选、每候选 6 个初态。v4 的首代包含一个明确声明的人工参考候选，按固定开发集选择最终参数。训练算法、种子、边界、全部候选和结果均在代码及压缩账本中。保留的源码哈希可以核对历史记录；本次没有重新执行完整训练。

历史结果受锁定软件版本、物理步长和接触求解影响。步长复查中出现的分类变化也保留，不能把一次成功推广为任意初态都可恢复。
