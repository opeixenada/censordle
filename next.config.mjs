const isGithubActions = process.env.GITHUB_ACTIONS || false

let assetPrefix = ''
let basePath = ''

if (isGithubActions) {
    assetPrefix = `/censordle/`
    basePath = `/censordle`
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    assetPrefix: assetPrefix,
    basePath: basePath,
    images: {
        unoptimized: true,
    },
};

export default nextConfig;