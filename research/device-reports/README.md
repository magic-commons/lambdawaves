# device reports

JSON written by `serve-lan.py` when a device opens `https://<LAN address>:<port>/lab/?report=1&post=1` (lab/device-report.js measures it and POSTs here); read them with `node tools/perf/device-report-summary.mjs research/device-reports/*.json`.
