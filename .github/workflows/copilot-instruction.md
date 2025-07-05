# Copilot Instructions

- When making changes, always update code in the `LeWM-Angular` folder, as this contains the main Angular application we are actively developing.
- **Do not** make changes to the React prototype unless specifically requested.
- Prioritize Angular-related features, bugfixes, and documentation unless the user explicitly says to work on React.
- When in doubt, ask for clarification about which frontend or folder to use.

> **Note:**  
> Chromium is already installed in the Dockerfile image for Codespaces. Use Chromium commands for browser automation or testing unless otherwise instructed.  
> If you need to add Google Chrome or reconfigure browser automation, be aware that this will increase the devcontainer image size by ~350MB, but Codespaces will cache the image after the first build for faster future startups.