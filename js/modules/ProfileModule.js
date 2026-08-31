import { fetchWithAuth } from '../core/api.js';

export class ProfileModule {
    constructor() {
        this.container = document.getElementById('profileContainer');
    }

    async onShow() {
        this.container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--muted);">Loading Profile...</div>`;
        await this.render();
    }

    async render() {
        try {
            // Fetch User info
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const username = user ? user.username : 'Student';
            const isAdmin = user && user.role === 'admin';

            // Fetch history and current active semester
            const [historyRes, activeRes] = await Promise.all([
                fetchWithAuth('/semester/history'),
                fetchWithAuth('/semester/active')
            ]);

            const history = historyRes.ok ? await historyRes.json() : [];
            const activeSemester = activeRes.ok ? await activeRes.json() : null;

            let html = `
                <div style="margin-top: 1rem;">
                    <div class="ios-card" style="padding: 1.5rem; display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: white;">
                            ${username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">${username}</h2>
                            <div style="color: var(--muted); font-size: 0.9rem; margin-top: 4px;">Student Profile</div>
                        </div>
                    </div>
            `;

            // Active Semester Card
            if (activeSemester && activeSemester.status === 'active') {
                html += `
                    <h3 style="margin-bottom: 0.75rem;">Current Semester</h3>
                    <div class="ios-card" style="padding: 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid var(--accent);">
                        <div style="font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">${activeSemester.sectionName}</div>
                        <div style="color: var(--muted); font-size: 0.8rem; margin-bottom: 1rem;">Started: ${activeSemester.startDate}</div>
                        <button onclick="window.pageManager.showPage('attendance')" style="background: var(--surface); border: 1px solid var(--border); color: white; padding: 8px 16px; border-radius: 8px; font-weight: 600; width: 100%;">View Live Attendance</button>
                    </div>
                `;
            }

            // Past Semesters
            if (history.length > 0) {
                html += `<h3 style="margin-bottom: 0.75rem;">Past Semesters</h3>`;
                history.forEach((sem, idx) => {
                    const endedAtDate = new Date(sem.endedAt);
                    const endedDate = `${endedAtDate.getFullYear()}-${String(endedAtDate.getMonth() + 1).padStart(2, '0')}-${String(endedAtDate.getDate()).padStart(2, '0')}`;
                    html += `
                        <div class="ios-card" style="padding: 1.5rem; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div style="font-weight: 700; font-size: 1.1rem;">${sem.sectionName}</div>
                                <div style="font-weight: 700; color: var(--accent); font-size: 1.1rem;">${sem.percentage || '--'}</div>
                            </div>
                            <div style="color: var(--muted); font-size: 0.8rem; margin-bottom: ${isAdmin ? '1rem' : '0'};">${sem.startDate} — ${endedDate}</div>
                            ${isAdmin ? `<button onclick="window.profileModuleInstance.deleteSemester('${sem._id}')" style="width: 100%; padding: 8px; background: var(--surface); border: 1px solid var(--border); color: var(--accent2); border-radius: 8px; font-weight: 600; font-size: 0.85rem;">Delete</button>` : ''}
                        </div>
                    `;
                });
            } else if (!activeSemester) {
                html += `<div style="text-align:center; padding: 2rem; color: var(--muted);">No semester records found.</div>`;
            }

            html += `
                    <div style="margin-top: 2rem; padding-bottom: 2rem;">
                        <button onclick="window.handleLogout()" style="width: 100%; padding: 14px; background: var(--surface); border: 1px solid var(--border); color: var(--accent2); border-radius: 12px; font-weight: 600; font-size: 1rem;">Log Out</button>
                    </div>
                </div>
            `;

            this.container.innerHTML = html;
            window.profileModuleInstance = this;
        } catch (e) {
            this.container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--accent2);">Error loading profile</div>`;
        }
    }

    async deleteSemester(id) {
        if (!confirm('Are you sure you want to delete this semester? This action cannot be undone.')) {
            return;
        }
        try {
            const res = await fetchWithAuth(`/semester/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await this.render();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete semester');
            }
        } catch (e) {
            alert('Error deleting semester');
        }
    }
}
