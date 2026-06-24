document.addEventListener('DOMContentLoaded', () => {
    const statUsers = document.getElementById('stat-users');
    const statVision = document.getElementById('stat-vision');
    const statSos = document.getElementById('stat-sos');
    const userTableBody = document.getElementById('user-table-body');

    const loadAdminData = async () => {
        try {
            const metrics = await API.admin.metrics();
            
            if (metrics.error) {
                alert("Unauthorized: " + metrics.error);
                return;
            }

            statUsers.textContent = metrics.total_users;
            statVision.textContent = metrics.active_vision_sessions;
            statSos.textContent = metrics.recent_sos_alerts;

            // Mocking user table for now since we don't have a GET /users endpoint defined in requirements
            // A real app would fetch from an API like API.admin.users()
            userTableBody.innerHTML = `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 12px;">1</td>
                    <td style="padding: 12px;">test@test.com</td>
                    <td style="padding: 12px;"><span style="background: rgba(79, 140, 255, 0.2); color: var(--primary-color); padding: 4px 8px; border-radius: 4px; font-size: 12px;">user</span></td>
                    <td style="padding: 12px; color: var(--success-color);">Active</td>
                </tr>
            `;
        } catch (err) {
            console.error("Failed to load admin metrics", err);
        }
    };

    // Load data on initialization

    document.addEventListener('auth-success', loadAdminData);
});
