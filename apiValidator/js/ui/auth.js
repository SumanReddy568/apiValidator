import { showNotification } from '../utils/notifications.js';

export function initAuthFunctionality() {
    const authType = document.getElementById('auth-type');
    const authContent = document.querySelector('.auth-content');

    if (authType && authContent) {
        authType.addEventListener('change', () => {
            const type = authType.value;
            let content = '';

            switch (type) {
                case 'basic':
                    content = `
                        <div class="auth-basic">
                            <div class="auth-field">
                                <label for="basic-username">Username</label>
                                <input type="text" id="basic-username" placeholder="Username" />
                            </div>
                            <div class="auth-field">
                                <label for="basic-password">Password</label>
                                <input type="password" id="basic-password" placeholder="Password" />
                            </div>
                        </div>
                    `;
                    break;
                case 'bearer':
                    content = `
                        <div class="auth-bearer">
                            <div class="auth-field">
                                <label for="bearer-token">Token</label>
                                <input type="text" id="bearer-token" placeholder="Bearer token" />
                            </div>
                        </div>
                    `;
                    break;
                case 'oauth2':
                    content = `
                        <div class="auth-oauth">
                            <div class="auth-field">
                                <label for="client-id">Client ID</label>
                                <input type="text" id="client-id" placeholder="Client ID" />
                            </div>
                            <div class="auth-field">
                                <label for="client-secret">Client Secret</label>
                                <input type="password" id="client-secret" placeholder="Client Secret" />
                            </div>
                            <div class="auth-field">
                                <label for="auth-url">Auth URL</label>
                                <input type="text" id="auth-url" placeholder="Authorization URL" />
                            </div>
                            <div class="auth-field">
                                <label for="access-token-url">Access Token URL</label>
                                <input type="text" id="access-token-url" placeholder="Access Token URL" />
                            </div>
                            <button class="btn-secondary" id="get-token"><i class="fas fa-key"></i> Get Token</button>
                        </div>
                    `;
                    break;
                default:
                    content = '<p>No authentication selected</p>';
            }

            authContent.innerHTML = content;

            // Add event listener for OAuth2 Get Token button
            if (type === 'oauth2') {
                const getTokenButton = document.getElementById('get-token');
                if (getTokenButton) {
                    getTokenButton.addEventListener('click', getOAuthToken);
                }
            }
        });
    }
}

function getOAuthToken() {
    const clientId = document.getElementById('client-id').value;
    const clientSecret = document.getElementById('client-secret').value;
    const authUrl = document.getElementById('auth-url').value;
    const tokenUrl = document.getElementById('access-token-url').value;

    if (!clientId || !clientSecret || !authUrl || !tokenUrl) {
        showNotification('Please fill all OAuth2 fields', 'error');
        return;
    }

    // In a real application, this would redirect to auth URL or open a popup
    // Here we'll simulate the process
    const getTokenBtn = document.getElementById('get-token');
    getTokenBtn.disabled = true;
    getTokenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

    setTimeout(() => {
        // Simulate successful token retrieval
        showNotification('OAuth token retrieved successfully', 'success');
        getTokenBtn.disabled = false;
        getTokenBtn.innerHTML = '<i class="fas fa-key"></i> Get Token';

        // Create a hidden token input that would be used for requests
        if (!document.getElementById('oauth-token')) {
            const tokenField = document.createElement('div');
            tokenField.className = 'auth-field';
            tokenField.innerHTML = `
                <label for="oauth-token">Access Token <span class="token-valid">(valid for 1 hour)</span></label>
                <div class="token-display">
                    <input type="text" id="oauth-token" value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." readonly />
                    <button class="btn-icon copy-token" title="Copy token"><i class="fas fa-copy"></i></button>
                </div>
            `;
            document.querySelector('.auth-oauth').appendChild(tokenField);

            document.querySelector('.copy-token').addEventListener('click', () => {
                const tokenInput = document.getElementById('oauth-token');
                tokenInput.select();
                document.execCommand('copy');
                showNotification('Token copied to clipboard', 'info');
            });
        }
    }, 2000);
}
