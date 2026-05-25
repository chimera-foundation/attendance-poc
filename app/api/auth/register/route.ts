import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name
      }
    });


    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 });
    }

    const userId = authData.user.id;
    const generatedEmployeeId = `${Math.floor(100 + Math.random() * 900)}`;

    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: name,
        employee_id: generatedEmployeeId,
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&auto=format&fit=crop'
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      await adminSupabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.warn('Auto-login after registration failed:', signInError);
    }

    return NextResponse.json({
      user: {
        id: profileData.employee_id,
        db_id: profileData.id,
        name: profileData.full_name,
        email: email,
        avatar: profileData.avatar_url
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
