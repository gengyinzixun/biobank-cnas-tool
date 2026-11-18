import type { Conclusion, ConclusionType, Confidence } from '../rules/types'
import type { EvalResult } from '../rules/evaluate'
import type { Answers } from '../rules/types'
import { RULESET_REVIEWED_AT, RULESET_VERSION, STATUS_LABEL, type RegulationStatus } from '../rules/regulations'
import { relevantTerms } from '../rules/glossary'
import { exportReportDocx } from '../utils/exportDocx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Ban,
  BookMarked,
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  FileDown,
  FileText,
  FlagTriangleRight,
  Printer,
  RotateCcw,
  Scale,
  ShieldAlert,
  UserRound,
} from 'lucide-react'

const TYPE_META: Record<ConclusionType, { label: string; bar: string; icon: React.ReactNode }> = {
  prohibited: { label: '暂不具备 / 红线', bar: 'border-l-red-500', icon: <Ban className="h-4 w-4 text-red-600" /> },
  'security-review': { label: '重点提示', bar: 'border-l-orange-500', icon: <ShieldAlert className="h-4 w-4 text-orange-600" /> },
  approval: { label: '硬性门槛未满足', bar: 'border-l-rose-500', icon: <Scale className="h-4 w-4 text-rose-600" /> },
  filing: { label: '待补正', bar: 'border-l-blue-500', icon: <FileCheck2 className="h-4 w-4 text-blue-600" /> },
  report: { label: '整改建议', bar: 'border-l-violet-500', icon: <FileText className="h-4 w-4 text-violet-600" /> },
  exempt: { label: '已满足', bar: 'border-l-emerald-500', icon: <FlagTriangleRight className="h-4 w-4 text-emerald-600" /> },
  notice: { label: '自查提示', bar: 'border-l-slate-400', icon: <AlertTriangle className="h-4 w-4 text-slate-400" /> },
}

const CONF_META: Record<Confidence, { label: string; cls: string }> = {
  A: { label: 'A · 法规条文', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  B: { label: 'B · 官方解答口径', cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  C: { label: 'C · 实践惯例', cls: 'bg-stone-100 text-stone-700 border-stone-200' },
}

/** 置信度等级序：A 最高、C 最低；卡片只展示该卡最低（最保守）一级 */
const CONF_RANK: Record<Confidence, number> = { A: 0, B: 1, C: 2 }
const worstConfidence = (citations: Conclusion['citations']): Confidence | null =>
  citations.reduce<Confidence | null>(
    (acc, ci) => (acc === null || CONF_RANK[ci.confidence] > CONF_RANK[acc] ? ci.confidence : acc),
    null,
  )

const REG_STATUS_META: Record<RegulationStatus, { cls: string }> = {
  current: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  outdated: { cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  practice: { cls: 'bg-stone-100 text-stone-700 border-stone-200' },
}

function ConclusionCard({ c }: { c: Conclusion }) {
  const meta = TYPE_META[c.type]
  const worst = worstConfidence(c.citations)
  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 bg-white p-5 break-inside-avoid ${meta.bar}`}>
      <div className="flex flex-wrap items-center gap-2">
        {meta.icon}
        <span className="text-xs font-medium text-slate-500">{meta.label}</span>
        {worst && (
          <Badge variant="outline" className={`text-[10px] ${CONF_META[worst].cls}`}>
            {CONF_META[worst].label}
          </Badge>
        )}
      </div>
      <h3 className="mt-2 text-base font-semibold leading-6 text-slate-900">{c.title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-700">{c.summary}</p>

      {c.reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.reasons.map((r, i) => (
            <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
              {r}
            </span>
          ))}
        </div>
      )}

      {c.citations.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-1 text-xs font-semibold text-slate-600">依据条款</p>
          <ul className="space-y-1">
            {c.citations.map((ci, i) => (
              <li key={i} className="text-xs leading-5 text-slate-600">
                <span className="font-medium text-slate-700">{ci.source}</span> {ci.article}
                <span className="ml-1.5 text-[10px] text-slate-400">{ci.confidence} 级</span>
                {ci.note && <span className="block pl-3 text-[11px] text-slate-400">※ {ci.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {c.obligations.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
            <CalendarClock className="h-3.5 w-3.5" /> 后续义务与时限
          </p>
          <ul className="space-y-1.5">
            {c.obligations.map((ob, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                <span className="font-medium">{ob.title}</span>
                <span className="block text-slate-500">{ob.deadline}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {c.risk && (
        <div className="mt-3 flex gap-2 rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs leading-5 text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{c.risk}</span>
        </div>
      )}
    </div>
  )
}

export default function ResultView({ result, answers, onRestart }: { result: EvalResult; answers: Answers; onRestart: () => void }) {
  const unitLabel =
    result.unitType === 'chinese' ? '独立法人 / 法人授权部门' : result.unitType === 'foreign' ? '无独立法律地位' : '法律地位待判定'
  const eli = result.eligibility
  const eliLabel = eli === 'ready' ? '可申请' : eli === 'conditional' ? '补正后可申请' : '暂不具备申请条件'
  const eliColor = eli === 'ready' ? 'text-emerald-700' : eli === 'conditional' ? 'text-amber-700' : 'text-rose-700'
  const gateMet = result.gates.filter((g) => g.status === 'met').length
  const gateTotal = result.gates.filter((g) => g.status !== 'na').length

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24">
      {/* 报告头 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500">生物样本库 CNAS 认可申请资格自查报告（原型）</p>
            <h2 className={`mt-1 text-xl font-bold ${eliColor}`}>
              申请资格结论：{eliLabel}
            </h2>
            <p className="mt-1 text-xs text-slate-600">8 项申请条件 + 合规红线核对：{gateMet} / {gateTotal} 项满足</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <Badge variant="secondary">主体：{unitLabel}</Badge>
              <Badge variant="secondary">人源样本：{result.regulatedMaterial ? '涉及' : '不涉及'}</Badge>
              {result.grayAreas.length > 0 && <Badge variant="outline" className="border-amber-300 text-amber-700">待人工确认 {result.grayAreas.length} 项</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 print:hidden">
            <Button size="sm" onClick={() => void exportReportDocx(result, answers)}>
              <FileDown className="mr-1 h-4 w-4" /> 导出 Word 报告
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1 h-4 w-4" /> 打印 / PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={onRestart}>
              <RotateCcw className="mr-1 h-4 w-4" /> 重新评估
            </Button>
          </div>
        </div>
        {/* 置信度图例 */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span className="font-medium">结论置信度分级：</span>
          {(['A', 'B', 'C'] as Confidence[]).map((k) => (
            <Badge key={k} variant="outline" className={CONF_META[k].cls}>{CONF_META[k].label}</Badge>
          ))}
          <span>B / C 级结论非法规条文原文，重大决策前请核对原文或咨询主管部门。</span>
        </div>
      </div>

      {/* 灰色地带：转人工 */}
      {result.grayAreas.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <UserRound className="h-5 w-5" /> 以下问题超出规则覆盖范围，建议转人工咨询
          </h3>
          <ul className="mt-3 space-y-2">
            {result.grayAreas.map((g, i) => (
              <li key={i} className="rounded-lg bg-white/70 p-3 text-xs leading-5 text-amber-900">
                <span className="font-semibold">{g.question}</span>（您的回答：{g.answer}）
                <span className="block text-amber-700">{g.advice}</span>
              </li>
            ))}
          </ul>
          <Button size="sm" className="mt-3 bg-amber-600 text-white hover:bg-amber-700">
            预约人工合规咨询 →
          </Button>
        </div>
      )}

      {/* 8 项申请条件逐项核对表 */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <ClipboardCheck className="h-4 w-4 text-slate-500" /> 申请条件逐项核对
        </h3>
        <div className="mt-3 space-y-2">
          {result.gates.map((g) => {
            const st = g.status
            const cls =
              st === 'met' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : st === 'redline' ? 'bg-red-100 text-red-800 border-red-300'
                  : st === 'unmet' ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : st === 'partial' ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
            const label = st === 'met' ? '满足' : st === 'redline' ? '红线' : st === 'unmet' ? '未满足' : st === 'partial' ? '部分满足' : '不适用'
            return (
              <div key={g.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">{g.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[10px] ${cls}`}>{label}</Badge>
                    <Badge variant="outline" className="text-[10px] text-slate-500">{g.priority}</Badge>
                  </div>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-slate-600">{g.detail}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 结论列表 */}
      <div className="mt-4 space-y-4">
        {result.conclusions.map((c) => (
          <ConclusionCard key={c.id} c={c} />
        ))}
      </div>

      {/* 评估依据：法规版本快照 */}
      {result.regulations.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <BookMarked className="h-4 w-4 text-slate-500" /> 评估依据（法规版本快照）
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            规则库版本 v{RULESET_VERSION} · 最近复核日期 {RULESET_REVIEWED_AT}
          </p>
          <ul className="mt-3 divide-y divide-slate-100">
            {result.regulations.map((r) => (
              <li key={r.id} className="py-2 text-xs leading-5 text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.name}</span>
                  <Badge variant="outline" className={`text-[10px] ${REG_STATUS_META[r.status].cls}`}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </div>
                {r.userNote && <span className="block text-[11px] text-slate-400">※ {r.userNote}</span>}
                {r.status !== 'practice' && (
                  <details>
                    <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-600">版本详情</summary>
                    <span className="block pl-3 text-slate-500">
                      公布：{r.promulgated} · 施行：{r.effective} · 现行主管机关：{r.currentAuthority}
                    </span>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 相关术语官方定义 */}
      {(() => {
        const terms = relevantTerms(answers)
        if (terms.length === 0) return null
        return (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <BookMarked className="h-4 w-4 text-slate-500" /> 相关术语官方定义
            </h3>
            <ul className="mt-3 space-y-2">
              {terms.map((t) => (
                <li key={t.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                  <span className="font-medium text-slate-900">{t.term}</span>：{t.definition}
                  <span className="block pl-3 text-[11px] text-slate-400">—— {t.source}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      <p className="mt-6 text-center text-[11px] font-medium text-indigo-600">
        出品 · 庚寅咨询 Gengyin Consulting　|　青岛庚寅咨询服务有限公司
      </p>
      <p className="mt-2 text-center text-[11px] leading-5 text-slate-400">
        本报告由规则引擎（v{RULESET_VERSION}，复核日期 {RULESET_REVIEWED_AT}）基于 CNAS-CL10:2020《生物样本库质量和能力认可准则》
        （等同采用 GB/T 37864-2019 / ISO 20387:2018）、CNAS-RL10《生物样本库认可规则》、CNAS-RL02《能力验证规则》自动生成；
        医院人源样本另参照人类遗传资源相关法规与伦理审查办法。本工具为申请资格初步自查，不构成 CNAS 官方意见或法律意见，
        最终以 CNAS 现行规范与评审结论为准。
      </p>
    </div>
  )
}
