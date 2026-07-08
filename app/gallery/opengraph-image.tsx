import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og/template";

export const alt =
  "Photos of the Muskingum Materials yard and aggregate stockpiles in Zanesville, Ohio";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    title: "The Yard",
    subtitle: "Stockpiles, processing & loading in Zanesville, Ohio",
  });
}
