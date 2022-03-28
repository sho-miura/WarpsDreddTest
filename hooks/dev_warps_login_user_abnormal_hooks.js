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
//     const test_header = `異常系:${transaction.origin.resourceName}のテストが失敗しました`
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

/*
テストコマンド
dredd ./config/login_user_abnormal.yml https://dev-warps.pasch.fan --hookfiles="/opt/app/pasch/scripts/dredd_test/hooks/login_user_abnormal_hooks.js"
*/

hooks.before('/api/auth/login > ログインAPI(メールアドレス) > 200 > application/json', function (transaction) {
  let requestBody = {
    email: "miuras+paschfantest01@colabmix.co.jp",
    password: "passwD1234"
  }
  transaction.request.body = JSON.stringify(requestBody);
});


hooks.after('/api/auth/login > ログインAPI(メールアドレス) > 200 > application/json', function (transaction) {
  stash['token'] = JSON.parse(transaction.real.body)['token']
});

// 認証情報を使う処理が全ての場合はこちらを使用する
hooks.beforeEach(function (transaction) {
  if(stash['token'] != undefined){
    if (transaction.expected.statusCode != "401"){
      transaction.request.headers['Authorization'] = "Bearer " + stash['token'];
      transaction.request.headers['X-Pasch-App-Key']='mOQX5LlkEyLFVdfiTb7X94EpTvzCBC52cIGrELR3IVmQfnvfxxS4uJCRtr2y'
    };
  };
});

hooks.beforeEach(function (transaction) {
  hooks.log(`※異常系:url${transaction.fullPath}:${transaction.origin.actionName}`)
});


hooks.before('/api/artist/follow/delete > アーティストフォロー解除 > 404 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/artist/follow/delete > アーティストフォロー解除 > 400 > application/json', function (transaction) {
  hooks.log('空の値の入力')
  let requestBody = {}
  transaction.request.body = JSON.stringify(requestBody);
});

hooks.before('/api/community/comment/new > ルームへのコメントの投稿 > 400 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/community/comment/new > ルームへのコメントの投稿 > 400 > application/json', function (transaction) {
  hooks.log('空の値の入力')
  let requestBody = {}
  transaction.request.body = JSON.stringify(requestBody);
});

hooks.before('/api/community/comment/delete > 投稿情報の削除 > 422 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/community/comment/delete > 投稿情報の削除 > 400 > application/json', function (transaction) {
  hooks.log('空の値の入力')
  let requestBody = {}
  transaction.request.body = JSON.stringify(requestBody);
});

hooks.before('/api/community/favorite/new > Roomのお気に入り > 404 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/community/favorite/new > Roomのお気に入り > 400 > application/json', function (transaction) {
  hooks.log('異常パラメータの入力')
  // 空白も試したが400が返ってくる
  let requestBody = {
    id: 'sdfasdfaasdf',
    params: 'sample'
  }
  transaction.request.body = JSON.stringify(requestBody);
});


hooks.before('/api/community/favorite/delete > Roomのお気に入り解除 > 404 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/community/favorite/delete > Roomのお気に入り解除 > 400 > application/json', function (transaction) {
  hooks.log('異常パラメータの入力')
  // 空白も試したが400が返ってくる
  let requestBody = {
    id: 'sdfasdfaasdf',
    params: 'sample'
  }
  transaction.request.body = JSON.stringify(requestBody);
});

hooks.before('/api/post/list > ポスト・コメント・コメントリプライ情報 > 200 > application/json', function (transaction) {
  hooks.log('空白で入力するとからの配列が返って来る')
  // 空白も試したが400が返ってくる
  let requestBody = {
  }
  transaction.request.body = JSON.stringify(requestBody);
});


hooks.before('/api/post/like/new > ポスト・コメント・コメントリプライでのいいね > 404 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/post/like/new > ポスト・コメント・コメントリプライでのいいね > 400 > application/json', function (transaction) {
  // 空白も試したが400が返ってくる
  let requestBody = {
    user_id: 2342434234,
    sample: 2342342335
  }
  transaction.request.body = JSON.stringify(requestBody);
});


hooks.before('/api/post/like/delete > ポスト・コメント・コメントリプライでのいいね解除 > 404 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/post/like/delete > ポスト・コメント・コメントリプライでのいいね解除 > 400 > application/json', function (transaction) {
  // 空白も試したが400が返ってくる
  let requestBody = {
    user_id: 2342434234,
    sample: 2342342335
  }
  transaction.request.body = JSON.stringify(requestBody);
});


hooks.before('/api/post/comment/new > ポスト・コメントでのコメント・コメントリプライ作成 > 404 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/post/comment/new > ポスト・コメントでのコメント・コメントリプライ作成 > 400 > application/json', function (transaction) {
  // 空白も試したが400が返ってくる
  let requestBody = {
    user_id: 2342434234,
    sample: 2342342335
  }
  transaction.request.body = JSON.stringify(requestBody);
});


hooks.before('/api/post/comment/delete > ポスト・コメントでのコメント・コメントリプライ削除 > 422 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/post/comment/delete > ポスト・コメントでのコメント・コメントリプライ削除 > 400 > application/json', function (transaction) {
  // 空白も試したが400が返ってくる
  let requestBody = {
    user_id: 2342434234,
    sample: 2342342335
  }
  transaction.request.body = JSON.stringify(requestBody);
});


hooks.before('/api/post/comment/delete > ポスト・コメントでのコメント・コメントリプライ削除 > 422 > application/json', function (transaction) {
  hooks.log('存在しないIDの入力')
});

hooks.before('/api/post/comment/delete > ポスト・コメントでのコメント・コメントリプライ削除 > 400 > application/json', function (transaction) {
  // 空白も試したが400が返ってくる
  let requestBody = {
    user_id: 2342434234,
    sample: 2342342335
  }
  transaction.request.body = JSON.stringify(requestBody);
});



hooks.before('/api/search > ルームや投稿への検索の実施 > 400 > application/json', function (transaction) {
  hooks.log('パラメータの値を空文字で入力')
});

hooks.before('/api/search > ルームや投稿への検索の実施 > 422 > application/json', function (transaction) {
  hooks.log('パラメータの値を空文字で入力')
  let requestBody = {
    word: "",
    country_code: ""
  }
  transaction.request.body = JSON.stringify(requestBody);
});
