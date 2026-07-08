import {
  renderOgImage,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og/template";
import { BUSINESS_INFO } from "@/data/business";

export const alt =
  "Contact Muskingum Materials for material availability and free estimates";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    title: "Call for a Free Estimate",
    subtitle: `${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}`,
  });
}
