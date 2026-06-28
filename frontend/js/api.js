const BASE_URL = 'http://localhost:5000/api';

const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            ...options.headers,
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // don't set Content-Type if sending FormData (browser does it automatically with boundary)
        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API request failed');
        }

        return response.json();
    },

    auth: {
        login: async (email, password) => {
            // Our new Node backend expects JSON, not Form urlencoded
            const res = await API.request('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.token) {
                localStorage.setItem('token', res.token);
            }
            return res;
        },
        me: () => API.request('/auth/me')
    },

    vision: {
        detect: (blob) => {
            const fd = new FormData();
            fd.append('file', blob, 'image.jpg');
            return fetch('http://localhost:8000/api/v1/vision/detect?lang=en', { method: 'POST', body: fd })
                .then(res => {
                    if (!res.ok) throw new Error('API request failed');
                    return res.json();
                });
        },
        readText: (blob) => {
            const fd = new FormData();
            fd.append('file', blob, 'image.jpg');
            return fetch('http://localhost:8000/api/v1/vision/read-text?lang=en', { method: 'POST', body: fd })
                .then(res => {
                    if (!res.ok) throw new Error('API request failed');
                    return res.json();
                });
        }
    },

    sos: {
        trigger: (lat, lon) => API.request('/sos/', {
            method: 'POST',
            body: JSON.stringify({ latitude: lat, longitude: lon })
        }),
        history: () => API.request('/sos/history')
    },

    admin: {
        metrics: () => API.request('/admin/metrics')
    }
};
