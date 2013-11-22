var chatRemote = require('../remote/chatRemote');

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.send = function(msg, session, next) {
	console.log('[server][chatHandler][send] msg: ' + JSON.stringify(msg));
	var self = this;
	var rid = session.get('rid'); // 用户的域 example.com
	var username = session.uid.split('@')[0]; // uid: user2@example.com
	var channelService = this.app.get('channelService');
	var type = msg.type; // private, group, domain 3种
	var cid = msg.cid;
	var param = {
		route: 'onChat',
		message: msg.message,
		from: msg.from,
		to: msg.to,
		type: type
	};
	var userFrom = msg.from + '@' + rid;
	var userTo = msg.to + '@' + rid;

	console.log('[server][chatHandler][serverId] :' + session.get('sid'));
	var channel;
	if (msg.type === 'private') {
		channel = channelService.getChannel(cid, false) || channelService.getChannel(msg.to + '_' + msg.from, false);
		if (!channel) {
			channel = channelService.getChannel(msg.to + '_' + msg.from, true);
			channel.add(userFrom, session.get('sid'));
			channel.add(userTo, session.get('sid'));
		}
	} else if (msg.type === 'group') {
		channel = channelService.getChannel(cid, false); // group chat
		if (!channel) {
			channel = channelService.getChannel(cid, true); // group chat
			channel.add(userFrom, session.get('sid'));
		} else {
			console.log('[server][chatHandler][member] :' + JSON.stringify(channel.getMember(msg.from + '@' + rid)));
			if (!channel.getMember(msg.from + '@' + rid)) {
				channel.add(userFrom, session.get('sid'));
			}
		}

	} else if (msg.type === 'domain') {
		channel = channelService.getChannel(cid, false); // domain chat
		if (!channel) {
			channel = channelService.getChannel(cid, true); // domain chat
		}
	}
	//var channel = channelService.getChannel(rid, false); // domain channel
	channel.pushMessage(param);
/*
	//the to is all users
	if(msg.to == '*') {
		channel.pushMessage(param);
	}
	//the to is specific user
	else {
		var tuid = msg.to + '@' + rid;
		var tsid = channel.getMember(tuid)['sid'];
		channelService.pushMessageByUids(param, [{
			uid: tuid,
			sid: tsid
		}]);
	}
	*/
	next(null, {
		route: msg.route
	});
};
