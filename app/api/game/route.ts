import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
const classes = ["Strawweight","Flyweight","Bantamweight","Featherweight","Lightweight","Welterweight","Middleweight","Light Heavyweight","Heavyweight"];
export async function GET(){
 const auth=await getChatGPTUser(); if(!auth) return Response.json({signedIn:false});
 const db=env.DB!; const me=await db.prepare("SELECT * FROM players WHERE id=?").bind(auth.userId).first();
 if(!me)return Response.json({signedIn:true,me:null,nights:[],players:[]});
 const ns=await db.prepare("SELECT * FROM nights WHERE host=? OR guest=? ORDER BY created DESC").bind(auth.userId,auth.userId).all();
 const ps=await db.prepare("SELECT id, username, name FROM players").all();
 return Response.json({signedIn:true,me,nights:ns.results.map((n:any)=>({...n,data:JSON.parse(n.data)})),players:ps.results});
}
export async function POST(req:Request){
 const auth=await getChatGPTUser();if(!auth)return Response.json({error:"Sign in to continue."},{status:401});
 const db=env.DB!;const b=await req.json() as any;const id=auth.userId;
 try{
 if(b.action==='register'){
 const username=String(b.username||'').trim().toLowerCase(),name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw Error('Enter a valid email address.');
 if(email!==auth.email.toLowerCase())throw Error('Use the email address associated with your sign-in to link this account.');
 if(!/^[a-z0-9_]{3,20}$/.test(username)||!name||name.length>40)throw Error('Use a 3–20 character username (letters, numbers, underscores) and a name of up to 40 characters.');
 if(await db.prepare('SELECT id FROM players WHERE id=?').bind(id).first())throw Error('You already have an account.');
 if(await db.prepare('SELECT id FROM players WHERE username=?').bind(username).first())throw Error('That username is already taken.');
 await db.prepare('INSERT INTO players (id,username,name,email) VALUES (?,?,?,?)').bind(id,username,name,email).run();
 }else{
 if(!await db.prepare('SELECT id FROM players WHERE id=?').bind(id).first())throw Error('Create your profile first.');
 if(b.action==='invite'){
 const guest:any=await db.prepare('SELECT id FROM players WHERE username=? OR id=?').bind(String(b.opponent).toLowerCase().trim(),String(b.opponent).trim()).first();
 if(!guest)throw Error('No player found. Your friend needs to create a profile first.');if(guest.id===id)throw Error('Invite another player.');
 await db.prepare('INSERT INTO nights (id,host,guest,status,data,created) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),id,guest.id,'invited',JSON.stringify({fights:[],picks:{},phase:'setup'}),new Date().toISOString()).run();
 }else{
 const n:any=await db.prepare('SELECT * FROM nights WHERE id=?').bind(b.night).first();if(!n||![n.host,n.guest].includes(id))throw Error('Fight night not found.');
 let data=JSON.parse(n.data),status=n.status;
 if(b.action==='accept'||b.action==='decline'){if(id!==n.guest||status!=='invited')throw Error('Invitation unavailable.');status=b.action==='accept'?'active':'declined';}
 else if(status!=='active')throw Error('This fight night is not active.');
 else if(b.action==='pick'){
 if(data.phase!=='setup')throw Error('The fight has already started.');
 const fighter=String(b.fighter||'').trim();if(!fighter||fighter.length>60||!classes.includes(b.weight))throw Error('Enter your fighter and weight class.');
 const other=data.picks[id===n.host?n.guest:n.host];if(other&&other.weight!==b.weight)throw Error('Both fighters must use the same weight class.');
 data.picks[id]={fighter,weight:b.weight};if(data.picks[n.host]&&data.picks[n.guest])data.phase='live';
 }else if(b.action==='result'){
 if(data.phase!=='live')throw Error('This result has already been recorded or fighters are not ready.');
 if(![n.host,n.guest].includes(b.winner)||!['TKO','Submission','Decision'].includes(b.method)||![3,5].includes(Number(b.rounds)))throw Error('Choose a winner and result.');
 const round=Number(b.round),seconds=Number(b.seconds);if(!Number.isInteger(round)||round<1||round>Number(b.rounds)||!Number.isInteger(seconds)||seconds<0||seconds>300)throw Error('Enter a valid round and time (0:00–5:00).');
 if(b.method==='Decision'&&(round!==Number(b.rounds)||seconds!==300))throw Error('A decision must be at the end of the final round.');
 data.fights.push({id:crypto.randomUUID(),picks:data.picks,winner:b.winner,method:b.method,round,seconds,weight:data.picks[n.host].weight});data.phase='recorded';
 }else if(b.action==='next'){if(data.phase!=='recorded')throw Error('Record this fight first.');data.picks={};data.phase='setup';}
 else if(b.action==='end'){if(data.phase!=='recorded')throw Error('Record the fight before ending the night.');status='ended';}else throw Error('Unknown action.');
 const r=await db.prepare('UPDATE nights SET status=?,data=? WHERE id=? AND data=? AND status=?').bind(status,JSON.stringify(data),n.id,n.data,n.status).run();if(!r.meta.changes)throw Error('Your friend updated this night. Refresh and try again.');
 }
 }
 return Response.json({ok:true});
 }catch(e:any){return Response.json({error:e.message.includes('UNIQUE')?'That username is already taken.':e.message},{status:400});}
}
