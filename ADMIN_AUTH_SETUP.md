# Admin Auth Setup

This site now uses Netlify Functions + an Edge Function to protect the CMS login.

## Netlify environment variables

Set these in **Project configuration > Environment variables**:

- `CMS_ADMIN_USER`
- `CMS_ADMIN_PASSWORD`
- `CMS_ADMIN_SESSION_SECRET`

Use a long, random value for `CMS_ADMIN_SESSION_SECRET`.

## Netlify features to enable

- Deploy the site on Netlify.
- Make sure Functions and Edge Functions are enabled for the site.

## Notes

- The admin session is stored in an HttpOnly cookie.
- The login page works on Netlify or Netlify Dev.
- The old hardcoded front-end credentials were removed from the repo.

