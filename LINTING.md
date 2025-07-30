# Linting Setup for Memcache Editor

This project uses ESLint with Airbnb configuration to maintain code quality and consistency.

## Configuration

### ESLint Configuration
- **Base Configuration**: Airbnb JavaScript Style Guide
- **File**: `.eslintrc.js`
- **Ignored Files**: `.eslintignore`

### Key Features
- **Airbnb Style Guide**: Enforces consistent coding standards
- **Custom Rules**: Tailored for this specific project
- **Browser & Node.js Support**: Handles both client and server-side code
- **Auto-fix Capability**: Automatically fixes most formatting issues

## Available Scripts

### Linting Commands
```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check with compact output format
npm run lint:check
```

### Other Commands
```bash
# Start the application
npm start

# Development mode with auto-restart
npm run dev
```

## Code Style Rules

### General Rules
- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Always required
- **Line Length**: 120 characters max
- **Trailing Commas**: Required in multiline objects/arrays

### JavaScript Specific
- **Arrow Functions**: Preferred over function expressions
- **Template Literals**: Preferred over string concatenation
- **Object Destructuring**: Encouraged
- **Const/Let**: Preferred over var
- **No Console**: Warned (allowed for debugging)

### Project-Specific Rules
- **Console Statements**: Allowed with warnings (useful for debugging)
- **Global Variables**: Bootstrap and other globals are handled
- **Unused Variables**: Allowed if prefixed with underscore (_)
- **Magic Numbers**: Allowed for this project

## File Structure

```
memcacheEditor/
├── .eslintrc.js          # ESLint configuration
├── .eslintignore         # Files to ignore
├── package.json          # Dependencies and scripts
├── server.js             # Server-side code
└── public/
    └── script.js         # Client-side code
```

## Current Status

✅ **All linting errors resolved**
⚠️ **5 warnings remaining** (console statements - intentional for debugging)

### Remaining Warnings
The remaining warnings are for `console` statements which are intentionally allowed for debugging purposes:
- Server-side logging for errors and startup information
- Client-side debugging for modal and API interactions

These warnings can be safely ignored as they serve a legitimate debugging purpose.

## Best Practices

### Code Organization
1. **Function Declarations**: Place utility functions at the top
2. **Event Handlers**: Group related handlers together
3. **Async Functions**: Use proper error handling with try/catch
4. **Comments**: Use meaningful comments for complex logic

### Error Handling
```javascript
// Good: Proper error handling
try {
  const result = await apiCall('/api/endpoint');
  handleSuccess(result);
} catch (error) {
  showError('container', error.message);
}
```

### Variable Naming
```javascript
// Good: Clear, descriptive names
const memcached = new Memcached(host);
const handleMemcacheError = (err, res) => { /* ... */ };

// Avoid: Unclear names
const mc = new Memcached(host);
const handleErr = (e, r) => { /* ... */ };
```

## Integration with Development Workflow

### Pre-commit Checks
Consider adding a pre-commit hook to run linting automatically:

```bash
# Add to package.json scripts
"precommit": "npm run lint"
```

### IDE Integration
Most modern IDEs support ESLint integration:
- **VS Code**: Install ESLint extension
- **WebStorm**: Built-in ESLint support
- **Atom**: Install linter-eslint package

### Continuous Integration
Add linting to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Lint
  run: npm run lint
```

## Troubleshooting

### Common Issues

1. **"Definition for rule was not found"**
   - Solution: Update ESLint and related packages
   - Run: `npm update eslint eslint-config-airbnb-base`

2. **Indentation errors**
   - Solution: Run auto-fix: `npm run lint:fix`
   - Check your editor's tab/space settings

3. **Import/Export issues**
   - Solution: Ensure proper module syntax
   - Use ES6 import/export syntax

### Getting Help
- **ESLint Documentation**: https://eslint.org/
- **Airbnb Style Guide**: https://github.com/airbnb/javascript
- **Project Issues**: Check the project's issue tracker

## Migration from TSLint

This project was originally configured for TSLint but migrated to ESLint because:
- **TSLint is deprecated** and no longer maintained
- **ESLint has better TypeScript support** via `@typescript-eslint`
- **Airbnb configuration** provides comprehensive rules
- **Better community support** and active development

If you need TypeScript support in the future, you can easily add:
```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## Contributing

When contributing to this project:

1. **Run linting** before submitting: `npm run lint`
2. **Fix any errors** that appear
3. **Consider warnings** but they're not blocking
4. **Follow the established patterns** in the codebase
5. **Add tests** for new functionality

## Performance

The linting setup is optimized for:
- **Fast execution**: Minimal configuration overhead
- **Accurate results**: Comprehensive rule coverage
- **Developer productivity**: Auto-fix capabilities
- **Project-specific needs**: Customized for memcache editor requirements
