/**
 * McGill Big 3 - Timer Module
 * Hands-free workout timer with automatic transitions and audio cues
 */

const Timer = (() => {
    // Timer state
    let state = {
        isRunning: false,
        isPaused: false,
        currentPhase: 'idle', // 'idle', 'hold', 'rest', 'transition', 'complete'
        currentTime: 0,
        holdDuration: 10,
        restDuration: 10,
        currentExerciseIndex: 0,
        currentRep: 0,
        currentSet: 0,
        workoutPlan: null,
        startTime: null,
        callbacks: {}
    };

    // Audio context for sounds
    let audioContext = null;

    // Initialize audio
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    // Play a beep sound
    function playBeep(frequency = 800, duration = 150, type = 'sine') {
        try {
            const ctx = initAudio();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration / 1000);
        } catch (e) {
            console.log('Audio not available:', e);
        }
    }

    // Different sound patterns
    const sounds = {
        startHold: () => {
            playBeep(880, 200); // High beep
        },
        countdown: () => {
            playBeep(660, 100); // Medium beep
        },
        endHold: () => {
            playBeep(440, 300); // Low beep
        },
        startRest: () => {
            playBeep(550, 150);
            setTimeout(() => playBeep(550, 150), 200);
        },
        exerciseComplete: () => {
            playBeep(880, 100);
            setTimeout(() => playBeep(1100, 100), 150);
            setTimeout(() => playBeep(1320, 200), 300);
        },
        workoutComplete: () => {
            playBeep(660, 150);
            setTimeout(() => playBeep(880, 150), 200);
            setTimeout(() => playBeep(1100, 150), 400);
            setTimeout(() => playBeep(1320, 300), 600);
        },
        tick: () => {
            playBeep(1000, 50, 'square');
        }
    };

    // Trigger vibration
    function vibrate(pattern = [100]) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    // Vibration patterns
    const vibrations = {
        startHold: () => vibrate([200]),
        countdown: () => vibrate([50]),
        endHold: () => vibrate([100, 50, 100]),
        startRest: () => vibrate([50, 50, 50]),
        exerciseComplete: () => vibrate([100, 100, 100, 100, 200]),
        workoutComplete: () => vibrate([200, 100, 200, 100, 400])
    };

    // Speech synthesis for instructions
    function speak(text, priority = false) {
        if (!state.callbacks.settings?.soundEnabled) return;

        if ('speechSynthesis' in window) {
            // Cancel previous if priority
            if (priority) {
                window.speechSynthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            window.speechSynthesis.speak(utterance);
        }
    }

    // Timer interval reference
    let timerInterval = null;

    // Start the workout
    function startWorkout(workoutPlan, settings, callbacks) {
        state = {
            isRunning: true,
            isPaused: false,
            currentPhase: 'transition',
            currentTime: 3, // 3 second countdown to start
            holdDuration: settings.holdDuration || 10,
            restDuration: settings.restDuration || 10,
            currentExerciseIndex: 0,
            currentRep: 1,
            currentSet: 1,
            workoutPlan: workoutPlan,
            startTime: Date.now(),
            callbacks: {
                onTick: callbacks.onTick || (() => { }),
                onPhaseChange: callbacks.onPhaseChange || (() => { }),
                onExerciseChange: callbacks.onExerciseChange || (() => { }),
                onRepComplete: callbacks.onRepComplete || (() => { }),
                onSetComplete: callbacks.onSetComplete || (() => { }),
                onWorkoutComplete: callbacks.onWorkoutComplete || (() => { }),
                settings: settings
            }
        };

        // Announce first exercise
        const firstExercise = getCurrentExerciseItem();
        speak(`Get ready for ${firstExercise.exercise.name}. ${firstExercise.exercise.side || ''}`);

        // Start the countdown
        startTimer();
    }

    // Get current exercise item from plan
    function getCurrentExerciseItem() {
        if (!state.workoutPlan) return null;
        return state.workoutPlan.exercises[state.currentExerciseIndex];
    }

    // Start the timer loop
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            if (!state.isRunning || state.isPaused) return;

            tick();
        }, 1000);
    }

    // Timer tick
    function tick() {
        const settings = state.callbacks.settings || {};

        // Countdown tick
        if (state.currentTime > 0) {
            state.currentTime--;

            // Play countdown sounds for last 3 seconds
            if (state.currentTime <= 3 && state.currentTime > 0) {
                if (settings.soundEnabled) sounds.countdown();
                if (settings.vibrationEnabled) vibrations.countdown();
            }

            state.callbacks.onTick({
                time: state.currentTime,
                phase: state.currentPhase,
                exercise: getCurrentExerciseItem(),
                rep: state.currentRep,
                totalReps: getCurrentExerciseItem()?.reps || 0
            });

            return;
        }

        // Time is up, handle phase transition
        handlePhaseComplete();
    }

    // Handle phase completion
    function handlePhaseComplete() {
        const settings = state.callbacks.settings || {};
        const currentExercise = getCurrentExerciseItem();

        switch (state.currentPhase) {
            case 'transition':
                // Start first hold
                startHoldPhase();
                break;

            case 'hold':
                // Hold complete
                if (settings.soundEnabled) sounds.endHold();
                if (settings.vibrationEnabled) vibrations.endHold();

                state.callbacks.onRepComplete({
                    rep: state.currentRep,
                    totalReps: currentExercise.reps
                });

                // Check if more reps in this set
                if (state.currentRep < currentExercise.reps) {
                    // More reps - go to rest, then next rep
                    state.currentRep++;
                    startRestPhase();
                } else {
                    // Set complete - check for more exercises
                    if (settings.soundEnabled) sounds.exerciseComplete();
                    if (settings.vibrationEnabled) vibrations.exerciseComplete();

                    state.callbacks.onSetComplete({
                        exercise: currentExercise,
                        exerciseIndex: state.currentExerciseIndex
                    });

                    // Move to next exercise in plan
                    if (state.currentExerciseIndex < state.workoutPlan.exercises.length - 1) {
                        state.currentExerciseIndex++;
                        state.currentRep = 1;

                        const nextExercise = getCurrentExerciseItem();

                        // Announce next exercise
                        speak(`Next: ${nextExercise.exercise.name}. ${nextExercise.exercise.side || ''}`, true);

                        state.callbacks.onExerciseChange({
                            exercise: nextExercise,
                            exerciseIndex: state.currentExerciseIndex
                        });

                        // Rest before next exercise
                        startRestPhase();
                    } else {
                        // Workout complete!
                        completeWorkout();
                    }
                }
                break;

            case 'rest':
                // Rest complete - start next hold
                startHoldPhase();
                break;
        }
    }

    // Start hold phase
    function startHoldPhase() {
        const settings = state.callbacks.settings || {};
        const currentExercise = getCurrentExerciseItem();

        state.currentPhase = 'hold';
        state.currentTime = state.holdDuration;

        if (settings.soundEnabled) sounds.startHold();
        if (settings.vibrationEnabled) vibrations.startHold();

        // Speak instruction
        if (state.currentRep === 1) {
            speak(currentExercise.exercise.audioInstructions?.start || 'Hold');
        }

        state.callbacks.onPhaseChange({
            phase: 'hold',
            duration: state.holdDuration,
            rep: state.currentRep,
            exercise: currentExercise
        });
    }

    // Start rest phase
    function startRestPhase() {
        const settings = state.callbacks.settings || {};

        state.currentPhase = 'rest';
        state.currentTime = state.restDuration;

        if (settings.soundEnabled) sounds.startRest();
        if (settings.vibrationEnabled) vibrations.startRest();

        speak('Rest');

        state.callbacks.onPhaseChange({
            phase: 'rest',
            duration: state.restDuration,
            rep: state.currentRep,
            exercise: getCurrentExerciseItem()
        });
    }

    // Complete the workout
    function completeWorkout() {
        const settings = state.callbacks.settings || {};

        state.isRunning = false;
        state.currentPhase = 'complete';

        if (settings.soundEnabled) sounds.workoutComplete();
        if (settings.vibrationEnabled) vibrations.workoutComplete();

        speak('Workout complete. Great job!', true);

        const duration = Math.round((Date.now() - state.startTime) / 1000);

        state.callbacks.onWorkoutComplete({
            duration: duration,
            exercisesCompleted: state.workoutPlan.exercises.length,
            level: state.workoutPlan.level
        });

        stopTimer();
    }

    // Pause the timer
    function pause() {
        state.isPaused = true;
        speak('Paused');
    }

    // Resume the timer
    function resume() {
        state.isPaused = false;
        speak('Resuming');

        // Resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    // Stop the timer
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        state.isRunning = false;
    }

    // Reset timer state
    function reset() {
        stopTimer();
        state = {
            isRunning: false,
            isPaused: false,
            currentPhase: 'idle',
            currentTime: 0,
            holdDuration: 10,
            restDuration: 10,
            currentExerciseIndex: 0,
            currentRep: 0,
            currentSet: 0,
            workoutPlan: null,
            startTime: null,
            callbacks: {}
        };
    }

    // Get current state
    function getState() {
        return { ...state };
    }

    // Calculate progress percentage for the ring
    function getProgressPercent() {
        if (state.currentPhase === 'hold') {
            return ((state.holdDuration - state.currentTime) / state.holdDuration) * 100;
        } else if (state.currentPhase === 'rest') {
            return ((state.restDuration - state.currentTime) / state.restDuration) * 100;
        }
        return 0;
    }

    // Format time as mm:ss
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return {
        startWorkout,
        pause,
        resume,
        stopTimer,
        reset,
        getState,
        getProgressPercent,
        formatTime,
        sounds,
        speak,
        initAudio
    };
})();
