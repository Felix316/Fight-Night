export const fields = [
 ['stuns','Stunned / wobbled'], ['bodyEvents','Body health events'], ['legEvents','Leg health events'], ['knockdowns','Knockdowns'],
 ['sigLanded','Significant strikes landed'], ['sigAttempted','Significant strikes attempted'], ['totalLanded','Total strikes landed'], ['totalAttempted','Total strikes attempted'],
 ['tdLanded','Takedowns landed'], ['tdAttempted','Takedowns attempted'], ['control','Control time (mm:ss)']
] as const;
export type Stats = Record<string,number|null>;
export function cleanStats(raw:any):Stats {
 const out:Stats={};
 for(const [key] of fields){const v=raw?.[key];if(v===null||v===undefined||v===''){out[key]=null;continue}const n=Number(v);if(!Number.isInteger(n)||n<0||n>10000)throw Error('Statistics must be nonnegative whole numbers.');out[key]=n;}
 for(const [landed,attempted] of [['sigLanded','sigAttempted'],['totalLanded','totalAttempted'],['tdLanded','tdAttempted']]){if(out[landed]!==null&&out[attempted]!==null&&out[landed]!>out[attempted]!)throw Error('Landed counts cannot exceed attempts.');}
 return out;
}
export function validateResult(b:any,n:any){
 if(![n.host,n.guest].includes(b.winner)||!['KO','TKO','Submission','Decision'].includes(b.method)||![3,5].includes(Number(b.rounds)))throw Error('Choose a winner, finish method and scheduled rounds.');
 const round=Number(b.round),seconds=Number(b.seconds);
 if(b.round===''||b.seconds===''||!Number.isInteger(round)||round<1||round>Number(b.rounds)||!Number.isInteger(seconds)||seconds<0||seconds>300)throw Error('Enter a valid winning round and elapsed time (0:00–5:00).');
 if(b.method==='Decision'&&(round!==Number(b.rounds)||seconds!==300))throw Error('A decision must be at the end of the final round.');
 const photos=Array.isArray(b.photos)?b.photos:[];
 if(photos.length>3||photos.some((p:any)=>typeof p!=='string'||p.length>450000||(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p)&&!/^\/api\/evidence\?night=[A-Za-z0-9%-]+&key=[A-Za-z0-9%-]+$/.test(p))))throw Error('Use up to three photos under 330 KB each.');
 const stats:Record<string,Stats>={[n.host]:cleanStats(b.stats?.[n.host]),[n.guest]:cleanStats(b.stats?.[n.guest])};
 const duration=(round-1)*300+seconds;
 for(const s of Object.values(stats))if(s.control!==null&&s.control>duration)throw Error('Control time cannot exceed the duration of the fight.');
 return {winner:b.winner,method:b.method,round,seconds,rounds:Number(b.rounds),stats,photos};
}
export function parsePhotoText(text:string){
 const columns:[Record<string,string>,Record<string,string>]=[{},{}];
 const rows:[RegExp,string[]][]=[[/stunn?ed\s*\/\s*wobbled|stunned|wobbled/i,['stuns']],[/body\s*health\s*events/i,['bodyEvents']],[/leg\s*health\s*events/i,['legEvents']],[/knock\s*downs/i,['knockdowns']],[/significant\s*strikes/i,['sigLanded','sigAttempted']],[/total\s*strikes/i,['totalLanded','totalAttempted']],[/takedowns/i,['tdLanded','tdAttempted']],[/control/i,['control']]];
 for(const line of text.split('\n'))for(const [label,keys] of rows){const match=label.exec(line);if(!match)continue;const a=line.slice(0,match.index),b=line.slice(match.index+match[0].length);for(const [i,side] of [a,b].entries()){
 if(keys[0]==='control'){const t=side.match(/\b(\d{1,2}):([0-5]\d)\b/);if(t)columns[i][keys[0]]=`${t[1]}:${t[2]}`;}
 else if(keys.length===2){const pair=side.match(/\b(\d+)\s*[/|]\s*(\d+)\b/);if(pair){columns[i][keys[0]]=pair[1];columns[i][keys[1]]=pair[2];}}
 else{const digits=side.trim().match(/^\D*(\d+)\D*$/);if(digits)columns[i][keys[0]]=digits[1];}
 }}
 const finish=text.match(/\b(TKO|KNOCKOUT|SUBMISSION|DECISION)\b/i),time=text.match(/\bR(?:OUND)?\s*([1-5])\s*(\d{1,2}):([0-5]\d)/i);
 return {columns,method:finish?({TKO:'TKO',KNOCKOUT:'KO',SUBMISSION:'Submission',DECISION:'Decision'} as any)[finish[1].toUpperCase()]:'',round:time?.[1]||'',minutes:time?.[2]||'',seconds:time?.[3]||''};
}
export function reviewProposal(data:any,id:string,action:string,pendingId:string,note=''){
 if(data.phase!=='review'||!data.pending||pendingId!==data.pending.id)throw Error('This proposal has changed. Refresh and review the latest result.');
 const mine=data.pending.submittedBy===id;
 if(action==='confirm'){
 if(mine)throw Error('The other player must confirm this result.');
 data.fights.push({...data.pending,confirmedBy:id,confirmedAt:new Date().toISOString()});delete data.pending;data.phase='recorded';
 }else if(action==='request_changes'){
 if(mine)throw Error('Use Withdraw to edit your own proposal.');
 if(!note.trim()||note.trim().length>500)throw Error('Explain what needs correcting (up to 500 characters).');
 data.draft=data.pending;delete data.pending;data.phase='live';data.correction={by:id,note:note.trim()};
 }else if(action==='withdraw'){
 if(!mine)throw Error('Only the submitting player can withdraw the current proposal.');
 data.draft=data.pending;delete data.pending;data.phase='live';
 }else throw Error('Unknown review action.');
 return data;
}
