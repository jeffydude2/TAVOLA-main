// When Express serves the site (http://localhost:3000) or it is hosted, the API is on the same origin.
// If you open the HTML some other way (e.g. VS Code Live Server), it falls back to localhost:3000.
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
window.APP_CONFIG = {
  API_BASE: location.protocol.startsWith('http') && (!local || location.port === '3000')
    ? '/api'
    : 'http://localhost:3000/api'
};
