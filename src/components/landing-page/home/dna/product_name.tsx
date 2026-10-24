import { productName } from "@/constants/site";
import { PRIMARY_COLOR } from "@/constants/colors";
import { T } from "@/i18n/provider";

export default function ProductNameHome() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
      <p
        aria-hidden="true"
        className="m-0 w-full text-center text-[clamp(4.2rem,18vw,14rem)] font-black leading-[0.8] tracking-tighter text-[#ffffff] text-left md:text-[clamp(12rem,19vw,12rem)]"
      >
        <T>{productName}</T>
        <span style={{ color: PRIMARY_COLOR }}>.</span>
      </p>
    </div>
  );
}