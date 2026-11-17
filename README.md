# OcuAlign complete deployment package

This is the complete frontend and server source from the latest OcuAlign version,
configured for independent Cloudflare Workers + private R2 storage. It is not a
single-file static website. Do not upload only web/index.html to Webador or Base44.

## Deploy
Install a current Node.js LTS release and npm. Create a Cloudflare account and
enable R2. Extract this folder, open a terminal in it, then run:

    npm install
    npx wrangler login
    npx wrangler r2 bucket create ocualign-records
    npm run deploy

If you choose a different bucket name, update bucket_name in wrangler.jsonc.
The BUCKET binding must remain unchanged. Keep the bucket private.
Open the HTTPS URL printed by deployment. Register a new account, sign out,
then sign in again and test a sample patient, photo and video on a second device.

For local development run npm run dev. Local storage is separate from production.

## What is included
- Current interface, inline equipment photos, Surgical microscope and Slit lamp lists.
- Research notice, red decline message, required first/last name and work email.
- Photo/video capture, categories, rotation controls and playback.
- Username/password account access, encrypted records and media, cross-device storage.
- Worker entry point, R2 binding configuration, build scripts and source tests.

## Existing accounts and records
No patient records, passwords, credentials or live storage are included.
A new R2 bucket starts empty. Existing login credentials will work only after the
corresponding account objects and captures have been migrated.
To preserve accounts, an authorized migration must copy every relevant personal/
object and its custom metadata (especially verifier), without changing object keys
or bytes. This package does not have access to the ChatGPT-hosted storage or perform
that migration. Keep the original service until migration and access are verified.
Objects from legacy ChatGPT identity storage require separate migration to personal
accounts; untrusted ChatGPT identity headers are disabled on this independent host.

## HTML export
web/index.html is the frontend entry page and loads the other bundled source files.
Serve it through the Worker; double-clicking it cannot run the server.

## Limits
The research popup is a login UI gate, not a permanent consent audit record.
It does not grant MUHC researchers access. Work email format is checked, but mailbox
ownership and workplace affiliation are not verified. This package preserves the
current service behavior and is not a certification for clinical deployment.
Hosting charges depend on your Cloudflare plan and usage.

## Verification
JavaScript syntax and the existing account/storage tests were checked before
packaging. Deployment in your Cloudflare account and real-device camera behavior
have not been tested here.

References:
https://developers.cloudflare.com/r2/get-started/workers-api/
https://developers.cloudflare.com/workers/wrangler/commands/r2/
https://developers.cloudflare.com/r2/api/workers/workers-api-usage/
