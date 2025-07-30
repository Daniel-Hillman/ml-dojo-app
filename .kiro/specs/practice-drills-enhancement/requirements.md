# Requirements Document

## Introduction

The current Practice Drills page shows all drills globally without distinguishing between user-created drills and community drills that users have saved. Users need a clear separation between their personal drills and community drills they've saved for practice. The community page has "Save" functionality, but saved drills don't appear in the practice page, creating a broken user experience.

## Requirements

### Requirement 1

**User Story:** As a user, I want to see my personal drills and saved community drills organized separately on the practice page, so that I can easily distinguish between drills I created and drills I saved from the community.

#### Acceptance Criteria

1. WHEN I visit the practice drills page THEN I SHALL see two distinct sections: "My Drills" and "Saved from Community"
2. WHEN I view "My Drills" section THEN it SHALL only show drills that I created myself
3. WHEN I view "Saved from Community" section THEN it SHALL only show community drills that I have saved
4. WHEN I have no personal drills THEN the "My Drills" section SHALL show an empty state with a "Create Drill" button
5. WHEN I have no saved community drills THEN the "Saved from Community" section SHALL show an empty state with a "Browse Community" button

### Requirement 2

**User Story:** As a user, I want the "Save" button on community drills to actually add drills to my practice page, so that I can easily access saved drills for practice later.

#### Acceptance Criteria

1. WHEN I click "Save" on a community drill THEN the drill SHALL be added to my saved drills collection
2. WHEN I save a community drill THEN it SHALL immediately appear in the "Saved from Community" section of my practice page
3. WHEN I click "Save" on an already saved drill THEN it SHALL be removed from my saved drills (toggle functionality)
4. WHEN I save a drill THEN I SHALL see a toast notification confirming the action
5. WHEN I unsave a drill THEN it SHALL be removed from the "Saved from Community" section

### Requirement 3

**User Story:** As a user, I want to be able to manage my saved community drills directly from the practice page, so that I can remove drills I no longer want to practice.

#### Acceptance Criteria

1. WHEN I view a saved community drill card THEN I SHALL see an "Remove from Saved" option
2. WHEN I click "Remove from Saved" THEN the drill SHALL be removed from my saved drills collection
3. WHEN I remove a saved drill THEN it SHALL disappear from the "Saved from Community" section
4. WHEN I remove a saved drill THEN I SHALL see a confirmation toast
5. WHEN I view saved community drill cards THEN they SHALL show the original author information

### Requirement 4

**User Story:** As a user, I want to easily navigate between my practice drills and the community to discover new content, so that I can continuously expand my learning materials.

#### Acceptance Criteria

1. WHEN I am on the practice drills page THEN I SHALL see a "Browse Community" button in the header
2. WHEN I click "Browse Community" THEN I SHALL navigate to the community drills page
3. WHEN I am on the community page THEN I SHALL see a "My Practice" button to return to my practice drills
4. WHEN I view the practice page THEN I SHALL see counters showing how many personal and saved drills I have
5. WHEN the practice page loads THEN both sections SHALL load efficiently without blocking each other

### Requirement 5

**User Story:** As a user, I want saved community drills to maintain their original metadata and functionality, so that I can see who created them and access the same features as in the community page.

#### Acceptance Criteria

1. WHEN I view a saved community drill THEN I SHALL see the original author's name and avatar
2. WHEN I view a saved community drill THEN I SHALL see the original creation date
3. WHEN I view a saved community drill THEN I SHALL see the like count and other community metrics
4. WHEN I practice a saved community drill THEN it SHALL function identically to practicing it from the community page
5. WHEN I view saved drill cards THEN they SHALL be visually distinct from personal drill cards (e.g., with a "Community" badge)