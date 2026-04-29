export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      };
  
      // Handle preflight
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
  
      if (url.pathname === "/list") {
        const prefix = url.searchParams.get("prefix") ?? "";
        const objects = await env.R2.list({ prefix });
        return new Response(JSON.stringify(objects.objects
                                            .map(o => o.key)
                                            .filter(key => !key.endsWith("/"))),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }
  
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    }
}