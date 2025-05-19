export function initSearch() {
    const searchInput = document.getElementById('response-search');
    const searchStats = document.getElementById('search-stats');
    const prevBtn = document.getElementById('prev-match');
    const nextBtn = document.getElementById('next-match');

    if (!searchInput || !searchStats || !prevBtn || !nextBtn) return;

    let currentMatch = -1;
    let matches = [];

    searchInput.addEventListener('input', debounce(() => {
        performSearch(searchInput.value);
    }, 300));

    prevBtn.addEventListener('click', () => navigateMatches(-1));
    nextBtn.addEventListener('click', () => navigateMatches(1));

    function performSearch(query) {
        clearHighlights();
        if (!query) {
            updateStats(0, -1);
            return;
        }

        const responseData = document.getElementById('response-data');
        const previewContainer = document.getElementById('preview-container');

        // Search in both response and preview
        matches = [];
        searchInElement(responseData, query);
        searchInElement(previewContainer, query);

        updateStats(matches.length, -1);
        if (matches.length > 0) {
            currentMatch = 0;
            highlightMatch(currentMatch);
        }
    }

    function searchInElement(element, query) {
        if (!element || !query) return;

        const text = element.textContent;
        const queryRegex = new RegExp(escapeRegExp(query), 'gi');
        let match;

        while ((match = queryRegex.exec(text)) !== null) {
            const range = document.createRange();
            const textNode = findTextNode(element, match.index);
            if (textNode) {
                const offset = match.index - getTextNodeOffset(textNode);
                range.setStart(textNode, offset);
                range.setEnd(textNode, offset + query.length);

                const span = document.createElement('span');
                span.className = 'search-highlight';
                range.surroundContents(span);
                matches.push(span);
            }
        }
    }

    function navigateMatches(direction) {
        if (matches.length === 0) return;

        // Remove active class from current match
        if (currentMatch >= 0 && currentMatch < matches.length) {
            matches[currentMatch].classList.remove('active');
        }

        // Update current match index
        currentMatch += direction;
        if (currentMatch >= matches.length) currentMatch = 0;
        if (currentMatch < 0) currentMatch = matches.length - 1;

        highlightMatch(currentMatch);
    }

    function highlightMatch(index) {
        if (index >= 0 && index < matches.length) {
            const match = matches[index];
            match.classList.add('active');
            match.scrollIntoView({ behavior: 'smooth', block: 'center' });
            updateStats(matches.length, index);
        }
    }

    function updateStats(total, current) {
        if (total === 0) {
            searchStats.textContent = '';
        } else {
            searchStats.textContent = `${current + 1}/${total}`;
        }
    }

    function clearHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
        matches = [];
        currentMatch = -1;
    }
}

// Helper functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findTextNode(element, targetIndex) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let currentIndex = 0;
    let node;

    while ((node = walker.nextNode())) {
        const length = node.textContent.length;
        if (currentIndex + length > targetIndex) {
            return node;
        }
        currentIndex += length;
    }

    return null;
}

function getTextNodeOffset(node) {
    let offset = 0;
    const walker = document.createTreeWalker(
        node.parentElement,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    while (walker.nextNode() !== node) {
        offset += walker.currentNode.textContent.length;
    }

    return offset;
}
