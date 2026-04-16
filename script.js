/* ===== TOMETICK CORE ===== */
const state = {
  users: [], currentUser: null, typingStartTime: null, history: [],
  speechRecognition: null, isDictating: false, wpmDataPoints: [], keystrokeMap: {},
  lastKeystrokeTime: {}, ghostTextActive: false, ghostTextSource: '',
  focusModeActive: false, currentAmbient: 'none', challengeActive: false, challengeText: '',
  challengeStartTime: null, versionHistory: [], autoSaveInterval: null,
  vocabDebounceTimer: null, toneDebounceTimer: null, wpmChartInstance: null, goalChartInstance: null,
  profileChartInstance: null, dnaChartInstance: null, pendingRestore: null, flaggedWords: new Set(),
  ambientCtx: null, ambientGain: null, ambientNodes: null
};

const USERS_KEY='tometick_users', CURRENT_USER_KEY='tometick_currentUser',
  STREAK_KEY='tometick_streak', SESSIONS_KEY='tometick_sessions', VERSIONS_KEY='tometick_versions',
  GOALS_KEY='tometick_goals', THEMES_KEY='tometick_themes', PROFILE_KEY='tometick_profiles';

function hashPassword(p){let h=0;for(let i=0;i<p.length;i++){h=((h<<5)-h)+p.charCodeAt(i);h=h&h;}return'hash_'+Math.abs(h).toString(36);}

function loadUsers(){const s=localStorage.getItem(USERS_KEY);if(s)state.users=JSON.parse(s);}
function saveUsers(){localStorage.setItem(USERS_KEY,JSON.stringify(state.users));}
function loadCurrentUser(){const s=localStorage.getItem(CURRENT_USER_KEY);if(s)state.currentUser=JSON.parse(s);}
function saveCurrentUser(){if(state.currentUser)localStorage.setItem(CURRENT_USER_KEY,JSON.stringify(state.currentUser));else localStorage.removeItem(CURRENT_USER_KEY);}
function updateAuthUI(){document.getElementById('authBtn').textContent=state.currentUser?state.currentUser.username+' (Logout)':'Login';}
function updateUserGreeting(){document.getElementById('userGreeting').textContent=state.currentUser?'Welcome back, '+state.currentUser.username+'!':'';}

function showSection(id){document.querySelectorAll('main > section').forEach(s=>s.classList.remove('active'));const sec=document.getElementById(id);sec.classList.add('active');sec.style.animation='none';requestAnimationFrame(()=>{sec.style.animation='';});}

function showMessage(cid,msg,type='error'){const c=document.getElementById(cid);c.innerHTML='<div class="message '+type+' show">'+msg+'</div>';setTimeout(()=>{c.innerHTML='';},3000);}

function clearErrors(fid){const f=document.getElementById(fid);f.querySelectorAll('.error-message').forEach(el=>el.classList.remove('show'));f.querySelectorAll('input').forEach(i=>i.classList.remove('error'));}

function setFieldError(iid,eid,msg){const i=document.getElementById(iid);const e=document.getElementById(eid);if(!i||!e)return;if(msg){i.classList.add('error');e.textContent=msg;e.classList.add('show');}else{i.classList.remove('error');e.textContent='';e.classList.remove('show');}}

function validateEmail(e){return/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e);}
function validatePassword(p){const l=p.length>=8,a=/[A-Za-z]/.test(p),n=/[0-9]/.test(p),s=/[^A-Za-z0-9]/.test(p);return{valid:l&&a&&n&&s};}

function getSignupValues(){return{username:document.getElementById('signupUsername').value.trim(),email:document.getElementById('signupEmail').value.trim(),password:document.getElementById('signupPassword').value,confirmPassword:document.getElementById('signupConfirmPassword').value};}

function validateSignup(v){const e={username:'',email:'',password:'',confirmPassword:''};if(!v.username)e.username='Username is required.';else if(v.username.length<3)e.username='Username must be at least 3 characters long.';if(!v.email)e.email='Email address is required.';else if(!validateEmail(v.email))e.email='Enter a valid email address.';else if(state.users.find(u=>u.email===v.email))e.email='This email is already registered.';if(!v.password)e.password='Password is required.';else{if(!validatePassword(v.password).valid)e.password='Use 8+ chars with letter, number, and special char.';}if(!v.confirmPassword)e.confirmPassword='Please confirm your password.';else if(v.password&&v.password!==v.confirmPassword)e.confirmPassword='Passwords do not match.';return e;}

function setLoading(bid,loading){const b=document.getElementById(bid);if(!b)return;if(loading){b.classList.add('btn-loading');b.dataset.originalText=b.textContent;b.textContent='Processing...';}else{b.classList.remove('btn-loading');if(b.dataset.originalText)b.textContent=b.dataset.originalText;}}

function signupHandler(e){e.preventDefault();clearErrors('signupForm');setLoading('signupSubmitBtn',true);const v=getSignupValues();const errs=validateSignup(v);const hasErr=Object.values(errs).some(m=>m);setFieldError('signupUsername','signupUsernameError',errs.username);setFieldError('signupEmail','signupEmailError',errs.email);setFieldError('signupPassword','signupPasswordError',errs.password);setFieldError('signupConfirmPassword','signupConfirmError',errs.confirmPassword);if(hasErr){setLoading('signupSubmitBtn',false);return;}setTimeout(()=>{const user={id:Date.now(),username:v.username,email:v.email,password:hashPassword(v.password),createdAt:new Date().toISOString()};state.users.push(user);saveUsers();savePublicProfile(user);showMessage('signupMessage','Account created! Redirecting to login...','success');document.getElementById('signupForm').reset();clearErrors('signupForm');setTimeout(()=>showSection('loginSection'),1500);setLoading('signupSubmitBtn',false);},600);}

function loginHandler(e){e.preventDefault();clearErrors('loginForm');setLoading('loginSubmitBtn',true);const email=document.getElementById('loginEmail').value.trim();const pw=document.getElementById('loginPassword').value;let hasErr=false;if(!validateEmail(email)){document.getElementById('loginEmailError').textContent='Please enter a valid email.';document.getElementById('loginEmailError').classList.add('show');document.getElementById('loginEmail').classList.add('error');hasErr=true;}if(!pw){document.getElementById('loginPasswordError').textContent='Password is required.';document.getElementById('loginPasswordError').classList.add('show');document.getElementById('loginPassword').classList.add('error');hasErr=true;}if(hasErr){setLoading('loginSubmitBtn',false);return;}const user=state.users.find(u=>u.email===email&&u.password===hashPassword(pw));setTimeout(()=>{if(user){state.currentUser=user;saveCurrentUser();showMessage('loginMessage','Login successful!','success');updateAuthUI();updateUserGreeting();setTimeout(()=>{showSection('dashboardSection');startAutoSave();},900);}else{showMessage('loginMessage','Invalid email or password.','error');}setLoading('loginSubmitBtn',false);},550);}

function logout(){state.currentUser=null;saveCurrentUser();updateAuthUI();document.getElementById('textInput').value='';state.typingStartTime=null;state.history=[];state.wpmDataPoints=[];state.keystrokeMap={};stopAutoSave();stopAmbientAudio();if(state.focusModeActive)toggleFocusMode();updateStats();renderHistory();showSection('loginSection');}

/* ===== STREAK ===== */
function loadStreak(){const s=localStorage.getItem(STREAK_KEY);if(!s){document.getElementById('streakDays').textContent='0 days';document.getElementById('lastActiveLabel').textContent='Never';return;}const d=JSON.parse(s);document.getElementById('streakDays').textContent=d.streak+' days';document.getElementById('lastActiveLabel').textContent=d.lastActive;renderStreakBadges(d.streak);}

function updateStreak(){const today=new Date();const ts=today.toISOString().slice(0,10);let sd={streak:0,lastDate:null,lastActive:'Never'};const s=localStorage.getItem(STREAK_KEY);if(s)sd=JSON.parse(s);if(sd.lastDate!==ts){if(sd.lastDate){const diff=Math.round((today-new Date(sd.lastDate))/(86400000));sd.streak=diff===1?sd.streak+1:1;}else sd.streak=1;sd.lastDate=ts;}sd.lastActive=today.toLocaleString();localStorage.setItem(STREAK_KEY,JSON.stringify(sd));document.getElementById('streakDays').textContent=sd.streak+' days';document.getElementById('lastActiveLabel').textContent=sd.lastActive;renderStreakBadges(sd.streak);checkStreakThemes(sd.streak);}

function renderStreakBadges(streak){const c=document.getElementById('streakBadges');if(!c)return;let h='';if(streak>=3)h+='<span class="badge-icon" title="3-day streak">🥉</span>';if(streak>=7)h+='<span class="badge-icon" title="7-day streak">🥈</span>';if(streak>=14)h+='<span class="badge-icon" title="14-day streak">🥇</span>';if(streak>=30)h+='<span class="badge-icon" title="30-day streak">🏆</span>';c.innerHTML=h;}

/* ===== THEMES ===== */
const MILESTONE_THEMES=[
  {days:3,id:'ocean',name:'Ocean',gradient:'linear-gradient(135deg,#0ea5e9,#06b6d4)',accent:'#0ea5e9'},
  {days:7,id:'sunset',name:'Sunset',gradient:'linear-gradient(135deg,#f97316,#ef4444)',accent:'#f97316'},
  {days:14,id:'forest',name:'Forest',gradient:'linear-gradient(135deg,#22c55e,#15803d)',accent:'#22c55e'},
  {days:30,id:'aurora',name:'Aurora',gradient:'linear-gradient(135deg,#a855f7,#3b82f6,#22c55e)',accent:'#a855f7'}
];

function checkStreakThemes(streak){
  let u=JSON.parse(localStorage.getItem(THEMES_KEY)||'["default"]');
  let changed=false;
  MILESTONE_THEMES.forEach(t=>{if(streak>=t.days&&!u.includes(t.id)){u.push(t.id);changed=true;}});
  if(changed)localStorage.setItem(THEMES_KEY,JSON.stringify(u));
  renderThemePicker();
}

function renderThemePicker(){
  const c=document.getElementById('themeList');if(!c)return;
  const u=JSON.parse(localStorage.getItem(THEMES_KEY)||'["default"]');
  const cur=localStorage.getItem('tometick_activeTheme')||'default';
  let h='<div class="theme-swatch '+(cur==='default'?'active':'')+'" data-theme-id="default"><div class="swatch-color" style="background:linear-gradient(135deg,#6366f1,#ec4899)"></div><span>Default</span></div>';
  MILESTONE_THEMES.forEach(t=>{
    const unlocked=u.includes(t.id);
    h+='<div class="theme-swatch '+(cur===t.id?'active':'')+(unlocked?'':' theme-locked')+'" data-theme-id="'+t.id+'">';
    h+='<div class="swatch-color" style="background:'+t.gradient+'"></div>';
    h+='<span>'+t.name+(unlocked?'':' ('+t.days+'d)')+'</span></div>';
  });
  c.innerHTML=h;
  c.querySelectorAll('.theme-swatch:not(.theme-locked)').forEach(sw=>{
    sw.addEventListener('click',()=>{
      const tid=sw.dataset.themeId;
      localStorage.setItem('tometick_activeTheme',tid);
      applyEditorTheme(tid);
      c.querySelectorAll('.theme-swatch').forEach(s=>s.classList.remove('active'));
      sw.classList.add('active');
    });
  });
}

function applyEditorTheme(tid){
  const ss=document.querySelector('.speed-section');
  const title=document.querySelector('.dashboard-header h1');
  const root=document.documentElement;
  if(tid==='default'){
    root.style.setProperty('--theme-accent','linear-gradient(135deg,#6366f1,#ec4899)');
    if(ss)ss.style.background='';
    if(title)title.style.background='';
  }else{
    const t=MILESTONE_THEMES.find(m=>m.id===tid);
    if(!t)return;
    root.style.setProperty('--theme-accent',t.gradient);
    if(ss)ss.style.background=t.gradient;
    if(title){title.style.background=t.gradient;title.style.backgroundClip='text';title.style.webkitBackgroundClip='text';}
  }
}

/* ===== STATS ===== */
function updateStats(){const text=document.getElementById('textInput').value;const wc=text.trim().split(/\s+/).filter(w=>w.length>0).length;const cc=text.length;const sentences=text.split(/[.!?]+/).filter(s=>s.trim().length>0).length;const paragraphs=text.split(/\n\n+/).filter(p=>p.trim().length>0).length;
document.getElementById('wordCount').textContent=wc;document.getElementById('charTotal').textContent=cc;document.getElementById('sentenceCount').textContent=sentences;document.getElementById('paragraphCount').textContent=paragraphs;document.getElementById('charCount').textContent=cc+' characters';
document.getElementById('readingTime').textContent=(wc===0?'0':Math.max(1,Math.ceil(wc/238)))+' min read';
if(text.length>0&&!state.typingStartTime){state.typingStartTime=Date.now();updateStreak();}
let currentWpm=0;if(state.typingStartTime){const em=(Date.now()-state.typingStartTime)/(60000);currentWpm=em>0?Math.round(wc/em):0;document.getElementById('wpm').textContent=currentWpm;document.getElementById('cpm').textContent=em>0?Math.round(cc/em):0;}else{document.getElementById('wpm').textContent=0;document.getElementById('cpm').textContent=0;}
if(state.typingStartTime&&wc>0){state.wpmDataPoints.push({time:Math.round((Date.now()-state.typingStartTime)/1000),wpm:currentWpm});if(state.wpmDataPoints.length>120)state.wpmDataPoints.shift();updateWpmChart();}
updateHistory(wc,cc);updateGhostText();updateRhythm(text);
clearTimeout(state.vocabDebounceTimer);state.vocabDebounceTimer=setTimeout(()=>analyzeVocabulary(text),1500);
clearTimeout(state.toneDebounceTimer);state.toneDebounceTimer=setTimeout(()=>analyzeTone(text),2000);}

function updateHistory(w,c){if(w===0&&c===0)return;const ts=new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});state.history.unshift({time:ts,words:w,chars:c,id:Date.now()});state.history=state.history.slice(0,10);renderHistory();}

function renderHistory(){const c=document.getElementById('historyList');if(state.history.length===0){c.innerHTML='<div class="history-empty">No typing activity yet</div>';return;}c.innerHTML=state.history.map(e=>'<div class="history-item"><span>'+e.time+'</span><div><strong>'+e.words+' words</strong> | '+e.chars+' chars</div></div>').join('');}

function clearText(){document.getElementById('textInput').value='';state.typingStartTime=null;state.history=[];state.wpmDataPoints=[];state.keystrokeMap={};updateStats();renderHistory();if(state.wpmChartInstance)state.wpmChartInstance.destroy();state.wpmChartInstance=null;document.getElementById('ghostTextOverlay').textContent='';document.getElementById('errorHighlightOverlay').innerHTML='';}

async function copyText(){const t=document.getElementById('textInput').value;if(!t)return;try{await navigator.clipboard.writeText(t);}catch(e){}}

/* ===== TEMPLATES ===== */
const TEMPLATES={email:'Dear [Name],\n\nI hope this message finds you well. I am writing to follow up on [topic].\n\nBest regards,\n[Your Name]',blog:"In today's fast-paced world, writing efficiently is more important than ever. In this article, we will explore practical tips to improve your typing speed and clarity.",essay:'Writing plays a crucial role in how we communicate ideas. By developing strong writing habits, individuals can express complex thoughts with precision and confidence.',cover_letter:'Dear Hiring Manager,\n\n[Opening: State the position and where you found it.]\n\n[Body 1: Your most relevant qualifications.]\n\n[Body 2: Why you fit the company culture.]\n\n[Closing: Thank the reader, express enthusiasm.]\n\nSincerely,\n[Your Name]',social_media:'🔥 [Attention-grabbing hook]\n\n[Main message - concise and engaging]\n\n✅ Key point 1\n✅ Key point 2\n✅ Key point 3\n\n[Call to action]\n\n#hashtag1 #hashtag2 #hashtag3',meeting_agenda:'Meeting Agenda\n================\nDate: [Date] | Time: [Time]\nAttendees: [Names]\n\n1. Opening & Roll Call (5 min)\n2. Review Previous Action Items (10 min)\n3. [Topic 1] (15 min)\n4. [Topic 2] (15 min)\n5. Open Discussion (10 min)\n6. Action Items & Next Steps (5 min)',product_description:'[Product Name]\n\n[One-line tagline]\n\nOverview:\n[2-3 sentences about what it is and who it\'s for.]\n\nKey Features:\n• [Feature 1]: [Benefit]\n• [Feature 2]: [Benefit]\n• [Feature 3]: [Benefit]\n\nWhy Choose Us?\n[Unique value proposition paragraph]\n\nPrice: $[Amount]',creative_story:'The last light of evening bled through the curtains as [Character] stood at the threshold of a decision that would change everything.\n\n[They] had always known this moment would come — the kind that splits a life into before and after.\n\n"[Opening dialogue]," [they] whispered.\n\nOutside, the world carried on as if nothing had shifted. And somewhere in the distance, a clock struck [time], marking the beginning of...\n\n[Continue your story here]'};

function applyTemplate(v){const ta=document.getElementById('textInput');if(v==='none'||v===''){ta.value='';updateStats();return;}if(TEMPLATES[v]){ta.value=TEMPLATES[v];if(state.ghostTextActive)state.ghostTextSource=TEMPLATES[v];updateStats();}}

/* ===== SPEECH ===== */
function initSpeech(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){const b=document.getElementById('voiceBtn');b.textContent='Dictation (unsupported)';b.disabled=true;return;}const r=new SR();r.continuous=true;r.interimResults=true;r.lang='en-US';r.addEventListener('result',(e)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;const ta=document.getElementById('textInput');ta.value+=(ta.value.endsWith(' ')||ta.value===''?'':' ')+t;updateStats();});r.addEventListener('end',()=>{state.isDictating=false;document.getElementById('voiceBtn').textContent='Dictation';});state.speechRecognition=r;}

function toggleDictation(){if(!state.speechRecognition)return;const b=document.getElementById('voiceBtn');if(state.isDictating){state.speechRecognition.stop();state.isDictating=false;b.textContent='Dictation';}else{state.speechRecognition.start();state.isDictating=true;b.textContent='Stop Dictation';}}

function escapeHtml(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML;}
