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

  // ---------- starting a set ----------

  function topicFromHash() {
    const match = /^#topic-(\d+\.\d+)$/.exec(location.hash);
    return match ? match[1] : null;
  }

  function start() {
    const topic = topicFromHash();
    const filtered = topic ? all.filter((q) => q.dataset.topic === topic) : [];
    deck = filtered.length ? filtered : all;
    const label = filtered.length ? `Topic ${topicNames[topic!] ?? topic}` : 'All topics';
    deckLabel.textContent = `${label} · ${deck.length} question${deck.length === 1 ? '' : 's'}`;
    allLink.hidden = !filtered.length;

    states = new Map(all.map((q) => [q.dataset.id!, { crossed: new Set(), marked: false, checked: false }]));
    all.forEach(resetQuestion);
    exam.classList.remove('is-finished');
    results.hidden = true;
    closeAll();
    startTimer();
    show(0);
  }

  $('[data-restart]').addEventListener('click', () => {
    start();
    deck[0].querySelector('input')?.focus();
  });
  window.addEventListener('hashchange', start);

  renderSwitch();
  start();
}
