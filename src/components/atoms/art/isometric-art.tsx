import React from "react";

/** Isometric wireframe illustrations, shared across landing sections. Usage: <Art name="records" /> (fills its parent). */
export type ArtName =
  | "hospital"
  | "clinic"
  | "emr"
  | "industry"
  | "dental"
  | "pharmacy"
  | "records"
  | "theatre"
  | "lab"
  | "security"
  | "ward";

/* ---------- Isometric wireframe illustrations (Transparent Backgrounds) ---------- */
const DIM = "#ffffff45";
type B = { cx: number; cy: number; hw: number; hh: number; h: number };
type Pt = [number, number];

const pathOf = (pts: Pt[]) =>
  "M" + pts.map((p) => `${p[0]} ${p[1]}`).join("L") + "Z";
const lineD = (a: Pt, b: Pt) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
const topPt = (b: B, s: number, t: number): Pt => [
  b.cx + (s - t) * b.hw,
  b.cy - b.hh + (s + t) * b.hh,
];
const facePt = (b: B, side: "l" | "r", u: number, v: number): Pt => {
  const sg = side === "l" ? -1 : 1;
  return [b.cx + sg * b.hw - sg * u * b.hw, b.cy + u * b.hh + v * b.h];
};
const topQuad = (b: B, s0: number, s1: number, t0: number, t1: number) =>
  pathOf([
    topPt(b, s0, t0),
    topPt(b, s1, t0),
    topPt(b, s1, t1),
    topPt(b, s0, t1),
  ]);
const faceQuad = (
  b: B,
  side: "l" | "r",
  u0: number,
  u1: number,
  v0: number,
  v1: number
) =>
  pathOf([
    facePt(b, side, u0, v0),
    facePt(b, side, u1, v0),
    facePt(b, side, u1, v1),
    facePt(b, side, u0, v1),
  ]);

const S = ({
  d,
  dim,
  sw = 1,
  fill = "none",
}: {
  d: string;
  dim?: boolean;
  sw?: number;
  fill?: string;
}) => (
  <path
    d={d}
    fill={fill}
    stroke={dim ? DIM : "#fff"}
    strokeWidth={sw}
    strokeLinejoin="round"
    strokeLinecap="round"
  />
);

const Box = ({ b, dim, sw = 1 }: { b: B; dim?: boolean; sw?: number }) => (
  <g
    fill="none"
    stroke={dim ? DIM : "#fff"}
    strokeWidth={sw}
    strokeLinejoin="round"
  >
    <path
      d={`M${b.cx - b.hw} ${b.cy}L${b.cx - b.hw} ${b.cy + b.h}L${b.cx} ${
        b.cy + b.hh + b.h
      }L${b.cx} ${b.cy + b.hh}Z`}
    />
    <path
      d={`M${b.cx + b.hw} ${b.cy}L${b.cx + b.hw} ${b.cy + b.h}L${b.cx} ${
        b.cy + b.hh + b.h
      }L${b.cx} ${b.cy + b.hh}Z`}
    />
    <path
      d={`M${b.cx - b.hw} ${b.cy}L${b.cx} ${b.cy + b.hh}L${b.cx + b.hw} ${
        b.cy
      }L${b.cx} ${b.cy - b.hh}Z`}
    />
  </g>
);

const scenes: Record<ArtName, () => React.ReactNode> = {
  hospital: () => {
    const base: B = { cx: 170, cy: 240, hw: 108, hh: 54, h: 18 };
    const c: B = { cx: 170, cy: 132, hw: 58, hh: 29, h: 100 };
    const wl: B = { cx: 112, cy: 196, hw: 44, hh: 22, h: 38 };
    const wr: B = { cx: 228, cy: 196, hw: 44, hh: 22, h: 38 };
    const rows = [
      [0.1, 0.24],
      [0.34, 0.48],
    ];
    const cols = [
      [0.14, 0.42],
      [0.58, 0.86],
    ];
    return (
      <>
        <Box b={base} dim />
        <Box b={c} />
        {rows.flatMap(([v0, v1]) =>
          cols.flatMap(([u0, u1]) =>
            (["l", "r"] as const).map((side) => (
              <S
                key={`${side}${v0}${u0}`}
                d={faceQuad(c, side, u0, u1, v0, v1)}
                sw={0.9}
              />
            ))
          )
        )}
        <Box b={wl} />
        <Box b={wr} />
        <S d={faceQuad(wl, "l", 0.2, 0.45, 0.3, 0.65)} sw={0.9} />
        <S d={faceQuad(wr, "r", 0.2, 0.45, 0.3, 0.65)} sw={0.9} />
        <S d="M146 120L194 144M146 144L194 120" sw={1.4} />
        <S d="M270 88V112M258 100H282" dim />
      </>
    );
  },

  clinic: () => {
    const lo: B = { cx: 150, cy: 170, hw: 92, hh: 46, h: 14 };
    const up: B = { cx: 150, cy: 136, hw: 92, hh: 46, h: 14 };
    const cs = [0.06, 0.28, 0.5, 0.72];
    const rs = [0.1, 0.38, 0.66];
    const hc = topPt(up, cs[1] + 0.1, rs[1] + 0.11);
    const r1 = topPt(up, 0.3, 0);
    const r2 = topPt(up, 0.7, 0);
    return (
      <>
        <Box b={lo} dim />
        <Box b={up} />
        {cs.flatMap((s, i) =>
          rs.map((t, j) => (
            <S
              key={`${i}-${j}`}
              d={topQuad(up, s, s + 0.2, t, t + 0.22)}
              dim={!(i === 1 && j === 1)}
              sw={0.9}
            />
          ))
        )}
        <S
          d={`M${hc[0] - 6} ${hc[1]}L${hc[0] - 2} ${hc[1] + 4}L${hc[0] + 7} ${
            hc[1] - 5
          }`}
          sw={1.3}
        />
        <S d={lineD(r1, [r1[0], r1[1] - 18])} sw={2} />
        <S d={lineD(r2, [r2[0], r2[1] - 18])} sw={2} />

        {/* clock */}
        <path
          d="M220 240V262A42 21 0 0 0 304 262V240"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
        />
        <ellipse
          cx="262"
          cy="240"
          rx="42"
          ry="21"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
        />
        <ellipse
          cx="262"
          cy="240"
          rx="34"
          ry="17"
          fill="none"
          stroke={DIM}
          strokeWidth="0.9"
        />
        <S d="M262 240V224M262 240L277 248" sw={1.2} />
        <circle cx="262" cy="240" r="1.8" fill="#fff" />
      </>
    );
  },

  emr: () => {
    const mk = (cy: number): B => ({ cx: 170, cy, hw: 96, hh: 48, h: 12 });
    const top = mk(154);
    const ecg: [number, number][] = [
      [0.08, 0],
      [0.3, 0],
      [0.37, -10],
      [0.44, 14],
      [0.52, -26],
      [0.6, 12],
      [0.68, 0],
      [0.92, 0],
    ];
    const d =
      "M" +
      ecg
        .map(([s, dy]) => {
          const p = topPt(top, s, 0.5);
          return `${p[0]} ${p[1] + dy}`;
        })
        .join("L");
    return (
      <>
        <Box b={mk(222)} dim />
        <Box b={mk(188)} dim />
        <Box b={top} />
        <S d={lineD(topPt(top, 0.08, 0.2), topPt(top, 0.5, 0.2))} dim />
        <S d={lineD(topPt(top, 0.08, 0.82), topPt(top, 0.42, 0.82))} dim />
        <S d={d} sw={1.5} />
        <Box b={{ cx: 270, cy: 84, hw: 16, hh: 8, h: 16 }} dim />
        <S d="M60 84V108M48 96H72" dim />
      </>
    );
  },

  industry: () => {
    const base: B = { cx: 170, cy: 238, hw: 112, hh: 56, h: 16 };
    const chim: B = { cx: 238, cy: 96, hw: 14, hh: 7, h: 86 };
    const main: B = { cx: 158, cy: 182, hw: 88, hh: 44, h: 54 };
    return (
      <>
        <Box b={base} dim />
        <Box b={chim} dim />
        <Box b={main} />
        {[0.18, 0.5, 0.82].map((s) => {
          const p = topPt(main, s, 0.5);
          return (
            <Box
              key={s}
              b={{ cx: p[0], cy: p[1] - 16, hw: 13, hh: 6.5, h: 16 }}
            />
          );
        })}
        <S d={faceQuad(main, "l", 0.08, 0.28, 0.25, 0.6)} sw={0.9} />
        <S d={faceQuad(main, "l", 0.72, 0.92, 0.25, 0.6)} sw={0.9} />
        <S d={faceQuad(main, "r", 0.15, 0.4, 0.25, 0.6)} sw={0.9} />
        <S d={faceQuad(main, "r", 0.6, 0.85, 0.25, 0.6)} sw={0.9} />
        <S
          d={`${lineD(
            facePt(main, "l", 0.38, 0.45),
            facePt(main, "l", 0.62, 0.45)
          )}${lineD(facePt(main, "l", 0.5, 0.2), facePt(main, "l", 0.5, 0.7))}`}
          sw={1.3}
        />
        <circle cx="238" cy="74" r="6" fill="none" stroke={DIM} />
        <circle cx="248" cy="56" r="9" fill="none" stroke={DIM} />
        <circle cx="236" cy="34" r="12" fill="none" stroke={DIM} />
      </>
    );
  },

  dental: () => {
    const base: B = { cx: 170, cy: 246, hw: 104, hh: 52, h: 16 };
    return (
      <>
        <Box b={base} dim />
        <Box b={{ cx: 92, cy: 232, hw: 16, hh: 8, h: 14 }} dim />
        <Box b={{ cx: 248, cy: 232, hw: 16, hh: 8, h: 14 }} dim />
        <ellipse
          cx="170"
          cy="226"
          rx="56"
          ry="14"
          fill="none"
          stroke={DIM}
          strokeWidth="0.9"
        />
        <path
          transform="translate(55.8 -5.6) scale(1.9)"
          d="M36 24C24 24 18 36 22 52c3 12 6 22 8 36 1 10 5 16 10 16 6 0 7-16 10-24 2-5 18-5 20 0 3 8 4 24 10 24 5 0 9-6 10-16 2-14 5-24 8-36 4-16-2-28-14-28-9 0-16 6-24 6s-15-6-24-6z"
          fill="none"
          stroke="#fff"
          strokeWidth="1.15"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          transform="translate(55.8 -5.6) scale(1.9)"
          d="M34 38c-5 2-8 7-8 14"
          fill="none"
          stroke={DIM}
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <S d="M268 70V94M256 82H280" dim />
      </>
    );
  },

  pharmacy: () => (
    <>
      <ellipse
        cx="170"
        cy="238"
        rx="96"
        ry="48"
        fill="none"
        stroke={DIM}
        strokeWidth="0.9"
      />
      <ellipse
        cx="170"
        cy="238"
        rx="80"
        ry="40"
        fill="none"
        stroke={DIM}
        strokeWidth="0.9"
      />

      {/* bottle */}
      <path
        d="M126 124V230A44 22 0 0 0 214 230V124"
        fill="none"
        stroke="#fff"
        strokeWidth="1.1"
      />
      <ellipse
        cx="170"
        cy="124"
        rx="44"
        ry="22"
        fill="none"
        stroke="#fff"
        strokeWidth="1.1"
      />
      <S d="M126 160A44 22 0 0 0 214 160" dim />
      <S d="M126 204A44 22 0 0 0 214 204" dim />
      <S d="M170 172V198M157 185H183" sw={1.3} />
      {/* cap */}
      <path
        d="M132 98V122A38 19 0 0 0 208 122V98"
        fill="none"
        stroke="#fff"
        strokeWidth="1.1"
      />
      <ellipse
        cx="170"
        cy="98"
        rx="38"
        ry="19"
        fill="none"
        stroke="#fff"
        strokeWidth="1.1"
      />
      <ellipse
        cx="170"
        cy="98"
        rx="28"
        ry="14"
        fill="none"
        stroke={DIM}
        strokeWidth="0.9"
      />

      {/* capsule */}
      <g transform="translate(272 262) rotate(-28)">
        <rect
          x="-42"
          y="-14"
          width="84"
          height="28"
          rx="14"
          fill="none"
          stroke="#fff"
          strokeWidth="1.1"
        />
        <path d="M0 -14V14" stroke={DIM} strokeWidth="0.9" />
      </g>
      {/* tablet */}
      <path
        d="M56 268v8A22 11 0 0 0 100 276v-8"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
      />
      <ellipse
        cx="78"
        cy="268"
        rx="22"
        ry="11"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
      />
      <S d="M62 268H94" dim />
    </>
  ),

  records: () => {
    const c: B = { cx: 178, cy: 104, hw: 56, hh: 28, h: 150 };
    const sl = (cy: number): B => ({ cx: 78, cy, hw: 56, hh: 28, h: 10 });
    const lock: B = { cx: 270, cy: 226, hw: 20, hh: 10, h: 24 };
    return (
      <>
        <Box b={c} />
        {(["l", "r"] as const).map((side) => (
          <React.Fragment key={side}>
            <S
              d={lineD(facePt(c, side, 0, 0.34), facePt(c, side, 1, 0.34))}
              dim={side === "r"}
            />
            <S
              d={lineD(facePt(c, side, 0, 0.67), facePt(c, side, 1, 0.67))}
              dim={side === "r"}
            />
            {[0.14, 0.47, 0.8].map((v) => (
              <S
                key={v}
                d={faceQuad(c, side, 0.3, 0.7, v, v + 0.06)}
                dim={side === "r"}
                sw={0.9}
              />
            ))}
          </React.Fragment>
        ))}
        <Box b={sl(240)} dim />
        <Box b={sl(226)} />
        <S d={lineD(topPt(sl(226), 0.15, 0.5), topPt(sl(226), 0.6, 0.5))} dim />
        <Box b={lock} />
        <S d="M258 226A12 12 0 0 1 282 226" sw={1.6} />
        <S d="M270 70V94M258 82H282" dim />
      </>
    );
  },

  theatre: () => {
    const table: B = { cx: 170, cy: 238, hw: 104, hh: 48, h: 12 };
    return (
      <>
        <ellipse
          cx="170"
          cy="324"
          rx="56"
          ry="12"
          fill="none"
          stroke={DIM}
          strokeWidth="0.9"
        />
        <S d="M170 298V322" />
        <Box b={table} />
        <S d="M142 224L198 252M142 252L198 224" sw={1.2} />

        {/* beam */}
        <path
          d="M122 102L82 236M218 102L258 236"
          stroke={DIM}
          strokeWidth="1"
          strokeDasharray="2 5"
          fill="none"
        />

        {/* lamp */}
        <S d="M170 54V8" sw={1.4} />
        <path
          d="M106 76V92A64 22 0 0 0 234 92V76"
          fill="none"
          stroke="#fff"
          strokeWidth="1.1"
        />
        <ellipse
          cx="170"
          cy="76"
          rx="64"
          ry="22"
          fill="none"
          stroke="#fff"
          strokeWidth="1.1"
        />
        <ellipse
          cx="170"
          cy="76"
          rx="40"
          ry="14"
          fill="none"
          stroke={DIM}
          strokeWidth="0.9"
        />
        {[130, 150, 170, 190, 210].map((x, i) => (
          <circle
            key={x}
            cx={x}
            cy={i % 2 === 0 ? 106 : 112}
            r="3"
            fill="none"
            stroke={DIM}
          />
        ))}
      </>
    );
  },
  lab: () => {
    const base: B = { cx: 170, cy: 250, hw: 104, hh: 52, h: 16 };
    const rack: B = { cx: 170, cy: 222, hw: 66, hh: 33, h: 10 };
    const tube = (x: number, y: number, tall: number, liquid: number) => (
      <g key={`${x}-${y}`}>
        <path
          d={`M${x - 8} ${y - tall}V${y - 6}A8 4 0 0 0 ${x + 8} ${y - 6}V${y - tall}`}
          fill="none"
          stroke="#fff"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <ellipse
          cx={x}
          cy={y - tall}
          rx="8"
          ry="4"
          fill="none"
          stroke="#fff"
          strokeWidth="1.1"
        />
        <path
          d={`M${x - 8} ${y - liquid}A8 4 0 0 0 ${x + 8} ${y - liquid}`}
          fill="none"
          stroke={DIM}
          strokeWidth="0.9"
        />
      </g>
    );
    const p1 = topPt(rack, 0.22, 0.5);
    const p2 = topPt(rack, 0.5, 0.5);
    const p3 = topPt(rack, 0.78, 0.5);
    return (
      <>
        <Box b={base} dim />
        <Box b={rack} />
        {tube(p1[0], p1[1], 78, 34)}
        {tube(p2[0], p2[1], 66, 40)}
        {tube(p3[0], p3[1], 84, 24)}
        <S d="M262 96H282M266 96V136L244 182H300L278 136V96" sw={1.2} />
        <S d="M252 164H292" dim />
        <S d="M60 84V108M48 96H72" dim />
      </>
    );
  },

  security: () => {
    const base: B = { cx: 170, cy: 270, hw: 100, hh: 46, h: 14 };
    const lock: B = { cx: 272, cy: 226, hw: 18, hh: 9, h: 22 };
    return (
      <>
        <Box b={base} dim />
        <ellipse
          cx="170"
          cy="248"
          rx="54"
          ry="24"
          fill="none"
          stroke={DIM}
          strokeWidth="0.9"
        />
        <g transform="translate(170 126) scale(0.8) translate(-170 -143)">
          <S d="M170 52L236 76V142C236 188 206 218 170 234C134 218 104 188 104 142V76Z" sw={1.4} />
          <S d="M170 72L220 90V142C220 178 198 200 170 212C142 200 120 178 120 142V90Z" dim />
          <S d="M146 144L164 162L196 126" sw={2} />
        </g>
        <Box b={lock} />
        <S d="M260 226A12 12 0 0 1 284 226" sw={1.6} />
        <S d="M58 90V114M46 102H70" dim />
      </>
    );
  },

  ward: () => {
    const floor: B = { cx: 170, cy: 244, hw: 112, hh: 56, h: 12 };
    const frame: B = { cx: 170, cy: 200, hw: 76, hh: 38, h: 16 };
    const a = topPt(frame, 0, 0);
    const b = topPt(frame, 0, 1);
    const head = pathOf([a, b, [b[0], b[1] - 34], [a[0], a[1] - 34]]);
    return (
      <>
        <Box b={floor} dim />
        <Box b={frame} />
        <S d={head} sw={1.1} />
        <S d={topQuad(frame, 0.08, 0.3, 0.2, 0.8)} sw={0.9} />
        <S d={topQuad(frame, 0.38, 0.94, 0.1, 0.9)} dim sw={0.9} />
        <S d="M262 84V226M250 84H274" sw={1.2} />
        <S d="M258 90H270V120H258Z" dim />
        <S d="M250 226H274" dim />
        <path
          d="M64 112L64 218"
          stroke={DIM}
          strokeWidth="1"
          strokeDasharray="2 5"
          fill="none"
        />
        {[86, 98, 110].map((x) => (
          <circle key={x} cx={x} cy="84" r="3" fill="none" stroke={DIM} />
        ))}
        <S d="M70 40V64M58 52H82" dim />
      </>
    );
  },

};

export const Art = ({ name }: { name: ArtName }) => (
  <svg
    viewBox="0 0 340 340"
    preserveAspectRatio="xMidYMid meet"
    className="h-full w-full"
    fill="none"
    aria-hidden="true"
  >
    {scenes[name]()}
  </svg>
);
