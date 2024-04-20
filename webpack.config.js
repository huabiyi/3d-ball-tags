
module.exports = function(env, argv) {

	//// 使用 argv 来获取 config-name 参数的值, 区分不同的构建环境
	let config_name = argv["config-name"];

	if(argv.mode != "production")return require("./configs/webpack.start");

	return require('./configs/webpack.'+config_name);
}