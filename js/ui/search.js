/**
 * Search functionality for response data
 */

let currentMatches = [];
let currentMatchIndex = -1;

export function initSearch() {
    // Get required elements
    const searchInput = document.getElementById('response-search');
    const searchStats = document.getElementById('search-stats');
    const prevMatchBtn = document.getElementById('prev-match');
    const nextMatchBtn = document.getElementById('next-match');
    
    if (!searchInput || !searchStats || !prevMatchBtn || !nextMatchBtn) {
        console.error('Search elements not found, they might not be loaded yet');
        // Retry after a short delay
        setTimeout(initSearch, 500);
        return;
    }

    // Set up input event
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.trim();
        if (searchTerm.length < 2) {
            clearHighlights();
            searchStats.textContent = '';
            return;
        }

        performSearch(searchTerm);
    });

    // Set up navigation buttons
    prevMatchBtn.addEventListener('click', function () {
        navigateMatches('prev');
    });

    nextMatchBtn.addEventListener('click', function () {
        navigateMatches('next');
    });
}

/**
 * Perform search on response data
 */
function performSearch(searchTerm) {
    const responseData = document.getElementById('response-data');
    const searchStats = document.getElementById('search-stats');
    const previewContainer = document.getElementById('preview-container');

    if (!responseData || !searchStats) return;

    // Clear previous highlights
    clearHighlights();

    // Search in the visible container (either response data or preview)
    const previewActive = document.getElementById('preview-view-btn')?.classList.contains('active');
    const container = previewActive ? previewContainer : responseData;

    if (!container) return;

    // Get container text content
    const text = container.textContent;
    if (!text) {
        searchStats.textContent = '0 matches';
        return;
    }

    // Escape special characters in search term
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedTerm, 'gi');

    // Find all matches in text
    let matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push({
            index: match.index,
            text: match[0]
        });
    }

    // Update matches array
    currentMatches = matches;
    currentMatchIndex = matches.length > 0 ? 0 : -1;

    // Update stats
    searchStats.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;

    // Highlight matches
    highlightMatches(container, matches);

    // Scroll to first match
    if (matches.length > 0) {
        scrollToMatch(0);
    }
}

/**
 * Clear all search highlights
 */
function clearHighlights() {
    // Clear in both response data and preview
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(el => {
        const text = el.textContent;
        el.replaceWith(text);
    });

    currentMatches = [];
    currentMatchIndex = -1;
}

/**
 * Navigate between matches
 */
function navigateMatches(direction) {
    if (currentMatches.length === 0) return;

    // Update current match index
    if (direction === 'next') {
        currentMatchIndex = (currentMatchIndex + 1) % currentMatches.length;
    } else {
        currentMatchIndex = (currentMatchIndex - 1 + currentMatches.length) % currentMatches.length;
    }

    // Remove active class from all highlights
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(el => el.classList.remove('active'));

    // Add active class to current match
    const currentMatchEls = document.querySelectorAll('.search-highlight');
    if (currentMatchEls[currentMatchIndex]) {
        currentMatchEls[currentMatchIndex].classList.add('active');
        scrollToMatch(currentMatchIndex);
    }
}

/**
 * Highlight matches in container
 */
function highlightMatches(container, matches) {
    // Only proceed if we have matches
    if (matches.length === 0) return;

    // This is a simplified approach - for complex HTML this would need improvement
    let html = container.innerHTML;

    // Replace matches with highlighted spans, starting from the end to avoid index shifts
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const before = html.substring(0, match.index);
        const after = html.substring(match.index + match.text.length);
        html = before + `<span class="search-highlight${i === 0 ? ' active' : ''}">${match.text}</span>` + after;
    }

    container.innerHTML = html;
}

/**
 * Scroll to a specific match
 */
function scrollToMatch(index) {
    if (currentMatches.length === 0) return;

    const matchElements = document.querySelectorAll('.search-highlight');
    if (matchElements[index]) {
        matchElements[index].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

/**
 * Update search when response data changes
 */
export function updateSearch() {
    const searchInput = document.getElementById('response-search');
    if (searchInput && searchInput.value.trim().length >= 2) {
        performSearch(searchInput.value.trim());
    }
}
