/**
 * McGill Big 3 - Quick Relief Finder
 * Location-based pain relief suggestions
 */

const ReliefFinder = (() => {
    // Comprehensive relief database organized by pain location
    const RELIEF_DATABASE = {
        // LOWER BACK PAIN
        'lower-back-center': {
            name: 'Lower Back (Central)',
            icon: '🔙',
            immediate: [
                {
                    name: 'Find Neutral Spine Position',
                    description: 'Lie on your back with knees bent, feet flat. Allow your spine to find its natural curve.',
                    duration: '2-5 min',
                    caution: 'If this increases pain, try a pillow under knees',
                    icon: '🛏️'
                },
                {
                    name: 'Cat-Camel Motion',
                    description: 'On all fours, slowly alternate between arching back up (cat) and dipping down (camel). 7-8 cycles.',
                    duration: '1 min',
                    caution: 'Move through comfortable range only, not a stretch',
                    icon: '🐱'
                },
                {
                    name: 'Short Walk',
                    description: 'Slow, relaxed walking can reduce stiffness and improve blood flow',
                    duration: '5-10 min',
                    caution: 'Stop if pain significantly increases',
                    icon: '🚶'
                }
            ],
            avoid: ['Sit-ups', 'Toe touches', 'Prolonged sitting', 'Heavy lifting'],
            longTerm: 'Continue McGill Big 3 exercises daily for core stability'
        },

        'lower-back-left': {
            name: 'Lower Back (Left Side)',
            icon: '⬅️',
            immediate: [
                {
                    name: 'Side-Lying Rest',
                    description: 'Lie on your RIGHT side (pain-free side) with pillow between knees',
                    duration: '10-15 min',
                    caution: 'Use a pillow that keeps spine aligned',
                    icon: '🛏️'
                },
                {
                    name: 'Gentle Side Glide',
                    description: 'Stand with left hip toward wall. Let hips gently glide toward wall while keeping shoulders level.',
                    duration: '10 reps, hold 2s each',
                    caution: 'Very gentle movement only',
                    icon: '↔️'
                },
                {
                    name: 'Modified Side Plank (Right)',
                    description: 'This engages the left side muscles. Hold on right forearm, knees bent.',
                    duration: '10-15 sec, 3 reps',
                    caution: 'Skip if acute pain',
                    icon: '💪'
                }
            ],
            avoid: ['Twisting to the left', 'Unilateral carrying on right side'],
            longTerm: 'Check for leg length discrepancy; consider McKenzie exercises'
        },

        'lower-back-right': {
            name: 'Lower Back (Right Side)',
            icon: '➡️',
            immediate: [
                {
                    name: 'Side-Lying Rest',
                    description: 'Lie on your LEFT side (pain-free side) with pillow between knees',
                    duration: '10-15 min',
                    caution: 'Use a pillow that keeps spine aligned',
                    icon: '🛏️'
                },
                {
                    name: 'Gentle Side Glide',
                    description: 'Stand with right hip toward wall. Let hips gently glide toward wall while keeping shoulders level.',
                    duration: '10 reps, hold 2s each',
                    caution: 'Very gentle movement only',
                    icon: '↔️'
                },
                {
                    name: 'Modified Side Plank (Left)',
                    description: 'This engages the right side muscles. Hold on left forearm, knees bent.',
                    duration: '10-15 sec, 3 reps',
                    caution: 'Skip if acute pain',
                    icon: '💪'
                }
            ],
            avoid: ['Twisting to the right', 'Unilateral carrying on left side'],
            longTerm: 'Check for leg length discrepancy; consider McKenzie exercises'
        },

        // MID BACK / THORACIC
        'mid-back': {
            name: 'Mid Back (Thoracic Spine)',
            icon: '🔵',
            immediate: [
                {
                    name: 'Thoracic Extension on Chair',
                    description: 'Sit backward on a chair with back against the top. Support head with hands, gently arch upper back over chair back.',
                    duration: '30 sec, 3 reps',
                    caution: 'Movement should come from mid-back only',
                    icon: '🪑'
                },
                {
                    name: 'Thread the Needle',
                    description: 'On all fours, slide one arm under your body and rotate torso, reaching toward ceiling. Alternate sides.',
                    duration: '8-10 reps each side',
                    caution: 'Keep hips stable, rotate from mid-back',
                    icon: '🧵'
                },
                {
                    name: 'Foam Roller Extension',
                    description: 'Lie with foam roller across mid-back (below shoulder blades). Support head, gently arch back over roller.',
                    duration: '1-2 min',
                    caution: 'Avoid if you don\'t have a roller - use towel roll instead',
                    icon: '🧘'
                },
                {
                    name: 'Cat-Camel (Thoracic Focus)',
                    description: 'On all fours, focus movement on mid-back area only. 7-8 slow cycles.',
                    duration: '1 min',
                    caution: 'Keep lower back stable',
                    icon: '🐱'
                }
            ],
            avoid: ['Slouching at desk', 'Forward head posture', 'Heavy overhead lifting'],
            longTerm: 'Focus on posture; consider ergonomic setup for desk work'
        },

        // HIP FLEXORS
        'hip-flexor': {
            name: 'Hip Flexors',
            icon: '🦵',
            immediate: [
                {
                    name: 'Kneeling Hip Flexor Stretch',
                    description: 'Kneel on one knee (affected side), other foot flat. Gently push hips forward while keeping upright torso.',
                    duration: '30 sec each side, 2-3x',
                    caution: 'Don\'t arch lower back - tuck tailbone slightly',
                    icon: '🧎'
                },
                {
                    name: 'Supine Hip Flexor Stretch',
                    description: 'Lie on edge of bed, let affected leg hang off while holding opposite knee to chest.',
                    duration: '30-60 sec each side',
                    caution: 'Great for desk workers with tight hip flexors',
                    icon: '🛏️'
                },
                {
                    name: 'Standing Hip Flexor Release',
                    description: 'Step back with affected leg, keep heel down, and drive hip forward while squeezing glute.',
                    duration: '30 sec, 3 reps each side',
                    caution: 'Focus on glute engagement, not back arch',
                    icon: '🏃'
                },
                {
                    name: 'Couch Stretch',
                    description: 'Kneel with back foot against wall/couch, front foot flat. Keep torso upright for an intense stretch.',
                    duration: '30-60 sec each side',
                    caution: 'Advanced stretch - start gentle',
                    icon: '🛋️'
                }
            ],
            avoid: ['Prolonged sitting', 'Running uphill', 'Deep squats if painful'],
            longTerm: 'Take breaks from sitting every 30 min; strengthen glutes to counteract tight hip flexors'
        },

        // IT BAND
        'it-band': {
            name: 'IT Band / Outer Hip',
            icon: '🔷',
            immediate: [
                {
                    name: 'Standing IT Band Stretch',
                    description: 'Cross affected leg behind the other. Lean away from affected side, stretching along outer hip.',
                    duration: '30 sec each side, 3x',
                    caution: 'Keep shoulders level, don\'t twist',
                    icon: '🧘'
                },
                {
                    name: 'Lying Glute Stretch',
                    description: 'Lie on back, cross ankle over opposite knee, gently pull knee toward opposite shoulder.',
                    duration: '30-60 sec each side',
                    caution: 'Targets the muscles that attach to IT band',
                    icon: '🛏️'
                },
                {
                    name: 'Foam Roller (Lateral Quad)',
                    description: 'Foam roll the outer thigh from hip to just above knee. Pause on tender spots.',
                    duration: '1-2 min each leg',
                    caution: 'Don\'t roll directly on IT band - focus on muscles around it',
                    icon: '🧘'
                },
                {
                    name: 'Side-Lying Clam Shell',
                    description: 'Lie on side, knees bent. Keep feet together, raise top knee while keeping hips stable.',
                    duration: '15 reps, 3 sets each side',
                    caution: 'Strengthens hip abductors to reduce IT band strain',
                    icon: '🐚'
                }
            ],
            avoid: ['Running on banked surfaces', 'Excessive stairs', 'Crossing legs when sitting'],
            longTerm: 'Strengthen hip abductors with clam shells and lateral band walks'
        },

        // SCIATICA / LEG PAIN
        'sciatica-leg': {
            name: 'Sciatic Nerve / Leg Pain',
            icon: '⚡',
            immediate: [
                {
                    name: 'Sciatic Nerve Glide (Flossing)',
                    description: 'Sit upright, extend leg while pointing toes away and bringing chin to chest. Then flex foot and look up.',
                    duration: '10-15 gentle reps per leg',
                    caution: 'Should feel like a gentle tug, NOT pain. Stop if symptoms increase.',
                    icon: '🦵'
                },
                {
                    name: 'Piriformis Stretch',
                    description: 'Lie on back, cross ankle over opposite knee. Gently pull uncrossed knee toward chest.',
                    duration: '30 sec each side, 2-3x',
                    caution: 'The piriformis muscle can compress the sciatic nerve',
                    icon: '🧘'
                },
                {
                    name: 'Short Walk',
                    description: 'Gentle walking often provides relief by reducing nerve compression',
                    duration: '10-15 min, 3x daily',
                    caution: 'Start short, increase if it helps',
                    icon: '🚶'
                },
                {
                    name: 'Press Up / Extension (McKenzie)',
                    description: 'Lie face down, press up on hands while keeping hips on floor. Often centralizes leg pain to back.',
                    duration: '10 reps, 2-3 sets',
                    caution: 'Only if extension relieves symptoms (flexion-intolerant). Skip if it increases leg pain.',
                    icon: '🙆'
                }
            ],
            avoid: ['Prolonged sitting', 'Forward bending', 'Lifting with spine flexion'],
            longTerm: 'Continue McGill Big 3 for core stability; address root cause with professional if persistent'
        },

        // BUTTOCK / GLUTE
        'buttock': {
            name: 'Buttock / Glute Area',
            icon: '🍑',
            immediate: [
                {
                    name: 'Figure 4 Stretch',
                    description: 'Lie on back, cross ankle over knee, gently pull knee toward chest.',
                    duration: '30 sec each side, 2-3x',
                    caution: 'Stretches piriformis and glutes',
                    icon: '4️⃣'
                },
                {
                    name: 'Pigeon Pose (Modified)',
                    description: 'On all fours, bring one knee forward toward same-side wrist. Extend back leg. Lean forward gently.',
                    duration: '30-60 sec each side',
                    caution: 'Keep hips square; use pillow under hip if needed',
                    icon: '🐦'
                },
                {
                    name: 'Tennis Ball Release',
                    description: 'Sit on tennis ball placed under tight glute area. Roll slowly, pausing on tender spots.',
                    duration: '1-2 min per side',
                    caution: 'Avoid direct pressure on bone',
                    icon: '🎾'
                }
            ],
            avoid: ['Sitting on wallet', 'Prolonged sitting', 'Crossing legs'],
            longTerm: 'Strengthen glutes with bridges and clam shells'
        },

        // NECK AND UPPER BACK
        'neck-upper': {
            name: 'Neck / Upper Back',
            icon: '🦒',
            immediate: [
                {
                    name: 'Chin Tucks',
                    description: 'Sit tall, gently tuck chin straight back (making a double chin). Hold 5s.',
                    duration: '10 reps, 3 sets',
                    caution: 'Counteracts forward head posture',
                    icon: '👤'
                },
                {
                    name: 'Neck Rotation',
                    description: 'Slowly turn head left and right, holding 5s at end range.',
                    duration: '5-10 reps each direction',
                    caution: 'Move within comfortable range',
                    icon: '↩️'
                },
                {
                    name: 'Upper Trap Stretch',
                    description: 'Tilt ear toward shoulder, gently assist with hand on opposite side of head.',
                    duration: '30 sec each side',
                    caution: 'Keep opposite shoulder down',
                    icon: '🙆'
                },
                {
                    name: 'Doorway Chest Stretch',
                    description: 'Stand in doorway, forearms on frame. Step through and feel chest open.',
                    duration: '30 sec, 2-3x',
                    caution: 'Opens chest to counteract hunching',
                    icon: '🚪'
                }
            ],
            avoid: ['Looking down at phone', 'Poor computer monitor height', 'Sleeping on stomach'],
            longTerm: 'Improve workstation ergonomics; strengthen deep neck flexors'
        }
    };

    // Current state
    let selectedLocation = null;

    // Show relief finder modal
    function showReliefFinder() {
        const modal = document.getElementById('reliefFinderModal');
        modal.classList.remove('hidden');
        renderLocationPicker();
    }

    // Hide relief finder modal
    function hideReliefFinder() {
        const modal = document.getElementById('reliefFinderModal');
        modal.classList.add('hidden');
        selectedLocation = null;
    }

    // Render location picker
    function renderLocationPicker() {
        const container = document.getElementById('reliefContent');

        let html = `
            <div class="relief-header">
                <h3>Where does it hurt?</h3>
                <p>Tap your pain location for targeted relief</p>
            </div>
            <div class="pain-location-grid">
        `;

        // Location buttons
        const locations = [
            { id: 'neck-upper', label: 'Neck / Upper Back', icon: '🦒' },
            { id: 'mid-back', label: 'Mid Back', icon: '🔵' },
            { id: 'lower-back-center', label: 'Lower Back (Center)', icon: '🔙' },
            { id: 'lower-back-left', label: 'Lower Back (Left)', icon: '⬅️' },
            { id: 'lower-back-right', label: 'Lower Back (Right)', icon: '➡️' },
            { id: 'hip-flexor', label: 'Hip Flexors (Front)', icon: '🦵' },
            { id: 'buttock', label: 'Buttock / Glutes', icon: '🍑' },
            { id: 'it-band', label: 'IT Band / Outer Hip', icon: '🔷' },
            { id: 'sciatica-leg', label: 'Sciatica / Leg Pain', icon: '⚡' }
        ];

        locations.forEach(loc => {
            html += `
                <button class="pain-location-btn" data-location="${loc.id}">
                    <span class="location-icon">${loc.icon}</span>
                    <span class="location-label">${loc.label}</span>
                </button>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.pain-location-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedLocation = btn.dataset.location;
                showRelief(selectedLocation);
            });
        });
    }

    // Show relief for specific location
    function showRelief(locationId) {
        const relief = RELIEF_DATABASE[locationId];
        if (!relief) return;

        const container = document.getElementById('reliefContent');

        let html = `
            <div class="relief-header">
                <button class="back-btn" id="backToLocations">← Back</button>
                <h3>${relief.icon} ${relief.name}</h3>
            </div>
            
            <div class="relief-section">
                <h4>⚡ Immediate Relief</h4>
                <div class="relief-exercises">
        `;

        relief.immediate.forEach((exercise, i) => {
            html += `
                <div class="relief-exercise-card">
                    <div class="exercise-num">${i + 1}</div>
                    <div class="exercise-content">
                        <h5>${exercise.icon} ${exercise.name}</h5>
                        <p class="exercise-desc">${exercise.description}</p>
                        <div class="exercise-meta">
                            <span class="exercise-duration">⏱️ ${exercise.duration}</span>
                        </div>
                        ${exercise.caution ? `<p class="exercise-caution">⚠️ ${exercise.caution}</p>` : ''}
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;

        // Avoid section
        if (relief.avoid && relief.avoid.length > 0) {
            html += `
                <div class="relief-section avoid-section">
                    <h4>🚫 Avoid Right Now</h4>
                    <div class="avoid-tags">
                        ${relief.avoid.map(a => `<span class="avoid-tag">${a}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Long-term section
        if (relief.longTerm) {
            html += `
                <div class="relief-section longterm-section">
                    <h4>📅 Long-Term Strategy</h4>
                    <p>${relief.longTerm}</p>
                </div>
            `;
        }

        container.innerHTML = html;

        // Back button handler
        document.getElementById('backToLocations').addEventListener('click', renderLocationPicker);
    }

    // Initialize
    function init() {
        const openBtn = document.getElementById('openReliefFinder');
        if (openBtn) {
            openBtn.addEventListener('click', showReliefFinder);
        }

        const closeBtn = document.getElementById('closeReliefFinder');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideReliefFinder);
        }
    }

    return {
        init,
        showReliefFinder,
        hideReliefFinder,
        RELIEF_DATABASE
    };
})();
