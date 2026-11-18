import { useState } from 'react'
import Wizard from '../components/Wizard'
import ResultView from '../components/ResultView'
import { evaluate } from '../rules/evaluate'
import { visibleQuestions } from '../rules/questions'
import type { Answers } from '../rules/types'
import { Badge } from '@/components/ui/badge'
import { ClipboardCheck, Dna, FlaskConical, ShieldCheck } from 'lucide-react'

type Stage = 'intro' | 'wizard' | 'result'

export default function Home() {
  const [stage, setStage] = useState<Stage>('intro')
  const [answers, setAnswers] = useState<Answers>({})
  const [currentId, setCurrentId] = useState<string | null>(null)

  const start = () => {
    setAnswers({ _flow: 'new' })
    const first = visibleQuestions({ _flow: 'new' })[0]
    setCurrentId(first?.id ?? null)
    setStage('wizard')
  }

  const onAnswer = (id: string, value: string | string[]) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value }
      const keep = new Set(visibleQuestions(next).map((q) => q.id))
      for (const k of Object.keys(next)) {
        if (!keep.has(k) && k !== id && !k.startsWith('_')) delete next[k]
      }
      return next
    })
  }

  const restart = () => {
    setAnswers({})
    setStage('intro')
    setCurrentId(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 顶栏 */}
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-4">生物样本库 CNAS 认可申请自查工具</h1>
              <p className="text-[11px] text-slate-500">ISO 20387 / GB/T 37864 申请资格评估（医院样本库 · 原型）</p>
              <p className="text-[10px] font-medium text-indigo-600">出品 · 庚寅咨询 Gengyin Consulting</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700">CNAS-CL10:2020</Badge>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700">ISO 20387:2018</Badge>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700">GB/T 37864-2019</Badge>
          </div>
        </div>
      </header>

      {stage === 'intro' && (
        <main className="mx-auto max-w-3xl px-4 py-14">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">答 20 余道题，自查你的样本库<br />是否具备 CNAS 认可申请条件</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
              按 CNAS 官网公布的 8 项申请条件逐项核对：法律地位、自我评估、体系运行 6 个月、内审管评、能力验证、人员资源、设备溯源、技术经历；
              并针对医院人源样本加查伦理、知情同意与人类遗传资源合规红线。每项结论标注准则条款与优先级。
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <button
              onClick={start}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-400 hover:shadow-md"
            >
              <ClipboardCheck className="h-8 w-8 text-indigo-600" />
              <h3 className="mt-3 text-base font-semibold">申请资格完整自查</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                四层问卷：主体与法律地位 → 管理体系运行 → 资源与技术能力 → 人源样本合规。输出可申请 / 补正后 / 暂不具备的结论，附缺口清单、整改优先级与条款依据，可导出 Word。
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-indigo-600 group-hover:underline">开始自查 →</span>
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
              <ShieldCheck className="h-8 w-8 text-teal-600" />
              <h3 className="mt-3 text-base font-semibold">这套工具解决什么</h3>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-500">
                <li>· 申请前先判断"现在能不能报"，避免被不予受理</li>
                <li>· 8 项硬门槛逐项打勾，缺口按 P0/P1/P2 排序</li>
                <li>· 医院专项：伦理批件、知情同意、人遗许可红线核对</li>
                <li>· 常见评审不符合项（LIMS 溯源、供方、应急）提前提示</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-5 text-slate-500">
            <Dna className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p>
              规则依据：CNAS-CL10:2020《生物样本库质量和能力认可准则》（等同采用 GB/T 37864-2019 / ISO 20387:2018）、
              CNAS-RL10《生物样本库认可规则》、CNAS-RL02《能力验证规则》、CNAS-AL21《生物样本库质量和能力认可申请书》；
              医院人源样本另参照《人类遗传资源管理条例》（2024 修订）、《人类遗传资源管理条例实施细则》（2026，卫健委令第 16 号）与《涉及人的生命科学和医学研究伦理审查办法》（2023）。
              CNAS 已发布 RL10 的 2025 修订征求意见稿，本报告按现行有效版本评估。结论按"认可准则条文 / 实践惯例"分级标注；
              本工具为申请资格初步自查，不构成 CNAS 官方意见或法律意见，最终以 CNAS 现行规范与评审结论为准。
            </p>
          </div>
        </main>
      )}

      {stage === 'wizard' && (
        <main className="py-8">
          <Wizard
            answers={answers}
            currentId={currentId}
            onAnswer={onAnswer}
            onNavigate={setCurrentId}
            onFinish={() => setStage('result')}
          />
        </main>
      )}

      {stage === 'result' && (
        <main className="py-8">
          <ResultView result={evaluate(answers)} answers={answers} onRestart={restart} />
        </main>
      )}

      {/* 全局页脚 */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center print:hidden">
        <p className="text-xs font-semibold text-slate-700">庚寅咨询 · Gengyin Consulting</p>
        <p className="mt-0.5 text-[11px] text-slate-400">青岛庚寅咨询服务有限公司　|　CNAS 认可 · ISO 17025/15189/20387 · 人类遗传资源合规咨询</p>
      </footer>
    </div>
  )
}
