function toWords(input) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const capitalize = (w) => w.charAt(0).toUpperCase() + w.slice(1);

function pluralize(word) {
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}

export function buildNames(input) {
  const words = toWords(input);
  if (words.length === 0) {
    throw new Error(`Nombre inválido: "${input}"`);
  }
  const pluralWords = [...words.slice(0, -1), pluralize(words.at(-1))];
  return {
    pascal: words.map(capitalize).join(''),
    camel: words[0] + words.slice(1).map(capitalize).join(''),
    kebab: words.join('-'),
    snake: words.join('_'),
    constant: words.join('_').toUpperCase(),
    pluralCamel: pluralWords[0] + pluralWords.slice(1).map(capitalize).join(''),
    pluralSnake: pluralWords.join('_'),
  };
}
