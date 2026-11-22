# Tradeix dependency vulnerability triage

This document records reproducible security triage for the open security branch. It is **not** a declaration that the image is safe to deploy.

## Verified CI evidence (2026-11-21)

[Tradeix CI run #12](https://github.com/akashphilipvarghese-code/tradeix-platform/actions/runs/44859189459) completed with:
- Lint, Vitest, Next.js production build, and Docker image build: **passed**.
- Dependency-remediation job: **passed**; it committed a compatible lockfile update as `04f30f1` after verification.
- Trivy container image scan: **failed** on HIGH/CRITICAL findings; production deploy: **skipped**.

The image scan ran against the PR merge commit checked out by GitHub Actions. Re-run the scan against the **latest** branch head after each dependency change; passing the separate npm remediation job does not mean the container is vulnerability-free.

## How to reproduce

Use Node.js 22 and the checked-in lockfile:

```sh
npm ci
npm run lint
npm test
npm run build
npm audit --audit-level=high
docker build --pull -t tradeix-security-check .
trivy image --severity HIGH,CRITICAL --exit-code 1 tradeix-security-check
```

Install Trivy separately using its official instructions. Run these commands on a trusted development machine or CI runner; do not copy secrets into the image.

## Triage sequence

1. Review the **latest** Trivy output, including installed version, fixed version, affected path, and whether the package is present in the runtime image. The November 21 scan still reported vulnerable packages including `postcss`, `sigstore`, and `source-map-js`.
2. Separate direct dependencies (`package.json`) from transitive dependencies (`package-lock.json`). Use `npm explain <package>` to identify which direct package pulls in a vulnerable transitive package.
3. Prefer compatible patched releases and regenerate the lockfile with npm. The existing `npm audit fix` may leave advisories requiring major upgrades; **do not** use `--force` without reviewing API and runtime compatibility.
4. For Next.js and associated ESLint/build tooling, evaluate a supported patched release as one coordinated change. Test session authentication, protected shipment routes, database access, and production build output after upgrades.
5. Run all checks above, inspect the image scan, and only merge the security PR after the latest-head CI and security gates pass. Do not disable Trivy or downgrade severity to obtain a green build.

## Deployment boundary

The current workflow's production deploy step is a placeholder, not evidence of an actual production release. Configure a production `SESSION_SECRET` with at least 32 characters before any real deployment. Do not commit credentials, real shipment records, or customer data.
