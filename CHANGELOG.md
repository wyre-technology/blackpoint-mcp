# 1.0.0 (2026-05-22)


### Bug Fixes

* add NODE_AUTH_TOKEN to release job for private package auth ([b90fd44](https://github.com/wyre-technology/blackpoint-mcp/commit/b90fd445f3cbba7c86dc79ea8da67a5436201580))
* add packages: read permission to release job for node-blackpoint install ([cde463a](https://github.com/wyre-technology/blackpoint-mcp/commit/cde463a348d3145e416c256315d50cc73bd1258e))
* **ci:** unbreak Lint job — typecheck (tsc --noEmit) layer 1 ([#2](https://github.com/wyre-technology/blackpoint-mcp/issues/2)) ([aa1e9c8](https://github.com/wyre-technology/blackpoint-mcp/commit/aa1e9c8784aec74c98131754f0451258ac91c4b6))
* **http:** use WebStandardStreamableHTTPServerTransport, add /health route ([857b44d](https://github.com/wyre-technology/blackpoint-mcp/commit/857b44d92de16905de755534dcea8cc3582563c5))


### Features

* add server.json for MCP Registry publication ([#4](https://github.com/wyre-technology/blackpoint-mcp/issues/4)) ([b936ae7](https://github.com/wyre-technology/blackpoint-mcp/commit/b936ae7fa1d91813efaac6803df129496e6ca592))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- HTTP transport import pointed at a non-existent SDK module
  (`@modelcontextprotocol/sdk/server/http.js`), causing an
  `ERR_MODULE_NOT_FOUND` crash on container startup. Now imports
  `WebStandardStreamableHTTPServerTransport` from
  `@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js`.
- Bumped `@modelcontextprotocol/sdk` from `^0.6.0` to `^1.29.0` — the
  `0.6.x` line never exported a Streamable HTTP server transport.
- Added unauthenticated shallow `GET /health` and `/healthz` routes
  returning `200 {"status":"ok"}` for the Azure liveness probe.

### Added
- Initial release of Blackpoint Cyber CompassOne MCP server
- Decision-tree navigation system with domain organization
- Support for Tenants domain (list, get)
- Support for Assets domain (list, get, relationships, search)
- Support for Detections domain (list, get)
- Support for Vulnerabilities domain (vulnerabilities, scans, dark web, external exposure)
- HTTP transport mode for gateway integration
- Per-request stateless server and transport for gateway mode
- Gateway-mode credential injection via HTTP headers
- Structured stderr logging
- Elicitation infrastructure for future interactive features
- Comprehensive error handling and rate limiting via SDK
- Docker support with multi-stage build
- Health check endpoint for container deployments

### Security
- Header-based authentication for gateway mode
- Non-root container execution
- Credential cache invalidation on change
- Safe error message handling
