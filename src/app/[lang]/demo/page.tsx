import DemoPage from "@/components/landing-page/demo/demo";
import DnaSection from "@/components/landing-page/home/animated-dna";
import Cells from "@/components/landing-page/home/dna/cells";

const page = () => {
  return (
    <div>
      <div className="relative w-full h-[210px] overflow-hidden bg-black">
        <Cells />
      </div>
      <DemoPage />
      <DnaSection />
    </div>
  );
};

export default page;
