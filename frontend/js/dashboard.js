document.addEventListener('DOMContentLoaded', () => {
    const sosList = document.getElementById('sos-list');
    const activityList = document.getElementById('activity-list');
    const wsBadge = document.getElementById('ws-badge');
    const lastLocation = document.getElementById('last-location');
    
    let ws = null;

    const connectWebSocket = () => {
        const token = localStorage.getItem('token') || 'dummy-token';

        // Use standard WebSocket connection URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect to API port 8000 for local testing, or port 80 through nginx depending on setup.
        // Assuming we route /api/v1 via nginx on the same host:
        const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/dashboard?token=${token}`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            wsBadge.textContent = 'Connected';
            wsBadge.classList.remove('ws-disconnected');
            wsBadge.classList.add('ws-connected');
            activityList.innerHTML = '<p class="text-small">Stream active. Waiting for events...</p>';
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'sos') {
                const div = document.createElement('div');
                div.className = 'alert-item';
                div.innerHTML = `<strong>URGENT:</strong> ${data.data}<br><span class="text-small">${new Date().toLocaleTimeString()}</span>`;
                sosList.prepend(div);
                
                // Remove empty state message if it exists
                if(sosList.querySelector('p')) sosList.querySelector('p').remove();
            } 
            else if (data.type === 'location') {
                lastLocation.textContent = `Last seen: ${data.data} at ${new Date().toLocaleTimeString()}`;
            }
            
            // Add to activity stream
            const p = document.createElement('p');
            p.className = 'text-small';
            p.style.padding = '8px 0';
            p.style.borderBottom = '1px solid var(--border-subtle)';
            p.textContent = `[${new Date().toLocaleTimeString()}] ${data.data}`;
            activityList.prepend(p);
        };

        ws.onclose = () => {
            wsBadge.textContent = 'Disconnected';
            wsBadge.classList.remove('ws-connected');
            wsBadge.classList.add('ws-disconnected');
            
            // Try to reconnect
            setTimeout(connectWebSocket, 5000);
        };
    };

    const loadInitialData = async () => {
        try {
            const history = await API.sos.history();
            if (history.length > 0 && sosList) {
                sosList.innerHTML = '';
                history.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'alert-item';
                    div.style.opacity = '0.7'; // Indicate it's an old alert
                    div.innerHTML = `<strong>Previous Alert:</strong> ${item.description}<br><span class="text-small">${new Date(item.timestamp).toLocaleString()}</span>`;
                    sosList.appendChild(div);
                });
            }
        } catch (err) {
            console.error("Failed to load history", err);
        }
    };

    // Load data on new login / initialization
    document.addEventListener('auth-success', () => {
        loadInitialData();
        connectWebSocket();
    });
});
