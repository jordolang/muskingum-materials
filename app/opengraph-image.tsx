import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og/template";

export const alt =
  "Muskingum Materials — ODOT approved sand, gravel & aggregate supplier in Zanesville, Ohio";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    title: "ODOT Approved Sand, Gravel & Aggregate",
    subtitle: "Serving Central & Southeastern Ohio — up to 20 tons per load",
  });
}
