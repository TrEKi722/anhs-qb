export async function onRequestPost(context) {
    const { request, env } = context;

    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) {
        return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY ?? "sb_publishable_CjflF9tunFsNyONxBlHazw_6E2metQ-";
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseKey,
        },
    });
    if (!authRes.ok) {
        return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const caller = await authRes.json();

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    const uuid = body.uuid;
    if (!uuid) {
        return Response.json({ error: "Missing required field." }, { status: 400 });
    }

    // Only allow deleting your own account, unless caller is an admin
    if (caller.id !== uuid) {
        const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${caller.id}&select=is_admin`, {
            headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseKey },
        });
        const profiles = await profileRes.json().catch(() => []);
        if (!profiles?.[0]?.is_admin) {
            return Response.json({ error: 'Forbidden.' }, { status: 403 });
        }
    }

    const supaRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${uuid}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
        },
    });

    if (!supaRes.ok) {
        const supaData = await supaRes.json().catch(() => ({}));
        const msg = supaData?.msg || supaData?.message || "Deletion failed. Please try again.";
        return Response.json({ error: msg }, { status: supaRes.status });
    }

    const profileDeleteRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${uuid}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
        },
    });

    if (!profileDeleteRes.ok) {
        const profileData = await profileDeleteRes.json().catch(() => ({}));
        const msg = profileData?.message || "Account deleted but profile cleanup failed.";
        return Response.json({ error: msg }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
}
