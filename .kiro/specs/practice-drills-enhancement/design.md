# Design Document

## Overview

The Practice Drills Enhancement will transform the current practice drills page from showing all drills globally to a personalized practice hub that displays both user-created drills and saved community drills in organized sections. The design leverages the existing save functionality from the community page and creates a unified practice experience.

## Architecture

### Current State Analysis

**Current Issues:**
- Practice drills page shows ALL drills globally without user filtering
- Saved community drills (stored in `users/{userId}/saved_drills`) are not displayed
- No distinction between personal and community content
- Broken user experience between community save action and practice page

**Existing Infrastructure:**
- Community save functionality already implemented
- Saved drills stored in `users/{userId}/saved_drills` subcollection
- Drill data structure supports both personal and community drills
- Authentication system in place

### Proposed Architecture

```
Practice Drills Page
├── Header Section
│   ├── Title & Description
│   ├── Navigation Buttons (Browse Community, Create Drill)
│   └── Stats Cards (My Drills, Saved, Total)
├── My Drills Section
│   ├── User-created drills from 'drills' collection
│   ├── Filtered by userId
│   └── Empty state with "Create Drill" CTA
└── Saved from Community Section
    ├── Community drills from 'users/{userId}/saved_drills'
    ├── Includes original drill data + metadata
    └── Empty state with "Browse Community" CTA
```

## Components and Interfaces

### Data Models

#### Enhanced Drill Type
```typescript
type EnhancedDrill = Drill & {
  source: 'personal' | 'community';
  originalAuthor?: string;
  originalAuthorAvatar?: string;
  savedAt?: Date;
  communityMetrics?: {
    likes: number;
    views: number;
    saves: number;
  };
};
```

#### Saved Drill Document Structure
```typescript
interface SavedDrillDocument {
  drillId: string;
  savedAt: Timestamp;
  originalDrillData: {
    title: string;
    concept: string;
    difficulty: string;
    description: string;
    language: string;
    content: DrillContent[];
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: Timestamp;
    likes: number;
    views: number;
    saves: number;
  };
}
```

### Component Architecture

#### 1. Enhanced DrillsPage Component
- **Responsibility**: Main page orchestration and data loading
- **State Management**: 
  - `personalDrills: Drill[]` - User's created drills
  - `savedDrills: EnhancedDrill[]` - Community drills user saved
  - `loading: { personal: boolean, saved: boolean }`
- **Data Loading**: Parallel loading of both drill types

#### 2. DrillSection Component
```typescript
interface DrillSectionProps {
  title: string;
  drills: EnhancedDrill[];
  loading: boolean;
  emptyState: {
    icon: React.ComponentType;
    title: string;
    description: string;
    actionButton: {
      text: string;
      href: string;
    };
  };
}
```

#### 3. Enhanced DrillCard Component
```typescript
interface DrillCardProps {
  drill: EnhancedDrill;
  onRemoveSaved?: (drillId: string) => void;
}
```

**Features:**
- Source indicator badges (Personal vs Community)
- Author information for community drills
- Remove from saved functionality for community drills
- Consistent practice button behavior

#### 4. StatsCards Component
```typescript
interface StatsCardsProps {
  personalCount: number;
  savedCount: number;
  totalCount: number;
}
```

### Data Flow

#### Loading Personal Drills
```typescript
const loadPersonalDrills = async () => {
  const q = query(
    collection(db, 'drills'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );
  // Transform to EnhancedDrill with source: 'personal'
};
```

#### Loading Saved Community Drills
```typescript
const loadSavedDrills = async () => {
  const q = query(
    collection(db, `users/${user.uid}/saved_drills`),
    orderBy('savedAt', 'desc')
  );
  // Transform to EnhancedDrill with source: 'community'
  // Include original author and community metrics
};
```

#### Remove Saved Drill
```typescript
const removeSavedDrill = async (drillId: string) => {
  // Remove from users/{userId}/saved_drills
  // Update community_drills savedBy array
  // Update local state
  // Show confirmation toast
};
```

## Data Models

### Firestore Collections

#### Existing Collections (No Changes)
- `drills` - User-created drills
- `community_drills` - Public community drills
- `users/{userId}/saved_drills` - User's saved community drills

#### Query Patterns

**Personal Drills Query:**
```typescript
query(
  collection(db, 'drills'),
  where('userId', '==', user.uid),
  orderBy('createdAt', 'desc')
)
```

**Saved Drills Query:**
```typescript
query(
  collection(db, `users/${user.uid}/saved_drills`),
  orderBy('savedAt', 'desc')
)
```

### State Management

#### Page-Level State
```typescript
interface DrillsPageState {
  personalDrills: Drill[];
  savedDrills: EnhancedDrill[];
  loading: {
    personal: boolean;
    saved: boolean;
  };
  error: {
    personal: string | null;
    saved: string | null;
  };
}
```

## Error Handling

### Loading Errors
- **Personal Drills Failure**: Show error message in personal section, allow saved drills to load
- **Saved Drills Failure**: Show error message in saved section, allow personal drills to load
- **Complete Failure**: Show global error state with retry option

### Remove Saved Drill Errors
- **Network Error**: Show toast with retry option
- **Permission Error**: Show appropriate error message
- **Optimistic Updates**: Revert UI changes on failure

### Empty States
- **No Personal Drills**: Encourage drill creation with prominent CTA
- **No Saved Drills**: Encourage community exploration with browse button
- **No Drills at All**: Show both options with clear guidance

## Testing Strategy

### Unit Tests

#### Data Loading Functions
```typescript
describe('loadPersonalDrills', () => {
  it('should load user drills filtered by userId');
  it('should handle empty results gracefully');
  it('should handle Firestore errors');
});

describe('loadSavedDrills', () => {
  it('should load saved drills with original data');
  it('should transform data to EnhancedDrill format');
  it('should handle missing original drill data');
});
```

#### Component Tests
```typescript
describe('DrillCard', () => {
  it('should show personal drill badge for user drills');
  it('should show community badge with author for saved drills');
  it('should handle remove saved drill action');
});

describe('DrillSection', () => {
  it('should render drill cards correctly');
  it('should show appropriate empty state');
  it('should handle loading states');
});
```

### Integration Tests

#### End-to-End User Flows
1. **Save from Community to Practice Flow**
   - Navigate to community page
   - Save a drill
   - Navigate to practice page
   - Verify drill appears in saved section

2. **Remove Saved Drill Flow**
   - Start with saved drill in practice page
   - Remove drill using card action
   - Verify drill disappears from practice page
   - Verify drill can be saved again from community

3. **Create Personal Drill Flow**
   - Create new drill
   - Navigate to practice page
   - Verify drill appears in personal section

### Performance Tests
- **Parallel Loading**: Verify personal and saved drills load concurrently
- **Large Collections**: Test with users who have many saved drills
- **Network Conditions**: Test loading behavior under poor connectivity

## Implementation Phases

### Phase 1: Core Data Loading
- Implement parallel loading of personal and saved drills
- Create enhanced drill type and transformation functions
- Add basic error handling and loading states

### Phase 2: UI Components
- Create DrillSection component with empty states
- Enhance DrillCard with source indicators
- Add StatsCards component

### Phase 3: Saved Drill Management
- Implement remove saved drill functionality
- Add confirmation dialogs and toast notifications
- Handle optimistic updates and error recovery

### Phase 4: Navigation and Polish
- Add navigation buttons between practice and community
- Implement responsive design improvements
- Add accessibility features and keyboard navigation

## Security Considerations

### Data Access
- **Personal Drills**: Already secured by userId filtering
- **Saved Drills**: Secured by Firestore security rules for user subcollections
- **Community Drill Data**: Read-only access to original drill data

### User Actions
- **Remove Saved**: Only allow users to remove their own saved drills
- **Practice Access**: Maintain existing drill access patterns
- **Data Validation**: Validate drill IDs and user permissions

## Performance Optimizations

### Loading Strategy
- **Parallel Queries**: Load personal and saved drills simultaneously
- **Pagination**: Implement pagination for users with many drills
- **Caching**: Consider client-side caching for frequently accessed drills

### UI Optimizations
- **Skeleton Loading**: Show skeleton cards while loading
- **Optimistic Updates**: Immediate UI feedback for remove actions
- **Lazy Loading**: Load drill content only when needed

## Accessibility

### Keyboard Navigation
- Tab navigation through drill cards and actions
- Enter/Space activation for buttons
- Escape key for closing dialogs

### Screen Reader Support
- Proper ARIA labels for drill sections
- Descriptive text for drill source indicators
- Status announcements for loading and error states

### Visual Accessibility
- High contrast mode support
- Scalable text and UI elements
- Clear visual hierarchy and spacing

## Migration Strategy

### Backward Compatibility
- Existing drill functionality remains unchanged
- Community save functionality already in place
- No database schema changes required

### Rollout Plan
1. **Feature Flag**: Deploy behind feature flag for testing
2. **Gradual Rollout**: Enable for subset of users initially
3. **Full Deployment**: Roll out to all users after validation
4. **Monitoring**: Track usage metrics and error rates

This design provides a comprehensive solution that addresses all requirements while leveraging existing infrastructure and maintaining system reliability.