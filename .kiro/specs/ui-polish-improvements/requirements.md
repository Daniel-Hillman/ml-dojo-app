# UI Polish Improvements - Requirements Document

## Introduction

This specification addresses three key UI improvements to enhance the visual consistency and polish of the OmniCode application:

1. **Playground Feature Cards Background**: Update the white background cards in the playground to match the app's dark theme
2. **Remove "New" Badge**: Remove the "New" badge from the Code Playground navigation since the app is not yet released
3. **Navigation Highlight Color**: Change the selected page highlight color from white to green to match the OmniCode brand

## Requirements

### Requirement 1: Playground Feature Cards Styling

**User Story:** As a user, I want the playground feature cards to have consistent styling with the rest of the app, so that the interface feels cohesive and professional.

#### Acceptance Criteria
1. WHEN I visit the playground page THEN the feature cards (Live Execution, Code Templates, Data Analysis, Visualizations) SHALL have dark theme backgrounds instead of white
2. WHEN I view the feature cards THEN they SHALL maintain proper contrast and readability
3. WHEN I interact with the feature cards THEN they SHALL have appropriate hover states that match the app theme

### Requirement 2: Remove "New" Badge from Navigation

**User Story:** As a user, I want the navigation to be clean and not show "New" badges for features, so that the interface doesn't appear cluttered with unnecessary labels.

#### Acceptance Criteria
1. WHEN I view the sidebar navigation THEN the Code Playground link SHALL NOT display a "New" badge
2. WHEN I view the mobile navigation THEN the Code Playground link SHALL NOT display a "New" indicator
3. WHEN I navigate the app THEN all navigation elements SHALL have consistent styling without promotional badges

### Requirement 3: Green Navigation Highlight Color

**User Story:** As a user, I want the selected page highlight to use the brand's green color, so that the navigation feels consistent with the OmniCode brand identity.

#### Acceptance Criteria
1. WHEN I am on any page THEN the active navigation item SHALL be highlighted with green color matching the OmniCode logo
2. WHEN I hover over navigation items THEN they SHALL use green-based hover states
3. WHEN I view the navigation THEN the highlight color SHALL be visually distinct but not jarring like the current white highlight