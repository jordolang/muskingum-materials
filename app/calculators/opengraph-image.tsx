import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og/template";

export const alt =
  "Material quantity calculators from Muskingum Materials";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    title: "Material Calculators",
    subtitle: "Figure the tons of sand, gravel, or aggregate you need",
  });
}
