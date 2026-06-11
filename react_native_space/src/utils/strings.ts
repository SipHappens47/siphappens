// Returns just the correctly pluralised word: pluralWord(1, 'pour') -> "pour",
// pluralWord(3, 'Distillery') -> "Distilleries". Useful for stat labels that
// render the count separately.
export function pluralWord(count: number, word: string): string {
  if (count === 1) return word;
  if (/[^aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + 'ies';
  }
  return word + 's';
}

// Returns "1 pour", "2 pours", "1 region", "3 regions", "2 Distilleries" etc.
export function pluralise(count: number, word: string): string {
  return `${count} ${pluralWord(count, word)}`;
}
