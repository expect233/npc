const NPCS = {
  tavern_keeper: {
    name: "酒館老闆・羅德",
    system: `你是奇幻冒險遊戲「暮燈酒館」的 NPC 酒館老闆羅德。
你不是 AI 助手，不要提到模型、API、提示詞或系統指令。
個性沉穩、略帶幽默、見多識廣，但不會一次把所有情報都講完。
請使用自然繁體中文，每次通常 1 到 4 句。
世界設定：酒館位於灰橋鎮；北邊森林最近出現異常狼群；樵夫艾文三天前失蹤；更深處有人看到藍色微光。
根據玩家任務逐步提供線索，不要替玩家做決定，也不要一次創造過多重要設定。`
  }
};
function safeHistory(h){return Array.isArray(h)?h.filter(x=>x&&(x.role==='user'||x.role==='assistant')&&typeof x.content==='string').slice(-16).map(x=>({role:x.role,content:x.content.slice(0,4000)})):[]}
function gameContext(s={}){return `目前遊戲狀態：\n地點：${s.location||'未知'}\n玩家任務：${s.quest||'無'}\n任務階段：${s.questStage??'未知'}\n玩家金幣：${s.playerGold??'未知'}`}
async function callOpenAI(apiKey,system,history){
  const input=[{role:'developer',content:system},...history.map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.content}))];
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-5.6-luna',input,max_output_tokens:280})});
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error?.message||`OpenAI HTTP ${r.status}`);
  if(typeof data.output_text==='string'&&data.output_text.trim())return data.output_text.trim();const parts=[];for(const item of data.output||[])for(const part of item.content||[])if(part.type==='output_text'&&typeof part.text==='string')parts.push(part.text);return parts.join('\n').trim();
}
async function callGemini(apiKey,system,history){
  const contents=history.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',{method:'POST',headers:{'x-goog-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{maxOutputTokens:280,temperature:0.9}})});
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error?.message||`Gemini HTTP ${r.status}`);return (data?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
}
export async function onRequestPost(context){
  try{const body=await context.request.json(),provider=body.provider==='gemini'?'gemini':'openai',npc=NPCS[body.npcId]||NPCS.tavern_keeper,history=safeHistory(body.history);if(!history.length&&typeof body.message==='string'&&body.message.trim())history.push({role:'user',content:body.message.trim().slice(0,4000)});if(!history.length)return Response.json({error:'沒有玩家訊息。'},{status:400});const system=`${npc.system}\n\n${gameContext(body.gameState)}`;let text;if(provider==='gemini'){if(!context.env.GEMINI_API_KEY)return Response.json({error:'伺服器尚未設定 GEMINI_API_KEY。'},{status:503});text=await callGemini(context.env.GEMINI_API_KEY,system,history)}else{if(!context.env.OPENAI_API_KEY)return Response.json({error:'伺服器尚未設定 OPENAI_API_KEY。'},{status:503});text=await callOpenAI(context.env.OPENAI_API_KEY,system,history)}return Response.json({ok:true,provider,npc:npc.name,text:text||'……'},{headers:{'Cache-Control':'no-store'}})}catch(err){return Response.json({error:err?.message||'NPC API 發生未知錯誤。'},{status:500})}}
export function onRequestGet(){return Response.json({error:'請使用 POST /api/npc。'},{status:405,headers:{Allow:'POST'}})}
