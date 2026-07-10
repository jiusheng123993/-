import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

let dbClient: SupabaseClient | null = null

export function getDbClient(): SupabaseClient {
  if (dbClient) return dbClient

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required for server-side database access'
    )
  }

  dbClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return dbClient
}

export function resetDbClient(): void {
  dbClient = null
}

export async function runMigration(): Promise<{ success: boolean; error?: string }> {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf-8')

    const client = getDbClient()

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      const { error } = await client.rpc('exec_sql', { sql: statement + ';' } as never)
      if (error) {
        console.warn(`[Migration] Statement warning: ${error.message}`)
      }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Migration] Failed:', message)
    return { success: false, error: message }
  }
}

export async function checkMigrationStatus(): Promise<{
  migrated: boolean
  tables: string[]
  error?: string
}> {
  try {
    const client = getDbClient()

    const { error } = await client
      .from('users')
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        return { migrated: false, tables: [] }
      }
      return { migrated: false, tables: [], error: error.message }
    }

    const { data: tables, error: tableError } = await client.rpc(
      'get_tables' as never,
      {} as never
    )

    if (tableError) {
      return { migrated: true, tables: ['users'] }
    }

    return {
      migrated: true,
      tables: (tables as { table_name: string }[])?.map((t) => t.table_name) || []
    }
  } catch (err) {
    return {
      migrated: false,
      tables: [],
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
