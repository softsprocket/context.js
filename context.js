


function Context () {
	this.varRegex = /{{([_a-zA-Z.]?[_a-zA-Z0-9]*)}}/;
	this.funcRegex = /{{(([_a-z]?[_a-zA-Z0-9]*)\s*\(\s*([_a-zA-Z]*[_a-zA-Z0-9]*|"[_a-zA-Z]*[_a-zA-Z0-9]*")\s*\))}}/;
	this.ctxRegex = /<\s*ctx\s*for\s*="([_a-zA-Z.][_a-zA-Z0-9.]*)"\s*>/
	this.ctxTermRegex = /<\/\s*ctx\s*>/	
}

Context.prototype.require = function (files, url, completionCallback) {
	var length = files.length;
	var texts = new Array (length);

	for (var i = 0; i < length; ++i) {
		var req = new XMLHttpRequest ();
		req.addEventListener('load', function (index, res) {
			console.log (res);
			texts[index] = res.target.responseText;
			length--;
			if (length == 0) {
				var scriptTag = document.createElement ('script');
				for (var i = 0; i < texts.length; ++i) {
					var fileNode = document.createTextNode (texts[i]);
					scriptTag.appendChild (fileNode);
				}

				document.body.appendChild (scriptTag);
				completionCallback (this);
			}
						
		}.bind (this, i));

		req.open('GET', url + '/' + files[i]);
		req.send();
	}
}


Context.prototype.template = function (tmplStr, tmplObj) {
	var getEndCtx = function (str) {
		var ctxEnd = str.match (this.ctxTermRegex);
		console.log (str, ctxEnd);
		if (!ctxEnd) {
			throw 'Malformed ctx tag';
		}

		var nxtCtx = str.match (this.ctxRegex);

		if (!nxtCtx || nxtCtx.index > ctxEnd.index) {
			return ctxEnd;
		}

		return getEndCtx (str.substring (nxtCtx.index + nxtCtx.length));
	}.bind (this);

	var ctxMatch = tmplStr.match (this.ctxRegex);
	
	while (ctxMatch) {
		var valStr = ctxMatch[1];
		var endCtx = getEndCtx (tmplStr.substring (ctxMatch.index + ctxMatch[0].length));
		var ctxPos = ctxMatch.index + ctxMatch[0].length;
		var ctxStr = tmplStr.substring (ctxPos, ctxPos + endCtx.index);

		var valArray = tmplObj[valStr];
		if (!Array.isArray (valArray)) {
			throw 'Non-array value as ctx value';
		}

		var replStr = '';
		for (var i = 0; i < valArray.length; ++i) {
			var rv = this.template (ctxStr, valArray[i]);
			console.log (rv);
			replStr += rv;
		}

		tmplStr = tmplStr.replace (tmplStr.substring (ctxMatch.index, ctxPos + endCtx.index + endCtx[0].length), replStr);

		ctxMatch = undefined;	

	}

	return this.ctxfreeTemplate (tmplStr, tmplObj);
}

Context.prototype.ctxfreeTemplate = function (tmplStr, tmplObj) {
	var funcMatch = tmplStr.match (this.funcRegex);

	while (funcMatch) {
		var key = funcMatch[2];
		var f = tmplObj[key];
		if (typeof f != 'function') {
			throw 'Template Error: missing function ' + key;
		}

		var res;
		var valueStr = funcMatch[3];
		if (valueStr && valueStr[0] == '"') {
			res = valueStr[0];
		} else if (valueStr && valueStr != 'values') {
			
			var vo = valueStr.split ('.');
			res = tmplObj[vo[0]];		
			if (vo.length > 1) {
				for (var i = 1; i < vo.length; ++i) {
					res = res[vo[i]];
				}	

			}
			
		} else {
			res = tmplObj;
		}

		var replacementValue = f (res);

		var newStr = tmplStr.substring (funcMatch.index + funcMatch[0].length);
		tmplStr = tmplStr.replace (funcMatch[0], replacementValue);
	
		funcMatch = newStr.match (this.funcRegex);

	}

	var varMatch = tmplStr.match (this.varRegex);

	while (varMatch) {
		var key = varMatch[1];
		var replacementValue;
		
	 	if (key == '.') {
			replacementValue = tmplObj;
		} else {	
			replacementValue = tmplObj[key];
		}

		var newStr = tmplStr.substring (varMatch.index + varMatch[0].length);
		tmplStr = tmplStr.replace (varMatch[0], replacementValue);
	
		varMatch = newStr.match (this.varRegex);

	}

	return tmplStr;
};


