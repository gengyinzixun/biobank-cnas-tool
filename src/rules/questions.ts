import type { Answers, Question } from './types'

export const get = (a: Answers, id: string) => a[id] as string | undefined
export const getMulti = (a: Answers, id: string) => (a[id] as string[] | undefined) ?? []
export const has = (a: Answers, id: string, v: string) => getMulti(a, id).includes(v)

const L1 = '第 1 层 · 主体与法律地位'
const L2 = '第 2 层 · 管理体系运行'
const L3 = '第 3 层 · 资源与技术能力'
const L4 = '第 4 层 · 人源样本合规（医院专项）'

/**
 * 医院生物样本库 CNAS 认可（ISO 20387 / CNAS-CL10）申请资格自查题库。
 * 四层漏斗对应 CNAS 官网列出的 8 项申请条件 + 医院人源样本合规红线。
 */
export const questions: Question[] = [
  // ───────── 第 1 层：主体与法律地位（申请条件二、八） ─────────
  {
    id: 'legal_entity',
    layer: 1,
    layerLabel: L1,
    text: '申请主体的法律地位是否满足要求？',
    help: 'CNAS 要求申请人具有明确的法律地位、能独立承担法律责任。医院样本库通常为独立法人（医院）或法人授权的独立运行部门；后者需有法人正式授权文件，并明确样本库在母体组织中的位置。依据：CNAS-RL10 第 4 章；GB/T 37864 第 5 章。',
    terms: ['legal_entity'],
    options: [
      { value: 'independent', label: '独立法人（医院/研究院所等），能独立承担法律责任' },
      { value: 'authorized', label: '法人授权的独立运行部门（有正式授权文件）' },
      { value: 'none', label: '无独立法律地位、也无授权' },
      { value: 'unclear', label: '不确定，需要帮助判定' },
    ],
  },
  {
    id: 'self_assessment',
    layer: 1,
    layerLabel: L1,
    text: '是否已对照 CNAS-CL10 完成有效的自我评估？',
    help: 'CNAS 申请条件第（一）项：基本了解 CNAS 相关要求，且进行了有效的自我评估。自我评估应覆盖准则全部要素（4 通用、5 结构、6 资源、7 过程、8 管理），形成书面自查报告与不符合项清单。',
    options: [
      { value: 'yes', label: '已完成，有书面自查报告与不符合项清单' },
      { value: 'partial', label: '做了部分，未形成完整报告' },
      { value: 'no', label: '尚未开展' },
    ],
  },
  {
    id: 'scope_defined',
    layer: 1,
    layerLabel: L1,
    text: '申请认可的范围是否已明确界定并形成文件？',
    help: 'GB/T 37864 第 5.7 条：生物样本库规定的活动范围应符合本标准并形成文件，仅声明规定范围内的活动符合要求。范围应写明样本类型（全血、组织、细胞、核酸等）、来源（人源/动物/微生物）与开展的活动（采集、接收、制备、保存、储存、分发、运输、销毁等）。范围写的过大而无 SOP 与验证支持，评审时会被缩减。',
    terms: ['scope'],
    options: [
      { value: 'yes', label: '已明确样本类型+活动范围，形成文件' },
      { value: 'partial', label: '有大致范围，未逐项写明' },
      { value: 'no', label: '尚未界定' },
    ],
  },
  {
    id: 'scope_clinical',
    layer: 1,
    layerLabel: L1,
    text: '拟申请范围是否涉及临床诊断或治疗用生物材料？',
    help: 'ISO 20387 / GB/T 37864 适用于科研用生物样本保藏，不直接适用于临床诊断、治疗制剂或上市药品生产用材料。若样本直接用于临床诊断，应优先考虑 ISO 15189（医学实验室认可）路径；若混合，需在范围中明确区分。',
    options: [
      { value: 'no', label: '否，仅科研用样本保藏' },
      { value: 'yes', label: '是，涉及临床诊断/治疗用材料' },
      { value: 'mixed', label: '两者都有，已做区分' },
      { value: 'unclear', label: '不确定' },
    ],
  },

  // ───────── 第 2 层：管理体系运行（申请条件三、四） ─────────
  {
    id: 'qms_established',
    layer: 2,
    layerLabel: L2,
    text: '是否已建立符合 CNAS-CL10 的管理体系文件？',
    help: '应建立层次分明的文件体系：质量手册、程序文件、作业指导书（SOP）、记录表单四级。体系应覆盖准则全部要素（第 4-8 章）及申请范围内的全部活动。国内 CNAS 一般按质量管理体系方式 A 实施（见准则 8.1-8.9）。',
    terms: ['qms'],
    options: [
      { value: 'yes', label: '四级文件齐全，覆盖全部范围活动' },
      { value: 'partial', label: '有手册和部分程序，SOP/记录不全' },
      { value: 'no', label: '尚未建立' },
    ],
  },
  {
    id: 'qms_runtime',
    layer: 2,
    layerLabel: L2,
    text: '管理体系正式、有效运行了多久？',
    help: 'CNAS 申请条件第（三）项硬性要求：管理体系正式、有效运行 6 个月以上。注意"有效运行"意味着有真实样本、真实记录，不是纸面体系或空库；运行期内的样本接收、处理、储存、质控、分发等记录应完整可查。',
    options: [
      { value: 'ge6m', label: '6 个月以上，且有完整运行记录' },
      { value: 'lt6m', label: '不足 6 个月' },
      { value: 'paper', label: '文件写了但未实际运行 / 空库' },
      { value: 'no', label: '尚未运行' },
    ],
  },
  {
    id: 'internal_audit',
    layer: 2,
    layerLabel: L2,
    text: '是否完成过完整的内部审核？',
    help: 'CNAS 申请条件第（四）项：进行过完整的内审和管理评审，能达到预期目的，且所有体系要素均有运行记录。准则第 8.8 条（方式 A）要求按计划开展内审，内审员应独立、经培训，覆盖全部范围与条款，并保留报告、不符合项与整改闭环证据。',
    terms: ['internal_audit'],
    options: [
      { value: 'yes_closed', label: '已完成完整内审，不符合项已整改闭环' },
      { value: 'yes_open', label: '已做内审，但有不符合项未关闭' },
      { value: 'partial', label: '做过部分要素的内审' },
      { value: 'no', label: '尚未开展' },
    ],
  },
  {
    id: 'mgmt_review',
    layer: 2,
    layerLabel: L2,
    text: '是否完成过管理评审？',
    help: '准则第 8.9 条（方式 A）：最高管理者按计划对管理体系的适宜性、充分性、有效性进行评审。输入应包含内审结果、投诉、风险、资源、质量目标、变更等，输出为决议与跟踪记录。CNAS 申请条件第（四）项将其列为硬性前置。',
    terms: ['mgmt_review'],
    options: [
      { value: 'yes', label: '已完成，有管理评审报告与决议跟踪' },
      { value: 'planned', label: '已计划，尚未实施' },
      { value: 'no', label: '尚未开展' },
    ],
  },
  {
    id: 'records_complete',
    layer: 2,
    layerLabel: L2,
    text: '所有体系要素是否都有真实、可追溯的运行记录？',
    help: 'CNAS 申请条件第（四）项明确"所有体系要素应有运行记录"。评审时会抽查样本全生命周期记录（采集/接收/制备/储存/质控/分发/销毁）、设备与温度监控记录、人员培训记录、内审管评记录。纸面体系、空库、记录碎片化是常见不符合项。',
    options: [
      { value: 'yes', label: '是，记录完整可追溯' },
      { value: 'partial', label: '部分要素有记录，部分缺失' },
      { value: 'no', label: '记录零散/基本没有' },
    ],
  },
  {
    id: 'corrective_action',
    layer: 2,
    layerLabel: L2,
    text: '是否建立了不符合控制与纠正措施机制？',
    help: '准则第 7.11 条（不符合输出）与第 8.7 条（纠正措施，方式 A）：应识别不符合、分析原因、制定并实施纠正措施，并验证有效性。评审关注投诉处理、不符合样本处置、内审不符合项的整改闭环记录。',
    options: [
      { value: 'yes', label: '已建立并有整改闭环记录' },
      { value: 'partial', label: '有流程，执行记录不全' },
      { value: 'no', label: '尚未建立' },
    ],
  },

  // ───────── 第 3 层：资源与技术能力（申请条件五、六、七） ─────────
  {
    id: 'personnel',
    layer: 3,
    layerLabel: L3,
    text: '关键岗位人员是否配齐并完成能力确认？',
    help: 'CNAS 申请条件第（六）项：具有开展申请范围内活动所需的足够资源，包括主要人员。样本库应明确负责人、技术主管、质量主管、样本操作岗、内审员等（准则 5.9、6.2），完成培训、能力评估与上岗授权，保存教育、培训、技能、健康安全记录；全员签署保密承诺。',
    terms: ['personnel'],
    options: [
      { value: 'yes', label: '关键岗位齐全，培训/授权/档案完整' },
      { value: 'partial', label: '人员基本到位，档案/授权不全' },
      { value: 'no', label: '关键岗位缺失' },
    ],
  },
  {
    id: 'signatory',
    layer: 3,
    layerLabel: L3,
    text: '授权签字人是否满足资格要求？',
    help: 'CNAS 申请条件第（六）项特别指出"包括授权签字人应能满足相关资格要求"。授权签字人需经 CNAS 确认，具备相应技术背景、熟悉准则与认可要求、能签署报告/证书；若申请范围含对外分发与报告签发，此项为必查。',
    options: [
      { value: 'yes', label: '已确定并满足资格要求' },
      { value: 'partial', label: '已指定，资格材料待补' },
      { value: 'na', label: '申请范围不涉及报告签发' },
      { value: 'no', label: '尚未确定' },
    ],
  },
  {
    id: 'equipment_traceability',
    layer: 3,
    layerLabel: L3,
    text: '仪器设备的量值溯源与监控是否满足要求？',
    help: 'CNAS 申请条件第（七）项：仪器设备的量值溯源应能满足 CNAS 相关要求。关键设备（超低温冰箱、液氮罐、离心机、移液器等）需有台账、确认/验证、校准、维护、故障记录；温度应 24h 连续自动监控并有报警与处置记录；配备备用电源与备用存储。依据准则 6.5、7.7。',
    terms: ['equipment'],
    options: [
      { value: 'yes', label: '台账/校准/24h监控/报警/应急预案齐全' },
      { value: 'partial', label: '部分设备有校准，监控或记录不全' },
      { value: 'no', label: '基本没有量值溯源与监控' },
    ],
  },
  {
    id: 'proficiency_testing',
    layer: 3,
    layerLabel: L3,
    text: '能力验证活动的频次与覆盖是否满足 CNAS-RL02？',
    help: 'CNAS 申请条件第（五）项：技术能力满足 CNAS-RL02《能力验证规则》的要求。需按申请范围参加相应能力验证或实验室间比对，频次与覆盖领域满足规则要求；未开展或覆盖不足是常见不予受理/评审不符合项。',
    terms: ['proficiency_testing'],
    options: [
      { value: 'yes', label: '已按 RL02 参加，频次与覆盖满足' },
      { value: 'partial', label: '参加过，但频次或覆盖不足' },
      { value: 'no', label: '尚未参加' },
      { value: 'unclear', label: '不确定如何判断' },
    ],
  },
  {
    id: 'technical_experience',
    layer: 3,
    layerLabel: L3,
    text: '申请认可的每项技术能力是否都有相应的真实经历？',
    help: 'CNAS 申请条件第（八）项：申请认可的技术能力有相应的检测经历，且经历应覆盖申请的全部项目/参数。样本库需对每类样本、每项活动（如组织处理、核酸提取、细胞活率检测）保留真实操作记录与方法确认/验证证据（准则 7.9）。',
    options: [
      { value: 'yes', label: '全部项目/参数均有经历与记录' },
      { value: 'partial', label: '主要项目有，部分缺失' },
      { value: 'no', label: '多数项目无真实经历' },
    ],
  },
  {
    id: 'external_providers',
    layer: 3,
    layerLabel: L3,
    text: '外部提供的过程、产品和服务是否已评价并受控？',
    help: '准则第 6.4 条：外部提供的过程、产品和服务（冷链运输、耗材试剂、检测、校准、维保等）应建立评价、准入、监控与再评价机制，合同明确质量要求。常见不符合项：冷链运输商无评价、校准证书未确认。',
    options: [
      { value: 'yes', label: '已评价准入并保留监控记录' },
      { value: 'partial', label: '有供应方，评价记录不全' },
      { value: 'no', label: '未评价 / 无控制' },
      { value: 'na', label: '无外部供方' },
    ],
  },
  {
    id: 'lims_traceability',
    layer: 3,
    layerLabel: L3,
    text: '样本全生命周期是否可追溯（LIMS 或等效系统）？',
    help: '准则第 7.5 条（可追溯性）、7.10 条（信息和数据管理）：样本应有唯一标识，采集、接收、制备、保存、储存、质控、分发、销毁全流程可追溯；电子记录防篡改、权限分级、定期备份、隐私保护。仅有低温冰箱而无 LIMS/完整溯源是行业最常见的短板。',
    terms: ['lims'],
    options: [
      { value: 'yes', label: '唯一标识+全流程溯源+权限与备份' },
      { value: 'partial', label: '有台账，溯源链不完整' },
      { value: 'no', label: '记录碎片化，无法完整追溯' },
    ],
  },

  // ───────── 第 4 层：人源样本合规红线（医院专项） ─────────
  {
    id: 'human_samples',
    layer: 4,
    layerLabel: L4,
    text: '样本库是否保藏人源样本？',
    help: '医院样本库通常涉及人源样本，须同步满足伦理审查、知情同意与人类遗传资源管理要求；非人源样本（动物、植物、微生物）无此红线，可跳过后续伦理与人遗题目。',
    options: [
      { value: 'yes', label: '是，涉及人源样本' },
      { value: 'no', label: '否，仅非人源样本' },
    ],
  },
  {
    id: 'ethics_approval',
    layer: 4,
    layerLabel: L4,
    text: '人源样本的采集、保藏与使用是否通过伦理审查？',
    help: '《涉及人的生命科学和医学研究伦理审查办法》（2023）要求涉及人的研究须通过伦理审查；CNAS-CL10 第 4.1.6 条要求遵守区域、国家和国际的伦理规范，第 4.3 条涉及样本提供者隐私与知情同意。伦理批件缺失是医院样本库申请认可的一票否决项。',
    terms: ['ethics'],
    when: (a) => get(a, 'human_samples') === 'yes',
    options: [
      { value: 'yes', label: '已取得有效伦理批件，覆盖保藏与使用' },
      { value: 'partial', label: '部分项目有，未覆盖全部范围' },
      { value: 'no', label: '未通过伦理审查' },
    ],
  },
  {
    id: 'informed_consent',
    layer: 4,
    layerLabel: L4,
    text: '知情同意体系是否完整、版本受控？',
    help: '人源样本采集须取得供体知情同意，同意书版本应受控、能覆盖样本的保藏与后续使用范围；评审会抽查知情同意书版本、签署过程与样本去向的一致性。依据《伦理审查办法》及 GB/T 37864 第 4.3 条。',
    when: (a) => get(a, 'human_samples') === 'yes',
    options: [
      { value: 'yes', label: '完整、版本受控、覆盖保藏使用' },
      { value: 'partial', label: '有同意书，版本或范围不清' },
      { value: 'no', label: '不完整 / 未取得' },
    ],
  },
  {
    id: 'hgr_compliance',
    layer: 4,
    layerLabel: L4,
    text: '人类遗传资源保藏许可/备案是否已完成？',
    help: '按 2026 年国家卫健委令第 16 号《实施细则》，以科学研究为目的的长期保藏需取得保藏行政许可；但以临床诊疗/教学为主、兼顾科研的样本保存，或已上市药械生产目的等情形，不构成保藏、无需办保藏许可。涉及重要遗传家系、特定地区或大规模采集（>10000 例）的还须另行判断采集许可。建议先用人遗申报评估工具做路径初判。',
    terms: ['hgr_license'],
    when: (a) => get(a, 'human_samples') === 'yes',
    options: [
      { value: 'yes', label: '已取得保藏许可/完成备案，或经判定不构成保藏' },
      { value: 'pending', label: '申请中 / 尚未取得' },
      { value: 'no', label: '应办未办' },
      { value: 'unclear', label: '不确定是否需要（建议先做人遗路径评估）' },
    ],
  },
  {
    id: 'biosafety',
    layer: 4,
    layerLabel: L4,
    text: '生物安全与应急预案是否满足要求？',
    help: '样本库应有与样本风险等级匹配的生物安全条件、个人防护、废弃物处置、泄漏/火灾/停电/制冷失效应急预案，以及业务连续性与灾难恢复计划（准则 4.1.1、6.3、8.5）。',
    options: [
      { value: 'yes', label: '生物安全+应急预案+灾难恢复齐全' },
      { value: 'partial', label: '有部分制度，预案不全' },
      { value: 'no', label: '尚未建立' },
    ],
  },
]

export function visibleQuestions(a: Answers): Question[] {
  const flow = (a._flow as string | undefined) ?? 'new'
  return questions.filter((q) => (q.flow ?? 'new') === flow && (!q.when || q.when(a)))
}
