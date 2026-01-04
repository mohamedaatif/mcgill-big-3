/**
 * McGill Big 3 - Main App Controller
 * Navigation, UI updates, and feature orchestration
 */

const App = (() => {
    // App state
    let settings = {};
    let currentPage = 'workout';
    let workoutInProgress = false;

    // DOM Elements cache
    const elements = {};

    // Initialize app
    async function init() {
        // Cache DOM elements
        cacheElements();

        // Initialize storage
        await Storage.init();

        // Load settings
        settings = await Storage.getSettings();
        applySettings();

        // Setup navigation
        setupNavigation();

        // Setup page handlers
        setupWorkoutPage();
        setupProgressPage();
        setupPainLogPage();
        setupHabitsPage();
        setupSettingsPage();
        setupRecoveryPage();

        // Update UI
        updateGreeting();
        await updateConsistencyCard();
        updateLevelBadge();
        updateExerciseList();

        // Register service worker
        registerServiceWorker();

        console.log('McGill Big 3 App initialized');
    }

    // Cache DOM elements for performance
    function cacheElements() {
        elements.bottomNav = document.getElementById('bottomNav');
        elements.pagesContainer = document.getElementById('pagesContainer');
        elements.greeting = document.getElementById('greeting');
        elements.subtitle = document.getElementById('subtitle');
        elements.weeklyScore = document.getElementById('weeklyScore');
        elements.consistencyFill = document.getElementById('consistencyFill');
        elements.levelBadge = document.getElementById('levelBadge');
        elements.exerciseList = document.getElementById('exerciseList');
        elements.startWorkout = document.getElementById('startWorkout');
        elements.workoutPreview = document.getElementById('workoutPreview');
        elements.workoutActive = document.getElementById('workoutActive');
        elements.workoutComplete = document.getElementById('workoutComplete');
        elements.timerProgress = document.getElementById('timerProgress');
        elements.timerValue = document.getElementById('timerValue');
        elements.timerLabel = document.getElementById('timerLabel');
        elements.currentExerciseName = document.getElementById('currentExerciseName');
        elements.currentSide = document.getElementById('currentSide');
        elements.repCurrent = document.getElementById('repCurrent');
        elements.repTotal = document.getElementById('repTotal');
        elements.phaseIndicator = document.getElementById('phaseIndicator');
        elements.pauseWorkout = document.getElementById('pauseWorkout');
        elements.stopWorkout = document.getElementById('stopWorkout');
        elements.badDayMode = document.getElementById('badDayMode');
        elements.toast = document.getElementById('toast');
        elements.toastMessage = document.getElementById('toastMessage');
    }

    // Setup navigation
    function setupNavigation() {
        const navItems = elements.bottomNav.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                navigateTo(page);
            });
        });

        // Settings FAB button
        const settingsFab = document.getElementById('settingsFab');
        if (settingsFab) {
            settingsFab.addEventListener('click', () => navigateTo('settings'));
        }
    }

    // Navigate to a page
    function navigateTo(pageName) {
        if (workoutInProgress && pageName !== 'workout') {
            showToast('Complete or stop your workout first');
            return;
        }

        // Update nav
        elements.bottomNav.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `page-${pageName}`);
        });

        currentPage = pageName;

        // Refresh page data
        if (pageName === 'progress') {
            refreshProgressPage();
        } else if (pageName === 'pain-log') {
            refreshPainHistory();
        }
    }

    // Update greeting based on time
    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        let subtitle = 'Ready for your McGill Big 3?';

        if (hour < 12) {
            greeting = 'Good morning';
            subtitle = 'Start your day with spine care';
        } else if (hour < 17) {
            greeting = 'Good afternoon';
            subtitle = 'Time for your McGill Big 3?';
        }

        elements.greeting.textContent = greeting;
        elements.subtitle.textContent = subtitle;
    }

    // Update consistency card
    async function updateConsistencyCard() {
        const consistency = await Analytics.getWeeklyConsistency();
        elements.weeklyScore.textContent = `${consistency.completed}/7 days`;
        elements.consistencyFill.style.width = `${consistency.percentage}%`;
    }

    // Update level badge
    function updateLevelBadge() {
        const level = Exercises.getLevel(settings.level);
        const badge = elements.levelBadge;

        badge.querySelector('.level-icon').textContent = level.icon;
        badge.querySelector('.level-text').textContent = level.name;
        badge.querySelector('.level-detail').textContent = level.description;
    }

    // Update exercise list preview
    function updateExerciseList() {
        const isBadDay = elements.badDayMode.checked;
        const plan = Exercises.generateWorkoutPlan(settings.level, isBadDay);

        // Group exercises
        const exerciseGroups = {};
        plan.exercises.forEach(item => {
            const id = item.exercise.id.replace('-left', '').replace('-right', '');
            if (!exerciseGroups[id]) {
                exerciseGroups[id] = {
                    name: item.exercise.name,
                    icon: item.exercise.icon,
                    sets: plan.level.pyramid.length,
                    repsPerSet: plan.level.pyramid.join('-'),
                    holdDuration: plan.level.holdDuration
                };
            }
        });

        let html = '';
        Object.values(exerciseGroups).forEach(ex => {
            html += `
                <div class="exercise-card">
                    <div class="exercise-icon">${ex.icon}</div>
                    <div class="exercise-info">
                        <div class="exercise-name">${ex.name}</div>
                        <div class="exercise-detail">${ex.repsPerSet} reps × ${ex.holdDuration}s holds</div>
                    </div>
                </div>
            `;
        });

        elements.exerciseList.innerHTML = html;
    }

    // Apply settings
    function applySettings() {
        // Dark mode
        if (!settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Update setting inputs if on settings page
        const settingElements = {
            settingHoldDuration: settings.holdDuration,
            settingRestDuration: settings.restDuration,
            settingLevel: settings.level,
            settingWalkingGoal: settings.walkingGoal,
            settingReminder: settings.reminderEnabled,
            settingReminderTime: settings.reminderTime,
            settingDarkMode: settings.darkMode,
            settingSounds: settings.soundEnabled,
            settingVibration: settings.vibrationEnabled
        };

        Object.entries(settingElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = value;
                } else {
                    el.value = value;
                }
            }
        });
    }

    // Setup workout page
    function setupWorkoutPage() {
        // Start workout button
        elements.startWorkout.addEventListener('click', startWorkout);

        // Bad day mode toggle
        elements.badDayMode.addEventListener('change', () => {
            updateExerciseList();
            if (elements.badDayMode.checked) {
                showToast('Bad Day mode: Simplified routine');
            }
        });

        // Pause button
        elements.pauseWorkout.addEventListener('click', () => {
            const state = Timer.getState();
            if (state.isPaused) {
                Timer.resume();
                elements.pauseWorkout.textContent = 'Pause';
            } else {
                Timer.pause();
                elements.pauseWorkout.textContent = 'Resume';
            }
        });

        // Stop button - with double-click confirmation
        let stopClickCount = 0;
        let stopClickTimeout = null;

        elements.stopWorkout.addEventListener('click', () => {
            stopClickCount++;

            if (stopClickCount === 1) {
                elements.stopWorkout.textContent = 'Tap again to confirm';
                elements.stopWorkout.style.background = '#f43f5e';

                stopClickTimeout = setTimeout(() => {
                    stopClickCount = 0;
                    elements.stopWorkout.textContent = 'Stop';
                    elements.stopWorkout.style.background = '';
                }, 2000);
            } else if (stopClickCount >= 2) {
                clearTimeout(stopClickTimeout);
                stopClickCount = 0;
                elements.stopWorkout.textContent = 'Stop';
                elements.stopWorkout.style.background = '';
                Timer.stopTimer();
                endWorkout(false);
            }
        });

        // Done button
        document.getElementById('doneWorkout').addEventListener('click', () => {
            elements.workoutComplete.classList.add('hidden');
            elements.workoutPreview.classList.remove('hidden');
            elements.startWorkout.classList.remove('hidden');
        });

        // Log pain after workout
        document.getElementById('logPainAfter').addEventListener('click', () => {
            elements.workoutComplete.classList.add('hidden');
            elements.workoutPreview.classList.remove('hidden');
            elements.startWorkout.classList.remove('hidden');
            navigateTo('pain-log');
        });
    }

    // Start workout
    function startWorkout() {
        // Initialize audio context on user interaction
        Timer.initAudio();

        const isBadDay = elements.badDayMode.checked;
        const plan = Exercises.generateWorkoutPlan(settings.level, isBadDay);

        // Hide preview, show active workout
        elements.workoutPreview.classList.add('hidden');
        elements.startWorkout.classList.add('hidden');
        elements.workoutActive.classList.remove('hidden');
        elements.workoutComplete.classList.add('hidden');

        workoutInProgress = true;

        // Update initial UI
        const firstExercise = plan.exercises[0];
        updateWorkoutUI({
            exercise: firstExercise,
            time: 3,
            phase: 'transition',
            rep: 1,
            totalReps: firstExercise.reps
        });

        // Start timer
        Timer.startWorkout(plan, {
            holdDuration: isBadDay ? 5 : settings.holdDuration,
            restDuration: settings.restDuration,
            soundEnabled: settings.soundEnabled,
            vibrationEnabled: settings.vibrationEnabled
        }, {
            onTick: (data) => updateWorkoutUI(data),
            onPhaseChange: (data) => updatePhaseUI(data),
            onExerciseChange: (data) => updateExerciseUI(data),
            onRepComplete: (data) => onRepComplete(data),
            onSetComplete: (data) => onSetComplete(data),
            onWorkoutComplete: (data) => onWorkoutComplete(data)
        });
    }

    // Update workout UI on tick
    function updateWorkoutUI(data) {
        elements.timerValue.textContent = data.time;

        // Update progress ring
        const circumference = 565.48; // 2 * PI * 90
        const progress = Timer.getProgressPercent();
        const offset = circumference - (progress / 100) * circumference;
        elements.timerProgress.style.strokeDashoffset = offset;

        // Update reps
        elements.repCurrent.textContent = data.rep;
        elements.repTotal.textContent = data.totalReps;
    }

    // Update phase UI
    function updatePhaseUI(data) {
        const phaseText = elements.phaseIndicator.querySelector('.phase-text');

        if (data.phase === 'hold') {
            phaseText.textContent = 'HOLD';
            phaseText.classList.remove('rest');
            elements.timerProgress.style.stroke = '#06b6d4';
        } else if (data.phase === 'rest') {
            phaseText.textContent = 'REST';
            phaseText.classList.add('rest');
            elements.timerProgress.style.stroke = '#f59e0b';
        }

        elements.timerLabel.textContent = 'seconds';
    }

    // Update exercise UI
    function updateExerciseUI(data) {
        elements.currentExerciseName.textContent = data.exercise.exercise.name;
        elements.currentSide.textContent = data.exercise.exercise.side || '';
    }

    // Rep complete callback
    function onRepComplete(data) {
        // Satisfying animation/feedback already handled by Timer
    }

    // Set complete callback
    function onSetComplete(data) {
        // Could add badge unlocks or achievements here
    }

    // Workout complete callback
    async function onWorkoutComplete(data) {
        workoutInProgress = false;

        // Save workout
        await Storage.saveWorkout({
            completed: true,
            duration: data.duration,
            level: settings.level,
            badDayMode: elements.badDayMode.checked,
            exercisesCompleted: data.exercisesCompleted
        });

        // Update consistency
        await updateConsistencyCard();

        // Show complete screen
        elements.workoutActive.classList.add('hidden');
        elements.workoutComplete.classList.remove('hidden');

        document.getElementById('completeDuration').textContent = Timer.formatTime(data.duration);
        document.getElementById('completeExercises').textContent = data.exercisesCompleted;

        // Generate encouraging message
        const messages = [
            'Great job caring for your spine today!',
            'Every rep builds a stronger back.',
            'Consistency is your superpower!',
            'You showed up for yourself today.',
            'Your future self thanks you!'
        ];
        document.getElementById('completeMessage').textContent =
            messages[Math.floor(Math.random() * messages.length)];

        // Check for level up
        const sessionsAtLevel = await Analytics.getSessionsAtLevel(settings.level);
        const nextLevel = Exercises.shouldSuggestLevelUp(settings.level, sessionsAtLevel);

        if (nextLevel) {
            setTimeout(() => {
                if (confirm(`You've completed ${sessionsAtLevel} sessions at this level! Ready to advance to ${Exercises.getLevel(nextLevel).name}?`)) {
                    settings.level = nextLevel;
                    Storage.saveSettings(settings);
                    Storage.saveProgress({
                        type: 'level-change',
                        newLevel: nextLevel,
                        reason: 'Progression milestone reached'
                    });
                    updateLevelBadge();
                    showToast(`Congratulations! Now at ${Exercises.getLevel(nextLevel).name} level!`);
                }
            }, 2000);
        }
    }

    // End workout
    function endWorkout(completed) {
        workoutInProgress = false;
        Timer.reset();

        elements.workoutActive.classList.add('hidden');
        elements.workoutPreview.classList.remove('hidden');
        elements.startWorkout.classList.remove('hidden');
        elements.pauseWorkout.textContent = 'Pause';
    }

    // Setup progress page
    function setupProgressPage() {
        // Will be populated on navigation
    }

    // Refresh progress page
    async function refreshProgressPage() {
        // Calendar
        const now = new Date();
        const calendarData = await Analytics.getCalendarData(now.getFullYear(), now.getMonth());
        renderCalendar(calendarData);

        // Pain chart
        const painData = await Analytics.getPainTrendData(14);
        const chartContainer = document.getElementById('painChart');
        Analytics.renderSimpleChart(chartContainer, painData);

        // Journey timeline
        const journey = await Analytics.getProgressionJourney();
        renderJourney(journey);

        // Insights
        const insights = await Analytics.getInsights();
        renderInsights(insights);
    }

    // Render calendar
    function renderCalendar(data) {
        const grid = document.getElementById('calendarGrid');
        let html = '';

        data.forEach(day => {
            if (day.day === null) {
                html += '<div class="calendar-day empty"></div>';
            } else {
                const classes = ['calendar-day', day.status];
                if (day.isToday) classes.push('today');
                html += `<div class="${classes.join(' ')}" title="${day.date}"></div>`;
            }
        });

        grid.innerHTML = html;
    }

    // Render journey timeline
    function renderJourney(data) {
        const container = document.getElementById('journeyTimeline');
        let html = '';

        data.slice(0, 5).forEach(item => {
            html += `
                <div class="journey-item">
                    <div class="journey-date">${item.date}</div>
                    <div class="journey-title">${item.title}</div>
                    <div class="journey-detail">${item.detail}</div>
                </div>
            `;
        });

        container.innerHTML = html || '<p class="text-muted">Your journey starts today!</p>';
    }

    // Render insights
    function renderInsights(data) {
        const container = document.getElementById('insightsList');
        let html = '';

        data.forEach(insight => {
            html += `
                <div class="insight-card">
                    <span class="insight-icon">${insight.icon}</span>
                    <p class="insight-text">${insight.text}</p>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Setup pain log page
    function setupPainLogPage() {
        // Pain level slider
        const painLevel = document.getElementById('painLevel');
        const painLevelValue = document.getElementById('painLevelValue');

        painLevel.addEventListener('input', () => {
            painLevelValue.textContent = painLevel.value;

            // Update color based on value
            const val = parseInt(painLevel.value);
            if (val <= 3) {
                painLevelValue.style.borderColor = '#10b981';
                painLevelValue.style.color = '#34d399';
            } else if (val <= 6) {
                painLevelValue.style.borderColor = '#f59e0b';
                painLevelValue.style.color = '#fbbf24';
            } else {
                painLevelValue.style.borderColor = '#f43f5e';
                painLevelValue.style.color = '#fb7185';
            }
        });

        // Symptom buttons
        document.querySelectorAll('.symptom-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.classList.toggle('active'));
        });

        // Location buttons
        document.querySelectorAll('.location-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.classList.toggle('active'));
        });

        // Save button
        document.getElementById('savePainEntry').addEventListener('click', savePainEntry);
    }

    // Save pain entry
    async function savePainEntry() {
        const painLevel = parseInt(document.getElementById('painLevel').value);
        const symptoms = Array.from(document.querySelectorAll('.symptom-btn.active'))
            .map(btn => btn.dataset.symptom);
        const locations = Array.from(document.querySelectorAll('.location-btn.active'))
            .map(btn => btn.dataset.location);
        const activity = document.getElementById('painActivity').value;
        const notes = document.getElementById('painNotes').value;

        await Storage.savePainLog({
            painLevel,
            symptoms,
            locations,
            activity,
            notes,
            timeOfDay: new Date().getHours() < 12 ? 'morning' :
                new Date().getHours() < 17 ? 'afternoon' : 'evening'
        });

        // Reset form
        document.getElementById('painLevel').value = 0;
        document.getElementById('painLevelValue').textContent = '0';
        document.querySelectorAll('.symptom-btn.active, .location-btn.active')
            .forEach(btn => btn.classList.remove('active'));
        document.getElementById('painActivity').value = '';
        document.getElementById('painNotes').value = '';

        showToast('Pain entry saved');
        refreshPainHistory();
    }

    // Refresh pain history
    async function refreshPainHistory() {
        const logs = await Storage.getPainLogs(10);
        const container = document.getElementById('painHistoryList');

        if (logs.length === 0) {
            container.innerHTML = '<p class="text-muted">No entries yet</p>';
            return;
        }

        let html = '';
        logs.forEach(log => {
            const levelClass = log.painLevel <= 3 ? 'low' : log.painLevel <= 6 ? 'medium' : 'high';
            const date = new Date(log.timestamp).toLocaleDateString();
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            html += `
                <div class="history-item">
                    <div class="history-pain-level ${levelClass}">${log.painLevel}</div>
                    <div class="history-content">
                        <div class="history-date">${date} at ${time}</div>
                        <div class="history-symptoms">
                            ${log.symptoms.map(s => `<span class="history-symptom">${s}</span>`).join('')}
                            ${log.locations.map(l => `<span class="history-symptom">${l}</span>`).join('')}
                        </div>
                        ${log.notes ? `<div class="history-notes">${log.notes}</div>` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Setup recovery page
    function setupRecoveryPage() {
        // Initialize Recovery module
        if (typeof Recovery !== 'undefined') {
            Recovery.init();
        }

        // Initialize Relief Finder module
        if (typeof ReliefFinder !== 'undefined') {
            ReliefFinder.init();
        }
    }

    // Setup habits page
    function setupHabitsPage() {
        // Sitting timer
        setupSittingTimer();

        // Walking tracker
        setupWalkingTracker();

        // Nerve floss
        setupNerveFloss();
    }

    // Sitting timer (20-8-2 rule)
    let sittingTimer = {
        interval: null,
        phase: 'sitting', // sitting, standing, moving
        time: 20 * 60, // 20 minutes
        running: false
    };

    function setupSittingTimer() {
        const startBtn = document.getElementById('startSittingTimer');
        const resetBtn = document.getElementById('resetSittingTimer');

        startBtn.addEventListener('click', () => {
            if (sittingTimer.running) {
                pauseSittingTimer();
                startBtn.textContent = 'Resume';
            } else {
                startSittingTimer();
                startBtn.textContent = 'Pause';
                resetBtn.classList.remove('hidden');
            }
        });

        resetBtn.addEventListener('click', resetSittingTimer);
    }

    function startSittingTimer() {
        sittingTimer.running = true;

        if (sittingTimer.interval) clearInterval(sittingTimer.interval);

        sittingTimer.interval = setInterval(() => {
            sittingTimer.time--;
            updateSittingTimerUI();

            if (sittingTimer.time <= 0) {
                advanceSittingPhase();
            }
        }, 1000);
    }

    function pauseSittingTimer() {
        sittingTimer.running = false;
        if (sittingTimer.interval) clearInterval(sittingTimer.interval);
    }

    function resetSittingTimer() {
        pauseSittingTimer();
        sittingTimer.phase = 'sitting';
        sittingTimer.time = 20 * 60;
        updateSittingTimerUI();
        document.getElementById('startSittingTimer').textContent = 'Start';
        document.getElementById('resetSittingTimer').classList.add('hidden');
    }

    function advanceSittingPhase() {
        if (settings.soundEnabled) Timer.sounds.exerciseComplete();
        if (settings.vibrationEnabled && navigator.vibrate) navigator.vibrate([200, 100, 200]);

        switch (sittingTimer.phase) {
            case 'sitting':
                sittingTimer.phase = 'standing';
                sittingTimer.time = 8 * 60;
                Timer.speak('Time to stand!');
                break;
            case 'standing':
                sittingTimer.phase = 'moving';
                sittingTimer.time = 2 * 60;
                Timer.speak('Time to move and stretch!');
                break;
            case 'moving':
                sittingTimer.phase = 'sitting';
                sittingTimer.time = 20 * 60;
                Timer.speak('Back to sitting. Remember your posture!');
                break;
        }

        updateSittingTimerUI();
    }

    function updateSittingTimerUI() {
        const phaseEl = document.getElementById('sittingPhase');
        const timeEl = document.getElementById('sittingTime');

        phaseEl.textContent = sittingTimer.phase.toUpperCase();
        phaseEl.className = `sitting-phase ${sittingTimer.phase}`;

        const mins = Math.floor(sittingTimer.time / 60);
        const secs = sittingTimer.time % 60;
        timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Walking tracker
    function setupWalkingTracker() {
        const addBtn = document.getElementById('addWalking');
        const input = document.getElementById('walkingMinutes');

        addBtn.addEventListener('click', async () => {
            const minutes = parseInt(input.value) || 0;
            if (minutes <= 0) return;

            await Storage.saveHabit({
                type: 'walking',
                minutes: minutes
            });

            updateWalkingTotal();
            showToast(`Added ${minutes} minutes of walking`);
        });

        // Update goal display
        document.getElementById('walkingGoal').textContent = `Goal: ${settings.walkingGoal} min`;

        updateWalkingTotal();
    }

    async function updateWalkingTotal() {
        const habits = await Storage.getHabitsForToday();
        const walkingHabits = habits.filter(h => h.type === 'walking');
        const total = walkingHabits.reduce((sum, h) => sum + h.minutes, 0);
        document.getElementById('walkingToday').textContent = total;
    }

    // Nerve floss modal
    function setupNerveFloss() {
        const modal = document.getElementById('nerveFlossModal');
        const openBtn = document.getElementById('startNerveFloss');
        const closeBtn = document.getElementById('closeNerveFloss');
        const nextRepBtn = document.getElementById('flossNextRep');
        const switchSideBtn = document.getElementById('flossSwitchSide');

        let flossState = { rep: 0, side: 'Left' };

        openBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            flossState = { rep: 0, side: 'Left' };
            updateFlossUI();
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        nextRepBtn.addEventListener('click', () => {
            flossState.rep++;
            if (settings.soundEnabled) Timer.sounds.countdown();
            updateFlossUI();

            if (flossState.rep >= 15 && flossState.side === 'Right') {
                setTimeout(() => {
                    showToast('Nerve flossing complete!');
                    modal.classList.add('hidden');
                }, 500);
            }
        });

        switchSideBtn.addEventListener('click', () => {
            flossState.side = flossState.side === 'Left' ? 'Right' : 'Left';
            flossState.rep = 0;
            updateFlossUI();
        });

        function updateFlossUI() {
            document.getElementById('flossRepCount').textContent = flossState.rep;
            document.getElementById('flossSide').textContent = `${flossState.side} Leg`;
            switchSideBtn.textContent = `Switch to ${flossState.side === 'Left' ? 'Right' : 'Left'}`;
        }
    }

    // Setup settings page
    function setupSettingsPage() {
        // All settings inputs
        const settingInputs = [
            'settingHoldDuration',
            'settingRestDuration',
            'settingLevel',
            'settingWalkingGoal',
            'settingReminder',
            'settingReminderTime',
            'settingDarkMode',
            'settingSounds',
            'settingVibration'
        ];

        settingInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', saveSettingsFromUI);
            }
        });

        // Export data
        document.getElementById('exportData').addEventListener('click', async () => {
            const data = await Storage.exportAllData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mcgill-big3-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Data exported');
        });

        // Clear data
        document.getElementById('clearData').addEventListener('click', async () => {
            if (confirm('Are you sure? This will delete all your data. This cannot be undone.')) {
                await Storage.clearAllData();
                location.reload();
            }
        });
    }

    // Save settings from UI
    async function saveSettingsFromUI() {
        settings = {
            holdDuration: parseInt(document.getElementById('settingHoldDuration').value) || 10,
            restDuration: parseInt(document.getElementById('settingRestDuration').value) || 10,
            level: document.getElementById('settingLevel').value,
            walkingGoal: parseInt(document.getElementById('settingWalkingGoal').value) || 30,
            reminderEnabled: document.getElementById('settingReminder').checked,
            reminderTime: document.getElementById('settingReminderTime').value,
            darkMode: document.getElementById('settingDarkMode').checked,
            soundEnabled: document.getElementById('settingSounds').checked,
            vibrationEnabled: document.getElementById('settingVibration').checked
        };

        await Storage.saveSettings(settings);
        applySettings();
        updateLevelBadge();
        updateExerciseList();
        showToast('Settings saved');
    }

    // Show toast notification
    function showToast(message, duration = 3000) {
        elements.toastMessage.textContent = message;
        elements.toast.classList.remove('hidden');
        elements.toast.classList.add('show');

        setTimeout(() => {
            elements.toast.classList.remove('show');
            setTimeout(() => elements.toast.classList.add('hidden'), 300);
        }, duration);
    }

    // Register service worker
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js');
                    console.log('SW registered:', registration);
                } catch (error) {
                    console.log('SW registration failed:', error);
                }
            });
        }
    }

    // Public API
    return {
        init,
        navigateTo,
        showToast
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
