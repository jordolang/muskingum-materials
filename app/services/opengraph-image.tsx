import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og/template";

export const alt =
  "Material supply and delivery services from Muskingum Materials in Zanesville, Ohio";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    title: "Material Supply & Delivery",
    subtitle: "Up to 20 tons per load across Central & Southeastern Ohio",
  });
}
