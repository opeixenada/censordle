import "../index.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Censordle",
  description: "The game of Censordle",
  manifest: "manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
