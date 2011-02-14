var sys = require('sys'),
    fs = require('fs');

exports.loadGarcon = function(garconPath){
  var file = garconPath + '/lib/garçon', ret;
  try {
    ret = require(file);
  }
  catch(e) {    
    sys.puts('Garcon not found. Is it installed?');
  }
  return ret;
};

var pathExists = function(path){
  try {
    fs.readdirSync(path);
    return true;
  }
  catch(e) {
    return false;
  }
};

exports.pathExists = pathExists;

exports.checkCustomGarcon = function(rootPath){
  var garconPath = rootPath + '/garcon';
  if(pathExists(garconPath)) return garconPath;
  else return false;
};

exports.checkCustomSC = function(rootPath){
  var scPath = rootPath + '/frameworks/sproutcore';
  if(pathExists(scPath)) return scPath;
  else return false;
};



exports.addSproutcore = function(app,Framework,options){
  // we need to override the standard addSproutcore to be able to point to different directories
  // we need both the app and access to the Framework class
  // we override the standard Framework class to contain the functions we want.
  
  Framework.sproutcoreBootstrap = function(options) {
     var that = this,
         bootstrap;

     options.path = (!options.path)? 'frameworks/sproutcore/frameworks/bootstrap': options.path;
     bootstrap = new Framework(options);

     bootstrap.beforeFile = function() {  
       if (this._beforeFile === undefined) {
         this._beforeFile = this.virtualFileWithPathAndContent(
           'before.js',
           [
             'var SC = SC || { BUNDLE_INFO: {}, LAZY_INSTANTIATION: {} };',
             'var require = require || function require() {};'
           ].join('\n')
         );
       }

       return this._beforeFile;
     };

     bootstrap.afterFile = function() {  
       if (this._afterFile === undefined) {
         this._afterFile = this.virtualFileWithPathAndContent(
           'after.js',
           '; if (SC.setupBodyClassNames) SC.setupBodyClassNames();'
         );
       }

       return this._afterFile;
     };

     return bootstrap;
   };

   Framework.sproutcoreFrameworks = function(options) {
     var opts, key, fws;

     if (this._sproutcoreFrameworks === undefined) {    
       
       options.basePath = (!options.basePath)? 'frameworks/sproutcore': options.basePath;
       
       fws = [];
       if(pathExists(options.basePath + '/frameworks/jquery')) fws.push('jquery');
       fws.push('runtime');
       if(pathExists(options.basePath + '/frameworks/amber')) fws.push('amber');
       fws.concat(['foundation', 'datastore', 'desktop', 'animation']);
       
       opts = { combineScripts: true };
       for (key in options) {
         opts[key] = options[key];
       }

       this._sproutcoreFrameworks = [this.sproutcoreBootstrap(opts)].concat(fws.map(function(framework) {
         opts.path = opts.basePath + '/frameworks/' + framework;
         return new Framework(opts);
       }, this));

     }

     return this._sproutcoreFrameworks;
   };  
  
  app.addSproutcore = function(options) {
    if (options === undefined) options = {};
    options.server = this.server;
    this.addFrameworks(Framework.sproutcoreFrameworks(options));
  };
  
  app.addSproutcore(options);
}

//filename == string, directives == object: key is directive name, value is the value to replace it with
//opens the file, replaces all directives and gives back the result 
//as one string
exports.replaceDirectives = function(filename,directives){
  var i,contents,regex;
  if(filename && directives){
    contents = fs.readFileSync(filename);
    for(var i in directives){
      contents = contents.replace("@@" + i, directives[i]);
    }
    return contents;
  }
  else return "";
}
