/*
 *  正式环境使用的配置
 */

const paramConfig = require('./webpack.params');
const webpack = require(paramConfig.require_path+'webpack');
const merge = require(paramConfig.require_path+'webpack-merge');
const baseConfig = require('./webpack.base');

const path = require('path')
const os = require("os");

const HappyPack = require(paramConfig.require_path+"happypack");
const MiniCssExtractPlugin = require(paramConfig.require_path+"mini-css-extract-plugin");
const TerserPlugin = require(paramConfig.require_path+'terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require(paramConfig.require_path+'optimize-css-assets-webpack-plugin');

const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });

// webpack-merge 提供的 smart 方法，可以帮助我们更加轻松地处理 loader 配置的合并
const config = merge.smart(baseConfig, {
	output: {

		path: path.resolve(__dirname, '../release'),
		filename: 'js/[name]_[contenthash:8].js',
		publicPath: paramConfig.cdn_path_release
	},
	optimization: {
		minimize : true,
    	minimizer: [
    		new OptimizeCSSAssetsPlugin({}),
    		new TerserPlugin({})
    	]
    },
	plugins : [
		new MiniCssExtractPlugin({
	      filename: "css/[name]_[contenthash:8].css",
	      publicPath : "css"
	    }),
	    new HappyPack({
	    	id : "less",
	    	threadPool: happyThreadPool,
	    	loaders : [
				'css-loader',
				'sprites-loader',
				'less-loader'
			]
	    })
	],
	module: {
		rules: [
			//构建 CSS
			{
				test: /\.css$/,
				include: [
					path.resolve(__dirname, '../src'),
				],
				use: [
					MiniCssExtractPlugin.loader,
					'style-loader', //会将 css-loader 解析的结果转变成 JS 代码，运行时动态插入 style 标签来让 CSS 代码生效
					'css-loader'
				]

			},

			//CSS 预处理器
			{
				test: /\.less$/,
				// 因为这个插件需要干涉模块转换的内容，所以需要使用它对应的 loader
				use: [MiniCssExtractPlugin.loader,'happypack/loader?id=less']
			}
		]
	}


})

//plugins
config.plugins.push(
	new webpack.DefinePlugin({
		__DEBUG: JSON.stringify(false),
		__CDNPATH : JSON.stringify(paramConfig.cdn_path_release)
	})
)

module.exports = config;