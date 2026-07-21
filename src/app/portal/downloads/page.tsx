import { AlertTriangle, BookOpen, Download, LifeBuoy, PackageOpen } from "lucide-react";
import Link from "next/link";
import { PortalShell, PortalSignIn } from "@/components/portal/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Downloads | MxF Labs" };

export default async function PortalDownloadsPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <PortalShell title="Downloads" description="Sign in to access purchased product downloads." customer={null}>
        <PortalSignIn />
      </PortalShell>
    );
  }

  const licenses = await prisma.license.findMany({
    where: { customerId: customer.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  const usableLicenses = licenses.filter(isUsableLicense);
  const productIds = usableLicenses.map((license) => license.productId).filter((id): id is string => Boolean(id));
  const downloads = await prisma.productDownload.findMany({
    where: { productId: { in: productIds }, visible: true },
    include: { product: true, release: true },
    orderBy: [{ createdAt: "desc" }],
  });
  const licenseByProduct = new Map(usableLicenses.filter((license) => license.productId).map((license) => [license.productId, license]));
  const blockedLicenses = licenses.filter((license) => !isUsableLicense(license));

  return (
    <PortalShell
      title="Secure downloads."
      description="Release files are gated by product ownership, active license status, and short-lived download tokens."
      customer={customer}
    >
      {blockedLicenses.length ? (
        <div className="mb-5 grid gap-3">
          {blockedLicenses.map((license) => (
            <div key={license.id} className="rounded-lg border border-[#f7b955]/18 bg-[#f7b955]/8 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#f7b955]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#ffe1a3]">{license.product?.name || "Product"} download access needs review.</p>
                    <p className="mt-1 text-xs leading-5 text-[#ffe1a3]/72">
                      {license.blacklisted ? "This license is blacklisted." : `License status is ${license.status}.`} Open support if this looks wrong.
                    </p>
                  </div>
                </div>
                <Link href="/portal/support" className="inline-flex min-h-9 w-fit items-center gap-2 rounded-md border border-[#f7b955]/24 bg-black/20 px-3 text-xs font-semibold text-[#ffe1a3] transition hover:bg-[#f7b955]/10">
                  <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                  Open support
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {downloads.length ? (
        <div className="grid gap-5">
          {downloads.map((download) => {
            const license = licenseByProduct.get(download.productId);
            const blocked = !license;
            return (
              <article key={download.id} className={blocked ? "surface rounded-lg p-5 opacity-75" : "surface-strong rounded-lg p-5"}>
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">{download.product.name} / {download.fileType}</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{download.filename}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/54">
                      {download.release?.notes || "Latest downloadable release attached to your product ownership."}
                    </p>
                  </div>
                  <span className={blocked ? "w-fit rounded-md border border-[#f7b955]/20 bg-[#f7b955]/8 px-3 py-2 text-xs font-semibold text-[#ffe1a3]" : "w-fit rounded-md border border-[#ff6262]/25 bg-[#ff6262]/10 px-3 py-2 text-xs font-semibold text-[#ffd8d8]"}>
                    {blocked ? "Blocked" : "Ready"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Latest version" value={`v${download.version}`} />
                  <Metric label="File type" value={download.fileType} />
                  <Metric label="File size" value={formatFileSize(download.fileSize)} />
                  <Metric label="Release date" value={(download.release?.publishedAt || download.createdAt).toLocaleDateString()} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {blocked ? (
                    <Link href="/portal/support" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#f7b955]/22 bg-[#f7b955]/8 px-3 text-sm font-semibold text-[#ffe1a3] transition hover:bg-[#f7b955]/12">
                      <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                      Resolve access
                    </Link>
                  ) : (
                    <a className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black" href={`/api/downloads/${download.id}`}>
                      <Download className="relative z-10 h-4 w-4" aria-hidden="true" />
                      <span className="relative z-10">Secure download</span>
                    </a>
                  )}
                  <Link href={download.product.documentationLink || "/docs"} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/35 hover:text-white">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Docs
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={PackageOpen}
          title={licenses.length ? "No downloads available yet." : "No products owned yet."}
          description={
            licenses.length
              ? "Your licenses are present, but no visible downloadable files have been published for those products yet."
              : "Downloads appear here after a purchase, manual license assignment, or Discord-created product access."
          }
          action={{ label: licenses.length ? "Open support" : "Browse products", href: licenses.length ? "/portal/support" : "/products" }}
        />
      )}
    </PortalShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
      <p className="text-xs text-white/36">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (!bytes) return "Not recorded";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isUsableLicense(license: { status: string; blacklisted: boolean; expirationDate: Date | null }) {
  return license.status === "Active" && !license.blacklisted && (!license.expirationDate || license.expirationDate > new Date());
}
