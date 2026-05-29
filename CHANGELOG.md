## [1.1.1](https://github.com/wyre-technology/blackpoint-mcp/compare/v1.1.0...v1.1.1) (2026-05-29)


### Bug Fixes

* **ci:** bump version so registry gate fires and add required OCI label ([#19](https://github.com/wyre-technology/blackpoint-mcp/issues/19)) ([1f356f2](https://github.com/wyre-technology/blackpoint-mcp/commit/1f356f2a3b4da1c3e5d6b30962b72b4f2b392eb4))

# [1.1.0](https://github.com/wyre-technology/blackpoint-mcp/compare/v1.0.1...v1.1.0) (2026-05-29)


### Features

* **ci:** publish to MCP Registry on release ([#18](https://github.com/wyre-technology/blackpoint-mcp/issues/18)) ([b381766](https://github.com/wyre-technology/blackpoint-mcp/commit/b38176697207252a7bc4006b5a6a4c045646bba8))

## [1.0.1](https://github.com/wyre-technology/blackpoint-mcp/compare/v1.0.0...v1.0.1) (2026-05-22)


### Bug Fixes

* **http:** add duplex:half on streamed Request + serialize errors (fixes [#1](https://github.com/wyre-technology/blackpoint-mcp/issues/1)) ([#6](https://github.com/wyre-technology/blackpoint-mcp/issues/6)) ([1d85764](https://github.com/wyre-technology/blackpoint-mcp/commit/1d85764a9db036fcc95233c14c2abf7a1fee9755))

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
- Streamed HTTP request handling: Node's Web `Request` constructor threw
  `TypeError: RequestInit: duplex option is required when sending a body`
  when the gateway POSTed JSON-RPC to `/mcp`, causing every request to fail
  with a generic 500 and a logged error object of `{}`. The
  `IncomingMessage`-to-`Request` conversion now lives in a `toWebRequest`
  helper that sets `duplex: 'half'` when a body is present, and the HTTP
  handler's catch block serializes `Error` objects so logs show `name`,
  `message`, and `stack`. Fixes the production crash from #1.
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
