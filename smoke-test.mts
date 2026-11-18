import { evaluate } from './src/rules/evaluate'
import { visibleQuestions } from './src/rules/questions'

let pass = 0
let fail = 0

function check(name: string, answers: any, expectIds: string[], expectEligibility?: string) {
  const res = evaluate(answers)
  const got = res.conclusions.map((c) => c.id)
  const okIds = expectIds.every((e) => got.includes(e))
  const okEli = expectEligibility ? res.eligibility === expectEligibility : true
  if (okIds && okEli) {
    pass++
    console.log(`PASS ${name} -> [${got.join(', ')}] 资格:${res.eligibility}`)
  } else {
    fail++
    console.log(`FAIL ${name}\n  expect ids: ${expectIds.join(',')} / eligibility: ${expectEligibility ?? 'any'}\n  got ids: ${got.join(',')} / eligibility: ${res.eligibility}`)
  }
}

// 完整合格答案：8项硬门槛全满足 + 人源样本合规齐全 + 无过程短板
const GOOD: any = {
  legal_entity: 'independent',
  self_assessment: 'yes',
  scope_defined: 'yes',
  scope_clinical: 'no',
  qms_established: 'yes',
  qms_runtime: 'ge6m',
  internal_audit: 'yes_closed',
  mgmt_review: 'yes',
  records_complete: 'yes',
  corrective_action: 'yes',
  personnel: 'yes',
  signatory: 'yes',
  equipment_traceability: 'yes',
  proficiency_testing: 'yes',
  technical_experience: 'yes',
  external_providers: 'yes',
  lims_traceability: 'yes',
  human_samples: 'yes',
  ethics_approval: 'yes',
  informed_consent: 'yes',
  hgr_compliance: 'yes',
  biosafety: 'yes',
}

// 1. 成熟医院样本库：全部满足 -> 可申请
check('成熟医院样本库（全部满足）', GOOD, ['eligibility', 'application-materials'], 'ready')

// 2. 体系运行不足6个月 -> 补正后可申请
check('体系运行不足6个月', { ...GOOD, qms_runtime: 'lt6m' }, ['eligibility'], 'conditional')

// 3. 无内审管评 -> 硬性门槛未满足 -> 暂不具备
check('无内审管评', { ...GOOD, internal_audit: 'no', mgmt_review: 'no' }, ['eligibility'], 'blocked')

// 4. 伦理批件缺失 -> 红线阻断
check('伦理批件缺失（红线）', { ...GOOD, ethics_approval: 'no' }, ['eligibility'], 'blocked')

// 5. 人遗应办未办 -> 红线阻断
check('人遗保藏许可应办未办', { ...GOOD, hgr_compliance: 'no' }, ['eligibility'], 'blocked')

// 6. 非人源样本：伦理/人遗三项不适用 -> 可申请
check('非人源样本库（NA）', { ...GOOD, human_samples: 'no' }, ['eligibility'], 'ready')

// 7. 过程控制短板 -> 提示结论
check('LIMS/供方/生物安全短板', {
  ...GOOD,
  lims_traceability: 'no',
  external_providers: 'no',
  biosafety: 'no',
  corrective_action: 'no',
}, ['process-gaps', 'eligibility'], 'ready')

// 8. 临床诊断用材料 -> ISO15189 提示
check('涉临床诊断材料', { ...GOOD, scope_clinical: 'yes' }, ['scope-15189', 'eligibility'], 'ready')

// 9. 人遗判定不清 -> 灰区提示 + 补正
check('人遗合规不确定', { ...GOOD, hgr_compliance: 'unclear' }, ['eligibility'], 'conditional')

// 10. 题库完整性：21题可见（人源）
{
  const qs = visibleQuestions({ human_samples: 'yes' })
  const ok = qs.length >= 20
  if (ok) { pass++; console.log(`PASS 题库完整性 -> 人源场景可见 ${qs.length} 题`) }
  else { fail++; console.log(`FAIL 题库完整性 -> 仅 ${qs.length} 题`) }
}

// 11. 非人源场景题数减少（伦理3题隐藏）
{
  const withHuman = visibleQuestions({ human_samples: 'yes' }).length
  const without = visibleQuestions({ human_samples: 'no' }).length
  const ok = without < withHuman
  if (ok) { pass++; console.log(`PASS 条件题目 -> 非人源 ${without} 题 < 人源 ${withHuman} 题`) }
  else { fail++; console.log(`FAIL 条件题目 -> 非人源 ${without} / 人源 ${withHuman}`) }
}

// 12. 红线不因其他条件满足而豁免
check('红线优先级（伦理缺失即使其余全优）', {
  ...GOOD,
  ethics_approval: 'no',
  informed_consent: 'no',
}, ['eligibility'], 'blocked')

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
