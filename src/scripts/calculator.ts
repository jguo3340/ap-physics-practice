// Runs the calculator panel (src/components/Calculator.astro): the keypad,
// typing, the live answer preview, past calculations, and dragging the panel.
import { CalcError, evaluate, formatResult, type AngleMode } from '../lib/calculate';

const ANGLE_KEY = 'calc-angle';
// Deleting one of these removes the whole thing, not just its last character.
const WHOLE_TOKENS = ['sin⁻¹(', 'cos⁻¹(', 'tan⁻¹(', 'sin(', 'cos(', 'tan(', 'log(', 'ln(', '√(', 'ans'];

/** Shows typed shorthand with the keypad's symbols: 2*pi -> 2×π. */
function pretty(expr: string) {
  return expr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−')
    .replace(/\bpi\b/gi, 'π')
    .replace(/sqrt/gi, '√');
}

export function setUpCalculator(panel: HTMLElement) {
  const input = panel.querySelector<HTMLInputElement>('[data-calc-input]')!;
  const preview = panel.querySelector<HTMLOutputElement>('[data-calc-preview]')!;
  const history = panel.querySelector<HTMLElement>('[data-calc-history]')!;
  const head = panel.querySelector<HTMLElement>('[data-calc-drag]')!;
  const openers = [...document.querySelectorAll<HTMLButtonElement>('[aria-controls="calculator"]')];

  let mode: AngleMode = 'deg';
  try {
    if (localStorage.getItem(ANGLE_KEY) === 'rad') mode = 'rad';
  } catch {
    // Storage can be blocked; degrees it is.
  }
  let ans = 0;

  // On touch screens the keypad is the keyboard, so keep the phone's own keyboard away.
  if (matchMedia('(pointer: coarse)').matches) input.inputMode = 'none';

  // ---------- opening and closing ----------

  function setOpen(open: boolean) {
    panel.hidden = !open;
    for (const opener of openers) opener.setAttribute('aria-expanded', String(open));
    if (open) input.focus({ preventScroll: true });
  }

  for (const opener of openers) {
    opener.addEventListener('click', (event) => {
      event.stopPropagation();
      setOpen(panel.hidden !== false);
    });
  }
  panel.querySelector('[data-calc-close]')!.addEventListener('click', () => {
    setOpen(false);
    openers[0]?.focus();
  });
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
      openers[0]?.focus();
    }
  });

  // ---------- angle unit ----------

  const angleButtons = [...panel.querySelectorAll<HTMLButtonElement>('[data-angle]')];
  function renderAngle() {
    for (const button of angleButtons) button.setAttribute('aria-pressed', String(button.dataset.angle === mode));
  }
  for (const button of angleButtons) {
    button.addEventListener('click', () => {
      mode = button.dataset.angle as AngleMode;
      try {
        localStorage.setItem(ANGLE_KEY, mode);
      } catch {
        // Fine: it still applies for this visit.
      }
      renderAngle();
      updatePreview();
    });
  }

  // ---------- the expression ----------

  function updatePreview() {
    preview.classList.remove('is-error');
    const expr = input.value.trim();
    if (!expr) {
      preview.textContent = '';
      return;
    }
    try {
      preview.textContent = `= ${formatResult(evaluate(expr, { mode, ans }))}`;
    } catch {
      // Half-typed expressions are normal; only complain when = is pressed.
      preview.textContent = '';
    }
  }

  function insert(text: string) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    const caret = start + text.length;
    input.setSelectionRange(caret, caret);
    updatePreview();
  }

  function backspace() {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    if (start !== end) {
      insert('');
      return;
    }
    const before = input.value.slice(0, start);
    const token = WHOLE_TOKENS.find((t) => before.endsWith(t));
    const cut = token ? token.length : 1;
    input.value = before.slice(0, Math.max(0, start - cut)) + input.value.slice(start);
    const caret = Math.max(0, start - cut);
    input.setSelectionRange(caret, caret);
    updatePreview();
  }

  function addToHistory(expr: string, value: number) {
    const item = document.createElement('li');
    const shown = document.createElement('span');
    shown.className = 'past-expr';
    shown.textContent = pretty(expr);
    const result = document.createElement('button');
    result.type = 'button';
    result.textContent = formatResult(value);
    result.setAttribute('aria-label', `Use ${formatResult(value)}`);
    // Full precision goes back in, written so the calculator can read it again.
    const reusable = String(value).replace('e', 'E').replace('E+', 'E');
    result.addEventListener('click', () => {
      insert(reusable);
      input.focus();
    });
    item.append(shown, result);
    history.append(item);
    history.scrollTop = history.scrollHeight;
  }

  function equals() {
    const expr = input.value.trim();
    if (!expr) return;
    try {
      const value = evaluate(expr, { mode, ans });
      addToHistory(expr, value);
      if (Number.isFinite(value)) ans = value;
      input.value = '';
      preview.textContent = '';
    } catch (error) {
      preview.classList.add('is-error');
      preview.textContent = error instanceof CalcError ? error.message : 'Check the expression';
    }
  }

  for (const key of panel.querySelectorAll<HTMLButtonElement>('.key')) {
    // Keep the cursor in the expression box while tapping keys.
    key.addEventListener('pointerdown', (event) => event.preventDefault());
    key.addEventListener('click', () => {
      const { insert: text, action } = key.dataset;
      if (text !== undefined) insert(text);
      else if (action === 'back') backspace();
      else if (action === 'clear') {
        input.value = '';
        updatePreview();
      } else if (action === 'equals') equals();
      input.focus({ preventScroll: true });
    });
  }

  input.addEventListener('input', updatePreview);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      equals();
    }
  });

  // ---------- dragging (larger screens) ----------

  let drag: { dx: number; dy: number } | null = null;
  head.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('button') || matchMedia('(max-width: 640px)').matches) return;
    const box = panel.getBoundingClientRect();
    drag = { dx: event.clientX - box.left, dy: event.clientY - box.top };
    head.setPointerCapture(event.pointerId);
    panel.classList.add('is-dragging');
  });
  head.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const maxX = window.innerWidth - panel.offsetWidth - 8;
    const maxY = window.innerHeight - 48;
    const x = Math.min(Math.max(8, event.clientX - drag.dx), maxX);
    const y = Math.min(Math.max(8, event.clientY - drag.dy), maxY);
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panel.style.right = 'auto';
  });
  const stopDrag = () => {
    drag = null;
    panel.classList.remove('is-dragging');
  };
  head.addEventListener('pointerup', stopDrag);
  head.addEventListener('pointercancel', stopDrag);
  // A panel dragged on a wide window goes back to the bottom sheet on a narrow one.
  matchMedia('(max-width: 640px)').addEventListener('change', (event) => {
    if (event.matches) panel.style.left = panel.style.top = panel.style.right = '';
  });

  renderAngle();
}
