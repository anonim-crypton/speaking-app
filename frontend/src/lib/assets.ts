/**
 * Image sources (Unsplash CDN, free to use).
 * Every image is rendered through <SmartImage /> which falls back to a
 * purple gradient block if the network/image is unavailable.
 */
const u = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  /** Person speaking into a microphone — hero app mockup. */
  speaker: u("photo-1494790108377-be9c29b29330", 720),
  /** Group of friends — bottom CTA banner. */
  ctaGroup: u("photo-1529156069898-49953e39b3ac", 640),
  /** Popular speaking rooms thumbnails. */
  rooms: [
    u("photo-1511632765486-a01980e01a18", 640),
    u("photo-1506905925346-21bda4d32df4", 640),
    u("photo-1489599849927-2ee91cede3ba", 640),
    u("photo-1523240795612-9a054b0db644", 640),
  ],
  /** Small round avatars reused across the page. */
  avatars: [
    u("photo-1500648767791-00dcc994a43e", 96),
    u("photo-1534528741775-53994a69daeb", 96),
    u("photo-1507003211169-0a1dd7228f2d", 96),
    u("photo-1438761681033-6461ffad8d80", 96),
  ],
};

export const roomImage = (index: number) => IMG.rooms[index % IMG.rooms.length];
export const avatarImage = (index: number) => IMG.avatars[index % IMG.avatars.length];
