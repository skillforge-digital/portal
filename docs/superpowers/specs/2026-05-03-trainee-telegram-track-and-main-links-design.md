# Trainee Dashboard Telegram Links (Track + Main) — Design

Date: 2026-05-03

## Goal

On the trainee dashboard sidebar, expose:

1) A track-specific Telegram group link that matches the trainee’s registered track.
2) A separate main Telegram community link.

## Current Issue

The trainee dashboard currently uses a `TELEGRAM_NODES` mapping with placeholder links (e.g. `https://t.me/skillforge_tech`) and falls back to `https://t.me/skillforgeorg`. This results in trainees only getting the main community link rather than their track group invite link.

## UX

Sidebar shows two buttons:

- “Track Telegram” → opens the trainee’s registered track Telegram invite link.
- “Main Community” → opens `https://t.me/skillforgeorg`.

If track is missing or unknown:

- “Track Telegram” falls back to `https://t.me/skillforgeorg` but still remains enabled.

## Source of Truth

Use the shared mapping in `/assets/registry-utils.js` (`getTelegramLinkForTrack`) to avoid duplication and ensure registry, staff tools, and trainee dashboard use the same track→Telegram mapping.

## Acceptance Criteria

- A trainee with track `Web Development` gets “Track Telegram” set to `https://t.me/+vEJTv3fBRl43Yjlk`.
- “Main Community” always points to `https://t.me/skillforgeorg`.
- No placeholder track telegram URLs remain in trainee dashboard code.

