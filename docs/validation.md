# 验证数据说明

`simulation_v4/evaluation-freeze.json` 保存冻结控制器、参数、配置和初态；`evaluation.json` 与压缩的 `evaluation-ledger.jsonl.gz` 保存全部验证指标，包括失败。

每个 inDomain 与 stress 组各有 40 个初态，分别比较 initial、reference、final 三组参数。报告按零圈回正和完整一圈分组，每种目标各 20 个初态。水平速度变化在首次接触前测量，失败同样计入分布。宽范围测试包括低高度、任意姿态和较大角速度，不承诺全部可恢复。

`step-audit.json` 和 `step-audit-followup.json` 保存 1 ms 物理步长复查及分类变化。`browser-fixtures.json.gz` 保存原生状态和轨迹；`test-browser.mjs` 独立核对浏览器控制公式、MuJoCo 积分轨迹和终态。

v3 的 `evaluation-cases.json`、`results.json`、`evaluation-ledger.jsonl.gz`、`failure-audit.json` 保存人工结构修复前后的对照。旧固定集合在开发中已被观察，因此与新种子集合分开报告。v2 完整逐候选与逐次评估账本、20 个检查点及训练审计可恢复后核对。

仓库只保留代表性完整轨迹、检查点和浏览器对照样本，省略大批可由冻结初态与参数重新计算的逐帧副本。历史 JSON 中的原始轨迹路径、旧站点路径和哈希是当时的证据索引，不能解释为每个旧路径仍存在。具体收录文件见 `export-provenance.json` 和 `records.json`。

当前驾驶沙盒在腾空控制之外增加道路探测、转向、悬挂、吸地风扇、边界复位和重新补气。这些是沙盒规则，不属于冻结训练结果。视觉车身与碰撞盒也不是实车测量数据。
