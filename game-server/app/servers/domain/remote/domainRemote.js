var stringify = require('json-stringify-safe');

module.exports = function(app) {
	return new DomainRemote(app);
};

var DomainRemote = function(app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

/**
 * Add user into domain channel.
 *
 * @param {String} uid unique id for user // user2@example.com
 * @param {String} sid server id // connector-server-1
 * @param {String} name channel name // example.com
 * @param {boolean} flag channel parameter // create channel or not
 *
 */
DomainRemote.prototype.add = function(uid, sid, name, flag, cb) {
	var channel = this.channelService.getChannel(name, flag);

	var username = uid.split('@')[0];
	var param = {
		route: 'onAdd',
		user: username
	};

	//console.log('[server][domainRemote][add] sid: ' + sid);
	//console.log('[server][domainRemote][add] name: ' + name);
	//console.log('[server][domainRemote][add] uid: ' + uid);
	//console.log('[server][domainRemote][add] channel: ' + !!channel);

	channel.pushMessage(param);

	if( !! channel) {
		channel.add(uid, sid);
	}

	cb(this.get(name, flag));
};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
DomainRemote.prototype.get = function(name, flag) {
	var users = [];
	var channel = this.channelService.getChannel(name, flag);
	if( !! channel) {
		users = channel.getMembers(); // [uid, uid ...]
	}
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('@')[0];
	}
	return users;
};

/**
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
DomainRemote.prototype.kick = function(uid, sid, name) {
	var channel = this.channelService.getChannel(name, false);
	// leave channel
	if( !! channel) {
		channel.leave(uid, sid);
	}

	//console.log('[server][domainRemote][kick] name: ' + name);
	//console.log('[server][domainRemote][kick] uid: ' + uid);
	//console.log('[server][domainRemote][kick] channel: ' + !!channel);

	var username = uid.split('@')[0];
	var param = {
		route: 'onLeave',
		user: username
	};
	channel.pushMessage(param);
};
