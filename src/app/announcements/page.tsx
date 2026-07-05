import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPublicAnnouncements } from "@/lib/db/public";
import { statusToAccent } from "@/lib/db/serializers";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Public MxF Labs announcements, releases, maintenance notices, alerts, and product updates.",
};

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const announcements = await getPublicAnnouncements();

  return (
    <>
      <PageHero
        eyebrow="Announcements"
        title="Product updates, releases, and studio notices."
        description="Public announcements are managed from the private MxF Labs admin dashboard and surfaced here automatically."
      />
      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-4">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="surface rounded-lg p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <StatusBadge tone={statusToAccent(announcement.type)}>{announcement.type}</StatusBadge>
                  <h2 className="mt-4 text-2xl font-semibold text-white">{announcement.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/60">{announcement.body}</p>
                </div>
                {announcement.pinned ? (
                  <span className="rounded-md border border-[#f7b955]/24 bg-[#f7b955]/10 px-3 py-2 text-xs text-[#ffe1a3]">
                    Pinned
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
