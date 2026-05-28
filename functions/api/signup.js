export async function onRequestPost(context) {
  const { request, env } = context;

  let admin = false;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, disname, password, accessCode } = body;
  if (!email || !disname || !password || !accessCode) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (accessCode !== env.ACCESS_CODE && accessCode !== env.ADMIN_ACCESS_CODE) {
    return Response.json({ error: "Invalid access code." }, { status: 403 });
  }

  if (accessCode == env.ADMIN_ACCESS_CODE) {
    admin = true;
  }

  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const supaRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
      "apikey": serviceKey,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  const supaData = await supaRes.json();

  if (!supaRes.ok) {
    const msg = supaData?.msg || supaData?.message || "Sign up failed. Please try again.";
    return Response.json({ error: msg }, { status: supaRes.status });
  }

  const userId = supaData.id;

  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ id: userId, display_name: disname, is_admin: admin }),
  });

  if (!profileRes.ok) {
    const profileData = await profileRes.json().catch(() => ({}));
    const msg = profileData?.message || "Account created but profile setup failed.";
    return Response.json({ error: msg }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 200 });
}
