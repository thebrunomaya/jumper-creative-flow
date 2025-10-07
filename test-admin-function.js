import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biwwowendjuzvpttyrlb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpd3dvd2VuZGp1enZwdHR5cmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1Njg3ODIsImV4cCI6MjA1NTE0NDc4Mn0.oXq2U2laZ0IEReJg3jTDpkybtI-99CmVKHg4sOKnB1w';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 Testing j_ads_admin_dashboard edge function...');

async function testAdminFunction() {
  try {
    // First authenticate as bruno@maya.company
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'bruno@maya.company',
      password: '188c2eb6-3c00-40ce-adbf-d3545700036f'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Authenticated as:', authData.user?.email);
    // Test without action first
    const { data, error } = await supabase.functions.invoke('j_ads_admin_dashboard', {
      body: {}
    });
    
    if (error) {
      console.error('❌ Edge function error:', error);
      
      // Try to get the response body for more details
      if (error.context && error.context.body) {
        try {
          const reader = error.context.body.getReader();
          const result = await reader.read();
          const bodyText = new TextDecoder().decode(result.value);
          console.error('📝 Response body:', bodyText);
        } catch (e) {
          console.error('Could not read error body:', e);
        }
      }
      return;
    }
    
    if (!data?.success) {
      console.error('❌ Function returned error:', data);
      return;
    }
    
    console.log('✅ Function success!');
    console.log(`📊 Found ${data.items?.length || 0} items:`);
    
    if (data.items?.length > 0) {
      data.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.creative_name || 'Sem nome'} - ${item.status} (${item.client || 'No client'})`);
      });
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testAdminFunction();