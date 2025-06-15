# Discord Bot Architecture

This workspace has been refactored to separate Discord.js dependent code from independent utilities.

## Folder Structure

```
src/
├── discord/                    # Discord.js dependent code
│   ├── client.ts              # Discord client setup and event handling
│   ├── deploy-commands.ts     # Command deployment script
│   ├── adapters/              # Discord-specific adapters
│   │   ├── DiscordNotificationService.ts  # Discord notification implementation
│   │   ├── USVisaDiscordAdapter.ts        # US Visa Discord adapter
│   │   ├── CineplexDiscordAdapter.ts      # Cineplex Discord adapter
│   │   └── IcbcDiscordAdapter.ts          # ICBC Discord adapter
│   ├── commands/              # Discord slash commands
│   │   ├── index.ts           # Command exports
│   │   ├── ping/              # Ping related commands
│   │   ├── cineplex/          # Cineplex monitoring commands
│   │   └── usvisa/            # US Visa monitoring commands
│   └── events/                # Discord event handlers
├── services/                  # Pure business logic (framework-agnostic)
│   ├── USVisaService.ts      # US Visa monitoring logic
│   ├── CineplexService.ts    # Cineplex monitoring logic
│   └── IcbcService.ts        # ICBC monitoring logic
├── shared/                    # Shared code (used by both Discord and utilities)
│   ├── config.ts             # Configuration settings
│   ├── interfaces/           # Framework-agnostic interfaces
│   │   └── INotificationService.ts  # Notification service contract
│   ├── constants/            # Application constants
│   │   ├── Settings.ts       # Feature toggles and settings
│   │   ├── CineplexChannelId.ts
│   │   ├── IcbcChannelId.ts
│   │   └── USVisaChannelIds.ts
│   └── types/                # TypeScript type definitions
│       ├── DateResponse.ts
│       ├── TimeResponse.ts
│       └── USVisaConfig.ts
├── utilities/                # Independent utilities (no Discord.js dependency)
│   ├── cors-mini.ts         # CORS proxy server
│   ├── cors-anywhere.ts     # Alternative CORS implementation
│   └── rate-limit.ts        # Rate limiting utilities
├── index.ts                 # Main entry point
└── keep_alive.ts           # Keep-alive functionality
```

## Key Benefits

1. **Complete Framework Independence**: Business logic is now 100% framework-agnostic
2. **Separation of Concerns**: Discord-specific code is isolated from general utilities and business logic
3. **Modularity**: Services can be used with any notification framework (Discord, Slack, Telegram, Email, etc.)
4. **Maintainability**: Clear structure makes it easier to locate and modify code
5. **Testability**: Business logic can be tested in complete isolation with mock notification services
6. **Reusability**: Services can be reused across different projects and platforms
7. **Adapter Pattern**: Clean abstraction layer between business logic and notification platforms

## Dependencies

### Discord-dependent code (`src/discord/`)
- Requires `discord.js` and related packages
- Contains adapters that bridge business logic to Discord API
- Handles Discord-specific formatting and interaction patterns

### Pure business logic (`src/services/`)
- **Zero external dependencies** beyond Node.js built-ins
- Framework-agnostic monitoring and data processing logic
- Can be used with any notification system via the adapter pattern

### Independent utilities (`src/utilities/`)
- No Discord.js dependencies
- Pure Node.js/HTTP functionality
- Can be extracted and used in other projects

### Shared code (`src/shared/`)
- Configuration, interfaces, and types used across the application
- No external dependencies beyond basic Node.js types
- Defines contracts for framework-agnostic operation

## Usage

The main entry point (`src/index.ts`) bootstraps both the Discord bot and the CORS utilities:
- Imports Discord client to start the bot
- Imports CORS mini server for proxy functionality

Build commands remain the same:
- `npm run build` - Build the entire application
- `npm run deploy` - Build and deploy Discord commands
- `npm start` - Build and run the application
