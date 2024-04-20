/*
 *  本地开发环境使用的配置
 */

const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const paramConfig = require('./webpack.params');

const path = require('path');

//loader
const config = merge.smart(baseConfig, {

	output: {
		path: path.resolve(__dirname, '../debug'),
		filename: '[name]_[hash:8].js'
	},

	module: {
		rules: [
			//构建 CSS
			{
				test: /\.css$/,
				include: [
					path.resolve(__dirname, '../src'),
				],
				use: ['style-loader','css-loader']

			},

			//CSS 预处理器
			{
				test: /\.less$/,
				// 因为这个插件需要干涉模块转换的内容，所以需要使用它对应的 loader
				use: ['style-loader','css-loader','less-loader']
			},
			{
				test : /\.html$/,
				use : [
            		{
						loader : 'html-include-loader',
						options: {
			                host: paramConfig.include_host,
			                encode : paramConfig.encode
			            }
					}
				]
			}
		]
	},

	//设置本地开发环境
	devServer: {
		port: 80, //设置端口
		host : "127.0.0.1",
		disableHostCheck : true,
		hot : true //是否开启热更，调试html时候关闭，调试css与js开启
	},
	devtool: 'source-map'

})

//plugins
config.plugins.push(
	new webpack.DefinePlugin({
		__DEBUG: JSON.stringify(true),
		__CDNPATH : JSON.stringify("http://127.0.0.1:80/")
	}),
	//热更新的两个插件
	new webpack.NamedModulesPlugin(),
	new webpack.HotModuleReplacementPlugin()
)

module.exports = config;