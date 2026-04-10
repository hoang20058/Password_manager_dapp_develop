# Security Notes

## Local Security Model
- Master password is used to unlock the session once and is retained for the active browser profile until auto-lock.
- Re-authentication is reserved for critical actions such as export and delete-all.
- Regular vault add/edit/delete flows should remain friction-light after unlock.
- Password secrets are stored as hashes in localStorage, not as plain text.
- Vault export is a gated flow and should remain protected even in offline mode.
- Session unlock remains available across page reloads in the same browser profile; inactivity timeout still re-locks the session.

## Hybrid Auth
- Google authentication is intended to use Firebase Auth when environment variables are configured.
- Wallet connection is intended to use MetaMask or another EIP-1193-compatible provider.
- If providers are unavailable during development, mock fallback values are used to keep the UI usable.

## Blockchain Storage Strategy
- Do not store plaintext passwords on-chain.
- Store only commitments, hashes, encrypted payload references, or IPFS/CID metadata.
- Treat smart-contract writes as public and irreversible.

## Recommended Next Step
- Add a real encryption layer for vault payloads before any chain write.
- Move secret validation and session handling to a backend or dedicated auth service when production-ready.
