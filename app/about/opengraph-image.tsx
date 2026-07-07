import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og/template";

export const alt =
  "About Muskingum Materials, an ODOT qualified aggregate supplier in Zanesville, Ohio";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    title: "About Muskingum Materials",
    subtitle: "ODOT qualified aggregate supplier in Zanesville, Ohio",
  });
}
