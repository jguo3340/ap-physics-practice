// Runs the practice page (src/components/PracticeExam.astro). The questions are
// already in the page; this shows one at a time and keeps track of answers,
// marks, crossed-out choices, the timer, and the score.

interface QuestionState {
  picked?: string;
  crossed: Set<string>;
  marked: boolean;
  checked: boolean;
}

const CHECK_KEY = 'practice-check-as-you-go';
const COUNT_KEY = 'practice-question-count';
const COUNT_PRESETS = [5, 10, 20];

function readSetting(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSetting(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private windows can block storage; the setting still works for this visit.
  }
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// A random order, so a short set draws different questions each time.
function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const svg = (className: string, path: string) =>
  `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
const PIN = 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z';
const FLAG = 'M6 3h12v18l-6-4.5L6 21Z';

export function setUpPractice(exam: HTMLElement) {
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => exam.querySelector<T>(selector)!;
  const all = [...exam.querySelectorAll<HTMLElement>('[data-question]')];
  const reviews = new Map([...exam.querySelectorAll<HTMLElement>('[data-review]')].map((r) => [r.dataset.review!, r]));
  const topicNames: Record<string, string> = JSON.parse(exam.dataset.topics ?? '{}');
  const pace = Number(exam.dataset.pace);

  const timer = $('.timer');
  const clock = $('[data-clock]');
  const timeUp = $('[data-time-up]');
  const timerToggle = $<HTMLButtonElement>('[data-timer-toggle]');
  const checkSwitch = $<HTMLButtonElement>('[data-check-switch]');
  const deckLabel = $('[data-deck-label]');
  const allLink = $('[data-all-link]');
  const number = $('[data-number]');
  const mark = $<HTMLButtonElement>('[data-mark]');
  const markLabel = $('[data-mark-label]');
  const crossToggle = $<HTMLButtonElement>('[data-cross-mode]');
  const answered = $('[data-answered]');
  const counter = $('[data-counter]');
  const navToggle = $<HTMLButtonElement>('[data-nav-toggle]');
  const navMenu = $('#question-menu');
  const tiles = $('[data-tiles]');
  const back = $<HTMLButtonElement>('[data-back]');
  const next = $<HTMLButtonElement>('[data-next]');
  const results = $('[data-results]');
  const setup = $('[data-setup]');
  const setupTopic = $('[data-setup-topic]');
  const countOptions = $('[data-count-options]');
  const countInput = $<HTMLInputElement>('[data-count-input]');
  const countOf = $('[data-count-of]');
  const setupNote = $('[data-setup-note]');
  const begin = $<HTMLButtonElement>('[data-begin]');

  let pool: HTMLElement[] = [];
  let poolLabel = 'All topics';
  let deck: HTMLElement[] = [];
  let index = 0;
  let states = new Map<string, QuestionState>();
  let remaining = 0;
  let startedAt = 0;
  let tick: number | undefined;
  let checkAsYouGo = readSetting(CHECK_KEY) === 'on';

  const current = () => deck[index];
  const stateOf = (q: HTMLElement) => states.get(q.dataset.id!)!;

  // ---------- popovers ----------

  const popovers = new Map<string, HTMLElement>();
  for (const id of ['directions', 'equations', 'question-menu']) {
    const el = exam.querySelector<HTMLElement>(`#${id}`);
    if (el) popovers.set(id, el);
  }

  function setOpen(id: string, open: boolean) {
    const el = popovers.get(id);
    if (!el) return;
    el.hidden = !open;
    for (const button of exam.querySelectorAll(`[aria-controls="${id}"]`)) {
      button.setAttribute('aria-expanded', String(open));
    }
  }

  function closeAll(except?: string) {
    for (const id of popovers.keys()) if (id !== except) setOpen(id, false);
  }

  for (const button of exam.querySelectorAll<HTMLElement>('[data-toggle]')) {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = button.dataset.toggle!;
      const open = popovers.get(id)?.hidden !== false;
      closeAll(id);
      setOpen(id, open);
    });
  }

  navToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = navMenu.hidden !== false;
    closeAll('question-menu');
    setOpen('question-menu', open);
  });

  for (const el of popovers.values()) el.addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });

  // ---------- timer ----------

  function renderClock() {
    clock.textContent = formatTime(remaining);
    timer.classList.toggle('is-up', remaining === 0);
    timeUp.hidden = remaining > 0;
  }

  function startTimer() {
    window.clearInterval(tick);
    remaining = Math.round(deck.length * pace);
    startedAt = Date.now();
    renderClock();
    tick = window.setInterval(() => {
      if (remaining > 0) remaining -= 1;
      renderClock();
      if (remaining === 0) window.clearInterval(tick);
    }, 1000);
  }

  timerToggle.addEventListener('click', () => {
    const hidden = !timer.classList.contains('is-hidden');
    timer.classList.toggle('is-hidden', hidden);
    timerToggle.textContent = hidden ? 'Show timer' : 'Hide timer';
    timerToggle.setAttribute('aria-pressed', String(hidden));
  });

  // ---------- check as I go ----------

  function renderSwitch() {
    checkSwitch.setAttribute('aria-checked', String(checkAsYouGo));
  }

  checkSwitch.addEventListener('click', () => {
    checkAsYouGo = !checkAsYouGo;
    writeSetting(CHECK_KEY, checkAsYouGo ? 'on' : 'off');
    renderSwitch();
    if (deck.length) renderQuestion(current());
  });

  // ---------- one question ----------

  function renderQuestion(q: HTMLElement) {
    const state = stateOf(q);
    for (const row of q.querySelectorAll<HTMLElement>('[data-row]')) {
      const letter = row.dataset.row!;
      const input = row.querySelector('input')!;
      const crossed = state.crossed.has(letter);
      row.classList.toggle('is-crossed', crossed);
      row.classList.toggle('is-locked', state.checked);
      input.checked = state.picked === letter;
      input.disabled = crossed || state.checked;
    }
    const check = q.querySelector<HTMLButtonElement>('[data-check]')!;
    check.hidden = !checkAsYouGo || state.checked;
    check.disabled = !state.picked;
  }

  function reveal(q: HTMLElement) {
    const state = stateOf(q);
    const answer = q.dataset.answer!;
    const right = state.picked === answer;
    q.querySelector(`[data-row="${answer}"]`)!.classList.add('is-correct');
    if (state.picked && !right) q.querySelector(`[data-row="${state.picked}"]`)!.classList.add('is-wrong');
    const feedback = q.querySelector<HTMLElement>('[data-feedback]')!;
    feedback.classList.toggle('is-right', right);
    q.querySelector('[data-verdict]')!.textContent = right ? 'Correct.' : `Not quite. The answer is ${answer}.`;
    for (const why of q.querySelectorAll<HTMLElement>('[data-why]')) why.hidden = why.dataset.why !== state.picked;
    feedback.hidden = false;
  }

  function resetQuestion(q: HTMLElement) {
    for (const row of q.querySelectorAll('[data-row]')) row.classList.remove('is-correct', 'is-wrong');
    q.querySelector<HTMLElement>('[data-feedback]')!.hidden = true;
  }

  for (const q of all) {
    q.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      stateOf(q).picked = input.value;
      renderQuestion(q);
      renderProgress();
    });

    q.querySelector('[data-check]')!.addEventListener('click', () => {
      const state = stateOf(q);
      if (!state.picked) return;
      state.checked = true;
      renderQuestion(q);
      reveal(q);
      renderProgress();
      next.focus();
    });

    for (const button of q.querySelectorAll<HTMLElement>('[data-cross], [data-undo]')) {
      button.addEventListener('click', () => {
        const letter = button.dataset.cross ?? button.dataset.undo!;
        const state = stateOf(q);
        if (state.crossed.has(letter)) {
          state.crossed.delete(letter);
        } else {
          state.crossed.add(letter);
          if (state.picked === letter) state.picked = undefined;
        }
        renderQuestion(q);
        renderProgress();
      });
    }
  }

  crossToggle.addEventListener('click', () => {
    const on = !exam.hasAttribute('data-cross-mode');
    exam.toggleAttribute('data-cross-mode', on);
    crossToggle.setAttribute('aria-pressed', String(on));
  });

  mark.addEventListener('click', () => {
    const state = stateOf(current());
    state.marked = !state.marked;
    renderProgress();
  });

  // ---------- moving around ----------

  function renderProgress() {
    const q = current();
    const state = stateOf(q);
    number.textContent = String(index + 1);
    mark.setAttribute('aria-pressed', String(state.marked));
    markLabel.textContent = state.marked ? 'Marked for review' : 'Mark for review';
    counter.textContent = `${index + 1} of ${deck.length}`;
    const done = deck.filter((item) => stateOf(item).picked).length;
    answered.textContent = `${done} of ${deck.length} answered`;
    back.disabled = index === 0;
    next.textContent = index === deck.length - 1 ? 'Finish' : 'Next';

    tiles.replaceChildren(
      ...deck.map((item, n) => {
        const s = stateOf(item);
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(n + 1);
        button.classList.toggle('is-answered', Boolean(s.picked));
        button.setAttribute(
          'aria-label',
          `Question ${n + 1}, ${s.picked ? 'answered' : 'unanswered'}${s.marked ? ', marked for review' : ''}`,
        );
        if (n === index) button.setAttribute('aria-current', 'step');
        button.addEventListener('click', () => {
          setOpen('question-menu', false);
          show(n);
          navToggle.focus();
        });
        li.innerHTML = (n === index ? svg('pin', PIN) : '') + (s.marked ? svg('flag', FLAG) : '');
        li.prepend(button);
        return li;
      }),
    );
  }

  function show(i: number) {
    index = i;
    for (const q of all) q.hidden = q !== deck[i];
    renderQuestion(deck[i]);
    renderProgress();
    window.scrollTo({ top: 0 });
  }

  back.addEventListener('click', () => {
    if (index > 0) show(index - 1);
  });

  next.addEventListener('click', () => {
    if (index < deck.length - 1) show(index + 1);
    else finish();
  });

  $('[data-finish]').addEventListener('click', () => {
    setOpen('question-menu', false);
    finish();
  });

  // ---------- results ----------

  function finish() {
    window.clearInterval(tick);
    closeAll();
    for (const q of all) q.hidden = true;
    exam.classList.add('is-finished');

    let correct = 0;
    const byTopic = new Map<string, [number, number]>();
    for (const r of reviews.values()) r.hidden = true;
    deck.forEach((q, n) => {
      const state = stateOf(q);
      const answer = q.dataset.answer!;
      const right = state.picked === answer;
      if (right) correct += 1;
      const [got, total] = byTopic.get(q.dataset.topic!) ?? [0, 0];
      byTopic.set(q.dataset.topic!, [got + (right ? 1 : 0), total + 1]);

      const card = reviews.get(q.dataset.id!)!;
      card.hidden = false;
      card.style.order = String(n);
      card.querySelector('[data-review-number]')!.textContent = String(n + 1);
      const pill = card.querySelector<HTMLElement>('[data-review-verdict]')!;
      pill.textContent = right ? 'Correct' : state.picked ? 'Incorrect' : 'Skipped';
      pill.classList.toggle('is-right', right);
      card.querySelector('[data-review-yours]')!.textContent = state.picked ?? 'skipped';
      for (const why of card.querySelectorAll<HTMLElement>('[data-why]')) why.hidden = why.dataset.why !== state.picked;
    });

    const used = Math.round((Date.now() - startedAt) / 1000);
    $('[data-results-meta]').textContent = `Your results · ${formatTime(used)}`;
    const score = $('[data-score]');
    score.textContent = `You got ${correct} of ${deck.length} right`;
    $('[data-breakdown]').replaceChildren(
      ...[...byTopic].map(([topic, [got, total]]) => {
        const row = document.createElement('tr');
        const name = document.createElement('td');
        const count = document.createElement('td');
        name.textContent = topicNames[topic] ?? topic;
        count.textContent = `${got} / ${total}`;
        if (got < total) row.classList.add('missed');
        row.append(name, count);
        return row;
      }),
    );
    results.hidden = false;
    window.scrollTo({ top: 0 });
    score.focus();
  }

  // ---------- choosing a set ----------

  function topicFromHash() {
    const match = /^#topic-(\d+\.\d+)$/.exec(location.hash);
    return match ? match[1] : null;
  }

  // The number of questions picked on the setup screen, or null if the typed
  // number is not usable.
  function chosenCount() {
    const typed = countInput.value.trim();
    if (typed) {
      const n = Number(typed);
      return Number.isInteger(n) && n >= 1 && n <= pool.length ? n : null;
    }
    const picked = countOptions.querySelector<HTMLInputElement>('input:checked');
    return picked ? Number(picked.value) : pool.length;
  }

  function renderSetupNote() {
    const n = chosenCount();
    countInput.setAttribute('aria-invalid', String(n === null));
    begin.disabled = n === null;
    if (n === null) {
      setupNote.textContent = `Type a whole number from 1 to ${pool.length}.`;
      return;
    }
    const minutes = Math.max(1, Math.round((n * pace) / 60));
    const which =
      n === pool.length
        ? `All ${n} question${n === 1 ? '' : 's'}`
        : `${n} question${n === 1 ? '' : 's'} picked at random from ${pool.length}`;
    setupNote.textContent = `${which}, about ${minutes} minute${minutes === 1 ? '' : 's'} at exam pace.`;
    remaining = Math.round(n * pace);
    renderClock();
  }

  function countChoice(value: number, number: string, word: string, checked: boolean) {
    const label = document.createElement('label');
    label.className = 'count-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'question-count';
    input.value = String(value);
    input.checked = checked;
    input.addEventListener('change', () => {
      countInput.value = '';
      renderSetupNote();
    });
    const big = document.createElement('span');
    big.className = 'count-number';
    big.textContent = number;
    const small = document.createElement('span');
    small.className = 'count-word';
    small.textContent = word;
    label.append(input, big, small);
    return label;
  }

  function showSetup() {
    window.clearInterval(tick);
    closeAll();
    const topic = topicFromHash();
    const filtered = topic ? all.filter((q) => q.dataset.topic === topic) : [];
    pool = filtered.length ? filtered : all;
    poolLabel = filtered.length ? `Topic ${topicNames[topic!] ?? topic}` : 'All topics';
    allLink.hidden = !filtered.length;
    deckLabel.textContent = `${poolLabel} · ${pool.length} question${pool.length === 1 ? '' : 's'}`;
    setupTopic.textContent = deckLabel.textContent;

    const saved = readSetting(COUNT_KEY);
    const presets = COUNT_PRESETS.filter((n) => n < pool.length);
    const savedNumber = Number(saved);
    const custom = saved !== 'all' && Number.isInteger(savedNumber) && savedNumber >= 1 && savedNumber < pool.length && !presets.includes(savedNumber);
    countOptions.replaceChildren(
      ...presets.map((n) => countChoice(n, String(n), 'questions', String(n) === saved)),
      countChoice(pool.length, 'All', `${pool.length} question${pool.length === 1 ? '' : 's'}`, !presets.some((n) => String(n) === saved) && !custom),
    );
    countInput.max = String(pool.length);
    countInput.value = custom ? String(savedNumber) : '';
    countOf.textContent = `of ${pool.length}`;

    for (const q of all) q.hidden = true;
    exam.classList.remove('is-finished');
    exam.classList.add('is-setup');
    results.hidden = true;
    setup.hidden = false;
    renderSetupNote();
    window.scrollTo({ top: 0 });
  }

  countInput.addEventListener('input', () => {
    if (countInput.value.trim()) {
      for (const input of countOptions.querySelectorAll<HTMLInputElement>('input')) input.checked = false;
    } else {
      const choices = countOptions.querySelectorAll<HTMLInputElement>('input');
      choices[choices.length - 1].checked = true;
    }
    renderSetupNote();
  });

  countInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !begin.disabled) begin.click();
  });

  // ---------- starting a set ----------

  function start(questions: HTMLElement[]) {
    deck = questions;
    const label = deck.length === pool.length ? `${deck.length}` : `${deck.length} of ${pool.length}`;
    deckLabel.textContent = `${poolLabel} · ${label} question${pool.length === 1 ? '' : 's'}`;
    states = new Map(all.map((q) => [q.dataset.id!, { crossed: new Set(), marked: false, checked: false }]));
    all.forEach(resetQuestion);
    exam.classList.remove('is-finished', 'is-setup');
    setup.hidden = true;
    results.hidden = true;
    closeAll();
    startTimer();
    show(0);
  }

  begin.addEventListener('click', () => {
    const n = chosenCount();
    if (n === null) return;
    writeSetting(COUNT_KEY, n === pool.length && !countInput.value.trim() ? 'all' : String(n));
    start(n >= pool.length ? pool : shuffled(pool).slice(0, n));
    deck[0].querySelector('input')?.focus({ preventScroll: true });
  });

  $('[data-restart]').addEventListener('click', () => {
    start(deck);
    deck[0].querySelector('input')?.focus({ preventScroll: true });
  });

  $('[data-new-set]').addEventListener('click', () => {
    showSetup();
    $('#setup-title').focus();
  });

  window.addEventListener('hashchange', showSetup);

  renderSwitch();
  showSetup();
}
