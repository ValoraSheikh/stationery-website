import Category from "@/components/Home/category";
import Hero from "@/components/Home/hero";
import Incentive from "@/components/Home/incentive";
import TrendingProducts from "@/components/Home/trendingProducts";

export default function Home() {
  return (
    <>
      <Hero/>
      <Category/>
      <TrendingProducts/>
      <Incentive/>
    </>
  );
}
