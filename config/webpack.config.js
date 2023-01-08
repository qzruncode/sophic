const nodeExternals = require("webpack-node-externals");
const WebpackBar = require("webpackbar");
const path = require("path");

const config = {
  mode: "production",
  watch: true,
  stats: "errors-warnings",
  context: path.resolve(__dirname, "../"),
  entry: path.resolve(__dirname, "../src/index.ts"),
  output: {
    path: path.resolve(__dirname, "../", "build"),
    filename: "index.js",
    clean: true,
    globalObject: 'this',
    library: {
      name: 'sophic',
      type: 'umd',
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
    modules: ["node_modules", path.resolve(__dirname, "../", "src")],
  },
  plugins: [
    new WebpackBar(),
  ],
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)?$/,
        exclude: /(node_modules|config|public|build|env|static)/,
        use: [
          {
            loader: require.resolve("thread-loader"),
            options: {
              workers: 4,
              workerParallelJobs: 100,
            },
          },
          {
            loader: require.resolve("babel-loader"),
            options: {
              presets: [
                [require.resolve("@babel/preset-env")],
                require.resolve("@babel/preset-typescript"),
              ],
              cacheDirectory: true,
            },
          },
        ],
      },
    ],
  },
  externals: [nodeExternals()],
};
module.exports = config;
