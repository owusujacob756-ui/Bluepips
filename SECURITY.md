Security considerations and best practices for Bluepips

- Never commit secrets or API keys to the repository. Use `.env.local` for local environment variables and add it to `.gitignore`.
- Use GitHub Actions secrets for CI: `OPENAI_API_KEY`, `NEWS_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GEMINI_KEY`, `DATABASE_URL`.
- Limit who has access to production keys and rotate keys regularly.
- Run dependency scanning and vulnerability checks in CI.
- For production, use managed databases with network access controls and encrypt data at rest.
- Use strong authentication (OAuth or SSO) for user accounts and secure session management.
