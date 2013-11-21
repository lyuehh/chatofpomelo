module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
		this.channelService = app.get('channelService');
};

var handler = Handler.prototype;

/**
 * New client entry, push to domain channel he belong .
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	var self = this;
	var rid = msg.rid; // example.com
	var uid = msg.username + '@' + rid; // user2@example.com
	var sessionService = self.app.get('sessionService');
	console.log('[server][entryHandler][enter] getByUid: ' + sessionService.getByUid(uid));
	console.log("[server][entryHandler][enter] uid: " + uid);
	//duplicate log in
	if( !! sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			error: true
		});
		return;
	}
	/*
	var channel = this.channelService.getChannel('123', true);
	channel.add(uid, self.app.get('serverId'));
	console.log('[server][entryHandler][channel] :' + channel);
	console.log('[server][entryHandler][serverId] :' + self.app.get('serverId'));
	channel.pushMessage({
		route: 'onChat',
		message: 'welcome!!!',
		from: 'SERVER',
		target: 'all'
	});
	*/

	session.bind(uid);
	session.set('rid', rid);
	session.set('sid', self.app.get('serverId')); // connector-server-1, 必须是frontend 为true的id
	session.push('sid', function(err) {
		if(err) {
			console.error('set sid for session service failed! error is : %j', err.stack);
		}
	});
	session.push('rid', function(err) {
		if(err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));

	//put user into domain channel
	self.app.rpc.domain.domainRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users){
		next(null, {
			users:users
		});
	});
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	app.rpc.domain.domainRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};