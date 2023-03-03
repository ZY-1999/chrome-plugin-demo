let webpack = require('webpack'),
  path = require('path'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin');

let alias = {
  'react-dom': '@hot-loader/react-dom',
  '@': path.resolve(__dirname, 'src/'),
};


let fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

let extensionDirName = 'demo'

//打包时cicd上指定了插件版本则使用指定的版本  否则使用package.json中的版本
const getPluginVersion = (env) => {
  let plugin_version = env.plugin_version;
  return plugin_version ? plugin_version : process.env.npm_package_version;
}


module.exports = (env) => {
  let plugin_version = getPluginVersion(env);
  let options = {
    mode: process.env.NODE_ENV === 'development' ? process.env.NODE_ENV : 'production',
    entry: {
      options: path.join(__dirname, 'src', 'options', 'index.tsx'),
      popup: path.join(__dirname, 'src', 'popup', 'index.tsx'),
      background: path.join(__dirname, 'src', 'background', 'background.ts'),
      content: path.join(__dirname, 'src', 'content', 'content.ts'),
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, extensionDirName),
      publicPath: './'
    },
    module: {
      rules: [
        {
          // look for .css or .scss files
          test: /\.(css|scss)$/,
          // in the `src` directory
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
          type: 'asset/resource',
          exclude: /node_modules/,
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
          exclude: /node_modules/,
        },
        {test: /\.(ts|tsx)$/, loader: 'ts-loader', exclude: /node_modules/},
        {
          test: /\.(js|jsx)$/,
          use: [
            {
              loader: 'source-map-loader',
            },
            {
              loader: 'babel-loader',
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      alias: alias,
      extensions: fileExtensions
        .map((extension) => '.' + extension)
        .concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
    },
    experiments: {
      topLevelAwait: true
    },
    plugins: [
      // expose and write the allowed env lets on the compiled bundle
      new webpack.DefinePlugin({
        'process.env.ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.VERSION': JSON.stringify(plugin_version)
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/manifest.json',
            to: path.join(__dirname, extensionDirName),
            force: true,
            transform: function (content, path) {
              // generates the manifest file using the package.json informations
              return Buffer.from(
                JSON.stringify({
                  description: process.env.npm_package_description,
                  version: plugin_version,
                  ...JSON.parse(content.toString()),
                })
              );
            },
          },
        ],
      }),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/assets/img/*.*',
            // to: path.join(__dirname, 'build'),
            to() {
              return Promise.resolve('[name].[ext]');
            },
            force: true,
          },
        ],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/rule',
            to: path.join(__dirname, extensionDirName, 'rule'),
            force: true,
          },
        ],
      }),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src', 'index.html'),
        filename: 'options.html',
        chunks: ['options'],
        cache: false,
      }),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src', 'index.html'),
        filename: 'popup.html',
        chunks: ['popup'],
        cache: false,
      }),
    ],
    infrastructureLogging: {
      level: 'info',
    },
  };

  if (process.env.NODE_ENV === 'development') {
    options.devtool = 'cheap-module-source-map';
  } else {
    options.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    };
  }
  return options;
}