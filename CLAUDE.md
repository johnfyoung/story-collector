# Story Collector - Project Context

A React-based story/world-building application that helps writers organize characters, locations, species, and plot lines with rich attribute systems and cloud sync.

## Technology Stack

- **Framework**: React 19.1.1 with TypeScript (~5.8.3)
- **Build Tool**: Vite 7.1.6
- **Routing**: React Router DOM 6.28.0
- **Backend**: Appwrite 14.0.0 (BaaS - authentication, database, storage, real-time)
- **Styling**: CSS-in-JS with CSS variables, light/dark theme support
- **Media**: Cloudinary (optional, for image uploads)

## Architecture Overview

### State Management
- **Context API** (`StoriesProvider`) for global state
- React hooks (`useState`, `useEffect`) for local state
- No Redux or external state libraries

### Storage Strategy (Hybrid)
```
┌─────────────────┐
│  React State    │  ← In-memory, fast access
│  (stories[])    │
└────────┬────────┘
         │
         ├──→ localStorage     ← Offline persistence
         │
         └──→ Appwrite Remote  ← Cloud sync, multi-device
              ├── Database (story metadata)
              └── Storage (full JSON content)
```

**Key Points:**
- Metadata (id, name, shortDescription) stored in Appwrite Database
- Full content (characters, locations, etc.) stored as JSON files in Appwrite Storage
- localStorage provides offline capability with keys like `stories:v1:content:{storyId}`
- Real-time subscriptions for multi-device sync

## Data Structure

### Story Hierarchy
```typescript
Story (Metadata)
├── id: string
├── name: string
└── shortDescription: string

StoryContent (Full Content - stored as JSON)
├── characters: Character[]
├── species: NamedElement[]
├── locations: NamedElement[]
├── groups: NamedElement[]
├── languages: NamedElement[]
├── items: NamedElement[]
└── plotLines: PlotLine[]
```

### Plot Line Structure
```typescript
PlotLine
├── id: string
├── title: string
├── description?: string
└── chapters: Chapter[]
    └── Chapter
        ├── id: string
        ├── title: string
        ├── description?: string
        ├── order: number
        └── plotPoints: PlotPoint[]
            └── PlotPoint
                ├── id: string
                ├── title: string
                ├── aiPrompt?: string
                ├── storyElements?: string  // @mention-enabled field
                └── order: number
```

**Plot Lines Features:**
- Organize story plot into structured plot lines
- Each plot line contains ordered chapters
- Each chapter contains ordered plot points in a timeline
- Plot points include:
  - Title for the event/scene
  - AI Prompt field with @mention support for referencing story elements
  - Story Elements field with @mention support to tag relevant characters, locations, etc.
  - Order field for sequencing within chapters
- Drag/reorder chapters and plot points using up/down buttons
- Full @mention integration - type @ to reference any character, location, species, group, item, or language

### Character/NamedElement Structure
```typescript
{
  id: string
  name: string
  shortDescription?: string
  longDescription?: string
  avatarUrl?: string
  descriptors: Descriptor[]  // Rich attribute system
}
```

### Descriptor System (100+ attribute keys)
The descriptor system is the core of flexible data modeling. Categories include:

- **Profile**: species, age, gender, birthday, pronouns
- **Appearance**: ethnicity, bodyType, skinTone, eyeColor, hairColor, height, weight
- **Personality**: Big Five (extroversion, agreeableness, conscientiousness, neuroticism, openness), traits
- **Background**: history, education, childhood, memories, fears, regrets
- **Abilities**: skills, talents, hobbies, supernatural, combatStats (strength, dexterity, etc.)
- **Lifestyle**: job, health, religion, money, home, diet
- **Social**: reputation, familyTree, relationships, allies, enemies
- **Communication**: languages, accent, literacy
- **Story**: roles, motivations, goals, arc
- **Media**: images (serialized JSON array)

**Special Descriptors:**
- Scale fields (strength, extroversion, etc.): stored as string numbers "1"-"5" or "1"-"10"
- Images field: serialized as JSON string `[{url, caption}]`
- See `src/lib/descriptorImages.ts` for image serialization utilities

## Project Structure

```
/src
├── auth/
│   ├── AuthProvider.tsx      # Session management
│   └── RequireAuth.tsx       # Protected route wrapper
├── components/               # 15+ reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── TextField.tsx
│   ├── TextArea.tsx
│   ├── AttributePicker.tsx   # Multi-category attribute selector UI
│   ├── MentionArea.tsx       # Rich text with @mentions
│   ├── ImagesField.tsx       # Media upload
│   ├── Avatar.tsx
│   ├── Scale.tsx             # 5/10-point scale inputs
│   └── ...
├── lib/                      # Services & utilities
│   ├── storiesService.ts     # Appwrite integration (CRITICAL)
│   ├── appwrite.ts           # Client initialization
│   ├── cloudinary.ts         # Image upload
│   ├── descriptorImages.ts   # Image serialization helpers
│   └── assets.ts
├── routes/                   # Page components
│   ├── Dashboard.tsx         # Story list
│   ├── StoryView.tsx         # Story detail + export JSON
│   ├── StoryForm.tsx         # Create/edit story metadata
│   ├── Characters.tsx        # Character list
│   ├── CharacterForm.tsx     # Create/edit character
│   ├── Locations.tsx         # Location management
│   ├── Species.tsx
│   ├── Groups.tsx
│   ├── Languages.tsx
│   ├── Items.tsx
│   ├── PlotLines.tsx         # Plot lines list
│   └── PlotLineForm.tsx      # Create/edit plot lines with chapters & plot points
├── state/
│   └── StoriesProvider.tsx   # Global stories state & API
├── theme/
│   ├── ThemeProvider.tsx     # Theme context
│   ├── tokens.ts             # Light/dark theme tokens
│   └── useTheme.ts
├── types.ts                  # TypeScript definitions
├── main.tsx                  # App entry point
└── App.tsx                   # Route definitions
```

## Key Patterns & Conventions

### @Mention & Connections
- Mentions are boundary-aware and match the longest known element name (case-insensitive). Unknown `@` text stays plain.
- Connections are extracted from text whenever forms save; plot lines recompute from description + chapters + plot points to avoid stale arrays.
- On load, mentionable elements are passed to `MentionArea` so chips render correctly and renamed elements resolve in-place.

### Data Flow (Example: Saving a Character)
1. User edits in `CharacterForm` component
2. Form updates local state (descriptors, name, etc.)
3. Calls `saveContent(storyId, updatedStoryContent)`
4. `StoriesProvider.saveContent`:
   - Saves to localStorage immediately (optimistic)
   - If remote enabled, uploads JSON to Appwrite Storage
   - Updates metadata in Appwrite Database
5. Real-time subscription propagates changes to other devices

### StoriesProvider API
```typescript
{
  stories: Story[]
  create: (s: Omit<Story, 'id'>) => Promise<Story>
  update: (id: string, update: Partial<Story>) => void
  remove: (id: string) => Promise<void>
  get: (id: string) => Story | undefined
  loadContent: (id: string) => Promise<StoryContent>
  saveContent: (id: string, content: StoryContent) => Promise<void>
}
```

### Routing Structure
```
/                                   - Dashboard (story list)
/login                              - Sign-in
/stories/new                        - Create story
/stories/:id                        - View story (has Export JSON button)
/stories/:id/edit                   - Edit story metadata
/stories/:id/characters             - Character list
/stories/:id/characters/new         - Add character
/stories/:id/characters/:charId/edit - Edit character
/stories/:id/locations              - Locations
/stories/:id/species                - Species
/stories/:id/groups                 - Groups
/stories/:id/items                  - Items
/stories/:id/languages              - Languages
/stories/:id/plot-lines             - Plot lines list
/stories/:id/plot-lines/new         - Create plot line
/stories/:id/plot-lines/:id/edit    - Edit plot line with chapters & points
```

### Component Styling
- Inline styles using React `CSSProperties`
- CSS variables from theme tokens (e.g., `var(--color-text)`, `var(--color-border)`)
- No CSS modules or styled-components
- Theme variables defined in `theme/tokens.ts`

## Common Commands

```bash
# Development
npm run dev           # Start dev server

# Build
npm run build         # TypeScript check + Vite production build

# Preview
npm run preview       # Preview production build locally

# Linting
npm run lint          # ESLint check
```

## Important Implementation Details

### JSON Export Feature
- Located in `StoryView.tsx:13-33`
- Uses `loadContent()` to fetch full story data
- Downloads as formatted JSON (2-space indentation)
- Filename sanitized from story name

### Descriptor Images
- Images stored in `descriptors` array with key "images"
- Value is JSON-serialized string: `"[{\"url\":\"...\",\"caption\":\"...\"}]"`
- Use `descriptorImages.ts` utilities for parsing/serialization
- Don't manually parse - use the helper functions

### MentionArea Component
The `MentionArea` component provides rich text editing with @mention support for referencing story elements (characters, locations, species, etc.).

**Technical Stack:**
- **Tiptap**: React wrapper for ProseMirror editor
- **Tippy.js**: Popup positioning library for the suggestion dropdown
- **React**: For rendering the suggestion list

**How It Works:**
1. User types `@` to trigger the mention system
2. A filterable popup appears with available story elements
3. User can type to filter suggestions or use arrow keys to navigate
4. Selected mentions appear as chips (styled spans) in the text
5. Plain text output includes `@Name` format

**Key Implementation Details:**
- **Ref-based items**: Uses `useRef` to store mention items instead of closures, preventing editor recreation when suggestions change
- **Virtual element for Tippy**: Creates a virtual DOM element for popup positioning (not attached to a real element)
- **Focus management**: Explicit focus calls and `tabIndex={-1}` on popup/buttons to prevent focus theft from the editor
- **Editor stability**: `initialContent` is NOT in `useEditor` dependencies - content updates handled via separate `useEffect` to prevent editor recreation on every keystroke
- **Content parsing**: `buildContentFromText()` converts plain text with `@Name` patterns into Tiptap JSON structure with mention nodes

**Usage Example:**
```tsx
<MentionArea
  label="Description"
  value={description}
  onChange={setDescription}
  suggestions={['Character A', 'Location B', 'Species C']}
  maxChars={500}
  minHeight={100}
/>
```

**Props:**
- `value`: Plain text string (e.g., "Meet @Alice at @TownSquare")
- `onChange`: Callback receiving plain text output
- `suggestions`: Array of strings to show in mention popup
- `label`: Optional field label
- `maxChars`: Optional character limit
- `minHeight`: Optional minimum height in pixels

**Critical Gotchas:**
- **DO NOT** include `content` or `initialContent` in `useEditor` dependency array - this causes editor to be destroyed/recreated
- **DO NOT** recreate the mention extension when items change - use refs for dynamic updates
- **ALWAYS** use `tabIndex={-1}` on interactive popup elements to prevent focus theft
- **REMEMBER** the component outputs plain text, not HTML - mentions are stored as `@Name` in the text
- When parsing existing text, the regex pattern looks for `@Name` followed by whitespace or non-word characters

**Common Issues:**
- If focus is lost while typing: Check that `initialContent` is not in `useEditor` dependencies
- If popup doesn't show: Verify `suggestions` prop contains items and `clientRect` is being calculated
- If mentions don't parse on load: Ensure the mention names in text exactly match items in `suggestions` array

### Authentication
- Email/password via Appwrite
- `AuthProvider` manages session
- `RequireAuth` wrapper protects routes
- Session persists across page reloads

### Offline Support
- localStorage cache enables offline reads
- Writes queue until connection restored
- Cache keys: `stories:v1:content:{storyId}`

## Environment Variables

Check `.env` or `.env.example` for required Appwrite configuration:
- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_DATABASE_ID`
- `VITE_APPWRITE_COLLECTION_ID`
- `VITE_APPWRITE_BUCKET_ID`

Optional Cloudinary config for image uploads.

## Code Style

- **TypeScript**: Prefer explicit types for props and state
- **Naming**: camelCase for variables/functions, PascalCase for components
- **File names**: PascalCase for component files (e.g., `StoryView.tsx`)
- **Exports**: Default exports for components, named exports for utilities
- **Props**: Destructure in function signature when possible

## Gotchas & What NOT to Do

- **DO NOT** modify auto-generated files in `/dist`
- **DO NOT** commit `.env` files (secrets)
- **DO NOT** mutate state directly - always use setState/context methods
- **DO NOT** access Appwrite directly from components - use `StoriesProvider` API
- **DO NOT** manually parse descriptor images - use `descriptorImages.ts` utilities
- **DO NOT** assume descriptor keys exist - always check before reading values
- **ALWAYS** use `loadContent()` before accessing full story data (it may not be in state)
- **ALWAYS** sanitize user input in descriptors (XSS risk)
- **REMEMBER** localStorage has size limits (~5-10MB) - monitor story size

## Recent Additions

### 2025-12-15: Recently Edited Bar & Sorting Features
- **Recently Edited Bar** - Persistent component showing 4 most recently edited story elements
  - **Location**: Appears below TopNav header, above page content on all authenticated pages
  - **Component**: `RecentlyEdited.tsx` - Auto-refreshes every second to show live updates
  - **Data source**: `recentEdits.ts` utility stores recent edits in localStorage under `recentEdits:v1`
  - **Displays**: Element type, name, and relative time (e.g., "Character: Alice (2m ago)")
  - **Links**: Each item links directly to the edit page for that element
  - **Tracking**: All form components (CharacterForm, LocationForm, etc.) automatically track edits via `addRecentEdit()`
- **Sorting Functionality** - Sort story elements alphabetically or by last updated
  - **Available on**: Characters, Locations, Plot Lines list pages (pattern can be applied to other lists)
  - **Sort options**:
    - **A-Z**: Alphabetical sorting by name/title
    - **Recently Updated**: Most recently edited elements first
  - **UI**: Toggle buttons next to search box, active sort highlighted with primary variant
  - **Data tracking**: `lastEdited` timestamp automatically set when elements are created or modified
  - **Types updated**: Added `lastEdited?: number` to `Character`, `NamedElement`, and `PlotLine` types
  - **Migration**: Existing elements get unique timestamps based on original array position (baseTimestamp + index)
- **Implementation details**:
  - Forms updated to set `lastEdited: Date.now()` on save
  - StoriesProvider's `normalizeContent()` ensures all elements have timestamps for proper sorting
  - Base timestamp set to 1 year ago for migrated elements to distinguish from newly edited ones

### 2025-11-29: Plot Lines UI
- **Complete plot line management system** replacing simple plot points
- **New types** in `types.ts`:
  - `PlotLine`: Container for chapters with title and description
  - `Chapter`: Ordered container for plot points with title, description, and order field
  - `PlotPoint`: Individual story events with title, aiPrompt, storyElements, and order
- **New components**:
  - `PlotLines.tsx`: List view showing all plot lines with chapter/point counts
  - `PlotLineForm.tsx`: Comprehensive nested form for managing plot lines, chapters, and plot points
- **Features**:
  - Hierarchical structure: Plot Lines → Chapters → Plot Points
  - @mention support in all description fields (AI Prompt and Story Elements)
  - Reordering capability with up/down buttons for both chapters and plot points
  - Add/remove chapters and plot points dynamically
  - Each plot point includes:
    - Title field
    - AI Prompt field (for generating scenes/content)
    - Story Elements field (for tagging relevant characters, locations, etc.)
- **Data migration**: Old `plotPoints` array automatically migrates to new `plotLines` structure
- **Routing**: Changed from `/plot-points` to `/plot-lines`
- **UI updates**: Button text changed from "Plot points" to "Plot lines" throughout app

### 2025-11-29: JSON Export
- Added export button to `StoryView.tsx`
- Downloads complete story content as formatted JSON
- Filename based on story name (sanitized)
- Uses blob download with automatic cleanup

## Testing Strategy

Currently no automated tests. When adding tests:
- Consider React Testing Library for component tests
- Mock Appwrite client for integration tests
- Test localStorage fallback behavior
- Validate descriptor serialization/deserialization
