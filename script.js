// ═══════════════════════════════════════════════
//   EXISTENTIAL MIRROR — MAIN SCRIPT
// ═══════════════════════════════════════════════

const App = {
  data: {},
  questionsData: null,
  quotesData: null,
  currentOnboardingIndex: 0,
  mirrorAnswers: {},
  currentMirrorIndex: 0,
  currentMood: 'neutral',

  async init() {
    await this.loadData();
    this.initCursor();
    this.initParticles();
    this.checkReturningUser();
  },

  async loadData() {
    try {
      const [qRes, qoRes] = await Promise.all([
        fetch('questions.json'),
        fetch('quotes.json')
      ]);
      this.questionsData = await qRes.json();
      this.quotesData = await qoRes.json();
    } catch (e) {
      console.warn('JSON load failed, using inline fallback');
      this.questionsData = FALLBACK_QUESTIONS;
      this.quotesData = FALLBACK_QUOTES;
    }
  },

  checkReturningUser() {
    const saved = localStorage.getItem('existential_mirror_user');
    if (saved) {
      this.data = JSON.parse(saved);
      this.showScreen('home');
      this.buildHomeScreen();
      document.getElementById('app-nav').classList.add('visible');
      document.getElementById('mood-bar').classList.add('visible');
    } else {
      this.showScreen('landing');
    }
  },

  // ── Screen Management ──────────────────────
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
    });
    const target = document.getElementById(`screen-${name}`);
    if (target) {
      target.classList.add('active');
    }
  },

  // ── Cursor ────────────────────────────────
  initCursor() {
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursor-ring');
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
    });

    const animRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(animRing);
    };
    animRing();

    document.querySelectorAll('button, a, .choice-btn, .mirror-option, .nav-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'translate(-50%,-50%) scale(2)';
        ring.style.transform = 'translate(-50%,-50%) scale(1.5)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'translate(-50%,-50%) scale(1)';
        ring.style.transform = 'translate(-50%,-50%) scale(1)';
      });
    });
  },

  // ── Particles ─────────────────────────────
  initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let W = window.innerWidth, H = window.innerHeight;

    canvas.width = W; canvas.height = H;
    window.addEventListener('resize', () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    const getColor = () => getComputedStyle(document.documentElement).getPropertyValue('--mood-primary').trim() || '#c9a96e';

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        a: Math.random() * 0.5 + 0.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const color = getColor();
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.a;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
  },

  // ── Mood System ────────────────────────────
  setMood(mood) {
    if (this.currentMood === mood) return;
    this.currentMood = mood;
    document.body.className = `mood-${mood}`;
    // Update CSS variables via inline style to trigger transitions
    const themes = {
      sad:     { primary: '#4A6FA5', secondary: '#8BA7C7', bg: '#0d1520' },
      anxious: { primary: '#8B5CF6', secondary: '#A78BFA', bg: '#130d1f' },
      hopeful: { primary: '#D4A853', secondary: '#E8C97A', bg: '#1a1508' },
      lonely:  { primary: '#6B7FA3', secondary: '#9AAAC7', bg: '#0e1018' },
      angry:   { primary: '#C0392B', secondary: '#E74C3C', bg: '#1a0808' },
      confused:{ primary: '#7F8C8D', secondary: '#AEB6BF', bg: '#111213' },
      neutral: { primary: '#C9A96E', secondary: '#D4B896', bg: '#0f0d0a' }
    };
    const t = themes[mood] || themes.neutral;
    const root = document.documentElement;
    root.style.setProperty('--mood-primary', t.primary);
    root.style.setProperty('--mood-secondary', t.secondary);
  },

  // ── Typewriter Effect ──────────────────────
  typewrite(el, text, speed = 40) {
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const tick = () => {
        if (i < text.length) {
          el.textContent += text[i++];
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      };
      tick();
    });
  },

  // ══════════════════════════════════════════
  //  LANDING
  // ══════════════════════════════════════════
  beginReflection() {
    this.showScreen('onboarding');
    this.renderOnboardingQuestion(0);
  },

  // ══════════════════════════════════════════
  //  ONBOARDING
  // ══════════════════════════════════════════
  renderOnboardingQuestion(index) {
    const q = this.questionsData.onboarding[index];
    const total = this.questionsData.onboarding.length;
    if (!q) return;

    const container = document.getElementById('onboarding-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';

    setTimeout(() => {
      document.getElementById('q-number').textContent = `${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
      document.getElementById('q-text').textContent = q.question;
      document.getElementById('q-input-area').innerHTML = '';
      document.getElementById('q-studying').textContent = index > 3 ? '— studying your responses —' : '';

      const area = document.getElementById('q-input-area');
      if (q.type === 'text') {
        area.innerHTML = `<input class="question-input" id="q-input" type="text" placeholder="${q.placeholder}" autocomplete="off">`;
        const inp = area.querySelector('#q-input');
        inp.value = this.data[q.id] || '';
        setTimeout(() => inp.focus(), 300);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') this.nextOnboarding(); });
      } else if (q.type === 'textarea') {
        area.innerHTML = `<textarea class="question-input" id="q-input" placeholder="${q.placeholder}" rows="3"></textarea>`;
        const ta = area.querySelector('#q-input');
        ta.value = this.data[q.id] || '';
        setTimeout(() => ta.focus(), 300);
      } else if (q.type === 'choice') {
        area.innerHTML = `<div class="choice-options">${
          q.options.map((opt, i) =>
            `<button class="choice-btn ${this.data[q.id] === opt ? 'selected' : ''}" onclick="App.selectChoice('${opt}', this)">${opt}</button>`
          ).join('')
        }</div>`;
      }

      document.getElementById('q-progress').style.width = `${((index) / total) * 100}%`;

      container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 300);
  },

  selectChoice(value, btn) {
    btn.closest('.choice-options').querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const q = this.questionsData.onboarding[this.currentOnboardingIndex];
    this.data[q.id] = value;
    setTimeout(() => this.nextOnboarding(), 400);
  },

  nextOnboarding() {
    const q = this.questionsData.onboarding[this.currentOnboardingIndex];
    const input = document.getElementById('q-input');
    if (input) {
      const val = input.value.trim();
      if (!val) {
        input.style.borderBottomColor = 'var(--crimson)';
        return;
      }
      this.data[q.id] = val;
    }
    if (!this.data[q.id]) return;

    this.currentOnboardingIndex++;
    if (this.currentOnboardingIndex >= this.questionsData.onboarding.length) {
      this.finishOnboarding();
    } else {
      this.renderOnboardingQuestion(this.currentOnboardingIndex);
    }
  },

  prevOnboarding() {
    if (this.currentOnboardingIndex > 0) {
      this.currentOnboardingIndex--;
      this.renderOnboardingQuestion(this.currentOnboardingIndex);
    }
  },

  finishOnboarding() {
    localStorage.setItem('existential_mirror_user', JSON.stringify(this.data));
    document.getElementById('app-nav').classList.add('visible');
    document.getElementById('mood-bar').classList.add('visible');
    this.showScreen('loading');
    this.showLoadingText('Mapping your consciousness...');
    setTimeout(() => {
      this.buildHomeScreen();
      this.showScreen('home');
    }, 2200);
  },

  showLoadingText(msg) {
    document.getElementById('loading-message').textContent = msg;
  },

  // ══════════════════════════════════════════
  //  HOME DASHBOARD
  // ══════════════════════════════════════════
  buildHomeScreen() {
    const name = this.data.name || 'Wanderer';
    document.getElementById('greeting-name').innerHTML = `Welcome back, <span class="glow">${name}.</span>`;

    const hour = new Date().getHours();
    let timeGreet = hour < 5 ? 'In the small hours...' : hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : hour < 21 ? 'Good evening.' : 'Tonight.';
    document.getElementById('greeting-time').textContent = timeGreet;

    const dailyQs = this.questionsData.daily;
    document.getElementById('daily-question').textContent = dailyQs[Math.floor(Math.random() * dailyQs.length)];
    document.getElementById('nav-link-home').classList.add('active');
  },

  async analyzeDailyEntry() {
    const input = document.getElementById('daily-input').value.trim();
    if (!input) return;

    const mood = PersonalityEngine.detectMood(input);
    this.setMood(mood);

    const responseEl = document.getElementById('ai-response');
    const textEl = document.getElementById('ai-response-text');
    const moodEl = document.getElementById('ai-response-mood');

    responseEl.classList.add('visible');
    textEl.textContent = '';
    moodEl.textContent = `Detected resonance: ${mood}`;

    // Try OpenAI API first, fall back to local
    const reflection = await this.getAIReflection(input, mood);
    await this.typewrite(textEl, reflection, 25);
  },

  async getAIReflection(input, mood) {
    const name = this.data.name || 'wanderer';
    const apiKey = localStorage.getItem('em_openai_key');

    if (apiKey) {
      try {
        const prompt = `You are a deeply philosophical, poetic, and emotionally intelligent reflection system called "Existential Mirror." 
The user is named ${name}. They wrote: "${input}"
Their detected emotional state is: ${mood}.
Respond with 2-3 sentences that feel like a profound literary reflection — philosophical, comforting, poetic, and deeply personal. 
Draw from existentialist philosophy, poetry, or literature. Do NOT be generic. Make them feel truly seen. Speak directly to them.`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.85
          })
        });
        if (res.ok) {
          const data = await res.json();
          return data.choices[0].message.content.trim();
        }
      } catch (e) { /* fallback */ }
    }

    return PersonalityEngine.getLocalReflection(mood, name, input);
  },

  setApiKey() {
    const key = prompt('Enter your OpenAI API key (stored locally, never sent to our servers):');
    if (key && key.startsWith('sk-')) {
      localStorage.setItem('em_openai_key', key);
      alert('API key saved. Your reflections will now be powered by GPT-4.');
    }
  },

  // ══════════════════════════════════════════
  //  MIRROR TEST
  // ══════════════════════════════════════════
  startMirrorTest() {
    this.mirrorAnswers = {};
    this.currentMirrorIndex = 0;
    document.getElementById('mirror-intro').style.display = 'none';
    document.getElementById('mirror-question-block').style.display = 'block';
    this.renderMirrorQuestion(0);
  },

  renderMirrorQuestion(index) {
    const questions = this.questionsData.mirror;
    const q = questions[index];
    if (!q) return;

    const block = document.getElementById('mirror-question-block');
    block.style.opacity = '0';
    block.style.transform = 'translateY(30px)';

    setTimeout(() => {
      document.getElementById('mirror-q-num').textContent = `${String(index+1).padStart(2,'0')} · ${String(questions.length).padStart(2,'0')}`;
      document.getElementById('mirror-q-text').textContent = q.question;
      document.getElementById('mirror-options').innerHTML = q.options.map((opt, i) =>
        `<button class="mirror-option" onclick="App.selectMirrorOption(${i}, this)">${opt}</button>`
      ).join('');
      document.getElementById('mirror-prog-fill').style.width = `${(index / questions.length) * 100}%`;

      block.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      block.style.opacity = '1';
      block.style.transform = 'translateY(0)';
    }, 350);
  },

  selectMirrorOption(choice, btn) {
    document.querySelectorAll('.mirror-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const q = this.questionsData.mirror[this.currentMirrorIndex];
    this.mirrorAnswers[q.id] = choice;

    setTimeout(() => {
      this.currentMirrorIndex++;
      if (this.currentMirrorIndex >= this.questionsData.mirror.length) {
        this.finishMirrorTest();
      } else {
        this.renderMirrorQuestion(this.currentMirrorIndex);
      }
    }, 600);
  },

  finishMirrorTest() {
    this.showScreen('loading');
    this.showLoadingText('Consulting the mirror...');

    setTimeout(() => {
      const result = PersonalityEngine.calculateMatch(this.mirrorAnswers, this.questionsData.mirror);
      this.data.mirrorResult = result;
      localStorage.setItem('existential_mirror_user', JSON.stringify(this.data));
      this.buildResultScreen(result.primary);
      this.showScreen('result');
    }, 2500);
  },

  buildResultScreen(thinkerKey) {
    const thinker = this.quotesData.thinkers[thinkerKey];
    if (!thinker) return;

    document.getElementById('result-thinker').textContent = thinker.name;
    document.getElementById('result-tagline').textContent = thinker.tagline;
    document.getElementById('result-description').textContent = thinker.description;
    document.getElementById('result-profile').textContent = thinker.profile;
    document.getElementById('result-quote').textContent = `"${thinker.quote}"`;

    // Set accent color for this thinker
    document.documentElement.style.setProperty('--accent', thinker.color);
    document.documentElement.style.setProperty('--mood-primary', thinker.color);
  },

  goHome() {
    document.getElementById('app-nav').classList.add('visible');
    this.buildHomeScreen();
    this.showScreen('home');
    document.documentElement.style.setProperty('--accent', '#c9a96e');
    document.documentElement.style.setProperty('--mood-primary', '#c9a96e');
  },

  goToMirror() {
    document.getElementById('mirror-intro').style.display = 'block';
    document.getElementById('mirror-question-block').style.display = 'none';
    this.showScreen('mirror');
  },

  resetUser() {
    if (confirm('Are you sure you want to begin again?')) {
      localStorage.removeItem('existential_mirror_user');
      localStorage.removeItem('em_openai_key');
      location.reload();
    }
  }
};

// ── Fallback Data (if JSON files fail) ────────
const FALLBACK_QUESTIONS = {
  onboarding: [
    { id: "name", question: "What do they call you?", type: "text", placeholder: "Your name..." },
    { id: "age", question: "How many years have you carried this weight?", type: "text", placeholder: "Your age..." },
    { id: "occupation", question: "What do you do with your days?", type: "text", placeholder: "Your occupation..." },
    { id: "awake", question: "What keeps you awake at 3am?", type: "textarea", placeholder: "The thoughts that won't sleep..." },
    { id: "fear", question: "What do you fear most?", type: "textarea", placeholder: "Speak it into the dark..." },
    { id: "meaning", question: "What gives your life meaning?", type: "textarea", placeholder: "What anchors you..." },
    { id: "happy", question: "Are you happy?", type: "choice", options: ["Yes, genuinely", "Sometimes", "I'm trying to be", "Not really", "I don't know anymore"] },
    { id: "understood", question: "Do you often feel understood?", type: "choice", options: ["Always", "By some", "Rarely", "Never", "I stopped expecting it"] },
    { id: "oneSentence", question: "Describe yourself in one sentence.", type: "textarea", placeholder: "One truth about you..." }
  ],
  mirror: [
    { id: "m1", question: "Would you rather know the painful truth, or live in a comfortable illusion?", options: ["The truth, always", "The illusion, if it's beautiful enough"], weights: { kafka: [2,0], camus: [1,0], nietzsche: [1,0], jung: [0,1], rumi: [0,2] } },
    { id: "m2", question: "Is loneliness a kind of freedom?", options: ["Yes — solitude is sovereignty", "No — connection is everything"], weights: { kafka: [2,0], kierkegaard: [2,0], dostoevsky: [0,2], rumi: [0,2], plath: [1,0] } },
    { id: "m3", question: "Do people love you — or the version of you they invented?", options: ["The version they invented", "Me, truly"], weights: { kafka: [2,0], plath: [2,0], jung: [1,0], rumi: [0,2], jaunelia: [1,0] } },
    { id: "m4", question: "If suffering disappeared, would art survive?", options: ["Art would die with suffering", "Art transcends pain"], weights: { nietzsche: [2,0], dostoevsky: [2,0], camus: [1,0], rumi: [0,1], plath: [1,0] } },
    { id: "m5", question: "Which speaks louder to you?", options: ["Reason and logic", "Emotion and instinct"], weights: { nietzsche: [1,0], camus: [1,0], jung: [0,2], rumi: [0,2], jaunelia: [0,1] } },
    { id: "m6", question: "Is the universe indifferent to human suffering?", options: ["Yes — we are alone in the cosmos", "No — meaning is woven into existence"], weights: { camus: [2,0], nietzsche: [1,0], kafka: [1,0], rumi: [0,2], dostoevsky: [0,1] } },
    { id: "m7", question: "What defines a person more?", options: ["Their wounds", "Their choices"], weights: { plath: [2,0], kafka: [1,0], nietzsche: [0,2], camus: [0,1], jung: [1,1] } },
    { id: "m8", question: "Can you love someone you truly understand?", options: ["Understanding destroys romance", "True love requires full understanding"], weights: { jaunelia: [2,0], plath: [1,0], rumi: [0,2], dostoevsky: [0,2], kierkegaard: [1,0] } }
  ],
  daily: ["How heavy was today?", "What was one beautiful thing that happened?", "What was one painful thing?", "What emotion dominates you right now?", "Describe your thoughts tonight."]
};

const FALLBACK_QUOTES = {
  thinkers: {
    kafka: { name: "Franz Kafka", tagline: "You carry silent storms inside ordinary conversations.", description: "Like Kafka, you inhabit the gap between what is felt and what can be expressed. The labyrinth of your inner world is vast and deeply personal.", profile: "Introspective • Quietly tormented • Acutely observant", quote: "In the struggle between yourself and the world, second the world.", color: "#8B0000" },
    dostoevsky: { name: "Fyodor Dostoevsky", tagline: "You contain multitudes, and they argue with each other constantly.", description: "You are drawn to the extremes of human experience. Like Dostoevsky, you understand that the human soul is both wretched and transcendent.", profile: "Passionately empathetic • Morally complex • Intensely human", quote: "Pain and suffering are always inevitable for a large intelligence and a deep heart.", color: "#4A3728" },
    jung: { name: "Carl Jung", tagline: "Your dreams know more than your waking mind.", description: "You navigate life through symbols and the language of the unconscious. Like Jung, the shadow is not your enemy — it is your teacher.", profile: "Symbolically minded • Deeply introspective • Psychologically curious", quote: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", color: "#2C4A3E" },
    nietzsche: { name: "Friedrich Nietzsche", tagline: "You've looked into the abyss and dared it to blink first.", description: "You refuse comfortable certainties. Like Nietzsche, you believe meaning must be forged, not found.", profile: "Fiercely independent • Iconoclastic • Will-powered", quote: "He who has a why to live can bear almost any how.", color: "#1A1A2E" },
    plath: { name: "Sylvia Plath", tagline: "You feel everything at a frequency most people cannot hear.", description: "Your interior life is vivid, raw, and relentless. Like Plath, you transform pain into precision.", profile: "Acutely sensitive • Artistically channeled • Beautifully wounded", quote: "I am not resigned. I am not hopeless. I am furious.", color: "#3D0C11" },
    camus: { name: "Albert Camus", tagline: "You know life is absurd — and you've decided to love it anyway.", description: "Like Camus, you've confronted the silence of the universe and chosen defiance over despair.", profile: "Philosophically resilient • Warmly rebellious • Courageously present", quote: "One must imagine Sisyphus happy.", color: "#1B4332" },
    rumi: { name: "Jalal ad-Din Rumi", tagline: "You search for the divine in every human encounter.", description: "Like Rumi, your soul moves toward connection. You believe love is a spiritual force that reorganizes the universe.", profile: "Mystically inclined • Deeply loving • Poetically alive", quote: "Out beyond ideas of wrongdoing and rightdoing, there is a field. I'll meet you there.", color: "#5C3317" },
    jaunelia: { name: "Jaun Elia", tagline: "You love the most when you know it will break you.", description: "Like Jaun Elia, you find beauty not in happiness but in the exquisite ache of longing.", profile: "Romantically tragic • Philosophically nihilistic • Beautifully lost", quote: "میں بھی بہت عجیب ہوں — I am also very strange.", color: "#2D1B33" },
    kierkegaard: { name: "Søren Kierkegaard", tagline: "The leap of faith is taken in absolute darkness.", description: "Like Kierkegaard, you dwell in the anxiety of choice — that terrifying freedom of authoring your own existence.", profile: "Existentially anxious • Authenticity-seeking • Philosophically alone", quote: "Anxiety is the dizziness of freedom.", color: "#1C2951" }
  },
  moods: {
    neutral: ["You are here. That is never nothing.", "Stillness is not emptiness. It is the space between notes that makes music."],
    sad: ["The wound is the place where the light enters you. — Rumi", "You are not broken. You are mid-transformation."],
    anxious: ["You are not your thoughts. You are the one watching them.", "The present moment always survives. You are here."],
    hopeful: ["You are becoming. That is enough.", "Hope is not naive. It is radical courage."],
    lonely: ["Even stars burn in isolation and still illuminate the dark.", "Solitude is not loneliness. One is chosen."],
    angry: ["Anger is grief in its most honest form. What are you mourning?", "Your anger knows something your logic hasn't caught up to yet."],
    confused: ["Confusion is clarity's waiting room.", "Not knowing is the honest beginning of understanding."]
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());