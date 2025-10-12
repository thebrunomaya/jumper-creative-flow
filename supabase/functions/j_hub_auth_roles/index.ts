// Ensure a default user role after login/signup
// Assigns 'manager' role to the authenticated user if they don't have any role yet

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Client with the user's JWT to read auth context
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })

    const { data: userData, error: userError } = await authClient.auth.getUser()
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const user = userData.user

    // Service-role client to bypass RLS when managing roles
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if user already has any role
    const { data: roles, error: rolesError } = await admin
      .from('j_hub_users')
      .select('role, nome')
      .eq('id', user.id)
      .limit(1)

    if (rolesError) {
      console.error('ensure-role: rolesError', rolesError)
      return new Response(JSON.stringify({ error: 'Failed to check roles' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (roles && roles.length > 0) {
      // User exists, but check if nome is empty
      const currentUser = roles[0]
      if (!currentUser.nome || currentUser.nome.trim() === '') {
        console.log('⚠️ User exists but nome is empty - updating...')
        const nome = user.user_metadata?.full_name
          || user.user_metadata?.name
          || user.email?.split('@')[0]
          || 'Usuário'

        const { error: updateError } = await admin
          .from('j_hub_users')
          .update({ nome })
          .eq('id', user.id)

        if (updateError) {
          console.error('ensure-role: updateError', updateError)
        } else {
          console.log('✅ Nome updated successfully:', nome)
        }
      }

      return new Response(JSON.stringify({ ok: true, message: 'Role already set' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // AUTOMATIC ROLE DETECTION based on login method and Notion data
    const isNotionOAuth = user.app_metadata?.provider === 'notion'
    const targetEmail = (user.email || '').toLowerCase()
    let roleToAssign: 'admin' | 'manager' | 'supervisor' | 'gerente' = 'gerente'

    console.log('🔐 Detecting role for:', targetEmail, '| OAuth:', isNotionOAuth)

    if (isNotionOAuth) {
      // NOTION OAUTH: Detect role from Gestor/Supervisor fields
      console.log('🎯 Notion OAuth login - checking Gestor/Supervisor fields')

      // Check if user is Gestor in any account
      const { data: gestorAccounts } = await admin
        .from('j_ads_notion_db_accounts')
        .select('notion_id')
        .ilike('"Gestor"', `%${targetEmail}%`)
        .limit(1)

      if (gestorAccounts && gestorAccounts.length > 0) {
        roleToAssign = 'manager'
        console.log('✅ Found user as Gestor → role: manager')
      } else {
        // Check if user is Supervisor in any account
        const { data: supervisorAccounts } = await admin
          .from('j_ads_notion_db_accounts')
          .select('notion_id')
          .ilike('"Supervisor"', `%${targetEmail}%`)
          .limit(1)

        if (supervisorAccounts && supervisorAccounts.length > 0) {
          roleToAssign = 'supervisor'
          console.log('✅ Found user as Supervisor → role: supervisor')
        } else {
          console.log('ℹ️ User not found as Gestor/Supervisor → role: gerente (default)')
        }
      }
    } else {
      // EMAIL/PASSWORD: Check DB_Gerentes for role
      console.log('📧 Email/Password login - checking DB_Gerentes')

      const { data: managerData } = await admin
        .from('j_ads_notion_db_managers')
        .select('"Função"')
        .ilike('"E-Mail"', targetEmail)
        .maybeSingle()

      if (managerData && managerData["Função"]) {
        const funcao = managerData["Função"].toLowerCase()
        console.log('📋 Found Função:', funcao)

        if (funcao.includes('admin')) {
          roleToAssign = 'admin'
        } else if (funcao.includes('gestor') || funcao.includes('manager')) {
          roleToAssign = 'manager'
        } else if (funcao.includes('supervisor')) {
          roleToAssign = 'supervisor'
        } else {
          roleToAssign = 'gerente'
        }
        console.log(`✅ Role from DB_Gerentes → role: ${roleToAssign}`)
      } else {
        console.log('ℹ️ User not in DB_Gerentes → role: gerente (default)')
      }
    }

    // Extract nome from user metadata
    const nome = user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || 'Usuário'

    console.log('📝 Assigning role with nome:', nome)

    // Assign detected role
    const { error: insertError } = await admin
      .from('j_hub_users')
      .insert({ id: user.id, email: user.email, role: roleToAssign, nome })

    if (insertError) {
      console.error('ensure-role: insertError', insertError)
      // Ignore unique violations if concurrent
      return new Response(JSON.stringify({ ok: true, message: 'Role ensured (or already existed)' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ ok: true, message: `Role assigned: ${roleToAssign}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (e) {
    console.error('ensure-role: unexpected error', e)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
