# JNX Products

This directory contains product configurations for the JNX Learning Platform.

## Directory Structure

```
jnx-products/
├── index.ts              # Central registry (imports all products)
├── qryx/
│   └── config.ts         # QRYX configuration
├── trading-bot/          # Future: Trading Bot
│   └── config.ts
└── analytics/            # Future: Analytics Dashboard
    └── config.ts
```

## Adding a New Product

### Step 1: Create Product Directory

```bash
mkdir -p lib/jnx-products/your-product
```

### Step 2: Create Configuration File

```typescript
// lib/jnx-products/your-product/config.ts
import { z } from 'zod'
import { defineProduct } from '@/lib/jnx-core/registry'

export default defineProduct({
  id: 'your_product',
  name: 'Your Product Name',
  version: '1.0.0',
  
  events: {
    'event_name': {
      schema: z.object({
        // Define your event structure
        field1: z.string(),
        field2: z.number(),
      }),
      description: 'What this event tracks'
    }
  },
  
  protected: [
    'core/*',           // Critical paths AI can't modify
    'api/payment/*',
  ],
  
  optimizable: [
    'prompts/*',        // Paths AI can optimize
    'ui/formatting',
  ],
  
  goals: {
    metricName: {
      target: 100,
      unit: 'ms'
    }
  }
})
```

### Step 3: Register Product

```typescript
// lib/jnx-products/index.ts
import './qryx/config'
import './your-product/config'  // Add this line
```

### Step 4: Use in Your Code

```typescript
// In any React component
import { useProductLogger } from '@/lib/jnx-products'

function YourComponent() {
  const logger = useProductLogger('your_product')
  
  const handleEvent = async () => {
    await logger.logEvent('event_name', {
      field1: 'value',
      field2: 123
    })
  }
  
  return <button onClick={handleEvent}>Do Something</button>
}
```

## Event Schema Guidelines

### 1. Use Descriptive Event Names

✅ Good:
- `user_signed_up`
- `payment_completed`
- `chat_message_sent`

❌ Bad:
- `event1`
- `action`
- `data`

### 2. Keep Event Data Flat When Possible

✅ Good:
```typescript
{
  user_id: z.string(),
  message: z.string(),
  response_time_ms: z.number()
}
```

❌ Bad (nested unnecessarily):
```typescript
{
  data: z.object({
    user: z.object({
      id: z.string()
    }),
    message: z.object({
      text: z.string()
    })
  })
}
```

### 3. Always Add Field Validation

```typescript
{
  email: z.string().email(),                    // Validates email format
  age: z.number().int().min(0).max(120),       // Validates age range
  message: z.string().min(1).max(5000),        // Validates message length
  rating: z.number().min(1).max(5),            // Validates rating range
}
```

### 4. Use Optional Fields for Non-Critical Data

```typescript
{
  message: z.string(),                   // Required
  response: z.string(),                  // Required
  metadata: z.record(z.unknown()).optional(),  // Optional
  tags: z.array(z.string()).optional(),        // Optional
}
```

## Protected vs Optimizable Paths

### Protected Paths (AI NEVER Modifies)

- Authentication logic
- Payment processing
- Database operations
- Security features
- Core business logic
- External API integrations

### Optimizable Paths (AI Can Suggest Changes)

- UI copy and formatting
- AI prompts and templates
- Caching strategies
- Performance optimizations
- Response formatting
- Suggestion algorithms

## Goals Configuration

Define measurable targets for AI to optimize towards:

```typescript
goals: {
  // Performance goal
  responseTime: {
    target: 2000,     // 2 seconds
    unit: 'ms'
  },
  
  // Quality goal
  accuracy: {
    target: 0.95,     // 95%
    unit: 'percentage'
  },
  
  // Engagement goal
  messagesPerSession: {
    target: 10,
    unit: 'messages'
  },
  
  // Satisfaction goal
  npsScore: {
    target: 50,       // Net Promoter Score
    unit: 'score'
  }
}
```

## Best Practices

1. **Always validate event data** - Use Zod schemas to catch errors early
2. **Add descriptions** - Help future developers understand event purpose
3. **Keep schemas simple** - Flat structures are easier to query
4. **Use semantic versioning** - Update version when changing events
5. **Document protected paths** - Explain why they're protected
6. **Set realistic goals** - Base targets on actual data
7. **Test locally first** - Use `logger.config.debugMode = true`

## Debugging

### Enable Debug Mode

```typescript
const logger = useProductLogger('your_product', {
  debugMode: true,
  enablePIIRedaction: false  // Only for local testing!
})
```

### Check Logged Events

```sql
-- In Supabase SQL Editor
SELECT 
  product_type,
  event_type,
  event_data,
  created_at
FROM product_events
WHERE product_type = 'your_product'
ORDER BY created_at DESC
LIMIT 10;
```

### Verify Product Registration

```typescript
import { getAllProducts } from '@/lib/jnx-products'

console.log(getAllProducts())
// Should include your product
```

## Examples

See `qryx/config.ts` for a complete, production-ready example.

## Support

For issues or questions:
1. Check existing product configs for patterns
2. Review JNX Core documentation
3. Test with debug mode enabled
4. Verify database migration is applied