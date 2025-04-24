const { searchWeb } = require('../services/searchService');
const { calculateSimilarity, highlightMatches } = require('../services/similarityService');
const { processText } = require('../services/textProcessingService');

// In-memory storage for history (would use a database in production)
const checkHistory = [];

/**
 * Check submitted text for plagiarism
 */
exports.checkPlagiarism = async (req, res) => {
  try {
    const { text, type = 'text' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        status: 'error',
        message: 'No text provided for checking'
      });
    }

    // Process the input text
    const processedText = processText(text, type);
    
    // Search the web for similar content
    const searchResults = await searchWeb(processedText);
    
    // Calculate similarity for each result
    const results = [];
    let overallPlagiarismScore = 0;
    
    for (const result of searchResults) {
      const { url, title, snippet, content } = result;
      
      // Calculate similarity between input and this result
      const similarity = calculateSimilarity(processedText, content);
      
      // Only include results with meaningful similarity
      if (similarity.score > 0.3) {
        results.push({
          url,
          title,
          snippet,
          similarityScore: similarity.score,
          highlightedMatches: highlightMatches(processedText, content),
        });
        
        overallPlagiarismScore += similarity.score;
      }
    }
    
    // Calculate overall plagiarism percentage
    const plagiarismPercentage = results.length > 0 
      ? Math.min(100, Math.round((overallPlagiarismScore / results.length) * 100))
      : 0;
    
    // Sort results by similarity score (highest first)
    results.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Store in history
    const id = Date.now().toString();
    const checkResult = {
      id,
      date: new Date(),
      textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      plagiarismPercentage,
      results
    };
    
    checkHistory.unshift(checkResult);
    
    // Only keep last 10 checks in memory
    if (checkHistory.length > 10) {
      checkHistory.pop();
    }
    
    res.json({
      status: 'success',
      data: checkResult
    });
    
  } catch (error) {
    console.error('Error in plagiarism check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check for plagiarism',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Get history of plagiarism checks
 */
exports.getHistory = (req, res) => {
  try {
    // Return simplified history for list view
    const simplifiedHistory = checkHistory.map(item => ({
      id: item.id,
      date: item.date,
      textPreview: item.textPreview,
      plagiarismPercentage: item.plagiarismPercentage
    }));
    
    res.json({
      status: 'success',
      data: simplifiedHistory
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve history',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Get detailed result by ID
 */
exports.getResultById = (req, res) => {
  try {
    const { id } = req.params;
    const result = checkHistory.find(item => item.id === id);
    
    if (!result) {
      return res.status(404).json({
        status: 'error',
        message: 'Result not found'
      });
    }
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve result',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};