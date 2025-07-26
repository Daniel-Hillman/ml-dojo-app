# Design Document

## Overview

The workout modes feature will transform static drill content into dynamic, difficulty-adaptive experiences. The system will use AI to generate three distinct versions of each drill: Crawl (easiest), Walk (baseline), and Run (hardest). This design focuses on maintaining the existing UI while adding intelligent content adaptation and improved interactivity.

## Architecture

### Component Structure
```
DrillPage
├── WorkoutModeSelector (existing, enhanced)
├── DrillContentRenderer (enhanced)
│   ├── TheoryBlock (unchanged)
│   ├── CodeBlock (major changes)
│   │   ├── CodeDisplay (read-only preview)
│   │   └── InteractiveBlankInputs (editable fields)
│   └── MCQBlock (minor changes)
└── AIAssistant (unchanged)
```

### Data Flow
1. User selects workout mode → triggers `generateDynamicDrill` server action
2. Server action calls AI with mode-specific prompts
3. AI returns adapted drill content with modified blanks/questions
4. Client updates display and resets all user state
5. User interacts with new difficulty-adapted content

## Components and Interfaces

### Enhanced DrillPage Component

**State Management:**
```typescript
// Existing state
const [originalDrill, setOriginalDrill] = useState<Drill | null>(null);
const [displayDrill, setDisplayDrill] = useState<Drill | null>(null);
const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('Walk');
const [isGenerating, setIsGenerating] = useState(false);

// Enhanced state for better UX
const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
const [blankFeedback, setBlankFeedback] = useState<Record<string, 'correct' | 'incorrect' | 'pending'>>({});
```

**Mode Adaptation Logic:**
- Crawl: AI generates 2-3x more blanks, simpler vocabulary
- Walk: Original content (no AI processing needed)
- Run: AI consolidates blanks, removes hints, increases complexity

### AI Content Generation Service

**Server Action Enhancement:**
```typescript
export async function generateDynamicDrill(input: {
  drill: Drill;
  workoutMode: WorkoutMode;
}): Promise<{ drillContent: DrillContent[] }>;
```

**AI Prompting Strategy:**

**Crawl Mode Prompt:**
- "Break down complex expressions into smaller parts"
- "Add more granular blanks for step-by-step learning"
- "Simplify vocabulary and use more descriptive variable names"
- "Add intermediate steps that were previously combined"

**Run Mode Prompt:**
- "Combine multiple small blanks into larger conceptual blanks"
- "Remove scaffolding and hints"
- "Require users to write entire functions or expressions"
- "Increase the cognitive load by removing intermediate steps"

### Interactive Code Block Component

**Current Issue:** Code blocks are read-only CodeMirror instances
**Solution:** Hybrid approach with read-only display + separate input fields

```typescript
interface CodeBlockProps {
  content: DrillContent;
  contentIndex: number;
  userAnswers: Record<string, string>;
  onAnswerChange: (blankIndex: number, value: string) => void;
  feedback: Record<string, 'correct' | 'incorrect' | 'pending'>;
}
```

**Implementation:**
1. Parse code content to identify blank positions
2. Render read-only CodeMirror with user answers filled in
3. Provide separate input fields below for each blank
4. Update display in real-time as user types
5. Show immediate feedback with color coding

## Data Models

### Enhanced DrillContent Interface
```typescript
interface DrillContent {
  type: 'theory' | 'code' | 'mcq';
  value: string;
  
  // Code-specific fields
  language?: 'python';
  solution?: string[];
  blanks?: number;
  
  // MCQ-specific fields  
  choices?: string[];
  answer?: number;
  
  // New: Difficulty metadata
  difficulty_hints?: string[]; // For Crawl mode
  complexity_level?: 'simple' | 'moderate' | 'complex';
}
```

### Workout Mode State Management
```typescript
type WorkoutMode = 'Crawl' | 'Walk' | 'Run';

interface WorkoutModeState {
  currentMode: WorkoutMode;
  isGenerating: boolean;
  generationError: string | null;
  lastSuccessfulGeneration: Date | null;
}
```

## Error Handling

### AI Generation Failures
- **Timeout:** 30-second limit on AI generation
- **Parsing Errors:** Fallback to original content with user notification
- **Network Issues:** Retry logic with exponential backoff
- **Invalid Content:** Validation before applying changes

### User Experience During Failures
- Show loading spinner during generation
- Display error toast if generation fails
- Automatically fallback to original content
- Allow user to retry generation

### Content Validation
```typescript
function validateGeneratedContent(content: DrillContent[]): boolean {
  // Ensure all required fields are present
  // Validate solution arrays match blank counts
  // Check for reasonable content length
  // Verify MCQ answer indices are valid
}
```

## Testing Strategy

### Unit Tests
- `generateDynamicDrill` server action with mock AI responses
- Content validation functions
- Blank parsing and rendering logic
- User answer state management

### Integration Tests
- Complete workout mode switching workflow
- AI generation with real API calls (in test environment)
- Form submission with different difficulty levels
- Error handling scenarios

### User Acceptance Tests
- Verify Crawl mode creates easier content
- Verify Run mode creates harder content
- Test interactive code editing functionality
- Validate answer feedback system

## Performance Considerations

### AI Generation Optimization
- Cache generated content per drill/mode combination
- Implement request debouncing for rapid mode switches
- Use loading states to manage user expectations
- Consider pre-generating popular drill variations

### Client-Side Performance
- Minimize re-renders during mode switches
- Use React.memo for expensive components
- Debounce user input validation
- Optimize CodeMirror re-initialization

### Memory Management
- Clear previous drill content when switching modes
- Limit cached variations to prevent memory leaks
- Implement cleanup on component unmount

## Security Considerations

### AI Input Validation
- Sanitize drill content before sending to AI
- Validate AI responses before applying to UI
- Implement rate limiting on AI generation requests
- Log AI interactions for debugging and monitoring

### User Input Handling
- Sanitize user answers before validation
- Prevent code injection in blank fields
- Validate solution arrays server-side
- Implement CSRF protection on server actions