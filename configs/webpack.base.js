/*
 *  基础配置，即多个文件中共享的配置
 */

const paramConfig = require('./webpack.params');

const path = require('path');

const glob = require(paramConfig.require_path+'glob');

const fs = require('fs');
const os = require("os");

const webpack =  require(paramConfig.require_path+'webpack');

const HappyPack = require(paramConfig.require_path+"happypack");
const HtmlWebpackPlugin = require(paramConfig.require_path+'html-webpack-plugin');
const CleanWebpackPlugin = require(paramConfig.require_path+'clean-webpack-plugin');
const CopyWebpackPlugin = require(paramConfig.require_path+'copy-webpack-plugin');
//Vue-loader 15.*之后的版本，vue-loader使用需要伴生VueLoaderPlugin 	//*************** */ vue 全家桶添加loader
const VueLoaderPlugin = require(paramConfig.require_path+'vue-loader/lib/plugin');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });

function getEntry(globPath) {
    //获取globPath路径下的所有文件
    let files = glob.sync(globPath);
    let entries = {},
        entry, dirname, basename, pathname, extname;
    //循环
    for (let i = 0; i < files.length; i++) {
        entry = files[i];
        dirname = path.dirname(entry);//返回路径的所在的文件夹名称
        extname = path.extname(entry);//返回指定文件名的扩展名称
        /**
         * path.basename(p, [ext])
         * 返回指定的文件名，返回结果可排除[ext]后缀字符串
         * path.basename('/foo/bar/baz/asdf/quux.html', '.html')=>quux
         */
        basename = path.basename(entry, extname);
        pathname = path.join(dirname, basename);//路径合并
        entries[basename] = entry;
    }
    //返回map=>{fileName:fileUrl}
    return entries;
}

//获取所有的入口文件
let jsEntries = getEntry('./src/js/entry/*.js');

//jsEntries["nicescroll"] = ['./src/css/ny.less','./src/js/lib/nicescroll.js'];

let config = {
	//入口
	entry: jsEntries,
	//loader配置
	module: {
		//lib文件夹内容不使用loader
		rules: [
			//*************** */ vue 全家桶添加loader
			{
		        test: /\.vue$/,
		        use: ['vue-loader']
		    },
			//使用 Babel
			{
				test: /\.js$/, // 支持 js
				exclude: [/node_modules/,/lib/],
				include : /src/,
				use: ['happypack/loader?id=babel']
			},
			//图片处理
			{
				test: /\.(png|jpg|jpeg|gif|svg)$/,
				use: [{
					loader: 'file-loader',
					options: {
						outputPath: 'img',
						name: '[name]_[contenthash:8].[ext]'
					}
				}]
			},
			//字体格式
			{
				test: /\.(ttf|eot|woff|woff2|otf)$/,
				use: [{
					loader: 'file-loader',
					options: {
						outputPath: 'font',
						name: '[name]_[contenthash:8].[ext]'
					}
				}]
			},
			//多媒体格式
			{
				test: /\.(mp3|mp4)$/,
				use: [{
					loader: 'file-loader',
					options: {
						outputPath: 'media',
						name: '[name]_[contenthash:8].[ext]'
					}
				}]
			},
			//art模板处理
			{
				test: /\.art$/,
            	use: "art-template-loader"
			},
			//html处理
			{
				test :  /\.html$/,
				exclude: /inline/, //不处理inline文件夹下的文件
				use : [
            		{
						loader : 'html-loader', //资源路径补全
						options: {
			                // 支持 html `${}` 语法
			                interpolate: 1
			            }
					},
					{
            			loader: 'html-supply-loader'  //inline、audio、video、a标签等路径补全
            		}
            	]
			}
		]
	},
	//外部引用jquery的import
	externals: {
      'jquery': 'window.jQuery'
    },
	//代码模块路径解析的配置
	resolve: {
		modules: [
			"node_modules",
			path.resolve(__dirname, '../src')
		],
		extensions: [".js", ".json"]
	},
	//添加lib第三方库的打包
	optimization: {
    	minimize: false,
		runtimeChunk : false,
		splitChunks: {
            cacheGroups: {
                vendor: {// 页面之间的公用代码
                	name : 'vendor',
                	test: path.resolve("src/js/lib/"),
                    chunks: 'all',
                    minChunks: 1,
                    enforce: true
                }
            }
        }
    },
	plugins: [
			//*************** */ vue 全家桶使用loader
		new VueLoaderPlugin(),
		new CleanWebpackPlugin(["dist/*","release/*"], {
            "root": path.resolve(__dirname, '../'),
            verbose: true,
            dry: false
        }),
        //内部项目的全局变量外放
        //new webpack.ProvidePlugin({
        //    THREE: 'js/lib/three.js'
        //}),
        //多进程处理babel转js
        new HappyPack({
        	id : "babel",
        	threadPool: happyThreadPool,
        	loaders : [
    			{
	        		loader :'babel-loader',
					options: {
						cacheDirectory : true,
	                    presets: [
							[
								'env',
								{
									modules: false // 不要编译ES6模块
								}
							]
						],
	                    plugins: [
	                    	[
							    "transform-runtime", {
							      "polyfill": false, //编译promise需要
							      "regenerator": true //编译async需要
							    }
						    ]
						]
	                }
            	},
            	{
            		loader : 'resload-loader'
            	}
            ]
		}),
		//data文件不加MD5
		new CopyWebpackPlugin([
			{
				from: path.join(__dirname,'../src/data/'),
				to : 'data'
			}
		])
	]
};

//获取所有html页面
let tplPages = Object.keys(getEntry('./src/*.html'));

tplPages.forEach((pathname)=> {
    let conf = {
    	chunksSortMode: 'manual',
        filename: pathname +'.html', //生成的html存放路径，相对于path
        template: './src/'+ pathname +'.html', //ejs模板路径,前面最好加上loader用于处理
        chunks : ['vendor',pathname]
    };

	//开发环境，将html加到入口中，实现自动刷新页面
	if (process.env.NODE_ENV === 'development') {

		config.entry["_refresh_html_"+pathname] = tplPages[pathname];
	}

    config.plugins.push(new HtmlWebpackPlugin(conf));
});

module.exports = config;