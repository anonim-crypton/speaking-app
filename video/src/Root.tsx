import React from "react";
import { Composition, Video, staticFile } from "remotion";
import { MainPresentation, TOTAL_DURATION } from "./MainPresentation";
import "./style.css";

const VideoInspector: React.FC = () => {
  return (
    <div style={{ width: 1920, height: 1080, background: "#000" }}>
      <Video src={staticFile("video.mp4")} />
    </div>
  );
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="LingoSpeekPresentation"
        component={MainPresentation}
        durationInFrames={TOTAL_DURATION}
        fps={60}
        width={3840}
        height={2160}
        defaultProps={{}}
      />
      <Composition
        id="VideoInspector"
        component={VideoInspector}
        durationInFrames={3720}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
