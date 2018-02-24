/*
File	init.js
Date	2014-06-28, 07-16

Copyright (C) 2014, Tositaka TERAMOTO & FUKUMOTO Hirotsugu.
Permission to use, copy, modify, and distribute this software and 
its documentation for any non-commercial purpose is hereby granted 
without fee, provided that the above copyright notice appear in all 
copies and that both that copyright notice and this permission 
notice appear in supporting documentation.
This file is provided "as is" without express or implied warranty.
*/

var version="v1.0 2014-07-16";
var available_langs= ["eo","en","ja"];
var lang_file= null;

var defaultDict= null;

var dictionaries= {
	kaji: {
		name:"(梶)和エス辞典", edition:"梶弘和編 1957年",
		dict_js:"kajiwaes.js", text:"plain",
		dict:null, conv1:null, conv2:null, makeEntry:null, makeDef:null
		},
	pejv: {
		name:"実用エスペラント小辞典(エス和)", edition:"広高正昭編 V1.80 2010-10-30",
		dict_js:"pejv.js", text:"plain",
		dict:null, conv1:null, conv2:null, makeEntry:null, makeDef:null
		},
	pevl: {
		name:"電子版エスペラント日本語単語集", edition:"広高正昭 他編, 1997.01.06",
		dict_js:"pevl.js", text:"plain",
		dict:null, conv1:null, conv2:null, makeEntry:null, makeDef:null
		},
	bestplant: {
		name:"日エス対照動植物名リスト", edition:"野村忠綱編 1988-1994",
		dict_js:"bestplant.js", text:"plain",
		dict:null, conv1:null, conv2:null, makeEntry:null, makeDef:null
		},
	espdic: {
		name:"Esperanto-English (Denisowski)", edition:"Paul Denisowski, 19 Dec. 2013",
		dict_js:"espdic.js", text:"plain",
		dict:null, conv1:null, conv2:null, makeEntry:null, makeDef:null
		},
/*	butler: {
		name:"Esperanto-English (Butler)", edition:"Montagu C. Butler, 1967",
		dict_js:"butler.js", text:"plain",
		dict:null, conv1:null, conv2:null, makeEntry:null, makeDef:null
		},
*/
	engesp1906: {
		name:"English-Esperanto (1906)", edition:"O'Connor and Hayes, 1906",
		dict_js:"engesp1906.js", text:"plain",
		dict:null, conv1:null, conv2:null, makeEntry:null, makeDef:null
		},
};

/////////////////////////////
// Options
var defaultOpts= {
	//search options
	maxSearchHistory:20,
	searchRange:"range_entries",	//"range_entries", "range_entiretext"
	entrySearch:"match_prefix",		//"match_prefix", "match_partial", "match_complete"
	entiretext_wordSearch:false,	//true, false
	//display options
	showAfterSearch:true,		//true, false
	retain:false,				//true, false
	usePool:false,				//true, false
	howDisplayDefs:"prepend",	//"prepend", "append", "showone"
	maxDefs:100
};

