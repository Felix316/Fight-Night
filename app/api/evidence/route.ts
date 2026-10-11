import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
export async function GET(req:Request){
 const auth=await getChatGPTUser();if(!auth)return new Response('Sign in',{status:401});
 const url=new URL(req.url),night=url.searchParams.get('night'),key=url.searchParams.get('key');
 if(!night||!key)return new Response('Not found',{status:404});
 const n:any=await env.DB!.prepare('SELECT * FROM nights WHERE id=?').bind(night).first();if(!n||![n.host,n.guest].includes(auth.userId))return new Response('Not found',{status:404});
 const data=JSON.parse(n.data),path=`/api/evidence?night=${encodeURIComponent(n.id)}&key=${key}`;
 const records=[data.pending,data.draft,...data.fights].filter(Boolean);if(!records.some((r:any)=>r.photos?.includes(path)))return new Response('Not found',{status:404});
 const image=await env.BUCKET?.get(key);if(!image)return new Response('Not found',{status:404});
 return new Response(image.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
