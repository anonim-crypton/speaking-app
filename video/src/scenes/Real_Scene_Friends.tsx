import React from "react";
import { MessageCircle, Users } from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { RealVideoWindow } from "../components/RealVideoWindow";
import { GlassBadge } from "../components/GlassBadge";
import { AnimatedCursor } from "../components/AnimatedCursor";

export const Real_Scene_Friends: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15 } });

  // Camera Zoom into Friends search and Messenger
  const zoom = interpolate(
    frame,
    [0, 80, 240, 360, 480],
    [1, 1.35, 1.35, 1.2, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const originX = interpolate(
    frame,
    [0, 80, 240, 360, 480],
    [50, 40, 40, 25, 50],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const originY = interpolate(
    frame,
    [0, 80, 240, 360, 480],
    [50, 45, 45, 65, 50],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const rotY = interpolate(frame, [0, 480], [2, -3]);

  // Cursor moves to sidebar "Xabarlar"
  const cursorX = interpolate(frame, [0, 180, 320], [1500, 450, 450]);
  const cursorY = interpolate(frame, [0, 180, 320], [800, 1050, 1050]);
  const isClicking = frame > 190 && frame < 240;

  return (
    <div className="relative flex h-full w-full items-center justify-center p-16 select-none">
      {/* Top Floating iOS Glass Badge */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30">
        <GlassBadge
          icon={MessageCircle}
          step="04 / Ijtimoiy Aloqa"
          title="Do'stlar & Shaxsiy Xabarlar"
          subtitle="Suhbatdoshlar bilan do'stlashish, xabar yozishish va aloqani saqlab qolish"
        />
      </div>

      {/* 3D Real Video Window */}
      <div
        className="mt-24 transition-transform"
        style={{
          transform: `perspective(1600px) rotateY(${rotY}deg) scale(${enter})`,
          opacity: enter,
        }}
      >
        <RealVideoWindow
          startFromFrame={3100} // ~51.5s in recording
          scale={zoom}
          originX={originX}
          originY={originY}
          url="https://lingospeek.uz/friends"
        />

        {/* Custom Animated Glass Cursor */}
        <AnimatedCursor x={cursorX} y={cursorY} isClicking={isClicking} />
      </div>
    </div>
  );
};
