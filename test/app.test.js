var genji = require('../index');
var assert = require('assert');
var App = genji.App;
var timeout = 500;

exports['test route#get'] = function() {
  var route = genji.route();
  var data = 'get: Hello world!';
  route.get('helloworld$').fn(function(handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, data);
      });

  genji.route('foo').get('$', function(handler) {
    handler.send('is at /foo ');
  });
    assert.response(genji.createServer(), {
        url: '/foo',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, 'is at /foo ');
      });
  
  genji.route('foo').get('/$', function(handler) {
    handler.send('is at /foo/ ');
  });
    assert.response(genji.createServer(), {
        url: '/foo/',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, 'is at /foo/ ');
      });

  genji.route('bar').get('/$', function(handler) {
    handler.send('is at /bar/ ');
  });
    assert.response(genji.createServer(), {
        url: '/bar/',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, 'is at /bar/ ');
      });
};

exports['test route#post'] = function() {
  var route = genji.route('namedApp');
  var data = 'post: Hello world!';

  var postData1 = 'x=r&y=t';
  route.post('/helloworld$', function(handler) {
    handler.on('params', function(params, raw) {
      if (params.x === 'r' && params.y === 't' && raw === 'x=r&y=t') {
        handler.send(data, 201, {Server: 'GenJi'});
      } else {
        handler.setStatus(500).finish('error');
      }
    });
  });
  assert.response(genji.createServer(), {
        url: '/namedApp/helloworld',
        timeout: timeout,
        method: 'POST',
        data: postData1,
        headers:{'content-length': postData1.length}
      }, function(res) {
        assert.equal(res.body, data);
        assert.equal(res.statusCode, 201);
        assert.equal(res.headers.server, 'GenJi');
      });

  var postData2 = 'x=c&y=d';
  route.post('helloworld$', function(handler) {
    handler.on('data', function(params, raw) {
      if (params.x === 'c' && params.y === 'd' && raw === 'x=c&y=d') {
        handler.send(data, 201, {Server: 'GenJi'});
      } else {
        handler.setStatus(500).finish('error');
      }
    });
  });
  assert.response(genji.createServer(), {
        url: '/namedApphelloworld',
        timeout: timeout,
        method: 'POST',
        data: postData2,
        headers:{'content-length': postData2.length}
      }, function(res) {
        assert.equal(res.body, 'error');
        assert.equal(res.statusCode, 500);
      });

  var postData3 = 'x=a&y=b';
  route.post('^/fullurlpattern$', function(handler) {
    handler.on('params', function(params, raw) {
      if (params.x === 'a' && params.y === 'b' && raw === 'x=a&y=b') {
        handler.send(data, 201, {Server: 'GenJi'});
      } else {
        handler.setStatus(500).finish('error');
      }
    });
  });
  assert.response(genji.createServer(), {
        url: '/fullurlpattern',
        timeout: timeout,
        method: 'POST',
        data: postData3,
        headers:{'content-length': postData3.length}
      }, function(res) {
        assert.equal(res.body, data);
        assert.equal(res.statusCode, 201);
        assert.equal(res.headers.server, 'GenJi');
      });
};

exports['test route#put'] = function() {
  var route = genji.route('a put app', {root:'/put'});
  var data = 'put: Hello world!';
  route.put('/helloworld$', function (handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
    url:'/put/helloworld',
    timeout:timeout,
    method:'PUT',
    headers:{'content-length':0}
  }, function (res) {
    assert.equal(res.body, data);
  });
};

exports['test route#del'] = function() {
  var route = genji.route();
  var data = 'del: Hello world!';
  route.del('/helloworld$', function(handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: timeout,
        method: 'DELETE'
      }, function(res) {
        assert.equal(res.body, data);
      });
};

exports['test route#head'] = function() {
  var route = genji.route();
  route.head('/helloworld$', function(handler) {
    handler.setStatus(304);
    handler.finish();
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: timeout,
        method: 'HEAD'
      }, function(res) {
        assert.equal(res.statusCode, 304);
      });
};

exports['test route#notFound'] = function() {
  var route = genji.route();
  route.notFound('/*', function(handler) {
    handler.error(404, 'not found: ' + this.request.url);
  });
  assert.response(genji.createServer(), {
        url: '/noexistenturl',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.statusCode, 404);
        assert.equal(res.body, 'not found: /noexistenturl');
      });
};

exports['test route#mount'] = function() {
  var route = genji.route();
  var data = 'mount+get: Hello world!';
  var method = 'get';
  function fn(handler) {
    handler.send(data);
  };
  route.mount([
    ['^/mount/helloworld$', fn, method]
  ]);
  assert.response(genji.createServer(), {
        url: '/mount/helloworld',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, data);
      });
};

exports['test App result events'] = function () {
  var MyLoginApp = App('MyLoginApp', {

    init:function (options) {
      this.serverUrl = options.serverUrl;
    },

    // the app business logic
    login:function (params) {
      this.emit('login', null, params.username === 'user' && params.password === 'pass');
      return this;
    },

    signup:function (accountType, userInfo) {
      userInfo.accountType = accountType;
      this.emit('signup', null, userInfo);
      return this;
    },

    routes:{
     signup: {method: 'post', type:'json', url: '^/signup/([a-zA-Z]*)'},
     login: {method:'post', url:'^/login'}
    }
  });

  var myapp = new MyLoginApp({serverUrl: 'http://rayplus.cc/'});
  assert.eql(myapp.serverUrl, 'http://rayplus.cc/');
  assert.eql(myapp.urlRoot, '^/myloginapp');

  myapp.onResult('login', function (err, loginResult) {
    assert.eql(err, null);
    assert.eql(loginResult, true);
  }).login({username: 'user', password: 'pass'});

  myapp.onResult('signup', function (err, userInfo) {
    assert.eql(err, null);
    assert.eql(userInfo.accountType, 'premium');
    assert.eql(userInfo.username, 'user');
    assert.eql(userInfo.password, 'pass');
  });
  myapp.signup('premium', {username: 'user', password: 'pass'});

  genji.loadApp(myapp);
};

exports['test App#preHook'] = function () {

  var MyApp = App('MyApp', {
    testAppLevelPreHook:function (params) {
      this.emit('testAppLevelPreHook', null, params.result);
    },

    testRouteLevelPreHook:function (result) {
      this.emit('testRouteLevelPreHook', null, result);
    },

    routes: {
      testAppLevelPreHook: {method: 'get', url: '^/prehook/app'},
      testRouteLevelPreHook: {method: 'get', url: '^/prehook/route/([a-z_]*)'}
    },

    routeResults: {
      testAppLevelPreHook:function (err, result) {
        assert.eql(err, null);
        assert.eql(result, 'app prehook result [app]');
        this.handler.send('app prehook tested ok');
      },

      testRouteLevelPreHook:function(err, result) {
        assert.eql(err, null);
        assert.eql(result, 'app_route_result [app] [route]');
        this.handler.send('route prehook tested ok');
      }
    }
  });

  var myApp = new MyApp;

  // app level route prehook
  myApp.routePreHook(function (handler, result) {
    if (result) {
      // this request comes from `testRouteLevelPreHook`
      var self = this;
      setTimeout(function () {
        // async prehook
        // you must put all your arguments in `self.next`, otherwise your app/route won't work.
        self.next(handler, result + ' [app]');
      }, 200);
    } else {
      // this request comes from `testAppLevelPreHook`
      handler.params = handler.params || {};
      handler.params.result = 'app prehook result' + ' [app]';
      return true;
    }
  });

  // prehook for specific route
  myApp.routePreHook('testRouteLevelPreHook', function (handler, result) {
    this.next(handler, result + ' [route]');
  });
  
  genji.loadApp(myApp);

  assert.response(genji.createServer(), {
    url:'/prehook/app',
    timeout:timeout,
    method:'GET'
  }, function (res) {
    assert.equal(res.statusCode, 200);
    assert.equal(res.body, 'app prehook tested ok');
  });

  assert.response(genji.createServer(), {
    url:'/prehook/route/app_route_result',
    timeout:timeout,
    method:'GET'
  }, function (res) {
    assert.equal(res.statusCode, 200);
    assert.equal(res.body, 'route prehook tested ok');
  });

  myApp.onResult('testAppLevelPreHook', function (err, result) {
    assert.eql(err, null);
    typeof result === 'number' && assert.eql(result, 10);
  });
  // prehooks should not be involved in direct calls
  myApp.testAppLevelPreHook({result: 10});
};