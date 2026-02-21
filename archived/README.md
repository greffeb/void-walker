# Void Walker

A mobile-first Progressive Web App space horror RPG with AI-driven game mastering, procedural generation, and creative player agency.

## Features

- **Emergent Storytelling**: AI-generated unique scenarios every session
- **Creative Agency**: Attempt any action - the AI evaluates fairly
- **Meaningful Consequences**: D20-based dice system with real stakes
- **Atmospheric Horror**: Environmental storytelling through datapads, radio transmissions, and evidence
- **Flexible Sessions**: Play for 5 minutes or 2 hours
- **Offline Support**: Play saved scenarios offline
- **Installable**: Add to home screen on mobile devices

## Play Online

Visit the deployed PWA at: `https://[your-username].github.io/void_walker/`

Or run locally:

```bash
cd pwa
npm install
npm run dev
```

Then open http://localhost:5173

## Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- Google AI API key (Gemini) - entered on first launch
- Internet connection for new scenario generation

## Development

```bash
cd pwa

# Install dependencies
npm install

# Development server (hot reload)
npm run dev

# Run tests
npm run test

# Type checking
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

## Project Structure

```
void_walker/
├── pwa/                      # Progressive Web App
│   ├── src/
│   │   ├── components/       # React UI components
│   │   ├── controllers/      # Game logic
│   │   ├── services/         # LLM client, storage
│   │   ├── stores/           # Zustand state management
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Dice, pacing, validators
│   └── public/
├── shared/                   # Shared content definitions
│   └── content/              # Classes, items, settings (JSON)
├── docs/                     # Documentation
│   └── PWA_MISSING_FEATURES.md
└── archived/                 # Archived CLI version (reference only)
```

## Controls

| Action | How |
|--------|-----|
| Move/Act | Tap suggestion buttons or type custom action |
| Inventory | Tap inventory icon |
| Map | Tap map icon |
| Save | Auto-saves or via Options menu |

## License

MIT License
