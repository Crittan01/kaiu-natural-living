import { Product } from './types';

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
    let row = matrix[i] = new Array(an + 1);
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

/**
 * Filters products based on a query using fuzzy matching.
 * Checks name, category, and benefits.
 */
export function filterProductsByQuery(products: Product[], query: string): Product[] {
  if (!query) return products;
  
  const normalizedQuery = query.toLowerCase().trim();
  const maxDistance = 3; // Allow up to 3 errors
  
  return products.filter((product) => {
    // Check direct includes (fast path)
    if (
      product.nombre.toLowerCase().includes(normalizedQuery) ||
      product.categoria.toLowerCase().includes(normalizedQuery) ||
      product.beneficios.toLowerCase().includes(normalizedQuery)
    ) {
      return true;
    }
    
    // Check fuzzy match on Name (words)
    const nameWords = product.nombre.toLowerCase().split(' ');
    const isFuzzyMatch = nameWords.some(word => {
      // Only check overlapping length to avoid high distance on short query vs long word
      if (Math.abs(word.length - normalizedQuery.length) > maxDistance) return false;
      return levenshteinDistance(word, normalizedQuery) <= maxDistance;
    });
    
    return isFuzzyMatch;
  });
}
