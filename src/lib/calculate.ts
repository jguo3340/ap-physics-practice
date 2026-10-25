// The math behind the calculator. It reads an expression such as
// "2.5sin(30)^2 + √(9.8×4)" and works out its value, without using eval.
//
// Supported: + − × ÷ ^, brackets, implied multiplication (2π, 3sin(30)),
// sin cos tan and their inverses, √, ln, log (base 10), abs, π, e, ans,
// and scientific notation written with a capital E (6.67E-11).

export type AngleMode = 'deg' | 'rad';

export class CalcError extends Error {}

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'op'; value: string };

const FUNCTIONS = ['asin', 'acos', 'atan', 'sqrt', 'sin', 'cos', 'tan', 'abs', 'log', 'ln'] as const;
const CONSTANTS = ['ans', 'pi', 'e'] as const;
// Longest names first, so "asin" is not read as "a" + "sin".
const NAMES = [...FUNCTIONS, ...CONSTANTS].sort((a, b) => b.length - a.length);

/** Turns the symbols the keypad shows into the plain names the reader expects. */
function normalize(text: string) {
  return text
    .replace(/sin⁻¹|arcsin/g, 'asin')
    .replace(/cos⁻¹|arccos/g, 'acos')
    .replace(/tan⁻¹|arctan/g, 'atan')
    .replace(/×|·/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\*\*/g, '^')
    .replace(/\s+/g, '');
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const number = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(rest);
    if (number) {
      tokens.push({ kind: 'num', value: Number(number[0]) });
      i += number[0].length;
      continue;
    }
    const name = NAMES.find((n) => rest.toLowerCase().startsWith(n));
    if (name) {
      tokens.push({ kind: 'name', value: name });
      i += name.length;
      continue;
    }
    if ('+-*/^()'.includes(text[i])) {
      tokens.push({ kind: 'op', value: text[i] });
      i += 1;
      continue;
    }
    throw new CalcError(`"${text[i]}" isn't something the calculator understands`);
  }
  return tokens;
}

/** Rounds away floating-point dust, so sin(30°) shows 0.5 instead of 0.49999999999999994. */
function tidy(value: number) {
  if (!Number.isFinite(value)) return value;
  if (Math.abs(value) < 1e-13) return 0;
  return Number(value.toPrecision(13));
}

export function evaluate(input: string, options: { mode: AngleMode; ans: number }): number {
  const tokens = tokenize(normalize(input));
  if (tokens.length === 0) throw new CalcError('Type an expression');
  let pos = 0;

  const peek = () => tokens[pos];
  const isOp = (value: string) => peek()?.kind === 'op' && peek().value === value;
  const startsFactor = () => {
    const t = peek();
    return t !== undefined && (t.kind === 'num' || t.kind === 'name' || (t.kind === 'op' && t.value === '('));
  };

  const toRadians = (x: number) => (options.mode === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRadians = (x: number) => (options.mode === 'deg' ? (x * 180) / Math.PI : x);

  function apply(fn: string, x: number): number {
    switch (fn) {
      case 'sin':
        return tidy(Math.sin(toRadians(x)));
      case 'cos':
        return tidy(Math.cos(toRadians(x)));
      case 'tan': {
        // tan(90°) has no value; floating point would otherwise give a huge number.
        if (Math.abs(tidy(Math.cos(toRadians(x)))) === 0) return NaN;
        return tidy(Math.tan(toRadians(x)));
      }
      case 'asin':
        return fromRadians(Math.asin(x));
      case 'acos':
        return fromRadians(Math.acos(x));
      case 'atan':
        return fromRadians(Math.atan(x));
      case 'sqrt':
        return Math.sqrt(x);
      case 'abs':
        return Math.abs(x);
      case 'ln':
        return Math.log(x);
      case 'log':
        return Math.log10(x);
      default:
        throw new CalcError(`Unknown function ${fn}`);
    }
  }

  // expression := term (("+" | "-") term)*
  function expression(): number {
    let value = term();
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].value;
      const right = term();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  // term := signed (("*" | "/") signed | signed)*   (the last form is 2π, 3sin(30), ...)
  function term(): number {
    let value = signed();
    for (;;) {
      if (isOp('*')) {
        pos++;
        value *= signed();
      } else if (isOp('/')) {
        pos++;
        value /= signed();
      } else if (startsFactor()) {
        value *= power();
      } else {
        return value;
      }
    }
  }

  // signed := ("-" | "+") signed | power      (so -2^2 is -(2^2), as on the exam calculator)
  function signed(): number {
    if (isOp('-')) {
      pos++;
      return -signed();
    }
    if (isOp('+')) {
      pos++;
      return signed();
    }
    return power();
  }

  // power := primary ("^" signed)?           (right to left: 2^3^2 is 2^9)
  function power(): number {
    const base = primary();
    if (isOp('^')) {
      pos++;
      return base ** signed();
    }
    return base;
  }

  function primary(): number {
    const t = peek();
    if (!t) throw new CalcError('The expression ends too early');
    if (t.kind === 'num') {
      pos++;
      return t.value;
    }
    if (t.kind === 'op' && t.value === '(') {
      pos++;
      const value = expression();
      // A missing ")" at the very end is fine, like on most calculators.
      if (isOp(')')) pos++;
      else if (peek()) throw new CalcError('A bracket is missing');
      return value;
    }
    if (t.kind === 'name') {
      pos++;
      if (t.value === 'pi') return Math.PI;
      if (t.value === 'e') return Math.E;
      if (t.value === 'ans') return options.ans;
      // A function takes the bracket after it, or the next number: sin(30) or sin 30.
      return apply(t.value, isOp('(') ? primary() : signed());
    }
    throw new CalcError(t.value === ')' ? 'A ")" has no matching "("' : `"${t.value}" needs a number before it`);
  }

  const value = expression();
  if (pos < tokens.length) throw new CalcError('A ")" has no matching "("');
  return tidy(value);
}

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

/** Shows a result the way a calculator would: 0.5, 9.8, 6.67 × 10⁻¹¹. */
export function formatResult(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 'Undefined';
  if (value === 0) return '0';
  const size = Math.abs(value);
  if (size >= 1e10 || size < 1e-6) {
    const [mantissa, exponent] = value.toExponential(9).split('e');
    const digits = mantissa.replace(/\.?0+$/, '');
    const power = String(Number(exponent))
      .split('')
      .map((c) => SUPERSCRIPT[c])
      .join('');
    return `${digits} × 10${power}`;
  }
  return String(Number(value.toPrecision(10)));
}
