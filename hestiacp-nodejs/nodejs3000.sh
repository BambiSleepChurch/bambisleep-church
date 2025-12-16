#!/bin/bash
user=$1
domain=$2
ip=$3
home=$4
docroot=$5

mkdir "$home/$user/web/$domain/nodeapp"
chown -R $user:$user "$home/$user/web/$domain/nodeapp"
runuser -l $user -c "pm2 start $home/$user/web/$domain/nodeapp/app.js"
