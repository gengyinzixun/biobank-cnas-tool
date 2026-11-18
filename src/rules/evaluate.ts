import type { Answers, Citation, Conclusion, GrayArea } from './types'
import { get } from './questions'
import { collectRegulations, type RegulationMeta } from './regulations'

// ── 引用构造 ──────────────────────────────────────────────
const CL = 'CNAS-CL10:2020《生物样本库质量和能力认可准则》（等同 GB/T 37864-2019 / ISO 20387:2018）'
const RL10 = 'CNAS-RL10《生物样本库认可规则》'
const RL02 = 'CNAS-RL02《能力验证规则》'
const AL21 = 'CNAS-AL21《生物样本库质量和能力认可申请书》'
const AL0160 = 'CNAS-AL01-60《认可合同》'
const TIAOLI = '《中华人民共和国人类遗传资源管理条例》（2024 修订）'
const XIZE = '《人类遗传资源管理条例实施细则》（2026，国家卫健委令第 16 号）'
const ETHICS = '《涉及人的生命科学和医学研究伦理审查办法》（2023）'

const C = (article: string): Citation => ({ source: CL, article, confidence: 'A', regulationId: 'cl10' })
const R10 = (article: string): Citation => ({ source: RL10, article, confidence: 'A', regulationId: 'rl10' })
const R02 = (article: string): Citation => ({ source: RL02, article, confidence: 'A', regulationId: 'rl02' })
const AL = (article: string): Citation => ({ source: AL21, article, confidence: 'A', regulationId: 'al21' })
const T = (article: string): Citation => ({ source: TIAOLI, article, confidence: 'A', regulationId: 'tiaoli' })
const X = (article: string): Citation => ({ source: XIZE, article, confidence: 'A', regulationId: 'xize' })
const E = (article: string): Citation => ({ source: ETHICS, article, confidence: 'A', regulationId: 'ethics' })
const P = (topic: string): Citation => ({
  source: '实务操作惯例',
  article: topic,
  confidence: 'C',
  note: '非规范性文件明文，系认可准备与评审实践中的通行做法，重大事项建议与 CNAS 或专业顾问确认。',
  regulationId: 'practice',
})

export interface EvalResult {
  // 兼容界面字段（赋予 CNAS 语境新含义）
  unitType: 'chinese' | 'foreign' | 'unclear'
  regulatedMaterial: boolean
  regulatedInfo: boolean
  onlyExemptMaterial: boolean
  /** 申请资格总判定：ready=可申请 / conditional=补正后可申请 / blocked=暂不具备/红线阻断 */
  eligibility: 'ready' | 'conditional' | 'blocked'
  /** 8 项硬门槛 + 红线的逐项核对 */
  gates: Gate[]
  conclusions: Conclusion[]
  grayAreas: GrayArea[]
  regulations: RegulationMeta[]
}

export interface Gate {
  id: string
  name: string
  status: 'met' | 'partial' | 'unmet' | 'redline' | 'na'
  detail: string
  citations: Citation[]
  priority: 'P0' | 'P1' | 'P2'
}

function regulationsOf(conclusions: Conclusion[], gates: Gate[]): RegulationMeta[] {
  const ids: string[] = []
  const collect = (cs: Citation[]) => { for (const ci of cs) if (ci.regulationId) ids.push(ci.regulationId) }
  for (const c of conclusions) {
    collect(c.citations)
    for (const ob of c.obligations) collect(ob.citations)
  }
  for (const g of gates) collect(g.citations)
  return collectRegulations(ids)
}

export function evaluate(a: Answers): EvalResult {
  const gates: Gate[] = []
  const grayAreas: GrayArea[] = []
  const conclusions: Conclusion[] = []

  const human = get(a, 'human_samples') === 'yes'
  const legal = get(a, 'legal_entity')
  const hasLegal = legal === 'independent' || legal === 'authorized'

  // ── 门槛 1：法律地位（条件二） ──
  gates.push({
    id: 'legal',
    name: '① 明确的法律地位',
    status: hasLegal ? 'met' : legal === 'unclear' ? 'partial' : 'unmet',
    detail: hasLegal
      ? legal === 'independent'
        ? '申请主体为独立法人，能独立承担法律责任。'
        : '法人授权的独立运行部门，需备存正式授权文件。'
      : legal === 'unclear'
        ? '法律地位需进一步判定（独立法人 / 法人授权部门）。'
        : '无独立法律地位、也无授权，不满足受理条件。',
    citations: [R10('第 4 章 认可条件'), C('第 5.1 条')],
    priority: 'P0',
  })

  // ── 门槛 2：有效的自我评估（条件一） ──
  const sa = get(a, 'self_assessment')
  gates.push({
    id: 'self_assessment',
    name: '② 有效的自我评估',
    status: sa === 'yes' ? 'met' : sa === 'partial' ? 'partial' : 'unmet',
    detail:
      sa === 'yes'
        ? '已完成对照 CNAS-CL10 的书面自我评估。'
        : sa === 'partial'
          ? '自我评估未覆盖准则全部要素或未形成书面报告。'
          : '尚未开展有效的自我评估。',
    citations: [R10('第 6 章 自我评估要求'), P('自查应覆盖准则 4-8 章全部要素并形成书面报告')],
    priority: 'P1',
  })

  // ── 门槛 3：管理体系正式有效运行 6 个月以上（条件三） ──
  const qms = get(a, 'qms_established')
  const rt = get(a, 'qms_runtime')
  const runtimeMet = rt === 'ge6m'
  gates.push({
    id: 'qms_runtime',
    name: '③ 体系建立且有效运行 ≥6 个月',
    status: runtimeMet ? 'met' : rt === 'lt6m' ? 'partial' : 'unmet',
    detail:
      qms === 'no'
        ? '尚未建立符合 CNAS-CL10 的管理体系文件。'
        : rt === 'ge6m'
          ? '管理体系正式、有效运行 6 个月以上，且有完整运行记录。'
          : rt === 'lt6m'
            ? '体系运行不足 6 个月，CNAS 申请条件为硬性 6 个月，需继续运行积累记录。'
            : rt === 'paper'
              ? '文件已建立但未实际运行 / 空库，不满足"有效运行"要求。'
              : '尚未运行。',
    citations: [R10('申请条件（三）'), C('第 8 章 管理要求')],
    priority: 'P0',
  })

  // ── 门槛 4：完整内审 + 管理评审（条件四） ──
  const ia = get(a, 'internal_audit')
  const mr = get(a, 'mgmt_review')
  const recs = get(a, 'records_complete')
  const iaMrMet = (ia === 'yes_closed') && (mr === 'yes') && (recs === 'yes')
  const iaMrPartial =
    ia === 'yes_open' || ia === 'partial' || mr === 'planned' || recs === 'partial'
  gates.push({
    id: 'audit_review',
    name: '④ 完整内审 + 管理评审 + 运行记录',
    status: iaMrMet ? 'met' : iaMrPartial ? 'partial' : 'unmet',
    detail: [
      `内审：${ia === 'yes_closed' ? '已完成且整改闭环' : ia === 'yes_open' ? '已做但有不符合项未关闭' : ia === 'partial' ? '仅部分要素' : '未开展'}`,
      `管理评审：${mr === 'yes' ? '已完成并有报告' : mr === 'planned' ? '已计划未实施' : '未开展'}`,
      `运行记录：${recs === 'yes' ? '完整可追溯' : recs === 'partial' ? '部分缺失' : '零散/基本没有'}`,
    ].join('；'),
    citations: [R10('申请条件（四）'), C('第 8.8 条 内部审核'), C('第 8.9 条 质量管理评审')],
    priority: 'P0',
  })

  // ── 门槛 5：能力验证满足 RL02（条件五） ──
  const pt = get(a, 'proficiency_testing')
  gates.push({
    id: 'proficiency',
    name: '⑤ 能力验证满足 CNAS-RL02',
    status: pt === 'yes' ? 'met' : pt === 'partial' ? 'partial' : pt === 'unclear' ? 'partial' : 'unmet',
    detail:
      pt === 'yes'
        ? '已按 RL02 参加能力验证，频次与覆盖满足要求。'
        : pt === 'partial'
          ? '参加过能力验证，但频次或覆盖领域不足。'
          : pt === 'unclear'
            ? '不确定如何判断，建议按申请范围对照 RL02 逐项核对。'
            : '尚未参加能力验证或实验室间比对。',
    citations: [R10('申请条件（五）'), R02('能力验证频次与覆盖要求')],
    priority: 'P1',
  })

  // ── 门槛 6：人员与授权签字人资源（条件六） ──
  const per = get(a, 'personnel')
  const sig = get(a, 'signatory')
  const personMet = per === 'yes' && (sig === 'yes' || sig === 'na' || sig === 'partial')
  const personPartial = per === 'partial' || sig === 'partial'
  gates.push({
    id: 'personnel',
    name: '⑥ 足够资源（人员 / 授权签字人）',
    status: personMet ? 'met' : personPartial ? 'partial' : 'unmet',
    detail: [
      `关键岗位：${per === 'yes' ? '齐全且完成能力确认' : per === 'partial' ? '基本到位但档案/授权不全' : '缺失'}`,
      `授权签字人：${sig === 'yes' ? '满足资格要求' : sig === 'na' ? '申请范围不涉及' : sig === 'partial' ? '已指定、材料待补' : '尚未确定'}`,
    ].join('；'),
    citations: [R10('申请条件（六）'), C('第 5.9、6.2 条')],
    priority: 'P1',
  })

  // ── 门槛 7：设备量值溯源（条件七） ──
  const eq = get(a, 'equipment_traceability')
  gates.push({
    id: 'equipment',
    name: '⑦ 仪器设备量值溯源',
    status: eq === 'yes' ? 'met' : eq === 'partial' ? 'partial' : 'unmet',
    detail:
      eq === 'yes'
        ? '设备台账、校准/验证、24h 温度监控、报警与应急预案齐全。'
        : eq === 'partial'
          ? '部分设备有校准，但监控/记录不全。'
          : '基本没有量值溯源与温度监控体系。',
    citations: [R10('申请条件（七）'), C('第 6.5 条 设备'), C('第 7.7 条 储存')],
    priority: 'P1',
  })

  // ── 门槛 8：技术经历覆盖申请范围（条件八） ──
  const te = get(a, 'technical_experience')
  const scope = get(a, 'scope_defined')
  const techMet = te === 'yes' && scope === 'yes'
  const techPartial = te === 'partial' || scope === 'partial'
  gates.push({
    id: 'technical',
    name: '⑧ 技术经历覆盖全部申请范围',
    status: techMet ? 'met' : techPartial ? 'partial' : 'unmet',
    detail: [
      `技术经历：${te === 'yes' ? '全部项目/参数均有真实经历' : te === 'partial' ? '主要项目有，部分缺失' : '多数项目无真实经历'}`,
      `范围界定：${scope === 'yes' ? '已明确并形成文件' : scope === 'partial' ? '大致范围，未逐项写明' : '尚未界定'}`,
    ].join('；'),
    citations: [R10('申请条件（八）'), C('第 5.7 条 活动范围'), C('第 7.9 条 方法确认和验证')],
    priority: 'P1',
  })

  // ── 红线：人源样本伦理 / 知情同意 / 人遗合规 ──
  if (human) {
    const eth = get(a, 'ethics_approval')
    const ic = get(a, 'informed_consent')
    const hgr = get(a, 'hgr_compliance')

    gates.push({
      id: 'ethics',
      name: '🚫 伦理审查（红线）',
      status: eth === 'yes' ? 'met' : eth === 'partial' ? 'redline' : 'redline',
      detail:
        eth === 'yes'
          ? '已取得覆盖保藏与使用的有效伦理批件。'
          : eth === 'partial'
            ? '伦理批件未覆盖全部申请范围，需补齐。'
            : '未通过伦理审查——医院人源样本库的一票否决项。',
      citations: [E('涉及人的生命科学和医学研究伦理审查'), C('第 4.1.6 条 伦理规范')],
      priority: 'P0',
    })
    gates.push({
      id: 'informed_consent',
      name: '🚫 知情同意（红线）',
      status: ic === 'yes' ? 'met' : 'redline',
      detail:
        ic === 'yes'
          ? '知情同意完整、版本受控、覆盖保藏与后续使用。'
          : '知情同意不完整或版本不清，评审必查项。',
      citations: [E('知情同意'), C('第 4.3 条 保密性')],
      priority: 'P0',
    })
    gates.push({
      id: 'hgr',
      name: '🚫 人类遗传资源合规（红线）',
      status:
        hgr === 'yes' ? 'met' : hgr === 'unclear' ? 'partial' : 'redline',
      detail:
        hgr === 'yes'
          ? '保藏许可/备案已完成，或经判定不构成保藏。'
          : hgr === 'pending'
            ? '人遗保藏许可申请中，获证前不宜以该范围申请 CNAS 认可。'
            : hgr === 'no'
              ? '应办未办人类遗传资源保藏许可——合规红线。'
              : '不确定是否构成保藏，建议先做人遗申报路径评估（附工具链接）。',
      citations: [T('第十四条'), X('第二十一、二十二条 保藏定义')],
      priority: 'P0',
    })

    if (eth !== 'yes' || ic !== 'yes') {
      grayAreas.push({
        question: '人源样本伦理批件与知情同意的覆盖范围',
        answer: `伦理：${eth ?? '未答'}；知情同意：${ic ?? '未答'}`,
        advice: '伦理与知情同意是医院样本库的一票否决项，建议先补齐并确认覆盖申请范围内的全部保藏与使用活动，再启动 CNAS 申请准备。',
      })
    }
    if (hgr === 'unclear' || hgr === 'no' || hgr === 'pending') {
      grayAreas.push({
        question: '是否构成人类遗传资源保藏、是否需要保藏许可',
        answer: hgr ?? '未答',
        advice: '2026 版《实施细则》已收窄保藏定义：以临床诊疗/教学为主兼顾科研的样本保存不构成保藏。建议先用「人遗申报备案评估工具」做路径初判，避免误办或漏办。',
      })
    }
  }

  // 非人源样本：伦理与人遗三项不适用
  else {
    gates.push({
      id: 'ethics',
      name: '伦理审查（红线）',
      status: 'na',
      detail: '仅涉及非人源样本，本项不适用。',
      citations: [C('第 4.1.6 条')],
      priority: 'P2',
    })
    gates.push({
      id: 'informed_consent',
      name: '知情同意（红线）',
      status: 'na',
      detail: '仅涉及非人源样本，本项不适用。',
      citations: [C('第 4.3 条')],
      priority: 'P2',
    })
    gates.push({
      id: 'hgr',
      name: '人类遗传资源合规（红线）',
      status: 'na',
      detail: '仅涉及非人源样本，本项不适用。',
      citations: [T('第二条')],
      priority: 'P2',
    })
  }

  // 过程控制补充结论（不影响资格判定，作为提示）
  const lims = get(a, 'lims_traceability')
  const ep = get(a, 'external_providers')
  const bio = get(a, 'biosafety')
  const ca = get(a, 'corrective_action')
  const sClinical = get(a, 'scope_clinical')

  if (lims === 'no' || lims === 'partial' || ep === 'no' || bio === 'no' || ca === 'no') {
    const gaps: string[] = []
    if (lims === 'no' || lims === 'partial') gaps.push('样本唯一标识与全生命周期溯源不完整')
    if (ep === 'no' || ep === 'partial') gaps.push('外部供方评价与受控不足')
    if (bio === 'no' || bio === 'partial') gaps.push('生物安全与应急预案不全')
    if (ca === 'no' || ca === 'partial') gaps.push('不符合控制与纠正措施机制不健全')
    conclusions.push({
      id: 'process-gaps',
      type: 'notice',
      title: '评审高频不符合项：过程控制短板',
      summary: `以下过程控制要素存在短板，虽非直接的受理门槛，但在现场评审中极易被开具不符合项：${gaps.join('、')}。建议在正式申请前完成整改并保留运行记录。`,
      citations: [C('第 7.5 条 可追溯性'), C('第 6.4 条 外部提供'), C('第 8.5 条 风险防范'), C('第 8.7 条 纠正措施')],
      obligations: [
        { title: '建立唯一标识与全流程溯源', deadline: '覆盖采集、接收、制备、保存、储存、质控、分发、销毁，电子记录防篡改、权限分级、定期备份', citations: [C('第 7.5 条'), C('第 7.10 条')] },
        { title: '外部供方评价', deadline: '冷链运输、耗材试剂、校准、维保等供应商的评价、准入、监控与再评价记录', citations: [C('第 6.4 条')] },
        { title: '生物安全与应急预案', deadline: '泄漏/火灾/停电/制冷失效应急、业务连续性与灾难恢复计划', citations: [C('第 4.1.1 条'), C('第 8.5 条')] },
      ],
      reasons: gaps,
      risk: '过程控制短板是 CNAS 现场评审最常见的严重不符合项来源，可能导致暂缓推荐认可或缩减认可范围。',
    })
  }

  if (sClinical === 'yes' || sClinical === 'mixed') {
    conclusions.push({
      id: 'scope-15189',
      type: 'notice',
      title: '适用范围提示：区分 ISO 20387 与 ISO 15189',
      summary:
        sClinical === 'yes'
          ? 'ISO 20387 / GB/T 37864 适用于科研用生物样本保藏，不直接适用于临床诊断或治疗制剂用材料。若样本直接用于临床诊断，应优先考虑 ISO 15189（医学实验室认可）路径。'
          : '申请范围同时包含科研保藏与临床诊断用材料，建议在体系中明确区分两者流程与适用标准，避免范围混同导致评审缩减。',
      citations: [C('第 1 章 范围'), P('临床诊断实验室优先适用 ISO 15189，科研保藏样本库适用 ISO 20387')],
      obligations: [],
      reasons: [sClinical === 'yes' ? '涉及临床诊断/治疗用材料' : '范围混合，已做区分'],
    })
  }

  // ── 总判定 ──
  const hasRedline = gates.some((g) => g.status === 'redline')
  const hardGates = gates.filter((g) => ['legal', 'qms_runtime', 'audit_review'].includes(g.id))
  const hardUnmet = hardGates.some((g) => g.status === 'unmet')
  const anyUnmet = gates.some((g) => g.status === 'unmet')
  const anyPartial = gates.some((g) => g.status === 'partial')

  let eligibility: EvalResult['eligibility']
  if (hasRedline || hardUnmet) eligibility = 'blocked'
  else if (anyUnmet || anyPartial) eligibility = 'conditional'
  else eligibility = 'ready'

  const gapList = gates
    .filter((g) => g.status !== 'met' && g.status !== 'na')
    .sort((x, y) => (x.priority === y.priority ? 0 : x.priority === 'P0' ? -1 : 1))

  const label = eligibility === 'ready' ? '可申请' : eligibility === 'conditional' ? '补正后可申请' : '暂不具备申请条件'
  const summary =
    eligibility === 'ready'
      ? '8 项申请条件均已满足，且未发现合规红线，可以按流程准备材料并提交 CNAS 认可申请。'
      : eligibility === 'conditional'
        ? `核心条件基本具备，但有 ${gapList.length} 项待补正。完成整改并保留运行记录后再提交申请，可显著提高受理与文审通过率。`
        : `存在 ${gapList.filter((g) => g.status === 'redline' || g.status === 'unmet').length} 项阻断性问题（含硬性门槛未满足或合规红线），建议先完成整改，暂不提交申请。`

  conclusions.unshift({
    id: 'eligibility',
    type: eligibility === 'ready' ? 'exempt' : eligibility === 'conditional' ? 'notice' : 'prohibited',
    title: `申请资格自查结论：${label}`,
    summary,
    citations: [R10('第 4 章 认可条件'), R10('第 6 章 自我评估要求')],
    obligations: gapList.slice(0, 8).map((g) => ({
      title: `[${g.priority}] ${g.name}`,
      deadline: g.detail,
      citations: g.citations,
    })),
    reasons: gapList.length
      ? gapList.map((g) => `${g.name}：${g.status === 'redline' ? '红线' : g.status === 'unmet' ? '未满足' : '部分满足'}`)
      : ['8 项申请条件全部满足', '未发现合规红线'],
    risk:
      eligibility === 'blocked'
        ? 'CNAS 对资料不实、体系未有效运行、人源样本合规缺失的申请不予受理；因资料不真实等原因不予受理的，36 个月内不再接受申请；因管理体系问题不予受理的，6 个月后才能再次提交。'
        : undefined,
  })

  // 材料与时间轴提示（申请条件具备时）
  if (eligibility !== 'blocked') {
    conclusions.push({
      id: 'application-materials',
      type: 'notice',
      title: '申请材料与时间节点提示',
      summary:
        '正式申请通过 CNAS「实验室/检验机构认可业务系统」线上提交 CNAS-AL21 申请书及附件、CNAS-AL01-60 认可合同及申请范围附表。受理后一般 3 个月内安排评审；自首次反馈问题起超过 3 个月仍不能满足受理条件的不予受理；受理后 3 个月内因申请人原因不能接受现场评审的，可终止认可过程。',
      citations: [AL('申请书及附件'), R10('第 5.1 条 初次认可流程')],
      obligations: [
        { title: '线上填写申请书', deadline: 'CNAS-AL21《生物样本库质量和能力认可申请书》及附件，对材料真实性负责', citations: [AL('申请书及附件')] },
        { title: '签署认可合同', deadline: 'CNAS-AL01-60《认可合同》及申请范围相关附表附件', citations: [{ source: AL0160, article: '认可合同及附表', confidence: 'A', regulationId: 'al0160' }] },
        { title: '体系运行满 6 个月', deadline: '申请前管理体系须正式、有效运行 6 个月以上', citations: [R10('申请条件（三）')] },
        { title: '内审与管理评审', deadline: '申请前完成至少一次完整内审和管理评审并保留整改闭环证据', citations: [R10('申请条件（四）'), C('第 8.8、8.9 条')] },
      ],
      reasons: ['申请条件基本具备，进入材料准备阶段'],
    })
  }

  // 界面兼容字段：unitType 用法律地位映射；regulatedMaterial/Info 反映是否人源样本
  const unitType: EvalResult['unitType'] =
    legal === 'independent' ? 'chinese' : legal === 'authorized' ? 'chinese' : legal === 'none' ? 'foreign' : 'unclear'

  return {
    unitType,
    regulatedMaterial: human,
    regulatedInfo: human,
    onlyExemptMaterial: !human,
    eligibility,
    gates,
    conclusions,
    grayAreas,
    regulations: regulationsOf(conclusions, gates),
  }
}
