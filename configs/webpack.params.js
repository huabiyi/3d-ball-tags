const os = require("os").platform();

module.exports = {
	"require_path" : os == "linux" ? "/usr/local/lib/node_modules/" : "",
	"sprite_limit" : 8192,
	"include_host" : "https://stzb.163.com/",
	"encode" : "utf-8",
	"cdn_path_dist" : "http://t.modiarts.com/2022/other/pc/tag-family/dist/",
	"cdn_path_release" : "https://stzb.res.netease.com/m/zt/20220331114724/"
}