import React, { useId } from "react";

export interface MedbrainersLoaderProps {
  /** Show the "medbrainers" wordmark under the logo. Default: true */
  showText?: boolean;
  /** Wordmark text. Default: "medbrainers" */
  text?: string;
  /** Width in px (height follows the aspect ratio). Default: 160 */
  size?: number;
  /** Logo tile colour. Default: #830CFA */
  tileColor?: string;
  /** Colour of the white shapes. Default: #fff */
  markColor?: string;
  /** Wordmark colour. Default: same as tileColor */
  textColor?: string;
  /** Full loop duration in seconds. Default: 3.6 (icon) / 4.8 (with text) */
  duration?: number;
  /** Font URL for the wordmark. Pass "" to skip loading and use fontFamily as-is */
  fontUrl?: string;
  fontFamily?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function MedbrainersLoader({
  showText = true,
  text = "medbrainers",
  size = 160,
  tileColor = "#830CFA",
  markColor = "#ffffff",
  textColor,
  duration,
  fontUrl = "https://www.pickars.com/fonts/LufgaMedium.ttf",
  fontFamily = "'Lufga','Plus Jakarta Sans','Poppins','Segoe UI',Arial,sans-serif",
  className,
  style,
}: MedbrainersLoaderProps) {
  const uid = useId().replace(/:/g, "");
  const h = showText ? 660 : 512;
  const dur = duration ?? (showText ? 4.8 : 3.6);
  const wordColor = textColor ?? tileColor;
  const p = `mb${uid}`; // scope class names per instance

  const css = `
${
  fontUrl
    ? `@font-face{font-family:'Lufga';src:url('${fontUrl}') format('truetype');font-weight:700;font-display:swap}`
    : ""
}
.${p} *{animation-duration:${dur}s;animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.22,1,.36,1)}
.${p} .all{animation-name:${p}all;animation-timing-function:linear}
.${p} .tile{animation-name:${p}tile}
.${p} .tile,.${p} .tl,.${p} .tr,.${p} .bl,.${p} .br,.${p} .word{transform-box:fill-box;transform-origin:center}
.${p} .mark{animation-name:${p}mark;transform-box:view-box;transform-origin:256px 256px}
.${p} .tl{animation-name:${p}tl}.${p} .tr{animation-name:${p}tr}
.${p} .bl{animation-name:${p}bl}.${p} .br{animation-name:${p}br}
.${p} .sheen{animation-name:${p}sheen;animation-timing-function:ease-in-out}
.${p} .word{animation-name:${p}word}
.${p} .wipe{animation-name:${p}wipe;transform-box:fill-box;transform-origin:left center}
.${p} text{font-family:${fontFamily};font-weight:700}
@keyframes ${p}all{0%,90%{opacity:1}97%,100%{opacity:0}}
@keyframes ${p}tile{0%{opacity:0;transform:scale(.55)}12%{opacity:1;transform:scale(1.05)}18%,100%{opacity:1;transform:scale(1)}}
@keyframes ${p}tl{0%,6%{opacity:0;transform:translate(-80px,-80px) rotate(-30deg) scale(.5)}28%{opacity:1;transform:translate(5px,5px) rotate(3deg) scale(1.04)}34%,100%{opacity:1;transform:none}}
@keyframes ${p}tr{0%,8%{opacity:0;transform:translate(80px,-80px) rotate(30deg) scale(.5)}30%{opacity:1;transform:translate(-5px,5px) rotate(-3deg) scale(1.04)}36%,100%{opacity:1;transform:none}}
@keyframes ${p}bl{0%,14%{opacity:0;transform:translateY(100px) scale(.7)}36%{opacity:1;transform:translateY(-7px) scale(1.02)}42%,100%{opacity:1;transform:none}}
@keyframes ${p}br{0%,18%{opacity:0;transform:translateY(100px) scale(.7)}40%{opacity:1;transform:translateY(-7px) scale(1.02)}46%,100%{opacity:1;transform:none}}
@keyframes ${p}mark{0%,44%{transform:scale(1)}50%{transform:scale(1.07)}58%,100%{transform:scale(1)}}
@keyframes ${p}sheen{0%,50%{transform:translateX(0)}66%,100%{transform:translateX(900px)}}
@keyframes ${p}word{0%,52%{opacity:0;transform:translateY(18px)}70%,100%{opacity:1;transform:none}}
@keyframes ${p}wipe{0%,52%{transform:scaleX(0)}72%,100%{transform:scaleX(1)}}
@media (prefers-reduced-motion:reduce){.${p} *{animation:none!important}.${p} .sheen{opacity:0}}
`;

  return (
    <svg
      className={`${p} ${className ?? ""}`.trim()}
      style={style}
      width={size}
      height={(size * h) / 512}
      viewBox={`0 0 512 ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Medbrainers loading"
    >
      <style>{css}</style>
      <defs>
        <clipPath id={`${p}tc`}>
          <rect width="512" height="512" rx="64" />
        </clipPath>
        {showText && (
          <clipPath id={`${p}wc`}>
            <rect className="wipe" x="0" y="540" width="512" height="120" />
          </clipPath>
        )}
      </defs>
      <g className="all">
        <g className="tile">
          <rect width="512" height="512" rx="64" fill={tileColor} />
        </g>
        <g className="mark" fill={markColor}>
          <path
            className="tl"
            d="M131.584 146.797C153.443 125.37 188.534 125.721 209.961 147.58L261.335 199.991L182.174 277.585L130.801 225.174C109.374 203.315 109.724 168.224 131.584 146.797Z"
          />
          <path
            className="tr"
            d="M379.744 146.797C357.885 125.37 322.794 125.721 301.367 147.58L249.993 199.991L329.154 277.585L380.527 225.174C401.954 203.315 401.604 168.224 379.744 146.797Z"
          />
          <path
            className="br"
            d="M340.428 404.812C371.037 404.812 395.852 379.998 395.852 349.389V275.998H285.004V349.389C285.004 379.998 309.818 404.812 340.428 404.812Z"
          />
          <path
            className="bl"
            d="M170.951 403.965C201.561 403.965 226.375 379.151 226.375 348.541V275.151H115.527L115.527 348.541C115.527 379.151 140.342 403.965 170.951 403.965Z"
          />
        </g>
        <g clipPath={`url(#${p}tc)`}>
          <polygon
            className="sheen"
            points="-260,0 -140,0 -240,512 -360,512"
            fill="#fff"
            fillOpacity=".22"
          />
        </g>
        {showText && (
          <g clipPath={`url(#${p}wc)`}>
            <g className="word">
              <text
                x="256"
                y="624"
                textAnchor="middle"
                fontSize="76"
                fill={wordColor}
                stroke={wordColor}
                strokeWidth="1.5"
                strokeLinejoin="round"
                paintOrder="stroke"
                letterSpacing="-1"
              >
                {text}
              </text>
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}
