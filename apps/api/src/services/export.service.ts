import ExcelJS from 'exceljs'
import { supabaseAdmin } from '../lib/supabase'

type ExportSheet =
  | 'trades'
  | 'performance'

interface ExportOptions {
  userId: string
  accountId?: string
  from?: string
  to?: string
  sheets: ExportSheet[]
}

export class ExportService {
  static async generateExcel(options: ExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Tradge'
    workbook.created = new Date()

    const trades = await this.fetchTrades(options)

    if (options.sheets.includes('trades')) {
      await this.addTradesSheet(workbook, trades)
    }

    if (options.sheets.includes('performance')) {
      await this.addPerformanceSheet(workbook, trades)
    }

    return (await workbook.xlsx.writeBuffer()) as Buffer
  }

  private static async fetchTrades(options: ExportOptions) {
    let query = supabaseAdmin
      .from('trades')
      .select('*, trade_tags(*)')
      .eq('user_id', options.userId)
      .eq('is_draft', false)
      .order('entry_time', { ascending: true })

    if (options.accountId) query = query.eq('account_id', options.accountId)
    if (options.from) query = query.gte('entry_time', options.from)
    if (options.to) query = query.lte('entry_time', options.to)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  private static async addTradesSheet(workbook: ExcelJS.Workbook, trades: any[]) {
    const sheet = workbook.addWorksheet('Trade Log')

    sheet.columns = [
      { header: 'Date', key: 'entry_time', width: 20 },
      { header: 'Instrument', key: 'instrument', width: 12 },
      { header: 'Asset Class', key: 'asset_class', width: 14 },
      { header: 'Direction', key: 'direction', width: 10 },
      { header: 'Entry Price', key: 'entry_price', width: 14 },
      { header: 'Exit Price', key: 'exit_price', width: 14 },
      { header: 'Position Size', key: 'position_size', width: 14 },
      { header: 'Gross P&L', key: 'gross_pnl', width: 12 },
      { header: 'Fees', key: 'fees', width: 10 },
      { header: 'Net P&L', key: 'net_pnl', width: 12 },
      { header: 'R:R Ratio', key: 'rr_ratio', width: 10 },
      { header: 'Outcome', key: 'outcome', width: 10 },
    ]

    trades.forEach((trade) => {
      sheet.addRow({
        ...trade,
        entry_time: new Date(trade.entry_time).toLocaleString(),
      })
    })
  }

  private static async addPerformanceSheet(
    workbook: ExcelJS.Workbook,
    trades: any[]
  ) {
    const sheet = workbook.addWorksheet('Performance Summary')
    const closed = trades.filter((t) => !t.is_open && t.net_pnl !== null)
    const wins = closed.filter((t) => t.outcome === 'WIN')
    const losses = closed.filter((t) => t.outcome === 'LOSS')

    const totalTrades = closed.length
    const winRate =
      totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0
    const totalNetPnl = closed.reduce(
      (sum, t) => sum + (t.net_pnl ?? 0),
      0
    )

    sheet.addRow(['OVERALL PERFORMANCE'])
    sheet.addRow(['Total Trades', totalTrades])
    sheet.addRow(['Wins', wins.length])
    sheet.addRow(['Losses', losses.length])
    sheet.addRow(['Win Rate', `${winRate.toFixed(1)}%`])
    sheet.addRow(['Total Net P&L', totalNetPnl.toFixed(2)])
  }
}

