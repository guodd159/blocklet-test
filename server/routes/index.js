const middleware = require('@blocklet/sdk/lib/middlewares');
const router = require('express').Router();
const _ = require('underscore');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
var redisCl = require('../config/redis');
router.use('/user', middleware.user(), (req, res) => res.json(req.user));

async function fetch_url(redis_key, a, ps, p) {
    let arr = []
    let url = `https://etherscan.io/txs?a=${a}&ps=${ps}&p=${p}`
    // let url = 'http://localhost:63342/Project_bantu/getInfo_00.html?_ijt=mfn5hvoodujg1j47mid3v2fidj&_ij_reload=RELOAD_ON_SAVE'//'http://localhost:63342/Project_bantu/getInfo.html?_ijt=4jhe4k8bvoc4aupbuf3qh35ghg&_ij_reload=RELOAD_ON_SAVE'
    let str = await fetch(url, {method: 'GET'})
    let htmlStr = await str.text()
    let $ = cheerio.load(htmlStr)
    $('table tr').each(function () {
        // let row = [];
        // if ($(this).find('th').length > 0) {
        //     let i = 0
        //     $(this).find('th').each(function () {
        //         if (i != 0 && i != 6) {
        //             row.push($(this).text().replaceAll('\n', ''));
        //         }
        //         i++
        //     });
        // }
        let j = 0
        let row_obj = {}
        let field = ''
        let is_exist = false
        $(this).find('td').each(function () {
            // if (j != 0 && j != 4 && j != 7 && j != 11) {
            //     row.push($(this).text());
            // }
            switch (j) {
                case 0:
                    field = ''
                    break
                case 1:
                    field = 'Txn Hash'
                    break
                case 2:
                    field = 'Method'
                    break
                case 3:
                    field = 'Block'
                    break
                case 4:
                    field = ''
                    break
                case 5:
                    field = 'Age'
                    break
                case 6:
                    field = 'From'
                    break
                case 7:
                    field = ''
                    break
                case 8:
                    field = 'To'
                    break
                case 9:
                    field = 'Value'
                    break
                case 10:
                    field = 'Txn Fee'
                    break
                case 11:
                    field = ''
                    break
                default:
                    field = ''
                    break
            }
            if (field) {
                is_exist = true
                row_obj[field] = $(this).text()
            }
            j++
        });
        if (is_exist == true) {
            arr.push(row_obj);
        }

    });
    let redis_obj = {}
    for (let itm of arr) {
        redis_obj[itm['Txn Hash']] = JSON.stringify(itm)
    }
    await redisCl.hmsetAsync(redis_key, redis_obj)
    return arr
    redisCl.expireAsync(redis_key, 10 * 60)
}

router.use('/txs', async (req, res) => {
    try {
        // a 用户地址
        // ps 一次返回记录（10，25,50,100）
        //p 第几页
        let {a, ps, p} = req.query
        ps = ps ? ps : 50
        p = p ? p : 1
        if (!_.isString(a) || !_.isNumber(ps) || !_.isNumber(p)) {
            return res.json({
                code: 1001,
                msg: 'parameter error'
            })
        }
        let redis_key = `user:${a}`
        let cache_exists = await redisCl.existsAsync(redis_key)
        let arr = [];
        if (!cache_exists) {
            arr = await fetch_url(redis_key, a, ps, p)
        } else {
            let redis_fields = await redisCl.hkeysAsync(redis_key)
            let redis_val_arr_str = [], redis_val_arr_json = []
            if ((redis_fields.code == 0) && redis_fields.msg && redis_fields.msg.length) {
                let fields = redis_fields.msg.slice((p - 1) * ps, p * ps)
                if (fields.length) {
                    redis_val_arr_str = await redisCl.hmgetAsync(redis_key, fields)
                    redis_val_arr_json = redis_val_arr_str.map(itm => JSON.parse(itm))
                    arr = redis_val_arr_json
                } else {
                    arr = await fetch_url(redis_key, a, ps, p)
                }
            } else {
                arr = await fetch_url(redis_key, a, ps, p)
            }
        }
        // console.log(arr)
        res.json({
            code: 1000,
            msg: "success",
            data: {
                trade_record: arr
            }
        })
    } catch (e) {
        console.log(e)
        res.json({
            code: 1002,
            msg: 'server error'
        })
    }
})
module.exports = router;
