import React from "react";
import { Composition } from "remotion";
import { MainPresentation, TOTAL_DURATION } from "./MainPresentation";
import "./style.css";

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
    </>
  );
};
