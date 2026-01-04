/**
 * McGill Big 3 - Analytics Module
 * Progress tracking and data visualization
 */

const Analytics = (() => {
    // Generate calendar heatmap data
    async function getCalendarData(year, month) {
        const workouts = await Storage.getWorkoutsForMonth(year, month);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const calendarData = [];

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarData.push({ day: null, status: 'empty' });
        }

        // Add each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayWorkouts = workouts.filter(w => w.date === dateStr);

            let status = 'none';
            if (dayWorkouts.length > 0) {
                const isComplete = dayWorkouts.some(w => w.completed);
                status = isComplete ? 'complete' : 'partial';
            }

            const isToday = dateStr === new Date().toISOString().split('T')[0];

            calendarData.push({
                day: day,
                date: dateStr,
                status: status,
                isToday: isToday,
                workouts: dayWorkouts
            });
        }

        return calendarData;
    }

    // Get weekly consistency score
    async function getWeeklyConsistency() {
        const workouts = await Storage.getWorkoutsForWeek();
        const completedDays = new Set(
            workouts.filter(w => w.completed).map(w => w.date)
        );

        return {
            completed: completedDays.size,
            total: 7,
            percentage: Math.round((completedDays.size / 7) * 100)
        };
    }

    // Get pain trend data
    async function getPainTrendData(days = 30) {
        const painLogs = await Storage.getPainLogsForRange(days);

        // Group by date and get average
        const dailyAverages = {};
        painLogs.forEach(log => {
            if (!dailyAverages[log.date]) {
                dailyAverages[log.date] = { total: 0, count: 0 };
            }
            dailyAverages[log.date].total += log.painLevel;
            dailyAverages[log.date].count++;
        });

        // Convert to array for charting
        const data = Object.entries(dailyAverages)
            .map(([date, values]) => ({
                date: date,
                average: Math.round((values.total / values.count) * 10) / 10
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return data;
    }

    // Get progression journey
    async function getProgressionJourney() {
        const progress = await Storage.getProgressHistory();

        // Sort by timestamp and get level changes
        const journey = progress
            .filter(p => p.type === 'level-change')
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(p => ({
                date: new Date(p.timestamp).toLocaleDateString(),
                title: `Reached ${Exercises.getLevel(p.newLevel)?.name || p.newLevel}`,
                detail: p.reason || 'Progression milestone'
            }));

        // Add start if no history
        if (journey.length === 0) {
            journey.push({
                date: 'Today',
                title: 'Started your journey',
                detail: 'Every day of consistency builds a stronger spine'
            });
        }

        return journey;
    }

    // Generate insights based on data
    async function getInsights() {
        const insights = [];
        const weeklyData = await getWeeklyConsistency();
        const painData = await getPainTrendData(14);

        // Consistency insight
        if (weeklyData.completed >= 5) {
            insights.push({
                icon: '🔥',
                text: `Great consistency! You've completed ${weeklyData.completed}/7 days this week.`
            });
        } else if (weeklyData.completed >= 3) {
            insights.push({
                icon: '👍',
                text: `Good progress! ${weeklyData.completed} days completed. Keep building that habit.`
            });
        } else {
            insights.push({
                icon: '💪',
                text: 'Remember: consistency beats intensity. Even a few reps count!'
            });
        }

        // Pain trend insight
        if (painData.length >= 7) {
            const recent = painData.slice(-7);
            const earlier = painData.slice(-14, -7);

            if (earlier.length > 0) {
                const recentAvg = recent.reduce((a, b) => a + b.average, 0) / recent.length;
                const earlierAvg = earlier.reduce((a, b) => a + b.average, 0) / earlier.length;

                if (recentAvg < earlierAvg) {
                    insights.push({
                        icon: '📉',
                        text: `Your pain levels have decreased by ${Math.round((earlierAvg - recentAvg) * 10) / 10} points this week!`
                    });
                }
            }
        }

        // Default insight if none
        if (insights.length === 0) {
            insights.push({
                icon: '💡',
                text: 'Complete more workouts to see personalized insights about your progress.'
            });
        }

        return insights;
    }

    // Calculate streak (consecutive days)
    async function calculateStreak() {
        const workouts = await Storage.getAll(Storage.STORES.WORKOUTS);

        if (workouts.length === 0) return 0;

        // Get unique completed dates
        const completedDates = [...new Set(
            workouts.filter(w => w.completed).map(w => w.date)
        )].sort().reverse();

        if (completedDates.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Check if today or yesterday is in the list
        const todayStr = currentDate.toISOString().split('T')[0];
        const yesterdayDate = new Date(currentDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        if (!completedDates.includes(todayStr) && !completedDates.includes(yesterdayStr)) {
            return 0; // Streak broken
        }

        // Count consecutive days
        let checkDate = completedDates.includes(todayStr) ? currentDate : yesterdayDate;

        while (true) {
            const checkStr = checkDate.toISOString().split('T')[0];
            if (completedDates.includes(checkStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    // Get sessions at current level
    async function getSessionsAtLevel(level) {
        const workouts = await Storage.getAll(Storage.STORES.WORKOUTS);
        return workouts.filter(w => w.level === level && w.completed).length;
    }

    // Render simple chart (no external library)
    function renderSimpleChart(container, data, options = {}) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="chart-placeholder">Not enough data yet</div>';
            return;
        }

        const maxValue = Math.max(...data.map(d => d.average), 10);
        const width = container.clientWidth - 40;
        const height = 160;
        const pointSpacing = Math.max(30, width / data.length);

        let svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:rgba(6,182,212,0.3)"/>
                        <stop offset="100%" style="stop-color:rgba(6,182,212,0)"/>
                    </linearGradient>
                </defs>
        `;

        // Draw area
        let areaPath = `M 0 ${height}`;
        data.forEach((point, i) => {
            const x = i * pointSpacing + 20;
            const y = height - 20 - (point.average / maxValue) * (height - 40);
            areaPath += ` L ${x} ${y}`;
        });
        areaPath += ` L ${(data.length - 1) * pointSpacing + 20} ${height} Z`;

        svg += `<path d="${areaPath}" fill="url(#chartGradient)"/>`;

        // Draw line
        let linePath = '';
        data.forEach((point, i) => {
            const x = i * pointSpacing + 20;
            const y = height - 20 - (point.average / maxValue) * (height - 40);
            linePath += (i === 0 ? 'M' : ' L') + ` ${x} ${y}`;
        });

        svg += `<path d="${linePath}" fill="none" stroke="#06b6d4" stroke-width="2"/>`;

        // Draw points
        data.forEach((point, i) => {
            const x = i * pointSpacing + 20;
            const y = height - 20 - (point.average / maxValue) * (height - 40);
            svg += `<circle cx="${x}" cy="${y}" r="4" fill="#06b6d4"/>`;
        });

        svg += '</svg>';
        container.innerHTML = svg;
    }

    return {
        getCalendarData,
        getWeeklyConsistency,
        getPainTrendData,
        getProgressionJourney,
        getInsights,
        calculateStreak,
        getSessionsAtLevel,
        renderSimpleChart
    };
})();
