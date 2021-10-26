const webpack = require("webpack");
const Path = require("path");
const autoprefixer = require("autoprefixer");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

let plugins = [
  new HtmlWebpackPlugin({
    title: "Eluvio Live Manager",
    template: Path.join(__dirname, "src", "index.html"),
    cache: false,
    filename: "index.html",
    favicon: "./src/static/icons/favicon.png"
  }),
  new CopyWebpackPlugin({
    patterns: [{
      from: Path.join(__dirname, "configuration.js"),
      to: Path.join(__dirname, "dist", "configuration.js")
    }]
  }),
];

if(process.env.ANALYZE_BUNDLE) {
  plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
  entry: {
    index: "./src/index.js"
  },
  target: "web",
  output: {
    path: Path.resolve(__dirname, "dist"),
    filename: pathData => pathData.chunk.name === "index" ? "index.js" : "[name].[contenthash].js"
  },
  devServer: {
    allowedHosts: "all",
    port: 8100,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Allow-Methods": "POST"
    }
  },
  optimization: {
    /*
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true
        }
      })
    ],

     */
    splitChunks: {
      chunks: "all"
    }
  },
  mode: "development",
  devtool: "eval-source-map",
  plugins,
  resolve: {
    alias: {
      Assets: Path.resolve(__dirname, "src/static"),
      Components: Path.resolve(__dirname, "src/components"),
      Stores: Path.resolve(__dirname, "src/stores"),
      Utils: Path.resolve(__dirname, "src/utils"),
      // Force webpack to use *one* copy of bn.js instead of 8
      "bn.js": Path.resolve(Path.join(__dirname, "node_modules", "bn.js")),
      "react": "preact/compat",
      "react-dom": "preact/compat",

      // Not necessary unless you consume a module using `createClass`
      'create-react-class': 'preact-compat/lib/create-react-class',
      // Not necessary unless you consume a module requiring `react-dom-factories`
      'react-dom-factories': 'preact-compat/lib/react-dom-factories'
    },
    extensions: [".js", ".jsx", ".scss", ".png", ".svg"]
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 2
            }
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [ "autoprefixer" ]
                ]
              }
            }
          },
          "sass-loader"
        ]
      },
      {
        test: /\.js$/,
        loader: "esbuild-loader",
        options: {
          loader: "jsx",  // Remove this if you're not using JSX
          target: "es2015"  // Syntax to compile to (see options below for possible values)
        }
      },
      {
        test: /\.svg$/,
        loader: "svg-inline-loader"
      },
      {
        test: /\.(woff2?|ttf)$/i,
        loader: "file-loader",
      },
      {
        test: /\.(gif|png|jpe?g)$/i,
        use: [
          "file-loader",
          {
            loader: "image-webpack-loader"
          },
        ],
      },
      {
        test: /\.(txt|bin|abi)$/i,
        loader: "raw-loader"
      }
    ]
  }
};

