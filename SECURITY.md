# Security

λWAVES is a static site: no server code, no accounts, no network calls after the page loads (the service
worker precaches the lab; the microphone is opened only when you add an AUDIO device and revoked when the
last one is removed). Project files and notes live in your browser's localStorage and in files you export.

If you find a problem — an XSS through an imported project or notebook, a way to make the service worker
serve stale bytes, a leak of microphone audio — open a GitHub issue marked **security**, or write to the
address on [magic-commons.com](https://magic-commons.com). Please include the project file or the steps.
