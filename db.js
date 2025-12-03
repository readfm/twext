// Mock database with sample text data
const mockData = [
  { id: 1, text: 'The quick brown fox jumps over the lazy dog' },
  { id: 2, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit' },
  { id: 3, text: 'JavaScript is a versatile programming language' },
  { id: 4, text: 'Node.js allows JavaScript to run on the server' },
  { id: 5, text: 'React is a popular JavaScript library for building user interfaces' },
  { id: 6, text: 'Vue.js is another JavaScript framework for web development' },
  { id: 7, text: 'Angular is a TypeScript-based web application framework' },
  { id: 8, text: 'Python is known for its simplicity and readability' },
  { id: 9, text: 'Java is a widely-used object-oriented programming language' },
  { id: 10, text: 'C++ is known for its performance and efficiency' }
];

/**
 * Search for text matching the given term
 * @param {string} term - The search term
 * @param {number} limit - Maximum number of results to return (optional)
 *                         If not provided, undefined, null, or negative, all results are returned.
 *                         If 0, an empty array is returned.
 *                         If positive, at most that many results are returned.
 * @returns {Array} Array of matching results
 */
function searchText(term, limit) {
  // Search for items containing the term (case-insensitive)
  const results = mockData.filter(item => 
    item.text.toLowerCase().includes(term.toLowerCase())
  );
  
  // Apply limit if provided
  if (limit !== undefined && limit !== null) {
    if (limit >= 0) {
      return results.slice(0, limit);
    }
  }
  
  return results;
}

module.exports = {
  searchText
};
