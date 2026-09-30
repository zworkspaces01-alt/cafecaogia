"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";
import { localizeHref } from "@/i18n/config";

/** next/link that keeps visitors in their current language by prefixing internal paths. */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { lang } = useParams<{ lang?: string }>();
  return <NextLink href={typeof href === "string" ? localizeHref(href, lang) : href} {...props} />;
}
