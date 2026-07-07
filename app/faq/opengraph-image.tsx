import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og/template";

export const alt =
  "Frequently asked questions about Muskingum Materials products and delivery";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    title: "Frequently Asked Questions",
    subtitle: "Materials, delivery, and hours",
  });
}
