document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const app = {
    views: {
      checker: document.getElementById('checker-view'),
      history: document.getElementById('history-view'),
      about: document.getElementById('about-view'),
      resultDetail: document.getElementById('result-detail-view')
    },
    elements: {
      // Navigation
      navLinks: document.querySelectorAll('.nav a'),
      
      // Checker
      contentType: document.getElementById('content-type'),
      inputText: document.getElementById('input-text'),
      charCount: document.getElementById('char-count'),
      checkBtn: document.getElementById('check-btn'),
      clearBtn: document.getElementById('clear-btn'),
      
      // Results
      resultsContainer: document.getElementById('results-container'),
      loadingContainer: document.getElementById('loading-container'),
      closeResultsBtn: document.getElementById('close-results-btn'),
      downloadBtn: document.getElementById('download-btn'),
      plagiarismScore: document.getElementById('plagiarism-score'),
      plagiarismLevel: document.getElementById('plagiarism-level'),
      scoreExplanation: document.getElementById('score-explanation'),
      matchesList: document.getElementById('matches-list'),
      
      // History
      historyList: document.getElementById('history-list'),
      
      // Result Detail
      backToHistoryBtn: document.getElementById('back-to-history-btn'),
      resultDetailContent: document.getElementById('result-detail-content')
    }
  };
  
  // State
  const state = {
    currentView: 'checker',
    currentCheck: null,
    history: []
  };
  
  // Initialize
  init();
  
  // Functions
  function init() {
    // Set up event listeners
    setupEventListeners();
    
    // Update character count
    updateCharacterCount();
    
    // Load history
    loadHistory();
  }
  
  function setupEventListeners() {
    // Navigation
    app.elements.navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const view = this.getAttribute('data-view');
        navigateToView(view);
      });
    });
    
    // Checker
    app.elements.inputText.addEventListener('input', updateCharacterCount);
    app.elements.checkBtn.addEventListener('click', checkPlagiarism);
    app.elements.clearBtn.addEventListener('click', clearInput);
    app.elements.closeResultsBtn.addEventListener('click', closeResults);
    app.elements.downloadBtn.addEventListener('click', downloadReport);
    
    // History
    document.addEventListener('click', function(e) {
      if (e.target.closest('.history-item')) {
        const id = e.target.closest('.history-item').getAttribute('data-id');
        viewResultDetail(id);
      }
    });
    
    // Result Detail
    app.elements.backToHistoryBtn.addEventListener('click', function() {
      navigateToView('history');
    });
  }
  
  function navigateToView(view) {
    // Hide all views
    Object.values(app.views).forEach(viewElement => {
      viewElement.classList.remove('active');
    });
    
    // Show selected view
    app.views[view].classList.add('active');
    
    // Update navigation
    app.elements.navLinks.forEach(link => {
      if (link.getAttribute('data-view') === view) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Update state
    state.currentView = view;
  }
  
  function updateCharacterCount() {
    const text = app.elements.inputText.value;
    app.elements.charCount.textContent = `${text.length} characters`;
  }
  
  function checkPlagiarism() {
    const text = app.elements.inputText.value.trim();
    const type = app.elements.contentType.value;
    
    if (!text) {
      alert('Please enter some text to check for plagiarism.');
      return;
    }
    
    // Show loading
    app.elements.resultsContainer.classList.add('hidden');
    app.elements.loadingContainer.classList.remove('hidden');
    
    // API request
    fetch('/api/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, type })
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          displayResults(data.data);
          updateHistory();
        } else {
          throw new Error(data.message || 'Failed to check plagiarism');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while checking for plagiarism. Please try again.');
      })
      .finally(() => {
        app.elements.loadingContainer.classList.add('hidden');
      });
  }
  
  function displayResults(result) {
    // Store current check
    state.currentCheck = result;
    
    // Update score
    app.elements.plagiarismScore.textContent = `${result.plagiarismPercentage}%`;
    
    // Update score color and label
    updateScoreDisplay(result.plagiarismPercentage);
    
    // Update matches
    displayMatches(result.results);
    
    // Show results
    app.elements.resultsContainer.classList.remove('hidden');
    app.elements.resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }
  
  function updateScoreDisplay(score) {
    // Update score circle color
    app.elements.plagiarismScore.className = '';
    
    // Update plagiarism level label
    let levelText, levelClass, explanation;
    
    if (score < 20) {
      levelText = 'Original';
      levelClass = 'label-success';
      explanation = 'Your content appears to be original. No significant matches were found in our search.';
      app.elements.plagiarismScore.classList.add('score-low');
    } else if (score < 50) {
      levelText = 'Some Similarities';
      levelClass = 'label-warning';
      explanation = 'Your content has some similarities with existing online sources. Consider reviewing the matches and citing sources if needed.';
      app.elements.plagiarismScore.classList.add('score-medium');
    } else {
      levelText = 'High Plagiarism';
      levelClass = 'label-error';
      explanation = 'Your content has significant similarities with existing sources. Please review the matches carefully and revise your content as needed.';
      app.elements.plagiarismScore.classList.add('score-high');
    }
    
    app.elements.plagiarismLevel.textContent = levelText;
    app.elements.plagiarismLevel.className = 'label';
    app.elements.plagiarismLevel.classList.add(levelClass);
    app.elements.scoreExplanation.textContent = explanation;
  }
  
  function displayMatches(matches) {
    app.elements.matchesList.innerHTML = '';
    
    if (!matches || matches.length === 0) {
      app.elements.matchesList.innerHTML = `
        <div class="empty-state">
          <p>No significant matches found.</p>
        </div>
      `;
      return;
    }
    
    matches.forEach(match => {
      const matchElement = document.createElement('div');
      matchElement.className = 'match-item animate-fade-in';
      
      const similarityPercent = Math.round(match.similarityScore * 100);
      
      matchElement.innerHTML = `
        <div class="match-header">
          <div class="match-source">
            <h5>${match.title || 'Source'}</h5>
            <a href="${match.url}" target="_blank">${match.url}</a>
          </div>
          <span class="match-score">${similarityPercent}% Match</span>
        </div>
        <div class="match-content">
          ${match.snippet || 'Content not available'}
        </div>
      `;
      
      app.elements.matchesList.appendChild(matchElement);
    });
  }
  
  function clearInput() {
    app.elements.inputText.value = '';
    updateCharacterCount();
    closeResults();
  }
  
  function closeResults() {
    app.elements.resultsContainer.classList.add('hidden');
  }
  
  function downloadReport() {
    if (!state.currentCheck) return;
    
    const result = state.currentCheck;
    
    // Create report content
    let reportContent = `
PLAGIARISM CHECK REPORT
=======================
Date: ${new Date(result.date).toLocaleString()}
Plagiarism Score: ${result.plagiarismPercentage}%

MATCHED SOURCES:
`;
    
    if (result.results && result.results.length > 0) {
      result.results.forEach((match, index) => {
        const similarityPercent = Math.round(match.similarityScore * 100);
        reportContent += `
${index + 1}. ${match.title || 'Source'} (${similarityPercent}% Match)
   URL: ${match.url}
   Snippet: ${match.snippet || 'Content not available'}
`;
      });
    } else {
      reportContent += `
No significant matches found.
`;
    }
    
    // Create a blob and download link
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plagiarism-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  function loadHistory() {
    // In a production app, this would be loaded from the server
    // For this demo, we'll make an API call
    fetch('/api/history')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          state.history = data.data;
          renderHistory();
        }
      })
      .catch(error => {
        console.error('Error loading history:', error);
      });
  }
  
  function updateHistory() {
    loadHistory();
  }
  
  function renderHistory() {
    const historyList = app.elements.historyList;
    
    // Clear existing items
    historyList.innerHTML = '';
    
    if (!state.history || state.history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>No check history yet</p>
          <a href="#" data-view="checker" class="btn-primary">Run a check</a>
        </div>
      `;
      return;
    }
    
    // Add history items
    state.history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item animate-fade-in';
      historyItem.setAttribute('data-id', item.id);
      
      // Determine score class
      let scoreClass = '';
      if (item.plagiarismPercentage < 20) {
        scoreClass = 'circle-low';
      } else if (item.plagiarismPercentage < 50) {
        scoreClass = 'circle-medium';
      } else {
        scoreClass = 'circle-high';
      }
      
      historyItem.innerHTML = `
        <div class="history-item-score ${scoreClass}">${item.plagiarismPercentage}%</div>
        <div class="history-item-details">
          <h4>Check Result</h4>
          <p>${item.textPreview}</p>
        </div>
        <div class="history-item-date">${formatDate(item.date)}</div>
      `;
      
      historyList.appendChild(historyItem);
    });
  }
  
  function viewResultDetail(id) {
    // Fetch result details
    fetch(`/api/result/${id}`)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          renderResultDetail(data.data);
          navigateToView('resultDetail');
        } else {
          throw new Error(data.message || 'Failed to load result details');
        }
      })
      .catch(error => {
        console.error('Error loading result details:', error);
        alert('Failed to load result details. Please try again.');
      });
  }
  
  function renderResultDetail(result) {
    const container = app.elements.resultDetailContent;
    
    // Determine score class
    let scoreClass = '';
    let levelText = '';
    let levelClass = '';
    
    if (result.plagiarismPercentage < 20) {
      scoreClass = 'circle-low';
      levelText = 'Original';
      levelClass = 'label-success';
    } else if (result.plagiarismPercentage < 50) {
      scoreClass = 'circle-medium';
      levelText = 'Some Similarities';
      levelClass = 'label-warning';
    } else {
      scoreClass = 'circle-high';
      levelText = 'High Plagiarism';
      levelClass = 'label-error';
    }
    
    // Render result detail
    container.innerHTML = `
      <div class="result-summary">
        <div class="score-card">
          <div class="score-display">
            <div class="score-circle ${scoreClass}">
              <span>${result.plagiarismPercentage}%</span>
            </div>
            <div class="score-label">
              <span>Plagiarism Score</span>
              <span class="label ${levelClass}">${levelText}</span>
            </div>
          </div>
          <div class="score-description">
            <p>${getScoreExplanation(result.plagiarismPercentage)}</p>
          </div>
        </div>
        
        <div class="result-meta">
          <p><strong>Date:</strong> ${formatDate(result.date, true)}</p>
          <p><strong>Text Preview:</strong> ${result.textPreview}</p>
        </div>
      </div>
      
      <div class="matches-container">
        <h4>Matched Sources</h4>
        <div class="matches-list">
          ${renderMatches(result.results)}
        </div>
      </div>
      
      <div class="result-actions" style="margin-top: 2rem; text-align: center;">
        <button id="detail-download-btn" class="btn-primary">Download Report</button>
      </div>
    `;
    
    // Add event listener to download button
    document.getElementById('detail-download-btn').addEventListener('click', () => {
      state.currentCheck = result;
      downloadReport();
    });
  }
  
  function renderMatches(matches) {
    if (!matches || matches.length === 0) {
      return `
        <div class="empty-state">
          <p>No significant matches found.</p>
        </div>
      `;
    }
    
    let html = '';
    
    matches.forEach(match => {
      const similarityPercent = Math.round(match.similarityScore * 100);
      
      html += `
        <div class="match-item animate-fade-in">
          <div class="match-header">
            <div class="match-source">
              <h5>${match.title || 'Source'}</h5>
              <a href="${match.url}" target="_blank">${match.url}</a>
            </div>
            <span class="match-score">${similarityPercent}% Match</span>
          </div>
          <div class="match-content">
            ${match.snippet || 'Content not available'}
          </div>
        </div>
      `;
    });
    
    return html;
  }
  
  function getScoreExplanation(score) {
    if (score < 20) {
      return 'Your content appears to be original. No significant matches were found in our search.';
    } else if (score < 50) {
      return 'Your content has some similarities with existing online sources. Consider reviewing the matches and citing sources if needed.';
    } else {
      return 'Your content has significant similarities with existing sources. Please review the matches carefully and revise your content as needed.';
    }
  }
  
  function formatDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    
    if (includeTime) {
      return date.toLocaleString();
    }
    
    return date.toLocaleDateString();
  }
});