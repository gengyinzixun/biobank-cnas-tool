# 中文「生物样本库 CNAS 认可」Agent Skill

> 庚寅咨询 · Gengyin Consulting ｜ 规则库 v1.0.0 ｜ 核定日期 2026-11-18

本目录是一份可直接安装的 **WorkBuddy / Claude Code 技能包（SKILL.md 规范）**，把「生物样本库 CNAS 认可」咨询能力固化为中国口径的知识包，与仓库里的在线自查工具配套使用。

## 与英文同类 Skill 的根本区别

GitHub 上现有的样本库类 Skill 依据 ISBER / NCI Best Practices / CAP / CLIA / GDPR，**不能用于中国客户**。本技能全部以中国现行规范为准：

- CNAS 官网公布的认可申请条件
- CNAS-CL10:2020（等同采用 GB/T 37864-2019 / ISO 20387:2018）
- CNAS-RL10 / RL02 / AL21
- 《人类遗传资源管理条例》及 2026-11-11 施行的卫健委令第 16 号《实施细则》

并明确纠正三处高频误标：认可准则是 **CNAS-CL10:2020**（非 CL06）；**CNAS-RL02 是《能力验证规则》**（非「应用说明」）；内审是 **GB/T 37864 第 8.8 条**、管理评审是 **第 8.9 条**（非网传 4.7 / 4.8）。

## 安装

把本目录下的 `biobank-cnas-accreditation/` 整个文件夹复制到对应技能目录即可（无需改名、无需构建）：

```
# WorkBuddy（用户级，跨项目可用）
~/.workbuddy/skills/biobank-cnas-accreditation/

# Claude Code / Cursor
~/.claude/skills/biobank-cnas-accreditation/
```

安装后，在对话中涉及「生物样本库 CNAS 认可 / ISO 20387 / 申请条件 / 差距分析 / 内审管评 / 现场评审 / 不符合项整改 / 人遗合规」等话题时会自动加载。

## 目录结构

| 路径 | 内容 |
|---|---|
| `SKILL.md` | 主入口：定位与边界、口径红线、7 阶段流程、8 项门槛速记、资源索引 |
| `references/01-basis.md` | 法规与认可规范清单、GB/T 37864 章节结构、置信度分级、换版提示（**引用条号前必读**） |
| `references/02-eligibility.md` | 8 项硬门槛逐条判定、22 题四层题库、3 条人源红线、三档总判定逻辑 |
| `references/03-workflow.md` | 7 阶段咨询 SOP（输入 / 动作 / 输出 / 收口标准） |
| `references/04-gap-analysis.md` | 差距分析方法、四级文件、内审 8.8 / 管评 8.9 实施要点、高频痛点 |
| `references/05-intake.md` | 需求诊断提纲、机构类型差异、ISO 20387 vs ISO 15189 范围界定 |
| `references/06-onsite.md` | 申请材料、RL10 流程时限、现场评审准备、不符合项与 CAPA 闭环 |
| `references/07-hgr-redline.md` | 伦理 / 知情同意 / 人遗保藏许可（2026 令第 16 号口径）及与人遗工具联动 |
| `references/08-faq-pitfalls.md` | 口径纠错、常见问答 |
| `references/09-glossary.md` | 术语表与缩写 |
| `scripts/eligibility_check.py` | 确定性资格快判脚本，输入答案 JSON 输出 Markdown 自查报告 |
| `assets/`（6 份） | 可直接交客户的空白模板：自查报告、差距分析表、整改跟踪表、SOP、体系文件清单、评审前核查清单 |

## 判定脚本用法

```bash
cd biobank-cnas-accreditation/scripts

# 生成答案模板
python eligibility_check.py --sample > answers.json

# 按 02-eligibility.md 的选项 value 填好后运行
python eligibility_check.py answers.json -o 自查报告.md
```

输出三档结论（**可申请 / 补正后可申请 / 暂不具备**）+ 8 项门槛核对表 + 人源红线核对 + P0/P1/P2 整改清单 + 免责声明。已验证 6 个判定分支（含非人源样本跳过红线）。

## 配套在线工具

| 工具 | 地址 |
|---|---|
| 生物样本库 CNAS 认可申请自查 | `https://hgr-compliance-check.app.workbuddy.host/cnas/?sharecode=QFKYYVQBAC`（备用 `https://gengyinzixun.github.io/biobank-cnas-tool/`） |
| 人遗申报备案评估 | `https://hgr-compliance-check.app.workbuddy.host/?sharecode=QFKYYVQBAC` |

形成「客户自助初判 → 一对一咨询承接」闭环。

## 依据与维护

- 法规与条号核实过程见仓库根目录 [`docs/依据清单-CNAS生物样本库认可.md`](../依据清单-CNAS生物样本库认可.md)。
- 当 CNAS 官网申请条件、CL10 / RL10 / RL02 / AL21 换版，或人遗法规更新时，须**同步更新三处**：`references/01-basis.md`、`references/02-eligibility.md`、`scripts/eligibility_check.py`，并在 `SKILL.md` 记录新版本日期。
- 客户名称、项目阶段、评审时间等客户事实**不得写入本技能**，只存客户档案。

## 免责声明

本技能只判断「是否具备申请资格」与「如何准备」，不判断「能否通过评审」，不替代 CNAS 官方受理与评定决定；所有输出为基于公开认可规范与法规的初步评估，**不构成认证结论或法律意见**。正式申请请以 CNAS 最新发布文件及评审组现场判定为准。

---

**庚寅咨询 · Gengyin Consulting** ｜ 青岛庚寅咨询服务有限公司
