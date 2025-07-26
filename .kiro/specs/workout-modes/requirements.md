# Requirements Document

## Introduction

The ML Dojo application currently has workout mode buttons (Crawl, Walk, Run) that don't actually modify the drill difficulty. All modes display the same content with the full code. Users need different difficulty levels to provide appropriate challenge and learning progression, with Crawl being the easiest (more guidance and less blanks to fill in), Walk being standard, and Run being the most challenging.

## Requirements

### Requirement 1

**User Story:** As a user, I want to select different workout modes that provide varying levels of difficulty, so that I can choose the appropriate challenge level for my current skill level.

#### Acceptance Criteria

1. WHEN I select "Crawl" mode THEN the drill SHALL display with many small, simple blanks and easier questions
2. WHEN I select "Walk" mode THEN the drill SHALL display with the original difficulty level (baseline)
3. WHEN I select "Run" mode THEN the drill SHALL display with fewer but larger blanks and more challenging questions
4. WHEN I switch between modes THEN the drill content SHALL update dynamically to reflect the new difficulty
5. there needs to be a code check after the user confirms that they are done filling in the blanks  
6. if the code check is successful, the user can move on to the next drill  
7. if the code check is unsuccessful, the user can try again   
8. when the user generates code using ai, or inputs it themselves, the blanks must auitomatically be generated either by a pre defined hardcoded suystem or the ai must return it in those formats (perhaps even 3 versions of the code representing the different difficulties)

### Requirement 2

**User Story:** As a user, I want the code blocks in drills to be interactive and editable, so that I can fill in the blanks and practice coding. I must then be able to submit my code to check if it is correct. 

#### Acceptance Criteria

1. WHEN I view a code drill THEN the blank areas SHALL be editable input fields
2. WHEN I type in a blank field THEN my input SHALL be visible and properly formatted
3. WHEN I complete a blank correctly THEN I SHALL receive immediate visual feedback
4. WHEN I complete a blank incorrectly THEN I SHALL see an error indicator

### Requirement 3

**User Story:** As a user, I want the AI to generate different versions of the same drill content based on the selected workout mode, so that each mode provides a genuinely different learning experience.

#### Acceptance Criteria

1. WHEN I select Crawl mode THEN the program SHALL generate more granular blanks (single words, operators, simple expressions)
2. WHEN I select Walk mode THEN the program SHALL use the original drill content without modification
3. WHEN I select Run mode THEN the program SHALL generate fewer but more comprehensive blanks (entire functions, complex expressions)
4. WHEN the AI generates mode-specific content THEN it SHALL maintain the same learning objectives as the original drill

### Requirement 4

**User Story:** As a user, I want my progress and answers to reset when I change workout modes, so that I can practice the same concept at different difficulty levels.

#### Acceptance Criteria

1. WHEN I switch workout modes THEN all my previous answers SHALL be cleared
2. WHEN I switch workout modes THEN all feedback indicators SHALL be reset
3. WHEN I switch workout modes THEN the validation state SHALL be reset to allow resubmission
4. WHEN the mode changes THEN I SHALL see a loading indicator while the new content is generated

### Requirement 5

**User Story:** As a user, I want the workout mode selection to be persistent during my drill session, so that I don't accidentally lose my selected difficulty level.

#### Acceptance Criteria

1. WHEN I select a workout mode THEN it SHALL remain selected until I explicitly change it
2. WHEN the drill content is loading THEN the mode buttons SHALL be disabled to prevent conflicts
3. WHEN mode generation fails THEN the system SHALL fallback to the original content and show an error message
4. WHEN I refresh the page THEN the workout mode SHALL reset to the default "Walk" mode