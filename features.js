/* ===== TOMETICK FEATURES ===== */

/* WPM CHART */
function updateWpmChart(){const c=document.getElementById('wpmChart');if(!c)return;const ctx=c.getContext('2d');const labels=state.wpmDataPoints.map(p=>p.time+'s');const data=state.wpmDataPoints.map(p=>p.wpm);if(state.wpmChartInstance){state.wpmChartInstance.data.labels=labels;state.wpmChartInstance.data.datasets[0].data=data;state.wpmChartInstance.update('none');return;}state.wpmChartInstance=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'WPM',data,borderColor:'rgba(255,255,255,0.95)',backgroundColor:'rgba(255,255,255,0.12)',borderWidth:2,fill:true,tension:0.4,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,animation:false,scales:{x:{display:false},y:{display:true,ticks:{color:'rgba(255,255,255,0.65)',font:{size:9}},grid:{color:'rgba(255,255,255,0.12)'}}},plugins:{legend:{display:false}}}});}

/* GOALS */
function saveGoals(){localStorage.setItem(GOALS_KEY,JSON.stringify({daily:parseInt(document.getElementById('dailyGoalInput').value)||0,weekly:parseInt(document.getElementById('weeklyGoalInput').value)||0}));updateGoalChart();}
function loadGoals(){const s=localStorage.getItem(GOALS_KEY);if(s){const g=JSON.parse(s);document.getElementById('dailyGoalInput').value=g.daily||'';document.getElementById('weeklyGoalInput').value=g.weekly||'';}updateGoalChart();}
function updateGoalChart(){const c=document.getElementById('goalProgressChart');if(!c)return;const sessions=JSON.parse(localStorage.getItem(SESSIONS_KEY)||'[]').slice(-7);const goals=JSON.parse(localStorage.getItem(GOALS_KEY)||'{}');const ds=[{label:'WPM',data:sessions.map(s=>s.wpm||0),borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.15)',borderWidth:2,fill:true,tension:0.3}];if(goals.daily>0)ds.push({label:'Goal',data:new Array(sessions.length).fill(goals.daily),borderColor:'#22c55e',borderWidth:1,borderDash:[5,5],pointRadius:0,fill:false});if(state.goalChartInstance)state.goalChartInstance.destroy();state.goalChartInstance=new Chart(c.getContext('2d'),{type:'line',data:{labels:sessions.map(s=>s.date||''),datasets:ds},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{color:'#6b7280',font:{size:9}},grid:{display:false}},y:{ticks:{color:'#6b7280'},grid:{color:'rgba(148,163,184,0.2)'}}},plugins:{legend:{labels:{color:'#111827',font:{size:10}}}}}});}

/* SESSION SAVE */
function saveSession(wpm){const sessions=JSON.parse(localStorage.getItem(SESSIONS_KEY)||'[]');const now=new Date();sessions.push({date:now.toLocaleDateString(),time:now.toLocaleTimeString(),wpm,words:parseInt(document.getElementById('wordCount').textContent)||0,hour:now.getHours(),text:document.getElementById('textInput').value,timestamp:now.getTime()});if(sessions.length>200)sessions.splice(0,sessions.length-200);localStorage.setItem(SESSIONS_KEY,JSON.stringify(sessions));updatePublicProfileData();}

/* KEYBOARD HEATMAP */
function renderKeyboard(){
  const c=document.getElementById('keyboardLayout');if(!c)return;
  const rows=[['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['z','x','c','v','b','n','m']];
  let h='';
  rows.forEach(row=>{
    h+='<div class="keyboard-row">';
    row.forEach(k=>{h+='<div class="key-btn" data-key="'+k+'">'+k.toUpperCase()+'</div>';});
    h+='</div>';
  });
  h+='<div class="keyboard-row"><div class="key-btn key-space" data-key=" ">SPACE</div></div>';
  c.innerHTML=h;
}

function updateKeyboardHeatmap(){
  const keys=document.querySelectorAll('.key-btn');
  const allVals=Object.values(state.keystrokeMap);
  if(!allVals.length)return;
  const maxCount=Math.max(1,...allVals.map(v=>v.count||0));
  const maxBad=Math.max(1,...allVals.map(v=>(v.errors||0)+(v.slowCount||0)));
  keys.forEach(k=>{
    const d=state.keystrokeMap[k.dataset.key];
    if(!d)return;
    const usage=(d.count||0)/maxCount;
    const badness=((d.errors||0)+(d.slowCount||0))/maxBad;
    // Blend from cool blue (good) → green → amber → red (bad)
    let r,g,b;
    if(badness<0.33){r=99;g=102;b=241;} // indigo
    else if(badness<0.66){r=234;g=179;b=8;} // amber
    else{r=239;g=68;b=68;} // red
    const opacity=0.25+usage*0.55;
    k.style.background='rgba('+r+','+g+','+b+','+opacity.toFixed(2)+')';
    k.style.color=opacity>0.5?'white':'#374151';
    k.style.borderColor=badness>0.5?'rgba(239,68,68,0.5)':'rgba(99,102,241,0.4)';
    if(badness>0.66)k.style.boxShadow='0 0 10px rgba(239,68,68,0.3)';
    else k.style.boxShadow='';
  });
}

function trackKeystroke(e){const key=e.key.toLowerCase();const now=Date.now();if(!state.keystrokeMap[key])state.keystrokeMap[key]={count:0,errors:0,slowCount:0};state.keystrokeMap[key].count++;if(state.lastKeystrokeTime[key]&&(now-state.lastKeystrokeTime[key])>800)state.keystrokeMap[key].slowCount++;state.lastKeystrokeTime[key]=now;if(e.key==='Backspace'){const ta=document.getElementById('textInput');const pos=ta.selectionStart;if(pos>0){const del=ta.value[pos-1];if(del&&state.keystrokeMap[del.toLowerCase()])state.keystrokeMap[del.toLowerCase()].errors++;}}updateKeyboardHeatmap();}

/* ERROR OVERLAY — disabled for normal typing, only active in challenge mode */
function updateErrorOverlay(){}

/* GHOST TEXT */
const DEFAULT_GHOST='The quick brown fox jumps over the lazy dog. She sells seashells by the seashore. How vainly men themselves amaze to win the palm, the oak, or bays.';
function toggleGhostText(){state.ghostTextActive=!state.ghostTextActive;document.getElementById('ghostTextBtn').textContent=state.ghostTextActive?'👻 Ghost ✓':'👻 Ghost';if(state.ghostTextActive){const tpl=document.getElementById('templateSelect').value;state.ghostTextSource=(tpl!=='none'&&TEMPLATES[tpl])?TEMPLATES[tpl]:DEFAULT_GHOST;updateGhostText();}else document.getElementById('ghostTextOverlay').textContent='';}
function updateGhostText(){if(!state.ghostTextActive)return;const typed=document.getElementById('textInput').value;document.getElementById('ghostTextOverlay').textContent='\u00A0'.repeat(typed.length)+state.ghostTextSource.substring(typed.length);}

/* FOCUS MODE */
function toggleFocusMode(){state.focusModeActive=!state.focusModeActive;document.body.classList.toggle('focus-mode',state.focusModeActive);document.getElementById('focusAmbientBar').style.display=state.focusModeActive?'flex':'none';document.getElementById('focusModeBtn').textContent=state.focusModeActive?'🎧 Exit':'🎧 Focus';if(state.focusModeActive){if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});document.getElementById('textInput').focus();}else{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});stopAmbientAudio();}}

/* AMBIENT AUDIO — Web Audio API generated sounds */
function createAmbientContext(){if(!state.ambientCtx){state.ambientCtx=new (window.AudioContext||window.webkitAudioContext)();state.ambientGain=state.ambientCtx.createGain();state.ambientGain.gain.value=0.3;state.ambientGain.connect(state.ambientCtx.destination);}if(state.ambientCtx.state==='suspended')state.ambientCtx.resume();}

function createRainSound(){
  createAmbientContext();
  const ctx=state.ambientCtx;
  const bufferSize=2*ctx.sampleRate;
  const buffer=ctx.createBuffer(1,bufferSize,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++)data[i]=(Math.random()*2-1)*0.5;
  const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=800;
  const lfo=ctx.createOscillator();lfo.frequency.value=0.3;
  const lfoGain=ctx.createGain();lfoGain.gain.value=200;
  lfo.connect(lfoGain);lfoGain.connect(filter.frequency);lfo.start();
  source.connect(filter);filter.connect(state.ambientGain);source.start();
  state.ambientNodes=[source,lfo];
}

function createCafeSound(){
  createAmbientContext();
  const ctx=state.ambientCtx;
  const bufferSize=2*ctx.sampleRate;
  const buffer=ctx.createBuffer(1,bufferSize,ctx.sampleRate);
  const data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<bufferSize;i++){const w=Math.random()*2-1;last=(last+0.02*w)/1.02;data[i]=last*3.5;}
  const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
  const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=500;filter.Q.value=0.7;
  source.connect(filter);filter.connect(state.ambientGain);source.start();
  state.ambientNodes=[source];
}

function createLofiSound(){
  createAmbientContext();
  const ctx=state.ambientCtx;
  const notes=[261.63,329.63,392.00,523.25];
  const oscs=notes.map(f=>{
    const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=f;
    const g=ctx.createGain();g.gain.value=0.06;
    osc.connect(g);g.connect(state.ambientGain);osc.start();return osc;
  });
  const bufferSize=ctx.sampleRate;
  const buffer=ctx.createBuffer(1,bufferSize,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++)data[i]=(Math.random()*2-1)*0.15;
  const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
  const nf=ctx.createBiquadFilter();nf.type='lowpass';nf.frequency.value=300;
  noise.connect(nf);nf.connect(state.ambientGain);noise.start();
  state.ambientNodes=[...oscs,noise];
}

function playAmbientAudio(type){
  stopAmbientAudio();state.currentAmbient=type;
  document.querySelectorAll('.ambient-option').forEach(o=>o.classList.toggle('active',o.dataset.audio===type));
  if(type==='none')return;
  try{
    if(type==='rain')createRainSound();
    else if(type==='cafe')createCafeSound();
    else if(type==='lofi')createLofiSound();
  }catch(e){console.warn('Audio failed:',e);}
}

function stopAmbientAudio(){
  if(state.ambientNodes){state.ambientNodes.forEach(n=>{try{n.stop();}catch(e){}});state.ambientNodes=null;}
  state.currentAmbient='none';
  document.querySelectorAll('.ambient-option').forEach(o=>o.classList.toggle('active',o.dataset.audio==='none'));
}

/* VOCABULARY */
const WEAK_WORDS=['very','really','actually','basically','literally','just','things','stuff','got','good','bad','nice','big','small','said','went','came','made','did','lot'];
const SYNONYMS={very:['extremely','remarkably','exceptionally'],really:['genuinely','truly','undeniably'],actually:['in fact','indeed','precisely'],basically:['fundamentally','essentially','primarily'],literally:['precisely','exactly','indeed'],just:['merely','simply','only'],things:['matters','elements','aspects'],stuff:['materials','contents','items'],got:['obtained','acquired','received'],good:['excellent','superb','outstanding'],bad:['poor','terrible','dreadful'],nice:['pleasant','delightful','wonderful'],big:['enormous','substantial','vast'],small:['tiny','minute','compact'],said:['stated','remarked','declared'],went:['traveled','proceeded','ventured'],came:['arrived','approached','emerged'],made:['created','crafted','produced'],did:['performed','executed','accomplished'],lot:['abundance','multitude','plethora']};
function analyzeVocabulary(text){if(!text||text.length<20)return;const words=text.toLowerCase().match(/\b[a-z]+\b/g);if(!words)return;const freq={};words.forEach(w=>{freq[w]=(freq[w]||0)+1;});const flagged=new Set();Object.entries(freq).forEach(([w,c])=>{if(c>=3)flagged.add(w);});WEAK_WORDS.forEach(w=>{if(freq[w])flagged.add(w);});state.flaggedWords=flagged;}

/* TONE ANALYZER */
const TONE_KEYWORDS={formal:['hereby','therefore','furthermore','consequently','pursuant','accordingly','whereas','respectfully','sincerely','regarding','acknowledge','committee','compliance'],casual:['hey','yeah','gonna','wanna','kinda','stuff','cool','awesome','lol','btw','tbh','omg','nah','yep','dude'],assertive:['must','will','shall','demand','require','insist','certainly','undoubtedly','clearly','decisive','absolutely','definitely','always','never','every'],passive:['might','perhaps','maybe','possibly','somewhat','could','would','seem','appear','suggest','kind of','sort of','a little','rather'],persuasive:['imagine','discover','proven','exclusive','guaranteed','transform','revolutionary','essential','remarkable','breakthrough','incredible','amazing','powerful','ultimate']};
const TONE_EMOJIS={formal:'📋',casual:'😊',assertive:'💪',passive:'🌊',persuasive:'✨',neutral:'📝'};
function analyzeTone(text){
  const tl=document.getElementById('toneLabel');
  const bf=document.getElementById('toneBarFill');
  const tc=document.getElementById('toneConfidence');
  if(!text||text.length<30){tl.textContent='Start typing...';bf.style.width='0%';tc.textContent='0% confidence';return;}
  const lower=text.toLowerCase();
  const scores={};let mx=0,mt='neutral';
  Object.entries(TONE_KEYWORDS).forEach(([tone,kws])=>{
    let s=0;
    kws.forEach(kw=>{
      try{const re=new RegExp('\\b'+kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','gi');const m=lower.match(re);if(m)s+=m.length;}catch(e){}
    });
    scores[tone]=s;
    if(s>mx){mx=s;mt=tone;}
  });
  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  const conf=total>0?Math.min(95,Math.round((mx/total)*100)):0;
  const emoji=TONE_EMOJIS[mt]||'📝';
  const name=mt.charAt(0).toUpperCase()+mt.slice(1);
  tl.textContent=emoji+' '+name;
  bf.style.width=Math.max(conf,5)+'%';
  const colors={formal:'#6366f1',casual:'#f59e0b',assertive:'#ef4444',passive:'#06b6d4',persuasive:'#a855f7',neutral:'#6b7280'};
  bf.style.background=colors[mt]||'#6b7280';
  tc.textContent=conf+'% confidence'+(total>0?' ('+total+' keywords found)':'');
}

/* SENTENCE RHYTHM */
function updateRhythm(text){const c=document.getElementById('rhythmChart');if(!c||!text){if(c)c.innerHTML='';return;}const sents=text.split(/[.!?]+/).filter(s=>s.trim().length>0);if(!sents.length){c.innerHTML='<div class="history-empty">Write sentences to see rhythm</div>';return;}const lens=sents.map(s=>s.trim().split(/\s+/).filter(w=>w).length);const mx=Math.max(...lens,1);c.innerHTML=lens.map((len,i)=>{let color='#22c55e';if(i>=4){const sl=lens.slice(i-4,i+1);if(sl.every(l=>Math.abs(l-sl[0])<=2))color='#ef4444';}return'<div class="rhythm-bar-row"><span class="rhythm-bar-label">'+(i+1)+'</span><div class="rhythm-bar" style="width:'+Math.max(8,Math.round((len/mx)*100))+'%;background:'+color+'"><span class="rhythm-bar-count">'+len+'</span></div></div>';}).join('');}

/* CHALLENGE */
function toggleChallengePanel(){const p=document.getElementById('challengePanel');if(p.style.display==='none'){p.style.display='block';p.scrollIntoView({behavior:'smooth',block:'start'});}else{p.style.display='none';state.challengeActive=false;}}
function countSyllables(w){w=w.toLowerCase().replace(/[^a-z]/g,'');if(w.length<=3)return 1;w=w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');const m=w.match(/[aeiouy]{1,2}/g);return m?m.length:1;}
function startChallenge(){
  const src=document.getElementById('challengeSourceText').value.trim();
  if(!src){alert('Please paste some text to type against.');return;}
  state.challengeText=src;state.challengeStartTime=Date.now();state.challengeActive=true;
  const words=src.split(/\s+/);
  const avgLen=words.reduce((a,w)=>a+w.length,0)/words.length;
  const syllables=words.reduce((a,w)=>a+countSyllables(w),0);
  const sents=src.split(/[.!?]+/).filter(s=>s.trim()).length||1;
  const fk=206.835-1.015*(words.length/sents)-84.6*(syllables/words.length);
  document.getElementById('challengeDifficulty').textContent='Difficulty: '+(avgLen>6?'Hard':avgLen>4?'Medium':'Easy');
  document.getElementById('challengeReadability').textContent='Readability: '+Math.round(fk);
  document.getElementById('challengeInfo').style.display='flex';
  document.getElementById('challengeActive').style.display='block';
  document.getElementById('challengeSourceText').disabled=true;
  document.getElementById('startChallengeBtn').textContent='Challenge Active...';
  document.getElementById('startChallengeBtn').disabled=true;
  document.getElementById('textInput').value='';
  document.getElementById('textInput').focus();
  state.typingStartTime=null;
  updateChallengeDisplay();
  document.getElementById('textInput').scrollIntoView({behavior:'smooth',block:'center'});
}
function updateChallengeDisplay(){
  if(!state.challengeActive)return;
  const typed=document.getElementById('textInput').value;
  const src=state.challengeText;
  let h='',correct=0,total=typed.length;
  for(let i=0;i<src.length;i++){
    if(i<typed.length){
      if(typed[i]===src[i]){h+='<span class="challenge-char-correct">'+escapeHtml(src[i])+'</span>';correct++;}
      else h+='<span class="challenge-char-wrong">'+escapeHtml(src[i])+'</span>';}
    else if(i===typed.length){h+='<span class="challenge-char-cursor">'+escapeHtml(src[i])+'</span>';}
    else h+='<span class="challenge-char-pending">'+escapeHtml(src[i])+'</span>';}
  document.getElementById('challengeDisplay').innerHTML=h;
  const accuracy=total>0?Math.round((correct/total)*100):100;
  document.getElementById('challengeAccuracy').textContent=accuracy+'%';
  const el=(Date.now()-state.challengeStartTime)/60000;
  const wpm=el>0.01?Math.round(typed.split(/\s+/).filter(w=>w).length/el):0;
  document.getElementById('challengeWpm').textContent=wpm;
  const progress=Math.min(100,Math.round((typed.length/src.length)*100));
  document.getElementById('challengeProgress').textContent=progress+'%';
  if(typed.length>=src.length){
    state.challengeActive=false;
    document.getElementById('challengeSourceText').disabled=false;
    document.getElementById('startChallengeBtn').textContent='Start Challenge';
    document.getElementById('startChallengeBtn').disabled=false;
    saveSession(wpm);
    alert('Challenge complete! WPM: '+wpm+' | Accuracy: '+accuracy+'%');
  }
}

/* VERSION HISTORY */
function startAutoSave(){stopAutoSave();state.autoSaveInterval=setInterval(autoSaveVersion,180000);}
function stopAutoSave(){if(state.autoSaveInterval){clearInterval(state.autoSaveInterval);state.autoSaveInterval=null;}}
function autoSaveVersion(){const t=document.getElementById('textInput').value;if(!t||t.length<10)return;const v=JSON.parse(localStorage.getItem(VERSIONS_KEY)||'[]');v.push({timestamp:new Date().toISOString(),text:t,words:t.trim().split(/\s+/).filter(w=>w).length});if(v.length>50)v.splice(0,v.length-50);localStorage.setItem(VERSIONS_KEY,JSON.stringify(v));}
function openVersionDrawer(){document.getElementById('versionDrawer').style.display='flex';document.getElementById('versionDrawerOverlay').style.display='block';renderVersionList();}
function closeVersionDrawer(){document.getElementById('versionDrawer').style.display='none';document.getElementById('versionDrawerOverlay').style.display='none';}
function renderVersionList(){const c=document.getElementById('versionList');const v=JSON.parse(localStorage.getItem(VERSIONS_KEY)||'[]');if(!v.length){c.innerHTML='<div class="history-empty">No versions saved yet</div>';return;}c.innerHTML=v.slice().reverse().map((ver,i)=>'<div class="version-item" data-idx="'+(v.length-1-i)+'"><div class="version-time">'+new Date(ver.timestamp).toLocaleString()+'</div><div class="version-preview">'+ver.words+' words — '+escapeHtml(ver.text.substring(0,80))+'...</div></div>').join('');c.querySelectorAll('.version-item').forEach(item=>{item.addEventListener('click',()=>{state.pendingRestore=v[parseInt(item.dataset.idx)].text;document.getElementById('restoreConfirmOverlay').style.display='flex';});});}
function confirmRestore(){if(state.pendingRestore!==null){document.getElementById('textInput').value=state.pendingRestore;state.pendingRestore=null;updateStats();}document.getElementById('restoreConfirmOverlay').style.display='none';closeVersionDrawer();}

/* EXPORT */
function exportAs(fmt){const t=document.getElementById('textInput').value;if(!t)return;if(fmt==='pdf'){window.print();return;}if(fmt==='text'){downloadFile(t,'tometick.txt','text/plain');return;}if(fmt==='markdown'){downloadFile(t.split('\n').map(l=>l.trim()&&l.trim().length<60&&!l.trim().endsWith('.')?'## '+l.trim():l).join('\n\n'),'tometick.md','text/markdown');return;}if(fmt==='docx'){downloadFile(t,'tometick.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document');}}
function downloadFile(content,name,mime){const b=new Blob([content],{type:mime});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}

/* DNA REPORT */
function openDnaReport(){
  // Save current session first so DNA report includes live data
  const currentText=document.getElementById('textInput').value;
  const currentWpm=parseInt(document.getElementById('wpm').textContent)||0;
  if(currentText&&currentText.length>10){
    const sessions=JSON.parse(localStorage.getItem(SESSIONS_KEY)||'[]');
    const now=new Date();
    sessions.push({date:now.toLocaleDateString(),time:now.toLocaleTimeString(),wpm:currentWpm,words:currentText.trim().split(/\s+/).filter(w=>w).length,hour:now.getHours(),text:currentText,timestamp:now.getTime()});
    if(sessions.length>200)sessions.splice(0,sessions.length-200);
    localStorage.setItem(SESSIONS_KEY,JSON.stringify(sessions));
  }
  document.getElementById('dnaModalOverlay').style.display='flex';
  const sessions=JSON.parse(localStorage.getItem(SESSIONS_KEY)||'[]');
  const now=Date.now(),wk=604800000;
  const ws=sessions.filter(s=>s.timestamp&&(now-s.timestamp)<wk);
  // Include current text in analysis even if no saved sessions
  let allText=ws.map(s=>s.text||'').join(' ');
  if(currentText&&currentText.length>10&&!allText.includes(currentText))allText+=' '+currentText;
  const totalWords=ws.reduce((a,s)=>a+(s.words||0),0)||(currentText?currentText.trim().split(/\s+/).filter(w=>w).length:0);
  document.getElementById('dnaTotalWords').textContent=totalWords.toLocaleString();
  const aw=allText.toLowerCase().match(/\b[a-z]+\b/g)||[];
  const richness=aw.length>0?Math.round((new Set(aw).size/aw.length)*100):0;
  document.getElementById('dnaVocabRichness').textContent=richness+'%';
  const sents=allText.split(/[.!?]+/).filter(s=>s.trim()).map(s=>s.trim().split(/\s+/).length);
  const avg=sents.length?sents.reduce((a,b)=>a+b,0)/sents.length:0;
  const variance=sents.length>1?Math.sqrt(sents.reduce((a,l)=>a+Math.pow(l-avg,2),0)/sents.length):0;
  document.getElementById('dnaSentenceVariety').textContent=Math.min(100,Math.round(variance*10))+'%';
  const hd=new Array(24).fill(0),hc=new Array(24).fill(0);
  ws.forEach(s=>{if(s.hour!==undefined&&s.wpm){hd[s.hour]+=s.wpm;hc[s.hour]++;}});
  // If only current session, add it
  if(ws.length===0&&currentWpm>0){const h=new Date().getHours();hd[h]+=currentWpm;hc[h]++;}
  renderDnaChart(hd.map((t,i)=>hc[i]?Math.round(t/hc[i]):0));
}
function renderDnaChart(data){const c=document.getElementById('dnaHourChart');if(!c)return;if(state.dnaChartInstance)state.dnaChartInstance.destroy();state.dnaChartInstance=new Chart(c.getContext('2d'),{type:'bar',data:{labels:Array.from({length:24},(_,i)=>i+'h'),datasets:[{label:'Avg WPM',data,backgroundColor:'rgba(99,102,241,0.6)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{color:'#6b7280',font:{size:8}},grid:{display:false}},y:{ticks:{color:'#6b7280'},grid:{color:'rgba(148,163,184,0.2)'}}},plugins:{legend:{display:false}}}});}

/* PUBLIC PROFILE */
function savePublicProfile(user){const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}');if(!p[user.username])p[user.username]={username:user.username,totalWords:0,bestWpm:0,streak:0,badges:[],sessions:[]};localStorage.setItem(PROFILE_KEY,JSON.stringify(p));}
function updatePublicProfileData(){if(!state.currentUser)return;const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}');const pr=p[state.currentUser.username]||{username:state.currentUser.username,totalWords:0,bestWpm:0,streak:0,badges:[],sessions:[]};const wpm=parseInt(document.getElementById('wpm').textContent)||0;pr.totalWords+=(parseInt(document.getElementById('wordCount').textContent)||0);if(wpm>pr.bestWpm)pr.bestWpm=wpm;const sd=JSON.parse(localStorage.getItem(STREAK_KEY)||'{}');pr.streak=sd.streak||0;pr.badges=[];if(pr.streak>=3)pr.badges.push('🥉');if(pr.streak>=7)pr.badges.push('🥈');if(pr.streak>=14)pr.badges.push('🥇');if(pr.streak>=30)pr.badges.push('🏆');pr.sessions.push({date:new Date().toLocaleDateString(),wpm});if(pr.sessions.length>30)pr.sessions=pr.sessions.slice(-30);p[state.currentUser.username]=pr;localStorage.setItem(PROFILE_KEY,JSON.stringify(p));}
function loadPublicProfile(un){const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')[un];if(!p){document.getElementById('profileUsername').textContent='User not found';return;}document.getElementById('profileAvatar').textContent=un.charAt(0).toUpperCase();document.getElementById('profileUsername').textContent=un;document.getElementById('profileStreak').textContent=p.streak||0;document.getElementById('profileTotalWords').textContent=(p.totalWords||0).toLocaleString();document.getElementById('profileBestWpm').textContent=p.bestWpm||0;document.getElementById('profileBadges').innerHTML=(p.badges||[]).map(b=>'<span class="badge-icon">'+b+'</span>').join('');const c=document.getElementById('profileWpmChart');if(!c)return;if(state.profileChartInstance)state.profileChartInstance.destroy();state.profileChartInstance=new Chart(c.getContext('2d'),{type:'line',data:{labels:(p.sessions||[]).map(s=>s.date),datasets:[{label:'WPM',data:(p.sessions||[]).map(s=>s.wpm),borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.15)',borderWidth:2,fill:true,tension:0.3}]},options:{responsive:true,scales:{x:{ticks:{color:'#6b7280',font:{size:8}},grid:{display:false}},y:{ticks:{color:'#6b7280'},grid:{color:'rgba(148,163,184,0.2)'}}},plugins:{legend:{display:false}}}});}

/* ROUTING */
function handleRoute(){const h=window.location.hash;if(h.startsWith('#/profile/')){showSection('profileSection');loadPublicProfile(h.replace('#/profile/',''));return true;}return false;}

/* PWA */
function registerServiceWorker(){if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});}

/* EVENT SETUP */
function setupEventListeners(){
  document.getElementById('logo').addEventListener('click',e=>{e.preventDefault();if(state.currentUser)showSection('dashboardSection');});
  document.getElementById('toSignup').addEventListener('click',e=>{e.preventDefault();showSection('signupSection');});
  document.getElementById('toLogin').addEventListener('click',e=>{e.preventDefault();showSection('loginSection');});
  document.getElementById('authBtn').addEventListener('click',()=>{if(state.currentUser)logout();else showSection('loginSection');});
  document.getElementById('signupForm').addEventListener('submit',signupHandler);
  document.getElementById('loginForm').addEventListener('submit',loginHandler);
  document.querySelectorAll('#loginForm input, #signupForm input').forEach(i=>{i.addEventListener('focus',()=>{i.classList.remove('error');const e=i.parentElement.nextElementSibling;if(e&&e.classList.contains('error-message'))e.classList.remove('show');});});
  const ti=document.getElementById('textInput');
  ti.addEventListener('input',()=>{updateStats();if(state.challengeActive)updateChallengeDisplay();updateErrorOverlay();});
  ti.addEventListener('keydown',trackKeystroke);
  document.getElementById('clearBtn').addEventListener('click',clearText);
  document.getElementById('copyBtn').addEventListener('click',copyText);
  document.getElementById('voiceBtn').addEventListener('click',toggleDictation);
  document.getElementById('templateSelect').addEventListener('change',e=>applyTemplate(e.target.value));
  document.getElementById('focusModeBtn').addEventListener('click',toggleFocusMode);
  document.getElementById('exitFocusBtn').addEventListener('click',toggleFocusMode);
  document.getElementById('ghostTextBtn').addEventListener('click',toggleGhostText);
  document.getElementById('challengeBtn').addEventListener('click',toggleChallengePanel);
  document.getElementById('closeChallengeBtn').addEventListener('click',()=>{document.getElementById('challengePanel').style.display='none';state.challengeActive=false;document.getElementById('challengeSourceText').disabled=false;document.getElementById('startChallengeBtn').textContent='Start Challenge';document.getElementById('startChallengeBtn').disabled=false;document.getElementById('challengeActive').style.display='none';document.getElementById('challengeInfo').style.display='none';});
  document.getElementById('startChallengeBtn').addEventListener('click',startChallenge);
  document.getElementById('versionHistoryBtn').addEventListener('click',openVersionDrawer);
  document.getElementById('closeVersionDrawer').addEventListener('click',closeVersionDrawer);
  document.getElementById('versionDrawerOverlay').addEventListener('click',closeVersionDrawer);
  document.getElementById('confirmRestore').addEventListener('click',confirmRestore);
  document.getElementById('cancelRestore').addEventListener('click',()=>{document.getElementById('restoreConfirmOverlay').style.display='none';state.pendingRestore=null;});
  document.getElementById('exportBtn').addEventListener('click',()=>document.getElementById('exportDropdown').classList.toggle('show'));
  document.querySelectorAll('.export-option').forEach(o=>o.addEventListener('click',()=>{exportAs(o.dataset.format);document.getElementById('exportDropdown').classList.remove('show');}));
  document.addEventListener('click',e=>{if(!e.target.closest('#exportDropdownWrapper'))document.getElementById('exportDropdown').classList.remove('show');});
  document.getElementById('saveGoalsBtn').addEventListener('click',saveGoals);
  document.getElementById('dnaReportBtn').addEventListener('click',openDnaReport);
  document.getElementById('closeDnaModal').addEventListener('click',()=>{document.getElementById('dnaModalOverlay').style.display='none';});
  document.getElementById('dnaModalOverlay').addEventListener('click',e=>{if(e.target.id==='dnaModalOverlay')e.target.style.display='none';});
  document.querySelectorAll('.ambient-option').forEach(b=>b.addEventListener('click',()=>playAmbientAudio(b.dataset.audio)));
  window.addEventListener('hashchange',handleRoute);
}

/* INIT */
function init(){
  loadUsers();loadCurrentUser();loadStreak();updateAuthUI();updateUserGreeting();
  setupEventListeners();renderKeyboard();renderThemePicker();loadGoals();
  if(state.currentUser){showSection('dashboardSection');startAutoSave();}
  if(!handleRoute()&&state.currentUser)showSection('dashboardSection');
  initSpeech();registerServiceWorker();
  const at=localStorage.getItem('tometick_activeTheme');if(at)applyEditorTheme(at);
  window.addEventListener('beforeunload',()=>{const w=parseInt(document.getElementById('wpm').textContent)||0;if(w>0){saveSession(w);autoSaveVersion();}});
}

document.addEventListener('DOMContentLoaded',init);
