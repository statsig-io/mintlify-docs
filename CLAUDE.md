# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Mintlify documentation site built using MDX files and configured through `docs.json`. The site serves as documentation for Statsig SDK quickstart guides and API references, with a focus on helping users quickly integrate Statsig's feature flagging and experimentation platform.

## Development Commands

### Local Development
```bash
# Install Mintlify CLI globally
npm i -g mintlify

# Start local development server (runs on port 3000)
mintlify dev

# Run on custom port
mintlify dev --port 3333
```

### Validation and Maintenance
```bash
# Check for broken links in documentation
mintlify broken-links

# Update Mintlify CLI to latest version
npm i -g mintlify@latest

# If encountering issues, reinstall dependencies
mintlify install
```

## Architecture

### Configuration Structure
- `docs.json`: Main configuration file defining site structure, navigation, theming, and metadata
- Theme: "willow" with green color scheme (`#16A34A` primary)
- Navigation organized into two main tabs: "Guides" and "API Reference"

### Content Organization
- **Root level**: Introduction, quickstart, and development guides
- **essentials/**: Core documentation features (markdown, code, images, settings, navigation, snippets)  
- **api-reference/**: API documentation with OpenAPI integration
- **sdks/**: SDK quickstart guides for multiple programming languages
- **snippets/**: Reusable content snippets

### Key Features
- Multi-language SDK quickstart guides (JavaScript, React, Python, Node.js, plus 24+ other SDKs)
- OpenAPI-based API reference documentation
- Dark/light mode support with custom logo variants
- Integration with external tools (Statsig console, community Slack)

## File Structure Conventions
- All documentation files use `.mdx` format
- Images stored in `/images/` with organized subdirectories
- Logo variants: `/logo/light.svg` and `/logo/dark.svg`
- Configuration follows Mintlify schema: `https://mintlify.com/docs.json`

## Content Guidelines
- Documentation targets developers integrating Statsig SDK
- Quickstart guides provide step-by-step implementation for different tech stacks
- Examples use realistic placeholder values (user IDs, API keys, feature names)
- Code samples include multiple tabs for different implementation approaches

## External Dependencies
- Mintlify CLI for local development and deployment
- CDN-hosted JavaScript SDK for browser integration
- OpenAPI specification for automated API documentation
- Various SDK packages across different programming languages

## Troubleshooting Notes
- Node.js version 19+ required for Mintlify CLI
- If "sharp" module errors occur, upgrade Node.js and reinstall Mintlify
- Delete `~/.mintlify` folder if encountering unknown errors
- Ensure running commands from directory containing `docs.json`