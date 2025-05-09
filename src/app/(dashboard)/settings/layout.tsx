"use client";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8 md:py-10">
      <div className="flex flex-col gap-8">{children}</div>
    </div>
  );
}
