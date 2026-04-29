# Admin Auth Setup

This site now uses Netlify Functions + an Edge Function to protect the CMS login.

## Netlify environment variables

Set these in **Project configuration > Environment variables**:

- `CMS_ADMIN_USER`
- `CMS_ADMIN_PASSWORD`
- `CMS_ADMIN_SESSION_SECRET`
- `CMS_DATA_GITHUB_TOKEN`
- `CMS_DATA_REPO`
- `CMS_DATA_BRANCH`
- `CMS_DATA_PATH`

Use a long, random value for `CMS_ADMIN_SESSION_SECRET`.
Use a GitHub token with write access to the repository for `CMS_DATA_GITHUB_TOKEN`.
If you keep the defaults, `CMS_DATA_REPO` is `dnvasquez/editorial`, `CMS_DATA_BRANCH` is `main` and `CMS_DATA_PATH` is `cms-state.json`.

## Netlify features to enable

- Deploy the site on Netlify.
- Make sure Functions and Edge Functions are enabled for the site.

## Notes

- The admin session is stored in an HttpOnly cookie.
- The login page works on Netlify or Netlify Dev.
- The old hardcoded front-end credentials were removed from the repo.
- The CMS now syncs its editable data to a versioned JSON file in GitHub through Netlify Functions.
- Browser `localStorage` is treated as a cache for convenience, not as the source of truth.
