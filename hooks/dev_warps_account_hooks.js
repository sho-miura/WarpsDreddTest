let hooks = require('hooks');
let stash = {};
const slack_url = process.env.SLACK_API_KEY
const axiosBase = require('axios');
const axios = axiosBase.create({
  baseURL: 'https://dev-warps.pasch.fan',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  responseType: 'json'
});

/*
テストコマンド
dredd ./config/account.yml https://dev-warps.pasch.fan --hookfiles="/opt/app/pasch/scripts/dredd_test/hooks/account_hooks.js"
miuras+warpstest028
*/


const slack = async (path, channel, username, test_header, request, expected, response) => {
  const data = {
    "channel": channel,
    "username": username,
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": test_header,
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `リクエスト\n${request}`,
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `期待値\n${expected}`,
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `レスポンス\n${response}`,
          "emoji": true
        }
      },
    ],
    "icon_emoji": ':memo:'
  }

  const param = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    }
  }

  try {
    const res = await axios.post(path, data, param)
    hooks.log(res.data)
  } catch (err) {
    hooks.log(err)
  }
}

// hooks.afterEach(async function(transaction, done) {
//   if (transaction.test.status === "fail"){
//     const test_header = `正常系:${transaction.origin.resourceName}のテストが失敗しました`
//     const api_name = transaction.origin.apiName
//     const request = JSON.stringify(transaction.request, undefined, 2)
//     const expected = JSON.stringify(transaction.expected, undefined, 2)
//     let response = ""
//     if (!transaction.real.statusCode === 500){
//       response = JSON.stringify(transaction.real, undefined, 2)
//     } else {
//       response = JSON.stringify(transaction.real, undefined, 2).substring(0,2000)
//     }

//     await slack(slack_url, '#pasch-test-log', api_name, test_header, request, expected, response)
//   }
//   done();
// });


hooks.beforeEach(function (transaction) {
  hooks.log(`${transaction.origin.actionName}のテスト`)
});

hooks.before("/api/auth/mail > 仮登録・認証コード発行 > 200 > application/json", function (transaction) {
  const timestamp = new Date().getTime()
  const email_add_timestamp = `miuras+${timestamp}@colabmix.co.jp`
  // const email_add_timestamp = `miuras+updatetest01@colabmix.co.jp`
  let requestBody = {
    email: email_add_timestamp,
    password: "passwD1234"
  }
  transaction.request.body = JSON.stringify(requestBody);
});

hooks.after("/api/auth/mail > 仮登録・認証コード発行 > 200 > application/json", function (transaction) {
  let request = JSON.parse(transaction.request.body);
  let real = transaction.real.body;
  let result = real.indexOf( 'values' )
  let values = real.substr( result )
  let values_ary = values.split(',')
  let authentication_code = values_ary[3].replace('\d{4,10}/g','')
  authentication_code = authentication_code.replace(/\s+/g, '')
  authentication_code = authentication_code.substring(1, 7)
  // hooks.log(real)
  // hooks.log(authentication_code)
  stash['authentication_code'] = authentication_code
  stash['email'] = request.email
  stash['password'] = request.password
  // hooks.log(stash['authentication_code'])
  // hooks.log('aftermail')
});


hooks.before("/api/auth/mail/verify > 認証コード確認 > 200 > application/json", function (transaction) {
  transaction.request.headers['X-Pasch-App-Key']='mOQX5LlkEyLFVdfiTb7X94EpTvzCBC52cIGrELR3IVmQfnvfxxS4uJCRtr2y'
  // hooks.log('beforeverify')
  // hooks.log(stash['authentication_code'])
  // hooks.log(stash['email'])
  let requestBody = {
    email: stash['email'],
    certCode: stash['authentication_code']
  }
  transaction.request.body = JSON.stringify(requestBody);
});


hooks.before("/api/auth/mail/register > 本登録(メールアドレス) > 200 > application/json", function (transaction) {
  transaction.request.headers['X-Pasch-App-Key']='mOQX5LlkEyLFVdfiTb7X94EpTvzCBC52cIGrELR3IVmQfnvfxxS4uJCRtr2y'
  let requestBody = {
    email: stash['email'],
    nickname: "testuser",
    birth_on: "2002-01-01",
    gender: 1,
    country_code: "JPN",
    prefecture_code: 1
  }
  transaction.request.body = JSON.stringify(requestBody);
});
hooks.after("/api/auth/mail/register > 本登録(メールアドレス) > 200 > application/json", function (transaction) {
  stash['token'] = JSON.parse(transaction.real.body)['token']
});


hooks.before('/api/account/me > マイアカウント情報取得 > 200 > application/json', function (transaction) {
  if(stash['token'] != undefined){
    if (transaction.expected.statusCode != "401"){
      transaction.request.headers['Authorization'] = "Bearer " + stash['token'];
      transaction.request.headers['X-Pasch-App-Key']='mOQX5LlkEyLFVdfiTb7X94EpTvzCBC52cIGrELR3IVmQfnvfxxS4uJCRtr2y'
    };
  };
  // データ構造の定義
  transaction.expected.body = JSON.stringify({
    "user": {
      "id": 15,
      "pasch_id": 598,
      "name": "testuser",
      "email": "miuras+1643937516942@colabmix.co.jp",
      "country_code": 1,
      "user_type": 1,
      "bio": null,
      "last_login_at": null,
      "created_this_app": true,
      "daily_mission_access_at": null,
      "deleted_at": null
    },
    "pasch_user": {
      "id": 598,
      "nickname": "testuser",
      "email": "miuras+1643937516942@colabmix.co.jp",
      "email_verified_at": "2022-02-04 10:18:26",
      "country_code": "JPN",
      "prefecture_code": 1,
      "gender": 1,
      "birth_on": "2002-01-01T00:00:00+09:00",
      "login_failed_count": 0,
      "last_login_at": null,
      "check_push_notifications_at": null,
      "deleted_at": null,
      "created_at": "2022-02-04T10:18:26+09:00",
      "updated_at": "2022-02-04T10:18:26+09:00",
      "has_password": true,
      "apple_user": null,
      "awa_user": null,
      "facebook_user": null,
      "google_user": null,
      "twitter_user": null
    },
    "pasch_point_total": 0
  })
});