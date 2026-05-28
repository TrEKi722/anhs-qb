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

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: 'Invalid form data.' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file) {
      return Response.json({ error: 'Missing file.' }, { status: 400 });
    }

    const storagePath = `${userId}`;
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${storagePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey,
        'Content-Type': file.type,
        'x-upsert': 'true',
      },
      body: await file.arrayBuffer(),
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      return Response.json({ error: err.message ?? 'Storage upload failed.' }, { status: 500 });
    }

    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${storagePath}`;

    const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      return Response.json({ error: err.message ?? 'Profile update failed.' }, { status: 500 });
    }

    return Response.json({ success: true, avatar_url: avatarUrl }, { status: 200 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
