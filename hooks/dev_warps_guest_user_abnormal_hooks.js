let hooks = require('hooks');
let stash = {};
const slack_url = process.env.SLACK_API_KEY
const axiosBase = require('axios');
const axios = axiosBase.create({
  baseURL: 'https://dev-warps.pasch.fan', // バックエンドB のURL:port を指定する
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  responseType: 'json'
});

/*
テストコマンド
dredd ./config/guest_user_abnormal.yml https://dev-warps.pasch.fan --hookfiles="/opt/app/pasch/scripts/dredd_test/hooks/guest_user_abnormal_hooks.js"
*/



hooks.beforeEach(function (transaction) {
  hooks.log(`※異常系:url${transaction.fullPath}:${transaction.origin.actionName}テスト`)
});


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

hooks.afterEach(async function(transaction, done) {
  if (transaction.test.status === "fail"){
    const test_header = `異常系:${transaction.origin.resourceName}のテストが失敗しました`
    const api_name = transaction.origin.apiName
    const request = JSON.stringify(transaction.request, undefined, 2)
    const expected = JSON.stringify(transaction.expected, undefined, 2)
    let response = ""
    if (!transaction.real.statusCode === 500){
      response = JSON.stringify(transaction.real, undefined, 2)
    } else {
      response = JSON.stringify(transaction.real, undefined, 2).substring(0,2000)
    }

    await slack(slack_url, '#pasch-test-log', api_name, test_header, request, expected, response)
  }
  done();
});