# Story Collector

A React-based story and world-building application that helps writers organize characters, locations, species, plot lines, and more with a rich attribute system and cloud synchronization.

## Features

- **Comprehensive Story Management**: Create and manage multiple stories with detailed metadata
- **Rich Character System**: Define characters with 100+ attributes across categories like appearance, personality, background, abilities, and relationships
- **World Building Elements**: Organize species, locations, groups, languages, and items
- **Plot Line Structure**: Organize your narrative with hierarchical plot lines containing chapters and plot points
- **@Mention System**: Reference any story element using @mentions in descriptions and AI prompts
- **Flexible Attributes**: Extensive descriptor system with categories including profile, appearance, personality, background, abilities, lifestyle, social, and more
- **Cloud Sync**: Multi-device synchronization via Appwrite backend
- **Offline Support**: Local storage caching for offline access
- **Image Support**: Upload and manage images via Cloudinary integration
- **AI Image Generation**: Generate character portraits from appearance attributes using OpenAI DALL-E
- **JSON Export**: Export complete story data as formatted JSON
- **Theme Support**: Light and dark theme modes

## Technology Stack

- **Framework**: React 19.1.1 with TypeScript (~5.8.3)
- **Build Tool**: Vite 7.1.6
- **Routing**: React Router DOM 6.28.0
- **Backend**: Appwrite 14.0.0 (authentication, database, storage, real-time sync)
- **Styling**: CSS-in-JS with CSS variables for theming
- **Media**: Cloudinary for image uploads (optional)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Appwrite instance (cloud or self-hosted)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd story-collector
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory with the following:

```env
VITE_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
VITE_APPWRITE_COLLECTION_ID=your-collection-id
VITE_APPWRITE_BUCKET_ID=your-bucket-id

# Optional: Cloudinary for image uploads
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset

# Optional: OpenAI for AI image generation
VITE_OPENAI_API_KEY=sk-your-openai-api-key
VITE_OPENAI_IMAGE_MODEL=dall-e-3
```

See `.env.example` for a complete template.

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Project Structure

```
/src
├── auth/                  # Authentication management
│   ├── AuthProvider.tsx   # Session & auth state
│   └── RequireAuth.tsx    # Protected route wrapper
├── components/            # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── TextField.tsx
│   ├── TextArea.tsx
│   ├── AttributePicker.tsx  # Multi-category attribute selector
│   ├── MentionArea.tsx      # Rich text with @mentions
│   ├── ImagesField.tsx      # Image upload component
│   └── ...
├── lib/                   # Services & utilities
│   ├── storiesService.ts  # Appwrite integration
│   ├── appwrite.ts        # Client initialization
│   ├── cloudinary.ts      # Image upload service
│   └── descriptorImages.ts # Image serialization helpers
├── routes/                # Page components
│   ├── Dashboard.tsx      # Story list
│   ├── StoryView.tsx      # Story details & export
│   ├── Characters.tsx     # Character management
│   ├── PlotLines.tsx      # Plot line management
│   └── ...
├── state/
│   └── StoriesProvider.tsx # Global state management
├── theme/                 # Theme configuration
│   ├── ThemeProvider.tsx
│   └── tokens.ts
├── types.ts               # TypeScript type definitions
└── App.tsx                # Route definitions
```

## Data Architecture

### Storage Strategy (Hybrid)

Story Collector uses a hybrid storage approach:

- **Local Storage**: Immediate persistence and offline access
- **Appwrite Database**: Story metadata (id, name, description)
- **Appwrite Storage**: Full story content as JSON files
- **Real-time Sync**: Multi-device synchronization via Appwrite subscriptions

### Story Structure

```typescript
Story (Metadata)
├── id: string
├── name: string
└── shortDescription: string

StoryContent (Full Content)
├── characters: Character[]
├── species: NamedElement[]
├── locations: NamedElement[]
├── groups: NamedElement[]
├── languages: NamedElement[]
├── items: NamedElement[]
└── plotLines: PlotLine[]
```

### Plot Lines

Plot lines provide hierarchical story organization:

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
                ├── aiPrompt?: string         # @mention enabled
                ├── storyElements?: string    # @mention enabled
                └── order: number
```

### Descriptor System

Characters and elements support 100+ attribute keys across categories:

- **Profile**: species, age, gender, birthday, pronouns
- **Appearance**: ethnicity, bodyType, skinTone, eyeColor, hairColor, height, weight
- **Personality**: Big Five traits (extroversion, agreeableness, conscientiousness, neuroticism, openness)
- **Background**: history, education, childhood, memories, fears, regrets
- **Abilities**: skills, talents, hobbies, supernatural powers, combat stats
- **Lifestyle**: job, health, religion, finances, home, diet
- **Social**: reputation, family tree, relationships, allies, enemies
- **Communication**: languages, accent, literacy
- **Story**: roles, motivations, goals, character arc
- **Media**: images with captions

## Available Commands

```bash
# Development
npm run dev           # Start dev server (localhost:5173)

# Production
npm run build         # TypeScript check + production build
npm run preview       # Preview production build

# Code Quality
npm run lint          # Run ESLint
```

## Key Features

### @Mention System

Type `@` in supported fields to reference any story element (characters, locations, species, groups, items, languages). Available in:
- Character/element descriptions
- Plot line descriptions
- Chapter descriptions
- Plot point AI prompts and story elements

### JSON Export

Export your complete story data from the Story View page:
1. Navigate to a story's detail page
2. Click "Export JSON" button
3. Download formatted JSON with all story content

### Image Management

Upload and manage images for characters and elements:
- Supports multiple images per element
- Each image can have a caption
- Integrated with Cloudinary for hosting
- Images stored in descriptor system as serialized JSON

### AI Image Generation

Generate character portraits automatically from appearance attributes:
- Click "Generate with AI" in the Images field (Media category)
- Auto-generates prompt from appearance attributes (ethnicity, body type, hair color, eye color, etc.)
- Customize the prompt, art style, quality, and size
- Preview generated image before accepting
- Generated image automatically uploaded to Cloudinary
- Prompt saved to "AI Image Prompt" field for reference
- Requires OpenAI API key (DALL-E 3 or DALL-E 2)

### Plot Line Management

Organize your narrative structure:
- Create multiple plot lines per story
- Each plot line contains ordered chapters
- Each chapter contains ordered plot points
- Drag/reorder chapters and plot points
- AI prompt field for scene generation
- Story elements field for tagging relevant characters/locations

## Routing Structure

```
/                                      - Dashboard (story list)
/login                                 - Authentication
/stories/new                           - Create story
/stories/:id                           - View story details
/stories/:id/edit                      - Edit story metadata
/stories/:id/characters                - Manage characters
/stories/:id/characters/new            - Add character
/stories/:id/characters/:charId/edit   - Edit character
/stories/:id/locations                 - Manage locations
/stories/:id/species                   - Manage species
/stories/:id/groups                    - Manage groups
/stories/:id/items                     - Manage items
/stories/:id/languages                 - Manage languages
/stories/:id/plot-lines                - Manage plot lines
/stories/:id/plot-lines/new            - Create plot line
/stories/:id/plot-lines/:id/edit       - Edit plot line
```

## Development Notes

### Code Style

- TypeScript with explicit types for props and state
- camelCase for variables/functions
- PascalCase for components and files
- Default exports for components, named exports for utilities
- Inline styles using CSS variables from theme tokens

### State Management

- React Context API (`StoriesProvider`) for global state
- React hooks for local component state
- No external state management libraries

### Best Practices

- Always use `loadContent()` before accessing full story data
- Use helper functions in `descriptorImages.ts` for image serialization
- Sanitize user input in descriptors to prevent XSS
- Don't mutate state directly - use setState/context methods
- Access Appwrite through `StoriesProvider` API, not directly from components

## Recent Updates

### 2025-11-29: AI Image Generation
- Generate character portraits from appearance attributes using OpenAI DALL-E
- Auto-builds prompts from ethnicity, body type, hair color, eye color, and other appearance descriptors
- Customizable art styles: portrait, fantasy art, realistic photo, anime, oil painting, digital art
- Quality options: standard or HD
- Size options: square, landscape, or portrait
- Preview before accepting
- Generated images auto-uploaded to Cloudinary
- Prompt saved to "AI Image Prompt" appearance attribute for reference

### 2025-11-29: Plot Lines UI
- Complete plot line management system replacing simple plot points
- Hierarchical structure: Plot Lines → Chapters → Plot Points
- @mention support in AI Prompt and Story Elements fields
- Reordering capability with up/down buttons
- Data migration from old `plotPoints` to new `plotLines` structure

### 2025-11-29: JSON Export
- Added export functionality to Story View
- Downloads complete story content as formatted JSON
- Automatic filename sanitization

## License

[Add your license information here]

## Contributing

[Add contributing guidelines here]
