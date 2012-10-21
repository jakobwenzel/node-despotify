var fs = require('fs');

var templates = {};

function getTemplate(templateName) {
	if (templates[templateName]!=undefined)
		return templates[templateName];
	var t = fs.readFileSync( __dirname + '/templates/'+templateName+'.html', 'utf8');
	console.log("loading "+templateName);
	templates[templateName] = t;
	return t;
}

//Replace subtemplate for each entry in vars array, concat results
function loopSubtemplate(template,vars) {
	var res = "";
	var delimiter = "";
	if (template.substring(0,1)=="!") {
		var pos = template.indexOf("###",1);
		delimiter = template.substring(1,pos);
		template = template.substring(pos+3);
	}
	var first = true;
	for (var i =0;i<vars.length;i++) {
		if (first) first = false; else res = res+delimiter;
		res = res+replaceSubtemplate(template,vars[i]);
	}
	return res;
}
//Replace patterns in template
function replaceSubtemplate(template,vars) {
	var t = template;
	
	//Find all array patterns
	for (var k in vars) {
		if (vars[k] instanceof Array) {
			//Find all matching subtemplates
			var regex = new RegExp('###'+k.toUpperCase()+'###[\\s\\S]*?###/'+k.toUpperCase()+'###',"g");
			var subtemps = t.match(regex);
			if (subtemps!=null) {
				//For each found subtemp
				for (var i=0;i<subtemps.length;i++) {
					var s = subtemps[i];
					//Strip delimiters
					var subtemp = s.substring(k.length+6,s.length-k.length-7);
					//Recursive templating
					var rep = loopSubtemplate(subtemp,vars[k]);
					//Replace in original, but only once
					t=t.replace(s,rep);			
				}
			}
		}
	}
	
	//Find all others
	for (var k in vars) {
		if (!(vars[k] instanceof Array)) {
			var regex = new RegExp('###'+k.toUpperCase()+'###',"g");
			t=t.replace(regex,vars[k]);
		}
	}
	return t;
}

function replace(templateName,vars) {	
	var template= getTemplate(templateName);
	return replaceSubtemplate(template,vars);
}

function loop(templateName,vars) {
	return replace(templateName,{loop: vars});
}

function clearCache() {
	templates = {};
}

exports.replace = replace;
exports.loop = loop;
exports.clearCache = clearCache;
