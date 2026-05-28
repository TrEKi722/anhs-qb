export async function onRequestPost(context) {
    try {
      const { request, env } = context;
  
      const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
      if (!token) {
        return Response.json({ error: 'Unauthorized.' }, { status: 401 });
      }
  
      const supabaseUrl = env.SUPABASE_URL ?? "https://pdvxvgcigowwnfqpjjni.supabase.co";
      const supabaseKey = env.SUPABASE_ANON_KEY ?? "sb_publishable_CjflF9tunFsNyONxBlHazw_6E2metQ-";
      const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseKey,
        },
      });

      if (!authRes.ok) {
        return Response.json({ error: 'Unauthorized.' }, { status: 401 });
      }

      const user = await authRes.json();
      const userId = user.id;

      const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=is_admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseKey,
        },
      });
      const profiles = await profileRes.json();
      const isAdmin = profiles?.[0]?.is_admin;

      if (!isAdmin) {
        return Response.json({ error: 'Forbidden.' }, { status: 403 });
      }

      let formData;
      try {
        formData = await request.formData();
      } catch {
        return Response.json({ error: 'Invalid form data.' }, { status: 400 });
      }
  
      const name = formData.get('name');
      if (!name) {
        return Response.json({ error: 'Missing name.' }, { status: 400 });
      }
  
      const key = `qb/${name}/`;
      await env.R2.put(key, new Uint8Array(0));

      return Response.json({ success: true, key }, { status: 200 });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }
  