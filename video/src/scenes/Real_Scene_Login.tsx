import React from "react";
import { LogIn } from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { RealVideoWindow } from "../components/RealVideoWindow";
import { GlassBadge } from "../components/GlassBadge";
import { AnimatedCursor } from "../components/AnimatedCursor";

export const Real_Scene_Login: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const enter = spring({ frame, fps, config: { damping: 15 } });

  // Camera Zoom into center login card
  const zoom = interpolate(frame, [0, 80, 300, 390], [1, 1.35, 1.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera 3D tilt
  const rotY = interpolate(frame, [0, 390], [-4, 2]);

  // Cursor movement towards login button
  const cursorX = interpolate(frame, [0, 120, 220], [1800, 1920, 1920]);
  const cursorY = interpolate(frame, [0, 120, 220], [1200, 1150, 1150]);
  const isClicking = frame > 130 && frame < 180;

  return (
    <div className="relative flex h-full w-full items-center justify-center p-16 select-none">
      {/* Top Floating iOS Glass Badge */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30">
        <GlassBadge
          icon={LogIn}
          step="01 / Avtorizatsiya"
          title="Tezkor & Xavfsiz Kirish"
          subtitle="Telefon raqam yoki Google orqali bir soniyada hisobingizga kiring"
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
          startFromFrame={420} // ~7s in recording
          scale={zoom}
          originX={50}
          originY={55}
          url="https://lingospeek.uz/login"
        />

        {/* Custom Animated Glass Cursor */}
        <AnimatedCursor x={cursorX} y={cursorY} isClicking={isClicking} />
      </div>
    </div>
  );
};
