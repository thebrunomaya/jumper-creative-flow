// ============================================
// EDGE FUNCTION: j_hub_admin_users
// Admin panel for user management
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'list' | 'getDetails' | 'changeRole' | 'toggleStatus' | 'resetPassword' | 'forceLogout';
  userId?: string;
  newRole?: string;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Create admin client (service role for bypassing RLS)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await admin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Check if user is admin
    const { data: adminUser, error: roleError } = await admin
      .from('j_hub_users')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (roleError || !adminUser || adminUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied: admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Parse request body
    const body: RequestBody = await req.json()
    const { action } = body

    // Route to appropriate handler
    switch (action) {
      case 'list':
        return await handleList(admin, corsHeaders)

      case 'getDetails':
        if (!body.userId) {
          return new Response(JSON.stringify({ error: 'userId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }
        return await handleGetDetails(admin, body.userId, corsHeaders)

      case 'changeRole':
        if (!body.userId || !body.newRole) {
          return new Response(JSON.stringify({ error: 'userId and newRole required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }
        return await handleChangeRole(admin, body.userId, body.newRole, user.id, adminUser.email, body.reason, corsHeaders)

      case 'toggleStatus':
        if (!body.userId) {
          return new Response(JSON.stringify({ error: 'userId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }
        return await handleToggleStatus(admin, body.userId, user.id, adminUser.email, body.reason, corsHeaders)

      case 'resetPassword':
        if (!body.userId) {
          return new Response(JSON.stringify({ error: 'userId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }
        return await handleResetPassword(admin, body.userId, user.id, adminUser.email, corsHeaders)

      case 'forceLogout':
        if (!body.userId) {
          return new Response(JSON.stringify({ error: 'userId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }
        return await handleForceLogout(admin, body.userId, user.id, adminUser.email, corsHeaders)

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
    }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})

// ============================================
// HANDLERS
// ============================================

async function handleList(admin: any, corsHeaders: any) {
  // Get all users with activity stats
  const { data: users, error } = await admin
    .from('j_hub_users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // For each user, get account count and creative count
  const enrichedUsers = await Promise.all(
    users.map(async (user: any) => {
      // Count accessible accounts (from Notion sync)
      const { count: accountCount } = await admin
        .from('j_hub_notion_db_accounts')
        .select('*', { count: 'exact', head: true })
        .or(`"Gestor".ilike.%${user.email}%,"Supervisor".ilike.%${user.email}%,"Gerente".ilike.%${user.email}%`)

      // Count submitted creatives
      const { count: creativeCount } = await admin
        .from('j_ads_creative_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', user.id)

      return {
        ...user,
        accountCount: accountCount || 0,
        creativeCount: creativeCount || 0,
      }
    })
  )

  return new Response(JSON.stringify({ success: true, users: enrichedUsers }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleGetDetails(admin: any, userId: string, corsHeaders: any) {
  // Get user details
  const { data: user, error: userError } = await admin
    .from('j_hub_users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Get accessible accounts
  const { data: accounts } = await admin
    .from('j_hub_notion_db_accounts')
    .select('"Nome", "Gestor", "Supervisor", "Gerente"')
    .or(`"Gestor".ilike.%${user.email}%,"Supervisor".ilike.%${user.email}%,"Gerente".ilike.%${user.email}%`)

  // Determine role for each account
  const accountsWithRoles = accounts?.map((acc: any) => {
    let accountRole = 'Unknown'
    if (acc.Gestor?.toLowerCase().includes(user.email.toLowerCase())) {
      accountRole = 'Gestor'
    } else if (acc.Supervisor?.toLowerCase().includes(user.email.toLowerCase())) {
      accountRole = 'Supervisor'
    } else if (acc.Gerente?.toLowerCase().includes(user.email.toLowerCase())) {
      accountRole = 'Gerente'
    }
    return {
      name: acc.Nome,
      role: accountRole,
    }
  }) || []

  // Get creative submissions count
  const { count: creativeCount } = await admin
    .from('j_ads_creative_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('manager_id', userId)

  // Get audit history
  const { data: auditHistory } = await admin
    .from('j_hub_user_audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  return new Response(JSON.stringify({
    success: true,
    user: {
      ...user,
      accounts: accountsWithRoles,
      creativeCount: creativeCount || 0,
      auditHistory: auditHistory || [],
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleChangeRole(
  admin: any,
  userId: string,
  newRole: string,
  adminId: string,
  adminEmail: string,
  reason: string | undefined,
  corsHeaders: any
) {
  // Validate role
  const validRoles = ['admin', 'manager', 'supervisor', 'gerente', 'user']
  if (!validRoles.includes(newRole)) {
    return new Response(JSON.stringify({ error: 'Invalid role' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Get current user data
  const { data: currentUser, error: fetchError } = await admin
    .from('j_hub_users')
    .select('role, email')
    .eq('id', userId)
    .single()

  if (fetchError || !currentUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Prevent removing last admin
  if (currentUser.role === 'admin' && newRole !== 'admin') {
    const { count: adminCount } = await admin
      .from('j_hub_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if (adminCount === 1) {
      return new Response(JSON.stringify({ error: 'Cannot change role of last admin' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  }

  // Update role
  const { error: updateError } = await admin
    .from('j_hub_users')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Log the action
  await admin.rpc('log_user_action', {
    p_user_id: userId,
    p_user_email: currentUser.email,
    p_admin_id: adminId,
    p_admin_email: adminEmail,
    p_action: 'role_changed',
    p_old_value: { role: currentUser.role },
    p_new_value: { role: newRole },
    p_reason: reason || null,
  })

  return new Response(JSON.stringify({ success: true, message: 'Role updated successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleToggleStatus(
  admin: any,
  userId: string,
  adminId: string,
  adminEmail: string,
  reason: string | undefined,
  corsHeaders: any
) {
  // Get current user status
  const { data: currentUser, error: fetchError } = await admin
    .from('j_hub_users')
    .select('is_active, email')
    .eq('id', userId)
    .single()

  if (fetchError || !currentUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const newStatus = !currentUser.is_active
  const action = newStatus ? 'reactivated' : 'deactivated'

  // Update status
  const updateData: any = {
    is_active: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (!newStatus) {
    updateData.deactivated_at = new Date().toISOString()
    updateData.deactivated_by = adminId
  } else {
    updateData.deactivated_at = null
    updateData.deactivated_by = null
  }

  const { error: updateError } = await admin
    .from('j_hub_users')
    .update(updateData)
    .eq('id', userId)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Log the action
  await admin.rpc('log_user_action', {
    p_user_id: userId,
    p_user_email: currentUser.email,
    p_admin_id: adminId,
    p_admin_email: adminEmail,
    p_action: action,
    p_old_value: { is_active: currentUser.is_active },
    p_new_value: { is_active: newStatus },
    p_reason: reason || null,
  })

  return new Response(JSON.stringify({ success: true, message: `User ${action} successfully` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleResetPassword(
  admin: any,
  userId: string,
  adminId: string,
  adminEmail: string,
  corsHeaders: any
) {
  // Get user email
  const { data: user, error: fetchError } = await admin
    .from('j_hub_users')
    .select('email')
    .eq('id', userId)
    .single()

  if (fetchError || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Send password reset email
  const { error: resetError } = await admin.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${Deno.env.get('SITE_URL') || 'https://hub.jumper.studio'}/reset-password`,
  })

  if (resetError) {
    return new Response(JSON.stringify({ error: resetError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Log the action
  await admin.rpc('log_user_action', {
    p_user_id: userId,
    p_user_email: user.email,
    p_admin_id: adminId,
    p_admin_email: adminEmail,
    p_action: 'password_reset',
    p_old_value: null,
    p_new_value: null,
    p_reason: 'Password reset requested by admin',
  })

  return new Response(JSON.stringify({ success: true, message: 'Password reset email sent' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleForceLogout(
  admin: any,
  userId: string,
  adminId: string,
  adminEmail: string,
  corsHeaders: any
) {
  // Get user email
  const { data: user, error: fetchError } = await admin
    .from('j_hub_users')
    .select('email')
    .eq('id', userId)
    .single()

  if (fetchError || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Sign out all sessions for this user
  const { error: signOutError } = await admin.auth.admin.signOut(userId)

  if (signOutError) {
    return new Response(JSON.stringify({ error: signOutError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Log the action
  await admin.rpc('log_user_action', {
    p_user_id: userId,
    p_user_email: user.email,
    p_admin_id: adminId,
    p_admin_email: adminEmail,
    p_action: 'forced_logout',
    p_old_value: null,
    p_new_value: null,
    p_reason: 'Forced logout by admin',
  })

  return new Response(JSON.stringify({ success: true, message: 'User logged out successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
