/**
 * McGill Big 3 - Storage Module
 * IndexedDB wrapper for offline data persistence
 */

const Storage = (() => {
    const DB_NAME = 'mcgill-big3';
    const DB_VERSION = 1;
    let db = null;

    // Store names
    const STORES = {
        WORKOUTS: 'workouts',
        PAIN_LOGS: 'painLogs',
        HABITS: 'habits',
        SETTINGS: 'settings',
        PROGRESS: 'progress'
    };

    // Initialize IndexedDB
    async function init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                // Workouts store
                if (!database.objectStoreNames.contains(STORES.WORKOUTS)) {
                    const workoutStore = database.createObjectStore(STORES.WORKOUTS, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    workoutStore.createIndex('date', 'date', { unique: false });
                }

                // Pain logs store
                if (!database.objectStoreNames.contains(STORES.PAIN_LOGS)) {
                    const painStore = database.createObjectStore(STORES.PAIN_LOGS, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    painStore.createIndex('date', 'date', { unique: false });
                }

                // Habits store
                if (!database.objectStoreNames.contains(STORES.HABITS)) {
                    const habitsStore = database.createObjectStore(STORES.HABITS, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    habitsStore.createIndex('date', 'date', { unique: false });
                }

                // Settings store (single record)
                if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
                    database.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
                }

                // Progress store
                if (!database.objectStoreNames.contains(STORES.PROGRESS)) {
                    const progressStore = database.createObjectStore(STORES.PROGRESS, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    progressStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    // Generic add
    async function add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add({
                ...data,
                timestamp: Date.now()
            });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic get by id
    async function get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic get all
    async function getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // Get by date range
    async function getByDateRange(storeName, startDate, endDate) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('date');
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.getAll(range);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic update
    async function update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic delete
    async function remove(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Clear store
    async function clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ===== Workout-specific methods =====
    async function saveWorkout(workout) {
        const date = new Date().toISOString().split('T')[0];
        return add(STORES.WORKOUTS, { ...workout, date });
    }

    async function getWorkoutsForWeek() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return getByDateRange(
            STORES.WORKOUTS,
            startOfWeek.toISOString().split('T')[0],
            endOfWeek.toISOString().split('T')[0]
        );
    }

    async function getWorkoutsForMonth(year, month) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
        return getByDateRange(STORES.WORKOUTS, startDate, endDate);
    }

    // ===== Pain log methods =====
    async function savePainLog(entry) {
        const date = new Date().toISOString().split('T')[0];
        return add(STORES.PAIN_LOGS, { ...entry, date });
    }

    async function getPainLogs(limit = 10) {
        const all = await getAll(STORES.PAIN_LOGS);
        return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }

    async function getPainLogsForRange(days = 30) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);

        return getByDateRange(
            STORES.PAIN_LOGS,
            startDate.toISOString().split('T')[0],
            today.toISOString().split('T')[0]
        );
    }

    // ===== Habits methods =====
    async function saveHabit(habit) {
        const date = new Date().toISOString().split('T')[0];
        return add(STORES.HABITS, { ...habit, date });
    }

    async function getHabitsForToday() {
        const today = new Date().toISOString().split('T')[0];
        return getByDateRange(STORES.HABITS, today, today);
    }

    // ===== Settings methods =====
    async function getSettings() {
        const settings = await get(STORES.SETTINGS, 'user-settings');
        return settings || {
            id: 'user-settings',
            holdDuration: 10,
            restDuration: 10,
            repPattern: '5-3-1',
            rollingPlank: false,
            walkingGoal: 30,
            reminderEnabled: false,
            reminderTime: '08:00',
            darkMode: true,
            soundEnabled: true,
            voiceEnabled: false,
            vibrationEnabled: true
        };
    }

    async function saveSettings(settings) {
        return update(STORES.SETTINGS, { ...settings, id: 'user-settings' });
    }

    // ===== Progress methods =====
    async function saveProgress(progress) {
        const date = new Date().toISOString().split('T')[0];
        return add(STORES.PROGRESS, { ...progress, date });
    }

    async function getProgressHistory() {
        return getAll(STORES.PROGRESS);
    }

    // ===== Export data =====
    async function exportAllData() {
        const data = {
            workouts: await getAll(STORES.WORKOUTS),
            painLogs: await getAll(STORES.PAIN_LOGS),
            habits: await getAll(STORES.HABITS),
            settings: await getSettings(),
            progress: await getAll(STORES.PROGRESS),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    // ===== Clear all data =====
    async function clearAllData() {
        await clear(STORES.WORKOUTS);
        await clear(STORES.PAIN_LOGS);
        await clear(STORES.HABITS);
        await clear(STORES.SETTINGS);
        await clear(STORES.PROGRESS);
    }

    return {
        init,
        STORES,
        add,
        get,
        getAll,
        update,
        remove,
        clear,
        saveWorkout,
        getWorkoutsForWeek,
        getWorkoutsForMonth,
        savePainLog,
        getPainLogs,
        getPainLogsForRange,
        saveHabit,
        getHabitsForToday,
        getSettings,
        saveSettings,
        saveProgress,
        getProgressHistory,
        exportAllData,
        clearAllData
    };
})();
