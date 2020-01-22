"use strict";

const fs      = require("fs")
     ,path    = require("path")
     ,clock   = (function(){
                  const records = {};
                  function start(label, prefix){
                    label  = (label  || "");
                    prefix = (prefix || "");
                    records[label] = Number(new Date());
                    console.log("[START] " + label);
                  }
                  function now(label, prefix){
                    var time;
                    label  = (label  || "");
                    prefix = (prefix || "");
                    time = Number(new Date());
                    time = time - records[label];
                    time = Math.round(time / 1000); //loose some accuracy-scope -converting to seconds.
                    time = Math.max(time, 1);       //minimum is "1 sec."
                    console.log("[DONE]  " + label + " (" + time + " sec.)");
                  }
                  return { "records" : records
                          ,"start"   : start
                          ,"now"     : now
                         };
                }())
     ,multiline    = function multiline(s){return s.toString().replace(/\r/g,"##R##").replace(/\n/g,"##N##").replace(/^.*\/\*\+(.*)\+\*\/.*$/, "$1").replace(/##R##/g,"\r").replace(/##N##/g,"\n");}
     ,obj_beautify = function(obj){return JSON.stringify(obj, null, 2)
                                              .replace(/,\n /g, "\n ,")
                                              .replace(/ *(,(\ +))/g,"$2,");
                                  }
     ;



const filenames = ["_raw__hosts.txt"
                  ,"_raw__hosts_adblock_anti_annoyances_hide.txt"
                  ,"_raw__hosts_adblock_anti_annoyances_block.txt"
                  ,"_raw__hosts_adblock_anti_annoyances_block_inline_script.txt"
                  ,"_raw__hosts_adblock_anti_annoyances_style_inject.txt"
                  ]
   ,files       = filenames.map(function(filename){ return path.resolve("." + path.sep + filename);  })
   ,dates       = files.map(function(file){
                    const stat = fs.lstatSync(file);
                    return {atime:                Math.floor(stat.atime.getTime() / 10000)*10
                           ,mtime:                Math.floor(stat.mtime.getTime() / 10000)*10
                           ,mtime_iso:  (new Date(Math.floor(stat.mtime.getTime() / 10000)*10000)).toISOString().replace(/\.\d+Z/,".000Z")  //loose millisecond precision. 1. Since setting it uses OS' utime (either linux-native or lib-windows) which is has only second-precision.   2. Since the date printed as information (and the overall checksum) DOES include the changing milliseconds, which means that it keeps rendering new build with different dates, although nothing has changed, but the running of new build in different time...  An alternative is to use constant value: .replace(/\.\d\d\dZ/,".123Z") but there is no much point for that, since milliseconds are ISO supported but non-obliging in any way :] .
                           };
                  })
    ;

var  contents   = files.map(function(file){  return fs.readFileSync(file,{encoding: "utf8"}).replace(/\r/g,"");  });



clock.start("~~");



(function(index){                                              //HOSTS content-fix.
  clock.start("  fix invalid HOSTS items");


  var REGEX_INVALID_HOSTS_BAD_ASCII   = /^.*[^a-z\d\-\_\.\n]+.*$/igm   //not allowed Unicode/UTF-8 letters.
     ,REGEX_INVALID_HOSTS_BAD_START   = /^[^a-z\d]+/igm                //non alphanumeric at the start, remove bad part.
     ,REGEX_INVALID_HOSTS_BAD_END     = /[^a-z\d]+$/igm                //non alphanumeric at the end, remove bad part.
     ,REGEX_INVALID_HOSTS_IP_LIKE     = /^[\d\.]+$/igm                 //blocking an IP-like domains can be done in  '_raw__hosts_adblock_anti_annoyances_block', native HOSTS-file does not support it. Fix by removing the entire-line.
     ,REGEX_INVALID_HOSTS_NO_DOT      = /^[^\.]*$/igm                  //'no dot in line' or empty line, fix by removing the entire-line.
     ,REGEX_INVALID_HOSTS_WHITESPACE  = /[\ \t]+/igm                   //space/tab, fix by removing invalid-part.
     ,REGEX_INVALID_HOSTS_DOUBLE_DOT  = /\.\.+/igm                     //double dot, fix by removing invalid-part.
     ,REGEX_TOO_LONG                  = /^..................................................+$/igm //remove all lines with 50+ characters.

     ,REGEX_DONTCARE_HOSTS            = /^(support|forum|blog|chat|docs|wiki|help).{0,2}\..+/igm  //any support/documents/wiki subdomain can be indicate a safe domain, which can be removed. there is a 'free' possible-suffix of up to 2 characters (forum/forums/blog/blogs/blogs2/..).
     ,REGEX_S3AMAZONAWS               = /^s3.amazonaws.com$/igm        //it keeps comming back...

  index    = filenames.indexOf("_raw__hosts.txt");

  contents[index] = contents[index].toLowerCase();

  contents[index] = contents[index].replace(REGEX_INVALID_HOSTS_BAD_ASCII,    "")
                                   .replace(REGEX_INVALID_HOSTS_BAD_START,    "")
                                   .replace(REGEX_INVALID_HOSTS_BAD_END,      "")
                                   .replace(REGEX_INVALID_HOSTS_IP_LIKE,      "")
                                   .replace(REGEX_INVALID_HOSTS_NO_DOT,       "")
                                   .replace(REGEX_INVALID_HOSTS_WHITESPACE,   "")
                                   .replace(REGEX_INVALID_HOSTS_DOUBLE_DOT,  ".")
                                   .replace(REGEX_TOO_LONG,                   "")
                                   .replace(REGEX_DONTCARE_HOSTS,             "")
                                   .replace(REGEX_S3AMAZONAWS,                "")
                                   ;
  clock.now("  fix invalid HOSTS items");
}());



(function(index){                                              //HOSTS adding common domain-prefix strings.
  clock.start("  adding common domain-prefix strings to HOSTS file ('www.',...)");

  var REGEX_START_WITH_WWW      = /^www\./igm               //starts with www.           - for pre-removing existing ones.
     ,REGEX_START               = /^/igm                    //start of the line.         - for pushing 'www.' to generating default sub-domain too.
     ,REGEX_SUBDOMAIN_WITH_WWW  = /^www\..+\..+\..+\..+.*$/igm  //'www.' + 3 dots + 4 parts. - removing too-long lines to save file-size (those will be kept: 'www.0.disquscdn.com' but also 'www.good.co.il', those will be deleted 'www.wss.good.co.il').
     ,REGEX_WWWDOT_FIX          = /^.*www\.$/igm            //line that ends with 'www.' - as a result of bad-replacement, so it will be removed.
     ;

  index           = filenames.indexOf("_raw__hosts.txt");

  contents[index] = contents[index].replace(REGEX_START_WITH_WWW, "") //chains of www.www.www. ?
                                   .replace(REGEX_START_WITH_WWW, "")
                                   .replace(REGEX_START_WITH_WWW, "")
                                   ;

  contents[index] = contents[index]
                  + "\n"
                  + contents[index].replace(REGEX_START,  "www.")
                  ;

  contents[index] = contents[index].replace(REGEX_SUBDOMAIN_WITH_WWW, "") //remove lines that are already subdomains starting with 'www'
  contents[index] = contents[index].replace(REGEX_WWWDOT_FIX,         "") //remove lines that ends with 'www.' due to empty-line replacements.

  clock.now("  adding common domain-prefix strings to HOSTS file ('www.',...)");
}());



(function(index){                                              //HOSTS adding common domain-prefix strings.
  clock.start("  adding common domain-prefix strings to HOSTS file ('ws.',...)");

  var REGEX_START_WITH_WS      = /^ws\./igm               //starts with ws.           - for pre-removing existing ones.
     ,REGEX_START               = /^/igm                    //start of the line.         - for pushing 'ws.' to generating default sub-domain too.
     ,REGEX_SUBDOMAIN_WITH_WS  = /^ws\..+\..+\..+.*$/igm  //'ws.' + 2 dots + 3 parts. - removing too-long lines to save file-size (for example 'ws.0.disquscdn.com').
     ,REGEX_WSDOT_FIX          = /^.*ws\.$/igm            //line that ends with 'ws.' - as a result of bad-replacement, so it will be removed.
     ;

  index           = filenames.indexOf("_raw__hosts.txt");

  contents[index] = contents[index].replace(REGEX_START_WITH_WS, "") //chains of ws.ws.ws. ?
                                   .replace(REGEX_START_WITH_WS, "")
                                   .replace(REGEX_START_WITH_WS, "")
                                   ;
/*
  contents[index] = contents[index]
                  + "\n"
                  + contents[index].replace(REGEX_START,  "ws.")
                  ;
*/

  contents[index] = contents[index].replace(REGEX_SUBDOMAIN_WITH_WS, "") //remove lines that are already subdomains starting with 'ws'
  contents[index] = contents[index].replace(REGEX_WSDOT_FIX,         "") //remove lines that ends with 'ws.' due to empty-line replacements.

  clock.now("  adding common domain-prefix strings to HOSTS file ('ws.',...)");
}());


(function(index){                                              //HOSTS adding common domain-prefix strings.
  clock.start("  adding common domain-prefix strings to HOSTS file ('wss.',...)");

  var REGEX_START_WITH_WSS      = /^wss\./igm               //starts with wss.           - for pre-removing existing ones.
     ,REGEX_START               = /^/igm                    //start of the line.         - for pushing 'wss.' to generating default sub-domain too.
     ,REGEX_SUBDOMAIN_WITH_WSS  = /^wss\..+\..+\..+.*$/igm  //'wss.' + 2 dots + 3 parts. - removing too-long lines to save file-size (for example 'wss.0.disquscdn.com').
     ,REGEX_WSSDOT_FIX          = /^.*wss\.$/igm            //line that ends with 'wss.' - as a result of bad-replacement, so it will be removed.
     ;

  index           = filenames.indexOf("_raw__hosts.txt");

  contents[index] = contents[index].replace(REGEX_START_WITH_WSS, "") //chains of wss.wss.wss. ?
                                   .replace(REGEX_START_WITH_WSS, "")
                                   .replace(REGEX_START_WITH_WSS, "")
                                   ;
/*
  contents[index] = contents[index]
                  + "\n"
                  + contents[index].replace(REGEX_START,  "wss.")
                  ;
*/

  contents[index] = contents[index].replace(REGEX_SUBDOMAIN_WITH_WSS, "") //remove lines that are already subdomains starting with 'wss'
  contents[index] = contents[index].replace(REGEX_WSSDOT_FIX,         "") //remove lines that ends with 'wss.' due to empty-line replacements.

  clock.now("  adding common domain-prefix strings to HOSTS file ('wss.',...)");
}());


(function(){                                                   //Sorting and unique content
  clock.start("  file unique and sort");

  var REGEX_CARRIAGE_RETURN              = /\r/g
     ,REGEX_START_WITH_EXCLAMATION_MARK  = /^\s*\!/
     ,REGEX_EMPTY_LINE                   = /^\s*$/
     ,REGEX_NO_HASH                      = /^[^#]*$/
     ,REGEX_NO_COMMA                     = /^[^,]*$/
     ;

  function natural_compare(a, b){
    var ax=[], bx=[], an, bn, nn;
    a.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ ax.push([$1 || Infinity, $2 || ""]) });
    b.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ bx.push([$1 || Infinity, $2 || ""]) });
    while(ax.length > 0 && bx.length > 0){
      an = ax.shift();
      bn = bx.shift();
      nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if(null !== nn && 0 !== nn) return nn;
    }
    return ax.length - bx.length;
  }

  function unique(array){
    var tmp = {}, DONT_CARE = 0;
    array.forEach(function(item){ tmp[item] = DONT_CARE; });
    tmp = Object.keys(tmp);
    return tmp;
  }

  Array.prototype.unique = function(){ return unique(this); }; //better and faster implementation.

  for(var index=0; index<contents.length; index++){
    contents[index] = contents[index].split("\n").map(function(line){
                                                    if(null !== line.match(REGEX_START_WITH_EXCLAMATION_MARK))   return line;
                                                    if(null !== line.match(REGEX_EMPTY_LINE))                    return undefined; //the filter call (ahead..) will remove all those array-cells with `undefined` content, effectively removing all empty lines :]
                                                    if(null !== line.match(REGEX_NO_HASH))                       return line;
                                                    if(null !== line.match(REGEX_NO_COMMA))                      return line;

                                                    var head;
                                                    line = line.split("##");                                   //domain##rules with optional '##' maybe in DOM-attribute values..
                                                    head = line.shift();                                       //take just first-find.
                                                    line = line.join("##");                                    //in-case '##' is used in another manner somewhere-else.

                                                    //handle the "domains part"
                                                    head = head.split(",").map(function(phrase){return phrase.trim();})
                                                    head = head.unique().sort(natural_compare);                //unique and sort
                                                    head = head.join(",");

                                                    //handle the "rules part"
                                                    line = line.split(",").map(function(phrase){return phrase.trim();});
                                                    line = line.unique().sort(natural_compare);                //unique and sort
                                                    line = line.join(", ");

                                                    return head + "##" + line;                                 //reassemble line.
                                                  })
                                                  .filter(function(line){ return "string" === typeof line; })   //skip undefineds
                                                  .unique()
                                                  .sort()    //not natural sort to make sure lines starting with "!" at at first..
                                                  .join("\n")
                                                  ;
  }

  clock.now("  file unique and sort");
}());



/*********************************** W R I T E   F I L E S ****************************/



(function(){    //rewrite original files with fixe/sorted/uniqueified content, still working with the content variable (RAM) though.
  clock.start("  rewrite original-files + restore original timestamp");

  files.forEach(function(file, index){
    fs.writeFileSync(file, contents[index], {flag:"w", encoding:"utf8"}); //overwrite
    fs.utimesSync(file, dates[index].atime, dates[index].mtime);  //restore timestamp for modified content.
  });

  clock.now("  rewrite original-files + restore original timestamp");
}());



//writing files into the ./build/ folder



  (function(index){                                              //write hosts.txt/hosts0.txt to build folder
  clock.start("  write hosts.txt/hosts0.txt to build folder");

  index = filenames.indexOf("_raw__hosts.txt");

  var HOSTS127                 = path.resolve("." + path.sep + "build" + path.sep + "hosts.txt")
     ,HOSTS0                   = path.resolve("." + path.sep + "build" + path.sep + "hosts0.txt")
     ,HOSTS127_WITH_LOCALHOST  = path.resolve("." + path.sep + "build" + path.sep + "hosts_with_localhost.txt")   //having those 3 lines to make sure the HOSTS will proper redirect internal connections.
     ,HOSTS0_WITH_LOCALHOST    = path.resolve("." + path.sep + "build" + path.sep + "hosts0_with_localhost.txt")
     ,TITLE_LOCALHOST          = "127.0.0.1 localhost" + "\n"
                               + "127.0.0.1 loopback"  + "\n"
                               + "::1       localhost" + "\n"
     ;

  var title = "#last updated at ##MTIME##+00:00 UTC . contains ##LINES## bad-hosts. direct link: https://raw.githubusercontent.com/eladkarako/hosts/master/build/##FILE## ."
                .replace(/##MTIME##/,dates[index].mtime_iso)
                .replace(/##LINES##/,contents[index].split("\n").length);

  fs.writeFileSync(HOSTS127,                 title.replace(/##FILE##/,"hosts.txt")                                          + "\n" + contents[index].replace(/^/mg, "127.0.0.1 "),   {flag:"w", encoding:"utf8"}); //overwrite if exist
  fs.writeFileSync(HOSTS0,                   title.replace(/##FILE##/,"hosts0.txt")                                         + "\n" + contents[index].replace(/^/mg,   "0.0.0.0 "),   {flag:"w", encoding:"utf8"}); //overwrite if exist
  fs.writeFileSync(HOSTS127_WITH_LOCALHOST,  title.replace(/##FILE##/,"hosts_with_localhost.txt")  + "\n" + TITLE_LOCALHOST + "\n" + contents[index].replace(/^/mg, "127.0.0.1 "),   {flag:"w", encoding:"utf8"}); //overwrite if exist
  fs.writeFileSync(HOSTS0_WITH_LOCALHOST,    title.replace(/##FILE##/,"hosts0_with_localhost.txt") + "\n" + TITLE_LOCALHOST + "\n" + contents[index].replace(/^/mg,   "0.0.0.0 "),   {flag:"w", encoding:"utf8"}); //overwrite if exist

  fs.utimesSync(HOSTS127,                dates[index].atime, dates[index].mtime);  //timestamp
  fs.utimesSync(HOSTS0,                  dates[index].atime, dates[index].mtime);  //timestamp
  fs.utimesSync(HOSTS127_WITH_LOCALHOST, dates[index].atime, dates[index].mtime);  //timestamp
  fs.utimesSync(HOSTS0_WITH_LOCALHOST,   dates[index].atime, dates[index].mtime);  //timestamp

  clock.now("  write hosts.txt/hosts0.txt to build folder");
}());



(function(){                                                  //write adblock lists to build folder
  clock.start("  write adblock lists to build folder");

  const TITLE                  = "[Adblock Plus 2.0]"                   + "\n" +
                                 "! Checksum:       XXXX"               + "\n" +
                                 "! Expires:        14 days"            + "\n" +
                                 "! Last modified:  ##LAST_MODIFIED##"  + "\n" +
                                 "! Version:        ##VERSION##"        + "\n" +
                                 "! Title:          ##TITLE##"                                    + "\n" +
                                 "! Rules:          ##NUMBER_OF_RULES##"                          + "\n" +
                                 "! Homepage:       http://hosts.eladkarako.com/"                 + "\n" +
                                 "! Author:         http://hosts.eladkarako.com/humans.txt"       + "\n" +
                                 "! Forums:         https://github.com/eladkarako/hosts/issues/"  + "\n" +
                                 "! Download:       ##DOWNLOAD##"                                 + "\n" +
                                 "! --------------------------------------------------------------------------------------"  + "\n"
     ,filenames_target         = ["hosts_adblock.txt"                                   //first in-line, is the content of '_raw__hosts.txt'.
                                 ,"hosts_adblock_anti_annoyances_hide.txt"
                                 ,"hosts_adblock_anti_annoyances_block.txt"
                                 ,"hosts_adblock_anti_annoyances_block_inline_script.txt"
                                 ,"hosts_adblock_anti_annoyances_style_inject.txt"
                                 ]
     ,files_target             = filenames_target.map(function(filename_target){ return path.resolve("./build/" + filename_target);  })
     ,titles                   = ["HOSTS AdBlock - Protect Your SmartPhone"
                                 ,"HOSTS AdBlock - Anti-Annoyance - Hide Annoying Elements"
                                 ,"HOSTS AdBlock - Anti-Annoyance - Block Annoying Connections"
                                 ,"HOSTS AdBlock - Anti-Annoyance - Block Annoying Page-Scripts"
                                 ,"HOSTS AdBlock - Anti-Annoyance - ReStyle Annoying Pages"
                                 ]
     ,REGEX_LINES_IGNORED      = /^\s*\!/mg
     ,REGEX_LINES_TOTAL        = /$/mg
     ,REGEX_LINE_START         = /^/mg
     ,crypto                   = require("crypto")
     ;

  contents.forEach(function(content, index){
    if(0===index) content = content.replace(/^/gm,"||").replace(/$/gm,"^$important"); //hosts_adblock.txt requires small modification.

    content = TITLE.replace(/##LAST_MODIFIED##/    , dates[index].mtime_iso + "+00:00 UTC")
                   .replace(/##VERSION##/          , dates[index].mtime_iso.replace(/[^\d]/g,""))
                   .replace(/##TITLE##/            , titles[index])
                   .replace(/##NUMBER_OF_RULES##/  , (content.match(REGEX_LINES_TOTAL) || []).length - (content.match(REGEX_LINES_IGNORED) || []).length)
                   .replace(/##DOWNLOAD##/         , "https://raw.githubusercontent.com/eladkarako/hosts/master/build/" + filenames_target[index])
              + content;

    //checksum
    content = content.replace(/\! Checksum\:\s*XXXX\n/mg, "");                //dummy-checksum-line. remove it.
    /* //checksum miss-calculated?
    content = content.replace(/\n/m                                           //add real-checksum line after first \n (really just a fancy way to say "second line")
                              ,"\n! Checksum:       "
                               + crypto.createHash("md5").update(content).digest("hex")
                               + "\n");
    */
    fs.writeFileSync(files_target[index], content, {flag:"w", encoding:"utf8"});  //overwrite if exist
    fs.utimesSync(files_target[index], dates[index].atime, dates[index].mtime);  //timestamp
  });

  clock.now("  write adblock lists to build folder");
}());



clock.now("~~");

