
const path = require("path");
const { override } = require("customize-cra");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = override(
  // Override output config
  (config) => {
    config.output = {
      ...config.output,
      path: path.resolve(__dirname, "dist"),
      filename: "static/js/worldFlightPedia.js", // js name
      publicPath: "./", // relative paths
    };

    // Disable code splitting
    config.optimization.splitChunks = false;
    config.optimization.runtimeChunk = false;

    return config;
  },

  // Override HTML output filename
  (config) => {
    config.plugins = config.plugins.map((plugin) => {
      if (plugin instanceof HtmlWebpackPlugin) {
        plugin.options.filename = "worldFlightPedia.html";
        plugin.options.minify = {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
        };
      }
      return plugin;
    });
    return config;
  },

  // Override CSS extraction (no hashes)
  (config) => {
    config.plugins = config.plugins.map((plugin) => {
      if (plugin instanceof MiniCssExtractPlugin) {
        return new MiniCssExtractPlugin({
          filename: "static/css/worldFlightPedia.css", // fixed name
        });
      }
      return plugin;
    });
    return config;
  },

  // copy json and media files to dist
  (config) => {
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "src/media"), // source folder
            to: "static/media/[name][ext]",             // keeps original name
            globOptions: {
              ignore: ["**/*.{png,jpg,jpeg,gif,svg}"], // optional: ignore images
            },
          },
        ],
      })
    );

    return config;
  }
);
