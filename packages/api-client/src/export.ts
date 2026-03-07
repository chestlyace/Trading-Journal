import { api } from './client'

export type ExportSheet =
  | 'trades'
  | 'performance'
  | 'monthly'
  | 'strategy'
  | 'emotional'
  | 'insights'

export interface ExportOptions {
  accountId?: string
  from?: string
  to?: string
  sheets: ExportSheet[]
}

export const exportApi = {
  async downloadExcel(options: ExportOptions): Promise<Blob> {
    const { data } = await api.get<Blob>('/export/excel', {
      params: options,
      responseType: 'blob',
    })
    return data
  },
}

