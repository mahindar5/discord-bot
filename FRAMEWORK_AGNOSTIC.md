# Framework-Agnostic Business Logic

The business logic has been successfully extracted from Discord.js dependencies! Here are examples of how to use the services with different frameworks:

## Structure Overview

```
src/
├── services/                   # Pure business logic (framework-agnostic)
│   ├── USVisaService.ts       # US Visa monitoring logic
│   ├── CineplexService.ts     # Cineplex monitoring logic
│   └── IcbcService.ts         # ICBC monitoring logic
├── discord/                   # Discord.js specific code
│   ├── adapters/              # Discord adapters
│   │   ├── DiscordNotificationService.ts
│   │   ├── USVisaDiscordAdapter.ts
│   │   ├── CineplexDiscordAdapter.ts
│   │   └── IcbcDiscordAdapter.ts
│   └── client.ts             # Discord client setup
├── shared/                   # Shared interfaces and types
│   └── interfaces/
│       └── INotificationService.ts
```

## Usage with Different Frameworks

### 1. Discord.js (Current Implementation)
```typescript
import { USVisaDiscordAdapter } from './discord/adapters/USVisaDiscordAdapter.js';

const adapter = new USVisaDiscordAdapter(discordClient, config);
adapter.monitorVisaDatesAvailability();
```

### 2. Slack Bot Example
```typescript
import { USVisaService } from './services/USVisaService.js';

class SlackNotificationService implements INotificationService {
  async sendMessage(channelId: string, fields: MessageField[]): Promise<void> {
    // Slack API implementation
    await slackClient.chat.postMessage({
      channel: channelId,
      text: fields.map(f => `${f.name}: ${f.value}`).join('\n')
    });
  }

  async sendError(channelId: string, error: Error): Promise<void> {
    // Slack error notification
  }
}

// Usage
const slackNotifier = new SlackNotificationService();
const visaService = new USVisaService(config, slackNotifier);
visaService.monitorVisaDatesAvailability();
```

### 3. Telegram Bot Example
```typescript
import { CineplexService } from './services/CineplexService.js';

class TelegramNotificationService implements INotificationService {
  async sendMessage(chatId: string, fields: MessageField[]): Promise<void> {
    const message = fields.map(f => `*${f.name}*: ${f.value}`).join('\n');
    await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  async sendError(chatId: string, error: Error): Promise<void> {
    await telegramBot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

// Usage
const telegramNotifier = new TelegramNotificationService();
const cineplexService = new CineplexService(telegramNotifier);
cineplexService.monitorCineplexesAvailability();
```

### 4. Email Notifications Example
```typescript
import { IcbcService } from './services/IcbcService.js';

class EmailNotificationService implements INotificationService {
  async sendMessage(emailAddress: string, fields: MessageField[]): Promise<void> {
    const htmlContent = fields.map(f => 
      `<p><strong>${f.name}:</strong> ${f.value}</p>`
    ).join('');
    
    await emailService.send({
      to: emailAddress,
      subject: 'ICBC Monitoring Update',
      html: htmlContent
    });
  }

  async sendError(emailAddress: string, error: Error): Promise<void> {
    // Email error notification
  }
}
```

### 5. Web API/Webhook Example
```typescript
class WebhookNotificationService implements INotificationService {
  async sendMessage(webhookUrl: string, fields: MessageField[]): Promise<void> {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        fields: fields
      })
    });
  }

  async sendError(webhookUrl: string, error: Error): Promise<void> {
    // Webhook error notification
  }
}
```

## Key Benefits

✅ **Framework Independence**: Business logic is completely separated from Discord.js  
✅ **Easy Testing**: Services can be tested with mock notification services  
✅ **Multi-Platform**: Same logic can power Discord, Slack, Telegram, email, etc.  
✅ **Maintainability**: Changes to business logic don't affect notification layers  
✅ **Flexibility**: Switch notification methods without changing core logic  

## Interface Contract

All notification services must implement `INotificationService`:

```typescript
interface INotificationService {
  sendMessage(channelId: string, fields: MessageField[]): Promise<void>;
  sendError(channelId: string, error: Error): Promise<void>;
}
```

This ensures consistency across all platforms while allowing platform-specific implementations.
