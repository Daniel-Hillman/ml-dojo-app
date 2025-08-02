# Live Code Editor Improvements Plan

## 🎯 Issues Identified

### 1. Syntax Highlighting Missing in Editable Mode
- **Problem**: LiveCodeBlock uses plain textarea when `allowEdit={true}`, losing syntax highlighting
- **Impact**: Poor developer experience, harder to read/write code
- **Solution**: Implement CodeMirror or Monaco Editor for syntax-highlighted editing

### 2. Template System Not Accessible
- **Problem**: Comprehensive template system exists but not easily accessible from main UI
- **Impact**: Users don't know about available templates, reduced productivity
- **Solution**: Add template integration to main live code editor

### 3. Missing UI Access to Implemented Features
- **Problem**: Many powerful features exist but aren't accessible through main UI
- **Impact**: Users can't access advanced functionality
- **Solution**: Create proper navigation and integration

## 🚀 Implementation Plan

### Phase 1: Fix Syntax Highlighting (Priority: HIGH)
1. **Replace textarea with CodeMirror 6**
   - Install @codemirror/state, @codemirror/view, @codemirror/lang-*
   - Create syntax-highlighted editor component
   - Maintain all existing functionality (shortcuts, etc.)

2. **Language-specific highlighting**
   - JavaScript/TypeScript
   - HTML/CSS
   - Python
   - SQL
   - JSON/YAML/Markdown

### Phase 2: Template Integration (Priority: HIGH)
1. **Add template button to LiveCodeBlock**
   - Quick access to blank templates
   - "New [Language]" dropdown with blank templates
   - Integration with existing TemplateBrowser

2. **Blank template system**
   - Minimal starter code for each language
   - Quick language switching with appropriate blanks
   - Smart defaults based on language

### Phase 3: UI Access Improvements (Priority: MEDIUM)
1. **Navigation improvements**
   - Add "Code Playground" to main navigation
   - Better organization of live code features
   - Remove test pages from production

2. **Feature integration**
   - Python IDE components in main interface
   - Template browser as modal/sidebar
   - Advanced execution options

## 📋 Detailed Tasks

### Task 1: Implement CodeMirror Syntax Highlighting
- [ ] Install CodeMirror 6 dependencies
- [ ] Create SyntaxHighlightedEditor component
- [ ] Replace textarea in LiveCodeBlock
- [ ] Test all languages and features
- [ ] Ensure keyboard shortcuts still work

### Task 2: Create Blank Template System
- [ ] Define minimal blank templates for each language
- [ ] Add template dropdown to LiveCodeBlock
- [ ] Implement quick language switching
- [ ] Add "Browse Templates" option

### Task 3: Improve Template Access
- [ ] Add template button to main editor
- [ ] Create template modal/sidebar
- [ ] Integrate with existing TemplateBrowser
- [ ] Add template categories and search

### Task 4: Clean Up Navigation
- [ ] Remove test pages from production
- [ ] Add proper "Code Playground" page
- [ ] Improve main navigation structure
- [ ] Add feature discovery

## 🎨 UI/UX Improvements

### Template Access Options:
1. **Dropdown in language selector**: "JavaScript" → "Blank JavaScript", "React Component", etc.
2. **Template button**: Dedicated button that opens template browser
3. **Quick templates**: Common templates as quick-access buttons
4. **Smart suggestions**: Suggest templates based on current code

### Syntax Highlighting:
- Use CodeMirror 6 for modern, performant editing
- Language-specific themes and features
- Auto-completion and error highlighting
- Vim/Emacs keybindings support

## 🔧 Technical Implementation

### CodeMirror Integration:
```typescript
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
// ... other languages
```

### Blank Templates:
```typescript
const BLANK_TEMPLATES = {
  javascript: '// JavaScript code\\nconsole.log("Hello, World!");',
  python: '# Python code\\nprint("Hello, World!")',
  html: '<!DOCTYPE html>\\n<html>\\n<head>\\n    <title>Page Title</title>\\n</head>\\n<body>\\n    <h1>Hello, World!</h1>\\n</body>\\n</html>',
  // ... other languages
}
```

## 📊 Success Metrics
- [ ] Syntax highlighting works in all supported languages
- [ ] Template access is intuitive and discoverable
- [ ] Users can quickly start with blank templates
- [ ] All existing functionality is preserved
- [ ] Performance is maintained or improved

## 🎯 Next Steps
1. Start with syntax highlighting fix (highest impact)
2. Add blank template system
3. Improve template discoverability
4. Clean up navigation and test pages
5. Test with real users and iterate