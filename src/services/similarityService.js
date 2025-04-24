const stringSimilarity = require('string-similarity');
const jaroWinkler = require('jaro-winkler');
const _ = require('lodash');

/**
 * Calculate similarity between two texts
 * @param {string} sourceText - The original text to check
 * @param {string} comparisonText - Text to compare against
 * @returns {Object} - Similarity score and details
 */
exports.calculateSimilarity = (sourceText, comparisonText) => {
  if (!sourceText || !comparisonText) {
    return { score: 0, details: {} };
  }

  // Normalize texts
  const normalizedSource = normalizeText(sourceText);
  const normalizedComparison = normalizeText(comparisonText);
  
  // Different similarity measurements
  const similarityMeasurements = {
    // Compare overall text similarity
    overallSimilarity: stringSimilarity.compareTwoStrings(
      normalizedSource,
      normalizedComparison
    ),
    
    // Jaro-Winkler similarity - good for detecting small edits
    jaroSimilarity: jaroWinkler(normalizedSource, normalizedComparison),
    
    // Chunk-based comparison - divide text into chunks and find matches
    chunkSimilarity: calculateChunkSimilarity(normalizedSource, normalizedComparison)
  };
  
  // Weight the different measurements to get final score
  // Different types of plagiarism need different detection approaches
  const weightedScore = (
    similarityMeasurements.overallSimilarity * 0.4 +
    similarityMeasurements.jaroSimilarity * 0.2 +
    similarityMeasurements.chunkSimilarity * 0.4
  );
  
  return {
    score: weightedScore,
    details: similarityMeasurements
  };
};

/**
 * Highlight matching content between two texts
 * @param {string} sourceText - The original text
 * @param {string} comparisonText - Text being compared
 * @returns {Array} - Array of matched sections with context
 */
exports.highlightMatches = (sourceText, comparisonText) => {
  // Extract chunks from both texts
  const sourceChunks = createTextChunks(sourceText);
  const comparisonChunks = createTextChunks(comparisonText);
  
  const matches = [];
  
  // Find matches between chunks
  sourceChunks.forEach(sourceChunk => {
    comparisonChunks.forEach(comparisonChunk => {
      const similarity = stringSimilarity.compareTwoStrings(sourceChunk, comparisonChunk);
      
      // If similarity is significant, add to matches
      if (similarity > 0.6) {
        matches.push({
          sourceText: sourceChunk,
          matchedText: comparisonChunk,
          similarityScore: similarity
        });
      }
    });
  });
  
  // Sort by similarity score and remove duplicates
  const sortedMatches = _.sortBy(matches, 'similarityScore').reverse();
  const uniqueMatches = _.uniqBy(sortedMatches, 'sourceText');
  
  // Return top matches
  return uniqueMatches.slice(0, 5);
};

/**
 * Normalize text for comparison
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Calculate similarity based on matching chunks
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score
 */
function calculateChunkSimilarity(text1, text2) {
  // Create chunks from both texts
  const chunks1 = createTextChunks(text1);
  const chunks2 = createTextChunks(text2);
  
  // Find matches
  let matchCount = 0;
  
  chunks1.forEach(chunk1 => {
    chunks2.forEach(chunk2 => {
      const similarity = stringSimilarity.compareTwoStrings(chunk1, chunk2);
      if (similarity > 0.8) {
        matchCount++;
      }
    });
  });
  
  // Calculate percentage of matched chunks
  return chunks1.length > 0 ? (matchCount / chunks1.length) : 0;
}

/**
 * Create chunks from text for comparison
 * @param {string} text - Text to chunk
 * @returns {Array<string>} - Array of text chunks
 */
function createTextChunks(text) {
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // For very short texts, use words as chunks
  if (sentences.length < 3) {
    return text.split(/\s+/).filter(w => w.length > 5);
  }
  
  const chunks = [];
  
  // Create chunks of sentences
  for (let i = 0; i < sentences.length; i++) {
    // Single sentence chunks
    chunks.push(sentences[i].trim());
    
    // 2-sentence chunks (if possible)
    if (i < sentences.length - 1) {
      chunks.push(`${sentences[i].trim()} ${sentences[i+1].trim()}`);
    }
    
    // 3-sentence chunks (if possible)
    if (i < sentences.length - 2) {
      chunks.push(`${sentences[i].trim()} ${sentences[i+1].trim()} ${sentences[i+2].trim()}`);
    }
  }
  
  return chunks.filter(chunk => chunk.length > 15);
}