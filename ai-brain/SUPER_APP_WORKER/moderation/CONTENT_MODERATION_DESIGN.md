# CONTENT MODERATION DESIGN

## Upload flow
1. Authenticate the uploader.
2. Check file type, size, ownership and upload authorization.
3. Store new media privately, not in the public feed.
4. Run server-side image/video moderation.
5. Check captions and metadata for policy violations.
6. Apply thresholds configured and tested for the chosen provider.
7. Publish only if checks pass.
8. Quarantine uncertain or violating media and create a moderator case.
9. Notify the uploader and provide an appeal path where appropriate.

## Video handling
- A text scan cannot reliably identify explicit visuals.
- Use a provider that supports video moderation, or a documented
  frame-sampling pipeline with known limitations.
- Check enough frames to reduce missed short scenes.
- Do not infer full-video safety from one sampled frame.
- Restrict media URLs and prevent public access while processing.
- Set upload timeouts, size limits and processing quotas.

## Enforcement
- Keep a content status such as pending, approved, quarantined or removed.
- Enforce the status on the backend and media delivery layer.
- Hiding a post in the frontend alone is not enforcement.
- Record rule, timestamp, model/provider version and decision reason.
- Provide authorized moderators with review and appeal tools.
- Permanent deletion should follow a retention policy and authorized action.

## What is not implemented by this document
This is a design specification, not an active moderation service.
A real implementation requires integration with the app's upload API,
database, storage permissions, moderation provider and feed endpoints.
