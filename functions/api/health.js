export function onRequestGet(context) {
  return Response.json({
    ok: true,
    openai: Boolean(context.env.OPENAI_API_KEY),
    gemini: Boolean(context.env.GEMINI_API_KEY)
  }, { headers: { "Cache-Control": "no-store" } });
}
