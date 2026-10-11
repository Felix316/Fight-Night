import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePhotoText,cleanStats,validateResult,reviewProposal} from '../lib/fight-results';
test('extracts both columns from a readable overall stats screen',()=>{
 const r=parsePhotoText('KNOCKOUT R2 03:38\n4 Stunned/Wobbled 0\n0 Body Health Events 0\n0 Leg Health Events 0\n1 Knockdowns 1\n41 / 82 Significant Strikes 29 / 137\n75 / 151 Total Strikes 45 / 181\n2 / 2 Takedowns 2 / 6\n00:24 Control 01:10');
 assert.equal(r.columns[0].sigLanded,'41');assert.equal(r.columns[1].sigAttempted,'137');assert.equal(r.columns[0].control,'00:24');assert.equal(r.columns[1].control,'01:10');assert.equal(r.method,'KO');assert.equal(r.round,'2');assert.equal(r.seconds,'38');
});
test('unreadable text stays missing instead of being guessed',()=>{const r=parsePhotoText('unreadable image\n? Significant Strikes ?');assert.deepEqual(r.columns,[{},{}]);assert.equal(r.method,'')});
test('unknown differs from zero; counts and control time are validated',()=>{
 assert.equal(cleanStats({stuns:0}).stuns,0);assert.equal(cleanStats({}).stuns,null);assert.throws(()=>cleanStats({sigLanded:4,sigAttempted:3}));assert.throws(()=>cleanStats({stuns:-1}));
 const valid={winner:'a',method:'KO',round:2,seconds:218,rounds:3};assert.equal(validateResult(valid,{host:'a',guest:'b'}).method,'KO');assert.throws(()=>validateResult({...valid,stats:{a:{control:999}}},{host:'a',guest:'b'}));assert.throws(()=>validateResult({...valid,method:'Decision'},{host:'a',guest:'b'}));
});
const proposal=()=>({phase:'review',fights:[] as any[],pending:{id:'p',submittedBy:'a',winner:'b',stats:{}}});
test('only opponent can confirm; result counts exactly once',()=>{const d=proposal();assert.throws(()=>reviewProposal(d,'a','confirm','p'));assert.equal(d.fights.length,0);reviewProposal(d,'b','confirm','p');assert.equal(d.phase,'recorded');assert.equal(d.fights.length,1);assert.equal(d.fights[0].confirmedBy,'b');assert.throws(()=>reviewProposal(d,'b','confirm','p'));assert.equal(d.fights.length,1)});
test('stale proposals and corrections do not change totals',()=>{const d=proposal();assert.throws(()=>reviewProposal(d,'b','confirm','old'));assert.equal(d.fights.length,0);reviewProposal(d,'b','request_changes','p','Wrong winner');assert.equal(d.phase,'live');assert.equal(d.fights.length,0);assert.equal((d as any).draft.id,'p');assert.equal((d as any).correction.note,'Wrong winner')});
test('only submitter can withdraw',()=>{const d=proposal();assert.throws(()=>reviewProposal(d,'b','withdraw','p'));reviewProposal(d,'a','withdraw','p');assert.equal(d.phase,'live');assert.equal(d.fights.length,0)});
