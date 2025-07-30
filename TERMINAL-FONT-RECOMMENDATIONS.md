# Terminal/Code Font Recommendations for OmniCode

## 🎯 Current Status
✅ **Fixed**: Removed robot icon from sidebar OmniCode title  
✅ **Fixed**: Applied Aurora Pro font and green-400 color to match main page  
✅ **Updated**: Sidebar title now uses `font-aurora text-green-400 tracking-wider`

## 🔤 Recommended Font Stack for Terminal/Code Aesthetic

For a professional terminal/code application like OmniCode, I recommend **3-4 carefully chosen fonts**:

### 1. **Primary Brand Font** (Already Implemented)
**Aurora Pro** - For main titles and branding
- **Usage**: Main "OmniCode" titles, hero text
- **Current Classes**: `font-aurora text-green-400 tracking-wider`
- **Status**: ✅ Already implemented

### 2. **Monospace/Code Font** (Recommended)
**JetBrains Mono** or **Fira Code** - For code blocks and terminal text
- **Usage**: Code snippets, terminal output, drill content
- **Characteristics**: 
  - Excellent readability
  - Programming ligatures support
  - Clear distinction between similar characters (0/O, 1/l/I)
- **Suggested Classes**: `font-mono` (update to use JetBrains Mono)

### 3. **UI/Interface Font** (Recommended)
**Inter** or **Roboto** - For general UI text
- **Usage**: Navigation, buttons, descriptions, body text
- **Characteristics**:
  - High readability at all sizes
  - Modern, clean appearance
  - Excellent for interfaces
- **Suggested Classes**: `font-sans` (update to use Inter)

### 4. **Accent/Special Font** (Optional)
**Orbitron** or **Exo 2** - For special UI elements
- **Usage**: Stats, counters, special callouts
- **Characteristics**: Futuristic, tech-inspired
- **Suggested Classes**: `font-accent`

## 🎨 Font Implementation Strategy

### Phase 1: Core Fonts (Immediate)
```css
/* Add to globals.css */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

```javascript
// Add to tailwind.config.ts
fontFamily: {
  'aurora': ['Aurora Pro', 'sans-serif'], // Existing
  'mono': ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
  'sans': ['Inter', 'system-ui', 'sans-serif'],
}
```

### Phase 2: Accent Font (Optional)
```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');
```

```javascript
// Add to tailwind.config.ts
fontFamily: {
  'accent': ['Orbitron', 'sans-serif'],
}
```

## 🎯 Font Usage Guidelines

### 1. **Brand Elements**
```tsx
// Main titles, hero sections
<h1 className="font-aurora text-green-400 tracking-wider">OmniCode</h1>
```

### 2. **Code/Terminal Elements**
```tsx
// Code blocks, terminal output
<pre className="font-mono text-green-300 bg-black/80">
  <code>def hello_world():</code>
</pre>

// Terminal-style prompts
<span className="font-mono text-green-400">user@omnicode:~$</span>
```

### 3. **UI Elements**
```tsx
// Navigation, buttons, general text
<nav className="font-sans text-gray-300">
  <button className="font-sans font-medium">Practice Drills</button>
</nav>
```

### 4. **Special Elements** (if using accent font)
```tsx
// Stats, counters, special callouts
<div className="font-accent text-cyan-400 text-2xl">42</div>
```

## 🎨 Color Palette Integration

### Terminal Green Theme
- **Primary**: `text-green-400` (bright green)
- **Secondary**: `text-green-300` (medium green)  
- **Muted**: `text-green-500/70` (dimmed green)
- **Background**: `bg-black/80` or `bg-gray-900`

### Accent Colors
- **Cyan**: `text-cyan-400` (for special elements)
- **Yellow**: `text-yellow-400` (for warnings/highlights)
- **Red**: `text-red-400` (for errors)
- **Blue**: `text-blue-400` (for info)

## 📱 Responsive Considerations

### Font Sizes by Screen Size
```css
/* Mobile */
.title-mobile { @apply text-2xl font-aurora; }
.code-mobile { @apply text-sm font-mono; }
.ui-mobile { @apply text-base font-sans; }

/* Desktop */
.title-desktop { @apply text-4xl font-aurora; }
.code-desktop { @apply text-base font-mono; }
.ui-desktop { @apply text-lg font-sans; }
```

## 🚀 Implementation Priority

### High Priority (Implement First)
1. ✅ **Aurora Pro** - Already done for branding
2. 🔄 **JetBrains Mono** - For all code elements
3. 🔄 **Inter** - For UI text

### Medium Priority
4. **Orbitron** - For accent elements (optional)

### Low Priority
5. Additional weights/variants as needed

## 📋 Component Updates Needed

### 1. Code Components
```tsx
// Update all code-related components
<CodeMirror 
  className="font-mono"
  // ... other props
/>
```

### 2. Terminal Components
```tsx
// FaultyTerminal, terminal prompts
<div className="font-mono text-green-400 bg-black">
  <span className="text-green-500">user@omnicode:~$</span>
  <span className="text-green-300">npm run dev</span>
</div>
```

### 3. Navigation/UI
```tsx
// Sidebar, buttons, general UI
<nav className="font-sans">
  <Link className="font-sans font-medium text-gray-300 hover:text-green-400">
    Practice Drills
  </Link>
</nav>
```

## 🎯 Why These 3-4 Fonts?

### **3 Fonts is Optimal Because:**
- **Brand Identity**: Aurora Pro for distinctive branding
- **Functionality**: JetBrains Mono for code readability  
- **Usability**: Inter for clean UI text
- **Performance**: Minimal font loading overhead
- **Consistency**: Clear hierarchy and purpose

### **4th Font (Optional) Adds:**
- **Personality**: Orbitron for futuristic tech feel
- **Hierarchy**: Additional visual distinction
- **Flexibility**: More design options

## 📊 Performance Impact

### Font Loading Strategy
```css
/* Preload critical fonts */
<link rel="preload" href="/fonts/aurora-pro.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" as="style">
```

### Bundle Size Impact
- **Aurora Pro**: ~50KB (already loaded)
- **JetBrains Mono**: ~30KB (Google Fonts)
- **Inter**: ~25KB (Google Fonts)
- **Orbitron**: ~20KB (optional)
- **Total**: ~125KB (very reasonable)

## 🎨 Visual Hierarchy Example

```tsx
// Complete example showing font hierarchy
<div className="terminal-app">
  {/* Brand */}
  <h1 className="font-aurora text-green-400 text-4xl tracking-wider">
    OmniCode
  </h1>
  
  {/* Navigation */}
  <nav className="font-sans text-gray-300">
    <Link className="font-medium hover:text-green-400">Practice Drills</Link>
  </nav>
  
  {/* Code Block */}
  <pre className="font-mono text-green-300 bg-black/90 p-4 rounded">
    <code>def fibonacci(n):
    return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)</code>
  </pre>
  
  {/* Stats (with accent font) */}
  <div className="font-accent text-cyan-400 text-2xl">
    42 drills completed
  </div>
  
  {/* Body text */}
  <p className="font-sans text-gray-300">
    Master coding concepts through interactive practice...
  </p>
</div>
```

## 🚀 Next Steps

1. **Immediate**: Add JetBrains Mono and Inter fonts
2. **Update**: Code components to use `font-mono`
3. **Update**: UI components to use `font-sans`
4. **Test**: Ensure consistent appearance across all pages
5. **Optional**: Add Orbitron for accent elements

This font strategy will give OmniCode a professional, cohesive terminal/code aesthetic while maintaining excellent readability and performance! 🎯