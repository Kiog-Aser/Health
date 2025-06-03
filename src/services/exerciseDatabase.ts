export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'flexibility' | 'sports' | 'other';
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  caloriesPerMinute: number;
  description: string;
  tips?: string[];
  variations?: string[];
  safetyNotes?: string[];
}

export interface ExerciseSet {
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  restTime?: number;
  notes?: string;
}

class ExerciseDatabase {
  private exercises: Exercise[] = [
    // UPPER BODY PUSHING
    {
      id: 'bench-press',
      name: 'Bench Press',
      category: 'strength',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['barbell', 'bench'],
      instructions: [
        'Lie flat on bench with feet on floor',
        'Grip bar slightly wider than shoulders',
        'Lower bar to chest with control',
        'Press bar back up to starting position',
        'Keep shoulder blades retracted'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 7,
      description: 'Primary chest and pushing strength exercise',
      tips: [
        'Keep feet planted',
        'Maintain slight arch in back',
        'Control the negative portion'
      ],
      variations: ['Incline Bench Press', 'Dumbbell Press', 'Close-Grip Bench Press'],
      safetyNotes: ['Use spotter for heavy weights', 'Don\'t bounce bar off chest']
    },
    {
      id: 'incline-dumbbell-press',
      name: 'Incline Dumbbell Press',
      category: 'strength',
      muscleGroups: ['upper chest', 'shoulders', 'triceps'],
      equipment: ['dumbbells', 'incline bench'],
      instructions: [
        'Set bench to 30-45 degree incline',
        'Hold dumbbells at chest level',
        'Press weights up and slightly together',
        'Lower with control to stretch position',
        'Maintain constant tension'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 6,
      description: 'Targets upper chest development',
      tips: [
        'Don\'t go too steep on incline',
        'Control the eccentric phase',
        'Focus on squeezing chest at top'
      ]
    },
    {
      id: 'overhead-press',
      name: 'Overhead Press',
      category: 'strength',
      muscleGroups: ['shoulders', 'triceps', 'core'],
      equipment: ['barbell', 'dumbbells'],
      instructions: [
        'Stand with feet shoulder-width apart',
        'Press weight from shoulder level overhead',
        'Keep core tight and avoid arching back',
        'Lower with control to starting position'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 6,
      description: 'Primary overhead pressing movement',
      tips: [
        'Don\'t lean back excessively',
        'Drive through heels',
        'Keep core engaged'
      ]
    },
    {
      id: 'dips',
      name: 'Dips',
      category: 'strength',
      muscleGroups: ['triceps', 'chest', 'shoulders'],
      equipment: ['parallel bars', 'dip station'],
      instructions: [
        'Grip parallel bars and support body weight',
        'Lower body by bending elbows',
        'Descend until shoulders are below elbows',
        'Push back up to starting position'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 8,
      description: 'Bodyweight tricep and chest exercise',
      tips: [
        'Keep body upright for tricep focus',
        'Lean forward slightly for chest focus',
        'Control the descent'
      ]
    },

    // UPPER BODY PULLING
    {
      id: 'pull-up',
      name: 'Pull-Up',
      category: 'strength',
      muscleGroups: ['lats', 'biceps', 'rhomboids', 'middle traps'],
      equipment: ['pull-up bar'],
      instructions: [
        'Hang from bar with palms facing away',
        'Pull body up until chin clears bar',
        'Lower with control to full hang',
        'Keep core engaged throughout'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 9,
      description: 'Primary vertical pulling exercise',
      tips: [
        'Start with assisted variations if needed',
        'Focus on pulling with back muscles',
        'Full range of motion'
      ],
      variations: ['Chin-Up', 'Wide-Grip Pull-Up', 'Assisted Pull-Up'],
      safetyNotes: ['Progress gradually to avoid injury']
    },
    {
      id: 'chin-up',
      name: 'Chin-Up',
      category: 'strength',
      muscleGroups: ['lats', 'biceps', 'rhomboids'],
      equipment: ['pull-up bar'],
      instructions: [
        'Hang from bar with palms facing toward you',
        'Pull body up until chin clears bar',
        'Lower with control to full hang',
        'Keep shoulders down and back'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 9,
      description: 'Bicep-emphasized vertical pull',
      tips: [
        'Focus on bicep engagement',
        'Don\'t swing or kip',
        'Control both up and down phases'
      ]
    },
    {
      id: 'barbell-row',
      name: 'Barbell Row',
      category: 'strength',
      muscleGroups: ['lats', 'rhomboids', 'rear delts', 'biceps'],
      equipment: ['barbell'],
      instructions: [
        'Hinge at hips with barbell in hands',
        'Keep back straight and chest up',
        'Pull bar to lower chest/upper abdomen',
        'Squeeze shoulder blades together',
        'Lower with control'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 7,
      description: 'Primary horizontal pulling movement',
      tips: [
        'Keep core tight',
        'Don\'t use momentum',
        'Feel the squeeze in your back'
      ]
    },
    {
      id: 'lat-pulldown',
      name: 'Lat Pulldown',
      category: 'strength',
      muscleGroups: ['lats', 'biceps', 'rhomboids'],
      equipment: ['lat pulldown machine'],
      instructions: [
        'Sit at lat pulldown machine',
        'Grip bar wider than shoulder width',
        'Pull bar down to upper chest',
        'Squeeze lats at bottom',
        'Return with control'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 6,
      description: 'Machine-based vertical pulling exercise',
      tips: [
        'Lean back slightly',
        'Focus on lat engagement',
        'Don\'t pull behind neck'
      ]
    },

    // LOWER BODY
    {
      id: 'squat',
      name: 'Squat',
      category: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
      equipment: ['barbell', 'squat rack'],
      instructions: [
        'Position bar on upper back',
        'Stand with feet shoulder-width apart',
        'Lower down as if sitting back into chair',
        'Keep chest up and knees behind toes',
        'Drive through heels to return to start'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 8,
      description: 'King of all lower body exercises',
      tips: [
        'Keep weight on heels',
        'Knees track over toes',
        'Maintain neutral spine'
      ],
      variations: ['Front Squat', 'Goblet Squat', 'Box Squat'],
      safetyNotes: ['Use safety bars', 'Don\'t let knees cave inward']
    },
    {
      id: 'deadlift',
      name: 'Deadlift',
      category: 'strength',
      muscleGroups: ['hamstrings', 'glutes', 'lower back', 'traps', 'forearms'],
      equipment: ['barbell'],
      instructions: [
        'Stand with feet hip-width apart',
        'Grip bar with hands just outside legs',
        'Keep chest up and shoulders back',
        'Drive through heels and hips to lift',
        'Stand tall, then lower with control'
      ],
      difficulty: 'advanced',
      caloriesPerMinute: 10,
      description: 'Ultimate posterior chain developer',
      tips: [
        'Keep bar close to body',
        'Engage lats to protect spine',
        'Hip hinge, not squat movement'
      ],
      variations: ['Romanian Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift'],
      safetyNotes: ['Master form with light weight first', 'Keep neutral spine']
    },
    {
      id: 'leg-press',
      name: 'Leg Press',
      category: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: ['leg press machine'],
      instructions: [
        'Sit in leg press machine',
        'Place feet shoulder-width apart on platform',
        'Lower weight until knees reach 90 degrees',
        'Press through heels to return to start',
        'Don\'t lock knees completely'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 6,
      description: 'Machine-based quad and glute exercise',
      tips: [
        'Keep core engaged',
        'Full range of motion',
        'Control the negative'
      ]
    },
    {
      id: 'leg-extension',
      name: 'Leg Extension',
      category: 'strength',
      muscleGroups: ['quadriceps'],
      equipment: ['leg extension machine'],
      instructions: [
        'Sit in leg extension machine',
        'Position legs under pad',
        'Extend legs until straight',
        'Squeeze quads at top',
        'Lower with control'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 4,
      description: 'Isolation exercise for quadriceps',
      tips: [
        'Don\'t swing or use momentum',
        'Focus on mind-muscle connection',
        'Control both phases'
      ]
    },
    {
      id: 'lying-leg-curl',
      name: 'Lying Leg Curl',
      category: 'strength',
      muscleGroups: ['hamstrings'],
      equipment: ['leg curl machine'],
      instructions: [
        'Lie face down on leg curl machine',
        'Position legs under pad',
        'Curl heels toward glutes',
        'Squeeze hamstrings at top',
        'Lower with control'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 4,
      description: 'Isolation exercise for hamstrings',
      tips: [
        'Keep hips down on pad',
        'Full range of motion',
        'Focus on hamstring squeeze'
      ]
    },
    {
      id: 'calf-raise',
      name: 'Calf Raise',
      category: 'strength',
      muscleGroups: ['calves'],
      equipment: ['calf raise machine', 'dumbbells'],
      instructions: [
        'Stand with balls of feet on platform',
        'Rise up on toes as high as possible',
        'Hold briefly at top',
        'Lower slowly below platform level',
        'Feel stretch in calves'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 3,
      description: 'Calf muscle development exercise',
      tips: [
        'Full range of motion',
        'Pause at top and bottom',
        'Control the movement'
      ]
    },

    // ARMS & SHOULDERS
    {
      id: 'barbell-curl',
      name: 'Barbell Curl',
      category: 'strength',
      muscleGroups: ['biceps'],
      equipment: ['barbell'],
      instructions: [
        'Stand with feet hip-width apart',
        'Hold barbell with underhand grip',
        'Curl weight up toward chest',
        'Squeeze biceps at top',
        'Lower with control'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 4,
      description: 'Primary bicep mass builder',
      tips: [
        'Keep elbows stationary',
        'Don\'t swing weight',
        'Focus on bicep contraction'
      ]
    },
    {
      id: 'dumbbell-curl',
      name: 'Dumbbell Curl',
      category: 'strength',
      muscleGroups: ['biceps'],
      equipment: ['dumbbells'],
      instructions: [
        'Stand with dumbbells at sides',
        'Curl one or both arms up',
        'Rotate wrists during curl',
        'Squeeze at top',
        'Lower with control'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 4,
      description: 'Versatile bicep exercise',
      variations: ['Hammer Curl', 'Concentration Curl', 'Incline Curl']
    },
    {
      id: 'tricep-pushdown',
      name: 'Tricep Pushdown',
      category: 'strength',
      muscleGroups: ['triceps'],
      equipment: ['cable machine'],
      instructions: [
        'Stand at cable machine with rope or bar',
        'Keep elbows tucked at sides',
        'Push weight down until arms are straight',
        'Squeeze triceps at bottom',
        'Return with control'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 4,
      description: 'Cable tricep isolation exercise'
    },
    {
      id: 'lateral-raise',
      name: 'Lateral Raise',
      category: 'strength',
      muscleGroups: ['side delts'],
      equipment: ['dumbbells'],
      instructions: [
        'Stand with dumbbells at sides',
        'Raise arms out to sides',
        'Lift to shoulder height',
        'Hold briefly',
        'Lower with control'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 3,
      description: 'Side deltoid isolation exercise'
    },

    // BACK SPECIFIC
    {
      id: 'back-extension',
      name: 'Back Extension',
      category: 'strength',
      muscleGroups: ['lower back', 'glutes'],
      equipment: ['back extension machine'],
      instructions: [
        'Position yourself in back extension machine',
        'Cross arms over chest',
        'Lower torso down with control',
        'Raise back up to neutral position',
        'Don\'t hyperextend'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 4,
      description: 'Lower back strengthening exercise'
    },
    {
      id: 'barbell-lying-triceps-extension',
      name: 'Barbell Lying Triceps Extension',
      category: 'strength',
      muscleGroups: ['triceps'],
      equipment: ['barbell', 'bench'],
      instructions: [
        'Lie on bench holding barbell above chest',
        'Keep upper arms stationary',
        'Lower weight toward forehead by bending elbows',
        'Extend arms back to starting position',
        'Focus on tricep stretch and contraction'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 5,
      description: 'Effective tricep mass builder',
      tips: [
        'Keep elbows tucked',
        'Control the weight',
        'Feel the stretch at bottom'
      ]
    },

    // BODYWEIGHT EXERCISES
    {
      id: 'push-up',
      name: 'Push-Up',
      category: 'strength',
      muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
      equipment: ['bodyweight'],
      instructions: [
        'Start in plank position',
        'Lower chest to floor',
        'Push back up to start',
        'Keep body straight'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 6,
      description: 'Classic bodyweight upper body exercise',
      variations: ['Diamond Push-Up', 'Wide Push-Up', 'Incline Push-Up']
    },
    {
      id: 'bar-dip',
      name: 'Bar Dip',
      category: 'strength',
      muscleGroups: ['triceps', 'chest', 'shoulders'],
      equipment: ['parallel bars'],
      instructions: [
        'Support body weight on parallel bars',
        'Lower body by bending elbows',
        'Descend until shoulders below elbows',
        'Push back up to starting position',
        'Keep body controlled throughout'
      ],
      difficulty: 'intermediate',
      caloriesPerMinute: 8,
      description: 'Advanced bodyweight tricep exercise'
    },
    {
      id: 'bar-muscle-up',
      name: 'Bar Muscle-Up',
      category: 'strength',
      muscleGroups: ['lats', 'biceps', 'triceps', 'chest', 'core'],
      equipment: ['pull-up bar'],
      instructions: [
        'Start hanging from pull-up bar',
        'Pull up explosively',
        'Transition over the bar',
        'Press out to support position',
        'Lower with control'
      ],
      difficulty: 'advanced',
      caloriesPerMinute: 12,
      description: 'Advanced compound bodyweight movement'
    },
    {
      id: 'tricep-pushdown-with-bar',
      name: 'Tricep Pushdown With Bar',
      category: 'strength',
      muscleGroups: ['triceps'],
      equipment: ['cable machine', 'straight bar'],
      instructions: [
        'Stand at cable machine with straight bar',
        'Keep elbows tucked at sides',
        'Push bar down until arms fully extended',
        'Squeeze triceps at bottom',
        'Return to starting position with control'
      ],
      difficulty: 'beginner',
      caloriesPerMinute: 4,
      description: 'Cable tricep isolation with straight bar'
    }
  ];

  private customExercises: Exercise[] = [];

  // Get all exercises
  getAllExercises(): Exercise[] {
    return [...this.exercises, ...this.customExercises];
  }

  // Get exercises by category
  getExercisesByCategory(category: Exercise['category']): Exercise[] {
    return this.getAllExercises().filter(exercise => exercise.category === category);
  }

  // Get exercises by muscle group
  getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
    return this.getAllExercises().filter(exercise => 
      exercise.muscleGroups.some(group => 
        group.toLowerCase().includes(muscleGroup.toLowerCase())
      )
    );
  }

  // Get exercises by equipment
  getExercisesByEquipment(equipment: string): Exercise[] {
    return this.getAllExercises().filter(exercise => 
      exercise.equipment.some(eq => 
        eq.toLowerCase().includes(equipment.toLowerCase())
      )
    );
  }

  // Get exercises by difficulty
  getExercisesByDifficulty(difficulty: Exercise['difficulty']): Exercise[] {
    return this.getAllExercises().filter(exercise => exercise.difficulty === difficulty);
  }

  // Search exercises by name or description
  searchExercises(query: string): Exercise[] {
    const searchTerm = query.toLowerCase();
    return this.getAllExercises().filter(exercise => 
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.description.toLowerCase().includes(searchTerm) ||
      exercise.muscleGroups.some(group => group.toLowerCase().includes(searchTerm))
    );
  }

  // Get exercise by ID
  getExerciseById(id: string): Exercise | undefined {
    return this.getAllExercises().find(exercise => exercise.id === id);
  }

  // Add custom exercise
  addCustomExercise(exercise: Omit<Exercise, 'id'>): Exercise {
    const newExercise: Exercise = {
      ...exercise,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.customExercises.push(newExercise);
    return newExercise;
  }

  // Remove custom exercise
  removeCustomExercise(id: string): boolean {
    const index = this.customExercises.findIndex(exercise => exercise.id === id);
    if (index > -1) {
      this.customExercises.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get popular exercises (most commonly used)
  getPopularExercises(limit: number = 10): Exercise[] {
    // Return a curated list of popular strength exercises
    const popularIds = [
      'bench-press', 'squat', 'deadlift', 'pull-up', 'push-up', 
      'barbell-row', 'overhead-press', 'barbell-curl', 'leg-press', 'dips'
    ];
    
    return popularIds
      .map(id => this.getExerciseById(id))
      .filter((exercise): exercise is Exercise => exercise !== undefined)
      .slice(0, limit);
  }

  // Get exercises suitable for beginners
  getBeginnerFriendlyExercises(): Exercise[] {
    return this.getAllExercises().filter(exercise => 
      exercise.difficulty === 'beginner' || 
      (exercise.equipment.includes('bodyweight') && exercise.difficulty === 'intermediate')
    );
  }

  // Get quick exercises (good for short workouts)
  getQuickExercises(): Exercise[] {
    return this.getAllExercises().filter(exercise => 
      exercise.caloriesPerMinute >= 8
    );
  }

  // Get all unique muscle groups
  getAllMuscleGroups(): string[] {
    const muscleGroups = new Set<string>();
    this.getAllExercises().forEach(exercise => {
      exercise.muscleGroups.forEach(group => muscleGroups.add(group));
    });
    return Array.from(muscleGroups).sort();
  }

  // Get all unique equipment types
  getAllEquipmentTypes(): string[] {
    const equipment = new Set<string>();
    this.getAllExercises().forEach(exercise => {
      exercise.equipment.forEach(eq => equipment.add(eq));
    });
    return Array.from(equipment).sort();
  }

  // Generate workout suggestions based on preferences
  generateWorkoutSuggestion(
    category: Exercise['category'],
    duration: number, // in minutes
    difficulty: Exercise['difficulty'],
    equipment: string[] = []
  ): Exercise[] {
    let availableExercises = this.getExercisesByCategory(category);
    
    if (difficulty) {
      availableExercises = availableExercises.filter(ex => ex.difficulty === difficulty);
    }
    
    if (equipment.length > 0) {
      availableExercises = availableExercises.filter(ex => 
        ex.equipment.some(eq => equipment.includes(eq))
      );
    }
    
    // Calculate how many exercises we can fit based on duration
    const targetExerciseCount = Math.max(3, Math.min(8, Math.floor(duration / 5)));
    
    // Shuffle and return appropriate number of exercises
    const shuffled = [...availableExercises].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, targetExerciseCount);
  }
}

export const exerciseDatabase = new ExerciseDatabase(); 