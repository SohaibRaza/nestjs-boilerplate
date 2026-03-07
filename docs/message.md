# Message Documentation

This documentation explains the features and usage of **Message Module**: Located at `src/common/message`

## Overview

Message Service provides internationalization (i18n) support using [nestjs-i18n][ref-nestjs-i18n] to manage multi-language messages. All message files are stored in `src/languages/{language}` directory in JSON format. Currently, only English (`en`) is available.

The `MessageModule` is imported globally via `CommonModule` in `src/common/common.module.ts`, making `MessageService` available throughout the application without additional imports.

## Related Documents

- [Response Documentation][ref-doc-response] - For response integration with message service
- [Handling Error Documentation][ref-doc-handling-error] - For exception filter integration
- [Request Validation Documentation][ref-doc-request-validation] - For validation message translation
- [Security and Middleware Documentation][ref-doc-security-and-middleware] - For custom language header middleware and internationalization

## Table of Contents

- [Overview](#overview)
- [Related Documents](#related-documents)
- [Configuration](#configuration)
- [Message Files](#message-files)
- [Usage](#usage)
  - [Basic Translation](#basic-translation)
  - [Translation with Variables](#translation-with-variables)
  - [Custom Language](#custom-language)
- [Integration](#integration)
  - [Exception Filters](#exception-filters)
  - [Response Decorator](#response-decorator)
  - [Validation Pipe](#validation-pipe)
- [Adding New Language](#adding-new-language)

## Configuration

Default language is configured via environment variable:

```bash
APP_LANGUAGE=en
```

Configuration structure:

```typescript
// src/config/message.config.ts
export default registerAs(
    'message',
    (): IConfigMessage => ({
        availableLanguage: Object.values(EnumMessageLanguage),
        language: process.env.APP_LANGUAGE ?? EnumMessageLanguage.EN,
    })
);
```

Language options are defined in the enum:

```typescript
export enum EnumMessageLanguage {
    EN = 'en',
}
```

## Message Files

Message files use JSON format with nested structure. Key paths follow the pattern: `filename.field.nested`.

Example structure:

```json
// src/languages/en/auth.json
{
    "login": {
        "success": "Login successful",
        "error": {
            "notFound": "Email not found",
            "passwordNotMatch": "Password does not match"
        }
    }
}
```

Access pattern:

```typescript
// Key path: auth.login.success
// Output: "Login successful"

// Key path: auth.login.error.notFound
// Output: "Email not found"
```

## Usage

### Basic Translation

Inject `MessageService` and use `setMessage` method:

```typescript
@Injectable()
export class UserService {
    constructor(private readonly messageService: MessageService) {}

    getWelcomeMessage(): string {
        return this.messageService.setMessage('user.welcome');
    }
}
```

### Translation with Variables

Pass variables through the `properties` option:

```json
// src/languages/en/user.json
{
    "greeting": "Hello, {name}!",
    "itemCount": "You have {count} items"
}
```

```typescript
const greeting = this.messageService.setMessage('user.greeting', {
    properties: { name: 'John' }
});
// Output: "Hello, John!"

const itemCount = this.messageService.setMessage('user.itemCount', {
    properties: { count: 5 }
});
// Output: "You have 5 items"
```

### Custom Language

Override default language using the `customLanguage` option:

```typescript
const message = this.messageService.setMessage('user.welcome', {
    customLanguage: 'id' // Indonesian
});
```

Request-specific language can be set via the `x-custom-lang` header:

```typescript
await axios.get('http://localhost:3000/api/users', {
    headers: {
        'x-custom-lang': 'id'
    }
});
```

## Integration

### Exception Filters

Exception filters automatically translate message paths.

```typescript
throw new BadRequestException({
    statusCode: EnumUserStatus_CODE_ERROR.emailExist,
    message: 'user.error.emailExists', // Will be translated
});
```

With variables:

```typescript
throw new NotFoundException({
    statusCode: EnumUserStatus_CODE_ERROR.notFound,
    message: 'user.error.notFoundWithId',
    _metadata: {
        customProperty: {
            messageProperties: { id: userId }
        }
    }
});
```

### Response Decorator

The `@Response` decorator translates success message paths. See [Response Documentation][ref-doc-response] for details.

```typescript
@Response('user.create')
@Post('/')
async create(@Body() dto: CreateUserDto): Promise<IResponse> {
    const user = await this.userService.create(dto);
    return { data: user };
}
```

With variables:

```typescript
@Response('user.update')
@Patch('/:id')
async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto
): Promise<IResponse> {
    const user = await this.userService.update(id, dto);
    return {
        data: user,
        _metadata: {
            customProperty: {
                messageProperties: { name: user.name }
            }
        }
    };
}
```

### Validation Pipe

Validation errors are automatically translated by `MessageService`. The service handles both flat and nested validation errors by traversing the error tree and extracting constraints at each level. See [Request Validation Documentation][ref-doc-request-validation] for details.

**Message Resolution Strategy:**

1. **Primary**: Tries to resolve message from `request.error.{constraint}` path
2. **Fallback**: If translation not found, uses the raw message from class-validator

**Example message file:**

```json
// src/languages/en/request.json
{
    "error": {
        "isNotEmpty": "{property} should not be empty",
        "isEmail": "{property} must be a valid email",
        "minLength": "{property} must be at least {min} characters"
    }
}
```

**Nested Validation:**

For nested objects, the service return the full property path by traversing child errors:

```typescript
// Input DTO with nested validation
class AddressDto {
    @IsNotEmpty()
    street: string;
}

class UserDto {
    @ValidateNested()
    address: AddressDto;
}

// Validation error output:
{
    "key": "isNotEmpty",
    "property": "address.street",
    "message": "street should not be empty"
}
```

**Standard validation response:**

```typescript
// Automatic transformation
{
    "statusCode": 400,
    "message": "Validation error",
    "errors": [
        {
            "key": "isNotEmpty",
            "property": "email",
            "message": "email should not be empty"
        },
        {
            "key": "isEmail",
            "property": "email",
            "message": "email must be a valid email"
        }
    ]
}
```

## Adding New Language

1. Create a new language directory:

```bash
mkdir -p src/languages/id
```

1. Copy and translate JSON files:

```bash
cp src/languages/en/*.json src/languages/id/
```

1. Update the enum:

```typescript
export enum EnumMessageLanguage {
    EN = 'en',
    ID = 'id', // Add new language
}
```

1. Restart the application to load new language files.

<!-- REFERENCES -->

<!-- BADGE LINKS -->

<!-- CONTACTS -->

<!-- Repo LINKS -->

<!-- THIRD PARTY -->

[ref-nestjs-i18n]: https://nestjs-i18n.com

[ref-doc-handling-error]: handling-error.md
[ref-doc-request-validation]: request-validation.md
[ref-doc-response]: response.md
[ref-doc-security-and-middleware]: security-and-middleware.md

<!-- CONTRIBUTOR -->
