# Story Collector - Project Context

A React-based story/world-building application that helps writers organize characters, locations, species, and plot points with rich attribute systems and cloud sync.

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
└── plotPoints: PlotPoint[]
```

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
│   └── PlotPoints.tsx
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
/stories/:id/plot-points            - Plot points
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
