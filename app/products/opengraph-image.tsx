import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og/template";

export const alt =
  "Sand, gravel & aggregate products from Muskingum Materials in Zanesville, Ohio";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    title: "Sand, Gravel & Aggregate Products",
    subtitle: "State approved materials, weighed on state-approved scales",
  });
}
