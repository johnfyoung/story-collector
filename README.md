# Story Collector

A web app for writers to organize and build out their story worlds — characters, locations, species, plot lines, and more — with cloud sync across devices.

## Features

- **Multiple stories** — create and switch between separate story projects
- **Rich character sheets** — 100+ attributes across appearance, personality, background, abilities, relationships, and more
- **World building** — manage species, locations, groups, languages, and items
- **Plot lines** — organize narrative structure into plot lines → chapters → plot points
- **@Mentions** — type `@` in any description field to link characters, locations, and other elements together
- **AI image generation** — generate character portraits from appearance attributes using OpenAI
- **Image uploads** — attach multiple images with captions to any element via Cloudinary
- **JSON export** — download your complete story data as a formatted JSON file
- **Offline support** — local caching so the app works without a connection
- **Cloud sync** — changes sync across devices in real time via Appwrite
- **Light / dark theme**

## Getting Started

### Prerequisites

- Node.js v18+
- An [Appwrite](https://appwrite.io) project (cloud or self-hosted)

### Installation

```bash
git clone <repository-url>
cd story-collector
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
# Appwrite (required)
VITE_APPWRITE_ENDPOINT=https://your-appwrite-endpoint/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DB_ID=your-database-id
VITE_APPWRITE_STORIES_COLLECTION_ID=your-collection-id
VITE_APPWRITE_BUCKET_STORIES=your-bucket-id

# AI image generation (optional)
# Deploy functions/generate-image to Appwrite and paste its ID here.
# Set OPENAI_API_KEY in the Appwrite Function's environment — not here.
VITE_APPWRITE_IMAGE_FUNCTION_ID=your-function-id
VITE_OPENAI_IMAGE_MODEL=gpt-image-1

# Cloudinary image uploads (optional)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
```

### Run

```bash
npm run dev      # development server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build locally
```

## Using the App

### Stories

The dashboard lists all your stories. Create a new one with the **New Story** button. Each story has its own set of characters, locations, species, groups, items, languages, and plot lines.

### Characters & World Elements

Navigate into a story and use the sidebar links to manage each element type. Characters support the full attribute system — open a character and use the **Add Attribute** button to fill in appearance, personality, background, abilities, and more.

### @Mentions

In any description field, type `@` followed by a name to link to another story element. Linked elements show as chips in the editor. Connections are tracked automatically and visible on each element's page.

### Plot Lines

Plot lines let you map out your story structure. Each plot line contains **chapters**, and each chapter contains **plot points** — individual scenes or events. Plot points have an **AI Prompt** field (for drafting scene content later) and a **Story Elements** field (for tagging relevant characters and locations).

Use the up/down arrows to reorder chapters and plot points.

### AI Image Generation

Requires an Appwrite Function deployment (see `functions/generate-image/`) with an OpenAI API key configured in its environment.

1. Open a character and go to the **Media** attribute category
2. Click **Generate with AI**
3. A prompt is automatically built from the character's appearance attributes
4. Adjust the prompt, art style, quality, and size, then click **Generate**
5. Preview the result and accept to save it

### JSON Export

From any story's detail page, click **Export JSON** to download the full story content — all characters, locations, plot lines, and attributes — as a formatted `.json` file.

## License

[Add license here]
