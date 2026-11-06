# Super App Guardian

This directory contains the worker's policy, audit plan and initial
read-only inventory script.

Start with:
  bash scanner/inventory.sh

This does not yet connect an AI model, moderate uploaded videos or
change the running application. Those require explicit backend/API
integration, authenticated service permissions and a tested moderation
provider. Do not describe this as a deployed worker until those pieces
are implemented and verified.
