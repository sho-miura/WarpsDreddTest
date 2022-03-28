#!/bin/sh

dredd ./config/dev_warps_guest_user.yml https://dev-warps.pasch.fan --hookfiles="./hooks/dev_warps_guest_user_hooks.js"
wait
dredd ./config/dev_warps_guest_user_abnormal.yml https://dev-warps.pasch.fan --hookfiles="./hooks/dev_warps_guest_user_abnormal_hooks.js"
wait
dredd ./config/dev_warps_login_user.yml https://dev-warps.pasch.fan --hookfiles="./hooks/dev_warps_login_user_hooks.js"
wait
dredd ./config/dev_warps_login_user_abnormal.yml https://dev-warps.pasch.fan --hookfiles="./hooks/dev_warps_login_user_abnormal_hooks.js"
wait
dredd ./config/dev_warps_account.yml https://dev-warps.pasch.fan --hookfiles="./hooks/dev_warps_account_hooks.js"