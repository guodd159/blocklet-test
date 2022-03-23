let redisClient
let redis = require('redis');
let _redis;

let redisConfig = {
    "redis": {
        "host": "127.0.0.1",
        "port": 6379,
        "password": "abcbac999123*",
        "db": 3
    }
}

redisClient.init = function () {
    _redis = redis.createClient({port: redisConfig.redis.port, host: redisConfig.redis.host, db: redisConfig.redis.db});
    if (redisConfig.redis.password.length > 0) {
        _redis.auth(redisConfig.redis.password, function () {
            console.log('redis auth success');
        });
    }

    _redis.on('connect', function () {
        console.log('connect redis success');
    });

    return _redis;
};
redisClient.hmsetAsync = async function (key, obj) {
    return new Promise((resolve, reject) => {
        _redis.hmset(key, obj, function (err, result) {
            if (err) {
                resolve({code: 1})
            } else {
                resolve({code: 0})
            }
            // utils.invokeCallback(cb, !!err?code.MYSQL_ERROR:null, result);
        })
    })
};

redisClient.expireAsync = async function (key, time) {
    return new Promise((resolve, reject) => {
        _redis.expire(key, time, function (err, result) {
            if (err) {
                resolve({code: 0})
            } else {
                resolve({code: result})
            }
            // utils.invokeCallback(cb, !!err?code.MYSQL_ERROR:null, result);
        })
    })
}

redisClient.hmgetAsync = async function (key, fields) {
    return new Promise((resole, reject) => {
        _redis.hmget(key, fields, (err, result) => {
            if (err) {
                resole({code: 1})
            } else {
                resole({code: 0, msg: result})
            }
        })
    })
}
redisClient.multiAsync = async function (multiArr) {
    return new Promise((resole, reject) => {
        _redis.multi(multiArr).exec(function (err, result) {
            if (err) {
                resole({code: 1})
            } else {
                resole({code: 0, msg: result})
            }
        })
    })
};
redisClient.existsAsync = async function (key) {
    return new Promise((resole, reject) => {

        _redis.exists(key, function (err, result) {
            if (err) {
                resole(0)
            } else {
                resole(result)
            }
        })
    })
};
redisClient.hkeysAsync = async function (key) {
    return new Promise((resole, reject) => {
        _redis.hkeys(key, function (err, result) {
            if (err) {
                resole({code: 1})
            } else {
                resole({code: 0, msg: result})
            }
        })
    })
};

module.exports = redisClient
