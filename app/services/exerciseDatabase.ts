import { Exercise, ExerciseSet } from '../types';

interface ExerciseCategory {
  id: string;
  name: string;
  exercises: Exercise[];
}

class ExerciseDatabase {
  private exercises: Exercise[] = [];
  private exerciseUsageCount: Record<string, number> = {};

  constructor() {
    this.initializeExercises();
    this.loadUsageData();
  }

  private initializeExercises() {
    this.exercises = [
      // CHEST EXERCISES
      {
        id: 'chest-push-up',
        name: 'Push-ups',
        category: 'Chest',
        muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
        equipment: ['Bodyweight'],
        instructions: [
          'Start in a plank position with hands slightly wider than shoulders',
          'Lower your body until chest nearly touches the ground',
          'Push back up to starting position',
          'Keep your body straight throughout the movement'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 8,
        description: 'A classic bodyweight exercise that targets the chest, triceps, and shoulders.',
        tips: ['Keep core engaged', 'Maintain neutral spine', 'Control the descent'],
        variations: ['Diamond push-ups', 'Wide-grip push-ups', 'Incline push-ups'],
        safetyNotes: ['Avoid sagging hips', 'Don\'t lock elbows at the top']
      },
      {
        id: 'chest-bench-press',
        name: 'Bench Press',
        category: 'Chest',
        muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
        equipment: ['Barbell', 'Bench'],
        instructions: [
          'Lie on bench with feet flat on floor',
          'Grip barbell slightly wider than shoulder width',
          'Lower bar to chest with control',
          'Press bar back to starting position'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 6,
        description: 'The king of chest exercises using a barbell and bench.',
        tips: ['Keep shoulder blades retracted', 'Drive through legs', 'Maintain arch in back'],
        variations: ['Incline bench press', 'Decline bench press', 'Dumbbell press'],
        safetyNotes: ['Use a spotter', 'Don\'t bounce bar off chest', 'Use proper grip width']
      },
      {
        id: 'chest-incline-press',
        name: 'Incline Bench Press',
        category: 'Chest',
        muscleGroups: ['Upper Chest', 'Triceps', 'Shoulders'],
        equipment: ['Barbell', 'Incline Bench'],
        instructions: [
          'Set bench to 30-45 degree incline',
          'Lie back with feet flat on floor',
          'Grip barbell slightly wider than shoulders',
          'Press bar from upper chest to arms extended'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 6,
        description: 'Targets the upper portion of the chest with an inclined angle.',
        tips: ['Don\'t set incline too steep', 'Touch bar to upper chest', 'Keep core tight'],
        variations: ['Dumbbell incline press', 'Incline dumbbell flyes'],
        safetyNotes: ['Use proper spotter', 'Control the weight']
      },
      {
        id: 'chest-dumbbell-press',
        name: 'Dumbbell Press',
        category: 'Chest',
        muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
        equipment: ['Dumbbells', 'Bench'],
        instructions: [
          'Lie on bench holding dumbbells at chest level',
          'Press dumbbells up and together',
          'Lower with control to chest level',
          'Keep wrists straight throughout'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 6,
        description: 'A versatile chest exercise that allows for greater range of motion.',
        tips: ['Squeeze dumbbells together at top', 'Control the descent', 'Keep feet planted'],
        variations: ['Incline dumbbell press', 'Single-arm press'],
        safetyNotes: ['Don\'t let dumbbells drift back', 'Use spotter for heavy weights']
      },
      {
        id: 'chest-dips',
        name: 'Dips',
        category: 'Chest',
        muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
        equipment: ['Dip Bars', 'Parallel Bars'],
        instructions: [
          'Position yourself between parallel bars',
          'Grip bars and lift body until arms are straight',
          'Lower body by bending elbows until shoulders are below elbows',
          'Push back up to starting position'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 8,
        description: 'A compound bodyweight exercise that targets chest, triceps, and shoulders.',
        tips: ['Lean forward for chest emphasis', 'Control the descent', 'Keep shoulders down'],
        variations: ['Assisted dips', 'Weighted dips', 'Ring dips'],
        safetyNotes: ['Don\'t go too low if you feel shoulder pain', 'Build up strength gradually']
      },
      {
        id: 'chest-flyes',
        name: 'Dumbbell Flyes',
        category: 'Chest',
        muscleGroups: ['Chest', 'Shoulders'],
        equipment: ['Dumbbells', 'Bench'],
        instructions: [
          'Lie on bench holding dumbbells above chest',
          'Lower weights in wide arc until you feel stretch in chest',
          'Bring weights back together above chest',
          'Keep slight bend in elbows throughout'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 5,
        description: 'An isolation exercise that targets the chest with a stretching motion.',
        tips: ['Focus on the squeeze at the top', 'Control the weight', 'Don\'t go too low'],
        variations: ['Incline flyes', 'Cable flyes', 'Pec deck'],
        safetyNotes: ['Don\'t use too heavy weight', 'Maintain control throughout range of motion']
      },

      // BACK EXERCISES
      {
        id: 'back-pull-up',
        name: 'Pull-ups',
        category: 'Back',
        muscleGroups: ['Latissimus Dorsi', 'Biceps', 'Rhomboids'],
        equipment: ['Pull-up Bar'],
        instructions: [
          'Hang from bar with palms facing away',
          'Pull body up until chin clears the bar',
          'Lower with control to full arm extension',
          'Repeat for desired reps'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 10,
        description: 'A challenging upper body exercise that builds back and arm strength.',
        tips: ['Engage lats', 'Avoid swinging', 'Full range of motion'],
        variations: ['Chin-ups', 'Wide-grip pull-ups', 'Assisted pull-ups'],
        safetyNotes: ['Don\'t drop from the bar', 'Build up gradually']
      },
      {
        id: 'back-chin-up',
        name: 'Chin-ups',
        category: 'Back',
        muscleGroups: ['Latissimus Dorsi', 'Biceps', 'Rhomboids'],
        equipment: ['Pull-up Bar'],
        instructions: [
          'Hang from bar with palms facing toward you',
          'Pull body up until chin clears the bar',
          'Lower with control to full arm extension',
          'Keep core engaged throughout'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 10,
        description: 'A variation of pull-ups with greater bicep involvement.',
        tips: ['Focus on pulling with lats', 'Control the negative', 'Keep shoulders down'],
        variations: ['Neutral grip chin-ups', 'Weighted chin-ups'],
        safetyNotes: ['Progress gradually', 'Don\'t kip or swing']
      },
      {
        id: 'back-bent-over-row',
        name: 'Bent Over Row',
        category: 'Back',
        muscleGroups: ['Latissimus Dorsi', 'Rhomboids', 'Biceps', 'Rear Delts'],
        equipment: ['Barbell'],
        instructions: [
          'Stand with feet hip-width apart holding barbell',
          'Hinge at hips to lean forward about 45 degrees',
          'Pull barbell to lower chest/upper abdomen',
          'Lower with control to starting position'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 7,
        description: 'A fundamental back exercise that builds thickness and strength.',
        tips: ['Keep back straight', 'Squeeze shoulder blades', 'Don\'t use momentum'],
        variations: ['Dumbbell rows', 'T-bar rows', 'Cable rows'],
        safetyNotes: ['Maintain neutral spine', 'Don\'t round back']
      },
      {
        id: 'back-dumbbell-row',
        name: 'Dumbbell Row',
        category: 'Back',
        muscleGroups: ['Latissimus Dorsi', 'Rhomboids', 'Biceps'],
        equipment: ['Dumbbells', 'Bench'],
        instructions: [
          'Place one knee and hand on bench for support',
          'Hold dumbbell in opposite hand, arm extended',
          'Pull dumbbell to hip level',
          'Lower with control'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 6,
        description: 'A unilateral back exercise that allows focus on each side.',
        tips: ['Keep back flat', 'Pull elbow back, not out', 'Squeeze at the top'],
        variations: ['Two-arm dumbbell row', 'Chest-supported row'],
        safetyNotes: ['Don\'t twist torso', 'Control the weight']
      },
      {
        id: 'back-lat-pulldown',
        name: 'Lat Pulldown',
        category: 'Back',
        muscleGroups: ['Latissimus Dorsi', 'Biceps', 'Rhomboids'],
        equipment: ['Cable Machine', 'Lat Pulldown Bar'],
        instructions: [
          'Sit at lat pulldown machine with thighs secured',
          'Grip bar wider than shoulder width',
          'Pull bar down to upper chest',
          'Control the weight back up'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 6,
        description: 'A machine exercise that mimics the pull-up motion.',
        tips: ['Lean back slightly', 'Pull to chest, not behind neck', 'Focus on lats'],
        variations: ['Close-grip pulldown', 'Reverse-grip pulldown'],
        safetyNotes: ['Don\'t pull behind neck', 'Control the eccentric']
      },
      {
        id: 'back-deadlift',
        name: 'Deadlift',
        category: 'Back',
        muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back', 'Traps'],
        equipment: ['Barbell'],
        instructions: [
          'Stand with feet hip-width apart, bar over mid-foot',
          'Hinge at hips and knees to grip bar',
          'Lift by driving hips forward and standing tall',
          'Lower bar with control back to ground'
        ],
        difficulty: 'advanced',
        caloriesPerMinute: 8,
        description: 'The king of all exercises - builds total body strength.',
        tips: ['Keep bar close to body', 'Drive hips forward', 'Chest up'],
        variations: ['Romanian deadlift', 'Sumo deadlift', 'Trap bar deadlift'],
        safetyNotes: ['Perfect form is crucial', 'Start light and progress slowly']
      },

      // LEG EXERCISES
      {
        id: 'legs-squat',
        name: 'Bodyweight Squat',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        equipment: ['Bodyweight'],
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower body by bending knees and hips',
          'Keep chest up and knees tracking over toes',
          'Return to standing position'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 8,
        description: 'The fundamental lower body movement pattern.',
        tips: ['Keep weight on heels', 'Go below parallel if possible', 'Drive through heels'],
        variations: ['Jump squats', 'Pistol squats', 'Bulgarian split squats'],
        safetyNotes: ['Don\'t let knees cave in', 'Maintain neutral spine']
      },
      {
        id: 'legs-back-squat',
        name: 'Back Squat',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        equipment: ['Barbell', 'Squat Rack'],
        instructions: [
          'Position barbell on upper back in squat rack',
          'Step back and position feet shoulder-width apart',
          'Lower body by bending knees and hips',
          'Drive through heels to return to standing'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 8,
        description: 'The king of lower body exercises with added resistance.',
        tips: ['Keep chest up', 'Break at hips first', 'Drive knees out'],
        variations: ['Front squat', 'Goblet squat', 'Box squat'],
        safetyNotes: ['Use safety bars', 'Don\'t round back', 'Proper rack height']
      },
      {
        id: 'legs-front-squat',
        name: 'Front Squat',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
        equipment: ['Barbell', 'Squat Rack'],
        instructions: [
          'Position barbell on front of shoulders',
          'Keep elbows high and chest up',
          'Lower into squat position',
          'Drive through heels to stand'
        ],
        difficulty: 'advanced',
        caloriesPerMinute: 8,
        description: 'A squat variation that emphasizes the quads and core.',
        tips: ['Keep elbows high', 'Stay upright', 'Flexible wrists help'],
        variations: ['Cross-arm front squat', 'Dumbbell front squat'],
        safetyNotes: ['Master back squat first', 'Use proper front rack position']
      },
      {
        id: 'legs-lunges',
        name: 'Lunges',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        equipment: ['Bodyweight'],
        instructions: [
          'Step forward with one leg, lowering hips',
          'Lower until both knees are bent at 90 degrees',
          'Push back to starting position',
          'Repeat with other leg'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 7,
        description: 'A unilateral exercise that improves balance and leg strength.',
        tips: ['Keep front knee over ankle', 'Don\'t let back knee touch ground', 'Stay upright'],
        variations: ['Reverse lunges', 'Walking lunges', 'Lateral lunges'],
        safetyNotes: ['Control the movement', 'Don\'t let front knee drift inward']
      },
      {
        id: 'legs-bulgarian-split-squat',
        name: 'Bulgarian Split Squat',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        equipment: ['Bodyweight', 'Bench'],
        instructions: [
          'Stand 2-3 feet in front of bench',
          'Place rear foot on bench behind you',
          'Lower front leg until thigh is parallel to ground',
          'Push through front heel to return to start'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 7,
        description: 'A challenging single-leg exercise for strength and balance.',
        tips: ['Keep most weight on front leg', 'Don\'t push off back foot', 'Stay upright'],
        variations: ['Weighted Bulgarian split squat', 'Jumping Bulgarian split squat'],
        safetyNotes: ['Find proper foot position first', 'Control the movement']
      },
      {
        id: 'legs-leg-press',
        name: 'Leg Press',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        equipment: ['Leg Press Machine'],
        instructions: [
          'Sit in leg press machine with back against pad',
          'Place feet on platform shoulder-width apart',
          'Lower weight by bending knees to 90 degrees',
          'Press weight back up through heels'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 6,
        description: 'A machine exercise that safely loads the leg muscles.',
        tips: ['Don\'t let knees cave in', 'Full range of motion', 'Control the weight'],
        variations: ['Single-leg press', 'High foot position', 'Low foot position'],
        safetyNotes: ['Don\'t let knees go too far forward', 'Keep back against pad']
      },

      // SHOULDER EXERCISES
      {
        id: 'shoulders-overhead-press',
        name: 'Overhead Press',
        category: 'Shoulders',
        muscleGroups: ['Shoulders', 'Triceps', 'Core'],
        equipment: ['Barbell'],
        instructions: [
          'Stand with feet hip-width apart holding barbell at shoulder height',
          'Press bar straight up overhead',
          'Lock out arms at the top',
          'Lower bar back to shoulder height'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 6,
        description: 'A fundamental overhead pressing movement.',
        tips: ['Keep core tight', 'Press straight up', 'Don\'t arch back excessively'],
        variations: ['Dumbbell press', 'Seated press', 'Push press'],
        safetyNotes: ['Maintain neutral spine', 'Use appropriate weight']
      },
      {
        id: 'shoulders-dumbbell-press',
        name: 'Dumbbell Shoulder Press',
        category: 'Shoulders',
        muscleGroups: ['Shoulders', 'Triceps'],
        equipment: ['Dumbbells'],
        instructions: [
          'Stand or sit holding dumbbells at shoulder height',
          'Press dumbbells up and slightly together',
          'Lower with control back to shoulder height',
          'Keep core engaged throughout'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 5,
        description: 'A versatile shoulder exercise with independent arm movement.',
        tips: ['Don\'t let dumbbells drift forward', 'Full range of motion', 'Control the weight'],
        variations: ['Seated dumbbell press', 'Single-arm press', 'Arnold press'],
        safetyNotes: ['Start with lighter weight', 'Don\'t lock elbows aggressively']
      },
      {
        id: 'shoulders-lateral-raises',
        name: 'Lateral Raises',
        category: 'Shoulders',
        muscleGroups: ['Side Delts'],
        equipment: ['Dumbbells'],
        instructions: [
          'Stand holding dumbbells at sides',
          'Raise arms out to sides until parallel to ground',
          'Lower with control back to starting position',
          'Keep slight bend in elbows'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 4,
        description: 'An isolation exercise targeting the side deltoids.',
        tips: ['Lead with pinkies', 'Don\'t swing the weight', 'Control the negative'],
        variations: ['Cable lateral raises', 'Leaning lateral raises'],
        safetyNotes: ['Use appropriate weight', 'Don\'t raise above shoulder height']
      },
      {
        id: 'shoulders-rear-delt-flyes',
        name: 'Rear Delt Flyes',
        category: 'Shoulders',
        muscleGroups: ['Rear Delts', 'Rhomboids'],
        equipment: ['Dumbbells'],
        instructions: [
          'Bend over at hips holding dumbbells',
          'Raise arms out to sides, squeezing shoulder blades',
          'Lower with control',
          'Keep slight bend in elbows'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 4,
        description: 'Targets the often-neglected rear deltoids.',
        tips: ['Squeeze shoulder blades', 'Don\'t use momentum', 'Keep torso stable'],
        variations: ['Cable reverse flyes', 'Bent-over reverse flyes'],
        safetyNotes: ['Use light weight', 'Maintain neutral spine']
      },

      // ARM EXERCISES
      {
        id: 'arms-bicep-curls',
        name: 'Bicep Curls',
        category: 'Arms',
        muscleGroups: ['Biceps'],
        equipment: ['Dumbbells'],
        instructions: [
          'Stand holding dumbbells with arms at sides',
          'Curl weights up by flexing biceps',
          'Squeeze at the top',
          'Lower with control'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 4,
        description: 'The classic bicep building exercise.',
        tips: ['Don\'t swing the weight', 'Full range of motion', 'Control the negative'],
        variations: ['Hammer curls', 'Concentration curls', 'Barbell curls'],
        safetyNotes: ['Don\'t use momentum', 'Keep elbows at sides']
      },
      {
        id: 'arms-hammer-curls',
        name: 'Hammer Curls',
        category: 'Arms',
        muscleGroups: ['Biceps', 'Forearms'],
        equipment: ['Dumbbells'],
        instructions: [
          'Stand holding dumbbells with neutral grip',
          'Curl weights up keeping wrists neutral',
          'Squeeze at the top',
          'Lower with control'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 4,
        description: 'A bicep variation that also targets the forearms.',
        tips: ['Keep wrists straight', 'Don\'t rotate dumbbells', 'Control the movement'],
        variations: ['Cross-body hammer curls', 'Rope hammer curls'],
        safetyNotes: ['Use appropriate weight', 'Don\'t swing']
      },
      {
        id: 'arms-tricep-dips',
        name: 'Tricep Dips',
        category: 'Arms',
        muscleGroups: ['Triceps', 'Shoulders'],
        equipment: ['Bodyweight', 'Bench'],
        instructions: [
          'Sit on edge of bench with hands next to hips',
          'Slide forward off bench supporting weight with arms',
          'Lower body by bending elbows',
          'Push back up to starting position'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 6,
        description: 'A bodyweight exercise for tricep development.',
        tips: ['Keep elbows close to body', 'Don\'t go too low', 'Control the movement'],
        variations: ['Feet elevated dips', 'Ring dips', 'Weighted dips'],
        safetyNotes: ['Don\'t go below 90 degrees', 'Stop if shoulders hurt']
      },
      {
        id: 'arms-tricep-extensions',
        name: 'Tricep Extensions',
        category: 'Arms',
        muscleGroups: ['Triceps'],
        equipment: ['Dumbbells'],
        instructions: [
          'Stand holding dumbbell overhead with both hands',
          'Lower weight behind head by bending elbows',
          'Keep upper arms stationary',
          'Extend back to starting position'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 4,
        description: 'An isolation exercise for tricep development.',
        tips: ['Keep elbows close to head', 'Control the weight', 'Full range of motion'],
        variations: ['Lying tricep extensions', 'Cable extensions'],
        safetyNotes: ['Start with light weight', 'Don\'t let elbows flare']
      },
      {
        id: 'arms-close-grip-bench',
        name: 'Close-Grip Bench Press',
        category: 'Arms',
        muscleGroups: ['Triceps', 'Chest', 'Shoulders'],
        equipment: ['Barbell', 'Bench'],
        instructions: [
          'Lie on bench with hands closer than shoulder width',
          'Lower bar to chest keeping elbows close',
          'Press bar back up',
          'Focus on tricep engagement'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 6,
        description: 'A compound movement emphasizing tricep development.',
        tips: ['Keep elbows close to body', 'Don\'t grip too narrow', 'Control the weight'],
        variations: ['Close-grip dumbbell press', 'Close-grip pushups'],
        safetyNotes: ['Use spotter', 'Don\'t grip too narrow']
      },

      // CORE EXERCISES
      {
        id: 'core-plank',
        name: 'Plank',
        category: 'Core',
        muscleGroups: ['Core', 'Shoulders', 'Glutes'],
        equipment: ['Bodyweight'],
        instructions: [
          'Start in push-up position',
          'Lower to forearms keeping body straight',
          'Hold position engaging core',
          'Breathe normally throughout'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 5,
        description: 'An isometric core strengthening exercise.',
        tips: ['Keep body straight', 'Don\'t let hips sag', 'Engage glutes'],
        variations: ['Side plank', 'Plank with leg lifts', 'Plank up-downs'],
        safetyNotes: ['Don\'t hold breath', 'Stop if form breaks down']
      },
      {
        id: 'core-hanging-leg-raises',
        name: 'Hanging Leg Raises',
        category: 'Core',
        muscleGroups: ['Lower Abs', 'Hip Flexors'],
        equipment: ['Pull-up Bar'],
        instructions: [
          'Hang from pull-up bar with straight arms',
          'Raise legs up toward chest',
          'Lower with control',
          'Avoid swinging'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 6,
        description: 'A challenging exercise for core and grip strength.',
        tips: ['Control the movement', 'Don\'t swing', 'Focus on abs'],
        variations: ['Knee raises', 'Hanging windshield wipers'],
        safetyNotes: ['Build up grip strength first', 'Don\'t swing']
      },
      {
        id: 'core-russian-twists',
        name: 'Russian Twists',
        category: 'Core',
        muscleGroups: ['Obliques', 'Core'],
        equipment: ['Bodyweight'],
        instructions: [
          'Sit with knees bent, lean back slightly',
          'Lift feet off ground',
          'Rotate torso side to side',
          'Keep core engaged'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 5,
        description: 'A rotational core exercise targeting the obliques.',
        tips: ['Keep chest up', 'Control the rotation', 'Breathe throughout'],
        variations: ['Weighted Russian twists', 'Medicine ball twists'],
        safetyNotes: ['Don\'t round back excessively', 'Control the movement']
      },
      {
        id: 'core-mountain-climbers',
        name: 'Mountain Climbers',
        category: 'Core',
        muscleGroups: ['Core', 'Shoulders', 'Legs'],
        equipment: ['Bodyweight'],
        instructions: [
          'Start in plank position',
          'Alternate bringing knees to chest',
          'Keep hips level',
          'Maintain quick rhythm'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 10,
        description: 'A dynamic exercise combining core strength and cardio.',
        tips: ['Keep hips stable', 'Land softly', 'Maintain plank position'],
        variations: ['Slow mountain climbers', 'Cross-body mountain climbers'],
        safetyNotes: ['Keep shoulders over hands', 'Don\'t let hips bounce']
      }
    ];
  }

  private loadUsageData() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('exerciseUsageCount');
      if (stored) {
        this.exerciseUsageCount = JSON.parse(stored);
      }
    }
  }

  private saveUsageData() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('exerciseUsageCount', JSON.stringify(this.exerciseUsageCount));
    }
  }

  getAllExercises(): Exercise[] {
    return [...this.exercises];
  }

  getExercisesByCategory(category: string): Exercise[] {
    return this.exercises.filter(exercise => 
      exercise.category.toLowerCase() === category.toLowerCase()
    );
  }

  getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
    return this.exercises.filter(exercise =>
      exercise.muscleGroups.some(group => 
        group.toLowerCase().includes(muscleGroup.toLowerCase())
      )
    );
  }

  getExercisesByEquipment(equipment: string): Exercise[] {
    return this.exercises.filter(exercise =>
      exercise.equipment.some(eq => 
        eq.toLowerCase().includes(equipment.toLowerCase())
      )
    );
  }

  getExercisesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Exercise[] {
    return this.exercises.filter(exercise => exercise.difficulty === difficulty);
  }

  searchExercises(query: string): Exercise[] {
    const searchTerm = query.toLowerCase();
    return this.exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.category.toLowerCase().includes(searchTerm) ||
      exercise.muscleGroups.some(group => group.toLowerCase().includes(searchTerm)) ||
      exercise.equipment.some(eq => eq.toLowerCase().includes(searchTerm))
    );
  }

  getExerciseById(id: string): Exercise | undefined {
    return this.exercises.find(exercise => exercise.id === id);
  }

  getPopularExercises(limit: number = 10): Exercise[] {
    // Sort exercises by usage count, then by default popularity
    const sortedExercises = this.exercises
      .map(exercise => ({
        ...exercise,
        usageCount: this.exerciseUsageCount[exercise.id] || 0
      }))
      .sort((a, b) => {
        if (a.usageCount !== b.usageCount) {
          return b.usageCount - a.usageCount;
        }
        // Default popular exercises if no usage data
        const popularOrder = [
          'legs-squat', 'chest-push-up', 'back-pull-up', 'back-deadlift',
          'shoulders-overhead-press', 'core-plank', 'chest-bench-press',
          'arms-bicep-curls', 'legs-lunges', 'legs-back-squat'
        ];
        return popularOrder.indexOf(a.id) - popularOrder.indexOf(b.id);
      });

    return sortedExercises.slice(0, limit);
  }

  getCategories(): string[] {
    const categories = [...new Set(this.exercises.map(exercise => exercise.category))];
    return categories.sort();
  }

  getMuscleGroups(): string[] {
    const muscleGroups = new Set<string>();
    this.exercises.forEach(exercise => {
      exercise.muscleGroups.forEach(group => muscleGroups.add(group));
    });
    return Array.from(muscleGroups).sort();
  }

  getEquipmentTypes(): string[] {
    const equipment = new Set<string>();
    this.exercises.forEach(exercise => {
      exercise.equipment.forEach(eq => equipment.add(eq));
    });
    return Array.from(equipment).sort();
  }

  recordExerciseUsage(exerciseId: string) {
    this.exerciseUsageCount[exerciseId] = (this.exerciseUsageCount[exerciseId] || 0) + 1;
    this.saveUsageData();
  }

  getRecommendedExercises(
    targetMuscleGroups: string[] = [],
    availableEquipment: string[] = [],
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    limit: number = 5
  ): Exercise[] {
    let filtered = this.exercises;

    // Filter by muscle groups if specified
    if (targetMuscleGroups.length > 0) {
      filtered = filtered.filter(exercise =>
        exercise.muscleGroups.some(group =>
          targetMuscleGroups.some(target =>
            group.toLowerCase().includes(target.toLowerCase())
          )
        )
      );
    }

    // Filter by available equipment if specified
    if (availableEquipment.length > 0) {
      filtered = filtered.filter(exercise =>
        exercise.equipment.some(eq =>
          availableEquipment.some(available =>
            eq.toLowerCase().includes(available.toLowerCase())
          )
        )
      );
    }

    // Filter by difficulty if specified
    if (difficulty) {
      filtered = filtered.filter(exercise => exercise.difficulty === difficulty);
    }

    // Sort by popularity/usage
    filtered = filtered
      .map(exercise => ({
        ...exercise,
        usageCount: this.exerciseUsageCount[exercise.id] || 0
      }))
      .sort((a, b) => b.usageCount - a.usageCount);

    return filtered.slice(0, limit);
  }

  addCustomExercise(exercise: Exercise): void {
    this.exercises.push(exercise);
  }

  updateExercise(exerciseId: string, updates: Partial<Exercise>): boolean {
    const index = this.exercises.findIndex(ex => ex.id === exerciseId);
    if (index !== -1) {
      this.exercises[index] = { ...this.exercises[index], ...updates };
      return true;
    }
    return false;
  }

  deleteCustomExercise(exerciseId: string): boolean {
    const index = this.exercises.findIndex(ex => ex.id === exerciseId);
    if (index !== -1) {
      this.exercises.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const exerciseDatabase = new ExerciseDatabase();
export type { Exercise, ExerciseSet }; 