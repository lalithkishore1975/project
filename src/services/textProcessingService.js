/**
 * Process and clean the input text
 * @param {string} text - Input text to process
 * @param {string} type - Type of content (text, code, etc.)
 * @returns {string} - Processed text
 */
exports.processText = (text, type = 'text') => {
  if (!text) {
    return '';
  }
  
  let processedText = text;
  
  // Basic cleaning
  processedText = processedText
    .replace(/[\r\n]+/g, '\n')  // Normalize line breaks
    .replace(/\t/g, '  ')      // Replace tabs with spaces
    .trim();                   // Remove leading/trailing whitespace
  
  // Process based on content type
  switch (type.toLowerCase()) {
    case 'code':
      processedText = processCode(processedText);
      break;
    case 'html':
      processedText = processHtml(processedText);
      break;
    case 'text':
    default:
      processedText = processPlainText(processedText);
      break;
  }
  
  return processedText;
};

/**
 * Process plain text
 * @param {string} text - Text to process
 * @returns {string} - Processed text
 */
function processPlainText(text) {
  return text
    // Remove excessive spaces
    .replace(/\s+/g, ' ')
    // Remove URLs to focus on content
    .replace(/https?:\/\/[^\s]+/g, '')
    // Replace common unicode characters
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .trim();
}

/**
 * Process code for comparison
 * @param {string} code - Code to process
 * @returns {string} - Processed code
 */
function processCode(code) {
  return code
    // Remove comments
    .replace(/\/\/.*$/gm, '')              // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//gm, '')     // Remove multi-line comments
    .replace(/^\s*#.*$/gm, '')             // Remove Python-style comments
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove common code decorators
    .replace(/@\w+(\([^)]*\))?/g, '')
    .trim();
}

/**
 * Process HTML for comparison
 * @param {string} html - HTML to process
 * @returns {string} - Processed HTML
 */
function processHtml(html) {
  return html
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their contents
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Extract text from tags
    .replace(/<[^>]*>/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}