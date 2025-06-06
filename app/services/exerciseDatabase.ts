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
        id: 'chest-dumbbell-flyes',
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

      // BAR DIP
      {
        id: 'bar-dip',
        name: 'Bar Dip',
        category: 'Chest',
        muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
        equipment: ['Dip Bar', 'Parallel Bars'],
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
        id: 'back-bent-over-row',
        name: 'Bent Over Row',
        category: 'Back',
        muscleGroups: ['Latissimus Dorsi', 'Rhomboids', 'Biceps'],
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

      // LEG EXERCISES
      {
        id: 'legs-squat',
        name: 'Squats',
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
        description: 'The king of lower body exercises targeting multiple muscle groups.',
        tips: ['Keep weight on heels', 'Go below parallel if possible', 'Drive through heels'],
        variations: ['Goblet squats', 'Front squats', 'Bulgarian split squats'],
        safetyNotes: ['Don\'t let knees cave in', 'Maintain neutral spine']
      },
      {
        id: 'legs-deadlift',
        name: 'Deadlift',
        category: 'Legs',
        muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back'],
        equipment: ['Barbell'],
        instructions: [
          'Stand with feet hip-width apart, bar over mid-foot',
          'Hinge at hips and knees to grip bar',
          'Lift by driving hips forward and standing tall',
          'Lower bar with control back to ground'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 8,
        description: 'A fundamental movement pattern that builds posterior chain strength.',
        tips: ['Keep bar close to body', 'Drive hips forward', 'Chest up'],
        variations: ['Romanian deadlift', 'Sumo deadlift', 'Trap bar deadlift'],
        safetyNotes: ['Perfect form is crucial', 'Start light and progress slowly']
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

      // ARM EXERCISES
      {
        id: 'arms-barbell-curl',
        name: 'Barbell Curl',
        category: 'Arms',
        muscleGroups: ['Biceps', 'Forearms'],
        equipment: ['Barbell'],
        instructions: [
          'Stand with feet hip-width apart holding barbell with underhand grip',
          'Keep elbows close to torso throughout movement',
          'Curl the weight up by contracting biceps',
          'Lower with control back to starting position'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 5,
        description: 'A classic bicep isolation exercise using a barbell.',
        tips: ['Don\'t swing the weight', 'Keep elbows stationary', 'Full range of motion'],
        variations: ['Dumbbell curls', 'Hammer curls', 'Preacher curls'],
        safetyNotes: ['Don\'t use momentum', 'Control the negative']
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
          'Lower with control back to shoulders',
          'Keep core engaged throughout'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 6,
        description: 'A compound movement that builds shoulder and core strength.',
        tips: ['Keep bar path straight', 'Engage glutes', 'Don\'t arch back excessively'],
        variations: ['Dumbbell press', 'Seated press', 'Pike push-ups'],
        safetyNotes: ['Warm up shoulders thoroughly', 'Don\'t press behind neck']
      },
      {
        id: 'shoulders-lateral-raise',
        name: 'Lateral Raises',
        category: 'Shoulders',
        muscleGroups: ['Shoulders'],
        equipment: ['Dumbbells'],
        instructions: [
          'Stand holding dumbbells at sides',
          'Raise arms out to sides until parallel to floor',
          'Lower with control back to starting position',
          'Keep slight bend in elbows'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 4,
        description: 'An isolation exercise that targets the side deltoids.',
        tips: ['Use lighter weight', 'Control the movement', 'Don\'t swing'],
        variations: ['Front raises', 'Rear delt flyes', 'Arnold press'],
        safetyNotes: ['Start with light weight', 'Don\'t raise above shoulder height']
      },

      // ARM EXERCISES
      {
        id: 'arms-bicep-curl',
        name: 'Bicep Curls',
        category: 'Arms',
        muscleGroups: ['Biceps'],
        equipment: ['Dumbbells'],
        instructions: [
          'Stand holding dumbbells with arms at sides',
          'Curl weights up by flexing biceps',
          'Squeeze at the top',
          'Lower with control to starting position'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 3,
        description: 'A classic isolation exercise for building bicep strength and size.',
        tips: ['Keep elbows stationary', 'Control the negative', 'Full range of motion'],
        variations: ['Hammer curls', 'Preacher curls', 'Cable curls'],
        safetyNotes: ['Don\'t swing the weight', 'Use proper weight selection']
      },
      {
        id: 'arms-tricep-dips',
        name: 'Tricep Dips',
        category: 'Arms',
        muscleGroups: ['Triceps', 'Shoulders'],
        equipment: ['Bodyweight', 'Bench'],
        instructions: [
          'Sit on edge of bench with hands beside hips',
          'Slide forward and lower body by bending elbows',
          'Push back up to starting position',
          'Keep legs extended or bent for easier variation'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 6,
        description: 'A bodyweight exercise that effectively targets the triceps.',
        tips: ['Keep body close to bench', 'Don\'t go too low', 'Control the movement'],
        variations: ['Chair dips', 'Ring dips', 'Parallel bar dips'],
        safetyNotes: ['Don\'t go below 90 degrees at elbow', 'Stop if you feel shoulder pain']
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
          'Hold position engaging core muscles',
          'Breathe normally while maintaining position'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 5,
        description: 'An isometric exercise that builds core stability and strength.',
        tips: ['Keep hips level', 'Engage glutes', 'Don\'t hold breath'],
        variations: ['Side plank', 'Plank with leg lifts', 'Plank up-downs'],
        safetyNotes: ['Don\'t let hips sag', 'Stop if lower back hurts']
      },
      {
        id: 'core-crunches',
        name: 'Crunches',
        category: 'Core',
        muscleGroups: ['Abdominals'],
        equipment: ['Bodyweight'],
        instructions: [
          'Lie on back with knees bent',
          'Place hands behind head lightly',
          'Curl shoulders up toward knees',
          'Lower back down with control'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 4,
        description: 'A traditional abdominal exercise that targets the rectus abdominis.',
        tips: ['Don\'t pull on neck', 'Focus on quality over quantity', 'Exhale on the way up'],
        variations: ['Bicycle crunches', 'Reverse crunches', 'Russian twists'],
        safetyNotes: ['Keep lower back on ground', 'Don\'t strain neck']
      },

      // CARDIO EXERCISES
      {
        id: 'cardio-burpees',
        name: 'Burpees',
        category: 'Cardio',
        muscleGroups: ['Full Body'],
        equipment: ['Bodyweight'],
        instructions: [
          'Start standing, then squat down and place hands on ground',
          'Jump feet back into plank position',
          'Do a push-up (optional)',
          'Jump feet back to squat, then jump up with arms overhead'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 12,
        description: 'A high-intensity full-body exercise that combines strength and cardio.',
        tips: ['Maintain good form even when tired', 'Modify as needed', 'Land softly'],
        variations: ['Half burpees', 'Burpee box jumps', 'Burpee broad jumps'],
        safetyNotes: ['Land with bent knees', 'Don\'t sacrifice form for speed']
      },
      {
        id: 'cardio-jumping-jacks',
        name: 'Jumping Jacks',
        category: 'Cardio',
        muscleGroups: ['Full Body'],
        equipment: ['Bodyweight'],
        instructions: [
          'Start standing with feet together and arms at sides',
          'Jump feet apart while raising arms overhead',
          'Jump back to starting position',
          'Maintain steady rhythm'
        ],
        difficulty: 'beginner',
        caloriesPerMinute: 8,
        description: 'A classic cardio exercise that gets the heart rate up quickly.',
        tips: ['Stay light on feet', 'Keep core engaged', 'Breathe rhythmically'],
        variations: ['Star jumps', 'Half jacks', 'Cross jacks'],
        safetyNotes: ['Land softly', 'Stop if you feel joint pain']
      },
      {
        id: 'cardio-mountain-climbers',
        name: 'Mountain Climbers',
        category: 'Cardio',
        muscleGroups: ['Core', 'Shoulders', 'Legs'],
        equipment: ['Bodyweight'],
        instructions: [
          'Start in plank position',
          'Bring one knee toward chest',
          'Quickly switch legs, bringing other knee to chest',
          'Continue alternating in running motion'
        ],
        difficulty: 'intermediate',
        caloriesPerMinute: 10,
        description: 'A dynamic exercise that combines cardio with core strengthening.',
        tips: ['Keep hips level', 'Maintain plank position', 'Quick feet'],
        variations: ['Slow mountain climbers', 'Cross-body mountain climbers'],
        safetyNotes: ['Keep wrists under shoulders', 'Don\'t let hips pike up']
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
          'legs-squat', 'chest-push-up', 'back-pull-up', 'legs-deadlift',
          'shoulders-overhead-press', 'core-plank', 'cardio-burpees',
          'arms-bicep-curl', 'legs-lunges', 'chest-bench-press'
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