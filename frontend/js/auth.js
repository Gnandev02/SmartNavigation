document.addEventListener('DOMContentLoaded', () => {
    // Automatically trigger auth-success since login is removed
    document.dispatchEvent(new Event('auth-success'));
});
