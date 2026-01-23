import { Product, Ritual } from './types';

// Normalizes text by removing accents and converting to lowercase
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Calculates the Levenshtein distance between two strings.
 * @param a First string
 * @param b Second string
 * @returns The edit distance (number of changes required)
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  
  const matrix = new Array(bn + 1);
  for (let i = 0; i <= bn; ++i) {
    const row = matrix[i] = new Array(an + 1);
    row[0] = i;
  }
  const firstRow = matrix[0];
  for (let j = 1; j <= an; ++j) {
    firstRow[j] = j;
  }
  
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1], // substitution
          matrix[i][j - 1],     // insertion
          matrix[i - 1][j]      // deletion
        ) + 1;
      }
    }
  }
  
  return matrix[bn][an];
}

export function filterProductsByQuery(products: Product[], query: string): Product[] {
  if (!query) return products;

  const normalizedQuery = normalizeText(query);
  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);

  return products.filter((product) => {
    const textToSearch = normalizeText(
      `${product.nombre} ${product.categoria} ${product.beneficios} ${product.descripcion}`
    );

    // 1. Exact Includes (Fastest & Strongest)
    if (textToSearch.includes(normalizedQuery)) return true;

    // 2. Token Matching (supports "aceite lavanda" finding "Aceite Esencial de Lavanda")
    // Every word typed must be somewhat present in the product text
    const allTokensMatch = queryTokens.every((token) => {
      // Direct match
      if (textToSearch.includes(token)) return true;

      // Fuzzy match per token (allows typos like "labanda")
      // We check if the token appears as a "close enough" substring in the text
      const tokenLen = token.length;
      if (tokenLen < 3) return false; // Don't fuzzy match very short words (de, el, la)

      // Split product text into words to compare against the token
      const productWords = textToSearch.split(/\s+/);
      return productWords.some(word => {
        // Allow distance of 1 for 3-5 chars, 2 for longer
        const maxDist = tokenLen > 5 ? 2 : 1;
        
        // Optimization: Don't compare completely different length words
        if (Math.abs(word.length - tokenLen) > maxDist) return false;

        return levenshteinDistance(token, word) <= maxDist;
      });
    });

    return allTokensMatch;
  });
}

export function filterRitualsByQuery(rituals: Ritual[], query: string): Ritual[] {
  if (!query) return rituals;

  const normalizedQuery = normalizeText(query);
  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);

  return rituals.filter((ritual) => {
    const textToSearch = normalizeText(
      `${ritual.titulo} ${ritual.resumen} ${ritual.contenido}`
    );

    if (textToSearch.includes(normalizedQuery)) return true;

    return queryTokens.every((token) => {
      if (textToSearch.includes(token)) return true;

      const tokenLen = token.length;
      if (tokenLen < 3) return false;

      const words = textToSearch.split(/\s+/);
      return words.some(word => {
        const maxDist = tokenLen > 5 ? 2 : 1;
        if (Math.abs(word.length - tokenLen) > maxDist) return false;
        return levenshteinDistance(token, word) <= maxDist;
      });
    });
  });
}
