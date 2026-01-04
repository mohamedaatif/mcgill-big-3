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

    // Play a beep sound with optional envelope
    function playBeep(frequency = 800, duration = 150, type = 'sine', volume = 0.3) {
        try {
            const ctx = initAudio();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(volume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration / 1000);
        } catch (e) {
            console.log('Audio not available:', e);
        }
    }

    // Play a chord (multiple frequencies)
    function playChord(frequencies, duration = 200, type = 'sine', volume = 0.15) {
        frequencies.forEach(freq => playBeep(freq, duration, type, volume));
    }

    // ====== DISTINCT SOUND PATTERNS ======
    // HOLD = Energizing, ascending, bright (cyan/blue theme)
    // REST = Calming, soft, lower tones (amber/orange theme)
    // COUNTDOWN = Building tension, dramatic
    // COMPLETE = Celebratory, satisfying

    const sounds = {
        // === HOLD PHASE (Exercise) - Bright, energizing ===
        startHold: () => {
            // Ascending power chord - "GO!"
            playBeep(523, 100, 'sine', 0.3);  // C5
            setTimeout(() => playBeep(659, 100, 'sine', 0.3), 80);  // E5
            setTimeout(() => playBeep(784, 200, 'sine', 0.35), 160); // G5
        },

        endHold: () => {
            // Satisfying descending resolution
            playBeep(784, 150, 'sine', 0.25); // G5
            setTimeout(() => playBeep(659, 150, 'sine', 0.2), 120); // E5
            setTimeout(() => playBeep(523, 200, 'sine', 0.15), 240); // C5
        },

        // === REST PHASE - Calming, soft ===
        startRest: () => {
            // Gentle double chime - "relax"
            playBeep(392, 200, 'sine', 0.2);  // G4 (lower, calming)
            setTimeout(() => playBeep(330, 250, 'sine', 0.15), 180); // E4
        },

        endRest: () => {
            // Soft awakening tone
            playBeep(440, 150, 'sine', 0.2); // A4
        },

        // === COUNTDOWN (last 3 seconds) ===
        countdown3: () => {
            // Low anticipation tick
            playBeep(440, 80, 'triangle', 0.25); // A4
        },
        countdown2: () => {
            // Rising anticipation
            playBeep(523, 80, 'triangle', 0.3); // C5
        },
        countdown1: () => {
            // High alert - about to change!
            playBeep(659, 100, 'triangle', 0.35); // E5
        },
        countdown0: () => {
            // Transition marker
            playBeep(784, 120, 'sine', 0.4); // G5
        },

        // === PROGRESS MARKERS ===
        repComplete: () => {
            // Quick satisfying "ding"
            playBeep(880, 80, 'sine', 0.2);  // A5
            setTimeout(() => playBeep(1047, 100, 'sine', 0.25), 60); // C6
        },

        exerciseComplete: () => {
            // Triumphant ascending arpeggio
            playBeep(523, 100, 'sine', 0.25);  // C5
            setTimeout(() => playBeep(659, 100, 'sine', 0.25), 100);  // E5
            setTimeout(() => playBeep(784, 100, 'sine', 0.3), 200);   // G5
            setTimeout(() => playBeep(1047, 200, 'sine', 0.35), 300); // C6
        },

        workoutComplete: () => {
            // Victory fanfare!
            playChord([523, 659, 784], 200, 'sine', 0.15); // C major chord
            setTimeout(() => playChord([587, 740, 880], 200, 'sine', 0.15), 250); // D major
            setTimeout(() => playChord([659, 784, 988], 200, 'sine', 0.18), 500); // E minor-ish
            setTimeout(() => playChord([523, 659, 784, 1047], 400, 'sine', 0.2), 750); // C major with octave
        },

        // Legacy/generic tick
        tick: () => {
            playBeep(800, 40, 'square', 0.15);
        }
    };

    // ====== DISTINCT VIBRATION PATTERNS ======
    // HOLD = Strong, confident pulses
    // REST = Gentle, soft feedback
    // COUNTDOWN = Escalating intensity

    function vibrate(pattern = [100]) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    const vibrations = {
        // HOLD - Strong, confident
        startHold: () => vibrate([150, 50, 150]),       // Two strong pulses
        endHold: () => vibrate([100, 80, 100, 80, 100]), // Triple pulse (done!)

        // REST - Gentle, calming
        startRest: () => vibrate([80, 100, 80]),        // Soft double tap

        // COUNTDOWN - Building intensity
        countdown3: () => vibrate([40]),                 // Light tap
        countdown2: () => vibrate([60]),                 // Medium tap
        countdown1: () => vibrate([100]),                // Strong tap

        // PROGRESS
        repComplete: () => vibrate([50, 50, 50]),        // Quick triple
        exerciseComplete: () => vibrate([100, 80, 100, 80, 150]), // Celebration pattern
        workoutComplete: () => vibrate([200, 100, 200, 100, 300, 100, 400]) // Victory pattern
    };

    // Speech synthesis for instructions (optional - off by default)
    function speak(text, priority = false) {
        // Voice announcements require both sound AND voice to be enabled
        if (!state.callbacks.settings?.soundEnabled) return;
        if (!state.callbacks.settings?.voiceEnabled) return;

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

            // Play distinct countdown sounds for last 3 seconds (escalating intensity)
            if (state.currentTime === 3) {
                if (settings.soundEnabled) sounds.countdown3();
                if (settings.vibrationEnabled) vibrations.countdown3();
            } else if (state.currentTime === 2) {
                if (settings.soundEnabled) sounds.countdown2();
                if (settings.vibrationEnabled) vibrations.countdown2();
            } else if (state.currentTime === 1) {
                if (settings.soundEnabled) sounds.countdown1();
                if (settings.vibrationEnabled) vibrations.countdown1();
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
                // Hold complete - rep finished!
                if (settings.soundEnabled) sounds.endHold();
                if (settings.vibrationEnabled) vibrations.endHold();

                // Quick satisfying rep complete feedback
                setTimeout(() => {
                    if (settings.soundEnabled) sounds.repComplete();
                    if (settings.vibrationEnabled) vibrations.repComplete();
                }, 300);

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
