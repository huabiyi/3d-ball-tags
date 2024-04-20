// import Axios from 'axios'
// import axiosJsonpAdapter from 'axios-jsonp'
// const apiHost = "https://test-interact2.webapp.163.com/g97simulate";
const apiHost = __DEBUG ? 'https://test-interact2.webapp.163.com/g97simulate' : 'https://interact2.webapp.163.com/g97simulate'
// const apiHost = "https://interact2.webapp.163.com/g97simulate";





export async function apiBase(url,params){

	let axioUrl = apiHost+url;

	// params = Object.assign(params,{
	// 	random: new Date().getTime()
	// });

	axios.defaults.withCredentials = true;

	return axios({
		methods : 'get',
	    url: axioUrl,
	    params : params,
	    adapter: axiosJsonpAdapter
	}).then( result => {
		// console.log(result.data);
		return result.data
	});
	
}
