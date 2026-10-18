import React from "react";
import { UserCheck } from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { RealVideoWindow } from "../components/RealVideoWindow";
import { GlassBadge } from "../components/GlassBadge";
import { AnimatedCursor } from "../components/AnimatedCursor";

export const Real_Scene_Onboarding: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15 } });

  // Camera Zoom into avatar upload section
  const zoom = interpolate(frame, [0, 90, 320, 420], [1, 1.4, 1.4, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotY = interpolate(frame, [0, 420], [3, -2]);

  // Cursor movement to "Keyingisi" button
  const cursorX = interpolate(frame, [0, 150, 260], [1400, 1920, 2020]);
  const cursorY = interpolate(frame, [0, 150, 260], [900, 1200, 1260]);
  const isClicking = frame > 170 && frame < 220;

  return (
    <div className="relative flex h-full w-full items-center justify-center p-16 select-none">
      {/* Top Floating iOS Glass Badge */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30">
        <GlassBadge
          icon={UserCheck}
          step="02 / Shaxsiy Profil"
          title="Onboarding & Daraja Tanlash"
          subtitle="O'z avataringiz va maqsadingizni belgilab, suhbatga tayyorlaning"
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
          startFromFrame={900} // ~15s in recording
          scale={zoom}
          originX={50}
          originY={50}
          url="https://lingospeek.uz/onboarding"
        />

        {/* Custom Animated Glass Cursor */}
        <AnimatedCursor x={cursorX} y={cursorY} isClicking={isClicking} />
      </div>
    </div>
  );
};
