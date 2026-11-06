# READ-ONLY APPLICATION SCAN PLAN

Inspect only the SuperSphere-New project.

Check:
- project inventory and package scripts
- web entry points and script references
- API routes and request validation
- authentication and authorization boundaries
- database and storage access patterns
- payment verification and wallet writes
- ad SDK initialization and callbacks
- service worker and caching behavior
- Android app ID, manifest, plugins and build configuration
- upload, feed and content-moderation paths
- error handling, dependency versions and available tests

Never print .env values, tokens, signing keys or private media.
Do not scan node_modules or build outputs by default.
Do not modify files, make network requests, deploy or delete content.
Mark every check PASS, FAIL, BLOCKED or NOT TESTED.
A file existing does not prove the feature works.
