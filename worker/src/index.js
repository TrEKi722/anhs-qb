export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      if (url.pathname === "/list") {
        const prefix = url.searchParams.get("prefix") ?? "";
        const objects = await env.R2.list({ prefix });
        return new Response(JSON.stringify(objects.objects.map(o => o.key)), {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        });
      }
  
      return new Response("Not Found", { status: 404 });
    }
  }