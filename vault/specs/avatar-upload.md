---
status: implemented
last-reviewed: 2026-07-28
---

# Avatar upload

## Goal

Let a user set a profile photo that displays consistently regardless of
what they upload, without standing up more infrastructure than the
feature needs.

## User behavior

On the profile page, clicking "Change photo" opens a file picker. After
selecting an image, a crop dialog opens (round mask, drag to reposition,
zoom slider) instead of uploading immediately. Confirming the crop
uploads the result right away — this is an immediate action, independent
of the separate "Save profile" button that handles username/bio.
Cancelling the crop leaves the existing avatar untouched. With no avatar
set, a default person-outline placeholder is shown instead of a blank
box.

## Requirements

- Source file must be JPEG, PNG, WebP, or GIF, under 20MB (checked before
  the crop step opens).
- The crop's selected region is always rendered to a fixed 512×512 JPEG
  via canvas before upload — the stored avatar's dimensions never depend
  on the source photo's size or aspect ratio.
- Stored at `{userId}/avatar.{ext}` in the `avatars` Storage bucket,
  `upsert: true` (replaces the previous avatar rather than accumulating
  files).
- The displayed URL is cache-busted with a `?t=` timestamp query param so
  the browser doesn't keep showing a stale image after re-upload (the
  underlying object path doesn't change on re-upload, only its content).

## Acceptance criteria

- Uploading persists across reload (verified).
- The actual uploaded file's pixel dimensions are exactly 512×512
  (verified by parsing the real JPEG header bytes, not just trusting the
  UI).
- Cancelling the crop dialog leaves the previously-saved avatar
  unchanged (verified).
- A user cannot write to another user's avatar path (RLS-enforced via
  `storage.foldername(name)` scoping — see `architecture.md`).

## Permissions and security

Bucket is public-read (avatar images need to be viewable without a
signed URL) but upload/update is scoped per-user by path. Bucket-level
size (5MB) and MIME-type limits back up the client-side checks, but
since the client always uploads a small compressed crop rather than the
raw source file, the bucket limit is rarely the binding constraint in
practice.

## Edge cases

- A very small or oddly-cropped source image still produces a full
  512×512 output — the canvas draw stretches the selected region to fill
  the output size, so extreme zoom-out on a tiny image could look soft.
  Not specifically handled or restricted.
- No "remove avatar" action exists — only replace. Reverting to the
  default placeholder isn't currently possible without direct database
  access.

## Out of scope

- Multiple photo formats/sizes per user (e.g. serving a smaller
  thumbnail separately from a larger version) — one fixed 512×512 output
  covers all current display sizes.
- Avatar moderation/review — no admin capability exists in this version
  at all (see `decisions/ADR-004-content-based-recommendations-only.md`
  context on scope).

## Implementation status

Implemented. `src/pages/Profile.tsx` (`AvatarUploader`),
`src/components/AvatarCropModal.tsx`, `src/components/AvatarImage.tsx`,
`src/lib/cropImage.ts`, `src/services/supabase/profiles.ts`
(`uploadAvatar`).

## Open questions

None currently.
