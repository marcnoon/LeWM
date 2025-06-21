# Setting up Claude with WSL Environment

This guide will help you set up Claude Code in a WSL (Windows Subsystem for Linux) environment.

## Prerequisites

**Important**: Remember your sudo password before starting! You'll need it multiple times during this setup, and it can be frustrating to get locked out.

## Step 1: Install Node.js using NVM

1. Remove any existing conflicting nvm installations:
   ```bash
   sudo apt remove nodejs npm
   ```

2. Install nvm directly from GitHub:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

3. Restart your terminal or run:
   ```bash
   source ~/.bashrc
   ```

4. Install and use the LTS version of Node.js:
   ```bash
   nvm install --lts
   nvm use --lts
   ```

5. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Step 2: Install Claude Code

1. Install Claude Code globally:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

## Step 3: Set up API Key

1. Add your Anthropic API key to your environment:
   ```bash
   export ANTHROPIC_API_KEY="YOUR_ACTUAL_API_KEY_HERE"
   ```

2. To make it permanent, add it to your `.bashrc` or `.zshrc`:
   ```bash
   echo 'export ANTHROPIC_API_KEY="YOUR_ACTUAL_API_KEY_HERE"' >> ~/.bashrc
   source ~/.bashrc
   ```

## Step 4: Verify Setup

Test that everything is working:
```bash
claude-code --version
```

## Troubleshooting

- If you get permission errors, make sure you're using the LTS version with `nvm use --lts`
- If nvm commands don't work, restart your terminal
- Remember to use your sudo password when prompted during package installations

## Notes

- The LTS (Long Term Support) version of Node.js is recommended for stability
- Keep your API key secure and never commit it to version control
- You may want to update npm if prompted: `npm install -g npm@latest`