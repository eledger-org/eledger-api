#!/bin/bash

from=$1
to=$2

sudo mysqladmin -f -u root drop $to
sudo mysqladmin -u root create $to
sudo mysqldump -u root $from | sudo mysql -u root $to
