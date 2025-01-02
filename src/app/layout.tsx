import '../index.css'

import type {Metadata} from 'next'

export const metadata: Metadata = {
    title: 'Censordle',
    description: 'The game of Censordle',
    manifest: 'manifest.json',
    icons: {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="100">🍿</text></svg>',
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body>
        <div id="root">{children}</div>
        </body>
        </html>
    )
}