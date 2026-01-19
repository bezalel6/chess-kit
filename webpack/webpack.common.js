const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

module.exports = (env = {}) => {
    const browser = env.browser || 'chrome';
    const outputDir = browser === 'firefox' ? 'dist-firefox' : 'dist-chrome';
    const manifestFile = browser === 'firefox' ? 'manifest-firefox.json' : 'manifest-chrome.json';

    return {
        entry: {
            popup: path.join(srcDir, 'popup.tsx'),
            options: path.join(srcDir, 'options.tsx'),
            background: path.join(srcDir, 'background.ts'),
            content_script: path.join(srcDir, 'content_script.tsx'),
        },
        output: {
            path: path.join(__dirname, `../${outputDir}/js`),
            filename: "[name].js",
        },
        optimization: {
            splitChunks: {
                name: "vendor",
                chunks(chunk) {
                    return chunk.name !== 'background';
                }
            },
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.BROWSER': JSON.stringify(browser),
            }),
            new CopyPlugin({
                patterns: [
                    // Copy all files from public except manifest files
                    {
                        from: ".",
                        to: "../",
                        context: "public",
                        globOptions: {
                            ignore: ["**/manifest*.json"],
                        },
                    },
                    // Copy the correct manifest and rename it to manifest.json
                    {
                        from: manifestFile,
                        to: "../manifest.json",
                        context: "public",
                    },
                ],
                options: {},
            }),
        ],
    };
};
