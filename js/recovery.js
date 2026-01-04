/**
 * McGill Big 3 - Recovery Module
 * McGill-based self-assessment and recovery tracking
 */

const Recovery = (() => {
    // Assessment questions based on McGill's provocative testing
    const ASSESSMENT_QUESTIONS = [
        {
            id: 'sitting-pain',
            question: 'Does prolonged sitting (30+ min) increase your pain?',
            indicator: 'flexion',
            weight: 2
        },
        {
            id: 'bending-pain',
            question: 'Does bending forward (e.g., to tie shoes) trigger pain?',
            indicator: 'flexion',
            weight: 2
        },
        {
            id: 'morning-pain',
            question: 'Is your pain worse in the morning, especially first hour?',
            indicator: 'flexion',
            weight: 1,
            note: 'Discs absorb fluid overnight, making flexion more painful'
        },
        {
            id: 'slouch-pain',
            question: 'Does slouching in a chair vs. sitting tall make pain worse?',
            indicator: 'flexion',
            weight: 2
        },
        {
            id: 'standing-relief',
            question: 'Does standing or walking provide relief from sitting pain?',
            indicator: 'flexion',
            weight: 1
        },
        {
            id: 'extension-pain',
            question: 'Does arching your back backward trigger or worsen pain?',
            indicator: 'extension',
            weight: 2
        },
        {
            id: 'standing-long',
            question: 'Does standing for long periods (30+ min) worsen your pain?',
            indicator: 'extension',
            weight: 1
        },
        {
            id: 'walking-downhill',
            question: 'Does walking downhill or down stairs increase symptoms?',
            indicator: 'extension',
            weight: 1
        },
        {
            id: 'load-pain',
            question: 'Does carrying heavy objects or compression worsen symptoms?',
            indicator: 'compression',
            weight: 2
        },
        {
            id: 'leg-symptoms',
            question: 'Do you have radiating symptoms down your leg (sciatica)?',
            indicator: 'nerve',
            weight: 2
        },
        {
            id: 'symptom-duration',
            question: 'How long have you had these symptoms?',
            type: 'select',
            options: [
                { value: 'acute', label: 'Less than 6 weeks' },
                { value: 'subacute', label: '6 weeks to 3 months' },
                { value: 'chronic', label: 'More than 3 months' }
            ]
        }
    ];

    // Recovery phases
    const PHASES = {
        acute: {
            name: 'Acute Phase',
            icon: '🔴',
            description: 'Focus on finding pain-free positions and avoiding triggers. Start gentle McGill Big 3.',
            duration: '0-6 weeks',
            recommendations: [
                'Find and use pain-free positions',
                'Apply ice for 15-20 min if inflammation present',
                'Short walks (10-15 min, 3x daily)',
                'Start gentle McGill Big 3 (beginner level)',
                'Avoid sitting more than 20-30 min at once',
                'Use log roll to get out of bed'
            ]
        },
        subacute: {
            name: 'Subacute Phase',
            icon: '🟡',
            description: 'Progressively build strength and movement capacity.',
            duration: '6-12 weeks',
            recommendations: [
                'Progress McGill Big 3 to developing level',
                'Increase walking to 30+ minutes daily',
                'Add nerve flossing exercises',
                'Practice hip hinge movement pattern',
                'Begin gradual return to normal activities',
                'Focus on posture and body mechanics'
            ]
        },
        chronic: {
            name: 'Rehabilitation Phase',
            icon: '🟢',
            description: 'Build resilience and maintain spine health long-term.',
            duration: '12+ weeks',
            recommendations: [
                'Master McGill Big 3 at standard or advanced level',
                'Add hip and glute strengthening',
                'Focus on endurance (longer holds)',
                'Gradually return to all activities',
                'Maintain daily spine hygiene routine',
                'Continue exercises for life as maintenance'
            ]
        },
        recovered: {
            name: 'Resilient',
            icon: '💪',
            description: 'You\'ve built a resilient spine! Maintain your gains.',
            duration: 'Ongoing',
            recommendations: [
                'Daily McGill Big 3 maintenance',
                'Stay active with walking, swimming',
                'Maintain good posture and movement patterns',
                'Listen to your body - rest when needed',
                'Annual check-ins with your routine'
            ]
        }
    };

    // Current assessment state
    let currentQuestion = 0;
    let answers = {};

    // Start assessment
    function startAssessment() {
        currentQuestion = 0;
        answers = {};
        showAssessmentModal();
    }

    // Show assessment modal
    function showAssessmentModal() {
        const modal = document.getElementById('assessmentModal');
        modal.classList.remove('hidden');
        renderQuestion();
    }

    // Hide assessment modal
    function hideAssessmentModal() {
        const modal = document.getElementById('assessmentModal');
        modal.classList.add('hidden');
    }

    // Render current question
    function renderQuestion() {
        const question = ASSESSMENT_QUESTIONS[currentQuestion];
        const container = document.getElementById('assessmentQuestionContainer');
        const progress = document.getElementById('assessmentProgress');

        // Update progress
        progress.style.width = `${((currentQuestion + 1) / ASSESSMENT_QUESTIONS.length) * 100}%`;
        document.getElementById('assessmentQuestionNum').textContent =
            `Question ${currentQuestion + 1} of ${ASSESSMENT_QUESTIONS.length}`;

        let html = `
            <div class="assessment-question">
                <h3>${question.question}</h3>
                ${question.note ? `<p class="question-note">${question.note}</p>` : ''}
        `;

        if (question.type === 'select') {
            html += `<div class="question-options">`;
            question.options.forEach(opt => {
                html += `
                    <button class="option-btn" data-value="${opt.value}">
                        ${opt.label}
                    </button>
                `;
            });
            html += `</div>`;
        } else {
            html += `
                <div class="question-options">
                    <button class="option-btn yes" data-value="yes">Yes</button>
                    <button class="option-btn no" data-value="no">No</button>
                    <button class="option-btn sometimes" data-value="sometimes">Sometimes</button>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => handleAnswer(btn.dataset.value));
        });
    }

    // Handle answer
    function handleAnswer(value) {
        const question = ASSESSMENT_QUESTIONS[currentQuestion];
        answers[question.id] = value;

        if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
            currentQuestion++;
            renderQuestion();
        } else {
            // Assessment complete
            calculateResults();
        }
    }

    // Calculate results
    function calculateResults() {
        let flexionScore = 0;
        let extensionScore = 0;
        let compressionScore = 0;
        let nerveInvolvement = false;
        let phase = 'chronic'; // Default

        ASSESSMENT_QUESTIONS.forEach(q => {
            const answer = answers[q.id];
            if (!answer) return;

            if (q.id === 'symptom-duration') {
                phase = answer;
            } else if (answer === 'yes') {
                if (q.indicator === 'flexion') flexionScore += q.weight;
                if (q.indicator === 'extension') extensionScore += q.weight;
                if (q.indicator === 'compression') compressionScore += q.weight;
                if (q.indicator === 'nerve') nerveInvolvement = true;
            } else if (answer === 'sometimes') {
                if (q.indicator === 'flexion') flexionScore += q.weight * 0.5;
                if (q.indicator === 'extension') extensionScore += q.weight * 0.5;
                if (q.indicator === 'compression') compressionScore += q.weight * 0.5;
            }
        });

        // Determine intolerances
        const results = {
            phase: phase,
            flexionIntolerant: flexionScore >= 3,
            extensionIntolerant: extensionScore >= 2,
            compressionSensitive: compressionScore >= 2,
            nerveInvolvement: nerveInvolvement,
            scores: {
                flexion: flexionScore,
                extension: extensionScore,
                compression: compressionScore
            }
        };

        // Save results
        saveAssessmentResults(results);

        // Show results
        hideAssessmentModal();
        displayResults(results);
    }

    // Save assessment results
    async function saveAssessmentResults(results) {
        const assessment = {
            type: 'assessment',
            results: results,
            answers: answers,
            date: new Date().toISOString().split('T')[0]
        };

        await Storage.saveProgress(assessment);

        // Update settings with phase
        const settings = await Storage.getSettings();
        settings.recoveryPhase = results.phase;
        settings.intolerances = {
            flexion: results.flexionIntolerant,
            extension: results.extensionIntolerant,
            compression: results.compressionSensitive
        };
        await Storage.saveSettings(settings);
    }

    // Display results
    function displayResults(results) {
        const phaseInfo = PHASES[results.phase];

        // Update phase card
        document.getElementById('phaseIcon').textContent = phaseInfo.icon;
        document.getElementById('phaseName').textContent = phaseInfo.name;
        document.getElementById('phaseDescription').textContent = phaseInfo.description;

        // Highlight current phase in progress bar
        document.querySelectorAll('.phase-segment').forEach(seg => {
            seg.classList.remove('active');
            if (seg.dataset.phase === results.phase) {
                seg.classList.add('active');
            }
        });

        // Show assessment result section
        const resultSection = document.getElementById('assessmentResult');
        resultSection.classList.remove('hidden');

        // Build intolerance badges
        let badges = '';
        if (results.flexionIntolerant) {
            badges += `<span class="intolerance-badge flexion">⚠️ Flexion Intolerant</span>`;
        }
        if (results.extensionIntolerant) {
            badges += `<span class="intolerance-badge extension">⚠️ Extension Intolerant</span>`;
        }
        if (results.compressionSensitive) {
            badges += `<span class="intolerance-badge compression">⚠️ Compression Sensitive</span>`;
        }
        if (results.nerveInvolvement) {
            badges += `<span class="intolerance-badge nerve">🦵 Nerve Involvement</span>`;
        }
        if (!badges) {
            badges = `<span class="intolerance-badge neutral">✅ No major intolerances detected</span>`;
        }
        document.getElementById('intoleranceBadges').innerHTML = badges;

        // Build trigger summary
        let summary = '<ul>';
        if (results.flexionIntolerant) {
            summary += `
                <li><strong>Avoid flexion:</strong> No sit-ups, toe touches, or prolonged slouching</li>
                <li><strong>Use hip hinge:</strong> Bend at hips, not spine</li>
                <li><strong>Morning caution:</strong> Avoid forward bending first hour after waking</li>
            `;
        }
        if (results.extensionIntolerant) {
            summary += `
                <li><strong>Limit extension:</strong> Avoid cobra stretches or excessive back bending</li>
                <li><strong>Standing breaks:</strong> Don't stand in one position too long</li>
            `;
        }
        if (results.nerveInvolvement) {
            summary += `
                <li><strong>Nerve flossing:</strong> Gentle sciatic nerve gliding may help</li>
                <li><strong>Walking:</strong> Short frequent walks often provide relief</li>
            `;
        }
        summary += '</ul>';
        document.getElementById('triggerSummary').innerHTML = summary;

        // Update recommendations based on phase
        updateRecoveryActions(results.phase);

        // Update avoid list based on intolerances
        updateAvoidList(results);

        App.showToast('Assessment complete! See your personalized recovery plan.');
    }

    // Update recovery actions based on phase
    function updateRecoveryActions(phase) {
        const phaseInfo = PHASES[phase];
        const container = document.getElementById('recoveryActions');

        let html = '';
        phaseInfo.recommendations.slice(0, 4).forEach((rec, i) => {
            const icons = ['🎯', '💪', '🚶', '🛏️', '🧘', '⏰'];
            html += `
                <div class="action-card">
                    <span class="action-icon">${icons[i % icons.length]}</span>
                    <div class="action-info">
                        <strong>${rec}</strong>
                    </div>
                    <input type="checkbox" class="action-check">
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Update avoid list based on intolerances
    function updateAvoidList(results) {
        const container = document.getElementById('avoidList');
        let html = '';

        if (results.flexionIntolerant) {
            html += `
                <div class="avoid-item flexion">
                    <span class="avoid-icon">⚠️</span>
                    <div class="avoid-info">
                        <strong>Sit-ups & Crunches</strong>
                        <small>High disc pressure in flexion</small>
                    </div>
                </div>
                <div class="avoid-item flexion">
                    <span class="avoid-icon">⚠️</span>
                    <div class="avoid-info">
                        <strong>Toe Touches / Forward Bends</strong>
                        <small>Loaded spine flexion aggravates discs</small>
                    </div>
                </div>
                <div class="avoid-item flexion">
                    <span class="avoid-icon">⚠️</span>
                    <div class="avoid-info">
                        <strong>Knees to Chest Stretch</strong>
                        <small>Flexes lumbar spine under load</small>
                    </div>
                </div>
                <div class="avoid-item flexion">
                    <span class="avoid-icon">⚠️</span>
                    <div class="avoid-info">
                        <strong>Prolonged Sitting</strong>
                        <small>Break every 20-30 minutes</small>
                    </div>
                </div>
            `;
        }

        if (results.extensionIntolerant) {
            html += `
                <div class="avoid-item extension">
                    <span class="avoid-icon">⚠️</span>
                    <div class="avoid-info">
                        <strong>Cobra Stretch / Back Bends</strong>
                        <small>Aggravates extension sensitivity</small>
                    </div>
                </div>
                <div class="avoid-item extension">
                    <span class="avoid-icon">⚠️</span>
                    <div class="avoid-info">
                        <strong>Prolonged Standing</strong>
                        <small>Increases lumbar extension</small>
                    </div>
                </div>
            `;
        }

        if (!results.flexionIntolerant && !results.extensionIntolerant) {
            html = `
                <div class="avoid-item neutral">
                    <span class="avoid-icon">ℹ️</span>
                    <div class="avoid-info">
                        <strong>General Guidelines</strong>
                        <small>Avoid any movements that reproduce your pain</small>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // Load saved assessment
    async function loadSavedAssessment() {
        const settings = await Storage.getSettings();

        if (settings.recoveryPhase) {
            const phaseInfo = PHASES[settings.recoveryPhase];
            document.getElementById('phaseIcon').textContent = phaseInfo.icon;
            document.getElementById('phaseName').textContent = phaseInfo.name;
            document.getElementById('phaseDescription').textContent = phaseInfo.description;

            // Highlight phase
            document.querySelectorAll('.phase-segment').forEach(seg => {
                seg.classList.remove('active');
                if (seg.dataset.phase === settings.recoveryPhase) {
                    seg.classList.add('active');
                }
            });

            updateRecoveryActions(settings.recoveryPhase);
        }

        if (settings.intolerances) {
            updateAvoidList({
                flexionIntolerant: settings.intolerances.flexion,
                extensionIntolerant: settings.intolerances.extension
            });
        }
    }

    // Initialize
    function init() {
        // Start assessment button
        const startBtn = document.getElementById('startAssessment');
        if (startBtn) {
            startBtn.addEventListener('click', startAssessment);
        }

        // Load any saved assessment
        loadSavedAssessment();
    }

    return {
        init,
        startAssessment,
        hideAssessmentModal,
        loadSavedAssessment,
        PHASES,
        ASSESSMENT_QUESTIONS
    };
})();
