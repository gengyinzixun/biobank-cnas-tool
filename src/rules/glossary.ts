/**
 * 术语定义表：CNAS 生物样本库认可（ISO 20387 / GB/T 37864）相关术语。
 * 用法：向导中通过 Question.terms 关联题目，随题展示定义。
 */

import type { Answers } from './types'

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  source: string
  regulationId: 'cl10' | 'rl10' | 'rl02' | 'tiaoli' | 'xize' | 'ethics'
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  legal_entity: {
    id: 'legal_entity',
    term: '法人实体 / 明确的法律地位',
    definition:
      '生物样本库应是法人实体，或是法人实体的独立部分，能对其任何行为负法律责任。政府性质的生物样本库被认为是法人实体，或是与其政府地位相当的法人实体。',
    source: 'GB/T 37864-2019（ISO 20387:2018）第 5.1 条；CNAS-RL10 第 4 章',
    regulationId: 'cl10',
  },
  scope: {
    id: 'scope',
    term: '生物样本库活动范围',
    definition:
      '生物样本库开展的活动应满足本标准、样本库协议和/或具有法律约束力的文件的要求。样本库规定的活动范围应符合本标准并形成文件；样本库应声明仅其规定范围内的活动符合本标准，不包括外部提供的生物样本库活动。',
    source: 'GB/T 37864-2019 第 5.6、5.7 条',
    regulationId: 'cl10',
  },
  qms: {
    id: 'qms',
    term: '质量管理体系（方式 A）',
    definition:
      'ISO 20387 提供质量管理体系选项（附录 C）。国内 CNAS 一般按方式 A 实施：包含体系文件成文信息（8.2）、文件控制（8.3）、记录（8.4）、风险防范（8.5）、改进（8.6）、纠正措施（8.7）、内部审核（8.8）、管理评审（8.9）。',
    source: 'GB/T 37864-2019 第 8 章；附录 C',
    regulationId: 'cl10',
  },
  internal_audit: {
    id: 'internal_audit',
    term: '内部审核',
    definition:
      '生物样本库应按策划的时间间隔进行内部审核，以确定质量管理体系是否符合策划的安排、本标准的要求以及样本库自身确定的要求，是否得到有效实施和保持。内审员应独立、经过培训，覆盖全部范围与条款。',
    source: 'GB/T 37864-2019 第 8.8 条（方式 A）',
    regulationId: 'cl10',
  },
  mgmt_review: {
    id: 'mgmt_review',
    term: '质量管理评审',
    definition:
      '最高管理者应按策划的时间间隔对质量管理体系进行评审，以确保其适宜性、充分性和有效性。评审输入包括内审结果、投诉、风险、资源、质量目标与变更，输出为决议与跟踪记录。',
    source: 'GB/T 37864-2019 第 8.9 条（方式 A）',
    regulationId: 'cl10',
  },
  personnel: {
    id: 'personnel',
    term: '人员能力要求',
    definition:
      '生物样本库应配备专职或兼职人员，拥有权限和资源以实施、保持、监控和改进质量管理体系；识别偏离、评估影响并制定措施；向管理层报告体系运行状况与改进需求。人员应经培训、能力评估与授权，保存相关记录。',
    source: 'GB/T 37864-2019 第 5.9、6.2 条',
    regulationId: 'cl10',
  },
  equipment: {
    id: 'equipment',
    term: '设备与量值溯源',
    definition:
      '生物样本库应配备满足样本采集、处理、储存、转运所需设备，建立台账、校准、维护与验证程序；关键设备使用前应确认性能。CNAS 要求仪器设备的量值溯源满足相关要求，温度等关键参数应持续监控。',
    source: 'GB/T 37864-2019 第 6.5 条；CNAS 生物样本库认可申请条件（七）',
    regulationId: 'cl10',
  },
  proficiency_testing: {
    id: 'proficiency_testing',
    term: '能力验证',
    definition:
      'CNAS 申请条件之一：技术能力满足 CNAS-RL02《能力验证规则》的要求，即按申请范围参加相应能力验证或实验室间比对，频次与覆盖领域满足规则要求。',
    source: 'CNAS-RL02《能力验证规则》；CNAS 生物样本库认可申请条件（五）',
    regulationId: 'rl02',
  },
  lims: {
    id: 'lims',
    term: '可追溯性与信息和数据管理',
    definition:
      '生物样本及相关数据应具有可追溯性，样本应有唯一标识并能在全生命周期中追溯；信息和数据应受控管理，电子记录防篡改、权限分级、定期备份，并保护样本提供者隐私。',
    source: 'GB/T 37864-2019 第 7.5、7.10 条',
    regulationId: 'cl10',
  },
  ethics: {
    id: 'ethics',
    term: '伦理审查与知情同意',
    definition:
      '生物样本库应遵守相关生物样本及相关数据的区域、国家和国际的伦理规范；保护样本提供者（供体）、接收者和用户的隐私信息和权利，仅在相关协议和授权（如合同协议、具有法律约束力的文件、伦理批件）下发布样本及相关数据。',
    source: 'GB/T 37864-2019 第 4.1.6、4.3 条；《涉及人的生命科学和医学研究伦理审查办法》（2023）',
    regulationId: 'ethics',
  },
  hgr_license: {
    id: 'hgr_license',
    term: '人类遗传资源保藏行政许可',
    definition:
      '在我国境内，以科学研究为目的、为科学研究提供基础平台而长期保存人类遗传资源的，应当经主管部门批准取得保藏行政许可。以临床诊疗/教学为主兼顾科研、已上市药械生产目的，或检测后按法规/方案约定的临时存储，不构成保藏。依据 2026 年国家卫健委令第 16 号《实施细则》。',
    source: '《人类遗传资源管理条例》第十四条；《实施细则》（2026）第二十一、二十二条',
    regulationId: 'xize',
  },
}

/** 返回本次评估答案所涉及的术语（供报告展示） */
export function relevantTerms(a: Answers): GlossaryTerm[] {
  const ids: string[] = []
  for (const [id, v] of Object.entries(a)) {
    if (id.startsWith('_') || v === undefined) continue
    if (GLOSSARY[id] && !ids.includes(id)) ids.push(id)
  }
  return ids.map((id) => GLOSSARY[id])
}
