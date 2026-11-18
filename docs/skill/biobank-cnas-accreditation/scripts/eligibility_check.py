#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生物样本库 CNAS 认可申请资格快判（中国口径）
规则库 v1.0.0 · 核定日期 2026-11-18 · 与 biobank-cnas-tool/src/rules/evaluate.ts 判定逻辑一致

用法:
  python eligibility_check.py answers.json              # 从文件读答案，输出 Markdown 到 stdout
  python eligibility_check.py answers.json -o report.md # 写出报告
  python eligibility_check.py --sample                  # 打印答案模板 JSON
  python eligibility_check.py --sample > answers.json  # 生成答案模板

输入: JSON 对象，key 为 02-eligibility.md 中的题目 id，value 为选项 value 字符串。
      human_samples=no 时自动跳过三条红线（共 19 题）；=yes 时为 22 题。

输出: 三档结论 + 8 项硬门槛核对表 + 红线核对 + P0/P1/P2 整改清单 + 免责声明。

注意: 只判断"是否具备申请资格"，不判断"能否通过评审"，不替代 CNAS 官方受理决定。
"""
import argparse
import json
import sys
from datetime import date

RULESET_VERSION = "1.0.0"
REVIEWED_AT = "2026-11-18"

# (id, 名称, 满足值集合, 部分满足值集合, 依据, 优先级)
GATES = [
    ("legal", "① 明确的法律地位", {"independent", "authorized"}, {"unclear"},
     "CNAS-RL10 第 4 章；GB/T 37864 5.1", "P0", "legal_entity"),
    ("self_assessment", "② 有效的自我评估", {"yes"}, {"partial"},
     "CNAS-RL10 第 6 章；实践惯例 C", "P1", "self_assessment"),
    ("qms_runtime", "③ 体系建立且有效运行 ≥6 个月", {"ge6m"}, {"lt6m"},
     "申请条件（三）；GB/T 37864 第 8 章", "P0", "qms_runtime"),
    ("proficiency", "⑤ 能力验证满足 CNAS-RL02", {"yes"}, {"partial", "unclear"},
     "申请条件（五）；CNAS-RL02", "P1", "proficiency_testing"),
    ("equipment", "⑦ 仪器设备量值溯源", {"yes"}, {"partial"},
     "申请条件（七）；6.5、7.7", "P1", "equipment_traceability"),
]

# 复合门槛单独处理
COMPOSITE = {
    "audit_review": ("④ 完整内审 + 管理评审 + 运行记录", "P0",
                     "申请条件（四）；8.8 内审、8.9 管评"),
    "personnel": ("⑥ 足够资源（人员 / 授权签字人）", "P1",
                  "申请条件（六）；5.9、6.2"),
    "technical": ("⑧ 技术经历覆盖全部申请范围", "P1",
                  "申请条件（八）；5.7、7.9"),
}

REDLINES = [
    ("ethics", "🚫 伦理审查", "ethics_approval", {"yes"},
     "《伦理审查办法》（2023）；GB/T 37864 4.1.6"),
    ("informed_consent", "🚫 知情同意", "informed_consent", {"yes"},
     "《伦理审查办法》（2023）；GB/T 37864 4.3"),
    ("hgr", "🚫 人类遗传资源合规", "hgr_compliance", {"yes"},
     "《人遗条例》第十四条；《实施细则》（2026，令第16号）第21、22条"),
]

PRIORITY_ORDER = {"P0": 0, "P1": 1, "P2": 2}
STATUS_LABEL = {"met": "满足", "partial": "部分满足", "unmet": "不满足",
                "redline": "红线阻断", "na": "不适用"}

SAMPLE = {
    "legal_entity": "independent",
    "self_assessment": "yes",
    "scope_defined": "yes",
    "scope_clinical": "no",
    "qms_established": "yes",
    "qms_runtime": "ge6m",
    "internal_audit": "yes_closed",
    "mgmt_review": "yes",
    "records_complete": "yes",
    "corrective_action": "yes",
    "personnel": "yes",
    "signatory": "yes",
    "equipment_traceability": "yes",
    "proficiency_testing": "yes",
    "technical_experience": "yes",
    "external_providers": "yes",
    "lims_traceability": "yes",
    "human_samples": "yes",
    "ethics_approval": "yes",
    "informed_consent": "yes",
    "hgr_compliance": "yes",
    "biosafety": "yes",
}


def status_of(value, met, partial):
    if value in met:
        return "met"
    if value in partial:
        return "partial"
    return "unmet"


def evaluate(a):
    rows = []  # dict: id, name, status, detail, basis, priority

    for gid, name, met, partial, basis, pri, key in GATES:
        v = a.get(key)
        st = status_of(v, met, partial)
        rows.append(dict(id=gid, name=name, status=st, detail=f"答案：{v or '未答'}",
                         basis=basis, priority=pri))

    # ④ 内审 + 管评 + 记录
    ia, mr, rec = a.get("internal_audit"), a.get("mgmt_review"), a.get("records_complete")
    name, pri, basis = COMPOSITE["audit_review"]
    if ia == "yes_closed" and mr == "yes" and rec == "yes":
        st = "met"
    elif ia in ("yes_open", "partial") or mr == "planned" or rec == "partial":
        st = "partial"
    else:
        st = "unmet"
    rows.append(dict(id="audit_review", name=name, status=st,
                     detail=f"内审：{ia or '未答'}；管评：{mr or '未答'}；运行记录：{rec or '未答'}",
                     basis=basis, priority=pri))

    # ⑥ 人员 + 签字人
    per, sig = a.get("personnel"), a.get("signatory")
    name, pri, basis = COMPOSITE["personnel"]
    if per == "yes" and sig in ("yes", "na", "partial"):
        st = "met" if sig != "partial" else "partial"
    elif per == "partial" or sig == "partial":
        st = "partial"
    else:
        st = "unmet"
    rows.append(dict(id="personnel", name=name, status=st,
                     detail=f"关键岗位：{per or '未答'}；授权签字人：{sig or '未答'}",
                     basis=basis, priority=pri))

    # ⑧ 技术经历 + 范围
    te, scope = a.get("technical_experience"), a.get("scope_defined")
    name, pri, basis = COMPOSITE["technical"]
    if te == "yes" and scope == "yes":
        st = "met"
    elif te == "partial" or scope == "partial":
        st = "partial"
    else:
        st = "unmet"
    rows.append(dict(id="technical", name=name, status=st,
                     detail=f"技术经历：{te or '未答'}；范围界定：{scope or '未答'}",
                     basis=basis, priority=pri))

    # 红线（仅人源）
    human = a.get("human_samples") == "yes"
    redline_rows = []
    if human:
        for rid, rname, key, met, basis in REDLINES:
            v = a.get(key)
            if rid == "hgr" and v == "unclear":
                st = "partial"
            elif v in met:
                st = "met"
            else:
                st = "redline"
            redline_rows.append(dict(id=rid, name=rname, status=st,
                                     detail=f"答案：{v or '未答'}", basis=basis, priority="P0"))
    else:
        for rid, rname, _key, _met, basis in REDLINES:
            redline_rows.append(dict(id=rid, name=rname.replace("🚫 ", ""), status="na",
                                     detail="仅涉及非人源样本，本项不适用", basis=basis, priority="P2"))

    all_rows = rows + redline_rows
    has_redline = any(r["status"] == "redline" for r in all_rows)
    hard_ids = {"legal", "qms_runtime", "audit_review"}
    hard_unmet = any(r["id"] in hard_ids and r["status"] == "unmet" for r in all_rows)
    any_unmet = any(r["status"] == "unmet" for r in all_rows)
    any_partial = any(r["status"] == "partial" for r in all_rows)

    if has_redline or hard_unmet:
        eligibility = "blocked"
    elif any_unmet or any_partial:
        eligibility = "conditional"
    else:
        eligibility = "ready"

    gaps = [r for r in all_rows if r["status"] not in ("met", "na")]
    gaps.sort(key=lambda r: PRIORITY_ORDER.get(r["priority"], 9))
    return dict(rows=all_rows, gaps=gaps, eligibility=eligibility, human=human)


LABEL = {"ready": "可申请", "conditional": "补正后可申请", "blocked": "暂不具备申请条件"}
SUMMARY = {
    "ready": "8 项申请条件均已满足，且未发现合规红线，可以按流程准备材料并提交 CNAS 认可申请。",
    "conditional": "核心条件基本具备，但有 {n} 项待补正。完成整改并保留运行记录后再提交申请，可显著提高受理与文审通过率。",
    "blocked": "存在 {n} 项阻断性问题（含硬性门槛未满足或合规红线），建议先完成整改，暂不提交申请。",
}
RISK_BLOCKED = ("CNAS 对资料不实、体系未有效运行、人源样本合规缺失的申请不予受理；"
                "因资料不真实等原因不予受理的，36 个月内不再接受申请；"
                "因管理体系问题不予受理的，6 个月后才能再次提交。")


def render(res, source="answers.json"):
    e = res["eligibility"]
    n_block = sum(1 for r in res["gaps"] if r["status"] in ("redline", "unmet"))
    out = []
    out.append("# 生物样本库 CNAS 认可申请资格自查报告")
    out.append("")
    out.append(f"> 规则库 v{RULESET_VERSION} · 核定日期 {REVIEWED_AT} · 生成日期 {date.today().isoformat()}  ")
    out.append(f"> 数据来源：{source} · 依据：CNAS 官网申请条件 + CNAS-CL10 / RL10 / RL02 / AL21")
    out.append("")
    out.append("## 一、评估结论")
    out.append("")
    out.append(f"**{LABEL[e]}**")
    out.append("")
    out.append(SUMMARY[e].format(n=len(res["gaps"]) if e == "conditional" else n_block))
    out.append("")
    if e == "blocked":
        out.append(f"> ⚠️ 风险提示：{RISK_BLOCKED}")
        out.append("")
    out.append("## 二、8 项硬门槛核对")
    out.append("")
    out.append("| # | 门槛 | 判定 | 现状 | 依据 | 优先级 |")
    out.append("|---|---|---|---|---|---|")
    for r in res["rows"][:8]:
        out.append(f"| {r['name'][:2]} | {r['name'][2:]} | {STATUS_LABEL[r['status']]} | "
                   f"{r['detail']} | {r['basis']} | {r['priority']} |")
    out.append("")
    out.append(f"## 三、人源样本合规红线（{'启用' if res['human'] else '不适用：非人源样本'}）")
    out.append("")
    out.append("| 红线 | 判定 | 现状 | 依据 | 优先级 |")
    out.append("|---|---|---|---|---|")
    for r in res["rows"][8:]:
        out.append(f"| {r['name']} | {STATUS_LABEL[r['status']]} | {r['detail']} | "
                   f"{r['basis']} | {r['priority']} |")
    out.append("")
    out.append("## 四、整改清单（P0 → P1 → P2）")
    out.append("")
    if res["gaps"]:
        out.append("| 优先级 | 项目 | 判定 | 现状 | 依据 | 整改方向（怎么证明已做到） |")
        out.append("|---|---|---|---|---|---|")
        for r in res["gaps"]:
            hint = ("补齐并保留客观证据：文件/记录/批件/台账/验证报告，"
                    "确保覆盖申请范围内全部活动，并由内审或管评确认闭环。")
            out.append(f"| {r['priority']} | {r['name']} | {STATUS_LABEL[r['status']]} | "
                       f"{r['detail']} | {r['basis']} | {hint} |")
    else:
        out.append("无待整改项。")
    out.append("")
    out.append("## 五、过程控制提示（不参与资格判定）")
    out.append("")
    weak = [k for k in ("lims_traceability", "external_providers", "biosafety", "corrective_action")
            if res.get("_answers", {}).get(k) in ("no", "partial")]
    if weak:
        out.append("以下要素存在短板，虽非直接受理门槛，但现场评审极易被开具不符合项："
                   + "、".join(weak) + "。整改要求见 `04-gap-analysis.md` §六。")
    else:
        out.append("本次输入未发现明显过程控制短板；正式申请前仍建议按 `assets/评审前核查清单.md` 逐项复核。")
    out.append("")
    out.append("## 六、免责声明")
    out.append("")
    out.append("> 本报告为初步评估，不构成法律意见或认证结论；只判断「是否具备申请资格」，"
               "不判断「能否通过评审」，不替代 CNAS 官方受理、评审与评定决定。"
               "法规与认可规范可能换版，正式申请前请以 CNAS 官网及主管部门最新发布文本为准。")
    out.append(">")
    out.append("> **庚寅咨询 Gengyin Consulting** · 青岛庚寅咨询服务有限公司  ")
    out.append("> 在线自查工具：https://hgr-compliance-check.app.workbuddy.host/cnas/?sharecode=QFKYYVQBAC")
    out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="生物样本库 CNAS 认可申请资格快判")
    ap.add_argument("input", nargs="?", help="答案 JSON 文件路径；省略时从 stdin 读")
    ap.add_argument("-o", "--output", help="输出 Markdown 文件路径；省略时打印到 stdout")
    ap.add_argument("--sample", action="store_true", help="打印答案模板 JSON 并退出")
    args = ap.parse_args()

    if args.sample:
        print(json.dumps(SAMPLE, ensure_ascii=False, indent=2))
        return 0

    try:
        if args.input:
            with open(args.input, "r", encoding="utf-8") as f:
                answers = json.load(f)
        else:
            answers = json.load(sys.stdin)
    except Exception as exc:
        print(f"读取答案失败：{exc}", file=sys.stderr)
        return 2

    if not isinstance(answers, dict):
        print("答案须为 JSON 对象", file=sys.stderr)
        return 2

    res = evaluate(answers)
    res["_answers"] = answers
    md = render(res, source=args.input or "stdin")
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(md)
        print(f"已写出：{args.output}", file=sys.stderr)
    else:
        print(md)
    return 0


if __name__ == "__main__":
    sys.exit(main())
