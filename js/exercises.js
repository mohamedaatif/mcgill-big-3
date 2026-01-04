/**
 * McGill Big 3 - Exercises Module
 * Exercise definitions and progression levels
 */

const Exercises = (() => {
    // Progression levels
    const LEVELS = {
        beginner: {
            name: 'Beginner',
            icon: '🌱',
            pyramid: [3, 2, 1],
            holdDuration: 5,
            description: '3-2-1 × 5s holds',
            sessionsToAdvance: 7
        },
        developing: {
            name: 'Developing',
            icon: '🌿',
            pyramid: [5, 3, 1],
            holdDuration: 8,
            description: '5-3-1 × 8s holds',
            sessionsToAdvance: 7
        },
        standard: {
            name: 'Standard',
            icon: '🌳',
            pyramid: [5, 3, 1],
            holdDuration: 10,
            description: '5-3-1 × 10s holds',
            sessionsToAdvance: 14
        },
        advanced: {
            name: 'Advanced',
            icon: '💪',
            pyramid: [8, 5, 3],
            holdDuration: 10,
            description: '8-5-3 × 10s holds',
            sessionsToAdvance: null // Final level before challenge
        },
        challenge: {
            name: 'Challenge',
            icon: '🏆',
            pyramid: [1],
            holdDuration: 60,
            description: '60s single holds',
            sessionsToAdvance: null
        }
    };

    // Bad day mode - simplified routine
    const BAD_DAY_LEVEL = {
        name: 'Bad Day',
        icon: '😓',
        pyramid: [3],
        holdDuration: 5,
        description: 'Gentle 3 × 5s holds'
    };

    // Exercise definitions
    const EXERCISES = [
        {
            id: 'curl-up',
            name: 'Modified Curl-Up',
            icon: '🔄',
            bilateral: false, // Single exercise, not left/right
            instructions: [
                'Lie on your back with one knee bent, foot flat on floor',
                'Place hands under the natural arch of your lower back',
                'Lift head and shoulders as a single unit (just a few inches)',
                'Keep chin slightly tucked - do NOT pull on your neck',
                'Hold, then slowly lower back down'
            ],
            tips: [
                'No movement in your lower back',
                'Imagine a grapefruit under your chin',
                'Alternate which leg is bent between sets'
            ],
            audioInstructions: {
                start: 'Curl up, lifting head and shoulders',
                hold: 'Hold steady',
                release: 'Slowly lower down'
            }
        },
        {
            id: 'side-plank-left',
            name: 'Side Plank',
            side: 'Left',
            icon: '📐',
            bilateral: true,
            instructions: [
                'Lie on your left side with elbow under shoulder',
                'Stack your knees (beginner) or feet (advanced)',
                'Place right hand on left shoulder',
                'Lift hips to form a straight line',
                'Hold, then lower with control'
            ],
            tips: [
                'Keep hips aligned with torso (don\'t tilt forward or back)',
                'Breathe normally throughout the hold',
                'Start with knees bent if needed'
            ],
            audioInstructions: {
                start: 'Lift hips, left side plank',
                hold: 'Hold steady, keep breathing',
                release: 'Lower down with control'
            }
        },
        {
            id: 'side-plank-right',
            name: 'Side Plank',
            side: 'Right',
            icon: '📐',
            bilateral: true,
            instructions: [
                'Lie on your right side with elbow under shoulder',
                'Stack your knees (beginner) or feet (advanced)',
                'Place left hand on right shoulder',
                'Lift hips to form a straight line',
                'Hold, then lower with control'
            ],
            tips: [
                'Keep hips aligned with torso (don\'t tilt forward or back)',
                'Breathe normally throughout the hold',
                'Start with knees bent if needed'
            ],
            audioInstructions: {
                start: 'Lift hips, right side plank',
                hold: 'Hold steady, keep breathing',
                release: 'Lower down with control'
            }
        },
        {
            id: 'bird-dog-left',
            name: 'Bird-Dog',
            side: 'Left arm, Right leg',
            icon: '🐕',
            bilateral: true,
            instructions: [
                'Start on all fours, hands under shoulders, knees under hips',
                'Keep spine neutral (slight natural arch)',
                'Raise left arm forward and right leg back simultaneously',
                'Form a straight line from hand to foot',
                'Hold, then return with control'
            ],
            tips: [
                'No movement in your lower back - this is key!',
                'Don\'t let hips rotate or dip',
                'Reach long through fingertips and heel'
            ],
            audioInstructions: {
                start: 'Raise left arm and right leg',
                hold: 'Hold steady, spine neutral',
                release: 'Return to start position'
            }
        },
        {
            id: 'bird-dog-right',
            name: 'Bird-Dog',
            side: 'Right arm, Left leg',
            icon: '🐕',
            bilateral: true,
            instructions: [
                'Start on all fours, hands under shoulders, knees under hips',
                'Keep spine neutral (slight natural arch)',
                'Raise right arm forward and left leg back simultaneously',
                'Form a straight line from hand to foot',
                'Hold, then return with control'
            ],
            tips: [
                'No movement in your lower back - this is key!',
                'Don\'t let hips rotate or dip',
                'Reach long through fingertips and heel'
            ],
            audioInstructions: {
                start: 'Raise right arm and left leg',
                hold: 'Hold steady, spine neutral',
                release: 'Return to start position'
            }
        }
    ];

    // Get exercise by id
    function getExercise(id) {
        return EXERCISES.find(ex => ex.id === id);
    }

    // Get all exercises
    function getAllExercises() {
        return EXERCISES;
    }

    // Get level info
    function getLevel(levelId) {
        return LEVELS[levelId] || LEVELS.standard;
    }

    // Get all levels
    function getAllLevels() {
        return LEVELS;
    }

    // Get bad day level
    function getBadDayLevel() {
        return BAD_DAY_LEVEL;
    }

    // Generate workout plan for a level
    function generateWorkoutPlan(levelId, isBadDay = false) {
        const level = isBadDay ? BAD_DAY_LEVEL : getLevel(levelId);
        const plan = [];

        // For each exercise
        EXERCISES.forEach(exercise => {
            // For each set in the pyramid
            level.pyramid.forEach((reps, setIndex) => {
                plan.push({
                    exercise: exercise,
                    setNumber: setIndex + 1,
                    totalSets: level.pyramid.length,
                    reps: reps,
                    holdDuration: level.holdDuration,
                    isLastSet: setIndex === level.pyramid.length - 1
                });
            });
        });

        return {
            level: level,
            exercises: plan,
            totalExercises: EXERCISES.length,
            estimatedDuration: calculateDuration(plan, level.holdDuration, 10)
        };
    }

    // Generate workout plan for a SINGLE exercise (or bilateral pair)
    // For bilateral exercises (side-plank, bird-dog), this generates L→R within each set
    function generateSingleExercisePlan(exerciseId, levelId, isBadDay = false) {
        const level = isBadDay ? BAD_DAY_LEVEL : getLevel(levelId);
        const exercise = getExercise(exerciseId);

        if (!exercise) return null;

        const plan = [];

        // Check if this is a bilateral exercise (has a pair)
        const isBilateral = exercise.bilateral;
        let pairExercise = null;

        if (isBilateral) {
            // Find the pair (e.g., side-plank-left → side-plank-right)
            const baseId = exerciseId.replace('-left', '').replace('-right', '');
            const isLeft = exerciseId.endsWith('-left');
            const pairId = isLeft ? `${baseId}-right` : `${baseId}-left`;
            pairExercise = getExercise(pairId);
        }

        // For each set in the pyramid (e.g., 5-3-1)
        level.pyramid.forEach((reps, setIndex) => {
            // Add this side
            plan.push({
                exercise: exercise,
                setNumber: setIndex + 1,
                totalSets: level.pyramid.length,
                reps: reps,
                holdDuration: level.holdDuration,
                isLastSet: setIndex === level.pyramid.length - 1 && !pairExercise,
                phase: 'primary'
            });

            // If bilateral, add the other side immediately after (before rest)
            if (pairExercise) {
                plan.push({
                    exercise: pairExercise,
                    setNumber: setIndex + 1,
                    totalSets: level.pyramid.length,
                    reps: reps,
                    holdDuration: level.holdDuration,
                    isLastSet: setIndex === level.pyramid.length - 1,
                    phase: 'pair'
                });
            }
        });

        return {
            level: level,
            exerciseId: exerciseId,
            exercises: plan,
            totalSets: level.pyramid.length,
            isBilateral: isBilateral,
            estimatedDuration: calculateDuration(plan, level.holdDuration, 10)
        };
    }

    // Get next exercise in sequence
    function getNextExercise(currentExerciseId) {
        const currentIndex = EXERCISES.findIndex(ex => ex.id === currentExerciseId);
        if (currentIndex < EXERCISES.length - 1) {
            return EXERCISES[currentIndex + 1];
        }
        return null; // No more exercises
    }

    // Calculate estimated workout duration
    function calculateDuration(plan, holdDuration, restDuration) {
        let totalSeconds = 0;
        plan.forEach(item => {
            // Hold time for all reps
            totalSeconds += item.reps * holdDuration;
            // Rest between reps (minus 1 since no rest after last rep)
            totalSeconds += (item.reps - 1) * restDuration;
            // Rest between sets/exercises
            totalSeconds += restDuration;
        });
        return Math.ceil(totalSeconds / 60); // Return minutes
    }

    // Get next level
    function getNextLevel(currentLevelId) {
        const levelOrder = ['beginner', 'developing', 'standard', 'advanced', 'challenge'];
        const currentIndex = levelOrder.indexOf(currentLevelId);
        if (currentIndex < levelOrder.length - 1) {
            return levelOrder[currentIndex + 1];
        }
        return null;
    }

    // Check if should suggest level up
    function shouldSuggestLevelUp(currentLevelId, completedSessions) {
        const level = getLevel(currentLevelId);
        if (level.sessionsToAdvance && completedSessions >= level.sessionsToAdvance) {
            return getNextLevel(currentLevelId);
        }
        return null;
    }

    return {
        LEVELS,
        EXERCISES,
        getExercise,
        getAllExercises,
        getLevel,
        getAllLevels,
        getBadDayLevel,
        generateWorkoutPlan,
        generateSingleExercisePlan,
        getNextExercise,
        calculateDuration,
        getNextLevel,
        shouldSuggestLevelUp
    };
})();
