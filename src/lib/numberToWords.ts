const UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function below100(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    const base = t === 7 ? 'soixante' : 'quatre-vingt';
    const rest = 10 + u;
    if (t === 7 && u === 1) return 'soixante et onze';
    return `${base}-${UNITS[rest]}`;
  }
  if (t === 8) return u === 0 ? 'quatre-vingts' : `quatre-vingt-${UNITS[u]}`;
  if (u === 0) return TENS[t];
  if (u === 1) return `${TENS[t]} et un`;
  return `${TENS[t]}-${UNITS[u]}`;
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let s = '';
  if (h === 1) s = 'cent';
  else if (h > 1) s = `${UNITS[h]} cent${r === 0 ? 's' : ''}`;
  if (r > 0) s = s ? `${s} ${below100(r)}` : below100(r);
  return s;
}

function intToWords(n: number): string {
  if (n === 0) return 'zéro';
  const parts: string[] = [];
  const scales: [number, string, string][] = [
    [1_000_000_000, 'milliard', 'milliards'],
    [1_000_000, 'million', 'millions'],
  ];
  for (const [v, sing, plur] of scales) {
    const q = Math.floor(n / v);
    if (q > 0) {
      parts.push(`${below1000(q)} ${q > 1 ? plur : sing}`);
      n %= v;
    }
  }
  const th = Math.floor(n / 1000);
  if (th > 0) {
    parts.push(th === 1 ? 'mille' : `${below1000(th).replace(/cents$/, 'cent')} mille`);
    n %= 1000;
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(' ');
}

export function amountToFrenchWords(amount: number): string {
  const abs = Math.abs(amount);
  const dinars = Math.floor(abs + 1e-9);
  const centimes = Math.round((abs - dinars) * 100);
  let s = `${intToWords(dinars)} dinar${dinars > 1 ? 's' : ''} algérien${dinars > 1 ? 's' : ''}`;
  if (centimes > 0) s += ` et ${intToWords(centimes)} centime${centimes > 1 ? 's' : ''}`;
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return amount < 0 ? `Moins ${s.toLowerCase()}` : s;
}

export const AMOUNT_WORDS_PREFIX =
  'Arrêtée la présente facture en toutes taxes comprises à la somme de :';
