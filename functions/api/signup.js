export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, password, accessCode } = body;
  if (!email || !password || !accessCode) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (accessCode !== env.ACCESS_CODE) {
    return Response.json({ error: "Invalid access code." }, { status: 403 });
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
    body: JSON.stringify({ email, password, email_confirm: false }),
  });

  const supaData = await supaRes.json();

  if (!supaRes.ok) {
    const msg = supaData?.msg || supaData?.message || "Sign up failed. Please try again.";
    return Response.json({ error: msg }, { status: supaRes.status });
  }

  return Response.json({ success: true }, { status: 200 });
}
