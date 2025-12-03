# Copilot Instructions for Twext

## Project Overview
Twext is a web-based text alignment tool that aligns contexts between chunks of text. It's "twin text" that allows:
- Meaning between the lines
- Alignment by chunk, word, or phrase
- Support for any language
- Easy editing and realignment
- Toggling between text views

## Technology Stack
- **Frontend**: HTML5, CSS3, vanilla JavaScript
- **Libraries**: 
  - jQuery 1.11.3
  - Firebase (legacy v0 SDK for backend data storage)
  - Classy.js (for class generation)
  - Hyphenator.js (for syllabification)
- **Backend**: PHP (file operations, Bing API access)
- **Architecture**: Client-side single-page application with Firebase real-time database

## Project Structure
```
/
├── index.html              # Main HTML entry point
├── js/                     # JavaScript modules
│   ├── main.js            # Application initialization
│   ├── controller.js      # Main controller class
│   ├── utils.js           # Utility functions
│   ├── backend/           # Firebase integration
│   ├── twext/             # Core twext functionality
│   ├── languageMenu/      # Language selection
│   ├── lists/             # List handlers (URL, audio, thumbs)
│   ├── syllabification/   # Text syllabification
│   ├── spanAlign/         # Span alignment
│   ├── recorder/          # Audio recording
│   ├── play/              # Player and game modules
│   ├── tapTimer/          # Tap timer functionality
│   └── resources/         # Video, audio, image classes
├── css/                    # Stylesheets
│   ├── twext.css
│   ├── gif.css
│   ├── player.css
│   └── game.css
└── php/                    # Server-side scripts
    ├── checkFile.php
    ├── deleteFile.php
    └── uploadBlob.php
```

## Code Style Conventions

### JavaScript
- Use ES5 syntax (for compatibility with legacy browsers)
- Use `var` for variable declarations (no `let` or `const`)
- Use Classy.js `Class.$extend()` pattern for class definitions
- Class methods follow this pattern:
  ```javascript
  ClassName = Class.$extend({
    __init__: function() {
      // Constructor
    },
    methodName: function() {
      // Method implementation
    }
  });
  ```
- Use JSDoc-style comments for functions and classes:
  ```javascript
  /**
  * Function description.
  */
  ```
- Indent with 2 spaces
- Use semicolons consistently
- Use single quotes for strings when possible
- Variable naming: camelCase for variables and functions
- Global objects are declared at the top of `main.js`

### HTML
- Use semantic HTML5 elements
- IDs use kebab-case (e.g., `data-show`, `language-menu-container`)
- Maintain clear structure with comments marking sections

### CSS
- Class names use kebab-case
- Keep stylesheets modular (separate files for different features)
- Use monospaceFont class for text areas

## Key Functionality Areas

### Core Components
1. **TwextArea**: Main contenteditable text area for text input/editing
2. **Controller**: Central orchestrator for all components
3. **Player**: Media playback functionality
4. **ToggleHandler**: Handles toggling between text modes
5. **FirebaseHandler**: Backend data persistence
6. **LanguageMenu**: Multi-language support

### Keyboard Shortcuts
The application uses function keys extensively:
- F1: Toggle URL list
- F2: Toggle play mode
- F4: Toggle timing mode
- F7: Toggle favorites
- F8: Toggle language menu
- F9: Toggle big view
- F10: Toggle picture mode

## Important Boundaries and Constraints

### Do Not:
- **Never modify** the jQuery, Firebase, or third-party library files in `js/lib/`
- **Never commit** sensitive data or API keys (note: `php/BingAccessToken` should be .gitignored if it contains credentials)
- **Never break** the global variable structure in `main.js` (controller, firebaseHandler, twextArea, player, syllabifier)
- **Never remove** keyboard shortcut functionality without understanding the full context
- **Never change** the class generation pattern using Classy.js
- **Never modify** the Firebase SDK version (legacy v0) without full migration plan

### Always:
- Test changes in a browser (this is a client-side application)
- Preserve the existing module structure
- Maintain backward compatibility with existing Firebase data
- Keep the UI responsive and accessible
- Document any new keyboard shortcuts or UI interactions

## Testing and Development

### Manual Testing
Since this is primarily a client-side application with no build system:
1. Open `index.html` in a web browser
2. Test the specific feature you modified
3. Verify keyboard shortcuts work as expected
4. Test with different text inputs and languages
5. Check browser console for errors

### No Build System
- No npm, webpack, or build tools are used
- All JavaScript is loaded directly via `<script>` tags
- Changes are immediately visible on page reload
- No transpilation or bundling required

## Common Tasks

### Adding a New Feature
1. Create a new module file in the appropriate `js/` subdirectory
2. Add `<script>` tag to `index.html` in the correct dependency order
3. If UI is needed, add to `index.html` and create corresponding CSS
4. Update Controller class if the feature needs to interact with other modules
5. Add event handlers in `main.js` `attachEvents()` if needed

### Modifying Styles
1. Locate the appropriate CSS file (twext.css, gif.css, player.css, game.css)
2. Make minimal changes to existing rules
3. Test across different view modes (normal, gif, big view)

### Working with Firebase
1. All Firebase interactions go through `firebaseHandler` object
2. Firebase refs are defined in `js/backend/refs.js`
3. Use existing patterns for data reads/writes

## Security Considerations
- Sanitize all user input before displaying (XSS prevention)
- The application loads external resources (Firebase, jQuery from CDN)
- PHP backend scripts should validate file operations
- Be cautious with contenteditable elements and clipboard data

## Additional Context
- This project uses an older technology stack but is actively maintained
- The focus is on text alignment and language learning
- The application is designed to work offline once loaded (with Firebase for data sync)
- Media support includes video, audio, and images
