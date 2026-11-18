import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { Answers, Conclusion, ConclusionType, Confidence } from '../rules/types'
import type { EvalResult } from '../rules/evaluate'
import { questions } from '../rules/questions'
import { RULESET_REVIEWED_AT, RULESET_VERSION, STATUS_LABEL } from '../rules/regulations'
import { relevantTerms } from '../rules/glossary'

const TYPE_LABEL: Record<ConclusionType, string> = {
  prohibited: '暂不具备 / 红线',
  'security-review': '重点提示',
  approval: '硬性门槛未满足',
  filing: '待补正',
  report: '整改建议',
  exempt: '已满足',
  notice: '自查提示',
}

const CONF_LABEL: Record<Confidence, string> = {
  A: 'A · 认可准则条文',
  B: 'B · 官方解答口径',
  C: 'C · 实践惯例',
}

/* ── 版式规范：全文统一字号 / 字体 / 颜色 ──
 * 字号（docx 半磅值）：报告题 36=18pt，一级标题 32=16pt，二级标题 28=14pt，
 * 正文 21=10.5pt（五号），辅助 18=9pt
 * 字体：标题黑体，正文宋体，西文 Times New Roman
 * 颜色：正文近黑 INK，辅助灰 GRAY，标题深蓝 ACCENT，风险提示深红 RISK（全文唯一警示色） */
const FONT = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: 'SimSun' }
const FONT_HEAD = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: 'SimHei' }
const SZ = { title: 36, h1: 32, h2: 28, body: 21, aux: 18 }
const COLOR = { ink: '1F2937', gray: '595959', accent: '1E3A5F', risk: '991B1B' }

const t = (text: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean; head?: boolean } = {}) =>
  new TextRun({
    text,
    font: opts.head ? FONT_HEAD : FONT,
    size: opts.size ?? SZ.body,
    bold: opts.bold,
    color: opts.color ?? COLOR.ink,
    italics: opts.italics,
  })

const p = (text: string, opts: Parameters<typeof t>[1] & { spacing?: number; spacingBefore?: number } = {}) =>
  new Paragraph({
    children: [t(text, opts)],
    spacing: { after: opts.spacing ?? 120, before: opts.spacingBefore },
  })

const h1 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 160 },
    children: [t(text, { bold: true, size: SZ.h1, color: COLOR.accent, head: true })],
  })

const BORDER = { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' }
const TABLE_BORDERS = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
  insideHorizontal: BORDER,
  insideVertical: BORDER,
}

function tcell(text: string, opts: { width: number; bold?: boolean; fill?: boolean }): TableCell {
  return new TableCell({
    width: { size: opts.width, type: WidthType.PERCENTAGE },
    shading: opts.fill ? { type: ShadingType.SOLID, fill: 'F1F5F9' } : undefined,
    children: [new Paragraph({ children: [t(text, { size: SZ.aux, bold: opts.bold })] })],
  })
}

function answerSummaryRows(answers: Answers): TableRow[] {
  const rows: TableRow[] = []
  const flow = answers._flow === 'existing' ? '已获批项目变更评估' : '新项目申报评估'
  rows.push(new TableRow({ children: [tcell('评估类型', { width: 35, bold: true, fill: true }), tcell(flow, { width: 65 })] }))
  for (const q of questions) {
    const v = answers[q.id]
    if (v === undefined) continue
    const labels = (Array.isArray(v) ? v : [v])
      .map((x) => q.options.find((o) => o.value === x)?.label ?? x)
      .join('；')
    rows.push(new TableRow({ children: [tcell(q.text, { width: 35, bold: true, fill: true }), tcell(labels, { width: 65 })] }))
  }
  return rows
}

function conclusionBlocks(c: Conclusion, idx: number): Paragraph[] {
  const out: Paragraph[] = []
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 120 },
      children: [t(`${idx + 1}. 【${TYPE_LABEL[c.type]}】${c.title}`, { bold: true, size: SZ.h2, head: true })],
    }),
  )
  out.push(p(`结论说明：${c.summary}`, { spacing: 160 }))
  if (c.reasons.length > 0) out.push(p(`判定路径：${c.reasons.join('；')}`, { color: COLOR.gray, size: SZ.aux }))
  if (c.citations.length > 0) {
    out.push(p('依据条款：', { bold: true, size: SZ.aux, spacing: 60 }))
    for (const ci of c.citations) {
      out.push(p(`· ${ci.source} ${ci.article}（${CONF_LABEL[ci.confidence]}）`, { size: SZ.aux, spacing: 40 }))
      if (ci.note) out.push(p(`  ※ ${ci.note}`, { size: SZ.aux, color: COLOR.gray, spacing: 60 }))
    }
  }
  if (c.obligations.length > 0) {
    out.push(p('后续义务与时限：', { bold: true, size: SZ.aux, spacing: 60 }))
    for (const ob of c.obligations) {
      out.push(p(`· ${ob.title}：${ob.deadline}`, { size: SZ.aux, spacing: 40 }))
    }
  }
  if (c.risk) out.push(p(`风险提示：${c.risk}`, { color: COLOR.risk, size: SZ.aux }))
  return out
}

export async function exportReportDocx(result: EvalResult, answers: Answers): Promise<void> {
  const unitLabel =
    result.unitType === 'chinese' ? '独立法人 / 法人授权部门' : result.unitType === 'foreign' ? '无独立法律地位' : '法律地位待判定'
  const eliLabel = result.eligibility === 'ready' ? '可申请' : result.eligibility === 'conditional' ? '补正后可申请' : '暂不具备申请条件'

  const children: (Paragraph | Table)[] = []

  // 封面信息块
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 200 },
      children: [t('生物样本库 CNAS 认可申请资格自查报告', { bold: true, size: SZ.title, color: COLOR.accent, head: true })],
    }),
  )
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [
        t(`ISO 20387 / GB/T 37864 · 申请资格自查 · 生成时间：${new Date().toLocaleString('zh-CN')} · 规则库 v${RULESET_VERSION}`, {
          size: SZ.aux,
          color: COLOR.gray,
        }),
      ],
    }),
  )

  // 一、评估结论总览
  children.push(h1('一、评估结论总览'))
  children.push(p(`主体法律地位：${unitLabel}`))
  children.push(p(`样本类型：${result.regulatedMaterial ? '涉及人源样本' : '仅非人源样本'}`))
  const gateMet = result.gates.filter((g) => g.status === 'met').length
  const gateTotal = result.gates.filter((g) => g.status !== 'na').length
  children.push(p(`申请资格结论：${eliLabel}（${gateMet} / ${gateTotal} 项条件满足）`, { bold: true, spacing: 200 }))

  // 门槛核对表
  const gateStatusLabel: Record<string, string> = {
    met: '满足', redline: '红线', unmet: '未满足', partial: '部分满足', na: '不适用',
  }
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: [
        new TableRow({
          children: [
            tcell('核对项', { width: 34, bold: true, fill: true }),
            tcell('状态', { width: 14, bold: true, fill: true }),
            tcell('优先级', { width: 12, bold: true, fill: true }),
            tcell('说明', { width: 40, bold: true, fill: true }),
          ],
        }),
        ...result.gates.map(
          (g) =>
            new TableRow({
              children: [
                tcell(g.name, { width: 34 }),
                tcell(gateStatusLabel[g.status] ?? g.status, { width: 14 }),
                tcell(g.priority, { width: 12 }),
                tcell(g.detail, { width: 40 }),
              ],
            }),
        ),
      ],
    }),
  )
  children.push(p('', { spacing: 120 }))

  // 二、逐项结论
  children.push(h1('二、逐项结论与依据'))
  result.conclusions.forEach((c, i) => children.push(...conclusionBlocks(c, i)))

  // 三、灰色地带
  if (result.grayAreas.length > 0) {
    children.push(h1('三、需人工进一步确认的事项'))
    for (const g of result.grayAreas) {
      children.push(p(`· ${g.question}（回答：${g.answer}）——${g.advice}`, { size: SZ.body, color: COLOR.gray, spacing: 100 }))
    }
  }

  // 四、回答摘要
  children.push(h1('四、评估回答摘要'))
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: answerSummaryRows(answers),
    }),
  )

  // 五、评估依据（法规版本快照）
  if (result.regulations.length > 0) {
    children.push(h1('五、评估依据（法规版本快照）'))
    children.push(
      p(`规则库版本：v${RULESET_VERSION} · 最近复核日期：${RULESET_REVIEWED_AT}`, { size: SZ.aux, color: COLOR.gray, spacing: 100 }),
    )
    for (const r of result.regulations) {
      const metaLine =
        r.status === 'practice'
          ? ''
          : `（公布：${r.promulgated}；施行：${r.effective}；现行主管机关：${r.currentAuthority}）`
      children.push(p(`· ${r.name}${metaLine}【${STATUS_LABEL[r.status]}】`, { size: SZ.aux, spacing: 40 }))
      if (r.userNote) children.push(p(`  ※ ${r.userNote}`, { size: SZ.aux, color: COLOR.gray, spacing: 80 }))
    }
  }

  // 六、相关术语官方定义
  const terms = relevantTerms(answers)
  if (terms.length > 0) {
    children.push(h1('六、相关术语官方定义'))
    for (const term of terms) {
      children.push(p(`· ${term.term}：${term.definition}`, { size: SZ.aux, spacing: 40 }))
      children.push(p(`  —— ${term.source}`, { size: SZ.aux, color: COLOR.gray, spacing: 80 }))
    }
  }

  // 声明
  children.push(
    new Paragraph({
      spacing: { before: 360 },
      children: [
        t(
          `声明：本报告由规则引擎（v${RULESET_VERSION}，复核日期 ${RULESET_REVIEWED_AT}）基于上文所列 CNAS 认可规范自动生成；结论置信度分三级：A 为认可准则条文，B 为官方解答口径，C 为实践惯例；B / C 级结论请以规范原文或 CNAS 意见为准。CNAS 已发布 RL10 的 2025 修订征求意见稿，本报告按现行有效版本评估，正式版发布后请以官网最新文本为准。本工具为申请资格初步自查，不构成 CNAS 官方意见或法律意见，最终以 CNAS 现行规范与评审结论为准。`,
          { size: SZ.aux, color: COLOR.gray, italics: true },
        ),
      ],
    }),
  )

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ.body, color: COLOR.ink } } } },
    sections: [
      {
        children,
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [t('生物样本库 CNAS 认可申请自查报告', { size: SZ.aux, color: COLOR.gray })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    children: ['出品：庚寅咨询 · Gengyin Consulting　|　青岛庚寅咨询服务有限公司'],
                    font: FONT,
                    size: SZ.aux,
                    color: COLOR.accent,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ['第 ', PageNumber.CURRENT, ' 页 / 共 ', PageNumber.TOTAL_PAGES, ' 页'],
                    font: FONT,
                    size: SZ.aux,
                    color: COLOR.gray,
                  }),
                ],
              }),
            ],
          }),
        },
      },
    ],
  })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `生物样本库CNAS认可自查报告_${new Date().toISOString().slice(0, 10)}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
