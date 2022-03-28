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
dredd ./config/login_user.yml https://dev-warps.pasch.fan --hookfiles="/opt/app/pasch/scripts/dredd_test/hooks/login_user_hooks.js"

transctionを見る
  ./api.yml https://dev-warps.pasch.fan --hookfiles="./hooks_swagger.js"

  既に用意されているユーザー
    email: miuras+paschfantest01@colabmix.co.jp
    password: passwD1234
  このユーザーでログインしテストを進める
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
hooks.beforeEach(async function(transaction, done) {
  if(stash['token'] != undefined){
    if (transaction.expected.statusCode != "401"){
      transaction.request.headers['Authorization'] = "Bearer " + stash['token'];
      transaction.request.headers['X-Pasch-App-Key']='mOQX5LlkEyLFVdfiTb7X94EpTvzCBC52cIGrELR3IVmQfnvfxxS4uJCRtr2y'
    };
  };
  done();
});




hooks.before('/api/account/me > マイアカウント情報取得 > 200 > application/json', function (transaction) {
  transaction.expected.body = JSON.stringify({
    "user": {
      "id": 15,
      "pasch_id": 523,
      "name": "miuras+warpstest010",
      "email": "miuras+paschfantest01@colabmix.co.jp",
      "country_code": 1,
      "user_type": 1,
      "bio": "",
      "last_login_at": "2022-01-31T05:01:30Z",
      "created_this_app": true,
      "daily_mission_access_at": "2022-02-04T01:06:22.438124Z",
      "deleted_at": null
    },
    "pasch_user": {
      "id": 523,
      "nickname": "miuras+warpstest010",
      "email": "miuras+paschfantest01@colabmix.co.jp",
      "email_verified_at": "2022-01-24 10:58:11",
      "country_code": "JPN",
      "prefecture_code": 13,
      "gender": 1,
      "birth_on": "1976-01-01T00:00:00+09:00",
      "login_failed_count": 0,
      "last_login_at": "2022-02-04 11:07:28",
      "check_push_notifications_at": null,
      "deleted_at": null,
      "created_at": "2022-01-24T10:58:12+09:00",
      "updated_at": "2022-02-04T11:07:28+09:00",
      "has_password": true,
      "apple_user": null,
      "awa_user": null,
      "facebook_user": null,
      "google_user": null,
      "twitter_user": null
    },
    "pasch_point_total": 35
  })
});


hooks.before('/api/account/other > アカウント情報取得 > 200 > application/json', async function (transaction, done) {
  done();
});

hooks.before('/api/artist/artists > アーティスト一覧取得 > 200 > application/json', async function (transaction, done) {
  done();
});

hooks.before('/api/artist/follow/new > アーティストフォロー（メンバー、チーム、グループ共通） > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "artist_type": 0,
    "country_code": "ja",
    "count": 100,
    "page": 1
  }
  await axios.post('/api/artist/artists', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      artist_list = response.data.artists
      const artist = artist_list.find((v) => v.id === body.artist_id);
      stash['follower_count'] = artist.follower_count
    })
  done();
});

hooks.after('/api/artist/follow/new > アーティストフォロー（メンバー、チーム、グループ共通） > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "artist_type": 0,
    "country_code": "ja",
    "count": 100,
    "page": 1
  }
  await axios.post('/api/artist/artists', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      artist_list = response.data.artists
      const artist = artist_list.find((v) => v.id === body.artist_id);
      if (stash['follower_count'] > artist.follower_count){
        transaction.fail = 'フォロー後にフォロワー数が増加していません'
      }
    })
  done();
});

hooks.before('/api/artist/follow/delete > アーティストフォロー解除 > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "artist_type": 0,
    "country_code": "ja",
    "count": 100,
    "page": 1
  }
  await axios.post('/api/artist/artists', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      artist_list = response.data.artists
      const artist = artist_list.find((v) => v.id === body.artist_id);
      stash['follower_count'] = artist.follower_count
    })
  done();
});
hooks.after('/api/artist/follow/delete > アーティストフォロー解除 > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "artist_type": 0,
    "country_code": "ja",
    "count": 100,
    "page": 1
  }
  await axios.post('/api/artist/artists', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      artist_list = response.data.artists
      const artist = artist_list.find((v) => v.id === body.artist_id);
      if (stash['follower_count'] < artist.follower_count){
        transaction.fail = 'フォロー後にフォロワー数が減少していません'
      }
    })
  done();
});


hooks.before('/api/community/rooms > 部屋一覧取得 > 200 > application/json', async function (transaction, done) {
  done();
});

hooks.before('/api/community/comments > ルームのコメント情報取得 > 200 > application/json', async function (transaction, done) {
  done();
});


hooks.before('/api/community/comment/new > ルームへのコメントの投稿 > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "country_code": "ja",
    "count": 100,
    "page": 1,
    "favorite_only": 0
  }
  await axios.post('/api/community/rooms', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      room_list = response.data.rooms
      const room = room_list.find((v) => v.id === body.id);
      stash['room_comment_count'] = room.comment_count
    })
    .catch(function (response) {
    })
  done();
});

hooks.after('/api/community/comment/new > ルームへのコメントの投稿 > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "country_code": "ja",
    "count": 100,
    "page": 1,
    "favorite_only": 0
  }
  await axios.post('/api/community/rooms', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      room_list = response.data.rooms
      const room = room_list.find((v) => v.id === body.id);
      stash['room_id'] = room.id
      if (stash['room_comment_count'] > room.comment_count ){
        transaction.fail = 'ルームへのコメント後にコメント数が増加していません'
      }
    })
  done();
});

hooks.before('/api/community/comment/delete > 投稿情報の削除 > 200 > application/json', async function (transaction, done) {
  let requestBody = {
    "id": stash['room_id'],
    "count": 100,
    "page": 1,
    "country_code": "ja",
    "reply_language_type": 2
  }
  await axios.post('/api/community/comments', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      room_comments = response.data.room_comments
      let my_comment = room_comments[0]
      stash['my_room_comment_id']= my_comment.id
    })
    .catch(function (response) {
      hooks.log('catch')
    })
  requestBody = {
    "id": stash['my_room_comment_id']
  }
  transaction.request.body = JSON.stringify(requestBody);
  done();
});



hooks.before('/api/community/favorite/new > Roomのお気に入り > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "country_code": "ja",
    "count": 100,
    "page": 1,
    "favorite_only": 0
  }
  await axios.post('/api/community/rooms', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      room_list = response.data.rooms
      const room = room_list.find((v) => v.id === body.id);
      stash['room_favorite_count'] = room.favorite_count
    })
  done();
});

hooks.after('/api/community/favorite/new > Roomのお気に入り > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "country_code": "ja",
    "count": 100,
    "page": 1,
    "favorite_only": 0
  }
  await axios.post('/api/community/rooms', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      room_list = response.data.rooms
      const room = room_list.find((v) => v.id === body.id);
      if (stash['room_favorite_count'] > room.favorite_count ){
        transaction.fail = 'ルームへのお気に入り後にお気に入り数が増加していません'
      }
    })
  done();
});



hooks.before('/api/community/favorite/delete > Roomのお気に入り解除 > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "country_code": "ja",
    "count": 100,
    "page": 1,
    "favorite_only": 0
  }
  await axios.post('/api/community/rooms', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      room_list = response.data.rooms
      const room = room_list.find((v) => v.id === body.id);
      stash['room_favorite_count'] = room.favorite_count
    })
  done();
});

hooks.after('/api/community/favorite/delete > Roomのお気に入り解除 > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "country_code": "ja",
    "count": 100,
    "page": 1,
    "favorite_only": 0
  }
  await axios.post('/api/community/rooms', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      room_list = response.data.rooms
      const room = room_list.find((v) => v.id === body.id);
      if (stash['room_favorite_count'] < room.favorite_count ){
        transaction.fail = 'ルームへのお気に入り後にお気に入り数が減少していません'
      }
    })
  done();
});




hooks.before('/api/post/list > ポスト・コメント・コメントリプライ情報 > 200 > application/json', async function (transaction, done) {
  done();
});
hooks.after('/api/post/list > ポスト・コメント・コメントリプライ情報 > 200 > application/json', async function (transaction, done) {
  done();
});


hooks.before('/api/post/like/new > ポスト・コメント・コメントリプライでのいいね > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "data_type": 0,
    "post_type": 0,
    "order": 1,
    "count": 200,
    "page": 1,
    "follow_only": 0
  }
  await axios.post('/api/post/list', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      post_list = response.data.posts
      const post = post_list.find((v) => v.id === body.id);
      stash['post_like_count'] = post.like_count
    })
  done();
});

hooks.after('/api/post/like/new > ポスト・コメント・コメントリプライでのいいね > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "data_type": 0,
    "post_type": 0,
    "order": 1,
    "count": 200,
    "page": 1,
    "follow_only": 0
  }
  await axios.post('/api/post/list', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      post_list = response.data.posts
      const post = post_list.find((v) => v.id === body.id);
      if (stash['post_like_count'] > post.like_count ){
        transaction.fail = '投稿へのいいね後にいいね数が増加していません'
      }
    })
  done();
});


hooks.before('/api/post/like/delete > ポスト・コメント・コメントリプライでのいいね解除 > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "data_type": 0,
    "post_type": 0,
    "order": 1,
    "count": 200,
    "page": 1,
    "follow_only": 0
  }
  await axios.post('/api/post/list', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      post_list = response.data.posts
      const post = post_list.find((v) => v.id === body.id);
      stash['post_like_count'] = post.like_count
    })
  done();
});

hooks.after('/api/post/like/delete > ポスト・コメント・コメントリプライでのいいね解除 > 200 > application/json', async function (transaction, done) {
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "data_type": 0,
    "post_type": 0,
    "order": 1,
    "count": 200,
    "page": 1,
    "follow_only": 0
  }
  await axios.post('/api/post/list', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      post_list = response.data.posts
      const post = post_list.find((v) => v.id === body.id);
      if (stash['post_like_count'] < post.like_count ){
        transaction.fail = '投稿へのいいね後にいいね数が増加していません'
      }
    })
  done();
});



hooks.before('/api/post/comment/new > ポスト・コメントでのコメント・コメントリプライ作成 > 200 > application/json', async function (transaction, done) {
  // post.id=4に対してコメントする。

  let requestBody = {
    "id": 4,
    "data_type": 0,
    "comment": "this is a post_comment",
    "country_code": "ja"
  }
  await axios.post('/api/post/comment/new', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
    })
    .catch(function (response) {
      transaction.fail = 'ポストに対してコメントできませんでした'
    })

  requestBody = {
    "data_type": 1,
    "parent_id": 4,
    "order": 0,
    "country_code": "ja",
    "count": 200,
    "page": 1,
    "follow_only": 0
  }
  await axios.post('/api/post/list', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then((res) => {
        post_comments = res.data.comments;
        post_comment= post_comments[0]
        stash['my_post_comment_id'] = post_comment.id
      })
    .catch((res) => {
      hooks.log('catch')
    })

  requestBody = {
    "id": stash['my_post_comment_id'],
    "data_type": 1,
    "comment": "this is a comment_reply",
    "country_code": "ja"
  }
  transaction.request.body = JSON.stringify(requestBody);

  done();
});

hooks.after('/api/post/comment/new > ポスト・コメントでのコメント・コメントリプライ作成 > 200 > application/json', async function (transaction, done) {
  let requestBody = {
    "data_type": 2,
    "parent_id": stash['my_post_comment_id'],
    "order": 0,
    "count": 200,
    "page": 1,
    "follow_only": 0,
    "country_code": "ja"
  }
  await axios.post('/api/post/list', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (res) {
      replies = res.data.replies;
      if (!Object.keys(replies).length) {
        transaction.fail = 'ポストコメントに対してリプライができませんでした。'
      }
    })


  done();
});



hooks.before('/api/post/comment/delete > ポスト・コメントでのコメント・コメントリプライ削除 > 200 > application/json', async function (transaction, done) {
  let requestBody = {
    "id": stash['my_post_comment_id'],
    "data_type": 1,
  }
  transaction.request.body = JSON.stringify(requestBody);
  let post_id = 4

  request = {
    "data_type": 0,
    "post_type": 0,
    "order": 1,
    "count": 200,
    "page": 1,
    "follow_only": 0
  }
  await axios.post('/api/post/list', request, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      post_list = response.data.posts
      const post = post_list.find((v) => v.id === post_id);
      stash['post_comment_count'] = post.comment_count
    })
  done();
});

hooks.after('/api/post/comment/delete > ポスト・コメントでのコメント・コメントリプライ削除 > 200 > application/json', async function (transaction, done) {
  let post_id = 4
  let body = JSON.parse(transaction.request.body)

  let requestBody = {
    "data_type": 0,
    "post_type": 0,
    "order": 1,
    "count": 200,
    "page": 1,
    "follow_only": 0
  }
  await axios.post('/api/post/list', requestBody, {headers:{'Authorization' : "Bearer " + stash['token']}})
    .then(function (response) {
      post_list = response.data.posts
      const post = post_list.find((v) => v.id === post_id);
      if (stash['post_comment_count'] < post.comment_count ){
        transaction.fail = 'コメント削除後にコメント数が減少していません'
      }
    })
  done();
});


hooks.before('/api/auth/logout > ログアウトAPI(メールアドレス) > 200 > application/json', async function (transaction, done) {
  let requestBody = ""
  await axios.post('/api/account/me',requestBody,{headers:{'Authorization' : "Bearer " + stash['token']}})
  .then(function (res) {
  })
  .catch(function (res) {
  })
  done();
});

hooks.after('/api/auth/logout > ログアウトAPI(メールアドレス) > 200 > application/json', async function (transaction, done) {
  let requestBody = ""
  await axios.post('/api/account/me', requestBody,{headers:{'Authorization' : "Bearer " + stash['token']}})
  .then(function (res) {
    transaction.fail = 'ログアウトできませんでした。'
  })
  .catch(function (res) {
  })
  done();
});