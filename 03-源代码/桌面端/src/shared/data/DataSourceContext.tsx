import { createContext, useContext } from 'react'

export type DataSource = 'local' | 'supabase'

export interface DataSourceContextValue {
  dataSource: DataSource
  setDataSource: (source: DataSource) => void
}

export const DataSourceContext = createContext<DataSourceContextValue>({
  dataSource: 'local',
  setDataSource: () => {}
})

export function useDataSource(): DataSourceContextValue {
  return useContext(DataSourceContext)
}
