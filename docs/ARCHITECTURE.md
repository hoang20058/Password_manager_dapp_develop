# Architecture

## Overview
This project is a frontend-only DApp shell built with React, Vite, and Tailwind CSS.
It supports hybrid authentication, session unlock via master password, a master-password security gate for critical actions, and blockchain-ready commitment logic.

## Layers
- app: route declaration and lazy-loaded navigation
- context: global application state, auth session, unlocked session state, master gate, theme, toast
- layouts: authenticated shell with responsive sidebar, mobile menu button, and topbar
- pages: route-level feature screens
- components: reusable UI grouped by domain
- config: menu and navigation metadata
- services: Google auth, wallet connect, vault export/import, blockchain helper
- utils: hashing, password generation, storage keys
- styles: design tokens and Tailwind entry

## Route Map
- `/auth`: hybrid sign-in screen
- `/app/vault`: vault management
- `/app/send`: secure sharing placeholder
- `/app/tools/generator`: password generator
- `/app/tools/import`: JSON import
- `/app/tools/export`: protected JSON export
- `/app/tools/blockchain`: commitment/hash preview
- `/app/reports`: security statistics
- `/app/settings/account`: profile and auth state
- `/app/settings/security`: master/account password management
- `/app/settings/appearance`: theme selection

## Security Model
- Google sign-in can use Firebase when configured, or mock dev auth when not
- Wallet connection uses MetaMask / EIP-1193 compatible providers
- Master password unlocks the session once; re-authentication is only required for critical flows like export and delete-all
- Regular vault add/edit/delete flows do not force repeated prompts after unlock
- Password strength is checked with zxcvbn-ts during registration, vault entry editing, and JSON import
- Toast notifications are displayed as a bottom snackbar, with undo support for single-item deletes
- The sidebar can be opened from a menu button on small screens
- Passwords and vault commitments are hashed with SHA-256 / keccak256 helpers
- Blockchain storage is represented as a commitment layer, not raw plaintext storage

## State & Persistence
- `session`: authenticated session and provider metadata
- `vaults`: encrypted or structured vault entries
- `userProfile`: profile data
- `theme`: light/dark UI preference
- `isSessionUnlocked`: local session unlock flag for the current browser profile
- `autoLockMinutes`: inactivity timeout used to re-lock the session
- `masterPasswordHash` and `accountPasswordHash`: hashed secrets

## Legacy Source
The previous Bootstrap implementation is preserved in `legacy/bootstrap-static`.
