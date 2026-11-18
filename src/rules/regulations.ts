/**
 * 法规与认可规范注册表：CNAS 生物样本库认可（ISO 20387 / GB/T 37864）申请资格自查规则库的版本快照。
 *
 * 依据来源与核定说明见 docs/依据清单-CNAS生物样本库认可.md。
 */

/** 规则库版本快照 */
export const RULESET_VERSION = '1.0.0'
export const RULESET_REVIEWED_AT = '2026-11-18'

export type RegulationStatus =
  | 'current'
  | 'outdated'
  | 'practice'

export interface RegulationMeta {
  id: string
  name: string
  issuer: string
  currentAuthority: string
  promulgated: string
  effective: string
  status: RegulationStatus
  statusNote?: string
  userNote?: string
}

export const REGULATIONS: Record<string, RegulationMeta> = {
  cl10: {
    id: 'cl10',
    name: 'CNAS-CL10:2020《生物样本库质量和能力认可准则》（等同采用 GB/T 37864-2019 / ISO 20387:2018）',
    issuer: '中国合格评定国家认可委员会（CNAS）',
    currentAuthority: '中国合格评定国家认可委员会（CNAS）',
    promulgated: '2020 发布',
    effective: '2021-01-01 实施',
    status: 'current',
    statusNote:
      'CNAS 生物样本库认可的核心准则，等同采用 GB/T 37864-2019（翻译法等同 ISO 20387:2018）。章节结构：4 通用要求（4.1 总则/4.2 公正性/4.3 保密性）、5 结构要求、6 资源要求（6.1 总则/6.2 人员/6.3 基础设施与环境/6.4 外部提供的过程产品和服务/6.5 设备）、7 过程要求（7.1 总则/7.2 采集/7.3 接收和分发/7.4 运输/7.5 可追溯性/7.6 制备和保存/7.7 储存/7.8 质量控制/7.9 方法确认和验证/7.10 信息和数据管理/7.11 不符合输出/7.12 报告要求/7.13 投诉）、8 管理要求（8.1 方式/8.2 体系文件成文信息/8.3 文件控制/8.4 记录/8.5 风险防范/8.6 改进/8.7 纠正措施/8.8 内部审核/8.9 管理评审，8.2-8.9 均为方式 A）。',
  },
  rl10: {
    id: 'rl10',
    name: 'CNAS-RL10《生物样本库认可规则》',
    issuer: '中国合格评定国家认可委员会（CNAS）',
    currentAuthority: '中国合格评定国家认可委员会（CNAS）',
    promulgated: '2020 发布',
    effective: '2021-01-01 实施',
    status: 'current',
    statusNote:
      '规定认可条件（第 4 章）、认可流程（第 5 章）与自我评估要求（第 6 章）。注意：CNAS 已发布 2025 年修订征求意见稿，本规则库按现行有效版本评估；正式版发布后须复核。',
    userNote: '认可规则已有 2025 修订征求意见稿发布，本报告按现行有效版本评估；正式版发布后请以 CNAS 官网最新文本为准。',
  },
  rl02: {
    id: 'rl02',
    name: 'CNAS-RL02《能力验证规则》',
    issuer: '中国合格评定国家认可委员会（CNAS）',
    currentAuthority: '中国合格评定国家认可委员会（CNAS）',
    promulgated: '现行版本',
    effective: '现行有效',
    status: 'current',
    statusNote: '申请条件第（五）项引用：技术能力满足 RL02 对能力验证频次与覆盖范围的要求。',
  },
  al21: {
    id: 'al21',
    name: 'CNAS-AL21《生物样本库质量和能力认可申请书》及附件',
    issuer: '中国合格评定国家认可委员会（CNAS）',
    currentAuthority: '中国合格评定国家认可委员会（CNAS）',
    promulgated: '现行版本',
    effective: '现行有效',
    status: 'current',
  },
  al0160: {
    id: 'al0160',
    name: 'CNAS-AL01-60《认可合同》及申请范围相关附表附件',
    issuer: '中国合格评定国家认可委员会（CNAS）',
    currentAuthority: '中国合格评定国家认可委员会（CNAS）',
    promulgated: '现行版本',
    effective: '现行有效',
    status: 'current',
  },
  tiaoli: {
    id: 'tiaoli',
    name: '《中华人民共和国人类遗传资源管理条例》（2024 修订）',
    issuer: '国务院（2019 年第 717 号令公布；2024 年第 777 号令修订）',
    currentAuthority: '国家卫生健康委员会',
    promulgated: '2019-05-28 公布，2024-03-10 修订',
    effective: '2019-07-01 施行，2024 修订自 2024-05-01 施行',
    status: 'current',
    userNote: '医院人源样本库涉及人类遗传资源的，保藏/采集活动等须符合本条例；本工具仅做合规自查提示，不替代申报评估。',
  },
  xize: {
    id: 'xize',
    name: '《人类遗传资源管理条例实施细则》（2026，国家卫生健康委员会令第 16 号）',
    issuer: '国家卫生健康委员会（2026 年第 16 号令）',
    currentAuthority: '国家卫生健康委员会',
    promulgated: '2026-11-11 公布',
    effective: '2026-11-11 起施行（自公布之日起施行）',
    status: 'current',
    statusNote: '新规 8 章 61 条，条号全量重排；保藏定义收窄为"仅用于科学研究"，临床诊疗/教学为主兼顾科研的样本保存不构成保藏。',
    userNote: '2026-11-11 细则换版施行，旧版第 21 号令同时废止、无过渡期；本报告按新版条款评估。',
  },
  ethics: {
    id: 'ethics',
    name: '《涉及人的生命科学和医学研究伦理审查办法》（2023）',
    issuer: '国家卫生健康委员会、教育部、科技部、国家中医药局',
    currentAuthority: '国家卫生健康委员会',
    promulgated: '2023-02-18',
    effective: '2023-02-18',
    status: 'current',
    statusNote: '医院人源样本采集、保藏、使用须通过伦理审查；知情同意为其核心要求。',
  },
  practice: {
    id: 'practice',
    name: '实务操作惯例（非规范性文件）',
    issuer: '——',
    currentAuthority: '——',
    promulgated: '——',
    effective: '——',
    status: 'practice',
    statusNote: '非法规明文规定，系认可准备与评审实践中的通行做法，重大事项建议与 CNAS 或专业顾问确认。',
    userNote: '非法规明文规定，系实践中的通行做法，重大事项建议与主管部门或专业顾问沟通确认。',
  },
}

/** 按引用出现顺序去重，取出本次评估实际依据的法规清单 */
export function collectRegulations(regulationIds: string[]): RegulationMeta[] {
  const seen = new Set<string>()
  const out: RegulationMeta[] = []
  for (const id of regulationIds) {
    if (seen.has(id)) continue
    seen.add(id)
    const meta = REGULATIONS[id]
    if (meta) out.push(meta)
  }
  return out
}

export const STATUS_LABEL: Record<RegulationStatus, string> = {
  current: '现行有效',
  outdated: '已有更新',
  practice: '实践惯例',
}
