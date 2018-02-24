/* Elektronikaj Esperantaj Vortaroj kun retumilo
File	regilo.js
Date	2014-07-09
Espvortaroj version 1.0

Copyright (C) 2014, Tositaka TERAMOTO & FUKUMOTO Hirotsugu.
Permission to use, copy, modify, and distribute this software and 
its documentation for any non-commercial purpose is hereby granted 
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


//--- Dictionary specific vars ---
var currentDict= "";
var requestedDict= "";
var Dict= null;
var convSchstr1= null;
var convSchstr2= null;
var makeEntry= null;
var makeDef= null;

var o_dicts= [];	//[[dict.name, chk.elem, img.elem], ...]
var searchHistory= [];

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
	document.getElementById("btn_select").style.display= (defaultOpts["usePool"])?"inline":"none";
	elem= document.getElementById(defaultOpts["howDisplayDefs"]);
	if (elem)
		elem.checked= true;
	document.getElementById("maxdefs").value= defaultOpts["maxDefs"];

	//event handlers
	addEventHandler(document.getElementById("searchstr"), "keydown", inputSearchStr);
	addEventHandler(document.getElementById("selectSchHistory"), "keydown", schHistoryKeyPress);
	addEventHandler(document.getElementById("results"), "click", onShowDef);
	addEventHandler(document.getElementById("defs"), "click", onDefClicked);

	var imgs=document.getElementsByTagName("img");
	for (var i=0; i<imgs.length; ++i) {
		if (imgs[i].className=="button") {
			addEventHandler(imgs[i], "mouseover", showTip);
			addEventHandler(imgs[i], "mouseout", hideTip);
		}
	}

	// make SelDictsDialog and load dictionaries after having read the language js
	// in callback_lang()

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

	// load the default dictionary or show dialog
	makeSelDictsDialog();
	if (defaultDict) {
		requestedDict= defaultDict;
		loadDict(defaultDict);
	}
	else {
		selectDicts();
	}
}

// create a dialog to load and select dictionaries
function makeSelDictsDialog() {
	var frag= document.createDocumentFragment();
	
	//app version
	var elem=document.createElement("div");
	elem.style.textAlign="right";
	elem.style.color="grey";
	elem.appendChild(document.createTextNode("Espvortaroj "+version));
	elem.appendChild(document.createElement("br"));
	elem.appendChild(document.createTextNode(lang_str["dict_load"]));
	frag.appendChild(elem);

	//head
	elem=document.createElement("h6");
	elem.appendChild(document.createTextNode(lang_str["dict_target"]));
	frag.appendChild(elem);

	//
	var name;
	for (name in dictionaries) {
		var d= dictionaries[name];

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
		var radio= document.createElement("input");
		radio.type="radio";
		radio.id= "chk_"+name;
		radio.name= "chk_dict";
		addEventHandler(radio, "click", onClickDict);
		label.appendChild(radio);

		label.appendChild(document.createTextNode(d["name"]));
		label.appendChild(document.createElement("br"));
		var span= document.createElement("span");
		span.appendChild( document.createTextNode(d["edition"]) );
		span.style.paddingLeft="20px";
		label.appendChild(span);
		elem.appendChild(label);

		o_dicts.push([name, radio, img]);
		frag.appendChild(elem);
	}

	frag.appendChild(document.createElement("hr"));
	//buttons
	var span= document.createElement("span");
	span.innerHTML="&nbsp;&nbsp;<input type='button' value='"+lang_str["ok"]+"' onclick='selDictsOK()'>&nbsp;<input type='button' value='"+lang_str["cancel"]+"' onclick='selectDicts()'>";
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
	var d= dictionaries[dictName];
	d["dict"]= null;
	d["conv1"]= null;
	d["conv2"]= null;
	d["makeEntry"]=null;
	d["makeDef"]= null;
	
	var elem= document.getElementById("js_"+dictName);
	if (dictName==currentDict) {
		Dict= null;
		convSchstr1= null;
		convSchstr2= null;
		makeEntry= null;
		makeDef= null;
	}
	elem.parentNode.removeChild(elem);
}

// called when the dictionary has been loaded
function callback(name, dict, funs) {
	var d= dictionaries[name];
	d["dict"]= dict;
	d["conv1"]= funs["conv1"];
	if (!d["conv1"])
		d["conv1"]= conv1_default;
	d["conv2"]= funs["conv2"];
	if (!d["conv2"])
		d["conv2"]= conv2_default;
	d["makeEntry"]= funs["makeEntry"];
	if (!d["makeEntry"])
		d["makeEntry"]= makeEntry_default;
	d["makeDef"]= funs["makeDef"];
	if (!d["makeDef"])
		d["makeDef"]= makeDef_default;

	if (name==requestedDict) {
		setCurrentDict(name);
	}
}

function setCurrentDict(name) {
	currentDict= name;
	requestedDict= "";
	var d= dictionaries[name];
	Dict= d["dict"];
	convSchstr1= d["conv1"];
	convSchstr2= d["conv2"];
	makeEntry= d["makeEntry"];
	makeDef= d["makeDef"];

	var elem= document.getElementById("dict_name");
	elem.replaceChild(
		document.createTextNode(d["name"]),
		elem.firstChild);
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
		if (stack[i]==item)			//the same data exists
			return;
	}
	stack.push(item);
	if (stack.length>max) {
		stack.shift();
	}
}

function search() {
	if (!Dict) {
		selectDicts();
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

	// Title of the list
	var div= entryListHead(lang_str["entries"], "k");
	frag_res.appendChild(div);

	// start searching
	var entiretext= document.getElementById("range_entiretext").checked;
	if (entiretext)
		search_alltext(schstr, frag_res, frag_def, maxdefs);
	else
		search_entries(schstr, frag_res, frag_def, maxdefs);

	results.appendChild(frag_res);
	defpane.appendChild(frag_def);

	document.getElementById("searchstr").focus();
}

function search_entries(schstr, frag, frag_def, maxdefs) {
	schstr= convSchstr1(schstr);
	var re;
	var schAllEntries= false;
	if (document.getElementById("match_prefix").checked)
		re= new RegExp("^"+schstr, "i");
	else if (document.getElementById("match_complete").checked)
		re= new RegExp("^"+schstr+"$", "i");
	else {
		re= new RegExp(schstr, "i");
		schAllEntries= true;
	}
	var matched= false;
	var count=0;
	for (var i=0; i<Dict.length; ++i) {
		var entry= Dict[i];
		if (re.test(entry[0])) {
			var div= makeEntry(entry, currentDict+" "+i, "r");
			frag.appendChild(div);
			matched=true;
			++count;
			if (count<=maxdefs) {
				frag_def.appendChild(makeDefWButton(entry, IMG_add, currentDict));
			}
		}
		else if (matched && !schAllEntries) {
			break;
		}
	}
}

function search_alltext(schstr, frag, frag_def, maxdefs) {
	schstr= convSchstr2(schstr);
	var re;
	if (document.getElementById("match_word_entiretext").checked //)
			&& isAllAlphabet(schstr)) {
		re= new RegExp("\\b"+schstr+"\\b", "i");
	}
	else {
		re= new RegExp(schstr, "i");
	}
	var count=0;
	for (var i=0; i<Dict.length; ++i) {
		var entry= Dict[i];
		if (re.test(entry[0]) ||
			re.test(entry[1]) ||
			re.test(entry[2])
			) {
			//
			var div= makeEntry(entry, currentDict+" "+i, "r");
			frag.appendChild(div);
			++count;
			if (count<=maxdefs) {
				frag_def.appendChild(makeDefWButton(entry, IMG_add, currentDict));
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
			else if (syl.length>0) {	//delimiter (ascii)
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

function makeDefWButton(entry, button, dict) {
	var div= makeDef(entry);
	div.setAttribute("params", dict);
	var img= document.createElement("img");
	img.src= button;
	img.className="btn";
	div.insertBefore(img, div.firstChild);
	return div;
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

// Add to definition list, when the entry word is clicked
function onShowDef(evt) {
	var target;
	if (window.event)
		target= window.event.srcElement;
	else
		target= evt.target;
	var params= target.getAttribute("params");
	if (!params)
		return;		//this is the head
	var re= new RegExp("([^ ]+) (\\d+)");
	var dict= params.replace(re, "$1");
	var index= parseInt(params.replace(re, "$2"));

	var maxdefs= parseInt(document.getElementById("maxdefs").value);
	if (!maxdefs)
		maxdefs= 100;
	var onlyone= document.getElementById("showone").checked;
	var append= document.getElementById("append").checked;

	var defpane= document.getElementById("defs");

	var div=makeDefWButton(Dict[index], IMG_add, dict);
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

	if (target.className=="btn") {
		var elem= target.parentNode;
		if (document.getElementById("usePool").checked) {
			if (target.src.indexOf(IMG_add)>=0) {			// (+)
				moveToPool(elem);
			}
			else if (target.src.indexOf(IMG_remove)>=0) {	// (-)
				removeFromPool(elem);
			}
		}
		else {
			var dicID= elem.getAttribute("params");
			var dicname= dictionaries[dicID]["name"];
			;
			var elem=document.getElementById("tip");
			elem.style.left= (evt.clientX)+"px";
			elem.style.top= (evt.clientY+20)+"px";
			elem.innerHTML= dicname;
			elem.style.display="inline";
			;
			setTimeout("document.getElementById('tip').style.display='none'", 1000);
		}
	}
}

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

function onClickDict(evt) {
	var target;
	if (window.event)
		target= window.event.srcElement;
	else
		target= evt.target;
	
	var name= target.id.substring(4);	//id="chk_NAME"
	var checked= target.checked;		//true

	// update load/unload state
	var img= document.getElementById("img_"+name);
	img.src= (checked)? IMG_loaded : IMG_unloaded;

	if (dictionaries[name]["dict"]) {
		//already loaded
		selDictsOK();
	}
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
		&& dictionaries[name]["dict"]) {
		target.src= IMG_loaded;
	}
}

// show/hide the sel.dicts dialog
function selectDicts() {
	var elem= document.getElementById("seldicts");
	if (elem.style.display=="none") {
		// SHOW
		var i;
		for (i=0; i<o_dicts.length; ++i) {
			var chk= o_dicts[i];
			var dict_name= chk[0];
			// selected ?
			if (dict_name==currentDict) {
				chk[1].checked= true;
			}
			// loaded ?
			if (dictionaries[dict_name]["dict"]) {
				chk[2].src= IMG_loaded;
			}
			else {
				chk[2].src= IMG_unloaded;
			}
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
	var sel_name="";
	var sel_loaded= false;
	var i;
	for (i=0; i<o_dicts.length; ++i) {
		var chk= o_dicts[i];
		var name= chk[0];
		if (chk[1].checked) {
			sel_name= name;
			requestedDict= sel_name;
			sel_loaded= chk[2].src.indexOf(IMG_loaded)>=0;
		}
		var d= dictionaries[name];
		if (chk[1].checked && chk[2].src.indexOf(IMG_loaded)>=0 && !d["dict"])
			loadDict(name);
		else if (chk[2].src.indexOf(IMG_unloaded)>=0 && d["dict"])
			unloadDict(name);
	}

	if (sel_name && !sel_loaded) {
		showMessageBox(lang_str["msg_loadDict"]);
		return;
	}

	if (sel_name!=currentDict && sel_name) {
		if (dictionaries[sel_name]["dict"]) {
			setCurrentDict(sel_name);
		}
		//else {
			// (wait for loading)
			// now loading the dictionary; when completed, callback() is called
			// followed by setCurrentDict()
			// currentDict= "";
		//}
	}

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
	var elem= document.getElementById("btn_select");
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

// show tip
function showTip() {
	var evt;
	if (window.event)
		evt=window.event;
	else
		evt=arguments[0];

	var targetId= (isIE()? evt.srcElement: evt.target).id;
	var tip= lang_tips[targetId];
	if (tip) {
		var elem=document.getElementById("tip");
		elem.style.left= (evt.clientX)+"px";
		elem.style.top= (evt.clientY+20)+"px";
		elem.innerHTML= tip;
		elem.style.display="inline";
	}
}
function hideTip() {
	document.getElementById("tip").style.display="none";
}

// message box
var o_timer;
var o_timecount;

function showMessageBox(msg) {
	var msgtext= document.getElementById("msgtext");
	msgtext.innerHTML=msg;
	var elem= document.getElementById("messagebox");
	elem.style.opacity="1.0";
	elem.style.filter="alpha(opacity=100)";
	elem.style.display="block";
	o_timecount=50;
	o_timer= setTimeout("blurMsgbox()", 100);
}
function closeMessageBox() {
	document.getElementById("messagebox").style.display="none";
	clearTimeout(o_timer);
}
function blurMsgbox() {
	--o_timecount;
	if (o_timecount==0) {
		closeMessageBox();
		return;
	}
	else if (o_timecount<=25) {
		var elem=document.getElementById("messagebox");
		elem.style.opacity=(o_timecount/25.0);
		var n= 100*o_timecount/25;
		elem.style.filter="alpha(opacity="+n+")";
	}
	o_timer= setTimeout("blurMsgbox()", 100);
}

