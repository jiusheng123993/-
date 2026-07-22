import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AuthResult {
  userId: string
  supabase: ReturnType<typeof createClient>
}

export async function verifyAuth(request: Request): Promise<AuthResult | Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ success: false, error: '未提供认证信息' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return new Response(
      JSON.stringify({ success: false, error: '认证无效或已过期' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return { userId: user.id, supabase }
}
