# Scripts

This directory contains various scripts for processing and analyzing the codebase and datasets.

## Security Warning: `execute_validation.py`

The `execute_validation.py` script is designed to compile and run untrusted code for the purpose of semantic validation. It includes a basic "sandbox" that uses process-level isolation and a timeout.

**This sandbox is NOT hardened and does NOT provide strong security guarantees.**

- It does not effectively restrict filesystem access, network access, or other system calls.
- Resource limits (CPU, memory) are not enforced, which could lead to denial-of-service vulnerabilities on the machine running the script.

**DO NOT run this script in a production environment or on any system with sensitive data.**

A proper, secure implementation should use containerization technologies (e.g., Docker, gVisor, Firecracker) to achieve true isolation. This is planned for a future iteration.