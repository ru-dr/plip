# Security Policy

## Supported Versions

Security fixes land on the latest minor release. Older majors are not patched.

| Version | Supported |
|---------|-----------|
| 2.x     | Yes       |
| 1.x     | No        |

## Reporting a Vulnerability

Report privately through
[GitHub security advisories](https://github.com/ru-dr/plip/security/advisories/new).
Please do not open a public issue for a vulnerability.

Include what you have: affected version, a description of the issue, steps or a
snippet that reproduces it, and the impact you think it has.

This is a small open-source project maintained in spare time, so there is no
guaranteed response time. Reports are read and acknowledged as soon as
practical.

## Scope

Plip formats log entries and hands them to transports. The areas most likely to
matter for security:

- **Log injection.** Message text is written verbatim. Values you do not control
  can contain newlines or ANSI escape sequences and forge log lines. Sanitize
  untrusted input, or use `enableStructuredOutput: true` so each entry is one
  JSON object.
- **Sensitive data.** Nothing is redacted automatically. Anything you pass to a
  log method reaches every transport. The React and Next.js adapters redact a
  small set of well-known keys and headers as a convenience, not as a guarantee.
- **`RemoteTransport`.** Sends log batches over the network. Use HTTPS, and treat
  `apiKey` as a secret: it is sent as a bearer token.
- **`FileTransport`.** Writes and rotates files at the path you configure, with
  the permissions of the running process.
- **`BrowserTransport`.** Persists entries to `localStorage`, which is readable
  by any script on the origin. Do not store secrets there.

Findings in dependencies belong upstream; the package has no runtime
dependencies.
