const axios = require('axios');
const cheerio = require('cheerio');
const { htmlToText } = require('html-to-text');

/**
 * Search the web for content similar to the input text
 * @param {string} text - The text to search for
 * @returns {Promise<Array>} - Array of search results with content
 */
exports.searchWeb = async (text) => {
  try {
    // Create search terms from the text
    const searchTerms = createSearchTerms(text);
    
    // Get search results from Google or other search engines
    const searchResults = await performSearch(searchTerms);
    
    // Fetch and extract content from search result URLs
    const resultsWithContent = await fetchContentFromUrls(searchResults);
    
    return resultsWithContent;
  } catch (error) {
    console.error('Error searching web:', error);
    throw new Error('Failed to search web for similar content');
  }
};

/**
 * Create search terms from the input text
 * @param {string} text - The input text
 * @returns {Array<string>} - Array of search terms
 */
function createSearchTerms(text) {
  // Extract important phrases/sentences for search
  const searchTerms = [];
  
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 20);
  
  // If text is short, use the entire text
  if (sentences.length === 0 || text.length < 100) {
    return [text.substring(0, 200)];
  }
  
  // Use the first sentence and a few other significant ones
  searchTerms.push(sentences[0]);
  
  // Add some sentences from the middle and end if they exist
  if (sentences.length > 3) {
    const middleIndex = Math.floor(sentences.length / 2);
    searchTerms.push(sentences[middleIndex]);
  }
  
  if (sentences.length > 6) {
    searchTerms.push(sentences[sentences.length - 2]);
  }
  
  // Limit each term to 200 characters for better search results
  return searchTerms.map(term => term.substring(0, 200).trim());
}

/**
 * Perform web search using search terms
 * @param {Array<string>} searchTerms - Terms to search for
 * @returns {Promise<Array>} - Search results
 */
async function performSearch(searchTerms) {
  const results = [];
  
  // For demo purposes, we're using a simplified approach
  // In a production app, you'd use Google Custom Search API or similar service
  
  for (const term of searchTerms) {
    try {
      // This is a placeholder. In a real implementation, you would:
      // 1. Use Google Custom Search API
      // 2. Or use another search API like Bing
      // 3. Or implement web scraping (with consideration for legal implications)
      
      // Simulated search results for demo
      // In a real app, replace this with actual API calls
      const simulatedResults = [
        {
          url: 'https://example.com/article1',
          title: 'Example Article 1',
          snippet: `This is a snippet containing some of the search term: ${term.substring(0, 30)}...`
        },
        {
          url: 'https://example.com/article2',
          title: 'Example Article 2',
          snippet: `Another snippet with reference to: ${term.substring(0, 30)}...`
        }
      ];
      
      results.push(...simulatedResults);
      
      // To implement Google Custom Search API, uncomment and adapt this code:
      /*
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: term
        }
      });
      
      if (response.data && response.data.items) {
        response.data.items.forEach(item => {
          results.push({
            url: item.link,
            title: item.title,
            snippet: item.snippet
          });
        });
      }
      */
      
    } catch (error) {
      console.error(`Error searching for term "${term}":`, error);
    }
  }
  
  // Remove duplicates
  const uniqueResults = Array.from(new Map(results.map(item => [item.url, item])).values());
  
  return uniqueResults;
}

/**
 * Fetch content from URLs and extract text
 * @param {Array} searchResults - Search results with URLs
 * @returns {Promise<Array>} - Results with added content
 */
async function fetchContentFromUrls(searchResults) {
  const resultsWithContent = [];
  
  for (const result of searchResults) {
    try {
      // In a real implementation, you would:
      // 1. Fetch the webpage content
      // 2. Parse the HTML and extract meaningful text
      
      // For demo purposes, we'll simulate content fetching
      // In a real app, replace this with actual content fetching
      
      // Simulated content for demo
      const simulatedContent = `This is simulated webpage content for demonstration purposes. 
      It contains some text that might be similar to what was searched for.
      In a real implementation, this would be actual content fetched from ${result.url}.
      ${result.snippet}
      Additional text that would be found on the webpage would be included here.`;
      
      resultsWithContent.push({
        ...result,
        content: simulatedContent
      });
      
      // To implement actual content fetching, uncomment and adapt this code:
      /*
      const response = await axios.get(result.url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PlagiarismCheckerBot/1.0; +http://yourwebsite.com)'
        }
      });
      
      if (response.data) {
        const $ = cheerio.load(response.data);
        
        // Remove scripts, styles, and other non-content elements
        $('script, style, meta, link, nav, footer, header, aside').remove();
        
        // Get text from main content areas
        const mainContent = $('main, article, .content, #content, .post, #main').html() || $('body').html();
        
        // Convert HTML to plain text
        const textContent = htmlToText(mainContent, {
          wordwrap: false,
          selectors: [
            { selector: 'a', options: { ignoreHref: true } },
            { selector: 'img', format: 'skip' }
          ]
        });
        
        resultsWithContent.push({
          ...result,
          content: textContent
        });
      }
      */
      
    } catch (error) {
      console.error(`Error fetching content from ${result.url}:`, error);
      // Still include the result but with empty content
      resultsWithContent.push({
        ...result,
        content: ''
      });
    }
  }
  
  return resultsWithContent;
}