export function getAssignedTrack(profile) {
  const assignedTrack = profile?.assignedTrack ? String(profile.assignedTrack).trim() : '';
  if (assignedTrack) return assignedTrack;

  const tracks = Array.isArray(profile?.tracks)
    ? profile.tracks.map((t) => String(t || '').trim()).filter(Boolean)
    : [];

  if (tracks.length === 1) return tracks[0];
  return '';
}
