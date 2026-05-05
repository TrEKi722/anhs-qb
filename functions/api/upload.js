export async function onRequestPost(context) {
  const { request, env } = context;

  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!token) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const authRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': env.SUPABASE_ANON_KEY,
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

  const key = `qb/${folder}/${file.name}`;
  try {
    await env.R2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ success: true, key }, { status: 200 });
}
