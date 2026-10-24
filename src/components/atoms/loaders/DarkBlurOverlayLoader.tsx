"use client";

import React from "react";
import { PRIMARY_COLOR } from "@/constants/colors";
import MedbrainersLoader, { MedbrainersLoaderProps } from "./Medbrainersloader";

export interface DarkBlurOverlayLoaderProps {
  /** Controls visibility of the loading overlay */
  isLoading?: boolean;
  /** Whether the overlay covers the full viewport (fixed) or container (absolute). Default: true */
  fullScreen?: boolean;
  /** Z-index for the overlay. Default: 9999 */
  zIndex?: number;
  /** Background color opacity. Default: 0.6 */
  overlayOpacity?: number;
  /** Backdrop blur intensity in px. Default: 8 */
  blurAmount?: number;
  /** Props passed directly to MedbrainersLoader */
  loaderProps?: MedbrainersLoaderProps;
  /** Custom overlay className */
  className?: string;
  /** Custom overlay inline styles */
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export default function DarkBlurOverlayLoader({
  isLoading = true,
  fullScreen = true,
  zIndex = 9999,
  overlayOpacity = 0.6,
  blurAmount = 8,
  loaderProps,
  className = "",
  style,
  children,
}: DarkBlurOverlayLoaderProps) {
  if (!isLoading) return children ? <>{children}</> : null;

  const overlayStyles: React.CSSProperties = {
    position: fullScreen ? "fixed" : "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
    backdropFilter: `blur(${blurAmount}px)`,
    WebkitBackdropFilter: `blur(${blurAmount}px)`,
    zIndex: zIndex,
    pointerEvents: "all",
    ...style,
  };

  return (
    <>
      {children}
      <div
        className={`medbrainers-dark-overlay ${className}`.trim()}
        style={overlayStyles}
        role="dialog"
        aria-modal="true"
        aria-busy="true"
      >
        <MedbrainersLoader
          showText={false}
          tileColor={PRIMARY_COLOR}
          size={96}
          {...loaderProps}
        />
      </div>
    </>
  );
}