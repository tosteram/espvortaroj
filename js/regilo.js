/* Elektronikaj Esperantaj Vortaroj kun retumilo
File	regilo.js
Date:
2014-07-09	Espvortaroj version 1.0
2014-07-31	version 2.0
2014-08-03~15	v2.1
2015-05-15~23	v2.2 link to "vorto:xxx"; do search after selecting from history. 
					search history
	06-15	use cookie ??;

Copyright (C) 2014-2015, Tositaka TERAMOTO & FUKUMOTO Hirotsugu.
Permission to use, copy, modify, and distribute this software and 
its documentation for any purpose (including commercial use) is hereby granted 
without fee, provided that the above copyright notice appear in all 
copies and that both that copyright notice and this permission 
notice appear in supporting documentation.
This file is provided "as is" without express or implied warranty.
*/

//--- constants ---
var IMG_loaded="sistem_img/Book.gif";
var IMG_unloaded="sistem_img/Unladen.gif";
var IMG_add="sistem_img/Add.gif";
var IMG_remove="sistem_img/Remove.gif";
var IMG_open="sistem_img/Open.gif";
var IMG_closed="sistem_img/Closed.gif";
var IMG_book="sistem_img/Book.gif";
var IMG_books="sistem_img/Books.gif";

//--- ---
var o_dicts= {};
	//{name: {chk:chk.elem, img:img.elem, sel:selected, laden:_, color:_}, ...}
var searchHistory= [];
var o_compstr= null;
//
window.onload= function() {
	//language
	if (!lang_file) {
		try {
			var lang= (navigator.browserLanguage || navigator.language ||
					navigator.userLanguage).substr(0,2);
			var i;
			for (i=0; i<available_langs.length; ++i) {
				if (lang==available_langs[i]) {
					lang_file= "lang_"+lang+".js";
					break;
				}
			}
		} catch(e) {
			;
		}
		if (!lang_file)
			lang_file="lang_eo.js";
	}
	var script= document.createElement("script");
	script.type= "text/javascript";
	script.src= "js/" + lang_file;
	document.body.appendChild(script);
	//callback_lang() will be called when load completed.

	//default options
	document.body.style.fontFamily= defaultOpts["font_family"];
	document.body.style.fontSize= defaultOpts["font_size"];
	
	var list_width= defaultOpts["list_width"];
	document.getElementById("results").style.width= list_width+"px";
	document.getElementById("v_sash").style.left= (list_width+5)+'px';
	document.getElementById("defpane").style.left= (list_width+10)+"px";

	var elem= document.getElementById(defaultOpts["searchRange"]);
	if (elem)
		elem.checked= true;
	elem= document.getElementById(defaultOpts["entrySearch"]);
	if (elem)
		elem.checked= true;
	document.getElementById("match_word_entiretext").checked=
		defaultOpts["entiretext_wordSearch"];
	document.getElementById("showdefs").checked= defaultOpts["showAfterSearch"];
	document.getElementById("retain").checked= defaultOpts["retain"];
	document.getElementById("usePool").checked= defaultOpts["usePool"];
	document.getElementById("chk_colorize").checked= defaultOpts["colorize"];
	document.getElementById("btn_toPool").style.display= (defaultOpts["usePool"])?"inline":"none";
	elem= document.getElementById(defaultOpts["howDisplayDefs"]);
	if (elem)
		elem.checked= true;
	document.getElementById("maxdefs").value= defaultOpts["maxDefs"];
	elem= document.getElementById(defaultOpts["sort"]);
	if (elem) {
		elem.checked= true;
	}

	//event handlers
	addEventHandler(document.getElementById("searchstr"), "keydown", inputSearchStr);
	addEventHandler(document.getElementById("selectSchHistory"), "keydown", schHistoryKeyPress);
	addEventHandler(document.getElementById("results"), "click", onShowDef);
	addEventHandler(document.getElementById("defs"), "click", onDefClicked);

	elem= document.getElementById("dict_name");
	addEventHandler(elem, "mouseover", showDictName);
	addEventHandler(elem, "mouseout", hideTip);

	var imgs=document.getElementsByTagName("img");
	for (var i=0; i<imgs.length; ++i) {
		if (imgs[i].className=="button") {
			addEventHandler(imgs[i], "mouseover", showTip);
			addEventHandler(imgs[i], "mouseout", hideTip);
		}
	}

	initDragDrop();

	// make SelDictsDialog and load dictionaries after having read the language js
	// in callback_lang()

//	var schhistory= getCookie("schhistory");
//	if (schhistory)
//		searchHistory= schhistory.split(',');

	document.getElementById("searchstr").focus();
}

// called when the language file has been loaded
function callback_lang() {
	//help link
	document.getElementById("help_doc").href= lang_href_help;
	//buttons
	var key;
	for (key in lang_button) {
		var elem= document.getElementById(key);
		if (elem)
			elem.value= lang_button[key];
	}
	//labels
	for (key in lang_lbl) {
		var elem= document.getElementById(key);
		if (elem)
			elem.appendChild(document.createTextNode(lang_lbl[key]));
	}

	// Dictionary dialog
	makeSelDictsDialog();

	// load the default dictionaries or show dialog
	if (defaultDicts.length>0) {
		var i;
		// set selected
		for (i=0; i<defaultDicts.length; ++i) {
			o_dicts[defaultDicts[i]].sel= true;
		}
		initDictTitle(defaultDicts.length>1);
		// load the dictionaries
		for (i=0; i<defaultDicts.length; ++i) {
			loadDict(defaultDicts[i]);
		}
	}
	else {
		showSelDictsDialog(true);
	}
}

// create a dialog to load and select dictionaries
function makeSelDictsDialog() {
	var frag= document.createDocumentFragment();
	
	//app version
	var elem=document.createElement("div");
	elem.className="titlebar";
	elem.appendChild(document.createTextNode("Espvortaroj "+version));
	frag.appendChild(elem);

	elem=document.createElement("div");
	elem.style.textAlign="right";
	elem.style.color="grey";
	elem.appendChild(document.createTextNode(lang_str["dict_load"]));
	frag.appendChild(elem);

	//head
	elem=document.createElement("h6");
	elem.appendChild(document.createTextNode(lang_str["dict_target"]));
	frag.appendChild(elem);

	//
	var n=0;
	var name;
	for (name in dictionaries) {
		++n;
		var D= dictionaries[name];

		// <div> <img-right> <label><radiobutton>dic.name<br>dic.ver</label> </div>
		elem= document.createElement("div");

		var img= document.createElement("img");
		img.id= "img_"+name;
		img.name= "loadState";
		img.className= "btn";
		img.src= IMG_unloaded;
		img.align="right";
		addEventHandler(img, "click", onClickDictImg);
		//addEventHandler(img, "mouseover", showTip);
		//addEventHandler(img, "mouseout", hideTip);
		elem.appendChild(img);

		var label= document.createElement("label");
		var chkbox= document.createElement("input");
		chkbox.type="checkbox";
		chkbox.id= "chk_"+name;
		chkbox.name= "chk_dict";
		addEventHandler(chkbox, "click", onClickDict);
		label.appendChild(chkbox);

		label.appendChild(document.createTextNode(n+'. '+D["name"]));
		label.appendChild(document.createElement("br"));
		var span= document.createElement("span");
		span.appendChild( document.createTextNode(D["edition"]) );
		span.style.paddingLeft="20px";
		label.appendChild(span);
		elem.appendChild(label);

		var color= D.color;
		if (!color)
			color= bgcolors[n-1];

		o_dicts[name]= {'idx':n, 'chk':chkbox, 'img':img, 'sel':false, 'laden':false,
						'color':color};
		frag.appendChild(elem);
	}

	frag.appendChild(document.createElement("hr"));
	//buttons
	var span= document.createElement("span");
	span.innerHTML="&nbsp;&nbsp;<input type='button' value='"+lang_str["ok"]+"' onclick='selDictsOK()'>&nbsp;<input type='button' value='"+lang_str["cancel"]+"' onclick='showSelDictsDialog(false)'>";
	span.style.marginLeft="50px;";
	frag.appendChild(span);

	document.getElementById("seldicts").appendChild(frag);
}

function loadDict(dictName) {
	var script= document.createElement("script");
	script.type= "text/javascript";
	script.src= "vortaroj/" + dictionaries[dictName]["dict_js"];
	script.id="js_"+dictName;
	document.body.appendChild(script);
}
function unloadDict(dictName) {
	var D= dictionaries[dictName];
	D["dict"]= null;
	D["conv1"]= null;
	D["conv2"]= null;
	D["makeEntry"]=null;
	D["makeDef"]= null;
	
	o_dicts[dictName].laden= false;

	var elem= document.getElementById("js_"+dictName);
	elem.parentNode.removeChild(elem);
}

// called when the dictionary has been loaded
function callback(name, dict, funs) {
	var D= dictionaries[name];
	D["dict"]= dict;
	D["conv1"]= funs["conv1"];
	if (!D["conv1"])
		D["conv1"]= conv1_default;
	D["conv2"]= funs["conv2"];
	if (!D["conv2"])
		D["conv2"]= conv2_default;
	D["makeEntry"]= funs["makeEntry"];
	if (!D["makeEntry"])
		D["makeEntry"]= makeEntry_default;
	D["makeDef"]= funs["makeDef"];
	if (!D["makeDef"])
		D["makeDef"]= makeDef_default;

	o_dicts[name].laden= true;
	if (o_dicts[name].sel)
		showDictTitle(name);
}

function initDictTitle(multi) {
	//img select_dicts, span dict_name
	var img= document.getElementById("select_dicts");
	var title= document.getElementById("dict_name");
	title.innerHTML= "";
	title.appendChild(document.createTextNode(lang_lbl.dict_name));
	if (multi) {
		img.src= IMG_books;
		var frag= document.createDocumentFragment();
		var id;
		for (id in o_dicts) {
			var d= o_dicts[id];
			if (d.sel) {
				var e= document.createElement("span");
				e.className="dict_n";
				e.setAttribute('params', id);
				e.innerHTML= d.idx;
				frag.appendChild(e);
			}
			title.appendChild(frag);
		}
	}
	else {
		img.src= IMG_book;
	}
}
function showDictTitle(name) {
	var img= document.getElementById("select_dicts");
	var title= document.getElementById("dict_name");
	if (img.src.indexOf(IMG_book)>=0) {
		//single
		title.replaceChild(
			document.createTextNode(dictionaries[name].name),
			title.firstChild);
	}
	else {
		//multiple
		var ch= title.firstChild;
		while (ch) {
			if (ch.nodeType==1) {	//element?
				var p= ch.getAttribute('params');
				if (p && p==name) {
					ch.style.color='black';
					ch.style.backgroundColor= o_dicts[name].color;
					return;
				}
			}
			ch= ch.nextSibling;
		}
	}
}

function inputSearchStr(e) {
	var evt;
	if (window.event) {
		evt= window.event;
	}
	else {
		evt= e;
	}
	var key= evt.keyCode;
	if (!key) {
		key= evt.charCode;	//for Firefox
	}

	var cancel= false;
	if (key==13) {			//[Enter] key
		search();
		cancel= true;
	}
	else if (key==40) {		//[Down] key
		showSearchHistory();
		cancel= true;
	}
	else if (key==27) {		//27 [Esc]
		setTimeout("clearSearchStr()", 100);
		cancel= true;
	}
//	else {
//		//Other char key
//		setTimeout(search, 10);
//	}

	if (cancel) {
		if (isIE()) {
			evt.returnValue=false;
			evt.cancelBubble=true;
		}
		else {
			evt.preventDefault();
			evt.stopPropagation();
		}
	}
}

function addToStack(stack, item, max) {
	var i;
	for (i=0; i<stack.length; ++i) {
		if (stack[i]==item) {		//the same data exists
			stack.splice(i, 1);		// delete it
			break;
		}
	}
	stack.push(item);
	if (stack.length>max) {
		stack.shift();
	}

//	createCookie("schhistory", stack.join(','), 1, "/");
}

function search() {
	
	var selectedDicts= getSelectedDicts();
	if (selectedDicts.length==0) {
		showSelDictsDialog(true);
		showMessageBox(lang_str["msg_selectDict"]);
		return;
	}

	var schstr= document.getElementById("searchstr").value;
	schstr= schstr.replace(/^\s*(.*?)\s*$/, "$1");	//trim both
	if (schstr=="")
		return;

	addToStack(searchHistory, schstr, defaultOpts["maxSearchHistory"]);

	var maxdefs= parseInt(document.getElementById("maxdefs").value);
	if (!maxdefs)
		maxdefs= 100;
	var showdefs= document.getElementById("showdefs").checked;
	if (!showdefs)
		maxdefs= 0;

	// panes
	var results=document.getElementById("results");
	results.innerHTML="";

	var defpane= document.getElementById("defs");
	if (document.getElementById("retain").checked) {
		maxdefs -= defpane.childNodes.length-1;
		if (maxdefs < 0)
			maxdefs= 0;
	}
	else {
		deleteAllDefs(defpane);
	}

	// fragments to be appended
	var frag_res= document.createDocumentFragment();
	var frag_def= document.createDocumentFragment();

	// start searching
	var entiretext= document.getElementById("range_entiretext").checked;
	if (entiretext)
		search_alltext(selectedDicts, schstr, frag_res, frag_def, maxdefs);
	else
		search_entries(selectedDicts, schstr, frag_res, frag_def, maxdefs);

	// Title of the list
	var hits= frag_res.childNodes.length;
	hits= (hits==1)? (hits+lang_str["hit1"]) : (hits+lang_str["hit2"]);
	var div= entryListHead(hits, "k");

	// show all
	results.appendChild(div);
	results.appendChild(frag_res);
	defpane.appendChild(frag_def);

	document.getElementById("searchstr").focus();
}

function getSelectedDicts() {
	var select=[];
	var name;
	for (name in o_dicts) {
		var d=o_dicts[name];
		if (d.sel && d.laden)
			select.push(name);
	}
	return select;
}

function search_entries(dicts, schstr, frag_ent, frag_def, maxdefs) {
	var colorize= document.getElementById("chk_colorize").checked;
	var arr=[];	// [[name,index],...]
	var n;
	for (n=0; n<dicts.length; ++n) {
		var name= dicts[n];
		var D= dictionaries[name];
		var Dict= D.dict;
		
		var str= D.conv1(schstr);
		var re;
		var schAllEntries= false;
		if (document.getElementById("match_prefix").checked)
			re= new RegExp("^"+str, "i");
		else if (document.getElementById("match_complete").checked)
			re= new RegExp("^"+str+"$", "i");
		else {
			re= new RegExp(str, "i");
			schAllEntries= true;
		}

		var matched= false;
		for (var i=0; i<Dict.length; ++i) {
			if (re.test(Dict[i][0])) {
				arr.push([name, i]);
				matched=true;
			}
			else if (matched && !schAllEntries) {
				break;
			}
		} //end. for a dict
	} //end. for dicts

	if (dicts.length>1) {
		o_compstr=
			(document.getElementById("sort_esp").checked)?
					compEspStr :
			(document.getElementById("sort_local").checked)?
					function(s1,s2){return s1.localeCompare(s2);} : 
					null;
		if (o_compstr)
			arr.sort(compWords);
	}

	var count=0;
	for (n=0; n<arr.length; ++n) {
		var name= arr[n][0];
		var idx= arr[n][1];
		var D= dictionaries[name];
		var entry= D.dict[idx];
		var color= o_dicts[name].color;

		//
		var div= D.makeEntry(entry, name+" "+idx, "r");
		if (colorize)
			div.style.backgroundColor= color;

		frag_ent.appendChild(div);

		++count;
		if (count<=maxdefs) {
			div= makeDefWButton(D.makeDef, entry, IMG_add, name);
			if (colorize)
				div.style.backgroundColor= color;
			frag_def.appendChild(div);
		}
	}
}

function search_alltext(dicts, schstr, frag_ent, frag_def, maxdefs) {
	var colorize= document.getElementById("chk_colorize").checked;
	var n;
	for (n=0; n<dicts.length; ++n) {
		var name= dicts[n];
		var D= dictionaries[name];
		var Dict= D.dict;
		var color= o_dicts[name].color;

		var str= D.conv2(schstr);
		var re;
		if (document.getElementById("match_word_entiretext").checked //)
				&& isAllAlphabet(str)) {
			re= new RegExp("\\b"+str+"\\b", "i");
		}
		else {
			re= new RegExp(str, "i");
		}

		var count=0;
		for (var i=0; i<Dict.length; ++i) {
			var entry= Dict[i];
			if (re.test(entry[0]) ||
				re.test(entry[1]) ||
				re.test(entry[2])
				) {
				//
				var div= D.makeEntry(entry, name+" "+i, "r");
				if (colorize)
					div.style.backgroundColor= color;
				frag_ent.appendChild(div);
				++count;
				if (count<=maxdefs) {
					var div= makeDefWButton(D.makeDef, entry, IMG_add, name);
					if (colorize)
						div.style.backgroundColor= o_dicts[name].color;
					frag_def.appendChild(div);
				}
			}
		}
	}
}

// TODO: check up again and justify
function isAllAlphabet(str) {
	var i;
	for (i=0; i<str.length; ++i) {
		if (str.charAt(i)>"\u06ff")		//latin, greek, cyril, hebrew, arabian, etc.
			return false;
	}
	return true;
//	return /^[a-z ĉĝĥĵŝŭ]+$/.test(str);
}

function compWords(elem1, elem2) {
	var s1= dictionaries[elem1[0]].dict[elem1[1]][0];
	var s2= dictionaries[elem2[0]].dict[elem2[1]][0];
	return o_compstr(s1.toLowerCase(), s2.toLowerCase());
}
function compEspStr(s1,s2) {
	var table={	'ĉ':'cx', 'ĝ':'gx', 'ĥ':'hx', 'ĵ':'jx', 'ŝ':'sx', 'ŭ':'ux'};
	for (var i=0; ;++i) {
		var s1end= i>=s1.length;
		var s2end= i>=s2.length;
		if (s1end && s2end)
			return 0;
		else if (s1end)
			return -1;
		else if (s2end)
			return 1;
		else {
			var c1= s1.charAt(i);
			var c2= s2.charAt(i);
			if (table[c1])
				c1= table[c1];
			if (table[c2])
				c2= table[c2];
			if (c1<c2)
				return -1;
			else if (c1>c2)
				return 1;
		}
	}
}

//---------------------------
// POOL
//---------------------------
function getPool(show) {
	var pool= document.getElementById("pool");
	var content= document.getElementById("poolContent");
	var img= document.getElementById("img_pool");
	if (show!=undefined) {
		img.src= IMG_open;
		pool.style.display= (show)? "block":"none";
		if (show)
			content.style.display="block";
	}
	return [pool, content, img];
}

function moveToPool(entryDiv) {
	entryDiv.firstChild.src= IMG_remove;
	var pool= getPool(true);
	pool[1].appendChild(entryDiv);	//move to Pool
}

function moveAllToPool() {
	var pool= getPool();
	var frag= document.createDocumentFragment();
	var par= pool.parentNode;		//'div' defs
	var ch= pool[0].nextSibling;	// first def-'div'
	while (ch) {
		ch.firstChild.src= IMG_remove;
		var nextCh= ch.nextSibling;
		frag.appendChild(ch);
		ch= nextCh;
	}
	if (frag.childNodes.length>0) {
		pool[1].appendChild(frag);
		pool[2].src= IMG_open;
		pool[0].style.display= "block";
		pool[1].style.display= "block";
	}
	else {
		pool[0].style.display="none";	//nothing added?
	}
}

function emptyPool() {
	var pool= getPool(false);
	pool[1].innerHTML= "";
}

function removeFromPool(div) {
	var pool= getPool(true);
	pool[1].removeChild(div);
	if (pool[1].childNodes.length==0) {
		pool[0].style.display="none";
	}
}

function foldPool() {
	var pool= getPool();
	if (pool[2].src.indexOf(IMG_open)>=0) {
		pool[1].style.display="none";
		pool[2].src= IMG_closed;
	}
	else {
		pool[1].style.display="block";
		pool[2].src= IMG_open;
	}
}

// x notation to diacritical chars
function chapeligu(str) {
	var table={	'c':'ĉ', 'g':'ĝ', 'h':'ĥ', 'j':'ĵ', 's':'ŝ', 'u':'ŭ',
				'C':'Ĉ', 'G':'Ĝ', 'H':'Ĥ', 'J':'Ĵ', 'S':'Ŝ', 'U':'Ŭ'};
	var outstr="";
	for (var i=0; i<str.length; ++i) {
		var c= str.charAt(i);
		if (c=='x' || c== 'X') {
			var len= outstr.length;
			var prev= (len>0)? outstr.charAt(len-1) : '';
			var cc= table[prev];
			if (cc) {
				outstr= outstr.substring(0, len-1) + cc;
			}
			else {
				outstr += c;
			}
		}
		else {
			outstr += c;
		}
	}
	return outstr;
}

// japanese long signs to vowels
function longToVowel(str) {
	var tbls= [
		"あかさたなはまやらわがざだばぱぁゃ",
		"いきしちにひみりぎじぢびぴぃ",
		"うくすつぬふむゆるぐずづぶぷぅゅ",
		"えけせてねへめれげぜでべぺぇ",
		"おこそとのほもよろごぞどぼぽぉょ"];
	var vowels= "あいうえお";

	var outstr= "";
	var i, j;
	for (i=0; i<str.length; ++i) {
		var c= str.charAt(i);
		if (c=='ー' || c=='－') {
			var c0= (i>0)? str.charAt(i-1) : '　';
			for (j=0; j<5; ++j) {
				if (tbls[j].indexOf(c0)>=0) {
					c= vowels[j];
					break;
				}
			}
		}
		outstr += c;
	}
	return outstr;
}

//
var hiragana= {
	a:"あ", i:"い", u:"う", e:"え", o:"お",
	ka:"か", ki:"き", ku:"く", ke:"け", ko:"こ",
	ga:"が", gi:"ぎ", gu:"ぐ", ge:"げ", go:"ご",
	sa:"さ", si:"し", su:"す", se:"せ", so:"そ",
	za:"ざ", zi:"じ", zu:"ず", ze:"ぜ", zo:"ぞ",
	ta:"た", ti:"ち", tu:"つ", te:"て", to:"と",
	da:"だ", di:"ぢ", du:"づ", de:"で", "do":"ど",
	na:"な", ni:"に", nu:"ぬ", ne:"ね", no:"の",
	ha:"は", hi:"ひ", hu:"ふ", he:"へ", ho:"ほ",
	ba:"ば", bi:"び", bu:"ぶ", be:"べ", bo:"ぼ",
	pa:"ぱ", pi:"ぴ", pu:"ぷ", pe:"ぺ", po:"ぽ",
	ma:"ま", mi:"み", mu:"む", me:"め", mo:"も",
	ya:"や", yu:"ゆ", yo:"よ",
	ra:"ら", ri:"り", ru:"る", re:"れ", ro:"ろ",
	wa:"わ", wo:"を",
	n:"ん",

	kya:"きゃ", kyu:"きゅ", kye:"きぇ", kyo:"きょ",
	gya:"ぎゃ", gyu:"ぎゅ", gye:"ぎぇ", gyo:"ぎょ",
	sya:"しゃ", syu:"しゅ", sye:"しぇ", syo:"しょ",
	zya:"じゃ", zyu:"じゅ", zye:"じぇ", zyo:"じょ",
	tya:"ちゃ", tyu:"ちゅ", tye:"ちぇ", tyo:"ちょ",
	dya:"ぢゃ", dyu:"ぢゅ", dye:"ぢぇ", dyo:"ぢょ",
	nya:"にゃ", nyu:"にゅ", nye:"にぇ", nyo:"にょ",
	hya:"ひゃ", hyu:"ひゅ", hye:"ひぇ", hyo:"ひょ",
	bya:"びゃ", byu:"びゅ", bye:"びぇ", byo:"びょ",
	pya:"ぴゃ", pyu:"ぴゅ", pye:"ぴぇ", pyo:"ぴょ",
	mya:"みゃ", myu:"みゅ", mye:"みぇ", myo:"みょ",
	rya:"りゃ", ryu:"りゅ", rye:"りぇ", ryo:"りょ",

	sha:"しゃ", shi:"し", shu:"しゅ", she:"しぇ", sho:"しょ",
	ja:"じゃ", ji:"じ", ju:"じゅ", je:"じぇ", jo:"じょ",
	cha:"ちゃ", chi:"ち", chu:"ちゅ", che:"ちぇ", cho:"ちょ",
	dja:"ぢゃ", dji:"ぢ", dju:"ぢゅ", dje:"ぢぇ", djo:"ぢょ",
	tsa:"つぁ", tsi:"つぃ", tsu:"つ", tse:"つぇ", tso:"つぉ",
	dza:"づぁ", dzi:"づぃ", dzu:"づ", dze:"づぇ", dzo:"づぉ",
	dsa:"づぁ", dsi:"づぃ", dsu:"づ", dse:"づぇ", dso:"づぉ",
	fa:"ふぁ", fi:"ふぃ", fu:"ふ", fe:"ふぇ", fo:"ふぉ",
	thi:"てぃ", thu:"とぅ", dhi:"でぃ", dhu:"どぅ",
	la:"ぁ", li:"ぃ", lu:"ぅ", le:"ぇ", lo:"ぉ",
	lya:"ゃ", lyu:"ゅ", lyo:"ょ",
};

//Japanese romanized spelling to Hiragana
function romajiToHiragana(str) {
	var outstr= "";
	var i= 0;
	while (i<str.length) {
		var syl= "";	//syllable
		var nxt= "";
		while (i<str.length) {
			var c= str.charAt(i);
			++i;
			if (c.charCodeAt(0)>=128) {	//possibly hiragana
				outstr += c;
				//syl= "";
			}
			else if (/[aiueo]/.test(c)) {
				syl += c;
				break;
			}
			else if (/[a-z]/.test(c)) {
				syl += c;
			}
			else if (/[ '-]/.test(c)) {	//delimiter
				break;
			}
			else {
				nxt= c;					//other ASCII chars
				break;
			}
		}
		if (syl) {
			var kana= hiragana[syl];
			if (kana)
				outstr += kana;
			else {
				var cons= syl.charAt(0);
				if (cons=='n' || cons=='m')
					outstr += "ん";
				else
					outstr += "っ";
				syl= syl.substring(1);
				kana= hiragana[syl];
				if (kana)
					outstr += kana;
			}
		}
		if (nxt)
			outstr += nxt;
	}

	return outstr;
}

function entryListHead(str, klass) {
	var div= document.createElement("div");
	div.className=klass;
	var txt= document.createTextNode(str);
	div.appendChild(txt);
	return div;
}

var conv1_default= function(str) {return chapeligu(str);}
var conv2_default= function(str) {return chapeligu(str);}

// One Entry in the entry-list
//klass: "k"=header, "r"=entry item,"g"=entry item(grey)
//index : index of the entry
var makeEntry_default= function(entry, params, klass) {
	var div= document.createElement("div");
	div.className=klass;
	div.setAttribute("params", params);
	var txt= document.createTextNode((entry[1])?entry[1]:entry[0]);
	div.appendChild(txt);
	return div;
}

// create one definition-entry
//entry [0]reading [1]entry word [2]definitions
var makeDef_default= function(entry) {
	var div=document.createElement("div");
	div.style.borderTop="dashed 1px lightgrey";
	div.style.paddingTop="2px";
	var h=document.createElement("span");
	h.innerHTML= "<b>"+((entry[1])? entry[1]:entry[0])+"</b>&nbsp; &nbsp; ";
	var d=document.createTextNode(entry[2]);
	div.appendChild(h);
	div.appendChild(d);
	return div;
}

var makeDef_html= function(entry) {
	var div=document.createElement("div");
	div.style.borderTop="dashed 1px lightgrey";
	div.style.paddingTop="2px";
	var h=document.createElement("span");
	h.innerHTML= "<b>"+((entry[1])? entry[1]:entry[0])+"</b>&nbsp; &nbsp; ";
	div.innerHTML= entry[2];
	div.insertBefore(h, div.firstChild);
	return div;
}

//<div params=... style=...>
//  <img (xbtn)>
//  <span><b>word</b>  </span>
//  ..html_def..
//</div>
function makeDefWButton(makeDef, entry, button, dict) {
	var div= makeDef(entry);
	div.setAttribute("params", dict);
	var img= document.createElement("img");
	img.src= button;
	img.className="xbtn";
	div.insertBefore(img, div.firstChild);
	return div;
}

function colorize(on) {
	var list= document.getElementById("results");
	var pool= document.getElementById("poolContent");
	var defs= document.getElementById("defs");
	colorizeEach(list, pool, defs, (on)? getColor : function(ch){return '';})
}
function colorizeEach(list, pool, defs, color) {
	var ch= list.firstChild;
	while (ch) {
		if (ch.nodeName=='DIV' && ch.className=='r') {
			ch.style.backgroundColor= color(ch);
		}
		ch= ch.nextSibling;
	}
	ch= pool.firstChild;
	while (ch) {
		if (ch.nodeName=='DIV') {
			ch.style.backgroundColor= color(ch);
		}
		ch= ch.nextSibling;
	}
	ch= defs.firstChild;
	while (ch) {
		if (ch.nodeName=='DIV' && !ch.id) {
			ch.style.backgroundColor= color(ch);
		}
		ch= ch.nextSibling;
	}
}
function getColor(div) {
	var attr= div.getAttribute('params');
	var params= attr.split(' ');
	return o_dicts[params[0]].color;
}

// Add to definition list, when the entry word is clicked
function onShowDef(evt) {
	var target;
	if (window.event)
		target= window.event.srcElement;
	else
		target= evt.target;
	var attr= target.getAttribute("params");
	if (!attr)
		return;		//this is the head

	var params= attr.split(' ');
	var dict= params[0];
	var index= parseInt(params[1]);

	var maxdefs= parseInt(document.getElementById("maxdefs").value);
	if (!maxdefs)
		maxdefs= 100;
	var onlyone= document.getElementById("showone").checked;
	var append= document.getElementById("append").checked;

	var defpane= document.getElementById("defs");

	var D= dictionaries[dict];
	var Dict= D.dict;
	//
	var div=makeDefWButton(D.makeDef, Dict[index], IMG_add, dict);
	if (document.getElementById("chk_colorize").checked) {
		div.style.backgroundColor= o_dicts[dict].color;
	}
	if (onlyone) {
		deleteAllDefs(defpane);
		defpane.appendChild(div);
	}
	else if (append) {
		defpane.appendChild(div);
		if (defpane.childNodes.length-1>maxdefs) {
			var ch= getPool()[0].nextSibling;
			defpane.removeChild(ch);
		}
	}
	else {	//(prepend)
		var ch= getPool()[0].nextSibling;
		if (ch)
			defpane.insertBefore(div, ch);
		else
			defpane.appendChild(div);
		if (defpane.childNodes.length-1>maxdefs) {
			defpane.removeChild(defpane.lastChild);
		}
	}

	document.getElementById("searchstr").focus();
}

function onDefClicked(evt) {
	var target;
	if (window.event) {
		evt= window.event;
		target= evt.srcElement;
	}
	else
		target= evt.target;

	if (target.className=="xbtn") {
		var elem= target.parentNode;
		if (document.getElementById("usePool").checked) {
			if (target.src.indexOf(IMG_add)>=0) {			// (+)
				moveToPool(elem);
			}
			else if (target.src.indexOf(IMG_remove)>=0) {	// (-)
				removeFromPool(elem);
			}
		}
	}
	else if (target.nodeName=="A") {
		if (target.href.indexOf("vorto:")==0) {
			var def_div= target.parentNode;
			var dicID= def_div.getAttribute("params");
			var D= dictionaries[dicID];
			var Dict= D.dict;
			var vorto= decodeURI(target.href.substring(6));	//conv. %xx
			var re= new RegExp("^"+vorto+"$", "i");
			var entry= false;
			for (var i=0; i<Dict.length; ++i) {
				if (re.test(Dict[i][0])) {
					entry= Dict[i];
					break;
				}
			}
			if (entry) {
				var imgsrc= def_div.firstChild.src;
				var div= makeDefWButton(D.makeDef, entry, imgsrc, dicID);
				if (document.getElementById("chk_colorize").checked)	//colorize?
					div.style.backgroundColor= o_dicts[dicID].color;
				def_div.parentNode.replaceChild(div, def_div);
			}
			// cancel the propagation
			if (isIE()) {
				evt.returnValue= false;
				evt.cancelBubble= true;
			} else {
				evt.preventDefault();
				evt.stopPropagation();
			}
		}
//		else {
//			allow event
//		}
	}
	else if (target.nodeName=='B') {
		// tricky !
		var dicID= target.parentNode.parentNode.getAttribute("params");
		if (dicID)
			showDictNameTip(dicID, evt, 1500);
	}
	// focus on the search box
	document.getElementById("searchstr").focus();
}

function showDictNameTip(dicID, evt, msec) {
	var dicname= dictionaries[dicID]["name"];

	clearTimeout(o_tiptimer);
	var elem=document.getElementById("tip");
	elem.style.left= (evt.clientX+15)+"px";
	elem.style.top= (evt.clientY)+"px";
	elem.innerHTML= dicname;
	elem.style.display="inline";

	o_tiptimer= setTimeout("hideTip()", msec);
}

function showDictName(evt) {
	var target;
	if (window.event) {
		evt= window.event;
		target= evt.srcElement;
	}
	else
		target= evt.target;

	if (target.className=='dict_n') {
		showDictNameTip(target.getAttribute('params'), evt, 3000);
	}
}

//---------------------------
// History
//---------------------------
// clicked on on [History] button
function showSearchHistory() {
	var sel= document.getElementById("selectSchHistory");
	sel.size= searchHistory.length;

	if (sel.style.display=="none") {
		//SHOW
		sel.innerHTML="";
		var frag= document.createDocumentFragment();
		var i;
		for (i=searchHistory.length-1; i>=0; --i) {
			var opt= document.createElement("option");
			opt.appendChild(document.createTextNode(searchHistory[i]));
			frag.appendChild(opt);
		}
		sel.appendChild(frag);
		var rect= document.getElementById("searchstr").getBoundingClientRect();
		sel.style.top= rect.bottom+"px";
		sel.style.left= (rect.left-5)+"px";
		sel.style.display="block";
		sel.focus();
	}
	else {
		//HIDE
		sel.style.display="none";
		document.getElementById("searchstr").focus();
	}
}
function schHistoryKeyPress(e) {
	var evt;
	if (window.event) {
		evt= window.event;
	}
	else {
		evt= e;
	}
	var key= evt.keyCode;
	if (!key) {
		key= evt.charCode;	//for Firefox
	}

	var cancel= false;
	if (key==13) {			//[Enter]
		onSearchHistory(e);
		cancel= true;
	}
	else if (key==27) {		//[ESC]
		showSearchHistory();
		cancel= true;
	}

	if (cancel) {
		if (isIE()) {
			evt.returnValue=false;
			evt.cancelBubble=true;
		}
		else {
			evt.preventDefault();
			evt.stopPropagation();
		}
	}
}
// clicked in the list of Search History
function onSearchHistory(evt) {
	var inpElem= document.getElementById("searchstr");
	var sel= document.getElementById("selectSchHistory");
	var ch= sel.firstChild;		//<option>
	while (ch) {
		if (ch.selected) {
			inpElem.value= getText(ch);
			search();
			break;
		}
		ch= ch.nextSibling;
	}
	sel.style.display="none";
	inpElem.focus();
}

// clicked on on [Clear] button
function clearSearchStr() {
	var elem= document.getElementById("searchstr");
	elem.value="";
	elem.focus();
}

//---------------------------
// dictionary dialog
//---------------------------
function onClickDict(evt) {
	var target;
	if (window.event)
		target= window.event.srcElement;
	else
		target= evt.target;
	
	var name= target.id.substring(4);	//id="chk_NAME"
	var checked= target.checked;		//true

	// update load/unload state
	if (!o_dicts[name].laden) {
		var img= document.getElementById("img_"+name);
		img.src= (checked)? IMG_loaded : IMG_unloaded;
	}

//	if (dictionaries[name]["dict"]) {
//		//already loaded
//		selDictsOK();
//	}
}

function onClickDictImg(evt) {
	var target;
	if (window.event)
		target= window.event.srcElement;
	else
		target= evt.target;
	var name= target.id.substring(4);	//id="img_NAME"
	
	// to unload state
	if (target.src.indexOf(IMG_loaded)>=0
		&& !document.getElementById("chk_"+name).checked) {
		target.src= IMG_unloaded;
	}
	else if (target.src.indexOf(IMG_unloaded)>=0
		&& o_dicts[name].laden) {
		target.src= IMG_loaded;
	}
}

// show/hide the sel.dicts dialog
function showSelDictsDialog(show) {
	var elem= document.getElementById("seldicts");
	if (show==undefined)
		show= elem.style.display=="none";	//toggle
	if (show) {
		// SHOW
		var name;
		for (name in o_dicts) {
			var d= o_dicts[name];
			// selected ?
			if (d.sel) {
				d.chk.checked= true;
			}
			// loaded ?
			d.img.src= (d.laden)? IMG_loaded : IMG_unloaded;
		}
		
		elem.style.display= "block";
	}
	else {
		// HIDE
		elem.style.display= "none";
		document.getElementById("searchstr").focus();
	}
}
function selDictsOK() {
	var select= [];
	var name;
	for (name in o_dicts) {
		var d= o_dicts[name];
		d.sel= d.chk.checked;
		//selected
		if (d.sel) {
			select.push(name);
		}
		//unload
		if (d.img.src.indexOf(IMG_unloaded)>=0 && d.laden) {
			unloadDict(name);
		}
	}

	//initialize the title
	initDictTitle(select.length>1);

	// check to see if dictionaries selected
	if (select.length==0) {
		showMessageBox(lang_str["msg_selectDict"]);
		return;
	}
	
	//load, show title
	var i;
	for (i=0; i<select.length; ++i) {
		var name= select[i];
		if (o_dicts[name].laden) {
			showDictTitle(name);
		}
		else {
			loadDict(name);
		}
	}

	// hide the dialog
	var elem= document.getElementById("seldicts");
	elem.style.display= "none";

	document.getElementById("searchstr").focus();
}

///////////////////////////////////
// 
function isIE() {
	return (navigator.userAgent.indexOf("MSIE") >= 0);
}

function addEventHandler(elem, evtname, handler) {
	if (isIE())
		elem.attachEvent("on"+evtname, handler);
	else
		elem.addEventListener(evtname, handler, false);
}
function removeEventHandler(elem, evtname, handler) {
	if (isIE())
		elem.detachEvent(evtname, handler);
	else
		elem.removeEventListener(evtname, handler, false);
}

// http://www.sitepoint.com/how-to-deal-with-cookies-in-javascript/
function createCookie(name, val, days, path, domain) {
	var date= new Date();
	date.setTime(date.getTime()+(days*24*60*60*1000));
	var cookie= name+"="+val+"; expires="+date.toGMTString();
	if (path)
		cookie += "; path="+path;
	if (domain)
		cookie += "; domain="+domain;
	document.cookie= cookie;
}
function getCookie(name) {
	var regexp = new RegExp("(?:^" + name + "|;\s*"+ name + ")=(.*?)(?:;|$)", "g");
	var result = regexp.exec(document.cookie);
	return (result === null) ? null : result[1];
}

function deleteAllDefs(defpane) {
	var pool= document.getElementById("pool");
	var ch= defpane.lastChild;
	while (ch && ch!=pool) {
		var ch2= ch.previousSibling;
		defpane.removeChild(ch);
		ch= ch2;
	}
}

function deleteAll() {
	var defpane= document.getElementById("defs");
	deleteAllDefs(defpane);
	document.getElementById("searchstr").focus();
}


function showOptionDialog(page) {
	var pages=["searchOpts", "dispOpts", "otherOpts"];	//page ID

	var dialog= document.getElementById("optionDialog");
	if (page==0) {
		dialog.style.display="none";
		document.getElementById("searchstr").focus();
	}
	else {
		var i;
		for (i=1; i<=pages.length; ++i) {
			var tab= document.getElementById("tab"+i);
			var div= document.getElementById(pages[i-1]);
			if (i==page) {
				tab.style.color= "black";
				div.style.display="block";
			}
			else {
				tab.style.color= "grey";
				div.style.display="none";
			}
		}
		dialog.style.display="block";
	}
}

function onShowDefSettings() {
	var elem= document.getElementById("dispOpts");
	if (elem.style.display=="none") {
		elem.style.display="block";
	}
	else {
		elem.style.display="none";
		document.getElementById("searchstr").focus();
	}
}
function use_Pool(chkbox) {
	var elem= document.getElementById("btn_toPool");
	elem.style.display= (chkbox.checked)? "inline":"none";
}

function showSearchOpts() {
	var elem= document.getElementById("searchOpts");
	if (elem.style.display=="none") {
		elem.style.display="block";
	}
	else {
		elem.style.display="none";
		document.getElementById("searchstr").focus();
	}
}

// highlighted selection
function getSel() {
	var sel= (window.getSelection)? window.getSelection():document.selection;
	return sel;
}
function getRange() {
	var sel= getSel();
	var rng= (sel.rangeCount>0)? sel.getRangeAt(0): sel.createRange();
	return rng;
}

function getText(elem) {
	var ch=elem.firstChild;
	while (ch) {
		if (ch.nodeType==3)
			return ch.nodeValue;
		ch=ch.nextSibling;
	}
	return "";
}
function getText_nest(elem) {
	//NB: NodeIterator doesn't work for <A>, why?
	var text= "";
	var ch= elem.firstChild;
	while (ch) {
		if (ch.nodeType==3)			//text
			text += ch.nodeValue;
		else if (ch.nodeType==1)	//element
			text += getText(ch);
		ch= ch.nextSibling;
	}
	return text;
}

// dragging
var dragging= null;
function initDragDrop() {
	document.onmousedown= onMouseDown;
	document.onmouseup= onMouseUp;
}
function onMouseDown(evt) {
	if (!evt)
		evt= window.event;
	var target= (evt.target)? evt.target : evt.srcElement;
	//left click: IE=1, Firefox=0
	//Mouse buttons
	// Click->	L	M	R
	// firefox	0	1	2
	// IE		1	4	2
	if (isIE() && evt.button==1 || evt.button==0) {
		var className= target.className;
		var elem, x, y;
		if (className=='titlebar') {
			target= target.parentNode;	//dialog!
			elem= target;
			x= parseInt(target.style.left);
			y= parseInt(target.style.top);
		}
		else if (className=='vsash') {
			elem= [
				document.getElementById("results"),
				target,
				document.getElementById("defpane")
				];
			x= parseInt(target.style.left);
			y= parseInt(target.style.top);
		}
		else {
			return;
		}
		dragging= {
			drag: className,
			elem: elem,
			startX: evt.clientX,
			startY: evt.clientY,
			offsetX: x,
			offsetY: y,
		};
		document.onmousemove= onMouseMove;
		document.body.focus();	//cancel out any text slections
		document.onselectstart= function(){return false;};	//prevent text selection in IE
		document.ondragstart= function(){return false;};	//prevent IE from trying to drag an image
		return false;	//prevent text selection (except IE)
	}
/*
	else if (evt.button==2) {
		//right button
		var rng= getRange();
		if (!rng.collapsed) {
			//-- with selection
			var frag= rng.cloneContents();
			var text= getText_nest(frag);
			// TODO
			var elem=document.getElementById("tip");
			elem.style.left= (evt.clientX)+"px";
			elem.style.top= (evt.clientY+20)+"px";
			elem.innerHTML= text;
			elem.style.display="inline";

			setTimeout("document.getElementById('tip').style.display='none'", 1000);
		}
	}
*/
}

function onMouseMove(evt) {
	if (!evt)
		evt= window.event;
	var x= dragging.offsetX+evt.clientX-dragging.startX;
	var y= dragging.offsetY+evt.clientY-dragging.startY;
	if (dragging.drag=='titlebar' && x>=0 && y>=0) {
		dragging.elem.style.left= x + 'px';
		dragging.elem.style.top= y + 'px';
	}
	else if (dragging.drag=='vsash' && x>=30) {
		dragging.elem[0].style.width= (x-5) + 'px';
		dragging.elem[1].style.left= x + 'px';
		dragging.elem[2].style.left= (x+5) + 'px';
	}
}
function onMouseUp(evt) {
	if (dragging) {
		document.onmousemove= null;
		document.onselectstart= null;
		document.ondragstart= null;
		dragging= null;
	}
}

// show tip
var o_tiptimer;
function showTip() {
	var evt;
	if (window.event)
		evt=window.event;
	else
		evt=arguments[0];

	var targetId= (isIE()? evt.srcElement: evt.target).id;
	var tip= lang_tips[targetId];
	if (tip) {
		clearTimeout(o_tiptimer);
		var elem=document.getElementById("tip");
		elem.style.left= (evt.clientX+15)+"px";
		elem.style.top= (evt.clientY)+"px";
		elem.innerHTML= tip;
		elem.style.display="inline";
		o_tiptimer= setTimeout("hideTip()", 3000);
	}
}
function hideTip() {
	clearTimeout(o_tiptimer);
	document.getElementById("tip").style.display="none";
}

// message box
var o_msgtimer;
var o_msgtimecount;

function showMessageBox(msg) {
	var msgtext= document.getElementById("msgtext");
	msgtext.innerHTML=msg;
	var elem= document.getElementById("messagebox");
	elem.style.opacity="1.0";
	elem.style.filter="alpha(opacity=100)";
	elem.style.display="block";
	o_msgtimecount=50;
	o_msgtimer= setTimeout("blurMsgbox()", 100);
}
function closeMessageBox() {
	document.getElementById("messagebox").style.display="none";
	clearTimeout(o_msgtimer);
}
function blurMsgbox() {
	--o_msgtimecount;
	if (o_msgtimecount==0) {
		closeMessageBox();
		return;
	}
	else if (o_msgtimecount<=25) {
		var elem=document.getElementById("messagebox");
		elem.style.opacity=(o_msgtimecount/25.0);
		var n= 100*o_msgtimecount/25;
		elem.style.filter="alpha(opacity="+n+")";
	}
	o_msgtimer= setTimeout("blurMsgbox()", 100);
}

