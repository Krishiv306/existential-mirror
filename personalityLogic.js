// Personality Logic Engine for Existential Mirror

const PersonalityEngine = {
  
  // Calculate personality match from mirror test answers
  calculateMatch(answers, questions) {
    const scores = {
      kafka: 0, dostoevsky: 0, jung: 0, nietzsche: 0,
      plath: 0, camus: 0, rumi: 0, jaunelia: 0, kierkegaard: 0
    };

    questions.forEach((q, i) => {
      const answer = answers[q.id];
      if (answer === undefined) return;
      const choiceIndex = answer; // 0 or 1
      Object.entries(q.weights).forEach(([thinker, w]) => {
        if (scores[thinker] !== undefined) {
          scores[thinker] += w[choiceIndex] || 0;
        }
      });
    });

    // Find the highest scoring thinker
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return {
      primary: sorted[0][0],
      secondary: sorted[1][0],
      scores
    };
  },

  // Detect mood from free text using keyword analysis
  detectMood(text) {
    if (!text) return 'neutral';
    const lower = text.toLowerCase();
    
    const moodKeywords = {
      sad: ['sad', 'cry', 'crying', 'tears', 'grief', 'loss', 'miss', 'hurt', 'pain', 'broken', 'empty', 'hollow', 'depressed', 'depression', 'miserable', 'hopeless', 'devastated', 'heartbreak', 'numb'],
      anxious: ['anxious', 'anxiety', 'worry', 'worried', 'nervous', 'scared', 'fear', 'panic', 'overwhelm', 'stress', 'stressed', 'tension', 'dread', 'uneasy', 'restless'],
      hopeful: ['hope', 'hopeful', 'better', 'excited', 'looking forward', 'happy', 'joy', 'grateful', 'thankful', 'good', 'great', 'wonderful', 'amazing', 'beautiful', 'love', 'optimistic', 'positive'],
      lonely: ['lonely', 'alone', 'isolated', 'no one', 'nobody', 'by myself', 'solitude', 'abandoned', 'invisible', 'unheard', 'misunderstood'],
      angry: ['angry', 'anger', 'furious', 'rage', 'frustrated', 'irritated', 'annoyed', 'hate', 'resentment', 'bitter', 'mad'],
      confused: ['confused', 'lost', 'don\'t know', 'uncertain', 'unclear', 'unsure', 'doubt', 'questioning', 'searching', 'wandering', 'directionless']
    };

    const moodScores = {};
    Object.entries(moodKeywords).forEach(([mood, words]) => {
      moodScores[mood] = words.filter(w => lower.includes(w)).length;
    });

    const topMood = Object.entries(moodScores).sort((a, b) => b[1] - a[1])[0];
    return topMood[1] > 0 ? topMood[0] : 'neutral';
  },

  // Get mood color palette
  getMoodTheme(mood) {
    const themes = {
      sad: {
        primary: '#4A6FA5',
        secondary: '#8BA7C7',
        accent: '#C0D4E8',
        bg: 'radial-gradient(ellipse at center, #0d1520 0%, #060d16 100%)',
        particle: '#4A6FA5'
      },
      anxious: {
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        accent: '#C4B5FD',
        bg: 'radial-gradient(ellipse at center, #130d1f 0%, #080510 100%)',
        particle: '#8B5CF6'
      },
      hopeful: {
        primary: '#D4A853',
        secondary: '#E8C97A',
        accent: '#F5E4B0',
        bg: 'radial-gradient(ellipse at center, #1a1508 0%, #0d0a04 100%)',
        particle: '#D4A853'
      },
      lonely: {
        primary: '#6B7FA3',
        secondary: '#9AAAC7',
        accent: '#C5CEDF',
        bg: 'radial-gradient(ellipse at center, #0e1018 0%, #07080f 100%)',
        particle: '#6B7FA3'
      },
      angry: {
        primary: '#C0392B',
        secondary: '#E74C3C',
        accent: '#F1948A',
        bg: 'radial-gradient(ellipse at center, #1a0808 0%, #0d0404 100%)',
        particle: '#C0392B'
      },
      confused: {
        primary: '#7F8C8D',
        secondary: '#AEB6BF',
        accent: '#D5D8DC',
        bg: 'radial-gradient(ellipse at center, #111213 0%, #080909 100%)',
        particle: '#7F8C8D'
      },
      neutral: {
        primary: '#C9A96E',
        secondary: '#D4B896',
        accent: '#E8D5B7',
        bg: 'radial-gradient(ellipse at center, #0f0d0a 0%, #060504 100%)',
        particle: '#C9A96E'
      }
    };
    return themes[mood] || themes.neutral;
  },

  // Generate philosophical reflection based on mood (fallback without API)
  getLocalReflection(mood, name, input) {
    const reflections = {
      sad: [
        `${name}, the weight you carry tonight is real. But remember — depth of feeling is not weakness. It is the mark of someone who has loved something enough to grieve it.`,
        `There is a particular kind of courage in continuing to feel when the world asks you to numb yourself. You are brave in ways you don't yet see, ${name}.`,
        `Dostoevsky wrote that beauty will save the world. Tonight, your honesty is its own kind of beauty.`
      ],
      anxious: [
        `${name}, your mind is building futures it cannot control. But you are only ever responsible for this one breath, this one moment. The rest is speculation.`,
        `Kierkegaard called anxiety "the dizziness of freedom." You feel this because you are deeply free — and that is terrifying and magnificent at once.`,
        `The storm inside you is not permanent weather. It is a passing system. You have clear skies in your history. They will return.`
      ],
      hopeful: [
        `${name}, this lightness you feel — protect it fiercely. Not everything deserves to dim it.`,
        `Rumi said the wound is where the light enters. You have clearly found your light. Let it expand.`,
        `There is something luminous in someone who chooses hope despite knowing better. That is not naivety. That is radical courage.`
      ],
      lonely: [
        `${name}, even the stars burn in isolation. It doesn't make their light any less real — or any less needed.`,
        `Loneliness is sometimes the universe's way of asking you to finally meet yourself. Who are you, alone?`,
        `Kafka understood this: the deepest connections often happen in silence, across impossible distances. You are not as alone as you feel.`
      ],
      angry: [
        `${name}, your anger is information. It knows something your rational mind hasn't caught up to yet. What is it trying to tell you?`,
        `There is a difference between anger as destruction and anger as signal. Yours sounds like the second. Honor it — then redirect it.`,
        `Nietzsche said: "That which does not kill us makes us stronger." Your fire, directed wisely, will forge something remarkable.`
      ],
      confused: [
        `${name}, confusion is not the absence of intelligence. It is intelligence confronting complexity. You are in the right place.`,
        `The fog you are in is not permanent. Camus walked through his own fog and found the Mediterranean sun on the other side. Keep walking.`,
        `Not knowing is the most honest human state. Certainty is often just fear wearing a confident mask.`
      ],
      neutral: [
        `${name}, ordinary days are the substance of a life. Not every moment needs to be significant to be meaningful.`,
        `In the space between highs and lows, the self quietly consolidates. Today may be that day for you.`,
        `Even a still lake reflects the sky perfectly. Stillness is not emptiness. It is clarity.`
      ]
    };

    const list = reflections[mood] || reflections.neutral;
    return list[Math.floor(Math.random() * list.length)];
  }
};

window.PersonalityEngine = PersonalityEngine;