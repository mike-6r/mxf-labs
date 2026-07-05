import { Megaphone } from "lucide-react";
import Link from "next/link";

type BannerAnnouncement = {
  title: string;
  body: string;
  type: string;
};

export function AnnouncementBanner({
  announcement,
}: {
  announcement?: BannerAnnouncement | null;
}) {
  if (!announcement) {
    return null;
  }

  return (
    <div className="border-b border-white/8 bg-[#07090d]/82 px-5 py-3 backdrop-blur-xl md:px-8">
      <Link
        href="/announcements"
        className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-white/76 transition hover:text-white sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[#ff8a8a]">
            <Megaphone className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="font-mono text-xs text-[#ff8a8a]">{announcement.type}</span>
            <span className="ml-2 font-semibold">{announcement.title}</span>
          </span>
        </span>
        <span className="text-white/52 sm:max-w-lg sm:text-right">{announcement.body}</span>
      </Link>
    </div>
  );
}
