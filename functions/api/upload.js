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

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: 'Invalid form data.' }, { status: 400 });
    }

    const file = formData.get('file');
    const folder = formData.get('folder');
    if (!file || !folder) {
      return Response.json({ error: 'Missing file or folder.' }, { status: 400 });
    }

    const quote = formData.get('quote') || '';
    const attribution = formData.get('attribution') || '';

    const key = `qb/${folder}/${file.name}`;
    await env.R2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    await fetch(`${supabaseUrl}/rest/v1/photo_data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ "filename": file.name, "created_at": new Date().toISOString(), "attribution": attribution, "quote": quote, "poster_id": userId, "folder": folder }),
    });

    return Response.json({ success: true, key }, { status: 200 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
