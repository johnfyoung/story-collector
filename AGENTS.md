# Story Collector — Agent & Developer Reference

A React-based story/world-building application that helps writers organize characters, locations, species, and plot lines with rich attribute systems and cloud sync.

## Technology Stack

- **Framework**: React 19.1.1 with TypeScript (~5.8.3)
- **Build Tool**: Vite 7.1.6
- **Routing**: React Router DOM 6.28.0
- **Backend**: Appwrite 14.0.0 (BaaS — authentication, database, storage, real-time)
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

### Character / NamedElement Structure
```typescript
{
  id: string
  name: string
  shortDescription?: string
  longDescription?: string
  avatarUrl?: string
  lastEdited?: number        // timestamp; used for sorting
  descriptors: Descriptor[]  // rich attribute system
}
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
                ├── aiPrompt?: string        // @mention-enabled
                ├── storyElements?: string  // @mention-enabled
                └── order: number
```

### Descriptor System (100+ attribute keys)
The descriptor system is the core of flexible data modeling. Categories:

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
- Scale fields (strength, extroversion, etc.): stored as string numbers `"1"`–`"5"` or `"1"`–`"10"`
- Images field: serialized as JSON string `"[{\"url\":\"...\",\"caption\":\"...\"}]"`
- See `src/lib/descriptorImages.ts` for image serialization utilities — do not manually parse

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
│   ├── openaiImageGen.ts     # Image generation via Appwrite Function proxy
│   ├── imagePromptBuilder.ts # Builds prompts from descriptor attributes
│   ├── recentEdits.ts        # localStorage-backed recent edit tracking
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

/functions
└── generate-image/           # Appwrite Function — OpenAI image proxy
    ├── src/main.js
    └── package.json
```

## Routing Structure

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

## StoriesProvider API

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

### Data Flow (Example: Saving a Character)
1. User edits in `CharacterForm`
2. Form updates local state (descriptors, name, etc.)
3. Calls `saveContent(storyId, updatedStoryContent)`
4. `StoriesProvider.saveContent`:
   - Saves to localStorage immediately (optimistic)
   - If remote enabled, uploads JSON to Appwrite Storage
   - Updates metadata in Appwrite Database
5. Real-time subscription propagates changes to other devices

## Key Patterns & Conventions

### @Mention & Connections
- Mentions are boundary-aware and match the longest known element name (case-insensitive). Unknown `@` text stays plain.
- Connections are extracted from text whenever forms save; plot lines recompute from description + chapters + plot points to avoid stale arrays.
- On load, mentionable elements are passed to `MentionArea` so chips render correctly and renamed elements resolve in-place.

### Sorting
- `lastEdited?: number` on `Character`, `NamedElement`, and `PlotLine` drives "Recently Updated" sort.
- `StoriesProvider.normalizeContent()` stamps existing elements with unique timestamps ~1 year ago so they sort below newly edited ones.
- Forms set `lastEdited: Date.now()` on save.

### Recently Edited Bar
- `RecentlyEdited.tsx` shows the 4 most recently edited elements below TopNav.
- Backed by `recentEdits.ts`, which writes to `localStorage` under key `recentEdits:v1`.
- All form components track edits via `addRecentEdit()`.

## Component Details

### MentionArea
Rich text editor with @mention support (Tiptap + Tippy.js).

**Props:**
- `value`: plain text string (e.g., `"Meet @Alice at @TownSquare"`)
- `onChange`: callback receiving plain text output
- `suggestions`: array of strings to show in mention popup
- `label`, `maxChars`, `minHeight`: optional

**Critical gotchas:**
- **DO NOT** include `content` or `initialContent` in `useEditor` dependency array — causes editor destroy/recreate
- **DO NOT** recreate the mention extension when items change — use refs for dynamic updates
- **ALWAYS** use `tabIndex={-1}` on interactive popup elements to prevent focus theft
- The component outputs plain text, not HTML — mentions stored as `@Name` in the text
- If focus is lost while typing: `initialContent` is likely in `useEditor` dependencies
- If mentions don't parse on load: ensure mention names in text exactly match items in `suggestions`

## Implementation Details

### AI Image Generation
- The frontend (`openaiImageGen.ts`) calls an **Appwrite Function** (`generate-image`) as a proxy — the OpenAI API key is never sent to the browser.
- The function ID is set via `VITE_APPWRITE_IMAGE_FUNCTION_ID`.
- The `OPENAI_API_KEY` lives only in the Appwrite Function's environment variables (set in the Appwrite Console).
- The function is located at `functions/generate-image/` and must be deployed to Appwrite separately.
- Appwrite Function timeout should be set to at least 120s (image generation can take 20–40s).

### JSON Export
- Located in `StoryView.tsx:13-33`
- Uses `loadContent()` to fetch full story data
- Downloads as formatted JSON (2-space indentation)
- Filename sanitized from story name

### Descriptor Images
- Images stored in `descriptors` array with key `"images"`
- Value is JSON-serialized string: `"[{\"url\":\"...\",\"caption\":\"...\"}]"`
- Use `descriptorImages.ts` utilities for parsing/serialization — don't manually parse

### Authentication
- Email/password via Appwrite
- `AuthProvider` manages session
- `RequireAuth` wrapper protects routes
- Session persists across page reloads

### Offline Support
- localStorage cache enables offline reads
- Cache keys: `stories:v1:content:{storyId}`
- localStorage limit is ~5–10 MB; monitor story size

## Environment Variables

```env
# Required — Appwrite
VITE_APPWRITE_ENDPOINT=
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DB_ID=
VITE_APPWRITE_STORIES_COLLECTION_ID=
VITE_APPWRITE_BUCKET_STORIES=

# Optional — AI image generation (Appwrite Function proxy)
VITE_APPWRITE_IMAGE_FUNCTION_ID=   # Appwrite Function ID for generate-image
VITE_OPENAI_IMAGE_MODEL=gpt-image-2.5-flare  # or gpt-image-2.5-sunburst (or a dated snapshot)

# Optional — Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

The `OPENAI_API_KEY` is **not** a `VITE_` variable — it belongs only in the Appwrite Function's environment, never in the frontend build.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript check (tsc -b) + production build in dist/
npm run preview   # Serve dist/ for local sanity check
npm run lint      # ESLint across the project
```

## Code Style & Naming Conventions

- Language: TypeScript + React. Indentation: 2 spaces.
- Components: PascalCase file and component names (e.g., `StoryList.tsx`).
- Variables/functions: camelCase; constants UPPER_SNAKE_CASE.
- Hooks: start with `use`. Prefer named exports for utilities, default exports for components.
- Styles: inline `CSSProperties` using CSS variables from `theme/tokens.ts` (e.g., `var(--color-text)`). No CSS modules or styled-components.
- Prefer explicit types for props and state.

## Testing Guidelines

- No test runner configured yet. If adding tests, use **Vitest + React Testing Library**.
- File pattern: `*.test.ts` / `*.test.tsx`; co-located with source or under `src/__tests__/`.
- Cover component behavior and core utilities; keep tests fast and deterministic.
- Mock the Appwrite client for integration tests; test localStorage fallback behavior.
- Validate descriptor serialization/deserialization.

## Commit & PR Guidelines

- Commits: imperative mood, concise (e.g., `"Add story fetch hook"`). Optional prefixes: `feat:`, `fix:`, `chore:`.
- PRs: short summary, testing steps, screenshots for UI changes, linked issues (`Closes #12`).
- Before opening a PR: run `npm run lint` and verify the build locally.

## Gotchas & What NOT to Do

- **DO NOT** modify auto-generated files in `/dist`
- **DO NOT** commit `.env` files (secrets)
- **DO NOT** put `OPENAI_API_KEY` in a `VITE_` variable — it would be bundled and exposed to users
- **DO NOT** mutate state directly — always use setState/context methods
- **DO NOT** access Appwrite directly from components — use `StoriesProvider` API
- **DO NOT** manually parse descriptor images — use `descriptorImages.ts` utilities
- **DO NOT** assume descriptor keys exist — always check before reading values
- **ALWAYS** use `loadContent()` before accessing full story data (it may not be in state)
- **ALWAYS** sanitize user input in descriptors (XSS risk)
