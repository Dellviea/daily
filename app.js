// =====================================================
// STATE MANAGEMENT
// =====================================================
let goals = [];
let currentStreak = 0;
let longestStreak = 0;
let lastCompletedDate = '';
let unlockedThemes = ['light', 'dark'];
let completedDates = [];
// Weekly history: { dateStr: { total, completed } }
let dailyStats = {};

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const CATEGORY_LABELS = {
    umum:      { emoji: '🎯', label: 'Umum' },
    kerja:     { emoji: '💼', label: 'Kerja' },
    belajar:   { emoji: '📚', label: 'Belajar' },
    kesehatan: { emoji: '🏃', label: 'Kesehatan' },
    keuangan:  { emoji: '💰', label: 'Keuangan' },
};

// =====================================================
// DOM REFERENCES
// =====================================================
const themeToggle          = document.getElementById('theme-toggle');
const themeDropdown        = document.getElementById('theme-dropdown');
const currentDateEl        = document.getElementById('current-date');
const progressStatsEl      = document.getElementById('progress-stats');
const progressMotivationEl = document.getElementById('progress-motivation');
const progressPercentageEl = document.getElementById('progress-percentage');
const progressCircleEl     = document.querySelector('.progress-ring-circle');
const goalForm             = document.getElementById('goal-form');
const goalInput            = document.getElementById('goal-input');
const goalCategory         = document.getElementById('goal-category');
const goalsListEl          = document.getElementById('goals-list');
const emptyStateEl         = document.getElementById('empty-state');
const clearCompletedBtn    = document.getElementById('clear-completed');
const celebrationCanvas    = document.getElementById('celebration-canvas');

// Streak
const streakBadgeEl = document.getElementById('streak-badge');
const streakCountEl = document.getElementById('streak-count');

// Modal
const recordModal        = document.getElementById('record-modal');
const modalStreakVal      = document.getElementById('modal-streak-val');
const modalApplyThemeBtn = document.getElementById('modal-apply-theme-btn');
const modalCloseBtn      = document.getElementById('modal-close-btn');

// Activity grid & analytics
const activityGridEl     = document.getElementById('activity-grid');
const analyticsCard      = document.getElementById('analytics-card');
const analyticsToggleBtn = document.getElementById('analytics-toggle-btn');
const chartContainer     = document.getElementById('chart-container');

// Header action buttons
const shareBtn        = document.getElementById('share-btn');
const notificationBtn = document.getElementById('notification-btn');

// Share canvas
const shareCanvas = document.getElementById('share-canvas');

// Quick templates
const templateChips = document.querySelectorAll('.template-chip');

const shortDayNames = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

// =====================================================
// THEME HANDLER
// =====================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    renderThemeDropdown();
}

themeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-select-container')) {
        themeDropdown.classList.remove('show');
    }
});

themeDropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.theme-option');
    if (!option) return;
    const selectedTheme = option.dataset.theme;
    if (option.classList.contains('locked')) {
        alert('Tema ini masih terkunci! Selesaikan seluruh target hari ini dan pecahkan rekor streak terlama baru Anda untuk membukanya! 🔒');
        return;
    }
    document.documentElement.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('theme', selectedTheme);
    renderThemeDropdown();
    themeDropdown.classList.remove('show');
});

function renderThemeDropdown() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    themeDropdown.querySelectorAll('.theme-option').forEach(opt => {
        const themeName = opt.dataset.theme;
        if (unlockedThemes.includes(themeName)) {
            opt.classList.remove('locked');
            const lock = opt.querySelector('.lock-indicator');
            if (lock) lock.remove();
        } else {
            opt.classList.add('locked');
            if (!opt.querySelector('.lock-indicator')) {
                const span = document.createElement('span');
                span.className = 'lock-indicator';
                span.textContent = '🔒';
                opt.appendChild(span);
            }
        }
        opt.classList.toggle('active', currentTheme === themeName);
    });
}

// =====================================================
// DATE UTILITIES
// =====================================================
function renderDate() {
    const today = new Date();
    currentDateEl.textContent = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDateStringOffset(offset) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// =====================================================
// STREAK HANDLER
// =====================================================
function loadStreak() {
    currentStreak   = parseInt(localStorage.getItem('current_streak'))   || 0;
    longestStreak   = parseInt(localStorage.getItem('longest_streak'))   || 0;
    lastCompletedDate = localStorage.getItem('last_completed_date')      || '';
    try { unlockedThemes = JSON.parse(localStorage.getItem('unlocked_themes')) || ['light','dark']; } catch(e) { unlockedThemes = ['light','dark']; }
    try { completedDates = JSON.parse(localStorage.getItem('completed_dates')) || []; } catch(e) { completedDates = []; }
    try { dailyStats = JSON.parse(localStorage.getItem('daily_stats')) || {}; } catch(e) { dailyStats = {}; }

    checkStreakValidity();
    renderStreak();
    renderActivityGrid();
    renderAnalyticsChart();
}

function checkStreakValidity() {
    if (!lastCompletedDate) return;
    const todayStr = getTodayString(), yesterdayStr = getYesterdayString();
    if (lastCompletedDate !== todayStr && lastCompletedDate !== yesterdayStr) {
        currentStreak = 0;
        localStorage.setItem('current_streak', '0');
    }
}

function renderStreak() {
    streakCountEl.textContent = currentStreak;
    streakBadgeEl.classList.remove('active', 'supercharged');
    if (currentStreak > 0) {
        streakBadgeEl.classList.add('active');
        if (currentStreak >= 3) streakBadgeEl.classList.add('supercharged');
    }
    streakBadgeEl.title = `Streak saat ini: ${currentStreak} hari | Rekor terlama: ${longestStreak} hari`;
}

function saveStreakData() {
    localStorage.setItem('current_streak', currentStreak.toString());
    localStorage.setItem('longest_streak', longestStreak.toString());
    localStorage.setItem('last_completed_date', lastCompletedDate);
    localStorage.setItem('unlocked_themes', JSON.stringify(unlockedThemes));
    localStorage.setItem('completed_dates', JSON.stringify(completedDates));
    localStorage.setItem('daily_stats', JSON.stringify(dailyStats));
}

function handleStreakIncrement() {
    const todayStr = getTodayString();
    if (!completedDates.includes(todayStr)) completedDates.push(todayStr);

    if (lastCompletedDate === todayStr) { saveStreakData(); renderActivityGrid(); return; }

    const yesterdayStr = getYesterdayString();
    currentStreak = lastCompletedDate === yesterdayStr ? currentStreak + 1 : 1;
    lastCompletedDate = todayStr;
    saveStreakData();

    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        let newlyUnlocked = false;
        if (!unlockedThemes.includes('matcha')) { unlockedThemes.push('matcha'); newlyUnlocked = true; }
        if (!unlockedThemes.includes('rose'))   { unlockedThemes.push('rose');   newlyUnlocked = true; }
        if (newlyUnlocked) { localStorage.setItem('unlocked_themes', JSON.stringify(unlockedThemes)); renderThemeDropdown(); showRecordModal(currentStreak); }
        localStorage.setItem('longest_streak', longestStreak.toString());
    }
    renderStreak();
    renderActivityGrid();
    renderAnalyticsChart();
}

function handleStreakDecrement() {
    const todayStr = getTodayString();
    if (lastCompletedDate !== todayStr) return;
    currentStreak = currentStreak > 1 ? currentStreak - 1 : 0;
    lastCompletedDate = currentStreak > 0 ? getYesterdayString() : '';
    completedDates = completedDates.filter(d => d !== todayStr);
    saveStreakData();
    renderStreak();
    renderActivityGrid();
    renderAnalyticsChart();
}

// =====================================================
// ACTIVITY GRID
// =====================================================
function renderActivityGrid() {
    if (!activityGridEl) return;
    activityGridEl.innerHTML = '';
    const todayStr = getTodayString();
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const isCompleted = completedDates.includes(dateStr);
        const isToday = dateStr === todayStr;

        const div = document.createElement('div');
        div.className = `activity-day${isCompleted ? ' completed' : ''}${isToday ? ' today' : ''}`;
        div.innerHTML = `
            <span class="day-label">${shortDayNames[d.getDay()]}</span>
            <div class="day-dot" title="${isCompleted ? 'Semua target selesai! 🎉' : (isToday ? 'Hari ini' : 'Belum selesai')}">${d.getDate()}</div>
        `;
        activityGridEl.appendChild(div);
    }
}

// =====================================================
// ANALYTICS CHART (SVG BAR CHART)
// =====================================================
function renderAnalyticsChart() {
    if (!chartContainer) return;

    const chartW = 320, chartH = 80, barCount = 7;
    const barW = 28, gap = (chartW - barW * barCount) / (barCount + 1);
    const labelY = chartH + 14, pctY = chartH + 24;

    let svgBars = '';
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const stats = dailyStats[dateStr] || { total: 0, completed: 0 };
        const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const barH = Math.max(4, Math.round((pct / 100) * chartH));
        const colIndex = 6 - i;
        const x = gap + colIndex * (barW + gap);
        const y = chartH - barH;
        const isToday = (i === 0);
        const opacity = pct === 0 ? 0.18 : (pct < 100 ? 0.55 : 1);
        const fill = pct === 100 ? 'url(#bar-gradient)' : 'var(--accent-color)';

        svgBars += `
            <rect class="chart-bar-bg" x="${x}" y="0" width="${barW}" height="${chartH}" rx="5" fill="var(--bg-primary)"/>
            <rect class="chart-bar" x="${x}" y="${y}" width="${barW}" height="${barH}" rx="5" fill="${fill}" opacity="${opacity}"/>
            <text class="chart-label" x="${x + barW/2}" y="${labelY}">${shortDayNames[d.getDay()]}</text>
            ${pct > 0 ? `<text class="chart-pct" x="${x + barW/2}" y="${y - 4}">${pct}%</text>` : ''}
        `;
    }

    chartContainer.innerHTML = `
        <svg viewBox="0 0 ${chartW} ${pctY + 4}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--gradient-start)"/>
                    <stop offset="100%" stop-color="var(--gradient-end)"/>
                </linearGradient>
            </defs>
            ${svgBars}
        </svg>
    `;
}

analyticsToggleBtn.addEventListener('click', () => {
    analyticsCard.classList.toggle('collapsed');
    if (!analyticsCard.classList.contains('collapsed')) renderAnalyticsChart();
});

// =====================================================
// MODAL REWARD
// =====================================================
function showRecordModal(streakVal) {
    modalStreakVal.textContent = streakVal;
    recordModal.classList.add('show');
}

modalCloseBtn.addEventListener('click', () => recordModal.classList.remove('show'));
recordModal.addEventListener('click', (e) => { if (e.target === recordModal) recordModal.classList.remove('show'); });

modalApplyThemeBtn.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', 'matcha');
    localStorage.setItem('theme', 'matcha');
    renderThemeDropdown();
    recordModal.classList.remove('show');
});

// =====================================================
// QUICK TEMPLATES
// =====================================================
templateChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const text = chip.dataset.text;
        const cat  = chip.dataset.category || 'umum';
        const newGoal = { id: Date.now().toString(), text, completed: false, category: cat };
        goals.push(newGoal);
        saveGoals();
        renderApp();
        // Flash feedback on chip
        chip.style.transform = 'scale(0.94)';
        setTimeout(() => { chip.style.transform = ''; }, 180);
    });
});

// =====================================================
// NOTIFICATIONS
// =====================================================
function initNotificationState() {
    const notifOn = localStorage.getItem('notif_enabled') === 'true';
    notificationBtn.classList.toggle('notif-on', notifOn);
}

notificationBtn.addEventListener('click', async () => {
    if (!('Notification' in window)) {
        alert('Browser Anda tidak mendukung notifikasi.');
        return;
    }
    const current = localStorage.getItem('notif_enabled') === 'true';
    if (current) {
        // Turn off
        localStorage.setItem('notif_enabled', 'false');
        notificationBtn.classList.remove('notif-on');
        alert('Pengingat harian dinonaktifkan. 🔕');
        return;
    }
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        localStorage.setItem('notif_enabled', 'true');
        notificationBtn.classList.add('notif-on');
        // Instant test notification
        new Notification('Daily Goal Tracker 🎯', {
            body: 'Pengingat aktif! Kamu akan diingatkan untuk mengisi target harian.',
            icon: ''
        });
        scheduleNotification();
    } else {
        alert('Izin notifikasi ditolak. Aktifkan di pengaturan browser Anda.');
    }
});

function scheduleNotification() {
    // Schedule a reminder if the page is still open at 20:00
    const now = new Date();
    const target = new Date();
    target.setHours(20, 0, 0, 0);
    if (now >= target) target.setDate(target.getDate() + 1);
    const delay = target - now;
    setTimeout(() => {
        if (localStorage.getItem('notif_enabled') === 'true' && Notification.permission === 'granted') {
            const todayDoneAll = localStorage.getItem('last_percentage') === '100';
            new Notification('Daily Goal Tracker 🌙', {
                body: todayDoneAll
                    ? 'Luar biasa! Kamu sudah menyelesaikan semua target hari ini! 🎉'
                    : 'Eh, jangan lupa centang target harianmu sebelum tidur ya! 💪'
            });
            scheduleNotification(); // schedule again for next day
        }
    }, delay);
}

// =====================================================
// SHARE CARD GENERATOR (Canvas)
// =====================================================
shareBtn.addEventListener('click', () => {
    generateShareCard();
});

function generateShareCard() {
    const canvas = shareCanvas;
    const ctx = canvas.getContext('2d');
    const W = 600, H = 600;
    canvas.width = W; canvas.height = H;

    const theme = document.documentElement.getAttribute('data-theme') || 'light';

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    if (theme === 'rose') {
        bgGrad.addColorStop(0, '#fbf6f6');
        bgGrad.addColorStop(1, '#fdecea');
    } else if (theme === 'matcha') {
        bgGrad.addColorStop(0, '#f2f6f3');
        bgGrad.addColorStop(1, '#e5eeea');
    } else if (theme === 'dark') {
        bgGrad.addColorStop(0, '#131b2e');
        bgGrad.addColorStop(1, '#090d16');
    } else {
        bgGrad.addColorStop(0, '#f8fafc');
        bgGrad.addColorStop(1, '#ede9fe');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative soft circles
    const accent = theme === 'rose' ? '#cc8b89' : theme === 'matcha' ? '#689f92' : theme === 'dark' ? '#8b5cf6' : '#6366f1';
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(W - 80, 80, 160, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(80, H - 80, 120, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Card white panel
    ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)';
    roundRect(ctx, 50, 50, W - 100, H - 100, 32);
    ctx.fill();

    const textColor  = theme === 'dark' ? '#f8fafc' : '#0f172a';
    const mutedColor = theme === 'dark' ? '#64748b' : '#94a3b8';

    // App name
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText('Daily Goal Tracker', W / 2, 120);

    // Trophy emoji
    ctx.font = '64px serif';
    ctx.fillText('🏆', W / 2, 215);

    // Streak number
    ctx.font = 'bold 72px Outfit, sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText(`${currentStreak}`, W / 2, 310);

    ctx.font = '600 20px Outfit, sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText('hari streak berturut-turut', W / 2, 345);

    // Divider
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, 375); ctx.lineTo(W - 120, 375); ctx.stroke();

    // Stats row
    const total = goals.length;
    const completedCount = goals.filter(g => g.completed).length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'center';

    const stats = [
        { label: 'Target Selesai', val: `${completedCount}/${total}` },
        { label: 'Progress Hari Ini', val: `${pct}%` },
        { label: 'Rekor Terlama', val: `${longestStreak} hari` }
    ];
    stats.forEach((s, i) => {
        const x = 150 + i * 150;
        ctx.fillStyle = textColor;
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillText(s.val, x, 420);
        ctx.fillStyle = mutedColor;
        ctx.font = '500 12px Outfit, sans-serif';
        ctx.fillText(s.label, x, 440);
    });

    // Today's date
    const today = new Date();
    const dateStr = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    ctx.fillStyle = mutedColor;
    ctx.font = '500 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dateStr, W / 2, 505);

    // Streak icons row
    ctx.font = '18px serif';
    const iconCount = Math.min(currentStreak, 9);
    const startX = W / 2 - ((iconCount - 1) * 26) / 2;
    for (let i = 0; i < iconCount; i++) {
        ctx.fillText('🔥', startX + i * 26, 475);
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `streak-${currentStreak}-hari.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// =====================================================
// GOAL MANAGEMENT
// =====================================================
function loadGoals() {
    const stored = localStorage.getItem('daily_goals');
    if (stored) {
        try { goals = JSON.parse(stored); } catch(e) { goals = []; }
    }
    renderApp();
}

function saveGoals() {
    localStorage.setItem('daily_goals', JSON.stringify(goals));
    // Update daily stats for today
    const todayStr = getTodayString();
    dailyStats[todayStr] = { total: goals.length, completed: goals.filter(g => g.completed).length };
    localStorage.setItem('daily_stats', JSON.stringify(dailyStats));
}

function getMotivationMessage(percentage, total) {
    if (total === 0) return 'Tulis target pertamamu sekarang! 🎯';
    if (percentage === 0) return 'Mari mulai hari ini dengan produktif! 🌟';
    if (percentage < 40) return 'Langkah awal yang baik, terus maju! 🚀';
    if (percentage < 70) return 'Setengah jalan terlampaui. Kamu hebat! 💪';
    if (percentage < 100) return 'Sedikit lagi selesai. Kamu hampir sampai! 🔥';
    return 'Luar biasa! Semua target selesai hari ini! 🎉';
}

const CIRCUMFERENCE = 226.195;

function updateProgress() {
    const total     = goals.length;
    const completed = goals.filter(g => g.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressStatsEl.textContent      = `${completed} dari ${total} selesai`;
    progressPercentageEl.textContent = `${percentage}%`;
    progressMotivationEl.textContent = getMotivationMessage(percentage, total);

    const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
    progressCircleEl.style.strokeDashoffset = offset;

    const wasCompletedBefore = localStorage.getItem('last_percentage') === '100';
    if (percentage === 100 && total > 0 && !wasCompletedBefore) {
        triggerCelebration();
        handleStreakIncrement();
    } else if (percentage < 100 && wasCompletedBefore) {
        handleStreakDecrement();
    }
    localStorage.setItem('last_percentage', percentage.toString());

    // Refresh analytics if open
    if (!analyticsCard.classList.contains('collapsed')) renderAnalyticsChart();
}

function triggerCelebration() {
    const emojis = ['🎉', '🎯', '✨', '🔥', '🙌', '🌟', '🚀'];
    for (let i = 0; i < 35; i++) {
        const p = document.createElement('div');
        p.className = 'confetti';
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
        p.style.fontSize = (Math.random() * 15 + 15) + 'px';
        celebrationCanvas.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
    }
}

function renderApp() {
    const isEmpty = goals.length === 0;
    emptyStateEl.style.display = isEmpty ? 'flex' : 'none';
    const hasCompleted = goals.some(g => g.completed);
    clearCompletedBtn.style.display = (!isEmpty && hasCompleted) ? 'flex' : 'none';

    goalsListEl.innerHTML = '';
    goals.forEach(goal => {
        const li = document.createElement('li');
        li.className = `goal-item${goal.completed ? ' completed' : ''}`;
        li.dataset.id = goal.id;
        const cat = goal.category || 'umum';
        const catMeta = CATEGORY_LABELS[cat] || CATEGORY_LABELS.umum;

        li.innerHTML = `
            <div class="goal-checkbox" aria-label="Tandai selesai">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="goal-text-wrapper">
                <span class="goal-text">${escapeHTML(goal.text)}</span>
                <span class="category-badge" data-category="${cat}">${catMeta.emoji} ${catMeta.label}</span>
            </div>
            <div class="goal-actions">
                <button class="action-btn edit-btn" aria-label="Edit target">
                    <svg viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="action-btn delete-btn" aria-label="Hapus target">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        goalsListEl.appendChild(li);
    });

    updateProgress();
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, t => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[t] || t));
}

// =====================================================
// FORM: ADD GOAL
// =====================================================
goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = goalInput.value.trim();
    if (!text) return;
    goals.push({ id: Date.now().toString(), text, completed: false, category: goalCategory.value || 'umum' });
    saveGoals();
    renderApp();
    goalInput.value = '';
    goalInput.focus();
});

// =====================================================
// GOAL ITEM INTERACTIONS (Checkbox, Edit, Delete)
// =====================================================
goalsListEl.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.goal-item');
    if (!itemEl) return;
    const goalIndex = goals.findIndex(g => g.id === itemEl.dataset.id);
    if (goalIndex === -1) return;

    if (e.target.closest('.goal-checkbox') || e.target.closest('.goal-text-wrapper')) {
        if (itemEl.querySelector('.goal-edit-input')) return;
        goals[goalIndex].completed = !goals[goalIndex].completed;
        saveGoals(); renderApp(); return;
    }
    if (e.target.closest('.delete-btn')) {
        itemEl.classList.add('removing');
        itemEl.addEventListener('animationend', (evt) => {
            if (evt.animationName === 'slideOut') { goals.splice(goalIndex, 1); saveGoals(); renderApp(); }
        }); return;
    }
    if (e.target.closest('.edit-btn')) enterEditMode(itemEl, goalIndex);
});

function enterEditMode(itemEl, goalIndex) {
    const textWrapper = itemEl.querySelector('.goal-text-wrapper');
    const actionsDiv  = itemEl.querySelector('.goal-actions');
    if (itemEl.querySelector('.goal-edit-input')) return;

    const input = document.createElement('input');
    input.type = 'text'; input.className = 'goal-edit-input';
    input.value = goals[goalIndex].text; input.maxLength = 80;
    textWrapper.innerHTML = ''; textWrapper.appendChild(input);
    input.focus(); input.select();

    actionsDiv.innerHTML = `
        <button class="action-btn save-edit-btn" aria-label="Simpan">
            <svg viewBox="0 0 24 24" style="stroke:var(--success-color)"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </button>
        <button class="action-btn cancel-edit-btn" aria-label="Batal">
            <svg viewBox="0 0 24 24" style="stroke:var(--danger-color)"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    `;

    const save   = () => { const t = input.value.trim(); if (t) { goals[goalIndex].text = t; saveGoals(); } renderApp(); };
    const cancel = () => renderApp();

    input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); else if (e.key === 'Escape') cancel(); });
    actionsDiv.querySelector('.save-edit-btn').addEventListener('click', e => { e.stopPropagation(); save(); });
    actionsDiv.querySelector('.cancel-edit-btn').addEventListener('click', e => { e.stopPropagation(); cancel(); });

    const outside = (e) => { if (!itemEl.contains(e.target)) { save(); document.removeEventListener('click', outside); } };
    setTimeout(() => document.addEventListener('click', outside), 50);
}

// =====================================================
// CLEAR COMPLETED
// =====================================================
clearCompletedBtn.addEventListener('click', () => {
    const items = Array.from(goalsListEl.querySelectorAll('.goal-item.completed'));
    if (!items.length) return;
    let count = 0;
    items.forEach(itemEl => {
        itemEl.classList.add('removing');
        itemEl.addEventListener('animationend', (evt) => {
            if (evt.animationName === 'slideOut') {
                count++;
                if (count === items.length) { goals = goals.filter(g => !g.completed); saveGoals(); renderApp(); }
            }
        });
    });
});

// =====================================================
// INIT
// =====================================================
initTheme();
renderDate();
loadStreak();
loadGoals();
initNotificationState();
if (localStorage.getItem('notif_enabled') === 'true' && Notification.permission === 'granted') scheduleNotification();
